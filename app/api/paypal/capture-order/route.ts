import { NextResponse } from 'next/server'
import { settlePayment } from '@/lib/payments/paypal-orders'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
    }

    const result = await settlePayment(orderId, 'browser')

    if (result.state === 'completed' || result.state === 'duplicate') {
      return NextResponse.json({
        success: true,
        state: 'completed',
        duplicate: result.state === 'duplicate',
        submissionId: result.submissionId,
      })
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
