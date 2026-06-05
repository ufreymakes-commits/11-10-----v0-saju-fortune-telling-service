import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const VALID_COUPON = 'znvhsDlqslek123'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { code, gumihoQuestionId, submissionId } = await req.json()

  if (!code || !gumihoQuestionId || !submissionId) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  if (code.trim() !== VALID_COUPON) {
    return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 400 })
  }

  // Create coupon payment record
  const { error: paymentError } = await supabase
    .from('gumiho_payments')
    .insert({
      gumiho_question_id: gumihoQuestionId,
      submission_id: submissionId,
      paypal_order_id: `COUPON-${code.trim()}-${gumihoQuestionId}`,
      amount: 0,
      currency: 'USD',
      status: 'completed',
      completed_at: new Date().toISOString()
    })

  if (paymentError) {
    console.error('[v0] Failed to create gumiho coupon payment record:', paymentError)
    return NextResponse.json({ success: false, error: 'Failed to process coupon' }, { status: 500 })
  }

  // Return success with redirect path to success page (which will generate answers)
  return NextResponse.json({
    success: true,
    redirectPath: `/ask-gumiho/${submissionId}/success?questionId=${gumihoQuestionId}&coupon=true`,
    gumihoQuestionId,
    submissionId
  })
}
