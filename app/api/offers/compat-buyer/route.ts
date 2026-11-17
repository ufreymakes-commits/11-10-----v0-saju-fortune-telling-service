import { NextResponse } from 'next/server'
import { getBuyerOffer, isUuid, logBuyerOfferResolved, startBuyerOffer } from '@/lib/payments/buyer-offer'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

const toBody = (offer: Awaited<ReturnType<typeof getBuyerOffer>>) => ({
  eligible: offer.eligible,
  expiresAt: offer.expiresAt,
  priceUsd: offer.priceUsd,
  serverNow: new Date().toISOString(),
})

// Read-only: reports whether the buyer-only price currently applies.
export async function GET(request: Request) {
  const reportId = new URL(request.url).searchParams.get('reportId')
  if (!isUuid(reportId)) return NextResponse.json({ error: 'Invalid reportId' }, { status: 400, headers: NO_STORE })
  const offer = await getBuyerOffer(reportId)
  logBuyerOfferResolved(offer, { source: 'api-get', id: reportId })
  return NextResponse.json(toBody(offer), { headers: NO_STORE })
}

// Starts the 24h clock once the paid report exists. Idempotent; never restarts an existing offer.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  if (!isUuid(body?.reportId)) return NextResponse.json({ error: 'Invalid reportId' }, { status: 400, headers: NO_STORE })
  const offer = await startBuyerOffer(body.reportId)
  logBuyerOfferResolved(offer, { source: 'api-post', id: body.reportId })
  return NextResponse.json(toBody(offer), { headers: NO_STORE })
}
