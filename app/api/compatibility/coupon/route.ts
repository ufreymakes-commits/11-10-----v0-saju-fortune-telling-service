import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_CODE_LENGTH = 64
const FAILURE_DELAY_MS = 600

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

function codesMatch(submitted: string, expected: string): boolean {
  return timingSafeEqual(sha256(submitted), sha256(expected))
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const rawCode = typeof body?.code === 'string' ? body.code.trim() : ''
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : ''

    if (!rawCode || rawCode.length > MAX_CODE_LENGTH || !UUID_REGEX.test(submissionId)) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const expectedCode = process.env.COMPAT_COUPON_CODE?.trim()
    if (!expectedCode) {
      return NextResponse.json(
        { success: false, error: 'Coupons are not available right now' },
        { status: 503 }
      )
    }

    if (!codesMatch(rawCode, expectedCode)) {
      await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS))
      return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: submission } = await supabase
      .from('compatibility_submissions')
      .select('id')
      .eq('id', submissionId)
      .maybeSingle()

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 })
    }

    const redirectPath = `/compatibility/report/${submissionId}/paid`

    const hasCompletedPayment = async () => {
      const { data } = await supabase
        .from('compatibility_payments')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('status', 'completed')
        .limit(1)
      return Boolean(data && data.length > 0)
    }

    if (await hasCompletedPayment()) {
      return NextResponse.json({ success: true, redirectPath })
    }

    const now = new Date().toISOString()
    const { error: insertError } = await supabase.from('compatibility_payments').insert({
      submission_id: submissionId,
      paypal_order_id: `COUPON-${submissionId}`,
      amount: 0,
      currency: 'USD',
      status: 'completed',
      completed_at: now,
      report_url: null,
    })

    if (insertError) {
      if (insertError.code === '23505' && (await hasCompletedPayment())) {
        return NextResponse.json({ success: true, redirectPath })
      }
      console.error('[v0] compat coupon insert error:', insertError.message)
      return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
    }

    console.log(`[v0] compat coupon applied ${submissionId}`)
    return NextResponse.json({ success: true, redirectPath })
  } catch (error) {
    console.error('[v0] compat coupon error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}
