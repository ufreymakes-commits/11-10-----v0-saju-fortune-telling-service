import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

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
      console.error('[v0] PayPal credentials not configured')
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }
    
    const supabase = await createClient()
    
    // Verify submission exists
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, name')
      .eq('id', submissionId)
      .single()
    
    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    
    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
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
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/${submissionId}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/${submissionId}`
        }
      })
    })
    
    const orderData = await orderResponse.json()
    
    if (!orderResponse.ok) {
      console.error('[v0] PayPal order creation failed:', orderData)
      return NextResponse.json(
        { error: 'Failed to create payment order' },
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
    
    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl
    })
  } catch (error) {
    console.error('[v0] PayPal create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
