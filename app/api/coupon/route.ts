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

  // No paid report yet — fire-and-forget (same as PayPal flow)
  // Generation takes 2-3 minutes, so we don't await it here.
  // Client will poll via /api/check-paid-report just like payment-success-handler does.
  const origin = req.nextUrl.origin
  fetch(`${origin}/api/generate-paid-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  }).catch(() => {
    // Silently ignore — background generation
  })

  // Redirect to the coupon success waiting page (same polling UX as PayPal)
  return NextResponse.json({
    success: true,
    redirectPath: `/coupon-success/${submissionId}`,
  })
}
