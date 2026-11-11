// 궁합 v2 — LLM 입력 만들기.
// buildCompatFacts() 결과(코드로 확정한 사실 + 점수)를 받아서
//  1) 모델에게 보낼 "숫자 없는" 사실(JSON)과
//  2) 화면 점수판에 쓸 숫자, 3) 검사에 쓸 허용 관계·연도 목록을 만든다.
import { buildCompatFacts, type Person } from '../saju/compat-facts'
import { CONCERN_MAX, MATCH_TYPE_LINE, RELATIONSHIP_LABEL, RELATIONSHIP_TYPES, SCORE_KEYS, SCORE_LABEL, type RelationshipType, type ScoreBoard, type ScoreKey } from './constants'
export * from './constants'

export function isRelationshipType(x: unknown): x is RelationshipType {
  return typeof x === 'string' && (RELATIONSHIP_TYPES as readonly string[]).includes(x)
}

// 고객이 쓴 고민: 공백 정리, 200자 제한, 링크 제거. 비어 있으면 ''.
export function cleanConcern(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CONCERN_MAX)
}

// ---------------- 이름 ----------------
const HANGUL_SYL = /[가-힣]/
const INITIAL = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h']
const MEDIAL = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i']
const FINAL = ['', 'k', 'kk', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't']
const romanizeHangul = (s: string) =>
  [...s]
    .map((ch) => {
      const c = ch.charCodeAt(0) - 0xac00
      if (c < 0 || c > 11171) return ''
      return INITIAL[Math.floor(c / 588)] + MEDIAL[Math.floor((c % 588) / 28)] + FINAL[c % 28]
    })
    .join('')
const cap = (w: string) => (w ? w[0].toUpperCase() + w.slice(1) : w)

/**
 * 리포트에 쓸 이름(이름만, 성 제외, 로마자).
 * - "Yujin Kim" / "Yujin" → "Yujin" (영문이면 첫 단어)
 * - "김유진" → "Yujin" (한글 3자 이상, 띄어쓰기 없음 → 첫 글자를 성으로 보고 뺀다)
 * - "김 유진" → "Yujin" (띄어쓰기가 있으면 첫 덩어리를 성으로 본다)
 * - "유진" (2자) → "Yujin" (2자는 이름만 쓴 경우가 많아서 그대로 쓴다)
 * - 한자 등 그 밖의 문자만 있으면 fallback('Partner A/B')을 쓴다.
 */
export function firstNameOf(full: string, fallback: string): string {
  const raw = String(full ?? '').trim()
  const latin = raw.replace(/[^A-Za-z\s'-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (latin) return cap(latin.split(' ')[0])
  const hangul = [...raw].filter((c) => HANGUL_SYL.test(c)).join('')
  if (hangul.length >= 3 && !/\s/.test(raw.trim())) return cap(romanizeHangul(hangul.slice(1)))
  if (hangul.length >= 1) {
    const parts = raw.split(/\s+/).filter((p) => HANGUL_SYL.test(p))
    const given = parts.length >= 2 ? parts.slice(1).join('') : hangul
    return cap(romanizeHangul(given))
  }
  return fallback
}

// ---------------- 숫자 없애기 ----------------
// 내부 값 → 자연스러운 한 마디. 모델이 라벨을 그대로 인용하지 못하게 일상어로 둔다(검사에서도 막는다).
const lift = (v: number) =>
  v >= 0.35 ? 'strongly nourishes' : v >= 0.15 ? 'nourishes' : v > 0.03 ? 'slightly nourishes' : v > -0.03 ? 'evenly matched' : v > -0.15 ? 'slightly tires' : 'tires'

export type CompatFacts = ReturnType<typeof buildCompatFacts>

/** 모델에게 보내는 사실. 점수(총점·4개 점수) 외의 숫자는 모두 뺀다(모델이 "+0.44", "자녀 별 2개" 를 그대로 쓰는 문제). */
export function toPromptFacts(f: CompatFacts) {
  const x: any = JSON.parse(JSON.stringify(f))
  delete x._ko
  for (const p of Object.values<any>(x.people)) {
    if (p.strength) delete p.strength.score
    if (p.temperature) delete p.temperature.t
    const mt = p.marriageTiming
    delete p.marriageTiming
    delete p.childrenStars
    p.personalLoveYears = { bestMeetingYear: mt?.bestMeetingYear?.year ?? null, bestMarriageYear: mt?.bestMarriageYear?.year ?? null }
  }
  const ec = x.elementComplement || {}
  for (const k of Object.keys(ec)) if (k.includes(' gain from ') && typeof ec[k] === 'number') ec[k] = lift(ec[k])
  const names = Object.keys(x.people)
  for (const t of x.timing || []) for (const n of names) if (t[n]) { t[n].spouseStarAppears = (t[n].spouseStar ?? 0) > 0; delete t[n].spouseStar }
  for (const sc of Object.values<any>(x.scores || {})) {
    for (const r of sc.reasons || []) {
      r.effect = r.points > 0 ? 'raises' : 'lowers'
      delete r.points
      r.text = String(r.text).replace(/\s*\(net [+-]?\d+(\.\d+)?\)/g, '')
    }
  }
  if (x.relationship === 'ex') {
    const a = x.scores?.attraction?.score ?? 50
    x.exReading = {
      lean: a < 40 ? 'leans toward letting go gently' : 'open to reconnecting with clear conditions',
      note: "A lean, not a verdict. Show both paths; the choice is the reader's.",
    }
  }
  return x
}

// ---------------- 검사용 목록 ----------------
/** 본문에 나와도 되는 "X-Y 관계" (예: "Sa-Sul Wonjin"). 소문자, 양방향. */
export function allowedRelationSet(f: CompatFacts): Set<string> {
  const out = new Set<string>()
  const add = (a: string, b: string, rel: string) => {
    out.add(`${a}-${b} ${rel}`.toLowerCase())
    out.add(`${b}-${a} ${rel}`.toLowerCase())
  }
  const re = /([A-Z][a-z]{0,6})-([A-Z][a-z]{0,6})\s+(Ja-Hyeong|Banhap|Chung|Hyeong|Wonjin|Gwimun|Hap|Hae|Pa)\b/g
  const scan = (s: string) => { for (const m of s.matchAll(re)) add(m[1], m[2], m[3]) }
  for (const l of f.branchLinks) scan(l.en)
  for (const t of f.timing as any[]) for (const v of Object.values<any>(t)) if (v && Array.isArray(v.spousePalace)) v.spousePalace.forEach(scan)
  // 일간 합/충
  const a = String((f.dayStem as any).A).match(/\((\w+)\)/)?.[1], b = String((f.dayStem as any).B).match(/\((\w+)\)/)?.[1]
  if (a && b) { if ((f.dayStem as any).combination) add(a, b, 'Hap'); if ((f.dayStem as any).clash) add(a, b, 'Chung') }
  return out
}

/** 본문에 나와도 되는 연도: 리포트 연도, timing 3년, 각자의 만남/결혼 좋은 해. */
export function allowedYears(f: CompatFacts, reportYear: number): number[] {
  const ys = new Set<number>([reportYear])
  for (const t of f.timing as any[]) if (t.year) ys.add(t.year)
  for (const p of Object.values<any>(f.people)) {
    const m = p.marriageTiming
    if (m?.bestMeetingYear?.year) ys.add(m.bestMeetingYear.year)
    if (m?.bestMarriageYear?.year) ys.add(m.bestMarriageYear.year)
  }
  return [...ys].sort()
}

// ---------------- 점수판 ----------------
export function buildScoreBoard(
  f: CompatFacts,
  ctx: { relationship: RelationshipType; concern: string; names: { a: string; b: string } },
  lines?: Partial<Record<'total' | ScoreKey, string>>,
): ScoreBoard {
  return {
    version: 2,
    total: f.total,
    totalLine: lines?.total?.trim() || '',
    matchType: f.matchType,
    matchTypeLine: MATCH_TYPE_LINE[f.matchType] ?? '',
    relationship: ctx.relationship,
    relationshipLabel: RELATIONSHIP_LABEL[ctx.relationship],
    concern: ctx.concern,
    names: ctx.names,
    subs: SCORE_KEYS.map((k) => ({ key: k, label: SCORE_LABEL[k].label, hint: SCORE_LABEL[k].hint, score: (f.scores as any)[k].score, line: lines?.[k]?.trim() || '' })),
  }
}

// ---------------- 한 번에 ----------------
export interface CompatPersonInput { fullName: string; gender: 'male' | 'female'; birthYear: number; saju: any }

export function buildCompatInputs(args: {
  a: CompatPersonInput
  b: CompatPersonInput
  relationship: RelationshipType
  concern: string
  reportYear: number
}) {
  let na = firstNameOf(args.a.fullName, 'Partner A')
  let nb = firstNameOf(args.b.fullName, 'Partner B')
  if (na.toLowerCase() === nb.toLowerCase()) { na = `${na} (1)`; nb = `${nb} (2)` }
  const A: Person = { name: na, gender: args.a.gender, birthYear: args.a.birthYear, saju: args.a.saju }
  const B: Person = { name: nb, gender: args.b.gender, birthYear: args.b.birthYear, saju: args.b.saju }
  const facts = buildCompatFacts(A, B, { reportYear: args.reportYear, relationship: args.relationship })
  const promptFacts = toPromptFacts(facts)
  const hourUnknown = Object.entries<any>(facts.people).filter(([, p]) => !p.hourKnown).map(([n]) => n)
  return {
    facts,
    promptFacts,
    names: { a: na, b: nb },
    pronouns: { a: args.a.gender === 'female' ? 'she/her' : 'he/him', b: args.b.gender === 'female' ? 'she/her' : 'he/him' },
    hourUnknown,
    relationship: args.relationship,
    concern: args.concern,
    reportYear: args.reportYear,
    allowedRelations: allowedRelationSet(facts),
    allowedYears: allowedYears(facts, args.reportYear),
  }
}
export type CompatInputs = ReturnType<typeof buildCompatInputs>
