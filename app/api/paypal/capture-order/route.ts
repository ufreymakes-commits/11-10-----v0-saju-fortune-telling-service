import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('[v0] PayPal capture failed:', captureData)
      await supabase.from('payments').update({ status: 'failed' }).eq('paypal_order_id', orderId)
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 400 })
    }

    const { data: payment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('paypal_order_id', orderId)
      .select('submission_id')
      .single()

    if (updateError) {
      console.error('[v0] Payment update error:', updateError)
    }

    const submissionId = payment?.submission_id

    // Trigger paid report generation in background (don't await - takes up to 2 mins)
    if (submissionId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      
      fetch(`${baseUrl}/api/generate-paid-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      }).catch(err => console.error('[v0] Failed to trigger report generation:', err))
      
      console.log('[v0] Report generation triggered for submission:', submissionId)
    }

    return NextResponse.json({ success: true, submissionId })
  } catch (error) {
    console.error('[v0] PayPal capture error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
