import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Use Sandbox credentials (paypalclientidSandbox, paypalsecretkeySandbox)
// Fallback to live credentials if sandbox not available
const PAYPAL_CLIENT_ID = process.env.paypalclientidSandbox || process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.paypalsecretkeySandbox || process.env.PAYPAL_CLIENT_SECRET

// Use Sandbox API when sandbox credentials are available
const USE_SANDBOX = !!process.env.paypalclientidSandbox
const PAYPAL_API_URL = USE_SANDBOX
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  
  const data = await response.json()
  return data.access_token
}

function getBaseUrl(request: Request): string {
  // Try to get URL from request headers first (works in any environment)
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  
  if (host) {
    return `${protocol}://${host}`
  }
  
  // Fallback to env variable
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
      return NextResponse.json(
        { error: 'Missing submission ID' },
        { status: 400 }
      )
    }
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('[v0] PayPal credentials not configured: CLIENT_ID=%s, SECRET=%s', 
        PAYPAL_CLIENT_ID ? 'SET' : 'MISSING', 
        PAYPAL_CLIENT_SECRET ? 'SET' : 'MISSING')
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }
    
    console.log('[v0] PayPal API URL:', PAYPAL_API_URL)
    console.log('[v0] PayPal mode:', process.env.PAYPAL_MODE || 'live')
    
    const supabase = await createClient()
    
    // Verify submission exists
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, name')
      .eq('id', submissionId)
      .single()
    
    if (fetchError || !submission) {
      console.error('[v0] Submission not found:', submissionId, fetchError)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    // Get PayPal access token
    console.log('[v0] Requesting PayPal access token...')
    const accessToken = await getPayPalAccessToken()
    
    if (!accessToken) {
      console.error('[v0] Failed to get PayPal access token')
      return NextResponse.json(
        { error: 'Failed to authenticate with PayPal' },
        { status: 500 }
      )
    }
    
    console.log('[v0] Access token received, creating order...')
    
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
    
    console.log('[v0] PayPal order payload:', JSON.stringify(orderPayload, null, 2))
    
    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    })
    
    const orderData = await orderResponse.json()
    
    console.log('[v0] PayPal response status:', orderResponse.status)
    console.log('[v0] PayPal response data:', JSON.stringify(orderData, null, 2))
    
    if (!orderResponse.ok) {
      console.error('[v0] PayPal order creation failed:', {
        status: orderResponse.status,
        data: orderData
      })
      return NextResponse.json(
        { 
          error: 'Failed to create payment order',
          details: orderData.message || orderData.details?.[0]?.issue || 'Unknown error'
        },
        { status: 500 }
      )
    }
    
    if (!orderData.id) {
      console.error('[v0] No order ID in response:', orderData)
      return NextResponse.json(
        { error: 'Invalid response from PayPal' },
        { status: 500 }
      )
    }
    
    // Store pending payment in database
    await supabase
      .from('payments')
      .insert({
        submission_id: submissionId,
        paypal_order_id: orderData.id,
        amount: 9.99,
        currency: 'USD',
        status: 'pending'
      })
    
    // Find approval URL
    const approvalUrl = orderData.links.find((link: { rel: string }) => link.rel === 'approve')?.href
    
    console.log('[v0] PayPal order created successfully:', orderData.id)
    console.log('[v0] PayPal approval URL:', approvalUrl)
    
    return NextResponse.json({
      id: orderData.id,
      approvalUrl,
      success: true
    })
  } catch (error) {
    console.error('[v0] PayPal create order error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
