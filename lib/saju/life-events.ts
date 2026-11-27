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
      let s = 0; const r: string[] = []; const kinds: string[] = []
      if (yGroups.has('관성') && dGroups.has('관성')) { s += 3; r.push('관성이 대운과 세운에 겹침'); kinds.push('organization') }
      else if (yGroups.has('관성')) { s += 1; r.push('세운 관성') }
      if (yGroups.has('식상') && yGroups.has('재성')) { s += 2.5; r.push('세운에 식상+재성 (만든 것을 돈으로)'); kinds.push('business') }
      else if ((yGroups.has('식상') && dGroups.has('재성')) || (yGroups.has('재성') && dGroups.has('식상'))) { s += 1; r.push('대운과 함께 식상+재성') }
      if (yGroups.has('인성') && age < 30) { s += 0.5; r.push('세운 인성 (학업·자격)') }
      if (inPair(CHUNG, yb, monBr)) { s += 2.5; r.push(`월지 ${monBr}와 충`); kinds.push('leave-or-move') }
      const monHap = inPair(YUKHAP, yb, monBr), monHyeong = inPair(HYEONG, yb, monBr)
      // 사신(巳申)처럼 합과 형이 같이 걸리면 서로 상쇄되어 약하게 본다
      if (monHap && monHyeong) { s += 1; r.push(`월지 ${monBr}와 합·형이 함께 (약한 신호)`) }
      else if (monHap) { s += 2; r.push(`월지 ${monBr}와 육합`); kinds.push('join') }
      else if (monHyeong) { s += 1.5; r.push(`월지 ${monBr}와 형`); kinds.push('pressure') }
      const sMon = samhapWith(yb, [monBr, ...(d ? [d.branch] : [])])
      if (sMon && [monBr].some((b) => SAMHAP.some(([grp]) => grp.includes(b) && grp.includes(yb)))) { s += sMon === 'full' ? 2 : 1; r.push(`월지와 삼합(${sMon})`) }
      if (isCycleStart) { s += 2.5; r.push('대운 교체 해'); kinds.push('reset') }
      if (isCycleStart && (inPair(CHUNG, yb, dayBr) || inPair(CHUNG, yb, monBr))) { s += 1; r.push('교운기에 충이 겹침') }
      if (inPair(CHUNG, yb, dayBr)) { s += 1; r.push(`일지 ${dayBr}와 충 (생활 환경 변화)`) }
      if (sangGwanVsGwan) { s += 1; r.push('상관견관 (조직·윗사람과 마찰)'); kinds.push('friction') }
      let kind = kinds.includes('reset') ? 'reset' : kinds.includes('business') ? 'start-business' : kinds.includes('leave-or-move') ? 'leave-or-move' : kinds.includes('organization') || kinds.includes('join') ? 'join-or-promotion' : kinds[0]
      if (age < 22 && kind) kind = 'school-or-path' // 22세 이전 커리어 신호는 입학·전공·진로로 본다
      if (s > 0 && age >= 17) career.push({ year: y, age, ganzi: g, score: s, reasons: r, kind })
    }

    // ---------------- 연애 ----------------
    if (age >= 16) {
      let s = 0; const r: string[] = []
      if (dGroups.has(spouse)) { s += 2; r.push(`대운에 배우자성(${spouse})`) }
      if (yStemG === spouse) { s += 2; r.push(`세운 천간에 배우자성`) }
      if (yBrG === spouse) { s += 1.5; r.push(`세운 지지에 배우자성`) }
      if (inPair(YUKHAP, yb, dayBr)) { s += 2; r.push(`일지 ${dayBr}와 육합`) }
      const sDay = samhapWith(yb, [dayBr, ...(d ? [d.branch] : [])])
      if (sDay && SAMHAP.some(([grp]) => grp.includes(dayBr) && grp.includes(yb))) { s += sDay === 'full' ? 3 : 2; r.push(`일지와 삼합(${sDay})`) }
      if (inPair(CHUNG, yb, dayBr)) { s += 1.5; r.push(`일지 ${dayBr}와 충 (관계의 큰 변동)`) }
      const stemHapDm = inPair(STEM_HAP, ys, dm)
      if (stemHapDm) { s += 1; r.push('일간과 천간합') }
      if (stemHapDm && inPair(YUKHAP, yb, dayBr)) { s += 2; r.push('천지덕합 (합이 가장 강한 해)') }
      if (s > 0) love.push({ year: y, age, ganzi: g, score: s, reasons: r })
    }

    // ---------------- 힘든 해 ----------------
    {
      let s = 0; const r: string[] = []; const areas = new Set<string>()
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
      if (s > 0) hard.push({ year: y, age, ganzi: g, score: s, reasons: r, kind: [...areas].join('+') || undefined })
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
