import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getBaseUrl(request: Request): string {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${protocol}://${host}`
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`
  }
  return baseUrl.replace(/\/$/, '')
}

function getPayPalConfig() {
  const USE_SANDBOX = process.env.PAYPAL_MODE === 'sandbox'
  const clientId = USE_SANDBOX
    ? process.env.paypalclientidSandbox
    : process.env.PAYPAL_CLIENT_ID
  const clientSecret = USE_SANDBOX
    ? process.env.paypalsecretkeySandbox
    : process.env.PAYPAL_CLIENT_SECRET
  const apiUrl = USE_SANDBOX
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'
  return { clientId, clientSecret, apiUrl }
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret, apiUrl } = getPayPalConfig()

  if (!clientId || !clientSecret) {
    console.error('[v0] PayPal credentials missing in capture-order!')
    return null
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  if (!response.ok) {
    console.error('[v0] PayPal auth failed in capture:', data)
    return null
  }
  return data.access_token as string
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
    }

    const { clientId, clientSecret, apiUrl } = getPayPalConfig()

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    const supabase = await createClient()

    // Idempotency guard: if this order is already completed, return success immediately
    // without re-calling PayPal capture. Prevents a duplicate/retried capture call from
    // overwriting a successful payment as "failed" (which causes double charges).
    const { data: existingRow } = await supabase
      .from('payments')
      .select('status, submission_id')
      .eq('paypal_order_id', orderId)
      .single()

    if (existingRow?.status === 'completed') {
      console.log('[v0] Order already completed in DB, returning success:', orderId)
      return NextResponse.json({ success: true, submissionId: existingRow.submission_id })
    }

    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to authenticate with PayPal' }, { status: 500 })
    }

    const captureResponse = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const captureData = await captureResponse.json()
    
    // Enhanced logging for debugging payment issues
    console.log('[v0] PayPal capture response:', {
      orderId,
      httpStatus: captureResponse.status,
      paypalStatus: captureData.status,
      details: captureData.details || null,
      message: captureData.message || null
    })

    // Check if order was already captured (this means payment was successful)
    const isAlreadyCaptured = captureData.details?.some(
      (d: { issue?: string }) =>
        d.issue === 'ORDER_ALREADY_CAPTURED' || d.issue === 'ORDER_ALREADY_COMPLETED'
    )
    
    if (isAlreadyCaptured) {
      console.log('[v0] Order already captured, treating as success:', orderId)
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('submission_id')
        .eq('paypal_order_id', orderId)
        .single()

      const reportUrl = existingPayment?.submission_id
        ? `${getBaseUrl(request)}/report/${existingPayment.submission_id}/paid`
        : null

      // Update to completed since payment was already successful
      await supabase.from('payments').update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        report_url: reportUrl,
      }).eq('paypal_order_id', orderId)

      return NextResponse.json({ success: true, submissionId: existingPayment?.submission_id })
    }

    // Accept both COMPLETED and APPROVED status (PayPal sometimes returns APPROVED first)
    const validStatuses = ['COMPLETED', 'APPROVED']
    if (!captureResponse.ok || !validStatuses.includes(captureData.status)) {
      console.error('[v0] PayPal capture failed:', {
        orderId,
        httpOk: captureResponse.ok,
        status: captureData.status,
        error: captureData.details || captureData.message || captureData
      })
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('paypal_order_id', orderId)
        .neq('status', 'completed')
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 400 })
    }

    // PayPal 응답에서 결제자 국가 추출
    const payerCountry =
      captureData.payer?.address?.country_code ||
      captureData.purchase_units?.[0]?.shipping?.address?.country_code ||
      null

    // submission_id를 먼저 조회해서 report_url을 구성
    const { data: paymentRow } = await supabase
      .from('payments')
      .select('submission_id')
      .eq('paypal_order_id', orderId)
      .single()

    const reportUrl = paymentRow?.submission_id
      ? `${getBaseUrl(request)}/report/${paymentRow.submission_id}/paid`
      : null

    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        payer_country: payerCountry,
        report_url: reportUrl,
      })
      .eq('paypal_order_id', orderId)
      .select('submission_id')
      .single()

    if (updateError) {
      console.error('[v0] Payment update error:', updateError)
    }

    return NextResponse.json({ success: true, submissionId: payment?.submission_id })
  } catch (error) {
    console.error('[v0] PayPal capture error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
