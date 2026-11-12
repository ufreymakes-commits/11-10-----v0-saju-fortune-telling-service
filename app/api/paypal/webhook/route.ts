import { NextResponse } from 'next/server'
import { getPayPalConfig } from '@/lib/paypal'
import { createAdminClient } from '@/lib/supabase/server'
import { PRICE_USD, getPayPalAccessToken, settlePayment } from '@/lib/payments/paypal-orders'

// Needed because settlePayment starts report generation through after() for webhook events.
export const maxDuration = 300

async function verifySignature(request: Request, event: unknown): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error('[v0] payments: webhook rejected, PAYPAL_WEBHOOK_ID is not set')
    return false
  }

  const h = request.headers
  const authAlgo = h.get('paypal-auth-algo')
  const certUrl = h.get('paypal-cert-url')
  const transmissionId = h.get('paypal-transmission-id')
  const transmissionSig = h.get('paypal-transmission-sig')
  const transmissionTime = h.get('paypal-transmission-time')
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) return false

  const token = await getPayPalAccessToken()
  if (!token) return false

  try {
    const { apiUrl } = getPayPalConfig()
    const res = await fetch(`${apiUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.verification_status === 'SUCCESS'
  } catch (e) {
    console.error('[v0] payments: webhook verify error:', e instanceof Error ? e.message : 'unknown')
    return false
  }
}

function orderIdFromResource(resource: any): string | null {
  return resource?.supplementary_data?.related_ids?.order_id ?? null
}

async function markRefunded(resource: any, eventType: string) {
  const admin = createAdminClient()

  // Ignore partial refunds: the buyer still owns the report.
  if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
    const refunded = Number(resource?.amount?.value)
    if (Number.isFinite(refunded) && refunded < Number(PRICE_USD)) {
      console.log('[v0] payments: partial refund ignored')
      return
    }
  }

  const orderId = orderIdFromResource(resource)
  const upLink = Array.isArray(resource?.links) ? resource.links.find((l: any) => l.rel === 'up')?.href : null
  const captureFromLink = typeof upLink === 'string' ? upLink.split('/captures/')[1]?.split(/[/?]/)[0] : null
  const captureIds = [captureFromLink, resource?.id].filter(Boolean) as string[]

  let paymentId: string | null = null

  if (orderId) {
    const { data } = await admin.from('payments').select('id').eq('paypal_order_id', orderId).limit(1).maybeSingle()
    paymentId = (data?.id as string | undefined) ?? null
  }
  if (!paymentId && captureIds.length > 0) {
    const { data } = await admin.from('payments').select('id').in('paypal_capture_id', captureIds).limit(1).maybeSingle()
    paymentId = (data?.id as string | undefined) ?? null
  }

  if (!paymentId) {
    console.log(`[v0] payments: ${eventType} for unknown payment`)
    return
  }

  const { error } = await admin.from('payments').update({ status: 'refunded' }).eq('id', paymentId)
  if (error) console.error('[v0] payments: refund update failed', error.message)
  else console.log(`[v0] payments: marked refunded payment=${paymentId} event=${eventType}`)
}

export async function POST(request: Request) {
  let eventId: string | null = null
  try {
    const raw = await request.text()
    let event: any
    try {
      event = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (!(await verifySignature(request, event))) {
      console.error('[v0] payments: webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    eventId = typeof event?.id === 'string' ? event.id : null
    const eventType: string = event?.event_type ?? ''
    const admin = createAdminClient()

    if (eventId) {
      const { error: dedupeError } = await admin
        .from('paypal_webhook_events')
        .insert({ event_id: eventId, event_type: eventType })
      if (dedupeError?.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true })
      }
      if (dedupeError) {
        // Table missing or unreachable: carry on, settlePayment is idempotent anyway.
        console.error('[v0] payments: webhook dedupe insert failed', dedupeError.code)
        eventId = null
      }
    }

    const resource = event?.resource

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = eventType === 'CHECKOUT.ORDER.APPROVED' ? resource?.id : orderIdFromResource(resource)
      if (orderId) {
        await settlePayment(orderId as string, 'webhook')
      } else {
        console.log(`[v0] payments: ${eventType} without order id, ignored`)
      }
    } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED' || eventType === 'PAYMENT.CAPTURE.REVERSED') {
      await markRefunded(resource, eventType)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] payments: webhook error:', error instanceof Error ? error.message : 'unknown')
    // Let PayPal retry: forget the dedupe row so the retry is processed.
    if (eventId) {
      try {
        await createAdminClient().from('paypal_webhook_events').delete().eq('event_id', eventId)
      } catch {
        /* nothing else to do */
      }
    }
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
