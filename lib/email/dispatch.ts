import { createAdminClient } from '@/lib/supabase/server'
import {
  BACKFILL_MAX_PER_RUN,
  BACKFILL_WINDOW_DAYS,
  CRM_START_AT,
  DISPATCH_BATCH_SIZE,
  DISPATCH_SEND_GAP_MS,
  MAX_SEND_ATTEMPTS,
  SENDING_CLAIM_TIMEOUT_MS,
  getDailyMarketingCap,
} from '@/lib/email/config'
import {
  enqueueCheckoutAbandon,
  enqueueCompatDeadline,
  enqueueFreeReportSequence,
  enqueuePostPurchase,
} from '@/lib/email/queue'
import { sendCrmEmail } from '@/lib/email/send'
import { shouldSkip } from '@/lib/email/should-skip'
import { emailTemplates, registeredTemplateKeys } from '@/lib/email/templates'
import { CONTACT_COLUMNS, type EmailContact, type EmailSend } from '@/lib/email/types'

export interface DispatchSummary {
  sent: number
  skipped: number
  failed: number
  deferred: number
  backfilled: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const SEND_COLUMNS = 'id, contact_id, template_key, ref_id, category, scheduled_at, attempts, status'

// sent_at doubles as the claim timestamp while a row is 'sending' (the schema has no separate claimed_at column).
async function releaseStuckClaims(admin: ReturnType<typeof createAdminClient>) {
  const cutoff = new Date(Date.now() - SENDING_CLAIM_TIMEOUT_MS).toISOString()
  const { error } = await admin
    .from('email_sends')
    .update({ status: 'scheduled', sent_at: null })
    .eq('status', 'sending')
    .lt('sent_at', cutoff)
  if (error) console.error('[v0] email dispatch: release stuck claims failed', error.message)
}

async function marketingSentLast24h(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString()
  const { count, error } = await admin
    .from('email_sends')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .eq('category', 'marketing')
    .gte('sent_at', since)
  if (error) {
    console.error('[v0] email dispatch: daily cap lookup failed', error.message)
    return Number.POSITIVE_INFINITY
  }
  return count ?? 0
}

async function backfill(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const windowStart = new Date(Date.now() - BACKFILL_WINDOW_DAYS * 24 * 3_600_000).toISOString()
  const since = windowStart > CRM_START_AT ? windowStart : CRM_START_AT
  let remaining = BACKFILL_MAX_PER_RUN
  let enqueued = 0

  // Returns ids of the candidates that have no email_sends row yet for the given template.
  const missing = async (candidateIds: string[], templateKey: string) => {
    if (candidateIds.length === 0) return [] as string[]
    const { data } = await admin
      .from('email_sends')
      .select('ref_id')
      .eq('template_key', templateKey)
      .in('ref_id', candidateIds)
    const present = new Set((data ?? []).map((row) => row.ref_id as string))
    return candidateIds.filter((id) => !present.has(id))
  }

  const runBatch = async (ids: string[], templateKey: string, enqueueFn: (id: string) => Promise<void>) => {
    for (const id of (await missing(ids, templateKey)).slice(0, remaining)) {
      await enqueueFn(id)
      remaining -= 1
      enqueued += 1
    }
  }

  try {
    const [submissions, payments, offers] = await Promise.all([
      admin.from('submissions').select('id').gte('created_at', since).order('created_at', { ascending: false }).limit(200),
      admin
        .from('payments')
        .select('id, status')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(200),
      admin
        .from('buyer_offers')
        .select('id')
        .gte('first_seen_at', since)
        .order('first_seen_at', { ascending: false })
        .limit(200),
    ])

    const submissionIds = (submissions.data ?? []).map((row) => row.id as string)
    const paymentRows = payments.data ?? []

    if (remaining > 0) await runBatch(submissionIds, 'A2', enqueueFreeReportSequence)
    if (remaining > 0) {
      await runBatch(
        paymentRows.map((row) => row.id as string),
        'B1',
        enqueueCheckoutAbandon,
      )
    }
    if (remaining > 0) {
      await runBatch(
        paymentRows.filter((row) => row.status === 'completed').map((row) => row.id as string),
        'C3',
        enqueuePostPurchase,
      )
    }
    if (remaining > 0) {
      await runBatch(
        (offers.data ?? []).map((row) => row.id as string),
        'C2',
        enqueueCompatDeadline,
      )
    }
  } catch (e) {
    console.error('[v0] email dispatch: backfill error:', e instanceof Error ? e.message : 'unknown')
  }
  return enqueued
}

export async function runEmailDispatch(): Promise<DispatchSummary> {
  const summary: DispatchSummary = { sent: 0, skipped: 0, failed: 0, deferred: 0, backfilled: 0 }
  const admin = createAdminClient()

  try {
    await releaseStuckClaims(admin)

    const cap = getDailyMarketingCap()
    const alreadySent = await marketingSentLast24h(admin)
    let marketingRemaining = Math.max(0, cap - alreadySent)

    let dueQuery = admin
      .from('email_sends')
      .select(SEND_COLUMNS)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .in('template_key', registeredTemplateKeys())
      .order('scheduled_at', { ascending: true })
      .limit(DISPATCH_BATCH_SIZE)
    // When the daily cap is used up, marketing rows stay queued and must not starve transactional ones.
    if (marketingRemaining === 0) dueQuery = dueQuery.neq('category', 'marketing')

    const { data: dueRows, error: dueError } = await dueQuery
    if (dueError) console.error('[v0] email dispatch: due query failed', dueError.message)
    const due = (dueRows ?? []) as EmailSend[]

    const contactIds = [...new Set(due.map((row) => row.contact_id))]
    const contactsById = new Map<string, EmailContact>()
    if (contactIds.length > 0) {
      const { data: contacts } = await admin.from('email_contacts').select(CONTACT_COLUMNS).in('id', contactIds)
      for (const contact of (contacts ?? []) as EmailContact[]) contactsById.set(contact.id, contact)
    }

    for (const send of due) {
      const contact = contactsById.get(send.contact_id)
      if (!contact) continue

      if (send.category === 'marketing' && marketingRemaining <= 0) {
        summary.deferred += 1
        continue
      }

      const claimed = await admin
        .from('email_sends')
        .update({ status: 'sending', sent_at: new Date().toISOString() })
        .eq('id', send.id)
        .eq('status', 'scheduled')
        .select('id')
      if (claimed.error || !claimed.data || claimed.data.length === 0) continue

      const release = (patch: Record<string, unknown>) =>
        admin.from('email_sends').update(patch).eq('id', send.id)

      try {
        const skipReason = await shouldSkip(send, contact)
        if (skipReason) {
          await release({ status: 'skipped', skip_reason: skipReason, sent_at: null })
          summary.skipped += 1
          continue
        }

        const render = emailTemplates[send.template_key]
        const rendered = await render({ contact, send })
        const result = await sendCrmEmail({
          to: contact.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          category: send.category,
          unsubscribeToken: contact.unsubscribe_token,
        })

        if (result.status === 'sent') {
          await release({
            status: 'sent',
            sent_at: new Date().toISOString(),
            resend_id: result.resendId,
            error: null,
          })
          summary.sent += 1
          if (send.category === 'marketing') marketingRemaining -= 1
          await sleep(DISPATCH_SEND_GAP_MS)
        } else if (result.status === 'not-configured') {
          await release({ status: 'scheduled', sent_at: null })
          summary.deferred += 1
        } else {
          throw new Error(result.error)
        }
      } catch (e) {
        const attempts = send.attempts + 1
        await release({
          status: attempts >= MAX_SEND_ATTEMPTS ? 'failed' : 'scheduled',
          attempts,
          error: (e instanceof Error ? e.message : 'unknown').slice(0, 300),
          sent_at: null,
        })
        summary.failed += 1
        await sleep(DISPATCH_SEND_GAP_MS)
      }
    }

    summary.backfilled = await backfill(admin)
  } catch (e) {
    console.error('[v0] email dispatch: run error:', e instanceof Error ? e.message : 'unknown')
  }

  console.log(
    `[v0] email dispatch: sent=${summary.sent} skipped=${summary.skipped} failed=${summary.failed} deferred=${summary.deferred} backfilled=${summary.backfilled}`,
  )
  return summary
}
