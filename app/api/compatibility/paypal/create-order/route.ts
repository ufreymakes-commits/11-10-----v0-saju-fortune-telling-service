import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function getPayPalConfig() {
  const USE_SANDBOX = process.env.PAYPAL_MODE === 'sandbox'
  const clientId = USE_SANDBOX ? process.env.paypalclientidSandbox : process.env.PAYPAL_CLIENT_ID
  const clientSecret = USE_SANDBOX ? process.env.paypalsecretkeySandbox : process.env.PAYPAL_CLIENT_SECRET
  const apiUrl = USE_SANDBOX ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  return { clientId, clientSecret, apiUrl }
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret, apiUrl } = getPayPalConfig()
  if (!clientId || !clientSecret) return null

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
  const data = await response.json()
  if (!response.ok) return null
  return data.access_token as string
}

function getBaseUrl(request: Request): string {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${protocol}://${host}`
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`
  return baseUrl.replace(/\/$/, '')
}

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    if (!submissionId) return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })

    const { clientId, clientSecret, apiUrl } = getPayPalConfig()
    if (!clientId || !clientSecret) return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })

    const supabase = createAdminClient()
    const { data: submission, error: fetchError } = await supabase
      .from('compatibility_submissions')
      .select('id, person_a_name, person_b_name')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

    const accessToken = await getPayPalAccessToken()
    if (!accessToken) return NextResponse.json({ error: 'Failed to authenticate with PayPal' }, { status: 500 })

    const baseUrl = getBaseUrl(request)
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: submissionId,
        description: `Sajume Compatibility Report: ${submission.person_a_name} & ${submission.person_b_name}`,
        amount: { currency_code: 'USD', value: '19.99' }
      }],
      application_context: {
        brand_name: 'Sajume',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${baseUrl}/compatibility/checkout/${submissionId}/success`,
        cancel_url: `${baseUrl}/compatibility/checkout/${submissionId}`
      }
    }

    const orderResponse = await fetch(`${apiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    })
    const orderData = await orderResponse.json()

    if (!orderResponse.ok || !orderData.id) {
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
    }

    await supabase.from('compatibility_payments').insert({
      submission_id: submissionId,
      paypal_order_id: orderData.id,
      amount: 14.99,
      currency: 'USD',
      status: 'pending'
    })

    const approvalUrl = orderData.links.find((link: { rel: string }) => link.rel === 'approve')?.href
    return NextResponse.json({ id: orderData.id, approvalUrl, success: true })
  } catch (error) {
    console.error('[v0] Compatibility PayPal create-order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
