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

  // Check if paid report already exists
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

  // No paid report yet — generate one by calling the generate-paid-report endpoint
  const origin = req.nextUrl.origin
  const genResponse = await fetch(`${origin}/api/generate-paid-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  })

  if (!genResponse.ok) {
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    redirectPath: `/report/${submissionId}/paid`,
  })
}
