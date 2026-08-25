import { NextResponse } from 'next/server'
import { getPayPalConfig } from '@/lib/paypal'
import { createClient } from '@/lib/supabase/server'

async function getPayPalAccessToken() {
  const { clientId, clientSecret, apiUrl } = getPayPalConfig()

  if (!clientId || !clientSecret) {
    console.error('[v0] Gumiho PayPal credentials missing!')
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
    if (!response.ok) {
      console.error('[v0] Gumiho PayPal auth failed:', data)
      return null
    }
    return data.access_token as string
  } catch (error) {
    console.error('[v0] Gumiho PayPal auth error:', error)
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
    const { gumihoQuestionId, submissionId } = await request.json()

    if (!gumihoQuestionId || !submissionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { clientId, clientSecret, apiUrl } = getPayPalConfig()

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    const supabase = await createClient()

    // Verify gumiho question exists
    const { data: gumihoQuestion, error: fetchError } = await supabase
      .from('gumiho_questions')
      .select('id, submission_id')
      .eq('id', gumihoQuestionId)
      .single()

    if (fetchError || !gumihoQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Get submission name for description
    const { data: submission } = await supabase
      .from('submissions')
      .select('name')
      .eq('id', submissionId)
      .single()

    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to authenticate with PayPal' }, { status: 500 })
    }

    const baseUrl = getBaseUrl(request)
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: gumihoQuestionId,
        description: `Ask the Gumiho 1:1 - 3 Questions for ${submission?.name || 'User'}`,
        amount: {
          currency_code: 'USD',
          value: '9.99'
        }
      }],
      application_context: {
        brand_name: 'Sajume',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${baseUrl}/ask-gumiho/${submissionId}/success?questionId=${gumihoQuestionId}`,
        cancel_url: `${baseUrl}/ask-gumiho/${submissionId}/checkout?questionId=${gumihoQuestionId}`
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

    if (!orderResponse.ok || !orderData.id) {
      console.error('[v0] Gumiho PayPal order creation failed:', orderData)
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
    }

    // Save payment record
    await supabase.from('gumiho_payments').insert({
      gumiho_question_id: gumihoQuestionId,
      submission_id: submissionId,
      paypal_order_id: orderData.id,
      amount: 9.99,
      currency: 'USD',
      status: 'pending'
    })

    const approvalUrl = orderData.links.find((link: { rel: string }) => link.rel === 'approve')?.href

    return NextResponse.json({ id: orderData.id, approvalUrl, success: true })
  } catch (error) {
    console.error('[v0] Gumiho PayPal create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
