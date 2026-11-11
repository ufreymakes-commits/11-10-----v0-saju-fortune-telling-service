// 궁합 v2 — 서버에서 한 건을 생성하고 저장한다. (잠금 → 사주 재계산 → 파이프라인 → 저장)
// route 는 claimCompatGeneration() 으로 잠금을 잡고, after() 안에서 runCompatGeneration() 을 부른다.
import { createAdminClient } from '@/lib/supabase/server'
import { calculateSaju } from '@/lib/saju-calculator'
import { refreshDecadeFortune } from '@/lib/saju/paid-context'
import type { BirthInfo } from '@/lib/types'
import { buildCompatInputs, cleanConcern, isRelationshipType } from './prompt-facts'
import { generateCompatReport, type CompatModelConfig } from './pipeline'

export const COMPAT_SECTION_KEY = 'compatibility_full'
export const LOCK_MINUTES = 6
type Supa = ReturnType<typeof createAdminClient>
export type CompatState = 'done' | 'generating' | 'failed' | 'none'

const hasFacts = (r: any) => Array.isArray(r?.facts) && r.facts.length > 0
const fresh = (r: any) => r?.status === 'generating' && r?.started_at && Date.now() - new Date(r.started_at).getTime() < LOCK_MINUTES * 60_000

async function rowsFor(supabase: Supa, submissionId: string) {
  const { data, error } = await supabase
    .from('compatibility_reports')
    .select('id, facts, status, started_at, error, score_board')
    .eq('submission_id', submissionId)
    .eq('section_key', COMPAT_SECTION_KEY)
  if (error) throw error
  return (data ?? []) as any[]
}

/** 화면·폴링용 상태. 예전(v1) 리포트도 facts 가 있으면 done. */
export async function getCompatState(supabase: Supa, submissionId: string): Promise<{ state: CompatState; row: any | null }> {
  const rows = await rowsFor(supabase, submissionId)
  const done = rows.find(hasFacts)
  if (done) return { state: 'done', row: done }
  const row = rows[0] ?? null
  if (!row) return { state: 'none', row: null }
  if (fresh(row)) return { state: 'generating', row }
  if (row.status === 'failed') return { state: 'failed', row }
  // generating 인데 6분이 넘었거나 status 가 비어 있음 → 죽은 작업. 다시 시작해도 된다.
  return { state: 'failed', row }
}

/** 잠금 잡기. 'claimed' 일 때만 생성을 시작한다. */
export async function claimCompatGeneration(supabase: Supa, submissionId: string): Promise<'claimed' | 'in_progress' | 'done'> {
  const { state, row } = await getCompatState(supabase, submissionId)
  if (state === 'done') return 'done'
  if (state === 'generating') return 'in_progress'
  const startedAt = new Date().toISOString()
  if (!row) {
    const { data, error } = await supabase
      .from('compatibility_reports')
      .insert({ submission_id: submissionId, section_key: COMPAT_SECTION_KEY, is_paid: true, status: 'generating', started_at: startedAt, context_interpretation: '' })
      .select('id')
    if (error) {
      if ((error as any).code === '23505') return 'in_progress' // 동시에 다른 요청이 먼저 넣음 (unique index)
      throw error
    }
    return data?.length ? 'claimed' : 'in_progress'
  }
  const staleIso = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString()
  const { data, error } = await supabase
    .from('compatibility_reports')
    .update({ status: 'generating', started_at: startedAt, error: null })
    .eq('id', row.id)
    .or(`status.is.null,status.neq.generating,started_at.lt.${staleIso}`)
    .select('id')
  if (error) throw error
  return data?.length ? 'claimed' : 'in_progress'
}

function birthInfoOf(sub: any, p: 'a' | 'b'): BirthInfo {
  const g = (k: string) => sub[`person_${p}_${k}`]
  return {
    name: g('name'),
    birthDate: g('birth_date'),
    birthCountry: g('birth_country'),
    birthTime: g('birth_time') || undefined,
    gender: g('gender'),
    referralSource: sub.referral_source || 'direct',
    birthCity: g('birth_city') || undefined,
    timezone: g('timezone') || undefined,
    longitude: g('longitude') ?? undefined,
    latitude: g('latitude') ?? undefined,
  } as BirthInfo
}

function sajuOf(info: BirthInfo) {
  let s: any = calculateSaju(info)
  const by = Number(String(info.birthDate).slice(0, 4))
  try { s = refreshDecadeFortune(s, info.gender as 'male' | 'female', by) } catch { /* 대운 보정 실패는 무시 */ }
  return { saju: s, birthYear: by }
}

/** 실제 생성. 잠금을 잡은 뒤에만 부른다. 실패하면 status='failed' 로 남긴다(다음 요청/크론이 다시 시도). */
export async function runCompatGeneration(submissionId: string, cfg: CompatModelConfig, log: (...a: any[]) => void = console.log) {
  const supabase = createAdminClient()
  const rows = await rowsFor(supabase, submissionId)
  const row = rows.find((r) => r.status === 'generating') ?? rows[0]
  if (!row) throw new Error('no claimed row')
  try {
    const { data: sub, error } = await supabase.from('compatibility_submissions').select('*').eq('id', submissionId).single()
    if (error || !sub) throw new Error('submission not found')
    const ia = birthInfoOf(sub, 'a'), ib = birthInfoOf(sub, 'b')
    const sa = sajuOf(ia), sb = sajuOf(ib)
    const relationship = isRelationshipType(sub.relationship_type) ? sub.relationship_type : 'dating'
    const inputs = buildCompatInputs({
      a: { fullName: ia.name, gender: ia.gender as 'male' | 'female', birthYear: sa.birthYear, saju: sa.saju },
      b: { fullName: ib.name, gender: ib.gender as 'male' | 'female', birthYear: sb.birthYear, saju: sb.saju },
      relationship,
      concern: cleanConcern(sub.concern),
      reportYear: new Date().getFullYear(),
    })
    log('[v0] compat-v2 start', submissionId, relationship, `total=${inputs.facts.total}`, inputs.facts.matchType, `hourUnknown=${inputs.hourUnknown.join(',') || '-'}`)
    const result = await generateCompatReport(inputs, cfg, log)
    const { error: upErr } = await supabase
      .from('compatibility_reports')
      .update({
        facts: result.sections,
        score_board: result.scoreBoard,
        context_interpretation: result.notes ?? '',
        status: 'done',
        finished_at: new Date().toISOString(),
        error: null,
        pipeline: 'v2',
        meta: { timings: result.timings, usage: result.usage, issues: result.issues, compatFacts: inputs.facts },
      })
      .eq('id', row.id)
    if (upErr) throw upErr
    log('[v0] compat-v2 saved', submissionId, JSON.stringify(result.timings))
    return result
  } catch (e: any) {
    log('[v0] compat-v2 generation failed', submissionId, e?.message)
    await supabase.from('compatibility_reports').update({ status: 'failed', error: String(e?.message ?? e).slice(0, 500) }).eq('id', row.id)
    throw e
  }
}
