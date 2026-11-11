// 궁합 v2 — 생성 결과 검사. hard = 고치기(repair) 대상, soft = 로그만.
import type { CompatInputs } from './prompt-facts'

const CJK = /[ᄀ-ᇿ㄰-㆏가-힯぀-ヿ㐀-䶿一-鿿豈-﫿]/g
export const stripCjk = (s: string) => s.replace(CJK, '').replace(/\(\s*\)/g, '').replace(/[ \t]{2,}/g, ' ').trim()
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0)

// ---------------- 노트 ----------------
export function checkNotes(text: string, inp: CompatInputs): string[] {
  const issues: string[] = []
  if (text.length < 2000) issues.push(`notes too short (${text.length} chars, need about 5,500)`)
  if (!/SECTION PLAN/i.test(text)) issues.push('missing part 8 SECTION PLAN')
  for (const y of yearsIn(text)) if (!inp.allowedYears.includes(y)) issues.push(`year ${y} is not in timing or personalLoveYears`)
  return issues
}

// ---------------- 섹션 ----------------
const REL_RE = /\b([A-Z][a-z]{0,6})-([A-Z][a-z]{0,6})\s+(Ja-Hyeong|Banhap|Chung|Hyeong|Wonjin|Gwimun|Hap|Hae|Pa)\b/g
const yearsIn = (s: string) => [...new Set([...s.matchAll(/\b(19[5-9]\d|20\d{2})\b/g)].map((m) => +m[1]))]

const BANNED: [RegExp, string][] = [
  [/\b(clear|strong|slight)(ly)? (lift|drain)\b|\bnet (lift|drain)\b|\bchart readers call\b/i, 'quotes an internal label'],
  [/\bway works\b/i, 'uses the phrase "way works"'],
  [/\bguarantee[sd]?\b|\bwill definitely\b|\bcertain to\b|\bdestined to\b/i, 'promises an outcome'],
  [/\bdate night every (two|2) weeks\b/i, 'stock advice "date night every two weeks"'],
  [/\bI(?:'| a)m right here\b|\bnot going anywhere\b/i, 'stock reassurance line'],
  [/\bchildren stars?\b|\b(\d+|no|zero|one|two|three|four|five|six)\s+(active\s+)?(child|spouse|partner)\s+stars?\b|\bspouse star activity\b/i, 'mentions star counts'],
  [/(?<!\w)\+\d+(\.\d+)?\b|\b\d+\.\d+\b/, 'prints an internal number'],
  [/\bscor(e|es|ed)\b(\s+[\w-]+){0,4}?\s+(of\s+)?\d{1,3}\b(?!\s*(minutes?|hours?|days?|weeks?|times?))|\b\d{1,3}\s*(\/\s*100|out of 100)\b/i, 'prints a score number in the body'],
  [/\b(can(?:not|'t)|unable to|will not be able to) (have|conceive)\b|\binfertil/i, 'suggests someone can or cannot have children'],
]
const EX_BANNED: [RegExp, string][] = [
  [/\binevitabl\w*|\bpermanent(ly)?\b|\bdoomed\b|\bwould recreate\b|\bcannot work\b|\bcan't work\b/i, 'states a verdict instead of a lean'],
  [/\b(bath|herbal tea|houseplant|volunteer\w*|journal(ing)?|hobb(y|ies)|yoga|meditat\w*)\b/i, 'generic self-care advice in an ex report'],
]

export interface SectionCheck { hard: string[]; soft: string[] }

export function checkSection(key: string, paragraphs: string[], inp: CompatInputs): SectionCheck {
  const hard: string[] = [], soft: string[] = []
  const text = paragraphs.join('\n\n')
  if (key === 'keep') {
    if (paragraphs.length !== 1) hard.push(`must be exactly one sentence (got ${paragraphs.length} paragraphs)`)
    if (words(text) > 35) hard.push(`too long (${words(text)} words, max 25)`)
  } else {
    if (paragraphs.length !== 2) hard.push(`must have exactly 2 paragraphs (got ${paragraphs.length})`)
    paragraphs.forEach((p, i) => { const w = words(p); if (w < 55 || w > 160) soft.push(`P${i + 1} ${w} words`) })
  }
  for (const [re, msg] of BANNED) if (re.test(text)) hard.push(msg)
  if (inp.relationship === 'ex') {
    for (const [re, msg] of EX_BANNED) if (re.test(text)) hard.push(msg)
    if (new RegExp(`\\b${escapeRe(inp.names.a)}\\b`).test(text)) hard.push(`uses the reader's own name "${inp.names.a}"; write "you"`)
  }
  for (const m of text.matchAll(REL_RE)) {
    const k = `${m[1]}-${m[2]} ${m[3]}`.toLowerCase()
    if (!inp.allowedRelations.has(k)) hard.push(`relation "${m[0]}" is not in the facts`)
  }
  for (const y of yearsIn(text)) if (!inp.allowedYears.includes(y)) hard.push(`year ${y} is not in timing or personalLoveYears`)
  for (const n of inp.hourUnknown) if (new RegExp(`\\b${escapeRe(n)}'s Hour\\b`, 'i').test(text)) hard.push(`mentions ${n}'s Hour Pillar, but the birth hour is unknown`)
  return { hard: [...new Set(hard)], soft }
}

/** 리포트 전체: 같은 문장이 두 섹션에 나오면 soft. */
export function crossSectionRepeats(sections: { key: string; paragraphs: string[] }[]): string[] {
  const seen = new Map<string, string>()
  const out: string[] = []
  for (const s of sections) for (const sent of s.paragraphs.join(' ').split(/(?<=[.!?])\s+/)) {
    const n = sent.toLowerCase().replace(/[^a-z ]/g, '').trim()
    if (n.length < 40) continue
    const prev = seen.get(n)
    if (prev && prev !== s.key) out.push(`${prev} & ${s.key}: "${sent.slice(0, 60)}..."`)
    else seen.set(n, s.key)
  }
  return out
}

const STOP = new Set('the a an and or of to in on at for with by from as is are was were be been it its this that these those you your yours we our us they their he she his her him them i me my not no so but if then than too very just can could may might will would should must do does did have has had into over under up out about after before while when where what which who whom how why penalty break harm clash resentment combination half harmony void gongmang branch branches pillar pillars known called hyeong pa wonjin hae chung hap banhap gwimun peach blossom red glow day month year hour stem stems'.split(' '))
const shingles = (text: string) => {
  const w = text.toLowerCase().replace(/[^a-z' -]/g, ' ').split(/\s+/).filter(Boolean)
  const out = new Set<string>()
  for (let i = 0; i + 5 <= w.length; i++) {
    const g = w.slice(i, i + 5)
    if (g.filter((x) => !STOP.has(x)).length >= 3) out.add(g.join(' '))
  }
  return out
}
const quotesIn = (text: string) => new Set([...text.matchAll(/["\u201c']([^"\u201d']{18,160})["\u201d']/g)].map((m) => m[1].toLowerCase().replace(/[^a-z ]/g, '').trim()).filter((q) => q.split(' ').length >= 4))

/** 앞 섹션과 같은 조언(같은 인용문, 같은 5단어 구절)을 쓴 뒤쪽 섹션 → { key: ['repeats advice from section X: "..."'] } */
export function repeatedAdvice(sections: { key: string; paragraphs: string[] }[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  const seenSh = new Map<string, string>(), seenQ = new Map<string, string>()
  for (const sec of sections) {
    if (sec.key === 'keep') continue
    const text = sec.paragraphs.join(' ')
    const hits: string[] = []
    for (const q of quotesIn(text)) { const p = seenQ.get(q); if (p && p !== sec.key) hits.push(`repeats the quoted sentence from section ${p}: "${q}"`); else seenQ.set(q, sec.key) }
    let n = 0
    for (const g of shingles(text)) {
      const p = seenSh.get(g)
      if (p && p !== sec.key) { if (n++ < 1) hits.push(`repeats advice from section ${p} ("${g}")`) } else seenSh.set(g, sec.key)
    }
    if (hits.length) out[sec.key] = hits
  }
  return out
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
