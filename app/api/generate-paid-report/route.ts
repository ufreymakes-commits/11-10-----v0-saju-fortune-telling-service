import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { Fact } from '@/lib/types'
import { buildRomanceFacts, yearNickname } from '@/lib/saju/romance'
import { buildPaidContext, refreshDecadeFortune } from '@/lib/saju/paid-context'
import { romanizeName, hasCJK } from '@/lib/romanize-name'
import { TAILS } from '@/lib/saju/tails'

// Vercel Hobby 플랜 최대 60초
export const maxDuration = 300

/**
 * 유료 레포트 생성 API (96개 사실 + 총평 편지)
 *
 * 흐름:
 * 1. submissionId로 DB 조회 (사주데이터 + 무료 3개 사실 + 1500자 해설)
 * 2. saju_data.decadeFortune(결정론적 계산 결과)를 04/07/09 섹션의 톤 일치를 위한 그라운딩 컨텍스트로만 주입
 * 3. 96개 사실 생성(02/03/04/05/06/08 섹션은 11개째 카드로 "Truth Bomb" 포함) + 96개 카드 아래 총평 편지(closingLetter) 1개 생성
 * 4. DB에 저장 (is_free: false)
 */

// ===== 유료 레포트 프롬프트 (사용자가 이 부분을 수정) =====
const PAID_REPORT_SYSTEM_PROMPT = `You are an expert Korean Saju analyst creating a premium paid report called 99 facts from your birth chart - korean ancient saju based.

CRITICAL CONTEXT INJECTION:
The user has already received 3 FREE facts. You must now generate 96 ADDITIONAL facts.

RULES:
1. "Ensure Absolute Continuity" - The 96 new facts must be a seamless expansion of the initial 3 facts. There must be ZERO logical conflict or contradiction.

2. "Deep-Dive, Don't Repeat" - Do NOT repeat information from the first 3 facts. Instead, use them as 'Anchors' and dive deeper into the specific 'Why' and 'How' based on the 4 pillars. Think of the free report as the 'Trailer' and this paid report as the 'Full Deep-Dive Movie'.

3. "Narrative Alignment" - Maintain the same 'Life Persona' established in the first 3 facts. Use the initial analysis as the 'Source of Truth' to ensure the user feels like they are reading a single, cohesive story of their life.

4. "Conflict Prevention" - Before generating each fact, cross-check against the free 3 facts. If a new insight feels like it contradicts a previous one, pivot the perspective to explain the internal complexity of the Saju (e.g., 'While you show [Fact A] outwardly, your inner self struggles with [Fact B]').

TONE AND STYLE (mandatory):
- Write in natural, modern English like Gen-Z (lowkey, main character energy, no cap)But, Avoid appearing overly playful or flippant.No Korean or Chinese letters.
- Warm, grounded, emotionally intelligent (like a wise friend)
- Avoid heavy jargon - explain technical terms in plain English
- Use "may," "tends to," "can," "often" - avoid absolute statements
- Do NOT claim medical, legal, or guaranteed predictive outcomes
- Do NOT use fear-based language

MANDATORY REQUIREMENTS:
- EXACTLY 9 sections (numbered 01-09)
- Sections 01, 07, 09 have EXACTLY 10 cards each
- Sections 02, 03, 04, 05, 06, 08 have EXACTLY 11 cards each (Cards 1-7 are analysis, Card 8 is the "Truth Bomb" mirror card, Card 9 is a Reframe, Card 10 is a Permission or Strategy card, Card 11 is a Small Action, see the CLOSING FLOW rules below)
- TOTAL = 96 cards (this is non-negotiable)
- Each card's "content" field: Max 220 characters including spaces (the only exception is the Place card in section 08, which may use up to 300 characters)
- Be compact but meaningful - core insight only
- No need for title/theme per card
- Maintain Gen-Z tone, warmth, and practical advice
- After the 96 cards, also write one standalone "closingLetter" per the CLOSING LETTER rules below

CONSISTENCY RULES (critical):
- The strength rule in FINAL FACTS (finalFacts.strength.rule) is binding. Never contradict it anywhere in the 96 cards or the closing letter. If it says STRONG, never write weak, "Weak Self" or "Jae-Da-Sin-Yak"; if it says WEAK, never write strong or self-reliant by strength.
- Cycle years and ages: for ANY 10-year luck cycle you mention (past, current, next, childhood), copy its years and international ages exactly from finalFacts.luckCycles.all. Never compute your own ages or years, never write an end year one higher than listed, and never mention a cycle that is not in the list. Use one age system only (the international ages given).
- Ten gods and positions: attach a ten god only to the position listed in finalFacts.tenGodsByPosition (for example, a god on the Month STEM is not on the Month BRANCH). Never say "from your Year and Month stems" unless both stems really have that god.
- Where a ten god sits: copy the positions from FINAL FACTS tenGodsByGod exactly. A stem and a branch are different positions. Never write "Year and Month stems" or "Year and Month branches" unless both really have that god in tenGodsByGod.
- Lucky-item element: call it "the element behind your lucky directions, colors and numbers". Never call it the "primary lucky element" or "primary Useful God" (the headline Useful God is yongsin.primary). Do not say two different elements are "primary".
- Dates must be consistent between cards: the same cycle always has the same years and ages everywhere.
- Money window: when you write about "your strongest money window / wealth flow timing", use exactly FINAL FACTS wealthWindow (years and ages). Never call a Low-scored cycle the strongest money window, and never contradict another card about the same cycle (e.g. one card says a cycle is the strongest money window while another card calls it Low and says protect assets).
- Years: any specific past or future year you mention must come from FINAL FACTS (reportYear, luckCycles, lovePeak, the yearly list in the saju data). Do not invent favorable/unfavorable years and do not copy years from the free report. Never call a year before the report year "is favorable" in present tense.
- Repetition: one named chart item (for example Mi-Ja Wonjin, Rob Wealth Fighting Wealth, a cycle name, a twelve star) may appear in at most 3 cards of the whole report. Each of the 6 Truth Bomb cards must use a DIFFERENT chart item from the others.
- Final card (96): warm, personal, ties to the report year and to one concrete thing from this chart (not a generic "you have inner resources").

Return ONLY a valid JSON object with "mainFacts" and "closingLetter". No markdown, no explanations outside the JSON.`

// 생성 후 코드 검사 (추가 AI 호출 없음): 신강/신�� 모순
function hasStrengthMismatch(text: string, grade: unknown): boolean {
  const g = String(grade ?? '')
  if (/weak/i.test(g)) return /day master is strong|strong day master/i.test(text)
  if (/strong/i.test(g)) return /weak self|jae-da-sin-yak|day master is weak/i.test(text)
  return false
}

// 생성 후 코드 검사: 대운 연도 범위가 목록과 다르게 쓰인 경우 (경고 로그만 남김)
function findCycleYearMismatches(text: string, cycles: any[] | undefined): string[] {
  if (!Array.isArray(cycles) || cycles.length === 0) return []
  const listed = cycles
    .map((c) => String(c?.yearsActive ?? '').match(/^(\d{4})-(\d{4})$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => [Number(m[1]), Number(m[2])] as const)
  const mismatches = new Set<string>()
  for (const m of text.matchAll(/\b(20\d\d)\s*[-\u2013]\s*(20\d\d)\b/g)) {
    const a = Number(m[1])
    const b = Number(m[2])
    // 대운은 10년 단위이므로 8~11�� 폭의 범위만 대운 후보로 본다 (연애 시기 등 짧은 구간은 제외)
    if (b - a < 8 || b - a > 11) continue
    const overlaps = listed.some(([s, e]) => a <= e && b >= s)
    const exact = listed.some(([s, e]) => a === s && b === e)
    if (overlaps && !exact) mismatches.add(`${a}-${b}`)
  }
  return [...mismatches]
}

// 생성 후 코드 검사: 섹션 02/03/04/05/06/08의 8번째 카드(Truth Bomb)가 일반적인 문장인지 확인한다.
// "Truth Bomb:" 접두어가 없거나, 작은따옴표 용어/오행/십성/연도 중 어느 것도 없으면 generic으로 본다.
const TRUTH_BOMB_SECTIONS = new Set(['02', '03', '04', '05', '06', '08'])
const TRUTH_BOMB_CARD_INDEX = 7

const GUMIHO_SIGNATURE = '- Your Gumiho'
const PERMISSION_MAX_CHARS = 90

function stripGumihoSignature(text: string): string {
  return text.replace(/\s*(?:[-\u2013\u2014]\s*)?Your Gumiho\.?\s*$/i, '').trim()
}

function normalizePermissions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) =>
      typeof item === 'string' ? item.replace(/[\u2018\u2019]/g, "'").replace(/\*\*/g, '').trim() : '',
    )
    .filter((item) => /^You're allowed to\b/i.test(item))
    .slice(0, 3)
}
const TEN_GOD_PATTERN =
  /(Friend|Rob(?:bing)? Wealth|Eating God|Hurting Officer|Direct Wealth|Indirect Wealth|Direct Officer|Seven Killings|Direct Resource|Indirect Resource|Bi-?gyeon|Geob-?jae|Sik-?sin|Sang-?gwan|Pyeon-?jae|Jeong-?jae|Pyeon-?gwan|Jeong-?gwan|Pyeon-?in|Jeong-?in)/i

function findGenericTruthBombSections(text: string): string[] {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return []
  let parsed: any
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return []
  }
  const sections: any[] = Array.isArray(parsed?.mainFacts) ? parsed.mainFacts : []
  const generic: string[] = []
  for (const section of sections) {
    const number = String(section?.sectionNumber ?? '')
    if (!TRUTH_BOMB_SECTIONS.has(number)) continue
    const cards: any[] = Array.isArray(section?.cards) ? section.cards : []
    const content = String(cards[TRUTH_BOMB_CARD_INDEX]?.content ?? '')
    const hasPrefix = content.includes('Truth Bomb:')
    const isSpecific =
      /'[^']+'/.test(content) ||
      /\b(Wood|Fire|Earth|Metal|Water)\b/.test(content) ||
      TEN_GOD_PATTERN.test(content) ||
      /\b(19|20)\d\d\b/.test(content)
    if (!hasPrefix || !isSpecific) generic.push(number)
  }
  return generic
}

function parseMainFacts(text: string): any[] {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return []
  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    return Array.isArray(parsed?.mainFacts) ? parsed.mainFacts : []
  } catch {
    return []
  }
}

// 생성 후 코드 검사: 섹션 06(연애) 카드 중 "family"와 "pet"이 함께 들어간 카드가 하나도 없는지 확인한다.
// JSON을 읽을 수 없으면 false(재생성하지 않음).
function isLovePetSentenceMissing(text: string): boolean {
  const love = parseMainFacts(text).find((s) => String(s?.sectionNumber ?? '') === '06')
  if (!love) return false
  const cards: any[] = Array.isArray(love.cards) ? love.cards : []
  return !cards.some((c) => {
    const content = String(c?.content ?? '')
    return /\bfamily\b/i.test(content) && /\bpets?\b/i.test(content)
  })
}

// 생성 후 코드 검사(로그 전용): 작은따옴표로 묶인 용어가 4장 넘는 카드에 나오는지 센다.
function findRepeatedTerms(text: string): Array<[string, number]> {
  const cardsByTerm = new Map<string, Set<string>>()
  parseMainFacts(text).forEach((section, si) => {
    const cards: any[] = Array.isArray(section?.cards) ? section.cards : []
    cards.forEach((card, ci) => {
      const content = String(card?.content ?? '')
      for (const m of content.matchAll(/(?<![A-Za-z])'([^'\n]{2,40}?)'(?![A-Za-z])/g)) {
        const term = m[1].trim()
        if (!term) continue
        const key = term.toLowerCase()
        if (!cardsByTerm.has(key)) cardsByTerm.set(key, new Set())
        cardsByTerm.get(key)!.add(`${si}-${ci}`)
      }
    })
  })
  return [...cardsByTerm.entries()].filter(([, set]) => set.size > 4).map(([term, set]) => [term, set.size])
}

// 생성 후 코드 검사(로그 전용): 허용된 연도 집합(보고서 연도, 대운 구간, 연애 피크, 사주 데이터의 연도 목록, 생년)에 없는 20NN 연도
function collectAllowedYears(sources: unknown[], reportYear: number, cycles: any[] | undefined): Set<number> {
  const allowed = new Set<number>([reportYear])
  for (const source of sources) {
    let serialized = ''
    try {
      serialized = typeof source === 'string' ? source : JSON.stringify(source) ?? ''
    } catch {
      serialized = ''
    }
    for (const m of serialized.matchAll(/\b(?:19|20)\d\d\b/g)) allowed.add(Number(m[0]))
  }
  if (Array.isArray(cycles)) {
    for (const c of cycles) {
      const range = String(c?.yearsActive ?? '').match(/^(\d{4})-(\d{4})$/)
      if (!range) continue
      for (let y = Number(range[1]); y <= Number(range[2]); y++) allowed.add(y)
    }
  }
  return allowed
}

function findUnknownYears(text: string, allowed: Set<number>): number[] {
  const unknown = new Set<number>()
  for (const m of text.matchAll(/\b20\d\d\b/g)) {
    const year = Number(m[0])
    if (!allowed.has(year)) unknown.add(year)
  }
  return [...unknown]
}

// ---- 수리 패스(repair pass) ----
const CLOSING_LETTER_MAX = 700
const CLOSING_LETTER_TARGET = 600
const REGULAR_CARD_MAX = 260
const SPECIAL_CARD_MAX = 300
const REPAIR_MAX_CARDS = 12

type ProblemKind = 'long' | 'repeated' | 'truth-bomb' | 'duplicate'
interface ProblemCard {
  index: number
  sectionIdx: number
  cardIdx: number
  section: string
  text: string
  isTruthBomb: boolean
  problems: Array<{ kind: ProblemKind; detail: string }>
}

function quotedTerms(text: string): string[] {
  const terms: string[] = []
  for (const m of text.matchAll(/(?<![A-Za-z])'([^'\n]{2,40}?)'(?![A-Za-z])/g)) {
    const term = m[1].trim()
    if (term) terms.push(term)
  }
  return terms
}

function wordSet(text: string): Set<string> {
  return new Set((text.toLowerCase().match(/[a-z]{4,}/g) ?? []))
}

function yearRanges(text: string): Set<string> {
  const ranges = new Set<string>()
  for (const m of text.matchAll(/\b((?:19|20)\d\d)\s*[-\u2013]\s*((?:19|20)\d\d)\b/g)) ranges.add(`${m[1]}-${m[2]}`)
  return ranges
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  return shared / (a.size + b.size - shared)
}

// 문제 카드 수집: (a) 길이 초과 (b) 한 용어가 4장 넘는 카드에 반복 (c) Truth Bomb 주제 중복 (d) 같은 섹션 내 같은 말
function findProblemCards(sections: any[], lovePeakYears: Array<number | string>): ProblemCard[] {
  const flagged = new Map<number, ProblemCard>()
  const termCardCount = new Map<string, number>()
  const seenBombItems = new Set<string>()
  let index = 0

  sections.forEach((section, sectionIdx) => {
    const number = String(section?.sectionNumber ?? '')
    const cards: any[] = Array.isArray(section?.cards) ? section.cards : []
    const seenInSection: Array<{ words: Set<string>; ranges: Set<string> }> = []

    cards.forEach((card, cardIdx) => {
      const text = String(card?.content ?? '')
      const currentIndex = index++
      const isTruthBomb = TRUTH_BOMB_SECTIONS.has(number) && cardIdx === TRUTH_BOMB_CARD_INDEX
      const addProblem = (kind: ProblemKind, detail: string) => {
        let entry = flagged.get(currentIndex)
        if (!entry) {
          entry = { index: currentIndex, sectionIdx, cardIdx, section: number, text, isTruthBomb, problems: [] }
          flagged.set(currentIndex, entry)
        }
        entry.problems.push({ kind, detail })
      }

      // a) 길이: 일반 카드 260자, 08 장소 카드와 06 연애 피크 카드는 300자까지
      const isPlaceCard = number === '08' && /\b(places?|regions?|cities|city|coast|coastline|elsewhere|country)\b/i.test(text)
      const isLovePeakCard =
        number === '06' && (/\bpets?\b/i.test(text) || lovePeakYears.some((y) => text.includes(String(y))))
      const limit = isPlaceCard || isLovePeakCard ? SPECIAL_CARD_MAX : REGULAR_CARD_MAX
      if (text.length > limit) addProblem('long', `${text.length} characters`)

      // b) 반복 용어: 앞의 4장은 두고 5번째 카드부터 문제 카드
      const terms = [...new Set(quotedTerms(text).map((t) => t.toLowerCase()))]
      for (const term of terms) {
        const count = (termCardCount.get(term) ?? 0) + 1
        termCardCount.set(term, count)
        if (count > 4) addProblem('repeated', term)
      }

      // c) Truth Bomb: 앞선 Truth Bomb과 같은 핵심 차트 항목이면 뒤의 카드가 문제 카드
      if (isTruthBomb) {
        const item = (quotedTerms(text)[0] ?? text.match(TEN_GOD_PATTERN)?.[0] ?? '').toLowerCase()
        if (item) {
          if (seenBombItems.has(item)) addProblem('truth-bomb', item)
          seenBombItems.add(item)
        }
      }

      // d) 같은 섹션 안에��� 같은 말을 하는 카드: 뒤의 카드가 문제 카드
      const words = wordSet(text)
      const ranges = yearRanges(text)
      const duplicate = seenInSection.some((prev) => {
        const similarity = jaccard(words, prev.words)
        const sharedRange = [...ranges].some((r) => prev.ranges.has(r))
        return similarity >= 0.55 || (sharedRange && similarity >= 0.3)
      })
      if (duplicate) addProblem('duplicate', 'same message as an earlier card in this section')
      seenInSection.push({ words, ranges })
    })
  })

  return [...flagged.values()]
}

const REPAIR_SYSTEM_PROMPT = `You are an editor fixing specific cards of a Saju (Four Pillars) report written in English.
Rules for every rewrite:
- Keep the Gen-Z, warm, practical tone; hedge with "may", "tends to", "can". No guarantees, no fear-based language.
- 100% Latin script: never write Hangul or Hanja, never use ** markdown markers.
- Quote stem-branch names in single quotes (e.g. 'Gyeong-In'); do not put ten gods or patterns in parentheses; never write strength as a percentage.
- Use only facts, chart items, years and ages that appear in FINAL FACTS. Never invent a year, star, or relationship.
- Do not use the customer's name unless the original text already uses it.
- Return ONLY a valid JSON array [{"index": ..., "text": "..."}] with exactly one entry for each card you were given. No markdown, no commentary.`

async function repairProblemCards(
  cards: ProblemCard[],
  closingLetter: string | null,
  finalFacts: any,
  longPermissions: Array<{ text: string; i: number }> = [],
): Promise<Map<string, string>> {
  const describe = (c: ProblemCard) =>
    c.problems
      .map((p) => {
        if (p.kind === 'long')
          return 'Too long. Rewrite it shorter than 220 characters, keeping the same facts and years.'
        if (p.kind === 'repeated')
          return `The term '${p.detail}' is already used in 4 other cards. Rewrite it shorter than 220 characters and talk about a DIFFERENT chart item from FINAL FACTS (not '${p.detail}'), keeping the same years if it has any.`
        if (p.kind === 'truth-bomb')
          return `Another Truth Bomb card already uses the same main chart item ('${p.detail}'). Pick a DIFFERENT chart item from FINAL FACTS, keep the "Truth Bomb: " prefix, and stay shorter than 220 characters.`
        return 'Another card in the same section already says the same thing. Say something NEW for this section from FINAL FACTS, shorter than 220 characters.'
      })
      .join(' ')

  const items: Array<{ index: number | string; section: string; text: string; problem: string }> = cards.map((c) => ({
    index: c.index,
    section: c.section,
    text: c.text,
    problem: describe(c),
  }))
  if (closingLetter) {
    items.push({
      index: 'closing',
      section: 'closing letter',
      text: closingLetter,
      problem: `This closing letter is too long. Shorten it to under ${CLOSING_LETTER_TARGET} characters, keep its warm flowing tone and the same facts, add nothing new, and make it end on a warm, complete final sentence.`,
    })
  }

  for (const p of longPermissions) {
    items.push({
      index: `permission-${p.i}`,
      section: 'permission sentence',
      text: p.text,
      problem: `Too long. Rewrite it in at most ${PERMISSION_MAX_CHARS} characters, keep it starting with "You're allowed to" and keep the same idea.`,
    })
  }

  const result = await generateText({
    model: 'google/gemini-2.5-flash',
    system: REPAIR_SYSTEM_PROMPT,
    prompt: `=== FINAL FACTS ===\n${JSON.stringify(finalFacts, null, 2)}\n\n=== CARDS TO REWRITE (JSON) ===\n${JSON.stringify(items, null, 2)}\n\nRewrite ONLY these cards and return the JSON array [{"index", "text"}].`,
    maxOutputTokens: 6000,
    temperature: 0.3,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
    abortSignal: AbortSignal.timeout(60000),
  })

  const rewrites = new Map<string, string>()
  const start = result.text.indexOf('[')
  const end = result.text.lastIndexOf(']')
  if (start === -1 || end <= start) return rewrites
  let parsed: any
  try {
    parsed = JSON.parse(result.text.slice(start, end + 1))
  } catch {
    return rewrites
  }
  if (!Array.isArray(parsed)) return rewrites
  for (const entry of parsed) {
    const text = typeof entry?.text === 'string' ? entry.text.trim() : ''
    if (entry?.index === undefined || !text) continue
    rewrites.set(String(entry.index), text)
  }
  return rewrites
}

// 편지 마무리: 700자 이하로 두고, 잘라야 하면 700자 미만의 마지막 완결 문장에서 자른다. 콜론이나 "But here's the truth"로 끝나지 않게 한다.
function finalizeClosingLetter(text: string): string {
  let letter = text.trim()
  if (letter.length > CLOSING_LETTER_MAX) {
    let cut = -1
    for (const m of letter.matchAll(/[.!?]["'\u2019\u201D)]?(?=\s|$)/g)) {
      const end = (m.index ?? 0) + m[0].length
      if (end < CLOSING_LETTER_MAX) cut = end
      else break
    }
    letter = cut > 0 ? letter.slice(0, cut).trim() : letter.slice(0, CLOSING_LETTER_MAX - 1).trim()
  }
  const sentences = letter.match(/[^.!?]+[.!?]+["'\u2019\u201D)]*\s*|[^.!?]+$/g)?.map((s) => s.trim()) ?? [letter]
  while (sentences.length > 1) {
    const last = sentences[sentences.length - 1]
    const incomplete =
      !/[.!?]["'\u2019\u201D)]*$/.test(last) || /:$/.test(last) || /but here['\u2019]?s the truth\W*$/i.test(last)
    if (!incomplete) break
    sentences.pop()
  }
  return sentences.join(' ').trim()
}

// 같은 서버 인스턴스 안에서의 중복 생성 방지용 (submissionId → 시작 시각). 인스턴스가 다르면 막지 못하는 약한 안전장치.
const IN_FLIGHT_WINDOW_MS = 6 * 60 * 1000
const inFlightGenerations = new Map<string, number>()

export async function POST(request: Request) {
  const t0 = Date.now()
  const logTiming = (step: string, extra?: Record<string, unknown>) =>
    console.log('[v0] timing', { step, ms: Date.now() - t0, ...extra })
  let lockedSubmissionId: string | null = null

  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. 결제 확인
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .single()

    logTiming('db:payment')

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment required' }, { status: 403 })
    }

    // 2. 기존 유료 레포트 확인 (section_key='paid_full'만 유효한 캐시)
    const { data: existingPaidReport } = await supabase
      .from('reports')
      .select('facts, hidden_cards')
      .eq('submission_id', submissionId)
      .eq('section_key', 'paid_full')
      .single()

    logTiming('db:cache')

    if (existingPaidReport?.facts && Array.isArray(existingPaidReport.facts) && existingPaidReport.facts.length > 5) {
      console.log('[v0] Paid report already exists (paid_full), returning cached version')
      return NextResponse.json({
        facts: existingPaidReport.facts,
        closingLetter: existingPaidReport.hidden_cards?.closingLetter || '',
        permissions: existingPaidReport.hidden_cards?.permissions || [],
        orb: existingPaidReport.hidden_cards?.orb || null,
        cached: true
      })
    }

    // 2-1. 같은 인스턴스에서 최근 6분 안에 시작된 생성이 있으면 새로 시작하지 않는다.
    const startedAt = inFlightGenerations.get(submissionId)
    if (startedAt && Date.now() - startedAt < IN_FLIGHT_WINDOW_MS) {
      console.log('[v0] Generation already in progress for this submission, returning 202')
      return NextResponse.json({ status: 'generating' }, { status: 202 })
    }
    inFlightGenerations.set(submissionId, Date.now())
    lockedSubmissionId = submissionId

    // 3. submission 데이터 조회 (사주 데이터)
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    logTiming('db:submission')

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 4. 무료 레포트 조회 (여러 섹션 rows로 저장되어 있음)
    const { data: freeReports, error: freeReportError } = await supabase
      .from('reports')
      .select('facts, context_interpretation')
      .eq('submission_id', submissionId)
      .eq('is_free', true)

    logTiming('db:freeReports')

    if (freeReportError || !freeReports || freeReports.length === 0) {
      return NextResponse.json({ error: 'Free report not found. Please generate free report first.' }, { status: 404 })
    }

    // 여러 섹션의 facts를 하나로 합치기
    const freeFacts = freeReports.flatMap(r => Array.isArray(r.facts) ? r.facts : []) as Fact[]
    const contextInterpretation = freeReports.find(r => r.context_interpretation)?.context_interpretation || ''

    console.log(`[v0] Found ${freeReports.length} free report sections, total ${freeFacts.length} free facts`)

    // 저장된 decadeFortune 은 옛 계산(시작 연도 1년 오차)일 수 있으므로 신뢰하지 않고 항상 다시 계산한다.
    const birthYear0 = Number(String(submission.birth_date).slice(0, 4)) || undefined
    submission.saju_data = refreshDecadeFortune(submission.saju_data, submission.gender === 'female' ? 'female' : 'male', birthYear0)

    // 한글 이름은 CJK 정리 단계에서 지워지므로 프롬프트에는 로마자 표기를 사용한다.
    const displayName = hasCJK(submission.name || '') ? romanizeName(submission.name) : (submission.name || 'friend')

    console.log('[v0] Generating 96 paid facts')
    console.log('[v0] Context injection summary:')
    console.log('[v0] - Saju data fields:', Object.keys(submission.saju_data || {}).length)
    console.log('[v0] - Context interpretation length:', contextInterpretation.length, 'chars')
    console.log('[v0] - Free facts count:', freeFacts?.length || 0)

    const reportYear = Math.max(new Date().getFullYear(), 2026)
    const reportGender: 'male' | 'female' = submission.gender === 'female' ? 'female' : 'male'

    const birthYear = Number(String(submission.birth_date).slice(0, 4)) || undefined

    let romanceFacts: any = null
    try {
      if (submission.saju_data?.expert) {
        romanceFacts = buildRomanceFacts(submission.saju_data, reportGender, reportYear, birthYear)
      }
    } catch (e) {
      console.error('[v0] romanceFacts build failed (continuing without):', e)
    }

    let sajuForPrompt: any = submission.saju_data
    let finalFacts: any = null
    try {
      const built = buildPaidContext(submission.saju_data, reportGender, reportYear, birthYear)
      sajuForPrompt = built.sajuForPrompt
      finalFacts = built.finalFacts
    } catch (e) {
      console.error('[v0] buildPaidContext failed (falling back to raw saju_data):', e)
    }

    const lovePeakData = finalFacts?.lovePeak
    const lovePeakTeaserYear: number | string =
      lovePeakData?.peak && (lovePeakData.peak.status === 'future' || lovePeakData.peak.status === 'this year')
        ? lovePeakData.peak.year
        : lovePeakData?.upcomingPeak?.year ?? lovePeakData?.peak?.year ?? '20xx'

    // 5. Gemini에 전체 context 주입
    const userPrompt = `
=== CUSTOMER SAJU DATA ===
Name: ${displayName}
Gender: ${submission.gender}
Birth Date: ${submission.birth_date}
Birth Country: ${submission.birth_country}

Four Pillars (四柱):
${JSON.stringify(sajuForPrompt, null, 2)}

=== FINAL FACTS (code-computed, authoritative) ===
${JSON.stringify(finalFacts, null, 2)}
These values override anything else in this prompt and any older field. Never recompute strength, Useful God, luck cycles, or stars yourself. The strength score is out of 120, never write it as a percentage.

=== PRE-COMPUTED DECADE FORTUNE (decadeFortune) — SILENT GROUNDING CONTEXT ONLY, DO NOT OUTPUT ===
This is the saju_data.decadeFortune object, left out of the Four Pillars JSON above so it is not duplicated.
Every decade's score (상/중/하) and candidate years below are final and already computed — you do NOT
recalculate them and you do NOT output any card or section based on this object directly. Its only
purpose is to keep sections 04, 07, and 09 tonally consistent (see the CROSS-SECTION CONSISTENCY RULE
below) with whichever decade covers "now" and "the next 10 years" for this customer.
${JSON.stringify(submission.saju_data?.decadeFortune, null, 2)}

=== PRE-COMPUTED ROMANCE FACTS (romanceFacts) — GROUNDING FOR SECTION 06 ONLY ===
These are final, code-computed facts (spouse palace, current luck cycle and the next 3 years' annual-luck interactions with the spouse palace / Day Master). Do not recalculate them and never invent a relationship or year that is not listed here.
${JSON.stringify(romanceFacts, null, 2)}

=== INTERNAL KEYWORD SKELETON (from Stage 1, background only) ===
Never quote this; if it conflicts with FINAL FACTS, FINAL FACTS win.
${contextInterpretation}

=== FREE 3 FACTS ALREADY PROVIDED (DO NOT REPEAT) ===
${JSON.stringify(freeFacts, null, 2)}

=== YOUR TASK ===
Based on all the context above, generate 96 NEW facts that:
1. Expand deeply on the themes introduced in the 3 free facts
2. Never contradict or repeat the free facts
3. Maintain narrative consistency with the established "Life Persona"
4. Cover all 9 premium themes — sections 01, 07, 09 get 10 facts each; sections 02, 03, 04, 05, 06, 08
   get 11 facts each (10 regular + 1 "Truth Bomb" card, see the TRUTH BOMB CARD rule below)
5. NEVER wrap any word or phrase in ** markdown bold markers, anywhere in any card or the closing
   letter — not around years ("2031"), not around phrases ("career growth"), not around anything. The
   renderer displays these fields as plain text, so a literal "**" would show up as two asterisk
   characters on the page. If you want to emphasize a year or phrase, just write it in plain text with
   no wrapping characters at all. Never write an actual Chinese hanja or Korean Hangul character anywhere in
   any of the 96 cards or the closing letter (no 土/火/水/金/木, no 己/甲/etc., no Hangul) — the output
   must be 100% Latin script.

STYLE OF TERMS (strict, applies to all 96 cards and the closing letter):
- All data you receive about stars, patterns, luck cycles, grades and ganzi is already in English / romanized form. Never copy Hangul or Hanja.
- Write Saju terms as plain words: Hurting Officer energy, the Direct Seal pattern, your Wonjin. Do NOT wrap ten gods, patterns, grades or ganzi in parentheses.
- Put a stem-branch name in single quotes: the year 2026 'Byeong-O', your 'Gyeong-In' luck cycle, the 'Mi-Ja Wonjin' between your Year and Day branches.
- Use parentheses ONLY to explain a term that a non-Korean reader would not understand, once per term in the whole report, in the form Term (short plain-English explanation), e.g. Daewoon (10-year luck cycle), Gyo-un-gi (transition period), Gongmang (void), Yongsin (Useful God). Never put only a term inside parentheses, and never use " - " inside them.
- Never write the strength as a percentage.
- When naming a luck cycle or Gyo-un-gi, cite the years from finalFacts.luckCycles (yearsActive, changesInYear). If you give ages, use internationalAges only.

OUTPUT FORMAT:
Key Point: You must embody a Gen-Z persona—playful and witty, yet brutally honest about the facts, ultimately delivering a core message of warmth, comfort, and practical solutions. Avoid appearing overly playful or flippant. Bridge the data with empathy.

IMPORTANT: Use the customer's name ${displayName} ONLY in Card 1, the final card, and the closing letter to make it personal. Do NOT use the name in any other card — except in Card 1, the final card, and the closing letter.
Example: the first card starts with "Hey ${displayName}," and the last card starts with "${displayName}, remember that..."

01. The Core Aura: Your 4 Pillars Unlocked 
* Focus: The essence of the Day Master and the Independence Index (Strength/Weakness).
* Data: Elemental traits of the Day Master + Relationship with the Month Branch (Seasonality/Deuk-ryeong) + Overall energy balance stats.
* Analysis of the fundamental temperament of the Saju and the "Base Camp" of life. It is best to identify which characters surround the customer's Day Master and represent them through metaphors in nature. Then, weave a story by capturing important characteristics of what those characters mean and how they manifest in life. For example, the following type of interpretation is preferred flow ; : "{{name}}, your chart is actually so fascinating. You are basically the soil of a field in a hot, dry summer, but you're literally surrounded by a massive ocean of water (even 3 letters) Since you have to handle and control all this water solo, the difficulty level of your life is definitely not 'Easy Mode,' but it’s a high-risk, high-reward structure where the payoff for winning is absolutely massive. In Saju terms, your Day Master, Gi-to, is rooted in the Mi-to of your same earthly branch, giving you insane self-reliance. However, because the 'Wealth' element (Water) is so overwhelming, there’s a strong 'Jae-Da-Sin-Yak' (Overwhelming Wealth, Weak Self) vibe going on. On top of that, you've got the 'Zi-Mi Wonjin-Sal' (Resentment/Clash) sitting between your Year and Day pillars, which means your sensitivity and intuition are both cranked up to 100. I was low-key worried your soil might get washed away by all that water, but thankfully, the Mi-to Earth in your Day Branch acts like a sturdy levee, giving you a top-tier ability to flip any crisis into an opportunity. If I were to give you a real-talk tip for 'unlocking your luck,' the key is to not get swept away by emotional waves. Instead of overreacting to your surroundings or what others say, just push through with your own 'My Way' energy. For Gi-to day master, having a lot of water means you have both flexibility and wealth. But to actually bottle up all this water, you must build a solid dam—meaning you need to level up your specs through self-development or getting certified. That’s the only way you’ll truly own all the money and opportunities flowing your way.")

* The first four cards of this section are special, and each must open with something specific to THIS chart (never a generic Day Master description):
  - Card 1 "Your chart in one line": one memorable identity sentence for THIS chart (a nickname plus why), built from the Day Master, the season and the strongest signal in the chart.
  - Card 2 "Outside vs inside": what other people see versus what is really going on inside, tied to ONE concrete chart relation.
  - Card 3 "Your Orb": say the orb's name EXACTLY as finalFacts.orb.name (copy it word for word, never rename it) and explain why this chart has that orb, using finalFacts.orb.subtitle. If finalFacts.orb is null, write this card about the Day Master image in nature instead.
  - Card 4 "How rare you are": use ONLY the numbers in finalFacts.orb.rarity: "1 in 60" for the Day Pillar (dayPillarOneIn), plus elementPattern.text and missingElement.text when they exist. Copy the numbers exactly. Never invent any other statistic. Only describe a number as "rare" when it truly is rare: the Day Pillar (1 in 60), an element mix of 1 in 50 or rarer, or a missing element shared by 20% of charts or fewer. If a number is common (an element mix more common than 1 in 50, or a missing element in more than 20% of charts), state it neutrally and do NOT call it rare, special or unusual. If finalFacts.orb is null, write a normal analysis card instead.
  - Cards 5-10: normal accurate analysis of the chart.

02. Inner Child Era: Your Early Vibes & Scars 
* Focus: Clashes in the Year Pillar and Month Pillar + Ten Gods.
* Data: Pillar interactions (Hyung, Chung, Pa, Hae/Core Scars) + Initial Luck Cycles (1st & 2nd Daewoon). Analysis of unconscious voids originating from relationships with parents or siblings. Many people grow up happy, so do not force a "void" if none exists.
(The appearance of childhood and the unconscious traumas/tendencies formed during that time.)

03. Present Energy: The 'Main Character' Check-in 
(The current state of interacting with society as an adult and the psychological state.)
* Focus: Persona Clash (Day Master vs. Month Branch) and the current Luck Cycle (Daewoon).
* Data: Elemental Harmony/Conflict between Day Master (Self) vs. Month Branch (Social Environment) + Combination of Heavenly Stems and Earthly Branches in the current Daewoon. Derive the discrepancy between the "Social Mask" and the "Inner Soul."

04. Career Motion: The Specialist vs. The Visionary 
(Structural suitability for careers and specific fields where talent explodes. Forecast the previous 10 years and the next 10 years by calculating the Daewoon and specific years.)
* Focus: Structural suitability and professional categories based on [Step 1-9]. You MUST include two distinct aspects: 'Structural Fit' (ideal working conditions/environment) and 'Talent Prominence' (where their natural abilities shine). You must also provide a total of at least two specific career fields as examples. Every sentence must maintain the razor-sharp precision and profound depth of the deep analysis report. 
* Data: Month Branch Hidden Stems (Base DNA) + Independence Index (A vs. B) + Industrial Elements + Special Stars (Yeokma, Dohwa, etc.).
* Fact Logic: Prove with data whether "living as a cog in a machine" is soul-crushing or if they must become a "Power Player" within a system.
* FINAL FACTS rules: Mention a star (Sinsal) only if it appears in \`finalFacts.sinsalByPillar\`; never invent one. Take month-branch support (Deuk-ryeong), the current luck cycle, and the Gyo-un-gi (cycle change) from \`finalFacts.strength.gotMonthSupport\` and \`finalFacts.luckCycles\`; never work them out from age yourself.
* Important Point: Ensure the writing never conflicts with or feels disconnected from the facts provided in the previous 9-fact free report and 1500 character interpretation sentences that already you've got.

05. Money Flow: From 'Hustle' to 'Wealth Manifesting'
(Channels of wealth luck and specific behavioral guidelines for attracting money, as well as things that are good to manage or turn into habits.) It is best to connect this naturally while having already well-understood and grasped the career section in part 4.
* Focus: Presence of Wealth Stars (Jae-seong) and whether Output (Sik-sang) generates Wealth.
* Data: Intensity of Wealth Stars + Presence of a "Wealth Vault" (Jae-go) + Timing of wealth luck entry in the Daewoon. Analyze the form of a "Money Pipeline" rather than just simple effort.
* FINAL FACTS rules: Mention a star (Sinsal) only if it appears in \`finalFacts.sinsalByPillar\`. Mention the Wealth Vault (Jae-go) only if "Jaegogwiin" (Wealth Vault) appears in \`finalFacts.sinsalByPillar\`. Take month-branch support (Deuk-ryeong), the current luck cycle, and the Gyo-un-gi (cycle change) from \`finalFacts.strength.gotMonthSupport\` and \`finalFacts.luckCycles\`; never work them out from age yourself.

06. Love & Endgame: Your Relationship Dynamics 
(Dating style, attractive energy, and clear hints about the future spouse. If there are specific years to note, capture the characteristics and inform them. For example, appearance, personality, job, synergy, harmony, etc.)
* Focus: Spouse type and relationship dynamics.
* Data: Visibility of the Spouse Star (Wealth/Authority) via Stems, Branches, or Hidden Stems + Interactions (Hap, Chung, Wonjin) with the Day Branch (Spouse Palace) + Ten Gods of the spouse + the pre-computed \`romanceFacts\` block above and \`finalFacts.lovePeak\` inside FINAL FACTS.
* Fact Logic: Go beyond simple "Dating (Dohwa/Siksang)" and analyze the stability of "Marriage (Spouse Star/Palace)" and the specific vibe of the partner (Elemental characteristics).
* - Do not give generic marriage advice to a student, and do not treat a 40-year-old's relationship as a "first crush." Always consider the customer's age and Daewoon all together.
* CRITICAL - Timing must come only from \`finalFacts.lovePeak\` and \`romanceFacts\` (never recalculate or invent years):
  - Card 7 (the spouse-window card) follows the LOVE PEAK RULE below (same rule as the teaser sentence), with exactly ONE reason and no guess about the partner's job.
  - In exactly ONE love-timing card (the one about the love peak), add this sentence word for word: "If it isn't a romantic partner, this can also arrive as a new family member, a precious friend, or even a pet that changes your days." Do not add it to any other card.
  - This year, next year and the year after: keep using \`romanceFacts.yearLuck\`. Use \`finalFacts.lovePeak\` only for the teaser sentence and Card 7.
  - Do not mention any other future relationship year unless it is listed in \`romanceFacts.yearLuck\` or is the lovePeak year. Describe it as a stronger or calmer period for love, never as a guaranteed event.
* Never suggest to the reader that marriage may be unnecessary, unwanted or not part of their journey. If the spouse star is weak or hidden, say that the person values independence and does best with a partner who respects it.

07. Future Self Sneak Peek: A Letter from 2030 [Focus & Data Spine]
* Focus: The tail end of the current Luck Cycle (Daewoon), the start of the next Daewoon, and the flow of Annual Luck for the following three years (${reportYear+1}~${reportYear+3}), after ${reportYear} (Year of the ${yearNickname(reportYear)}).
* Data: Transition periods of the Daewoon (Gyo-un-gi) + Harmony/Clash relationships between the Stems/Branches of ${reportYear}/${reportYear+1}/${reportYear+2} and the user's Saju + Timing for the realistic manifestation of the Useful God (Yongshin).
* Logic: Prove with data that current struggles are due to a "turning point in luck" and predict what energy will complete your persona in the future. Letter from 2030: you may add ONE playful, lifestyle-flavored line about the customer's future self (a car, a home vibe, a favorite corner of their day), as long as it follows the chart's character (element, strength, style) and is framed as a vibe, not a prediction ("might", "I can picture you"). Never name brands, prices or job titles, and never promise money or relationships through it. Everything else in this section stays grounded in the year relations and luck cycles in FINAL FACTS. Light, chart-grounded hints about travel themes are fine.
* Comfort: Emphasize that "current pain is a 'meaningful growth pain' based on data" to encourage the user.

08. Lucky Environment: Finding Your Sacred Space 
* Focus: Useful God (Yongshin) and Favorable God (Heeshin).
* Data: Climate control (Johu) and Balance (Eokbu) Useful Gods that fill the psychological thirst (elemental deficiency). It is best to clearly write the primary Useful God first—the first character listed in the Useful God data.
* Decision rule for the Useful God explanation cards: Start with FINAL FACTS.yongsin.primary.elements. If climate.stillUrgent is true, present the climate element(s) first and the strength-balance element(s) (balance.usefulElements) second as a real second lever. If not, present balance first and mention climate only if climate.applies.
* Directions, colors and numbers are now decided by code. Use ONLY the values in \`finalFacts.luckyItems\` (direction: at most 2 directions; colors: 3 or fewer; luckyNumbers: one pair). Never invent others and never use any other table or the "climate element first" rule for these three items. Explain why this element in ONE line from \`luckyItems.basis\`, in plain words, e.g. "this is a Useful God element your chart is completely missing".
* Card layout inside section 08 (the card count stays at 11: Cards 1-7 are these analysis cards, then the CLOSING FLOW in Cards 8-11; keep the health and energy advice inside Cards 1-7): the Useful God explanation cards stay as they are; put the direction on its own card; put the colors AND the lucky numbers together on ONE card; use the card that is freed up for the Place card below.
* Place card: Using the customer's birth country (submission.birth_country, see "Birth Country" above) as the default home base, point to the kind of place that matches \`finalFacts.luckyItems.primaryElement\`, and name one or two real regions or cities in that country as examples (Water: coastlines, lakes, big rivers, harbor cities; Metal: clean modern business districts, crisp dry highlands; Wood: forests, parks, green hills, leafy suburbs; Fire: warm sunny regions, lively bright cities; Earth: calm inland plains, solid grounded towns). Then add one sentence: "If you live somewhere else now, apply the same idea where you are: look toward the {direction} side and near {place type}." Then add ONE playful line with 2 or 3 examples from different countries around the world that have that same kind of landscape (e.g. for Water: Lisbon in Portugal, Vancouver in Canada, Busan in Korea, Sydney in Australia), framed as a vibe ("if you ever feel like a change, places like these would feed your Water"), never as advice to relocate and never as a prediction. Choose the examples from the customer's primary Useful God element type only, vary them between reports (do not always list the same ones), and mix continents. Do not claim any country is lucky or unlucky; talk about the type of place, not the people. Use only real places that clearly fit the element's type. EXCEPTION to the 220-character rule: this Place card ONLY may use up to 300 characters including spaces (HARD MAX 300), so the birth-country regions, the "if you live somewhere else" sentence and the 2 or 3 world examples all fit without being cut. Never drop the world examples or the "somewhere else" sentence to save space; trim wording instead. Every other card keeps the 220-character limit.
[Health & Energy Management]
* Focus: Energy overload (strongest element) vs. Isolated elements.
* Data: Elements severely attacked (Clash) within the Saju or elements that are completely missing (thirst). Analyze vulnerable organs and the mechanism through which stress manifests in the body.
(Environmental factors that create a quantum jump in luck, such as directions, countires, colors, habits, etc.)
(Health precautions due to elemental imbalance and energy management tips.)

09. The Next Chapter: Your 2026+ Level-up Roadmap 
* Focus: The intersection of Annual Luck and Great Luck (Daewoon) after ${reportYear}.
* Data: The flow of Heavenly Stems and Earthly Branches after ${reportYear} (Year of the ${yearNickname(reportYear)}) + Analysis of the "Gyo-un-gi" when the current Daewoon changes. Pinpoint turning points in the life scenario and timing for level-ups.
(Confidence regarding the future peak period and the great changes ahead.)
*Also carefully include some cards about individual and hyper-personalized advice to solve his or her own concern that may have been occured for a long time and why, of course based on their own saju-chart.this accurate advice will make his or her life better from ${reportYear} and also their future. They will be really encouraged and motivated so that they love this reading because they will be heart-touched genuinely. like... (one of random examples. 'How fiercely you’ve fought through life?', or 'how lonely you must have been? I know it all. In ${reportYear}, it is perfectly okay to rest a little when you feel like resting. You don't have to plan everything with such urgency. I truly mean it. You are definitely going to be okay and you will truly bloom')

And please, you need to include these 3 sentences for 'everyone'. Because we masked this and showed on the free report page to persuade customers to pay for the paid report. Fill in the blank (*** or ** or *********** this mark), matching to this customer's saju data and context. You can put these sentences anywhere among the 96 cards, considering the context.
- The main theme of your ${reportYear} is *** . (Ground *** in finalFacts: this year's stem/branch ten gods + the current luck cycle in FINAL FACTS.luckCycles.current. Name ONE opportunity and ONE thing to be careful about.)
- Your love luck peaks around ${lovePeakTeaserYear}. The reason is [exactly ONE concrete reason]. Your partner tends to feel like [energy type]. (The free page blurs only ${lovePeakTeaserYear}; in the paid report follow the LOVE PEAK RULE below, including the two-year wording when peak.status is "past".)
- Your wealth flow timing and secret talents are already mapped out like ***** (Ground in decadeFortune score/years and the strongest ten-god group. Give a specific year range and a specific talent.)
- Wealth-timing sentence: place the strongest money window inside a luck cycle whose score in finalFacts.luckCycles is Medium or High (current or previous). If the next cycle is Low, say that cycle is for consolidating what was built, not for expansion. Never call a Low cycle a period of big opportunities.

LOVE PEAK RULE (applies to the teaser sentence above and to Section 06 Card 7):
finalFacts.lovePeak = { window, peak, upcomingPeak }.
- peak = the strongest love-signal year between age 19 and 39. upcomingPeak = the strongest one still ahead.
- If peak.status is "future" or "this year": write only peak.year, with ONE reason.
- If peak.status is "past": write both years in the paid report sentence: "Your love luck peaked around {peak.year} (age {peak.age}), and your next strongest window is around {upcomingPeak.year} (age {upcomingPeak.age})." Give ONE reason for each year (the first item of each year's reasonsEn). Write the past year with warmth, as something the customer likely remembers ("a year when something important may have settled into place"), never as a claim about a specific event.
- Years always come from finalFacts.lovePeak. The model must not choose or alter them. Never invent a year.
- Each reason is the first item of that year's reasonsEn, in plain language (e.g. "because the year's Direct Officer combines with your Day Master"). Do not list several reasons per year, and do not output raw scores.
- Say "love luck is strongest" / "the chance of a meaningful connection is highest". Never say "you will meet your spouse that year". Never guess the partner's job; describe the partner's energy (calm / bold / witty / steady) from romanceFacts.spouseStarElement and palace.tenGodEn.
- Add ONE warm sentence, once only (teaser sentence or Card 7, not both): "If it isn't a romantic partner, this can also arrive as a new family member, a precious friend, or even a pet that changes your days."
- If lovePeak is null, use the most positive-tone year in romanceFacts.yearLuck and one reason from it.

========================================
CROSS-SECTION CONSISTENCY RULE — Sections 04, 07, 09 vs. the pre-computed decadeFortune:
========================================
Sections 04 (Career Motion), 07 (Future Self Sneak Peek: A Letter from 2030), and 09 (The Next
Chapter: Your 2026+ Level-up Roadmap) all narrate future timing. The pre-computed \`decadeFortune\`
object above is silent grounding context ONLY — you never output anything from it directly — but
these three sections must stay tonally consistent with it for whichever decade covers "now" and
"the next 10 years":
- The overall score (상/중/하) for that decade in \`decadeFortune.decades\` is the single source of
  truth for how that period feels overall. Do NOT call a decade scored 하 (Low) a guaranteed "peak
  period" in section 09, and do NOT call a decade scored 상 (High) a "forced rest period" in section 07.
- If a specific future year you mention in 04/07/09 also appears in one of that decade's
  candidate-year arrays (careerYears/relationshipYears/romanceYears/healthYears/cautionYears), the
  reason/theme you give that year must match the reason/polarity already computed for it (e.g. don't
  call 2027 a breakout wealth year in section 04 if \`decadeFortune\` already flags 2027 as a
  \`cautionYears\` entry with polarity "caution").
- In decadeFortune, the '용신 도래' note refers to the strength-balancing element (Eokbu), not the climate element. When FINAL FACTS.yongsin.primary is the climate element, phrase it as 'the element that balances your strength' for that note.

========================================
TRUTH BOMB CARD RULE — Card 8 (the MIRROR + REASON card) in sections 02, 03, 04, 05, 06, 08:
========================================
Sections 02 (Inner Child Era), 03 (Present Energy), 04 (Career Motion), 05 (Money Flow), 06 (Love &
Endgame), and 08 (Lucky Environment/Health) each have their Card 8 as the "Truth Bomb": it names one specific felt experience ("that's why you ...") and gives the chart reason for it.
This is the one card per section allowed to lead with an unflinching, specific truth before pivoting
to comfort — it exists because generic praise gets old, and a sharp, accurate observation followed by
real comfort or a real fix is what makes a paid report feel worth paying for.
- Begin the card with exactly "Truth Bomb: " (this prefix counts toward the character limit) so the reader can spot it.
- The Truth Bomb MUST name ONE concrete item from FINAL FACTS or the chart for that section (a specific ten god in a position, a specific branch relation such as Mi-Ja Wonjin, a missing element, a luck cycle, or a sinsal) and say bluntly, in the first sentence, what behavior it causes. Not a vague, could-apply-to-anyone statement like "you can be moody".
- Then give one concrete fix or earned comfort in the same paragraph. No "you might sometimes", no advice that fits anyone.
- State the truth plainly in the first part of the paragraph, without hedging or softening language up
  front (this is the one card in the whole report allowed to open bluntly).
- In the same paragraph, pivot immediately to genuine comfort and/or one concrete, actionable fix —
  never leave the reader on the harsh part. The comfort must feel earned and specific to the chart,
  not a generic "but it's okay!" tack-on.
- Same format as every other card: ONE paragraph, HARD MAX 220 characters including spaces (count
  before finalizing — if it runs long, cut words, don't add more). Follow the STYLE OF TERMS rules above for any
  Saju term (plain words, no parentheses around ten gods or patterns), never a raw hanja/Hangul character. Same warm Gen-Z wise-friend voice as the rest of the report — the difference
  from other cards is the precision of the observation, not the tone, and NEVER the presence of a raw
  Chinese/Korean character.
- Do not contradict anything already stated elsewhere in that section or in the free 3 facts.

========================================
CLOSING FLOW RULE — the LAST FOUR cards (Cards 8-11) of sections 02, 03, 04, 05, 06, 08:
========================================
Cards 1-7 of these sections stay accurate chart analysis. Cards 8-11 follow this flow, and every card keeps the 220 character limit:
- Card 8 MIRROR + REASON: the Truth Bomb above (keep the "Truth Bomb: " prefix). One specific felt experience and the chart reason for it, using ONE concrete chart item that no other section's Truth Bomb uses.
- Card 9 REFRAME: it must start with "Reframe: " (the prefix counts toward the 220 characters). Show how the same trait is a real strength or design ("what you call X is actually Y"), grounded in the same chart item or a closely related one.
- Card 10: for sections 02, 03 and 08 write a PERMISSION card that starts with "You're allowed to ..." and is specific to this chart. For sections 04 (career), 05 (money) and 06 (love) write a STRATEGY card instead that starts with "Strategy: " (the prefix counts toward the 220 characters): the realistic strengths and constraints of this chart and the single best strategic move (which kind of work structure or role fits, how to use the current luck cycle and the wealthWindow or lovePeak, what to avoid). Keep it concrete and practical, with no guarantees and no financial or legal advice wording.
- Card 11 SMALL ACTION: one doable thing for this week. It must start with "This week:" and tie to the reframe or to the Useful God element. It must be a concrete outside-world action (a message to send, a boundary to set, a small purchase or routine, a place to go, a task to finish). NEVER make it a journaling, writing-down, note-taking, or "reflect on" task.

========================================
CLOSING LETTER RULE — one standalone letter after all 96 cards:
========================================
After the 96 main cards, write exactly ONE closing letter (field name \`closingLetter\`), written as the Gumiho (a warm, perceptive nine-tailed fox spirit) speaking directly to the reader in the first person, and signed at the very end with "- Your Gumiho". HARD LIMIT:
600 characters including spaces, not counting the signature — count the characters before finalizing, and if your draft runs
long, cut sentences/clauses until it fits rather than submitting a longer letter. The letter MUST end on a
warm, complete final sentence (never on a colon, a lead-in like "But here's the truth", or a half-finished thought).
This is not a soft target: a letter over 700 characters is a failed output. This letter should read
as flowing, plain-English prose — avoid naming specific Saju/Ten-God terms here at all if you can
express the same idea through the nature metaphor instead; if you must name one, follow the STYLE OF TERMS
rules above, and never write a raw Chinese/Korean character. This is the single most
emotionally resonant piece of the entire report — it should read like a warm, perceptive friend who
truly sees this person, not a summary of facts already stated. Follow this arc, in flowing prose (not
labeled sections):
1. The letter MUST begin with the customer's English first name, exactly "${displayName.split(' ')[0]}," followed by one short, warm
   empathic sentence (for example "${displayName.split(' ')[0]}, you've been carrying more than anyone has seen."). Use the first name only, never the full name, and never write a Korean or Chinese name. Then name ONE real struggle
   this customer likely carries, drawn from the chart's actual core tension (e.g. an overwhelming
   element with no outlet, a Day Master fighting to hold its ground, a clash between two pillars) —
   acknowledge how exhausting or lonely that struggle has likely been. Example tone: naming a specific
   quiet suffering ("the lonely nights spent trying to prove you're enough") rather than a generic
   compliment.
2. Explain WHY, using one vivid nature/metaphor tied to the actual chart structure already
   established elsewhere in the report (Day Master strength, dominant/missing element, or a key
   clash/combo) — e.g. fertile soil with no dam to hold an overwhelming flood of water. This metaphor
   must be internally consistent with what sections 01 and 08 already said about their elements.
3. Name 2-3 concrete strengths in plain, specific language grounded in the chart (e.g. "you draw
   people to you effortlessly," "money finds its way to you more than most," "you can turn a crisis
   into an opening no one else sees") — not vague praise.
4. Name 1-2 concrete growth points or blind spots in plain, kind language (e.g. "your moods can swing
   harder than you'd like," "you start strong but can lose the thread before the finish," "you give
   too much before you've learned who deserves it") — grounded in the same chart signals used
   elsewhere in the report, not invented from nothing.
5. Close with warmth: a short, genuine note of encouragement that leaves the reader feeling truly
   understood, not just informed.
Do NOT contradict anything already stated in the 96 cards or the free 3 facts — this letter is the
emotional summary of everything already established, not a new analysis.

PERMISSIONS RULE — a separate field \`permissions\` after the closing letter:
Write EXACTLY 3 sentences. Each one starts with "You're allowed to", is specific to this chart (use three DIFFERENT chart items), and is at most 90 characters including spaces. Plain English, Latin script only, no markdown, no guarantees.

OUTPUT JSON STRUCTURE - ABSOLUTELY CRITICAL:
You MUST return EXACTLY 9 sections. Sections 01, 07, 09 have EXACTLY 10 cards. Sections 02, 03, 04,
05, 06, 08 have EXACTLY 11 cards (Cards 1-7 analysis, Card 8 Truth Bomb, Card 9 Reframe, Card 10 Permission or Strategy, Card 11 Small Action).
TOTAL = 96 cards. DO NOT return fewer cards. The user PAID for 96 facts. Returning less is unacceptable.

SECTION TITLES (the Nine Tails). Use exactly these titles as "sectionTitle", in this order:
${TAILS.map((t) => `${String(t.n).padStart(2, '0')}. ${t.title}`).join('\n')}

Then, APPEND the closing letter as a single string field named "closingLetter", and the 3 permission sentences as an array of strings named "permissions".

FINAL JSON STRUCTURE (single valid JSON object):
{
  "mainFacts": [
    {
      "sectionNumber": "01",
      "sectionTitle": "${TAILS[0].title}",
      "cards": [
        { "content": "First insight about their core energy..." },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" }
      ]
    },
    ... (repeat this EXACT structure for all 9 sections — 10 cards for sections 01/07/09, 11 cards
    for sections 02/03/04/05/06/08 with the 8th card being that section's Truth Bomb.)
  ],
  "closingLetter": "[up to 600 characters, a letter from the Gumiho ending on a warm, complete final sentence, then the signature - Your Gumiho, following the CLOSING LETTER RULE above]",
  "permissions": ["You're allowed to ...", "You're allowed to ...", "You're allowed to ..."]
}

Generate the 96 main facts, the closingLetter and the 3 permissions now as a single JSON object.`

    logTiming('prompt:assembled', { userPromptLength: userPrompt.length, systemPromptLength: PAID_REPORT_SYSTEM_PROMPT.length })

    // 6. Gemini API 호출 with retry logic (최대 3번 시도)
    console.log('[v0] Calling Gemini API...')
    const startTime = Date.now()
    
    let rawResponse = ''
    let lastError: Error | null = null
    const MAX_RETRIES = 3
    let strengthRegenerated = false
    let strengthFallback = ''
    let firstAttemptNumber = 0
    let firstAttemptScore = 0
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[v0] Gemini API attempt ${attempt}/${MAX_RETRIES}`)
        logTiming('gemini:attempt-start', { attempt })
        const result = await generateText({
          model: 'google/gemini-2.5-flash',
          system: PAID_REPORT_SYSTEM_PROMPT,
          prompt: userPrompt,
          // 90 main-fact cards + up to 9 decade cards (8 text fields each incl. seasonTitle/seasonEmoji)
          // routinely exceeds 16k output tokens and gets silently truncated mid-JSON. Raised with headroom.
          maxOutputTokens: 32000,
          temperature: 0,
          providerOptions: { google: { thinkingConfig: { thinkingBudget: 1024 } } },
        })
        const usage: any = result.usage
        logTiming('gemini:attempt-end', {
          attempt,
          finishReason: result.finishReason,
          inputTokens: usage?.inputTokens,
          outputTokens: usage?.outputTokens,
          reasoningTokens: usage?.outputTokenDetails?.reasoningTokens ?? usage?.reasoningTokens,
          googleThoughtsTokenCount: (result.providerMetadata as any)?.google?.usageMetadata?.thoughtsTokenCount,
        })
        // finishReason === 'length' means the model hit maxOutputTokens and was cut off mid-JSON —
        // treat this the same as a failure so we retry instead of handing truncated JSON to the parser.
        if (result.finishReason === 'length') {
          throw new Error(`Response truncated by maxOutputTokens (finishReason: length, ${result.text.length} chars)`)
        }
        // 신강/신약 모순 검사: 한 번만 재생성(시도 횟수에 포함). 재생성 후에도 남으면 그대로 저장한다.
        // Truth Bomb 카드가 generic인 경우도 같은 단일 재생성에 포함한다(MAX_RETRIES에 포함).
        const strengthBad = hasStrengthMismatch(result.text, finalFacts?.strength?.grade)
        const genericBombs = findGenericTruthBombSections(result.text)
        for (const n of genericBombs) console.warn(`[v0] check truth-bomb generic section ${n}`)
        // 검사 점수: 신강/신약 모순 3점, 연도 불일치 2점, 밋밋한 Truth Bomb 카드당 1점 (낮을수록 좋음)
        const yearBad = findCycleYearMismatches(result.text, finalFacts?.luckCycles?.all).length > 0
        // 연애 섹션에 "family"+"pet" 문장이 없으면 1점이고, 같은 단일 재생성에 포함한다.
        const petMissing = isLovePetSentenceMissing(result.text)
        if (petMissing) console.warn('[v0] check love pet sentence missing')
        const attemptScore = (strengthBad ? 3 : 0) + (yearBad ? 2 : 0) + genericBombs.length + (petMissing ? 1 : 0)
        if (strengthBad || genericBombs.length > 0 || petMissing) {
          if (!strengthRegenerated && attempt < MAX_RETRIES) {
            strengthRegenerated = true
            strengthFallback = result.text
            firstAttemptNumber = attempt
            firstAttemptScore = attemptScore
            if (strengthBad) {
              console.warn('[v0] check strength mismatch, regenerating once')
              logTiming('check:strength-mismatch', { attempt })
            }
            continue
          }
          if (strengthBad) console.warn('[v0] check strength mismatch persisted')
        }
        rawResponse = result.text
        // 재생성한 경우 두 결과 중 점수가 낮은 쪽을 저장한다. 같으면 두 번째를 저장한다.
        if (strengthFallback) {
          const keepFirst = firstAttemptScore < attemptScore
          if (keepFirst) rawResponse = strengthFallback
          console.log(
            `[v0] check chosen attempt ${keepFirst ? firstAttemptNumber : attempt} (scores ${firstAttemptScore}/${attemptScore})`,
          )
        }
        console.log(`[v0] Gemini API succeeded on attempt ${attempt}`)
        break // 성공하면 루프 종료
      } catch (error) {
        lastError = error as Error
        console.error(`[v0] Gemini API attempt ${attempt} failed:`, error)
        logTiming('gemini:attempt-failed', { attempt })
        
        if (attempt < MAX_RETRIES) {
          // 재시도 전 잠시 대기 (exponential backoff: 2초, 4초)
          const delay = Math.pow(2, attempt) * 1000
          console.log(`[v0] Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    // 재생성이 실패했다면 모순이 있던 첫 결과라도 사용한다
    if (!rawResponse && strengthFallback) {
      rawResponse = strengthFallback
      console.warn('[v0] check strength mismatch persisted')
    }

    // 최종 저장본에 대한 로그 전용 검사 (재생성을 일으키지 않는다)
    if (rawResponse) {
      for (const [term, count] of findRepeatedTerms(rawResponse)) {
        console.warn(`[v0] check repeated term "${term}" x${count}`)
      }
      const allowedYears = collectAllowedYears(
        [finalFacts, romanceFacts, sajuForPrompt, submission.saju_data, submission.birth_date],
        reportYear,
        finalFacts?.luckCycles?.all,
      )
      for (const year of findUnknownYears(rawResponse, allowedYears)) {
        console.warn(`[v0] check unknown year ${year}`)
      }
    }

    // 모든 시도 실패
    if (!rawResponse && lastError) {
      console.error('[v0] All Gemini API attempts failed')
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable. Please try again in a few minutes.',
        details: lastError.message 
      }, { status: 503 })
    }
    
    const geminiTime = Date.now() - startTime
    console.log(`[v0] Gemini API completed in ${geminiTime}ms`)
    console.log('[v0] Response length:', rawResponse.length, 'chars')

    // 7. JSON 파싱 (더 유연한 형식 지원)
    let paidFacts: Fact[] = []
    let closingLetter = ''
    let permissions: string[] = []
    let rawPermissions: unknown = null
    try {
      // 시도 1: ```json ... ``` 형식 (줄바꿈 포함)
      let jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/)
      
      // 시도 2: ```json ... ``` 형식 (줄바꿈 없음)
      if (!jsonMatch) {
        jsonMatch = rawResponse.match(/```json([\s\S]*?)```/)
      }
      
      // 시도 3: ``` ... ``` 형식 (json 키워드 없음)
      if (!jsonMatch) {
        jsonMatch = rawResponse.match(/```\n?([\s\S]*?)\n?```/)
      }
      
      // 시도 4: { ... } 직접 매칭 (객체의 시작과 끝을 정확히 찾기)
      if (!jsonMatch) {
        const startIdx = rawResponse.indexOf('{')
        if (startIdx !== -1) {
          let braceCount = 0
          let endIdx = -1
          for (let i = startIdx; i < rawResponse.length; i++) {
            if (rawResponse[i] === '{') braceCount++
            if (rawResponse[i] === '}') braceCount--
            if (braceCount === 0) {
              endIdx = i
              break
            }
          }
          if (endIdx !== -1) {
            jsonMatch = ['', rawResponse.substring(startIdx, endIdx + 1)]
          }
        }
      }
      
      if (!jsonMatch || !jsonMatch[1]) {
        console.error('[v0] No valid JSON found in response')
        console.error('[v0] Raw response preview:', rawResponse.substring(0, 1000))
        throw new Error('No JSON object found in response')
      }
      
      // JSON 문자열 정제
      const jsonString = jsonMatch[1].trim()
      console.log('[v0] Extracted JSON length:', jsonString.length)
      
      const parsedData = JSON.parse(jsonString)
      
      // mainFacts와 closingLetter 추출
      if (Array.isArray(parsedData)) {
        // 구형식: 배열 직접 반환 (호환성)
        paidFacts = parsedData
      } else if (parsedData.mainFacts && Array.isArray(parsedData.mainFacts)) {
        // 신형식: { mainFacts: [...], closingLetter: "..." }
        paidFacts = parsedData.mainFacts
        closingLetter = typeof parsedData.closingLetter === 'string' ? parsedData.closingLetter.trim() : ''
        rawPermissions = parsedData.permissions
      }

      // 섹션 제목은 모델이 아니라 코드의 Nine Tails 목록으로 고정한다.
      paidFacts = paidFacts.map((section: any) => {
        const tail = TAILS.find((t) => t.n === Number(section?.sectionNumber))
        return tail ? { ...section, sectionTitle: tail.title } : section
      })
      
      console.log('[v0] Successfully parsed', paidFacts.length, 'main facts and a closing letter of', closingLetter.length, 'chars')

      // Safety net: despite explicit prompt rules, the model can still slip in a stray Korean/Chinese
      // character (e.g. a single hanja element like "Earth (土)" or a quoted Ten God term like "'甲'").
      // Simply deleting the CJK character leaves an empty, broken wrapper behind ("Earth ()", "''"),
      // which reads worse than the original problem. So instead: (a) drop the ENTIRE parenthetical or
      // quoted group if it contains a CJK character (rather than leaving an empty shell), (b) strip any
      // remaining stray CJK characters, then (c) clean up the punctuation/spacing debris left behind.
      const CJK_CHAR = '[\\u3131-\\uD79D\\u4E00-\\u9FFF]'
      const CJK_TEST = new RegExp(CJK_CHAR)
      function sanitizeCJKArtifacts(text: string): string {
        let result = text
        // "한글/한자 + 공백 + (English gloss)" -> keep only the English gloss, so "(Gyeong-In) Daewoon"-style empty wrappers never remain.
        result = result.replace(new RegExp(`${CJK_CHAR}+\\s*\\(([^()]*[A-Za-z][^()]*)\\)`, 'g'), '$1')
        // Drop a whole "(...)" group if any CJK character appears inside it, including one trailing
        // comma/space (so "Earth (), is grounded" -> "Earth is grounded", not "Earth , is grounded").
        result = result.replace(new RegExp(`\\s*\\([^()]*${CJK_CHAR}[^()]*\\)\\s*,?`, 'g'), ' ')
        // Drop a whole quoted "'...'" or "\"...\"" group if any CJK character appears inside it.
        result = result.replace(new RegExp(`['"\u2018\u2019\u201C\u201D][^'"\u2018\u2019\u201C\u201D]*${CJK_CHAR}[^'"\u2018\u2019\u201C\u201D]*['"\u2018\u2019\u201C\u201D]`, 'g'), '')
        // Strip any remaining stray CJK characters that weren't wrapped in ()/quotes.
        result = result.replace(new RegExp(CJK_CHAR, 'g'), '')
        // Clean up leftover debris: empty parens/quotes, double spaces, space before punctuation.
        result = result
          .replace(/\(\s*\)/g, '')
          .replace(/["'][\s]*["']/g, '')
          .replace(/\s{2,}/g, ' ')
          .replace(/\s+([,.;!?])/g, '$1')
          .replace(/,\s*,/g, ',')
          .trim()
        return result
      }
      let cjkStripped = 0
      paidFacts = paidFacts.map((section: any) => ({
        ...section,
        cards: Array.isArray(section.cards)
          ? section.cards.map((card: any) => {
              if (typeof card?.content === 'string' && CJK_TEST.test(card.content)) {
                cjkStripped++
                return { ...card, content: sanitizeCJKArtifacts(card.content) }
              }
              return card
            })
          : section.cards,
      }))
      if (CJK_TEST.test(closingLetter)) {
        cjkStripped++
        closingLetter = sanitizeCJKArtifacts(closingLetter)
      }
      if (cjkStripped > 0) {
        console.warn(`[v0] Sanitized stray CJK characters/wrappers from ${cjkStripped} field(s) despite English-only prompt rule`)
      }

      // Safety net: two more formatting slips the model can make despite explicit prompt rules.
      function fixFormattingArtifacts(text: string): string {
        let result = text
        // (a) Strip stray "**" markdown-bold markers — the renderer shows these as literal asterisks
        // since card text is rendered as plain text, not markdown.
        result = result.replace(/\*\*/g, '')
        // (b) Fix "(Romanized-Term - Gloss)" where the romanized term got trapped inside the
        // parentheses with the gloss instead of sitting outside it, e.g. "a missing (Sik-Sin - Eating
        // God)" -> "a missing Sik-Sin (Eating God)". Only matches a capitalized, hyphenated Saju-style
        // term name followed by " - " and a gloss, so it won't touch unrelated parentheticals.
        result = result.replace(/\(([A-Z][a-zA-Z]*(?:-[A-Za-z]+)+)\s*-\s*([^()]+)\)/g, '$1 ($2)')
        return result
      }
      let formattingFixed = 0
      paidFacts = paidFacts.map((section: any) => ({
        ...section,
        cards: Array.isArray(section.cards)
          ? section.cards.map((card: any) => {
              if (typeof card?.content === 'string' && (card.content.includes('**') || /\([A-Z][a-zA-Z]*(?:-[A-Za-z]+)+\s*-\s*[^()]+\)/.test(card.content))) {
                formattingFixed++
                return { ...card, content: fixFormattingArtifacts(card.content) }
              }
              return card
            })
          : section.cards,
      }))
      if (closingLetter.includes('**') || /\([A-Z][a-zA-Z]*(?:-[A-Za-z]+)+\s*-\s*[^()]+\)/.test(closingLetter)) {
        formattingFixed++
        closingLetter = fixFormattingArtifacts(closingLetter)
      }
      if (formattingFixed > 0) {
        console.warn(`[v0] Fixed markdown-asterisk or misplaced-term-gloss formatting in ${formattingFixed} field(s)`)
      }

      // 서명은 길이 계산에서 빼고, 저장 직전에 코드가 한 번만 붙인다.
      closingLetter = stripGumihoSignature(closingLetter)
      permissions = normalizePermissions(rawPermissions).map((p) => {
        let text = CJK_TEST.test(p) ? sanitizeCJKArtifacts(p) : p
        if (text.includes('**')) text = fixFormattingArtifacts(text)
        return text.trim()
      })
      if (permissions.length !== 3) console.warn(`[v0] check permissions count ${permissions.length}`)

      // 수리 패스: 문제 카드(길이 초과, 반복 용어, Truth Bomb 중복, 같은 말)와 700자 넘는 편지만 AI 호출 한 번으로 다시 쓴다.
      const flaggedCards = findProblemCards(paidFacts as any[], [
        finalFacts?.lovePeak?.peak?.year,
        finalFacts?.lovePeak?.upcomingPeak?.year,
      ].filter((y) => y !== undefined && y !== null)).slice(0, REPAIR_MAX_CARDS)
      const closingTooLong = closingLetter.length > CLOSING_LETTER_MAX
      const longPermissions = permissions
        .map((text, i) => ({ text, i }))
        .filter((p) => p.text.length > PERMISSION_MAX_CHARS)
      if (flaggedCards.length > 0 || closingTooLong || longPermissions.length > 0) {
        const countKind = (kind: ProblemKind) => flaggedCards.filter((c) => c.problems.some((p) => p.kind === kind)).length
        console.log(
          `[v0] repair pass: flagged ${flaggedCards.length} cards (long ${countKind('long')}, repeated ${countKind('repeated')}, truth-bomb ${countKind('truth-bomb')}, duplicate ${countKind('duplicate')})` +
            (closingTooLong ? ` + closing letter (${closingLetter.length} chars)` : ''),
        )
        const repairStart = Date.now()
        try {
          const rewrites = await repairProblemCards(
            flaggedCards,
            closingTooLong ? closingLetter : null,
            finalFacts,
            longPermissions,
          )
          const cleanRewrite = (raw: string) => {
            let text = CJK_TEST.test(raw) ? sanitizeCJKArtifacts(raw) : raw
            if (text.includes('**') || /\([A-Z][a-zA-Z]*(?:-[A-Za-z]+)+\s*-\s*[^()]+\)/.test(text)) text = fixFormattingArtifacts(text)
            return text.trim()
          }
          for (const c of flaggedCards) {
            const raw = rewrites.get(String(c.index))
            if (!raw) continue
            let text = cleanRewrite(raw)
            if (!text) continue
            if (c.isTruthBomb && /^Truth Bomb:/i.test(c.text) && !/^Truth Bomb:/i.test(text)) text = `Truth Bomb: ${text}`
            const target = (paidFacts as any[])[c.sectionIdx]?.cards?.[c.cardIdx]
            if (target) (paidFacts as any[])[c.sectionIdx].cards[c.cardIdx] = { ...target, content: text }
          }
          const rewrittenLetter = rewrites.get('closing')
          if (closingTooLong && rewrittenLetter) {
            const text = cleanRewrite(rewrittenLetter)
            if (text && text.length <= CLOSING_LETTER_MAX) closingLetter = stripGumihoSignature(text)
          }
          for (const p of longPermissions) {
            const raw = rewrites.get(`permission-${p.i}`)
            if (!raw) continue
            const text = normalizePermissions([cleanRewrite(raw)])[0]
            if (text && text.length <= PERMISSION_MAX_CHARS) permissions[p.i] = text
          }
        } catch (repairError) {
          console.warn('[v0] repair pass failed, keeping original text:', repairError)
        }
        console.log(`[v0] repair pass done in ${Date.now() - repairStart} ms`)
      }

      // 편지가 여전히 700자를 넘거나 어색하게 끝나면 마지막 완결 문장에서 마무리한다(내용을 새로 붙이지 않는다).
      if (closingLetter) {
        const before = closingLetter.length
        closingLetter = finalizeClosingLetter(closingLetter)
        if (closingLetter.length !== before) console.warn(`[v0] Closing letter finalized: ${before} -> ${closingLetter.length} chars`)
        closingLetter = `${closingLetter}\n\n${GUMIHO_SIGNATURE}`
      }

    } catch (parseError) {
      console.error('[v0] Failed to parse Gemini response:', parseError)
      console.error('[v0] Raw response preview:', rawResponse.substring(0, 500))
      console.error('[v0] Raw response end:', rawResponse.substring(rawResponse.length - 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    {
      const allText = paidFacts
        .flatMap((s: any) => (Array.isArray(s?.cards) ? s.cards.map((c: any) => String(c?.content ?? '')) : []))
        .concat(closingLetter)
        .join('\n')
      const yearMismatches = findCycleYearMismatches(allText, finalFacts?.luckCycles?.all)
      if (yearMismatches.length > 0) {
        console.warn('[v0] check cycle-year mismatch', { found: yearMismatches, listed: finalFacts?.luckCycles?.all?.map((c: any) => c?.yearsActive) })
      }
    }

    logTiming('postprocess:done', { cards: paidFacts.reduce((n: number, s: any) => n + (Array.isArray(s?.cards) ? s.cards.length : 0), 0) })

    // hidden_cards 컬럼(레거시 이름)에 편지, 허락 문장, 구슬 데이터를 함께 저장한다.
    const orb = finalFacts?.orb ?? null
    const hiddenCards =
      closingLetter || permissions.length > 0 || orb ? { closingLetter, permissions, orb } : undefined

    // 8. DB에 저장 (중복 방지: 기존 paid_full 있으면 upsert)
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('section_key', 'paid_full')
      .limit(1)
      .maybeSingle()

    let insertError
    if (existing?.id) {
      // 이미 존재하면 update
      const { error } = await supabase
        .from('reports')
        .update({ facts: paidFacts, payment_id: payment.id, hidden_cards: hiddenCards })
        .eq('id', existing.id)
      insertError = error
    } else {
      // 없으면 insert (hidden_cards 컬럼에 총평 편지를 저장 - 컬럼명은 레거시, 내용은 closingLetter)
      const { error } = await supabase
        .from('reports')
        .insert({
          submission_id: submissionId,
          payment_id: payment.id,
          section_key: 'paid_full',
          facts: paidFacts,
          ...(hiddenCards ? { hidden_cards: hiddenCards } : {}),
          is_free: false,
        })
      insertError = error
    }

    logTiming('db:upsert', { saveFailed: Boolean(insertError) })

    if (insertError) {
      console.error('[v0] Failed to save paid report:', insertError)
    }

    // submissions 테이블에 paid_report_url 저장
    // Always use the canonical production domain so "Find My Report" works reliably.
    // NEXT_PUBLIC_CANONICAL_URL must be set to https://my.sajume.com in Vercel env vars.
    const baseUrl = process.env.NEXT_PUBLIC_CANONICAL_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const paidReportUrl = `${baseUrl}/report/${submissionId}/paid`

    const { error: urlUpdateError } = await supabase
      .from('submissions')
      .update({ paid_report_url: paidReportUrl })
      .eq('id', submissionId)

    if (urlUpdateError) {
      console.error('[v0] Failed to save paid_report_url:', urlUpdateError)
    }

    console.log(`[v0] Successfully generated ${paidFacts.length} paid facts`)

    return NextResponse.json({
      facts: paidFacts,
      closingLetter,
      permissions,
      orb,
      cached: false,
    })

  } catch (error) {
    // Keep route-level failures inside the handler response.
    console.error('[v0] Generate paid report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    if (lockedSubmissionId) inFlightGenerations.delete(lockedSubmissionId)
  }
}
