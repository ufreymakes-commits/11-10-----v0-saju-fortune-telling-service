// 궁합 v2 — 2단계 생성: 노트(1회) → 섹션 3묶음 병렬 → 검사 → 문제 섹션만 1회 고치기.
// 모델 이름과 thinking 옵션은 호출하는 쪽(route)이 유료 리포트와 같은 값으로 넘긴다.
import { generateObject, generateText } from 'ai'
import {
  COMPAT_NOTES_SYSTEM, COMPAT_SECTIONS_SYSTEM, SECTION_GROUPS, sectionDefs,
  buildNotesUserPrompt, buildSectionsUserPrompt, buildRepairUserPrompt,
  groupSchema, groupSchemaWithScores, repairSchema, type GroupOutput, type SectionKey,
} from './prompts'
import { checkNotes, checkSection, crossSectionRepeats, repeatedAdvice, stripCjk } from './checks'
import { buildScoreBoard, type CompatInputs, type ScoreBoard } from './prompt-facts'

export interface CompatModelConfig {
  /** 유료 리포트 2단계와 같은 모델 (예: 'google/gemini-3.8-flash' 또는 provider 객체) */
  model: any
  /** 노트용 providerOptions (thinking medium) */
  notesProviderOptions?: any
  /** 섹션·고치기용 providerOptions (기본 thinking medium — AI Studio 테스트와 같음) */
  sectionsProviderOptions?: any
  notesTimeoutMs?: number
  groupTimeoutMs?: number
}

export interface CompatSection { key: SectionKey; title: string; content: string }
export interface CompatResult {
  pipeline: 'v2'
  sections: CompatSection[]
  scoreBoard: ScoreBoard
  notes: string | null
  timings: Record<string, number>
  usage: Record<string, unknown>
  issues: { notes: string[]; hardBeforeRepair: Record<string, string[]>; hardAfterRepair: Record<string, string[]>; soft: Record<string, string[]>; repeats: string[] }
}

const now = () => Date.now()
const usageOf = (u: any) => ({ in: u?.inputTokens ?? null, out: u?.outputTokens ?? null, reasoning: u?.reasoningTokens ?? u?.outputTokenDetails?.reasoningTokens ?? null })

export async function generateCompatReport(inp: CompatInputs, cfg: CompatModelConfig, log: (...a: any[]) => void = console.log): Promise<CompatResult> {
  const t0 = now()
  const timings: Record<string, number> = {}
  const usage: Record<string, unknown> = {}
  const defs = sectionDefs(inp.relationship, inp.names.a, inp.names.b)
  const titleOf = (k: string) => defs.find((d) => d.key === k)?.title ?? k

  // ---------- 1단계: 노트 (실패하면 노트 없이 진행) ----------
  let notes: string | null = null
  let notesIssues: string[] = []
  const tn = now()
  for (let attempt = 1; attempt <= 2 && !notes; attempt++) {
    try {
      const extra = attempt === 2 && notesIssues.length ? `\n\nFix these problems from the last attempt: ${notesIssues.join('; ')}` : ''
      const r = await generateText({
        model: cfg.model,
        system: COMPAT_NOTES_SYSTEM,
        prompt: buildNotesUserPrompt(inp) + extra,
        temperature: 0.7,
        maxOutputTokens: 8000,
        providerOptions: cfg.notesProviderOptions,
        abortSignal: AbortSignal.timeout(cfg.notesTimeoutMs ?? 90_000),
      })
      const text = stripCjk(r.text || '')
      usage[`notes_${attempt}`] = usageOf(r.usage)
      notesIssues = checkNotes(text, inp)
      // 짧거나 계획이 없으면 1번 더. 연도 같은 작은 문제만 남으면 그대로 쓴다.
      const serious = notesIssues.filter((i) => /too short|SECTION PLAN/.test(i))
      if (!serious.length || attempt === 2) notes = text.length >= 1200 ? text : null
    } catch (e: any) {
      log('[v0] compat-v2 notes error', attempt, e?.message)
    }
  }
  timings.notes_ms = now() - tn
  if (!notes) log('[v0] compat-v2 notes unavailable — writing sections without notes')

  // ---------- 2단계: 섹션 3묶음 병렬 ----------
  async function runGroup(gi: number): Promise<GroupOutput> {
    const keys = SECTION_GROUPS[gi]
    const withScores = gi === 0
    let lastErr: any
    for (let attempt = 1; attempt <= 2; attempt++) {
      const tg = now()
      try {
        const r = await generateObject({
          model: cfg.model,
          schema: withScores ? groupSchemaWithScores : groupSchema,
          system: COMPAT_SECTIONS_SYSTEM,
          prompt: buildSectionsUserPrompt(inp, notes, keys, withScores),
          temperature: 0.5,
          maxOutputTokens: 12000,
          providerOptions: cfg.sectionsProviderOptions,
          abortSignal: AbortSignal.timeout(cfg.groupTimeoutMs ?? 150_000),
        })
        const obj = r.object as GroupOutput
        const got = new Set(obj.sections.map((s) => s.key))
        const missing = keys.filter((k) => !got.has(k))
        timings[`group${gi + 1}_ms`] = now() - tg
        usage[`group${gi + 1}_${attempt}`] = usageOf(r.usage)
        if (missing.length && attempt === 1) { lastErr = new Error(`missing sections ${missing.join(',')}`); log('[v0] compat-v2 group retry', gi + 1, lastErr.message); continue }
        return obj
      } catch (e: any) {
        lastErr = e
        log('[v0] compat-v2 group error', gi + 1, attempt, e?.message)
      }
    }
    throw new Error(`group ${gi + 1} failed: ${lastErr?.message ?? 'unknown'}`)
  }
  const ts = now()
  const groups = await Promise.all(SECTION_GROUPS.map((_, gi) => runGroup(gi)))
  timings.sections_ms = now() - ts

  // 순서대로 합치기 (모델이 다른 key 를 쓰면 버린다)
  const byKey = new Map<string, string[]>()
  groups.forEach((g, gi) => {
    for (const s of g.sections) if (SECTION_GROUPS[gi].includes(s.key as SectionKey) && !byKey.has(s.key)) {
      byKey.set(s.key, s.paragraphs.map((p) => stripCjk(p)).filter(Boolean))
    }
  })
  const missing = defs.filter((d) => !byKey.has(d.key)).map((d) => d.key)
  if (missing.length) throw new Error(`missing sections after retry: ${missing.join(',')}`)

  // ---------- 검사 ----------
  const hardBefore: Record<string, string[]> = {}, soft: Record<string, string[]> = {}
  for (const d of defs) {
    const c = checkSection(d.key, byKey.get(d.key)!, inp)
    if (c.hard.length) hardBefore[d.key] = c.hard
    if (c.soft.length) soft[d.key] = c.soft
  }

  // 앞 섹션과 같은 조언을 쓴 뒤쪽 섹션도 고치기 대상(섹션 1~3 묶음이 서로 못 보기 때문에 생긴다)
  const dupAdvice = repeatedAdvice(defs.map((d) => ({ key: d.key, paragraphs: byKey.get(d.key)! })))
  for (const [k, v] of Object.entries(dupAdvice)) hardBefore[k] = [...(hardBefore[k] ?? []), ...v]

  // ---------- 고치기: 문제 섹션만, 1회, 최대 6개 ----------
  const hardAfter: Record<string, string[]> = { ...hardBefore }
  const flagged = Object.keys(hardBefore).slice(0, 6)
  if (flagged.length) {
    const tr = now()
    try {
      const r = await generateObject({
        model: cfg.model,
        schema: repairSchema,
        system: COMPAT_SECTIONS_SYSTEM,
        prompt: buildRepairUserPrompt(inp, flagged.map((k) => ({ key: k, title: titleOf(k), paragraphs: byKey.get(k)!, issues: hardBefore[k] }))),
        temperature: 0.4,
        maxOutputTokens: 8000,
        providerOptions: cfg.sectionsProviderOptions,
        abortSignal: AbortSignal.timeout(90_000),
      })
      usage.repair = usageOf(r.usage)
      for (const s of (r.object as GroupOutput).sections) {
        if (!flagged.includes(s.key)) continue
        const paras = s.paragraphs.map((p) => stripCjk(p)).filter(Boolean)
        const c = checkSection(s.key, paras, inp)
        // 문제가 줄었을 때만 바꾼다
        if (c.hard.length < hardBefore[s.key].length) {
          byKey.set(s.key, paras)
          if (c.hard.length) hardAfter[s.key] = c.hard
          else delete hardAfter[s.key]
        }
      }
    } catch (e: any) {
      log('[v0] compat-v2 repair error', e?.message)
    }
    timings.repair_ms = now() - tr
  }

  const sections: CompatSection[] = defs.map((d) => ({ key: d.key, title: d.title, content: byKey.get(d.key)!.join('\n\n') }))
  const repeats = crossSectionRepeats(defs.map((d) => ({ key: d.key, paragraphs: byKey.get(d.key)! })))
  const scoreLines = groups[0].scoreLines
  const scoreBoard = buildScoreBoard(inp.facts, { relationship: inp.relationship, concern: inp.concern, names: inp.names }, scoreLines ? Object.fromEntries(Object.entries(scoreLines).map(([k, v]) => [k, stripCjk(String(v))])) : undefined)
  timings.total_ms = now() - t0

  log('[v0] compat-v2 timing', JSON.stringify(timings))
  log('[v0] compat-v2 usage', JSON.stringify(usage))
  log('[v0] compat-v2 issues', JSON.stringify({ notes: notesIssues, hardBefore, hardAfter, soft, repeats }))

  return { pipeline: 'v2', sections, scoreBoard, notes, timings, usage, issues: { notes: notesIssues, hardBeforeRepair: hardBefore, hardAfterRepair: hardAfter, soft, repeats } }
}
