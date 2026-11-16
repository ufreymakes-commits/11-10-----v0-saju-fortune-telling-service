import { NextResponse } from 'next/server'
import { getPayPalConfig } from '@/lib/paypal'
import { createAdminClient } from '@/lib/supabase/server'
import { COMPAT_PRICE_USD, COMPAT_BUYER_PRICE_USD, captureAndVerifyOrder } from '@/lib/payments/paypal-orders'
import { offerIdFromCustomId, redeemBuyerOffer } from '@/lib/payments/buyer-offer'
import { sendCompatConfirmationEmail, wasCompatConfirmationEmailSent } from '@/lib/email/compat-confirmation'

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
    const { orderId } = await request.json()
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
    }

    const { clientId, clientSecret } = getPayPalConfig()
    if (!clientId || !clientSecret) return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })

    const supabase = createAdminClient()

    // The order must belong to a payment row we created; its submission is the only one this order can unlock.
    const { data: row, error: rowError } = await supabase
      .from('compatibility_payments')
      .select('id, status, submission_id, amount')
      .eq('paypal_order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rowError) {
      console.error('[v0] Compatibility capture: payment lookup failed', orderId, rowError.message)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    if (!row) {
      console.error('[v0] Compatibility capture: unknown order, not capturing', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Idempotency guard: an already completed order never goes back through PayPal.
    if (row.status === 'completed') {
      return NextResponse.json({
        success: true,
        submissionId: row.submission_id,
        emailSent: await wasCompatConfirmationEmailSent(row.id as string),
      })
    }

    const submissionId = row.submission_id as string

    // The amount stored when the order was created is the only amount PayPal's capture may match.
    const storedUsd = row.amount == null ? COMPAT_PRICE_USD : Number(row.amount).toFixed(2)
    if (storedUsd !== COMPAT_PRICE_USD && storedUsd !== COMPAT_BUYER_PRICE_USD) {
      console.error(`[v0] Compatibility capture REJECTED order=${orderId} unexpected stored amount=${storedUsd}`)
      return NextResponse.json({ error: 'Payment could not be verified. Please contact support.' }, { status: 400 })
    }

    const result = await captureAndVerifyOrder(orderId, {
      amountUsd: storedUsd,
      referenceId: submissionId,
    })

    if (result.state === 'pending') {
      return NextResponse.json(
        { success: false, pending: true, error: 'Payment is still being confirmed. Please refresh in a minute.' },
        { status: 202 },
      )
    }

    if (result.state === 'mismatch') {
      console.error(`[v0] Compatibility capture REJECTED order=${orderId} submission=${submissionId} ${result.reason}`)
      return NextResponse.json({ error: 'Payment could not be verified. Please contact support.' }, { status: 400 })
    }

    if (result.state === 'failed') {
      console.error(`[v0] Compatibility capture failed order=${orderId} reason=${result.reason}`)
      // Never downgrade an already-completed payment.
      await supabase
        .from('compatibility_payments')
        .update({ status: 'failed' })
        .eq('paypal_order_id', orderId)
        .neq('status', 'completed')
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 400 })
    }

    // Redeem before marking completed so a failure here is retried on the next capture call (both steps are idempotent).
    if (storedUsd === COMPAT_BUYER_PRICE_USD) {
      const offerId = offerIdFromCustomId(result.customId)
      if (!offerId) {
        console.error(`[v0] Compatibility capture: buyer-priced order without offer reference order=${orderId}`)
        return NextResponse.json({ error: 'Payment could not be verified. Please contact support.' }, { status: 400 })
      }
      if (!(await redeemBuyerOffer(offerId, row.id as string))) {
        return NextResponse.json({ error: 'Could not record payment. Please refresh and try again.' }, { status: 500 })
      }
    }

    const { error: updateError } = await supabase
      .from('compatibility_payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        payer_country: result.payerCountry,
        report_url: `${getBaseUrl(request)}/compatibility/report/${submissionId}/paid`,
      })
      .eq('paypal_order_id', orderId)
      .neq('status', 'completed')

    if (updateError) {
      console.error('[v0] Compatibility payment update error:', updateError)
      return NextResponse.json({ error: 'Could not record payment. Please refresh and try again.' }, { status: 500 })
    }

    // Best effort and idempotent: sendCompatConfirmationEmail never throws and never blocks the report.
    const emailSent = await sendCompatConfirmationEmail({
      paymentId: row.id as string,
      submissionId,
      to: result.payerEmail,
    })

    return NextResponse.json({ success: true, submissionId, emailSent })
  } catch (error) {
    console.error('[v0] Compatibility PayPal capture error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
