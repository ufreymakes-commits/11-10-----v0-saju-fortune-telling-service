import { after } from 'next/server'
import { getPayPalConfig } from '@/lib/paypal'
import { createAdminClient } from '@/lib/supabase/server'
import { paidReportUrl } from '@/lib/payments/base-url'
import { startServerGeneration } from '@/lib/payments/start-generation'
import { sendPaymentConfirmationEmail } from '@/lib/email/payment-confirmation'

// Single source of truth per product: used for the PayPal order, the stored payment row and the capture check.
export const PRICE_USD = '19.99'
export const COMPAT_PRICE_USD = '19.99'
export const GUMIHO_PRICE_USD = '9.99'

const REQUEST_TIMEOUT_MS = 20_000
const ORDER_NOT_APPROVED_FAIL_AFTER_MS = 3 * 60 * 60 * 1000

export type SettleSource = 'browser' | 'webhook' | 'cron'
export type SettleState = 'completed' | 'pending' | 'failed' | 'duplicate'
export interface SettleResult {
  state: SettleState
  changed: boolean
  submissionId: string | null
}

type PayPalResponse = { status: number; body: any } | null // null = network error / timeout

// ---------------------------------------------------------------------------
// PayPal REST helpers
// ---------------------------------------------------------------------------

export async function getPayPalAccessToken(): Promise<string | null> {
  const { clientId, clientSecret, apiUrl } = getPayPalConfig()
  if (!clientId || !clientSecret) {
    console.error('[v0] payments: PayPal credentials missing')
    return null
  }
  try {
    const res = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error('[v0] payments: PayPal auth failed http', res.status)
      return null
    }
    const data = await res.json()
    return (data.access_token as string) ?? null
  } catch (e) {
    console.error('[v0] payments: PayPal auth error:', e instanceof Error ? e.message : 'unknown')
    return null
  }
}

async function paypalRequest(
  path: string,
  token: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; requestId?: string } = {},
): Promise<PayPalResponse> {
  const { apiUrl } = getPayPalConfig()
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.requestId ? { 'PayPal-Request-Id': init.requestId } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const body = await res.json().catch(() => ({}))
    return { status: res.status, body }
  } catch (e) {
    console.error('[v0] payments: PayPal request error:', e instanceof Error ? e.message : 'unknown')
    return null
  }
}

export async function getOrder(orderId: string, token: string) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, token)
}

export async function captureOrder(orderId: string, token: string) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, token, {
    method: 'POST',
    body: {},
    requestId: `capture-${orderId}`,
  })
}

export async function refundCapture(captureId: string): Promise<boolean> {
  const token = await getPayPalAccessToken()
  if (!token) return false
  const res = await paypalRequest(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, token, {
    method: 'POST',
    body: {},
    requestId: `refund-${captureId}`,
  })
  return Boolean(res && res.status >= 200 && res.status < 300)
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function runAfter(task: () => Promise<unknown>) {
  const safe = () => task().catch((e) => console.error('[v0] payments: background task failed:', e instanceof Error ? e.message : 'unknown'))
  try {
    after(safe)
  } catch {
    void safe()
  }
}

function extractCapture(order: any) {
  const captures: any[] = order?.purchase_units?.[0]?.payments?.captures ?? []
  return captures.find((c) => c?.status === 'COMPLETED') ?? captures[0] ?? null
}

function issuesOf(body: any): string[] {
  const details: Array<{ issue?: string }> = Array.isArray(body?.details) ? body.details : []
  return details.map((d) => d.issue ?? '').filter(Boolean)
}

function isMissingColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === 'PGRST204' || error.code === '42703' || /column .* (does not exist|of 'payments')/i.test(error.message ?? '')
}

function log(orderId: string, source: SettleSource, state: string, extra = '') {
  console.log(`[v0] payments: settle order=${orderId} source=${source} state=${state}${extra ? ' ' + extra : ''}`)
}

// ---------------------------------------------------------------------------
// settlePayment: idempotent, safe to call many times from browser/webhook/cron
// ---------------------------------------------------------------------------

export async function settlePayment(orderId: string, source: SettleSource): Promise<SettleResult> {
  const admin = createAdminClient()

  const { data: row, error: rowError } = await admin
    .from('payments')
    .select('id, submission_id, status, created_at')
    .eq('paypal_order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (rowError) {
    console.error('[v0] payments: lookup failed', orderId, rowError.message)
    return { state: 'pending', changed: false, submissionId: null }
  }
  if (!row) {
    log(orderId, source, 'unknown-order')
    return { state: 'failed', changed: false, submissionId: null }
  }

  const submissionId = row.submission_id as string
  const result = (state: SettleState, changed = false): SettleResult => ({ state, changed, submissionId })

  if (row.status === 'completed') return result('completed')
  if (row.status === 'duplicate_paid') return result('duplicate')
  if (row.status === 'refunded') return result('failed')

  const ageMs = Date.now() - new Date(row.created_at).getTime()

  const markFailed = async (reason: string) => {
    await admin.from('payments').update({ status: 'failed' }).eq('id', row.id).in('status', ['pending', 'failed'])
    log(orderId, source, 'failed', `reason=${reason}`)
    return result('failed')
  }

  const token = await getPayPalAccessToken()
  if (!token) return result('pending')

  let order = await getOrder(orderId, token)
  if (!order || order.status >= 500) return result('pending')
  if (order.status >= 400) {
    log(orderId, source, 'pending', `getOrder http=${order.status}`)
    return result('pending')
  }

  if (order.body?.status === 'VOIDED') return markFailed('order-voided')

  let capture = extractCapture(order.body)

  if (!capture) {
    if (order.body?.status === 'APPROVED') {
      const cap = await captureOrder(orderId, token)
      if (!cap || cap.status >= 500) return result('pending')

      if (cap.status >= 200 && cap.status < 300) {
        capture = extractCapture(cap.body)
      } else {
        const issues = issuesOf(cap.body)
        if (issues.includes('ORDER_ALREADY_CAPTURED') || issues.includes('ORDER_ALREADY_COMPLETED')) {
          const again = await getOrder(orderId, token)
          if (!again || again.status >= 400) return result('pending')
          capture = extractCapture(again.body)
        } else if (issues.includes('INSTRUMENT_DECLINED')) {
          return markFailed('instrument-declined')
        } else if (issues.includes('ORDER_NOT_APPROVED') && ageMs > ORDER_NOT_APPROVED_FAIL_AFTER_MS) {
          return markFailed('order-not-approved-expired')
        } else {
          log(orderId, source, 'pending', `capture http=${cap.status} issues=${issues.join(',') || 'none'}`)
          return result('pending')
        }
      }
    } else if (ageMs > ORDER_NOT_APPROVED_FAIL_AFTER_MS) {
      return markFailed(`order-${String(order.body?.status ?? 'unknown').toLowerCase()}-expired`)
    } else {
      return result('pending')
    }
  }

  if (!capture) return result('pending')

  if (capture.status === 'DECLINED' || capture.status === 'FAILED') return markFailed(`capture-${capture.status.toLowerCase()}`)
  if (capture.status !== 'COMPLETED') {
    log(orderId, source, 'pending', `capture-status=${capture.status}`)
    return result('pending')
  }

  const amountOk =
    Number(capture.amount?.value) === Number(PRICE_USD) && capture.amount?.currency_code === 'USD'
  if (!amountOk) {
    console.error(
      `[v0] payments: AMOUNT MISMATCH order=${orderId} amount=${capture.amount?.value} currency=${capture.amount?.currency_code}`,
    )
    return result('pending')
  }

  const captureId = (capture.id as string | undefined) ?? null

  // Duplicate protection: another completed payment already exists for this submission.
  const { data: others } = await admin
    .from('payments')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('status', 'completed')
    .neq('id', row.id)
    .limit(1)

  if (others && others.length > 0) {
    console.error(`[v0] payments: DUPLICATE PAYMENT ${orderId}`)
    let nextStatus: 'duplicate_paid' | 'refunded' = 'duplicate_paid'
    if (process.env.PAYPAL_AUTO_REFUND_DUPLICATES === 'true' && captureId) {
      if (await refundCapture(captureId)) nextStatus = 'refunded'
    }
    const dupUpdate = await admin
      .from('payments')
      .update({ status: nextStatus, paypal_capture_id: captureId })
      .eq('id', row.id)
      .neq('status', 'completed')
    if (isMissingColumn(dupUpdate.error)) {
      await admin.from('payments').update({ status: nextStatus }).eq('id', row.id).neq('status', 'completed')
    }
    return result('duplicate')
  }

  const payerCountry =
    order.body?.payer?.address?.country_code ?? capture?.payer?.address?.country_code ?? null
  const baseFields = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    payer_country: payerCountry,
    report_url: paidReportUrl(submissionId),
  }

  let update = await admin
    .from('payments')
    .update({ ...baseFields, paypal_capture_id: captureId })
    .eq('id', row.id)
    .neq('status', 'completed')
    .select('id')

  if (isMissingColumn(update.error)) {
    console.error('[v0] payments: paypal_capture_id column missing; run scripts/020_payments_hardening.sql')
    update = await admin.from('payments').update(baseFields).eq('id', row.id).neq('status', 'completed').select('id')
  }

  if (update.error) {
    console.error(`[v0] payments: completing update FAILED order=${orderId} code=${update.error.code} msg=${update.error.message}`)
    return result('pending')
  }

  if (!update.data || update.data.length === 0) {
    // Someone else (webhook / browser) completed it between our read and write.
    return result('completed')
  }

  log(orderId, source, 'completed', 'changed=true')

  runAfter(() => sendPaymentConfirmationEmail(row.id as string))
  if (source === 'webhook') {
    runAfter(() => startServerGeneration(submissionId, 'webhook'))
  }

  return result('completed', true)
}

// ---------------------------------------------------------------------------
// captureAndVerifyOrder: capture (if needed) and verify amount/currency/reference
// for the Compatibility and Gumiho flows. Never returns 'paid' unless PayPal
// reports a COMPLETED capture of exactly the expected USD amount for the
// expected reference_id.
// ---------------------------------------------------------------------------

export type VerifiedCapture =
  | { state: 'paid'; captureId: string | null; payerCountry: string | null }
  | { state: 'pending' }
  | { state: 'failed'; reason: string }
  | { state: 'mismatch'; reason: string }

export async function captureAndVerifyOrder(
  orderId: string,
  expected: { amountUsd: string; referenceId: string },
): Promise<VerifiedCapture> {
  const token = await getPayPalAccessToken()
  if (!token) return { state: 'pending' }

  const order = await getOrder(orderId, token)
  if (!order || order.status >= 400) {
    console.error(`[v0] payments: verify getOrder unavailable order=${orderId} http=${order?.status ?? 'network'}`)
    return { state: 'pending' }
  }
  if (order.body?.status === 'VOIDED') return { state: 'failed', reason: 'order-voided' }

  const referenceId = order.body?.purchase_units?.[0]?.reference_id ?? null
  let capture = extractCapture(order.body)
  let payer = order.body?.payer

  if (!capture) {
    if (order.body?.status !== 'APPROVED') return { state: 'pending' }

    const cap = await captureOrder(orderId, token)
    if (!cap || cap.status >= 500) return { state: 'pending' }

    if (cap.status >= 200 && cap.status < 300) {
      capture = extractCapture(cap.body)
      payer = cap.body?.payer ?? payer
    } else {
      const issues = issuesOf(cap.body)
      if (issues.includes('ORDER_ALREADY_CAPTURED') || issues.includes('ORDER_ALREADY_COMPLETED')) {
        const again = await getOrder(orderId, token)
        if (!again || again.status >= 400) return { state: 'pending' }
        capture = extractCapture(again.body)
        payer = again.body?.payer ?? payer
      } else if (issues.includes('INSTRUMENT_DECLINED')) {
        return { state: 'failed', reason: 'instrument-declined' }
      } else {
        console.error(`[v0] payments: verify capture http=${cap.status} order=${orderId} issues=${issues.join(',') || 'none'}`)
        return { state: 'pending' }
      }
    }
  }

  if (!capture) return { state: 'pending' }
  if (capture.status === 'DECLINED' || capture.status === 'FAILED') {
    return { state: 'failed', reason: `capture-${String(capture.status).toLowerCase()}` }
  }
  if (capture.status !== 'COMPLETED') return { state: 'pending' }

  const capturedCents = Math.round(Number(capture.amount?.value) * 100)
  const expectedCents = Math.round(Number(expected.amountUsd) * 100)
  const currency = capture.amount?.currency_code
  if (!Number.isFinite(capturedCents) || capturedCents !== expectedCents || currency !== 'USD') {
    const reason = `amount expected=${expected.amountUsd} USD captured=${capture.amount?.value} ${currency}`
    console.error(`[v0] payments: AMOUNT MISMATCH order=${orderId} ${reason}`)
    return { state: 'mismatch', reason }
  }
  if (referenceId !== expected.referenceId) {
    const reason = `reference expected=${expected.referenceId} order=${referenceId}`
    console.error(`[v0] payments: REFERENCE MISMATCH order=${orderId} ${reason}`)
    return { state: 'mismatch', reason }
  }

  return {
    state: 'paid',
    captureId: (capture.id as string | undefined) ?? null,
    payerCountry: payer?.address?.country_code ?? capture?.payer?.address?.country_code ?? null,
  }
}
