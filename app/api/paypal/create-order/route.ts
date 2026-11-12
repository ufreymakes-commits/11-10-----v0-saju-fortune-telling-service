import { NextResponse } from 'next/server'
import { getPayPalConfig } from '@/lib/paypal'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PRICE_USD, getPayPalAccessToken, settlePayment } from '@/lib/payments/paypal-orders'

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

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    const { clientId, clientSecret, apiUrl } = getPayPalConfig()

    if (!clientId || !clientSecret) {
      console.error('[v0] payments: PayPal credentials not configured')
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('id, name')
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      console.error('[v0] payments: submission not found', submissionId)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Already paid? Never create a second order.
    const { data: completed } = await admin
      .from('payments')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .limit(1)

    if (completed && completed.length > 0) {
      return NextResponse.json({ success: true, alreadyPaid: true })
    }

    // A pending order may actually have been approved/captured already: settle it first.
    const { data: pendingRows } = await admin
      .from('payments')
      .select('paypal_order_id')
      .eq('submission_id', submissionId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3)

    for (const pending of pendingRows ?? []) {
      const settled = await settlePayment(pending.paypal_order_id as string, 'browser')
      if (settled.state === 'completed' || settled.state === 'duplicate') {
        return NextResponse.json({ success: true, alreadyPaid: true })
      }
    }

    const accessToken = await getPayPalAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to authenticate with PayPal' }, { status: 500 })
    }

    const baseUrl = getBaseUrl(request)
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: submissionId,
          description: `Sajume 99 Facts Birth Chart Report for ${submission.name}`,
          amount: {
            currency_code: 'USD',
            value: PRICE_USD,
          },
        },
      ],
      application_context: {
        brand_name: 'Sajume',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${baseUrl}/checkout/${submissionId}/success`,
        cancel_url: `${baseUrl}/checkout/${submissionId}`,
      },
    }

    const orderResponse = await fetch(`${apiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
      signal: AbortSignal.timeout(20_000),
    })

    const orderData = await orderResponse.json()

    if (!orderResponse.ok || !orderData.id) {
      console.error('[v0] payments: PayPal order creation failed http', orderResponse.status)
      return NextResponse.json(
        { error: 'Failed to create payment order. Please try again.' },
        { status: 500 },
      )
    }

    const { error: insertError } = await admin.from('payments').insert({
      submission_id: submissionId,
      paypal_order_id: orderData.id,
      amount: Number(PRICE_USD),
      currency: 'USD',
      status: 'pending',
    })

    if (insertError) {
      console.error(`[v0] payments: INSERT FAILED order=${orderData.id} code=${insertError.code} msg=${insertError.message}`)
      return NextResponse.json(
        { error: 'We could not start your payment just now. You have not been charged. Please try again in a moment.' },
        { status: 500 },
      )
    }

    const approvalUrl = orderData.links?.find((link: { rel: string }) => link.rel === 'approve')?.href
    if (!approvalUrl) {
      console.error('[v0] payments: no approval URL for order', orderData.id)
      return NextResponse.json({ error: 'Invalid response from PayPal' }, { status: 500 })
    }

    console.log('[v0] payments: order created', orderData.id)
    return NextResponse.json({ id: orderData.id, approvalUrl, success: true })
  } catch (error) {
    console.error('[v0] payments: create order error:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
