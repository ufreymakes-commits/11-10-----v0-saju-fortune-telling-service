import { createAdminClient } from '@/lib/supabase/server'
import { COMPAT_BUYER_PRICE_USD, COMPAT_PRICE_USD } from '@/lib/payments/paypal-orders'

export const COMPAT_BUYER_OFFER_KEY = 'compat_buyer_1599'
export const COMPAT_BUYER_OFFER_HOURS = 24
export const BUYER_OFFER_CUSTOM_ID_PREFIX = 'buyer-offer:'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value)

// Why the offer is (not) live. "no-payment" also covers a paid report whose offer clock has not started yet.
// "already-purchased" = this customer already has a completed compatibility payment (PayPal or coupon), so the
// buyer-only price never applies, even if an offer row exists.
export type BuyerOfferReason = 'none' | 'expired' | 'redeemed' | 'no-payment' | 'already-purchased'

export interface BuyerOfferStatus {
  eligible: boolean
  expiresAt: string | null
  priceUsd: string
  offerId: string | null
  reason: BuyerOfferReason
}

const noOffer = (): BuyerOfferStatus => ({
  eligible: false,
  expiresAt: null,
  priceUsd: COMPAT_PRICE_USD,
  offerId: null,
  reason: 'no-payment',
})

// First 8 chars of a report/payment id: enough to correlate log lines, not enough to be a usable identifier.
const shortId = (id: string | null | undefined) => (id ? id.slice(0, 8) : 'none')

// Single log line for support: explains why a given test showed the regular price. Contains no PII; the optional
// context adds a short id prefix and the call site.
export function logBuyerOfferResolved(
  offer: Pick<BuyerOfferStatus, 'eligible' | 'reason'>,
  context?: { source: string; id?: string | null },
) {
  const suffix = context ? ` id=${shortId(context.id)} src=${context.source}` : ''
  console.log(`[v0] compat offer resolved: eligible=${offer.eligible} reason=${offer.reason}${suffix}`)
}

async function completedPaymentIds(reportId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('payments')
    .select('id')
    .eq('submission_id', reportId)
    .eq('status', 'completed')
  if (error) {
    console.error('[v0] buyer-offer: payment lookup failed', error.message)
    return []
  }
  return (data ?? []).map((p) => p.id as string)
}

const normalizeName = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
const dateOnly = (value: unknown) => String(value ?? '').slice(0, 10)

// compatibility_submissions carries no link to the 99 Facts report, so "this customer" is identified by the
// report owner's name + birth date appearing as person A or B of a compat submission with a completed payment
// (PayPal-verified or coupon). Returns null when the lookup fails so callers can fail closed.
async function hasCompletedCompatPurchase(reportId: string): Promise<boolean | null> {
  const admin = createAdminClient()

  const { data: owner, error: ownerError } = await admin
    .from('submissions')
    .select('name, birth_date')
    .eq('id', reportId)
    .maybeSingle()
  if (ownerError) {
    console.error('[v0] buyer-offer: owner lookup failed', ownerError.message)
    console.log(`[v0] compat purchase check: lookup error (fail-closed) id=${shortId(reportId)}`)
    return null
  }
  const ownerName = normalizeName(owner?.name)
  const ownerBirthDate = dateOnly(owner?.birth_date)
  if (!ownerName || !ownerBirthDate) return false

  const { data: candidates, error: candidateError } = await admin
    .from('compatibility_submissions')
    .select('id, person_a_name, person_a_birth_date, person_b_name, person_b_birth_date')
    .or(`person_a_birth_date.eq.${ownerBirthDate},person_b_birth_date.eq.${ownerBirthDate}`)
    .limit(500)
  if (candidateError) {
    console.error('[v0] buyer-offer: compat submission lookup failed', candidateError.message)
    console.log(`[v0] compat purchase check: lookup error (fail-closed) id=${shortId(reportId)}`)
    return null
  }

  const isPersonA = (c: NonNullable<typeof candidates>[number]) =>
    dateOnly(c.person_a_birth_date) === ownerBirthDate && normalizeName(c.person_a_name) === ownerName
  const isPersonB = (c: NonNullable<typeof candidates>[number]) =>
    dateOnly(c.person_b_birth_date) === ownerBirthDate && normalizeName(c.person_b_name) === ownerName

  const matches = (candidates ?? []).filter((c) => isPersonA(c) || isPersonB(c))
  if (matches.length === 0) return false

  const { data: payments, error: paymentError } = await admin
    .from('compatibility_payments')
    .select('submission_id')
    .in(
      'submission_id',
      matches.map((c) => c.id as string),
    )
    .eq('status', 'completed')
    .limit(1)
  if (paymentError) {
    console.error('[v0] buyer-offer: compat payment lookup failed', paymentError.message)
    console.log(`[v0] compat purchase check: lookup error (fail-closed) id=${shortId(reportId)}`)
    return null
  }

  const paid = (payments ?? [])[0]
  if (!paid) return false
  const matched = matches.find((c) => c.id === paid.submission_id)
  console.log(
    `[v0] compat purchase check: matched ${matched && isPersonA(matched) ? 'A' : 'B'} id=${shortId(reportId)}`,
  )
  return true
}

const alreadyPurchased = (): BuyerOfferStatus => ({
  eligible: false,
  expiresAt: null,
  priceUsd: COMPAT_PRICE_USD,
  offerId: null,
  reason: 'already-purchased',
})

// Eligible only when: the 99 Facts payment is completed (PayPal-verified or coupon-paid), an offer row exists,
// the server clock is before expires_at, and the offer has not been redeemed.
export async function getBuyerOffer(reportId: string): Promise<BuyerOfferStatus> {
  if (!isUuid(reportId)) return noOffer()

  const paymentIds = await completedPaymentIds(reportId)
  if (paymentIds.length === 0) return noOffer()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('buyer_offers')
    .select('id, expires_at, redeemed_at')
    .in('payment_id', paymentIds)
    .eq('offer_key', COMPAT_BUYER_OFFER_KEY)
    .order('first_seen_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[v0] buyer-offer: offer lookup failed', error.message)
    return noOffer()
  }
  if (!data) return noOffer()

  const expiresAtMs = new Date(data.expires_at as string).getTime()
  const expired = Date.now() >= expiresAtMs
  const base = {
    expiresAt: new Date(expiresAtMs).toISOString(),
    offerId: data.id as string,
  }
  if (data.redeemed_at) return { ...base, eligible: false, priceUsd: COMPAT_PRICE_USD, reason: 'redeemed' }

  // The offer is for the first compatibility purchase only. Fails closed if the lookup errors.
  const purchased = await hasCompletedCompatPurchase(reportId)
  if (purchased !== false) return alreadyPurchased()

  return {
    ...base,
    eligible: !expired,
    priceUsd: expired ? COMPAT_PRICE_USD : COMPAT_BUYER_PRICE_USD,
    reason: expired ? 'expired' : 'none',
  }
}

// Starts the 24h clock the first time the paid report is successfully available. Idempotent: ON CONFLICT DO NOTHING
// means later calls never move first_seen_at / expires_at.
export async function startBuyerOffer(reportId: string): Promise<BuyerOfferStatus> {
  if (!isUuid(reportId)) return noOffer()

  const admin = createAdminClient()

  const { data: report } = await admin
    .from('reports')
    .select('id')
    .eq('submission_id', reportId)
    .eq('section_key', 'paid_full')
    .limit(1)
    .maybeSingle()
  if (!report) {
    console.log(`[v0] buyer-offer start: skipped (paid report not generated) id=${shortId(reportId)}`)
    return noOffer()
  }

  const paymentIds = await completedPaymentIds(reportId)
  if (paymentIds.length === 0) {
    console.log(`[v0] buyer-offer start: skipped (no completed payment) id=${shortId(reportId)}`)
    return noOffer()
  }

  // Customers who already bought compatibility never get an offer row (and so never get a clock).
  const purchased = await hasCompletedCompatPurchase(reportId)
  if (purchased !== false) {
    console.log(
      `[v0] buyer-offer start: skipped (${purchased === null ? 'lookup error, fail-closed' : 'already-purchased'}) id=${shortId(reportId)}`,
    )
    return alreadyPurchased()
  }

  const now = new Date()
  // With ignoreDuplicates only newly inserted rows are returned, so an empty result means the row already existed.
  const { data: inserted, error } = await admin
    .from('buyer_offers')
    .upsert(
      {
        payment_id: paymentIds[0],
        offer_key: COMPAT_BUYER_OFFER_KEY,
        first_seen_at: now.toISOString(),
        expires_at: new Date(now.getTime() + COMPAT_BUYER_OFFER_HOURS * 3_600_000).toISOString(),
      },
      { onConflict: 'payment_id,offer_key', ignoreDuplicates: true },
    )
    .select('id')
  if (error) {
    console.error('[v0] buyer-offer: start failed', error.code, error.message)
    console.log(`[v0] buyer-offer start: skipped (lookup error) id=${shortId(reportId)}`)
    return noOffer()
  }
  console.log(
    `[v0] buyer-offer start: ${(inserted ?? []).length > 0 ? 'row created' : 'row already existed'} id=${shortId(reportId)}`,
  )

  return getBuyerOffer(reportId)
}

// Idempotent: only the first call sets redeemed_at.
export async function redeemBuyerOffer(offerId: string, compatPaymentId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('buyer_offers')
    .update({ redeemed_at: new Date().toISOString(), redeemed_payment_id: compatPaymentId })
    .eq('id', offerId)
    .is('redeemed_at', null)
  if (error) {
    console.error('[v0] buyer-offer: redeem failed', error.message)
    return false
  }
  return true
}

export function offerIdFromCustomId(customId: string | null | undefined): string | null {
  if (!customId || !customId.startsWith(BUYER_OFFER_CUSTOM_ID_PREFIX)) return null
  const id = customId.slice(BUYER_OFFER_CUSTOM_ID_PREFIX.length)
  return isUuid(id) ? id : null
}
