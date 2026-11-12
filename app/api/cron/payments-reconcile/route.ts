// 유료 리포트 결제 복구 크론. (1) 오래 pending 인 결제를 PayPal 과 대조해 확정하고, (2) 결제는 됐는데 리포트가 없는 건을 서버에서 다시 생성한다.
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { settlePayment } from '@/lib/payments/paypal-orders'
import { hasPaidReport, startServerGeneration } from '@/lib/payments/start-generation'

export const maxDuration = 300

const PENDING_MIN_AGE_MS = 3 * 60_000
const PENDING_MAX_AGE_MS = 48 * 3_600_000
const COMPLETED_MIN_AGE_MS = 8 * 60_000
const COMPLETED_MAX_AGE_MS = 24 * 3_600_000

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString()

  // 1. Reconcile stale pending payments.
  const { data: pending, error: pendingError } = await admin
    .from('payments')
    .select('paypal_order_id')
    .eq('status', 'pending')
    .lte('created_at', iso(PENDING_MIN_AGE_MS))
    .gte('created_at', iso(PENDING_MAX_AGE_MS))
    .order('created_at', { ascending: true })
    .limit(20)

  if (pendingError) console.error('[v0] payments-reconcile: pending query failed', pendingError.message)

  let reconciled = 0
  let completedNow = 0
  let generatedSubmission: string | null = null

  for (const row of pending ?? []) {
    const orderId = row.paypal_order_id as string
    const result = await settlePayment(orderId, 'cron')
    reconciled += 1
    await admin.from('payments').update({ reconciled_at: new Date().toISOString() }).eq('paypal_order_id', orderId)

    if (result.state === 'completed' && result.changed) {
      completedNow += 1
      // Generation is long-running: start at most one per run, the next run picks up the rest.
      if (!generatedSubmission && result.submissionId) {
        generatedSubmission = result.submissionId
        await startServerGeneration(result.submissionId, 'cron')
      }
    }
  }

  // 2. Completed payments whose report was never generated.
  if (!generatedSubmission) {
    const { data: completed, error: completedError } = await admin
      .from('payments')
      .select('submission_id')
      .eq('status', 'completed')
      .lte('completed_at', iso(COMPLETED_MIN_AGE_MS))
      .gte('completed_at', iso(COMPLETED_MAX_AGE_MS))
      .order('completed_at', { ascending: true })
      .limit(50)

    if (completedError) console.error('[v0] payments-reconcile: completed query failed', completedError.message)

    const candidates = [...new Set((completed ?? []).map((p) => p.submission_id as string))]
    const missing: string[] = []
    for (const submissionId of candidates) {
      if (!(await hasPaidReport(submissionId))) missing.push(submissionId)
    }

    if (missing.length > 0) {
      // Random pick so one stubborn failure cannot starve the others.
      generatedSubmission = missing[Math.floor(Math.random() * missing.length)]
      await startServerGeneration(generatedSubmission, 'cron')
    }
  }

  return NextResponse.json({ reconciled, completedNow, generated: generatedSubmission })
}
