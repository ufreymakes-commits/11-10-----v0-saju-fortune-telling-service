import { createAdminClient } from '@/lib/supabase/server'
import { getServerBaseUrl } from '@/lib/payments/base-url'

export type GenerationSource = 'webhook' | 'cron'

export async function hasPaidReport(submissionId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('reports')
    .select('facts')
    .eq('submission_id', submissionId)
    .eq('section_key', 'paid_full')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return Array.isArray(data?.facts) && data.facts.length > 5
}

/**
 * Starts the existing paid-report generation from the server (no browser needed).
 * 200 (cached) and 202 (already generating) both count as success.
 */
export async function startServerGeneration(submissionId: string, source: GenerationSource): Promise<boolean> {
  try {
    if (await hasPaidReport(submissionId)) return true

    console.log(`[v0] payments: server-side generation started ${submissionId} source=${source}`)
    const res = await fetch(`${getServerBaseUrl()}/api/generate-paid-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
      signal: AbortSignal.timeout(290_000),
    })
    const ok = res.ok || res.status === 202
    if (!ok) console.error(`[v0] payments: server-side generation failed ${submissionId} http=${res.status}`)
    return ok
  } catch (e) {
    console.error(`[v0] payments: server-side generation error ${submissionId}:`, e instanceof Error ? e.message : 'unknown')
    return false
  }
}
