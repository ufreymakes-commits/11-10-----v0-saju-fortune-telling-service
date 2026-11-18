import { createAdminClient } from '@/lib/supabase/server'
import { DEFAULT_STALE_AFTER_MS, STALE_AFTER_MS } from '@/lib/email/config'
import { getBuyerOffer } from '@/lib/payments/buyer-offer'
import type { EmailContact, EmailSend } from '@/lib/email/types'

async function hasCompletedPayment(submissionId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from('payments')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('status', 'completed')
    .limit(1)
  return Boolean(data && data.length > 0)
}

// Re-checked right before every send. Returns null when the email may go out, otherwise the skip reason.
export async function shouldSkip(send: EmailSend, contact: EmailContact): Promise<string | null> {
  if (contact.bounced_at) return 'bounced'
  if (contact.complained_at) return 'complained'

  if (send.category === 'marketing') {
    if (contact.unsubscribed_at) return 'unsubscribed'
    if (!contact.marketing_consent) return 'no-consent'
  }

  const allowedDelay = STALE_AFTER_MS[send.template_key] ?? DEFAULT_STALE_AFTER_MS
  if (Date.now() > new Date(send.scheduled_at).getTime() + allowedDelay) return 'stale'

  const admin = createAdminClient()
  const refId = send.ref_id

  switch (send.template_key) {
    case 'A2':
    case 'A3': {
      if (!refId) return 'no-ref'
      return (await hasCompletedPayment(refId)) ? 'purchased' : null
    }
    case 'B1':
    case 'B2': {
      if (!refId) return 'no-ref'
      const { data: payment } = await admin
        .from('payments')
        .select('status, submission_id')
        .eq('id', refId)
        .maybeSingle()
      if (!payment) return 'no-payment'
      if (payment.status === 'completed') return 'purchased'
      return (await hasCompletedPayment(payment.submission_id as string)) ? 'purchased' : null
    }
    case 'C2': {
      if (!refId) return 'no-ref'
      const { data: offer } = await admin
        .from('buyer_offers')
        .select('payment_id, expires_at')
        .eq('id', refId)
        .maybeSingle()
      if (!offer || Date.now() >= new Date(offer.expires_at as string).getTime()) return 'offer-not-eligible'
      const { data: payment } = await admin
        .from('payments')
        .select('submission_id')
        .eq('id', offer.payment_id)
        .maybeSingle()
      if (!payment?.submission_id) return 'offer-not-eligible'
      const status = await getBuyerOffer(payment.submission_id as string)
      return status.eligible && status.offerId === refId ? null : 'offer-not-eligible'
    }
    case 'C3':
    case 'C4': {
      if (!refId) return 'no-ref'
      const { data: payment } = await admin.from('payments').select('status').eq('id', refId).maybeSingle()
      return payment?.status === 'completed' ? null : 'not-completed'
    }
    default:
      return null
  }
}
