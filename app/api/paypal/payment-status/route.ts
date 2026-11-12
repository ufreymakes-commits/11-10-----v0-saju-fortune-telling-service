import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { settlePayment } from '@/lib/payments/paypal-orders'

export const maxDuration = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type PublicState = 'completed' | 'pending' | 'failed' | 'none'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    let submissionId = searchParams.get('submissionId')

    const admin = createAdminClient()

    if (!submissionId && orderId) {
      const { data } = await admin
        .from('payments')
        .select('submission_id')
        .eq('paypal_order_id', orderId)
        .limit(1)
        .maybeSingle()
      submissionId = (data?.submission_id as string | undefined) ?? null
    }

    if (!submissionId || !UUID_RE.test(submissionId)) {
      return NextResponse.json({ state: 'none' satisfies PublicState })
    }

    const { data: rows } = await admin
      .from('payments')
      .select('paypal_order_id, status, created_at')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!rows || rows.length === 0) {
      return NextResponse.json({ state: 'none' satisfies PublicState })
    }

    if (rows.some((r) => r.status === 'completed')) {
      return NextResponse.json({ state: 'completed' satisfies PublicState })
    }

    const pending = rows.find((r) => r.status === 'pending')
    if (pending) {
      const settled = await settlePayment(pending.paypal_order_id as string, 'browser')
      const state: PublicState =
        settled.state === 'completed' || settled.state === 'duplicate' ? 'completed' : settled.state === 'failed' ? 'failed' : 'pending'
      return NextResponse.json({ state })
    }

    return NextResponse.json({ state: 'failed' satisfies PublicState })
  } catch (error) {
    console.error('[v0] payments: status route error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ state: 'pending' satisfies PublicState })
  }
}
