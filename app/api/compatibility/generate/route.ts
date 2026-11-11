// 궁합 리포트 생성 (v2). 결제 확인 → 잠금 → 202 즉시 응답 → after() 에서 생성.
// COMPAT_PIPELINE=legacy 이면 예전 코드(lib/compat/legacy-generate.ts)를 그대로 쓴다.
import { NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { claimCompatGeneration, runCompatGeneration } from '@/lib/compat/run-generation'
import { getCompatModelConfig } from '@/lib/compat/model-config'
import { legacyGenerateCompatibility } from '@/lib/compat/legacy-generate'

export const maxDuration = 300

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    if (!submissionId || !UUID.test(submissionId)) return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })

    if (process.env.COMPAT_PIPELINE === 'legacy') {
      console.log('[v0] compat pipeline: legacy')
      return legacyGenerateCompatibility(submissionId)
    }

    const supabase = createAdminClient()
    const { data: payment } = await supabase
      .from('compatibility_payments')
      .select('status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .limit(1)
    if (!payment?.length) return NextResponse.json({ error: 'Payment not completed' }, { status: 403 })

    const claim = await claimCompatGeneration(supabase, submissionId)
    if (claim === 'done') return NextResponse.json({ success: true, status: 'done' })
    if (claim === 'in_progress') return NextResponse.json({ success: true, status: 'in_progress' }, { status: 202 })

    console.log('[v0] compat pipeline: v2 started', submissionId)
    after(async () => {
      try {
        await runCompatGeneration(submissionId, getCompatModelConfig())
      } catch {
        // runCompatGeneration 이 status='failed' 와 로그를 남긴다. 다음 요청(Try again·페이지 열기·크론)이 다시 시도한다.
      }
    })
    return NextResponse.json({ success: true, status: 'started' }, { status: 202 })
  } catch (error) {
    console.error('[v0] Generate compatibility error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
