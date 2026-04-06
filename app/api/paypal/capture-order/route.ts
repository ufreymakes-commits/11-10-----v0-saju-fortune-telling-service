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
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing order ID' },
        { status: 400 }
      )
    }
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }
    
    const supabase = await createClient()
    
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    
    // Capture the order
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    const captureData = await captureResponse.json()
    
    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('[v0] PayPal capture failed:', captureData)
      
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('paypal_order_id', orderId)
      
      return NextResponse.json(
        { error: 'Payment capture failed' },
        { status: 400 }
      )
    }
    
    // Update payment status to completed
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
    
    return NextResponse.json({
      success: true,
      submissionId: payment?.submission_id
    })
  } catch (error) {
    console.error('[v0] PayPal capture error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
