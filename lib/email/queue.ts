import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isAfterCrmStart } from '@/lib/email/config'
import { upsertContact } from '@/lib/email/contacts'

const HOUR = 3_600_000
const DAY = 24 * HOUR

const plus = (base: Date, ms: number) => new Date(base.getTime() + ms)

// Fire-and-forget so a CRM failure never delays or breaks a payment/report response.
export function runInBackground(label: string, task: () => Promise<unknown>) {
  const safe = () =>
    task().catch((e) => console.error(`[v0] crm: ${label} failed:`, e instanceof Error ? e.message : 'unknown'))
  try {
    after(safe)
  } catch {
    void safe()
  }
}

interface EnqueueOptions {
  status?: 'scheduled' | 'skipped'
  skipReason?: string
}

// Duplicates are ignored by the unique index email_sends_dedupe (contact, template, ref).
export async function enqueue(
  contactId: string,
  templateKey: string,
  refId: string | null,
  scheduledAt: Date,
  category: 'marketing' | 'transactional' = 'marketing',
  options: EnqueueOptions = {},
): Promise<boolean> {
  try {
    const { error } = await createAdminClient()
      .from('email_sends')
      .insert({
        contact_id: contactId,
        template_key: templateKey,
        ref_id: refId,
        category,
        scheduled_at: scheduledAt.toISOString(),
        status: options.status ?? 'scheduled',
        skip_reason: options.skipReason ?? null,
      })
    if (error) {
      if (error.code === '23505') return false
      console.error('[v0] crm: enqueue failed', templateKey, error.code, error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('[v0] crm: enqueue error:', e instanceof Error ? e.message : 'unknown')
    return false
  }
}

async function contactForSubmission(submissionId: string) {
  const admin = createAdminClient()
  const { data: submission } = await admin
    .from('submissions')
    .select('id, name, email, created_at')
    .eq('id', submissionId)
    .maybeSingle()
  if (!submission?.email) return null
  const contact = await upsertContact({
    email: submission.email as string,
    name: submission.name as string | null,
    submissionId: submission.id as string,
  })
  return contact ? { contact, submission } : null
}

// A2 (+1 day) and A3 (+3 days) after a free report. A4 is added in the coupon phase.
export async function enqueueFreeReportSequence(submissionId: string): Promise<void> {
  try {
    const found = await contactForSubmission(submissionId)
    if (!found || !isAfterCrmStart(found.submission.created_at as string)) return
    const base = new Date(found.submission.created_at as string)
    await enqueue(found.contact.id, 'A2', submissionId, plus(base, 1 * DAY))
    await enqueue(found.contact.id, 'A3', submissionId, plus(base, 3 * DAY))
  } catch (e) {
    console.error('[v0] crm: enqueueFreeReportSequence error:', e instanceof Error ? e.message : 'unknown')
  }
}

const ABANDON_SUPPRESS_WINDOW_MS = 7 * DAY

// B1 (+30 min, payment help) and B2 (+24h) after a 99 Facts order is created. Only one abandon sequence per contact per week, so
// retrying checkout several times does not send the same reminder repeatedly.
export async function enqueueCheckoutAbandon(paymentId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: payment } = await admin
      .from('payments')
      .select('id, submission_id, created_at')
      .eq('id', paymentId)
      .maybeSingle()
    if (!payment || !isAfterCrmStart(payment.created_at as string)) return

    const found = await contactForSubmission(payment.submission_id as string)
    if (!found) return

    const base = new Date(payment.created_at as string)
    const { data: recent } = await admin
      .from('email_sends')
      .select('id')
      .eq('contact_id', found.contact.id)
      .eq('template_key', 'B1')
      .neq('ref_id', paymentId)
      .gte('created_at', new Date(Date.now() - ABANDON_SUPPRESS_WINDOW_MS).toISOString())
      .limit(1)
    const suppressed = Boolean(recent && recent.length > 0)
    const options: EnqueueOptions = suppressed ? { status: 'skipped', skipReason: 'duplicate-abandon' } : {}

    await enqueue(found.contact.id, 'B1', paymentId, plus(base, 30 * 60_000), 'marketing', options)
    await enqueue(found.contact.id, 'B2', paymentId, plus(base, 24 * HOUR), 'marketing', options)
  } catch (e) {
    console.error('[v0] crm: enqueueCheckoutAbandon error:', e instanceof Error ? e.message : 'unknown')
  }
}

// create-order only has the PayPal order id right after the insert; resolve the payment row from it.
export async function enqueueCheckoutAbandonByOrder(paypalOrderId: string): Promise<void> {
  try {
    const { data } = await createAdminClient()
      .from('payments')
      .select('id')
      .eq('paypal_order_id', paypalOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.id) await enqueueCheckoutAbandon(data.id as string)
  } catch (e) {
    console.error('[v0] crm: enqueueCheckoutAbandonByOrder error:', e instanceof Error ? e.message : 'unknown')
  }
}

// C3 (+5 days) and C4 (+7 days) after a completed 99 Facts payment.
export async function enqueuePostPurchase(paymentId: string): Promise<void> {
  try {
    const { data: payment } = await createAdminClient()
      .from('payments')
      .select('id, submission_id, status, created_at, completed_at')
      .eq('id', paymentId)
      .maybeSingle()
    if (!payment || payment.status !== 'completed') return
    const eventAt = (payment.completed_at ?? payment.created_at) as string
    if (!isAfterCrmStart(eventAt)) return

    const found = await contactForSubmission(payment.submission_id as string)
    if (!found) return

    const base = new Date(eventAt)
    await enqueue(found.contact.id, 'C3', paymentId, plus(base, 5 * DAY))
    await enqueue(found.contact.id, 'C4', paymentId, plus(base, 7 * DAY))
  } catch (e) {
    console.error('[v0] crm: enqueuePostPurchase error:', e instanceof Error ? e.message : 'unknown')
  }
}

// C2 = 3 hours before the buyer offer expires. Not queued if that moment has already passed.
export async function enqueueCompatDeadline(buyerOfferId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: offer } = await admin
      .from('buyer_offers')
      .select('id, payment_id, first_seen_at, expires_at')
      .eq('id', buyerOfferId)
      .maybeSingle()
    if (!offer || !isAfterCrmStart(offer.first_seen_at as string)) return

    const sendAt = plus(new Date(offer.expires_at as string), -3 * HOUR)
    if (sendAt.getTime() <= Date.now()) return

    const { data: payment } = await admin
      .from('payments')
      .select('submission_id')
      .eq('id', offer.payment_id)
      .maybeSingle()
    if (!payment?.submission_id) return

    const found = await contactForSubmission(payment.submission_id as string)
    if (!found) return

    await enqueue(found.contact.id, 'C2', buyerOfferId, sendAt)
  } catch (e) {
    console.error('[v0] crm: enqueueCompatDeadline error:', e instanceof Error ? e.message : 'unknown')
  }
}
