import { NextResponse } from 'next/server'
import { settlePayment } from '@/lib/payments/paypal-orders'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
    }

    let result = await settlePayment(orderId, 'browser')

    // The buyer came back from PayPal but the order is not approved. Give PayPal a moment, then check once more.
    if (result.state === 'pending' && result.orderStatus && result.orderStatus !== 'APPROVED') {
      await new Promise((r) => setTimeout(r, 3000))
      result = await settlePayment(orderId, 'browser')
    }

    if (result.state === 'completed' || result.state === 'duplicate') {
      return NextResponse.json({
        success: true,
        state: 'completed',
        duplicate: result.state === 'duplicate',
        submissionId: result.submissionId,
      })
    }

    if (result.state === 'pending' && result.orderStatus === 'PAYER_ACTION_REQUIRED' && result.payerActionUrl) {
      // Card needs a verification step at PayPal (e.g. 3-D Secure): send the buyer there to finish.
      return NextResponse.json({ state: 'action_required', url: result.payerActionUrl, submissionId: result.submissionId })
    }

    if (result.state === 'pending' && (result.orderStatus === 'CREATED' || result.orderStatus === 'PAYER_ACTION_REQUIRED')) {
      // Never approved at PayPal, so nothing was charged. Tell the buyer instead of waiting forever.
      return NextResponse.json(
        {
          state: 'not_approved',
          submissionId: result.submissionId,
          orderStatus: result.orderStatus,
          error: 'PayPal did not complete this payment.',
        },
        { status: 409 },
      )
    }

    if (result.state === 'pending') {
      return NextResponse.json({ state: 'pending', submissionId: result.submissionId }, { status: 202 })
    }

    return NextResponse.json(
      { error: 'Payment could not be completed', state: 'failed', submissionId: result.submissionId },
      { status: 400 },
    )
  } catch (error) {
    console.error('[v0] payments: capture route error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ state: 'pending' }, { status: 202 })
  }
}
