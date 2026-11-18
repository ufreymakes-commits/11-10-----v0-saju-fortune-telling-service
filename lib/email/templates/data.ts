import { createAdminClient } from '@/lib/supabase/server'
import { getGumihoEntitlementState } from '@/lib/payments/gumiho-entitlement'

export interface TemplateData {
  firstName: string
  submissionId: string
  // C2 only: ISO time the buyer-only compatibility price ends.
  offerExpiresAt: string | null
  // C4 only: true when the buyer still has an unused bundled Gumiho entitlement (no P.S. needed).
  hasGumiho: boolean
}

export const firstNameOf = (name: string | null | undefined): string => name?.trim().split(/\s+/)[0] || 'there'

// Resolves the submission behind a queued send. The ref_id meaning depends on the template:
// A2/A3 -> submission id, B1/B2/C3/C4 -> payment id, C2 -> buyer_offers id.
async function resolveSubmissionId(
  templateKey: string,
  refId: string | null,
): Promise<{ submissionId: string; offerExpiresAt: string | null }> {
  if (!refId) throw new Error('missing ref_id')
  const admin = createAdminClient()

  if (templateKey === 'A2' || templateKey === 'A3') {
    return { submissionId: refId, offerExpiresAt: null }
  }

  let paymentId = refId
  let offerExpiresAt: string | null = null
  if (templateKey === 'C2') {
    const { data: offer } = await admin
      .from('buyer_offers')
      .select('payment_id, expires_at')
      .eq('id', refId)
      .maybeSingle()
    if (!offer) throw new Error('buyer offer not found')
    paymentId = offer.payment_id as string
    offerExpiresAt = offer.expires_at as string
  }

  const { data: payment } = await admin.from('payments').select('submission_id').eq('id', paymentId).maybeSingle()
  if (!payment?.submission_id) throw new Error('payment not found')
  return { submissionId: payment.submission_id as string, offerExpiresAt }
}

export async function loadTemplateData(templateKey: string, refId: string | null): Promise<TemplateData> {
  const { submissionId, offerExpiresAt } = await resolveSubmissionId(templateKey, refId)
  const admin = createAdminClient()
  const { data: submission } = await admin.from('submissions').select('name').eq('id', submissionId).maybeSingle()

  const hasGumiho =
    templateKey === 'C4' ? (await getGumihoEntitlementState(submissionId)).unusedQuestionId !== null : false

  return {
    firstName: firstNameOf(submission?.name as string | null | undefined),
    submissionId,
    offerExpiresAt,
    hasGumiho,
  }
}
