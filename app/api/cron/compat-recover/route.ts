// 궁합 v2 복구 크론. 결제는 끝났는데 리포트가 안 만들어진 건(탭을 닫았거나 생성 실패)을 한 번에 1건씩 다시 생성한다.
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { claimCompatGeneration, getCompatState, runCompatGeneration, COMPAT_SECTION_KEY } from '@/lib/compat/run-generation'
import { getCompatModelConfig } from '@/lib/compat/model-config'

export const maxDuration = 300

const WINDOW_HOURS = 24
// 막 결제한 건은 클라이언트가 생성 중일 수 있으니 건드리지 않는다.
const MIN_AGE_MINUTES = 8

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const since = new Date(Date.now() - WINDOW_HOURS * 3_600_000).toISOString()
  const olderThan = new Date(Date.now() - MIN_AGE_MINUTES * 60_000).toISOString()

  const { data: payments, error } = await supabase
    .from('compatibility_payments')
    .select('submission_id, created_at')
    .eq('status', 'completed')
    .gte('created_at', since)
    .lte('created_at', olderThan)
    .order('created_at', { ascending: true })
    .limit(50)
  if (error) {
    console.error('[v0] compat-recover payments query failed:', error.message)
    return NextResponse.json({ error: 'query failed' }, { status: 500 })
  }

  const candidates = [...new Set((payments ?? []).map((p) => p.submission_id as string))]
  for (const submissionId of candidates) {
    const { state } = await getCompatState(supabase, submissionId)
    if (state === 'done' || state === 'generating') continue

    const claim = await claimCompatGeneration(supabase, submissionId)
    if (claim !== 'claimed') continue

    console.log('[v0] compat-recover regenerating', submissionId, `prev=${state}`)
    try {
      await runCompatGeneration(submissionId, getCompatModelConfig())
      return NextResponse.json({ recovered: submissionId, section: COMPAT_SECTION_KEY })
    } catch (e: any) {
      return NextResponse.json({ failed: submissionId, error: String(e?.message ?? e) }, { status: 500 })
    }
  }

  return NextResponse.json({ recovered: null, checked: candidates.length })
}
