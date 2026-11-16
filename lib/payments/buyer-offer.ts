import { createAdminClient } from '@/lib/supabase/server'
import { COMPAT_BUYER_PRICE_USD, COMPAT_PRICE_USD } from '@/lib/payments/paypal-orders'

export const COMPAT_BUYER_OFFER_KEY = 'compat_buyer_1599'
export const COMPAT_BUYER_OFFER_HOURS = 24
export const BUYER_OFFER_CUSTOM_ID_PREFIX = 'buyer-offer:'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: unknown): value is string => typeof value === 'string' && UUID_RE.test(value)

// Why the offer is (not) live. "no-payment" also covers a paid report whose offer clock has not started yet.
export type BuyerOfferReason = 'none' | 'expired' | 'redeemed' | 'no-payment'

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

// Single log line for support: explains why a given test showed the regular price. Contains no PII or ids.
export function logBuyerOfferResolved(offer: BuyerOfferStatus) {
  console.log(`[v0] compat offer resolved: eligible=${offer.eligible} reason=${offer.reason}`)
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
  const eligible = !data.redeemed_at && !expired
  return {
    eligible,
    expiresAt: new Date(expiresAtMs).toISOString(),
    priceUsd: eligible ? COMPAT_BUYER_PRICE_USD : COMPAT_PRICE_USD,
    offerId: data.id as string,
    reason: data.redeemed_at ? 'redeemed' : expired ? 'expired' : 'none',
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
  if (!report) return noOffer()

  const paymentIds = await completedPaymentIds(reportId)
  if (paymentIds.length === 0) return noOffer()

  const now = new Date()
  const { error } = await admin.from('buyer_offers').upsert(
    {
      payment_id: paymentIds[0],
      offer_key: COMPAT_BUYER_OFFER_KEY,
      first_seen_at: now.toISOString(),
      expires_at: new Date(now.getTime() + COMPAT_BUYER_OFFER_HOURS * 3_600_000).toISOString(),
    },
    { onConflict: 'payment_id,offer_key', ignoreDuplicates: true },
  )
  if (error) {
    console.error('[v0] buyer-offer: start failed', error.code, error.message)
    return noOffer()
  }

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
