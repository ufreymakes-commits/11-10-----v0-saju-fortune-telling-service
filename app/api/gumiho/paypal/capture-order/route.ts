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
    return null
  }
  return data.access_token as string
}

export async function POST(request: Request) {
  try {
    const { orderId, gumihoQuestionId } = await request.json()

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
      .from('gumiho_payments')
      .select('status, gumiho_question_id, submission_id')
      .eq('paypal_order_id', orderId)
      .single()

    if (existingRow?.status === 'completed') {
      console.log('[v0] Gumiho order already completed in DB, returning success:', orderId)
      return NextResponse.json({
        success: true,
        gumihoQuestionId: gumihoQuestionId || existingRow.gumiho_question_id,
        submissionId: existingRow.submission_id,
      })
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

    console.log('[v0] Gumiho PayPal capture response:', {
      orderId,
      httpStatus: captureResponse.status,
      paypalStatus: captureData.status,
      details: captureData.details || null
    })

    // Check if order was already captured
    const isAlreadyCaptured = captureData.details?.some(
      (d: { issue?: string }) =>
        d.issue === 'ORDER_ALREADY_CAPTURED' || d.issue === 'ORDER_ALREADY_COMPLETED'
    )

    if (isAlreadyCaptured) {
      const { data: existingPayment } = await supabase
        .from('gumiho_payments')
        .select('gumiho_question_id, submission_id')
        .eq('paypal_order_id', orderId)
        .single()

      const reportUrl = existingPayment?.submission_id
        ? `${getBaseUrl(request)}/ask-gumiho/${existingPayment.submission_id}/answers`
        : null

      await supabase.from('gumiho_payments').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        report_url: reportUrl,
      }).eq('paypal_order_id', orderId)

      return NextResponse.json({ 
        success: true, 
        gumihoQuestionId: existingPayment?.gumiho_question_id,
        submissionId: existingPayment?.submission_id
      })
    }

    const validStatuses = ['COMPLETED', 'APPROVED']
    if (!captureResponse.ok || !validStatuses.includes(captureData.status)) {
      console.error('[v0] Gumiho PayPal capture failed:', captureData)
      await supabase
        .from('gumiho_payments')
        .update({ status: 'failed' })
        .eq('paypal_order_id', orderId)
        .neq('status', 'completed')
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 400 })
    }

    // submission_id를 조회해서 report_url 구성
    const { data: paymentRow } = await supabase
      .from('gumiho_payments')
      .select('submission_id')
      .eq('paypal_order_id', orderId)
      .single()

    const reportUrl = paymentRow?.submission_id
      ? `${getBaseUrl(request)}/ask-gumiho/${paymentRow.submission_id}/answers`
      : null

    const { data: payment, error: updateError } = await supabase
      .from('gumiho_payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        report_url: reportUrl,
      })
      .eq('paypal_order_id', orderId)
      .select('gumiho_question_id, submission_id')
      .single()

    if (updateError) {
      console.error('[v0] Gumiho payment update error:', updateError)
    }

    return NextResponse.json({ 
      success: true, 
      gumihoQuestionId: gumihoQuestionId || payment?.gumiho_question_id,
      submissionId: payment?.submission_id
    })
  } catch (error) {
    console.error('[v0] Gumiho PayPal capture error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
