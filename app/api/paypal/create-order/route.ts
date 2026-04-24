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
  return { clientId, clientSecret, apiUrl, isSandbox: USE_SANDBOX }
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret, apiUrl, isSandbox } = getPayPalConfig()

  console.log('[v0] PayPal mode:', isSandbox ? 'sandbox' : 'live')
  console.log('[v0] PayPal clientId exists:', !!clientId)
  console.log('[v0] PayPal clientSecret exists:', !!clientSecret)
  console.log('[v0] PayPal apiUrl:', apiUrl)

  if (!clientId || !clientSecret) {
    console.error('[v0] PayPal credentials missing!')
    return null
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    const data = await response.json()
    console.log('[v0] PayPal auth response status:', response.status)

    if (!response.ok) {
      console.error('[v0] PayPal auth failed:', data)
      return null
    }

    console.log('[v0] PayPal access token received:', data.access_token ? 'YES' : 'NO')
    return data.access_token as string
  } catch (error) {
    console.error('[v0] PayPal auth error:', error)
    return null
  }
}

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

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    const { clientId, clientSecret, apiUrl } = getPayPalConfig()

    if (!clientId || !clientSecret) {
      console.error('[v0] PayPal credentials not configured')
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    const supabase = await createClient()

    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, name')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      console.error('[v0] Submission not found:', submissionId, fetchError)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    console.log('[v0] Requesting PayPal access token...')
    const accessToken = await getPayPalAccessToken()

    if (!accessToken) {
      console.error('[v0] Failed to get PayPal access token')
      return NextResponse.json({ error: 'Failed to authenticate with PayPal' }, { status: 500 })
    }

    const baseUrl = getBaseUrl(request)
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: submissionId,
        description: `Sajume 99 Facts Birth Chart Report for ${submission.name}`,
        amount: {
          currency_code: 'USD',
          value: '9.99'
        }
      }],
      application_context: {
        brand_name: 'Sajume',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${baseUrl}/checkout/${submissionId}/success`,
        cancel_url: `${baseUrl}/checkout/${submissionId}`
      }
    }

    const orderResponse = await fetch(`${apiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    })

    const orderData = await orderResponse.json()
    console.log('[v0] PayPal order response status:', orderResponse.status)

    if (!orderResponse.ok) {
      console.error('[v0] PayPal order creation failed:', orderData)
      return NextResponse.json(
        { error: 'Failed to create payment order', details: orderData.message || orderData.details?.[0]?.issue || 'Unknown error' },
        { status: 500 }
      )
    }

    if (!orderData.id) {
      console.error('[v0] No order ID in response:', orderData)
      return NextResponse.json({ error: 'Invalid response from PayPal' }, { status: 500 })
    }

    await supabase.from('payments').insert({
      submission_id: submissionId,
      paypal_order_id: orderData.id,
      amount: 9.99,
      currency: 'USD',
      status: 'pending'
    })

    const approvalUrl = orderData.links.find((link: { rel: string }) => link.rel === 'approve')?.href
    console.log('[v0] PayPal order created:', orderData.id, '| approvalUrl:', approvalUrl)

    return NextResponse.json({ id: orderData.id, approvalUrl, success: true })
  } catch (error) {
    console.error('[v0] PayPal create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
