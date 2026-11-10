// Gumiho (3 questions) input builder. Deterministic. The LLM only turns these facts into sentences.
import { tenGod, group } from './expert-core'
import { yearGanzi, relationsOf } from './romance'
import { TEN_GODS_ENGLISH, STEM_PRONUNCIATION, BRANCH_PRONUNCIATION } from './constants'

const HIDDEN: Record<string, string[]> = { 자: ['임', '계'], 축: ['계', '신', '기'], 인: ['무', '병', '갑'], 묘: ['갑', '을'], 진: ['을', '계', '무'], 사: ['무', '경', '병'], 오: ['병', '기', '정'], 미: ['정', '을', '기'], 신: ['무', '임', '경'], 유: ['경', '신'], 술: ['신', '정', '무'], 해: ['무', '갑', '임'] }
const MAIN: Record<string, string> = { 자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임' }
const CJK = /[ᄀ-ᇿ㄰-㆏가-힯㐀-䶿一-鿿豈-﫿]/g
const EN_STEM = (c: string) => ((STEM_PRONUNCIATION as any)[c] ?? c).split('-')[0]
const EN_BR = (c: string) => (BRANCH_PRONUNCIATION as any)[c] ?? c

/** Deep copy: drop any key whose value is only Korean/Chinese, and strip CJK characters from strings. Arrays/objects kept. */
export function stripCjkDeep<T>(v: T): T {
  const walk = (x: any): any => {
    if (typeof x === 'string') { const s = x.replace(CJK, '').replace(/\(\s*\)|\[\s*\]/g, '').replace(/\s{2,}/g, ' ').trim(); return s }
    if (Array.isArray(x)) return x.map(walk).filter((e) => e !== '' && e !== undefined)
    if (x && typeof x === 'object') {
      const o: any = {}
      for (const [k, val] of Object.entries(x)) {
        if (/Korean$|^fullNameKorean$|^ganziKorean$|^hanja$/i.test(k) || CJK.test(k)) { CJK.lastIndex = 0; continue }
        CJK.lastIndex = 0
        const w = walk(val)
        if (w !== '' && w !== undefined) o[k] = w
      }
      return o
    }
    return x
  }
  return walk(v)
}
export const countCjk = (v: unknown) => (JSON.stringify(v).match(CJK) || []).length

/** Korean age (세는나이) -> international age for the given year */
const intl = (korean: number | undefined, nowYear: number, birthYear?: number) => {
  if (typeof korean !== 'number') return undefined
  if (birthYear) return Math.max(0, korean - 1)
  return Math.max(0, korean - 1)
}

/**
 * Children facts. Only evidence from the chart; the model must speak in probability / tendency terms.
 * childStar: female = 식상(food-god / hurting-officer), male = 관성(officer / seven-killings).
 */
export function buildChildFacts(saju: any, gender: 'male' | 'female', nowYear: number) {
  const dm: string = saju.dayPillar.fullNameKorean[0]
  const target = gender === 'female' ? '식상' : '관성'
  const targetEn = gender === 'female' ? 'Output stars (Eating God / Hurting Officer)' : 'Authority stars (Direct Officer / Seven Killings)'
  const hasHour = !!saju.hourPillar?.fullNameKorean && saju.hourPillar.fullNameKorean.length >= 2
  const P = (p: any) => (p?.fullNameKorean ? [p.fullNameKorean[0], p.fullNameKorean[1]] : [null, null])
  const [ys, yb] = P(saju.yearPillar), [ms, mb] = P(saju.monthPillar), [ds, db] = P(saju.dayPillar), [hs, hb] = hasHour ? P(saju.hourPillar) : [null, null]

  const slots: { pos: string; ch: string; hidden: boolean }[] = []
  const add = (pos: string, ch: string | null, hidden = false) => { if (ch) slots.push({ pos, ch, hidden }) }
  add('year stem', ys); add('month stem', ms); add('hour stem', hs)
  for (const [pos, b] of [['year branch', yb], ['month branch', mb], ['day branch', db], ['hour branch', hb]] as const) {
    if (!b) continue
    ;(HIDDEN[b] || []).forEach((h) => add(pos + ' (hidden)', h, true))
  }
  const hits = slots.filter((s) => group(dm, s.ch) === target)
  const visible = hits.filter((s) => !s.hidden).length
  const hidden = hits.filter((s) => s.hidden).length
  const inHourPillar = hits.filter((s) => s.pos.startsWith('hour')).length

  const natal = {
    stems: { 연간: ys, 월간: ms, 일간: ds, ...(hs ? { 시간: hs } : {}) } as Record<string, string>,
    branches: { 연지: yb, 월지: mb, 일지: db, ...(hb ? { 시지: hb } : {}) } as Record<string, string>,
  }
  const hourBranchRelations = hb
    ? relationsOf('', hb, { stems: {}, branches: { 연지: yb, 월지: mb, 일지: db } }).map((r: any) => ({ with: r.with.replace('연지', 'year branch').replace('월지', 'month branch').replace('일지', 'day branch').replace('시지', 'hour branch'), relation: r.en, polarity: r.polarity }))
    : []

  const years = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => {
    const y = nowYear + k
    const g = yearGanzi(y)
    const sG = group(dm, g[0]), bG = group(dm, MAIN[g[1]])
    const starShown = (sG === target ? 1 : 0) + (bG === target ? 1 : 0)
    const rels = hb ? relationsOf(g[0], g[1], natal).filter((r: any) => /시지|시간/.test(r.with)) : []
    return { year: y, childStarShown: starShown, touchesHourPillar: rels.map((r: any) => r.en), polarityOfHourContact: rels.map((r: any) => r.polarity) }
  }).filter((y) => y.childStarShown > 0 || y.touchesHourPillar.length > 0)

  const strength = hits.length === 0 ? 'none shown in the chart' : hits.length <= 1 ? 'light' : hits.length <= 3 ? 'moderate' : 'strong'
  return {
    note: 'EVIDENCE ONLY. Never state that the user will or will not have children. Describe tendency/probability only. Missing star or missing birth time is NOT evidence of infertility.',
    birthTimeKnown: hasHour,
    childStar: targetEn,
    childStarCount: { total: hits.length, visibleOnStems: visible, hiddenInBranches: hidden, inHourPillar },
    childStarStrength: strength,
    hourPillar: hasHour ? { stemGod: TEN_GODS_ENGLISH[tenGod(dm, hs!)], branchGod: TEN_GODS_ENGLISH[tenGod(dm, MAIN[hb!])], stem: EN_STEM(hs!), branch: EN_BR(hb!), relationsWithOtherBranches: hourBranchRelations } : null,
    yearsWhereChildStarOrHourPillarIsActivated: years,
    evidenceLevel: !hasHour ? 'low (birth time unknown)' : strength === 'none shown in the chart' ? 'low' : strength === 'light' ? 'low-to-moderate' : 'moderate',
  }
}

/** Everything the Gumiho model sees: no Hangul/hanja, international ages. */
export function buildGumihoInputs(args: { sajuForPrompt: any; finalFacts: any; romanceFacts: any; saju: any; gender: 'male' | 'female'; nowYear: number; birthYear?: number; today?: Date }) {
  const { sajuForPrompt, finalFacts, romanceFacts, saju, gender, nowYear, birthYear } = args
  const today = args.today ?? new Date()
  const rf: any = JSON.parse(JSON.stringify(romanceFacts || {}))
  if (rf.currentDaewoon) {
    rf.currentDaewoon.startAge = intl(rf.currentDaewoon.startAge, nowYear, birthYear)
    rf.currentDaewoon.endAge = intl(rf.currentDaewoon.endAge, nowYear, birthYear)
    rf.currentDaewoon.ageNote = 'international ages'
  }
  const childFacts = buildChildFacts(saju, gender, nowYear)
  const allowedYears = new Set<number>([nowYear])
  const collect = (o: any) => { for (const m of JSON.stringify(o ?? {}).matchAll(/\b(19|20)\d{2}\b/g)) allowedYears.add(Number(m[0])) }
  collect(finalFacts?.wealthWindow); collect(finalFacts?.luckCycles); collect(finalFacts?.lovePeak); collect(rf.yearLuck); collect(childFacts.yearsWhereChildStarOrHourPillarIsActivated)
  return {
    sajuForPrompt: stripCjkDeep(sajuForPrompt),
    finalFacts: stripCjkDeep(finalFacts),
    romanceFacts: stripCjkDeep(rf),
    childFacts: stripCjkDeep(childFacts),
    monthlyWindows: stripCjkDeep(buildMonthlyWindows(saju, gender, today)),
    careerLean: stripCjkDeep(buildCareerLean(saju, finalFacts)),
    allowedYears: [...allowedYears].sort(),
  }
}

/** Years mentioned in an answer that are not in the whitelist (birth year and plain ages excluded by caller). */
export function badYears(text: string, allowed: number[], birthYear?: number) {
  const ok = new Set(allowed); if (birthYear) ok.add(birthYear)
  return [...new Set([...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0])))].filter((y) => !ok.has(y) && y >= 2000 && y <= 2060)
}
export const sanitizeAnswer = (t: string) => t.replace(CJK, '').replace(/\(\s*\)/g, '').replace(/ {2,}/g, ' ').trim()

// ===================== v24: depth facts (monthly windows + career lean) =====================
const STEMS10 = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const MONTH_BRANCHES = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'] // starting Feb
const FIRST_MONTH_STEM: Record<string, string> = { 갑: '병', 기: '병', 을: '무', 경: '무', 병: '경', 신: '경', 정: '임', 임: '임', 무: '갑', 계: '갑' }
const POS_EN: Record<string, string> = { 연지: 'year branch', 월지: 'month branch', 일지: 'day branch', 시지: 'hour branch', 연간: 'year stem', 월간: 'month stem', 일간: 'day stem', 시간: 'hour stem', 원국: 'natal chart' }
const posEn = (w: string) => w.split('·').map((p) => POS_EN[p] ?? p).join(' + ')

/** Next 12 months (from today's month). Month pillar taken from the 15th, so solar-term edges never matter. */
export function buildMonthlyWindows(saju: any, gender: 'male' | 'female', today: Date) {
  const dm: string = saju.dayPillar.fullNameKorean[0]
  const P = (p: any) => (p?.fullNameKorean ? [p.fullNameKorean[0], p.fullNameKorean[1]] : [null, null])
  const [ys, yb] = P(saju.yearPillar), [ms, mb] = P(saju.monthPillar), [ds, db] = P(saju.dayPillar), [hs, hb] = P(saju.hourPillar)
  const natal = {
    stems: { 연간: ys, 월간: ms, 일간: ds, ...(hs ? { 시간: hs } : {}) } as Record<string, string>,
    branches: { 연지: yb, 월지: mb, 일지: db, ...(hb ? { 시지: hb } : {}) } as Record<string, string>,
  }
  const spouseGroup = gender === 'female' ? '관성' : '재성'
  const months: any[] = []
  for (let k = 0; k < 12; k++) {
    const d = new Date(today.getFullYear(), today.getMonth() + k, 15)
    const y = d.getFullYear(), m = d.getMonth() + 1
    const sajuYear = m === 1 ? y - 1 : y
    const idx = (m - 2 + 12) % 12
    const stem = STEMS10[(STEMS10.indexOf(FIRST_MONTH_STEM[yearGanzi(sajuYear)[0]]) + idx) % 10]
    const branch = MONTH_BRANCHES[idx]
    const sG = group(dm, stem), bG = group(dm, MAIN[branch])
    const rels = relationsOf(stem, branch, natal)
    const palace = rels.filter((r: any) => /일지|시지|일간/.test(r.with))
    const palaceGood = palace.some((r: any) => r.polarity === 'good'), palaceBad = palace.some((r: any) => r.polarity === 'bad')
    const themes: string[] = []
    if (sG === spouseGroup || bG === spouseGroup) themes.push('partner star active')
    if (palaceGood) themes.push('harmony with your home/partner branches')
    if (palaceBad) themes.push('friction or a clash touching your core branches')
    if (sG === '식상' || bG === '식상') themes.push('expression / change energy (Output stars)')
    if (sG === '재성' || bG === '재성') themes.push('money / opportunity star active')
    if (sG === '관성' || bG === '관성') themes.push('structure / responsibility star active')
    if (sG === '인성' || bG === '인성') themes.push('learning / support star active')
    months.push({
      month: `${y}-${String(m).padStart(2, '0')}`, isCurrentMonth: k === 0,
      pillar: `${EN_STEM(stem)}-${EN_BR(branch)}`,
      stemGod: TEN_GODS_ENGLISH[tenGod(dm, stem)], branchGod: TEN_GODS_ENGLISH[tenGod(dm, MAIN[branch])],
      relationsToYourChart: palace.map((r: any) => ({ relation: r.en, touches: posEn(r.with), polarity: r.polarity })),
      themes,
      _love: (sG === spouseGroup || bG === spouseGroup || palaceGood) && !palaceBad,
      _change: (sG === '식상' || bG === '식상' || rels.some((r: any) => r.type === '지충')) ,
      _money: (sG === '재성' || bG === '재성') && !palaceBad,
      _steady: !palaceBad && (sG === '인성' || bG === '인성' || sG === '관성' || bG === '관성' || palaceGood),
    })
  }
  const pick = (f: string) => months.filter((m) => m[f]).map((m) => m.month)
  const out = {
    note: 'Month-level windows for the next 12 months. Use them to give concrete timing. They are tendencies, not promises. The current month is nearly over: never advise an event "this month" if it is the last week.',
    todayISO: today.toISOString().slice(0, 10),
    months: months.map(({ _love, _change, _money, _steady, ...rest }) => rest),
    supportiveMonthsFor: { meetingOrDeepeningLove: pick('_love'), makingAChange: pick('_change'), moneyOpportunities: pick('_money'), steadyGroundedChoices: pick('_steady') },
  }
  return out
}

const GROUP_TAGS: Record<string, string> = {
  '비겁': 'independence, self-direction, doing things your own way',
  '식상': 'expression, creativity, teaching, communication, hands-on craft',
  '재성': 'practical results, business, managing resources, sales, finance',
  '관성': 'structure, rules, responsibility, institutions, leadership roles',
  '인성': 'learning, caring, healing, specialist knowledge, mentoring',
}
const EL_TAGS: Record<string, string> = { Wood: 'growth, education, design, health & wellness', Fire: 'visibility, media, energy, hospitality', Earth: 'stability, mediation, property, service', Metal: 'precision, technology, finance, quality control', Water: 'flow, information, travel, research, communication' }

/** Career leaning facts (tendency tags only). */
export function buildCareerLean(saju: any, finalFacts: any) {
  const dm: string = saju.dayPillar.fullNameKorean[0]
  const P = (p: any) => (p?.fullNameKorean ? [p.fullNameKorean[0], p.fullNameKorean[1]] : [null, null])
  const chars: { ch: string; w: number }[] = []
  const [ys, yb] = P(saju.yearPillar), [ms, mb] = P(saju.monthPillar), [, db] = P(saju.dayPillar), [hs, hb] = P(saju.hourPillar)
  ;[[ys, 1], [ms, 2], [hs, 1]].forEach(([c, w]: any) => c && chars.push({ ch: c, w }))
  ;[[yb, 1], [mb, 3], [db, 2], [hb, 1]].forEach(([b, w]: any) => b && (HIDDEN[b] || []).forEach((h, i) => chars.push({ ch: h, w: w * (i === (HIDDEN[b].length - 1) ? 2 : 1) })))
  const score: Record<string, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 }
  chars.forEach(({ ch, w }) => { score[group(dm, ch)] += w })
  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1])
  const EN: Record<string, string> = { 비겁: 'Peer stars', 식상: 'Output stars', 재성: 'Wealth stars', 관성: 'Authority stars', 인성: 'Resource stars' }
  const els: string[] = (finalFacts?.yongsin?.primary?.elements ?? []).filter((e: string) => EL_TAGS[e])
  return {
    note: 'Tendency tags for career talk. Do NOT name a profession as destiny. Offer them as "directions that fit your wiring" and compare with the user\'s current field.',
    strongestThemes: sorted.slice(0, 2).map(([g]) => ({ theme: EN[g], fits: GROUP_TAGS[g] })),
    quietestTheme: { theme: EN[sorted[4][0]], fits: GROUP_TAGS[sorted[4][0]], meaning: 'an area that takes more conscious effort, not a weakness' },
    usefulElementFits: els.map((e) => ({ element: e, fits: EL_TAGS[e] })),
  }
}
