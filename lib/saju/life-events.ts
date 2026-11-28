// 과거/미래 "사건 해" 후보를 근거 점수로 고르는 모듈 (실험 단계, 아직 레포트에 연결하지 않음).
// 원리: 원국 -> 대운 -> 세운이 겹칠 때만 사건 해로 본다. 한 해의 십성 하나만으로는 고르지 않는다.
// - 커리어: 관성 겹침(조직·입학), 식상+재성(창업·수익화), 월지(직업궁)의 합·충·형, 대운 교체, 상관견관(조직 마찰)
// - 연애: 배우자성(여: 관성, 남: 재성)이 대운·세운에 겹침, 일지(배우자궁)의 합·삼합·충, 일간 천간합, 천지덕합
// - 힘든 해: 기신이 대운·세운에 겹침, 용신 자리를 충, 교운기+형충, 상관견관, 군비쟁재
// 연도는 사주 연도(입춘 기준)다. 1~2월 초의 일은 전년도 사주에 속한다.
import { tenGod, group, type Group } from './expert-core'
import { yearGanzi } from './romance'

const MAIN: Record<string, string> = { 자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임' }
const STEM_EL: Record<string, string> = { 갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수' }
const BRANCH_EL: Record<string, string> = { 자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화', 오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수' }
const STEM_HAP: [string, string][] = [['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계']]
const YUKHAP: [string, string][] = [['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']]
const CHUNG: [string, string][] = [['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']]
const WONJIN: [string, string][] = [['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']]
const HAE: [string, string][] = [['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']]
const PA: [string, string][] = [['자', '유'], ['축', '진'], ['인', '해'], ['묘', '오'], ['사', '신'], ['술', '미']]
const HYEONG: [string, string][] = [['인', '사'], ['사', '신'], ['인', '신'], ['축', '술'], ['술', '미'], ['축', '미'], ['자', '묘']]
const SAMHAP: [string[], string][] = [[['신', '자', '진'], '자'], [['해', '묘', '미'], '묘'], [['인', '오', '술'], '오'], [['사', '유', '축'], '유']]
const inPair = (t: [string, string][], a: string, b: string) => t.some(([x, y]) => (x === a && y === b) || (x === b && y === a))

export type EventTopic = 'career' | 'love' | 'hard'
export interface YearEvidence {
  year: number
  age: number // 만 나이 기준(연도 - 출생연도)
  ganzi: string
  score: number
  reasons: string[]
  reasonsEn: string[]
  kind?: string // 커리어 사건 종류 / 힘든 해의 영역
}
export interface LifeEvents {
  career: YearEvidence[]
  love: YearEvidence[]
  hard: YearEvidence[]
  note: string
}

type Pillar = { stem: string; branch: string }
export interface LifeEventInput {
  natal: { year: Pillar; month: Pillar; day: Pillar; hour?: Pillar | null }
  daewoon: Array<{ stem: string; branch: string; startAge: number; endAge: number }> // startAge = 세는나이
  gender: 'male' | 'female'
  birthYear: number
  favorable: Group[] // 용신 + 희신 (억부)
  johuElements?: string[] // 조후 용신 오행 (한글, 예: ['수','금'])
  strong: boolean
  fromYear: number
  toYear: number
}

function samhapWith(branch: string, others: string[]): 'full' | 'half' | null {
  for (const [grp, wang] of SAMHAP) {
    if (!grp.includes(branch)) continue
    const present = new Set([branch, ...others.filter((b) => grp.includes(b))])
    if (present.size === 3) return 'full'
    if (present.size === 2 && present.has(wang)) return 'half'
  }
  return null
}

export function scoreLifeEvents(a: LifeEventInput): LifeEvents {
  const dm = a.natal.day.stem
  const dayBr = a.natal.day.branch
  const monBr = a.natal.month.branch
  const natalBranches = [a.natal.year.branch, a.natal.month.branch, a.natal.day.branch, a.natal.hour?.branch].filter(Boolean) as string[]
  const natalStems = [a.natal.year.stem, a.natal.month.stem, a.natal.hour?.stem].filter(Boolean) as string[]
  const all: Group[] = ['비겁', '식상', '재성', '관성', '인성']
  const gisin = all.filter((g) => !a.favorable.includes(g))
  const spouse: Group = a.gender === 'female' ? '관성' : '재성'
  const natalHasJae = [...natalStems, ...natalBranches.map((b) => MAIN[b])].some((x) => group(dm, x) === '재성')
  // 조후 용신이 앉은 원국 지지 (예: 수 -> 자)
  const johuSeats = natalBranches.filter((b) => (a.johuElements ?? []).includes(BRANCH_EL[b]))

  const decadeOf = (y: number) =>
    a.daewoon.map((d) => ({ ...d, startYear: a.birthYear + d.startAge - 1, endYear: a.birthYear + d.endAge - 1 })).find((d) => d.startYear <= y && y < d.endYear)

  const career: YearEvidence[] = [], love: YearEvidence[] = [], hard: YearEvidence[] = []

  for (let y = a.fromYear; y <= a.toYear; y++) {
    const g = yearGanzi(y)
    const ys = g[0], yb = g[1]
    const age = y - a.birthYear
    const d = decadeOf(y)
    const yStemG = group(dm, ys), yBrG = group(dm, MAIN[yb])
    const yGroups = new Set<Group>([yStemG, yBrG])
    const dGroups = new Set<Group>(d ? [group(dm, d.stem), group(dm, MAIN[d.branch])] : [])
    const isCycleStart = !!d && d.startYear === y
    const yTen = [tenGod(dm, ys), tenGod(dm, MAIN[yb])]
    const dTen = d ? [tenGod(dm, d.stem), tenGod(dm, MAIN[d.branch])] : []
    // 상관견관은 그 해가 상관을 데려올 때만 본다 (대운 자체가 상관이면 10년 내내 켜지므로 제외)
    const sangGwanVsGwan = yTen.includes('상관') && (dGroups.has('관성') || yGroups.has('관성'))

    // ---------------- 커리어 ----------------
    {
      let s = 0; const r: string[] = []; const e: string[] = []; const kinds: string[] = []
      if (yGroups.has('관성') && dGroups.has('관성')) { s += 3; r.push('관성이 대운과 세운에 겹침'); e.push('Officer (job, title) energy in both the 10-year cycle and the year'); kinds.push('organization') }
      else if (yGroups.has('관성')) { s += 1; r.push('세운 관성'); e.push('Officer energy arrives that year') }
      if (yGroups.has('식상') && yGroups.has('재성')) { s += 2.5; r.push('세운에 식상+재성 (만든 것을 돈으로)'); e.push('Output and Wealth together that year (turning what you make into money)'); kinds.push('business') }
      else if ((yGroups.has('식상') && dGroups.has('재성')) || (yGroups.has('재성') && dGroups.has('식상'))) { s += 1; r.push('대운과 함께 식상+재성'); e.push('Output and Wealth completed with the 10-year cycle') }
      if (yGroups.has('인성') && age < 30) { s += 0.5; r.push('세운 인성 (학업·자격)'); e.push('Resource energy (study, credentials)') }
      if (inPair(CHUNG, yb, monBr)) { s += 2.5; r.push(`월지 ${monBr}와 충`); e.push('a clash with your career pillar (Month Branch)'); kinds.push('leave-or-move') }
      const monHap = inPair(YUKHAP, yb, monBr), monHyeong = inPair(HYEONG, yb, monBr)
      // 사신(巳申)처럼 합과 형이 같이 걸리면 서로 상쇄되어 약하게 본다
      if (monHap && monHyeong) { s += 1; r.push(`월지 ${monBr}와 합·형이 함께 (약한 신호)`); e.push('a mixed combination and penalty with your career pillar') }
      else if (monHap) { s += 2; r.push(`월지 ${monBr}와 육합`); e.push('a combination with your career pillar (Month Branch)'); kinds.push('join') }
      else if (monHyeong) { s += 1.5; r.push(`월지 ${monBr}와 형`); e.push('a penalty (pressure) on your career pillar'); kinds.push('pressure') }
      const sMon = samhapWith(yb, [monBr, ...(d ? [d.branch] : [])])
      if (sMon && [monBr].some((b) => SAMHAP.some(([grp]) => grp.includes(b) && grp.includes(yb)))) { s += sMon === 'full' ? 2 : 1; r.push(`월지와 삼합(${sMon})`); e.push('a harmony group with your career pillar') }
      if (isCycleStart) { s += 2.5; r.push('대운 교체 해'); e.push('your 10-year luck cycle changed that year'); kinds.push('reset') }
      if (isCycleStart && (inPair(CHUNG, yb, dayBr) || inPair(CHUNG, yb, monBr))) { s += 1; r.push('교운기에 충이 겹침'); e.push('a clash landed in the same year the cycle changed') }
      if (inPair(CHUNG, yb, dayBr)) { s += 1; r.push(`일지 ${dayBr}와 충 (생활 환경 변화)`); e.push('a clash with your Day Branch (daily life shifted)') }
      if (sangGwanVsGwan) { s += 1; r.push('상관견관 (조직·윗사람과 마찰)'); e.push('Hurting Officer met Officer (friction with rules or bosses)'); kinds.push('friction') }
      let kind = kinds.includes('reset') ? 'reset' : kinds.includes('business') ? 'start-business' : kinds.includes('leave-or-move') ? 'leave-or-move' : kinds.includes('organization') || kinds.includes('join') ? 'join-or-promotion' : kinds[0]
      if (age < 22 && kind) kind = 'school-or-path' // 22세 이전 커리어 신호는 입학·전공·진로로 본다
      if (s > 0 && age >= 17) career.push({ year: y, age, ganzi: g, score: s, reasons: r, reasonsEn: e, kind })
    }

    // ---------------- 연애 ----------------
    if (age >= 16) {
      let s = 0; const r: string[] = []; const e: string[] = []
      if (dGroups.has(spouse)) { s += 2; r.push(`대운에 배우자성(${spouse})`); e.push('partner star active in your 10-year cycle') }
      if (yStemG === spouse) { s += 2; r.push(`세운 천간에 배우자성`); e.push(`partner star in the year stem`) }
      if (yBrG === spouse) { s += 1.5; r.push(`세운 지지에 배우자성`); e.push(`partner star in the year branch`) }
      if (inPair(YUKHAP, yb, dayBr)) { s += 2; r.push(`일지 ${dayBr}와 육합`); e.push('a combination with your Spouse Palace (Day Branch)') }
      const sDay = samhapWith(yb, [dayBr, ...(d ? [d.branch] : [])])
      if (sDay && SAMHAP.some(([grp]) => grp.includes(dayBr) && grp.includes(yb))) { s += sDay === 'full' ? 3 : 2; r.push(`일지와 삼합(${sDay})`); e.push('a harmony group with your Spouse Palace') }
      if (inPair(CHUNG, yb, dayBr)) { s += 1.5; r.push(`일지 ${dayBr}와 충 (관계의 큰 변동)`); e.push('a clash with your Spouse Palace (a big relationship shift)') }
      const stemHapDm = inPair(STEM_HAP, ys, dm)
      if (stemHapDm) { s += 1; r.push('일간과 천간합'); e.push('the year stem combined with your Day Master') }
      if (stemHapDm && inPair(YUKHAP, yb, dayBr)) { s += 2; r.push('천지덕합 (합이 가장 강한 해)'); e.push('stem and branch both combined with your Day Pillar (the strongest bonding year)') }
      if (s > 0) love.push({ year: y, age, ganzi: g, score: s, reasons: r, reasonsEn: e })
    }

    // ---------------- 힘든 해 ----------------
    {
      let s = 0; const r: string[] = []; const e: string[] = []; const areas = new Set<string>()
      const yGisin = gisin.includes(yStemG) && gisin.includes(yBrG)
      if (yGisin) { s += 2; r.push('세운 천간·지지가 모두 기신') }
      if (yGisin && d && gisin.includes(group(dm, d.stem))) { s += 1; r.push('대운까지 기신') }
      for (const seat of johuSeats) if (inPair(CHUNG, yb, seat)) { s += 3; r.push(`용신 자리(${seat})를 충`); areas.add('energy') }
      const dayHits = [inPair(HYEONG, yb, dayBr) && '형', inPair(PA, yb, dayBr) && '파', (inPair(WONJIN, yb, dayBr) || inPair(HAE, yb, dayBr)) && '원진·해'].filter(Boolean)
      if (dayHits.length) { s += dayHits.length; r.push(`일지와 ${dayHits.join('·')}`); areas.add('relationships') }
      const monHits = [inPair(HYEONG, yb, monBr) && '형', inPair(WONJIN, yb, monBr) && '원진'].filter(Boolean)
      if (monHits.length) { s += monHits.length; r.push(`월지와 ${monHits.join('·')}`); areas.add('career') }
      if (isCycleStart && (inPair(CHUNG, yb, dayBr) || inPair(CHUNG, yb, monBr) || dayHits.length)) { s += 2; r.push('교운기에 형·충이 겹침') }
      if (sangGwanVsGwan) { s += 1.5; r.push('상관견관'); areas.add('career') }
      if (a.strong && natalHasJae && yStemG === '비겁' && yBrG === '비겁') { s += 1.5; r.push('군비쟁재 (돈·사람을 두고 경쟁)'); areas.add('money') }
      if (s > 0) hard.push({ year: y, age, ganzi: g, score: s, reasons: r, reasonsEn: e, kind: [...areas].join('+') || undefined })
    }
  }

  const top = (list: YearEvidence[]) => list.sort((x, y) => y.score - x.score || x.year - y.year)
  return {
    career: top(career),
    love: top(love),
    hard: top(hard),
    note: 'Years are Saju years (they start around 4 February). Events in January or early February belong to the previous Saju year.',
  }
}

// ---------------------------------------------------------------------------------------------
// 레포트 연결부: saju_data -> 입력, 그리고 검증된 규칙으로 되돌아보기 카드 고르기
// 규칙(4명 정답지로 검증, 2026-11-28):
//  - 커리어: 작년까지 중 22세 이후 & 4점 이상의 최고점 1개 (없으면 22세 이전 4점 이상 1개, 없으면 없음)
//  - 연애: 작년까지 중 18세 이후 & 7점 이상의 최고점 1개 (없으면 없음)
//  - 과거 힘든 해: 쓰지 않음
// ---------------------------------------------------------------------------------------------
const EL_STEM: Record<string, string> = { 목: '갑', 화: '병', 토: '무', 금: '경', 수: '임' }
const HANJA_TO_KO: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
}
const ko = (c: string | undefined) => (c ? HANJA_TO_KO[c] ?? c : '')
function pillarOf(p: any): Pillar | null {
  if (!p) return null
  const kr = typeof p.fullNameKorean === 'string' && p.fullNameKorean.length === 2 ? p.fullNameKorean : null
  const stem = kr ? kr[0] : ko(p.stem)
  const branch = kr ? kr[1] : ko(p.branch)
  return stem && branch ? { stem, branch } : null
}

/** 억부 용·희신 + 조후 오행 십성 (+ 신약이고 희신이 비면 비겁) */
export function favorableGroups(expert: any, dayStem: string): Group[] {
  const out = new Set<Group>([...(expert?.eokYong ?? []), ...(expert?.eokHee ?? [])] as Group[])
  for (const el of expert?.johu?.elements ?? []) if (EL_STEM[el]) out.add(group(dayStem, EL_STEM[el]))
  if (expert && expert.strong === false && !(expert.eokHee ?? []).length) out.add('비겁')
  return [...out]
}

export function lifeEventInputFromSaju(saju: any, gender: 'male' | 'female', birthYear: number, toYear: number): LifeEventInput | null {
  const year = pillarOf(saju?.yearPillar), month = pillarOf(saju?.monthPillar), day = pillarOf(saju?.dayPillar)
  if (!year || !month || !day || !Array.isArray(saju?.daewoon) || !saju?.expert) return null
  const daewoon = saju.daewoon
    .map((d: any) => ({ stem: ko(d.stem), branch: ko(d.branch), startAge: Number(d.startAge), endAge: Number(d.endAge) }))
    .filter((d: any) => d.stem && d.branch && Number.isFinite(d.startAge) && Number.isFinite(d.endAge))
  return {
    natal: { year, month, day, hour: pillarOf(saju?.hourPillar) },
    daewoon,
    gender,
    birthYear,
    favorable: favorableGroups(saju.expert, day.stem),
    johuElements: saju.expert?.johu?.elements ?? [],
    strong: !!saju.expert?.strong,
    fromYear: birthYear + 16,
    toYear,
  }
}

const KIND_EN: Record<string, string> = {
  'reset': 'a reset of your whole environment (work, home or both changed at once)',
  'start-business': 'starting something of your own or turning a skill into income',
  'leave-or-move': 'leaving a place or role and moving to a new one',
  'join-or-promotion': 'joining an organisation or stepping into a bigger role, with pressure attached',
  'school-or-path': 'a big decision about your studies or direction',
}
export interface LookBack { year: number; age: number; ganzi: string; score: number; kind?: string; kindEn?: string; reasonsEn: string[] }
export interface LookBacks { career: LookBack | null; love: LookBack | null; loves: LookBack[]; note: string }

export function pickLookBacks(ev: LifeEvents, reportYear: number): LookBacks {
  const past = (l: YearEvidence[]) => l.filter((y) => y.year < reportYear)
  const best = (l: YearEvidence[]) => [...l].sort((a, b) => b.score - a.score || b.year - a.year)[0] ?? null
  const c = past(ev.career).filter((y) => y.score >= 4)
  const careerPick = best(c.filter((y) => y.age >= 22)) ?? best(c)
  const loveHigh = [...past(ev.love).filter((y) => y.score >= 7 && y.age >= 18)].sort((a, b) => b.score - a.score || b.year - a.year).slice(0, 2)
  const lovePick = loveHigh[0] ?? null
  const toLB = (y: YearEvidence | null): LookBack | null =>
    y ? { year: y.year, age: y.age, ganzi: y.ganzi, score: y.score, kind: y.kind, kindEn: y.kind ? KIND_EN[y.kind] : undefined, reasonsEn: y.reasonsEn } : null
  return {
    career: toLB(careerPick),
    love: toLB(lovePick),
    loves: loveHigh.map((y) => toLB(y)!).sort((a, b) => a.year - b.year),
    note: 'Saju years start around 4 February, so write each year as "around <year>, into early <year+1>".',
  }
}

export function buildLookBacks(saju: any, gender: 'male' | 'female', birthYear: number | undefined, reportYear: number): LookBacks | null {
  if (!birthYear) return null
  const input = lifeEventInputFromSaju(saju, gender, birthYear, reportYear - 1)
  if (!input) return null
  return pickLookBacks(scoreLifeEvents(input), reportYear)
}

// ---------------------------------------------------------------------------------------------
// 연애운 정점 (유료 레포트 lovePeak 와 무료 페이지 20xx). 4명 정답지 10개 중 8개 적중한 근거 점수(위 love)를 쓴다.
//  - peak: 올해~5년 안 최고점(3점 이상), 없으면 10년 안. 그것도 없으면 과거 7점 이상 최고점. 다 없으면 null.
//  - upcomingPeak: 위 미래 최고점 (없으면 null)
//  - pastPeaks: 18세 이후 과거 7점 이상 최대 2개 (되돌아보기 카드와 같은 값)
// 모양은 romance.ts buildLovePeak 와 같게 유지해서 기존 사용처가 그대로 동작한다.
// ---------------------------------------------------------------------------------------------
export const LOVE_WINDOW_V2 = { aheadYears: 5, maxAheadYears: 10 }
export function buildLovePeakV2(saju: any, gender: 'male' | 'female', reportYear: number, birthYear?: number) {
  if (!birthYear) return null
  const toYear = reportYear + LOVE_WINDOW_V2.maxAheadYears
  const input = lifeEventInputFromSaju(saju, gender, birthYear, Math.max(toYear, reportYear))
  if (!input) return null
  const ev = scoreLifeEvents(input)
  const mk = (y: YearEvidence | undefined | null) =>
    y && { year: y.year, age: y.age, ganziEn: y.ganzi, score: y.score, status: y.year < reportYear ? 'past' : y.year === reportYear ? 'this year' : 'future', reasonsEn: y.reasonsEn.slice(0, 2), cautionsEn: [] as string[] }
  const byScore = (a: YearEvidence, b: YearEvidence) => b.score - a.score || a.year - b.year
  const ahead = (n: number) => ev.love.filter((y) => y.year >= reportYear && y.year <= reportYear + n && y.score >= 3).sort(byScore)[0] ?? null
  const future = ahead(LOVE_WINDOW_V2.aheadYears) ?? ahead(LOVE_WINDOW_V2.maxAheadYears)
  const pastHigh = ev.love.filter((y) => y.year < reportYear && y.age >= 18 && y.score >= 7).sort(byScore).slice(0, 2)
  const peak = future ?? pastHigh[0] ?? null
  if (!peak) return null
  return {
    window: { fromYear: reportYear, toYear, fromAge: reportYear - birthYear, toAge: toYear - birthYear },
    peak: mk(peak),
    upcomingPeak: mk(future),
    pastPeaks: pastHigh.map((y) => mk(y)).sort((a: any, b: any) => a.year - b.year),
    note: 'Evidence score (partner star in the 10-year cycle and the year, Spouse Palace combinations and clashes). Use as "strongest signal in the chart", never as a prediction.',
  }
}
