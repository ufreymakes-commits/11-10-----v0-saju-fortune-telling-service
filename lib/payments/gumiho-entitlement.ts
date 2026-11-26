import { createAdminClient } from '@/lib/supabase/server'
import { ensureGumihoEntitlement as ensureBundleForOrder } from '@/lib/payments/paypal-orders'

// The bundled Gumiho add-on is stored as a completed gumiho_payments row keyed 'BUNDLE-<order id>'
// plus a placeholder gumiho_questions row (question_1 = '' until the buyer asks their questions).
// Revocation never deletes rows: gumiho_payments.revoked_at (scripts/025_gumiho_revocation.sql) is set,
// and a refunded parent payment (payments.status = 'refunded') counts as revoked too, so refunds that
// were only recorded on the payment row still block the entitlement.

const BUNDLE_PREFIX = 'BUNDLE-'

type Admin = ReturnType<typeof createAdminClient>
type BundleRow = { paypal_order_id: string; gumiho_question_id: string | null; revoked_at: string | null }

function isMissingColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === 'PGRST204' || error.code === '42703' || /column .* does not exist|revoked_/i.test(error.message ?? '')
}

async function loadBundles(admin: Admin, submissionId: string): Promise<BundleRow[]> {
  const withRevoked = await admin
    .from('gumiho_payments')
    .select('paypal_order_id, gumiho_question_id, revoked_at')
    .eq('submission_id', submissionId)
    .eq('status', 'completed')
    .like('paypal_order_id', `${BUNDLE_PREFIX}%`)
  if (!withRevoked.error) return (withRevoked.data ?? []) as BundleRow[]

  if (!isMissingColumn(withRevoked.error)) {
    console.error('[v0] gumiho entitlement: bundle lookup failed', withRevoked.error.message)
    return []
  }
  const plain = await admin
    .from('gumiho_payments')
    .select('paypal_order_id, gumiho_question_id')
    .eq('submission_id', submissionId)
    .eq('status', 'completed')
    .like('paypal_order_id', `${BUNDLE_PREFIX}%`)
  return ((plain.data ?? []) as Omit<BundleRow, 'revoked_at'>[]).map((r) => ({ ...r, revoked_at: null }))
}

export interface GumihoEntitlementState {
  /** Id of an active bundled entitlement whose 3 questions are not asked yet. */
  unusedQuestionId: string | null
  /** True when the only unused bundled entitlement was refunded/revoked. */
  refunded: boolean
  /** Id of an active bundled entitlement whose 3 questions were already asked (link back to the answers). */
  answeredQuestionId: string | null
}

export async function getGumihoEntitlementState(submissionId: string): Promise<GumihoEntitlementState> {
  try {
    const admin = createAdminClient()
    const bundles = (await loadBundles(admin, submissionId)).filter((b) => b.gumiho_question_id)
    if (bundles.length === 0) return { unusedQuestionId: null, refunded: false, answeredQuestionId: null }

    const orderIds = bundles.map((b) => b.paypal_order_id.slice(BUNDLE_PREFIX.length))
    const [{ data: refundedPayments }, { data: questions }] = await Promise.all([
      admin.from('payments').select('paypal_order_id').in('paypal_order_id', orderIds).eq('status', 'refunded'),
      admin
        .from('gumiho_questions')
        .select('id, question_1')
        .in('id', bundles.map((b) => b.gumiho_question_id as string)),
    ])
    const refundedOrders = new Set((refundedPayments ?? []).map((p) => p.paypal_order_id as string))
    const unusedIds = new Set((questions ?? []).filter((q) => q.question_1 === '').map((q) => q.id as string))

    let unusedQuestionId: string | null = null
    let answeredQuestionId: string | null = null
    let refunded = false
    for (const bundle of bundles) {
      const questionId = bundle.gumiho_question_id as string
      if (!unusedIds.has(questionId)) {
        const active = !bundle.revoked_at && !refundedOrders.has(bundle.paypal_order_id.slice(BUNDLE_PREFIX.length))
        if (active && (questions ?? []).some((q) => q.id === questionId)) answeredQuestionId = answeredQuestionId ?? questionId
        continue
      }
      const revoked = Boolean(bundle.revoked_at) || refundedOrders.has(bundle.paypal_order_id.slice(BUNDLE_PREFIX.length))
      if (revoked) refunded = true
      else unusedQuestionId = unusedQuestionId ?? questionId
    }
    return { unusedQuestionId, refunded: refunded && !unusedQuestionId, answeredQuestionId }
  } catch (e) {
    console.error('[v0] gumiho entitlement lookup error:', e instanceof Error ? e.message : 'unknown')
    return { unusedQuestionId: null, refunded: false, answeredQuestionId: null }
  }
}

/**
 * Returns the id of a bundled (paid with the report) Gumiho entitlement whose
 * 3 questions have not been asked yet and that has not been revoked, or null when there is none.
 */
export async function findUnusedGumihoEntitlement(submissionId: string): Promise<string | null> {
  return (await getGumihoEntitlementState(submissionId)).unusedQuestionId
}

/**
 * Creates the bundled Gumiho entitlement for a completed add-on payment when it is missing.
 * Idempotent and safe to call repeatedly; never throws.
 */
export async function ensureGumihoEntitlement(paymentId: string): Promise<{ questionId: string | null; repaired: boolean }> {
  try {
    const admin = createAdminClient()
    const { data: payment } = await admin
      .from('payments')
      .select('id, submission_id, paypal_order_id, status, gumiho_addon')
      .eq('id', paymentId)
      .maybeSingle()

    if (!payment || payment.status !== 'completed' || !payment.gumiho_addon) return { questionId: null, repaired: false }

    const orderId = payment.paypal_order_id as string
    const { data: existing } = await admin
      .from('gumiho_payments')
      .select('gumiho_question_id')
      .eq('paypal_order_id', `${BUNDLE_PREFIX}${orderId}`)
      .limit(1)
      .maybeSingle()
    if (existing?.gumiho_question_id) return { questionId: existing.gumiho_question_id as string, repaired: false }

    const questionId = await ensureBundleForOrder(orderId, payment.submission_id as string)
    if (questionId) console.log(`[v0] gumiho entitlement repaired payment=${paymentId}`)
    return { questionId, repaired: Boolean(questionId) }
  } catch (e) {
    console.error('[v0] gumiho entitlement ensure error:', e instanceof Error ? e.message : 'unknown')
    return { questionId: null, repaired: false }
  }
}

/** Cheap self-heal for page loads: repairs a completed add-on payment that has no entitlement. */
export async function healGumihoEntitlementForSubmission(submissionId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: payment } = await admin
      .from('payments')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .eq('gumiho_addon', true)
      .limit(1)
      .maybeSingle()
    if (payment?.id) await ensureGumihoEntitlement(payment.id as string)
  } catch (e) {
    console.error('[v0] gumiho entitlement heal error:', e instanceof Error ? e.message : 'unknown')
  }
}

/** Cron helper: repairs recent completed add-on payments that are missing their entitlement. */
export async function repairMissingGumihoEntitlements(windowMs = 7 * 24 * 3_600_000, scanLimit = 100, repairLimit = 25): Promise<number> {
  try {
    const admin = createAdminClient()
    const since = new Date(Date.now() - windowMs).toISOString()
    const { data: payments } = await admin
      .from('payments')
      .select('id, paypal_order_id')
      .eq('status', 'completed')
      .eq('gumiho_addon', true)
      .gte('completed_at', since)
      .order('completed_at', { ascending: false })
      .limit(scanLimit)
    if (!payments || payments.length === 0) return 0

    const { data: have } = await admin
      .from('gumiho_payments')
      .select('paypal_order_id, gumiho_question_id')
      .in('paypal_order_id', payments.map((p) => `${BUNDLE_PREFIX}${p.paypal_order_id}`))
    const complete = new Set((have ?? []).filter((g) => g.gumiho_question_id).map((g) => g.paypal_order_id as string))

    let repaired = 0
    for (const payment of payments) {
      if (repaired >= repairLimit) break
      if (complete.has(`${BUNDLE_PREFIX}${payment.paypal_order_id}`)) continue
      const result = await ensureGumihoEntitlement(payment.id as string)
      if (result.repaired) repaired += 1
    }
    return repaired
  } catch (e) {
    console.error('[v0] gumiho entitlement reconcile error:', e instanceof Error ? e.message : 'unknown')
    return 0
  }
}

/**
 * Admin/server only (never expose through a public route). Marks the bundled entitlement of a payment as
 * revoked without deleting any rows. Answers that were already generated stay viewable.
 */
export async function revokeGumihoEntitlement(paymentId: string, reason: string): Promise<{ ok: boolean; revoked: boolean }> {
  try {
    const admin = createAdminClient()
    const { data: payment } = await admin.from('payments').select('paypal_order_id').eq('id', paymentId).maybeSingle()
    if (!payment) return { ok: false, revoked: false }

    const { data, error } = await admin
      .from('gumiho_payments')
      .update({ revoked_at: new Date().toISOString(), revoked_reason: reason.slice(0, 120) })
      .eq('paypal_order_id', `${BUNDLE_PREFIX}${payment.paypal_order_id}`)
      .is('revoked_at', null)
      .select('id')

    if (error) {
      console.error(
        isMissingColumn(error)
          ? '[v0] gumiho entitlement revoke skipped: run scripts/025_gumiho_revocation.sql'
          : `[v0] gumiho entitlement revoke failed: ${error.message}`,
      )
      return { ok: false, revoked: false }
    }
    const revoked = Boolean(data && data.length > 0)
    if (revoked) console.log(`[v0] gumiho entitlement revoked payment=${paymentId} reason=${reason}`)
    return { ok: true, revoked }
  } catch (e) {
    console.error('[v0] gumiho entitlement revoke error:', e instanceof Error ? e.message : 'unknown')
    return { ok: false, revoked: false }
  }
}
