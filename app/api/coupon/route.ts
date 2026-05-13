import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VALID_COUPON = 'znvhsDlqslek123'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { code, submissionId } = await req.json()

  if (!code || !submissionId) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  if (code.trim() !== VALID_COUPON) {
    return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 400 })
  }

  // Check if coupon has been used more than 2 times already
  const { data: couponUses, error: couponCountError } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('paypal_order_id', `COUPON-${code.trim()}-%`)
    .like('paypal_order_id', `COUPON-${code.trim()}-%`)

  // Alternative: if the LIKE doesn't work, count manually
  const { data: allCouponPayments } = await supabase
    .from('payments')
    .select('id')
    .ilike('paypal_order_id', `COUPON-${code.trim()}%`)

  const couponUsageCount = allCouponPayments?.length || 0

  if (couponUsageCount >= 10) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'This coupon has reached its usage limit (10 uses maximum).',
        limitReached: true 
      },
      { status: 429 }
    )
  }

  // Check if paid report already exists (e.g. paid via PayPal)
  const { data: existing } = await supabase
    .from('submissions')
    .select('paid_report_url')
    .eq('id', submissionId)
    .single()

  if (existing?.paid_report_url) {
    // Already has paid report — extract path and redirect
    try {
      const pathname = new URL(existing.paid_report_url).pathname
      return NextResponse.json({ success: true, redirectPath: pathname })
    } catch {
      return NextResponse.json({ success: true, redirectPath: existing.paid_report_url })
    }
  }

  // No paid report yet — create payment record for coupon (same structure as PayPal)
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      submission_id: submissionId,
      paypal_order_id: `COUPON-${code.trim()}-${submissionId}`,
      amount: 0,
      currency: 'USD',
      status: 'completed',
    })

  if (paymentError) {
    console.error('[v0] Failed to create coupon payment record:', paymentError)
    return NextResponse.json({ success: false, error: 'Failed to process coupon' }, { status: 500 })
  }

  // Return submissionId to client
  // Client (coupon-success page) will call generate-paid-report directly, same as PayPal flow
  return NextResponse.json({
    success: true,
    redirectPath: `/coupon-success/${submissionId}`,
    submissionId,
  })
}
