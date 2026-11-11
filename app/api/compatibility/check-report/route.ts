// 궁합 리포트 상태 확인 (폴링용). state: 'done' | 'generating' | 'failed' | 'none'
// facts 는 예전 클라이언트 호환을 위해 done 일 때만 같이 돌려준다.
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCompatState } from '@/lib/compat/run-generation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const submissionId = new URL(request.url).searchParams.get('submissionId')
  if (!submissionId) return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 })
  try {
    const { state, row } = await getCompatState(createAdminClient(), submissionId)
    return NextResponse.json({ state, facts: state === 'done' ? row?.facts ?? null : null })
  } catch (e) {
    console.error('[v0] compat check-report error', e)
    return NextResponse.json({ state: 'none', facts: null })
  }
}
