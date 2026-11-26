// Year Snapshot (2027 Snapshot) for the $7.99 Gumiho checkout add-on only.
// All chart numbers come from existing code (yearGanzi, relationsOf, tenGod, buildMonthlyWindows, luck cycles).
// The LLM writes text only; scores, zodiacs, birth years and the lucky color are filled in by code.
import { tenGod } from './expert-core'
import { yearGanzi, yearNickname, relationsOf } from './romance'
import { TEN_GODS_ENGLISH } from './constants'
import { buildMonthlyWindows, stripCjkDeep } from './gumiho-context'

export const SITUATION_OPTIONS = ['Student', 'Job seeker', 'Employee', 'Freelancer', 'Business owner', 'Taking a break'] as const
export const RELATIONSHIP_OPTIONS = ['Single', 'Dating', 'Married', "It's complicated"] as const
export const isSituation = (v: unknown): v is string => typeof v === 'string' && (SITUATION_OPTIONS as readonly string[]).includes(v)
export const isRelationship = (v: unknown): v is string => typeof v === 'string' && (RELATIONSHIP_OPTIONS as readonly string[]).includes(v)

const ANIMAL: Record<string, string> = { 자: 'Rat', 축: 'Ox', 인: 'Tiger', 묘: 'Rabbit', 진: 'Dragon', 사: 'Snake', 오: 'Horse', 미: 'Goat', 신: 'Monkey', 유: 'Rooster', 술: 'Dog', 해: 'Pig' }
const MAIN: Record<string, string> = { 자: '계', 축: '기', 인: '갑', 묘: '을', 진: '무', 사: '병', 오: '정', 미: '기', 신: '경', 유: '신', 술: '무', 해: '임' }
// Same pair tables as lib/saju/romance.ts
const YUKHAP: [string, string][] = [['자', '축'], ['인', '해'], ['묘', '술'], ['진', '유'], ['사', '신'], ['오', '미']]
const SAMHAP: string[][] = [['신', '자', '진'], ['해', '묘', '미'], ['인', '오', '술'], ['사', '유', '축']]
const CHUNG: [string, string][] = [['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']]
const WONJIN: [string, string][] = [['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']]
const HAE: [string, string][] = [['자', '미'], ['축', '오'], ['인', '사'], ['묘', '진'], ['신', '해'], ['유', '술']]
const partnerOf = (t: [string, string][], b: string) => t.flatMap(([x, y]) => (x === b ? [y] : y === b ? [x] : []))

const POS_EN: Record<string, string> = { 연간: 'year stem', 월간: 'month stem', 일간: 'Day Master', 시간: 'hour stem', 연지: 'year branch', 월지: 'month branch', 일지: 'day branch (inner self / spouse palace)', 시지: 'hour branch', 원국: 'natal chart' }
const COLOR: Record<string, string> = { Water: 'deep blue', Metal: 'white and silver', Wood: 'green', Fire: 'warm red', Earth: 'sand beige' }
const clamp = (n: number) => Math.max(52, Math.min(94, Math.round(n)))

function exampleYears(branch: string, birthYear?: number): number[] {
  const center = birthYear ?? 1995
  const ys: number[] = []
  for (let y = center - 12; y <= center + 12; y++) if (yearGanzi(y)[1] === branch) ys.push(y)
  return ys.sort((a, b) => Math.abs(a - center) - Math.abs(b - center)).slice(0, 2).sort((a, b) => a - b)
}

function yearInfo(y: number, dm: string, natal: { stems: Record<string, string>; branches: Record<string, string> }) {
  const g = yearGanzi(y)
  return {
    year: y,
    nickname: yearNickname(y),
    stemTenGodEn: TEN_GODS_ENGLISH[tenGod(dm, g[0])],
    branchTenGodEn: TEN_GODS_ENGLISH[tenGod(dm, MAIN[g[1]])],
    relationsToYourChart: relationsOf(g[0], g[1], natal).map((r) => ({
      relation: r.en,
      polarity: r.polarity,
      touches: r.with.split('·').map((w) => POS_EN[w] ?? w).join(' + '),
    })),
  }
}

export function buildYearSnapshotFacts(args: { saju: any; gender: 'male' | 'female'; focusYear: number; birthYear?: number; finalFacts: any; romanceFacts: any }) {
  const { saju, gender, focusYear, birthYear, finalFacts, romanceFacts } = args
  const P = (p: any) => (p?.fullNameKorean ? [p.fullNameKorean[0], p.fullNameKorean[1]] : [null, null])
  const [ys, yb] = P(saju.yearPillar), [ms, mb] = P(saju.monthPillar), [ds, db] = P(saju.dayPillar), [hs, hb] = P(saju.hourPillar)
  const dm: string = ds
  const natal = {
    stems: { 연간: ys, 월간: ms, 일간: ds, ...(hs ? { 시간: hs } : {}) } as Record<string, string>,
    branches: { 연지: yb, 월지: mb, 일지: db, ...(hb ? { 시지: hb } : {}) } as Record<string, string>,
  }

  const mw = buildMonthlyWindows(saju, gender, new Date(focusYear, 0, 15))
  const s = mw.supportiveMonthsFor
  const frictionMonths: string[] = mw.months.filter((m: any) => (m.relationsToYourChart ?? []).some((r: any) => r.polarity === 'bad')).map((m: any) => m.month)

  // Zodiacs from the Day Branch (the inner self / spouse palace).
  const ownBranch = birthYear ? yearGanzi(birthYear)[1] : yb
  const samhapPartners = (SAMHAP.find((g) => g.includes(db)) ?? []).filter((b) => b !== db)
  const luckyBranches = [...samhapPartners, ...partnerOf(YUKHAP, db)].filter((b, i, a) => a.indexOf(b) === i).slice(0, 2)
  const cautionBranch = [...partnerOf(WONJIN, db), ...partnerOf(HAE, db), ...partnerOf(CHUNG, db)][0] ?? null
  const z = (b: string) => ({ animal: ANIMAL[b], exampleBirthYears: exampleYears(b, birthYear) })

  const el: string | undefined = (finalFacts?.yongsin?.primary?.elements ?? []).find((e: string) => COLOR[e])
  const months = (k: keyof typeof s) => (s[k] ?? []).length

  return {
    year: yearInfo(focusYear, dm, natal),
    previousYear: yearInfo(focusYear - 1, dm, natal),
    months: stripCjkDeep(mw.months),
    supportiveMonthsFor: s,
    frictionMonths,
    currentLuckCycle: stripCjkDeep(finalFacts?.luckCycles?.current ?? romanceFacts?.currentDaewoon ?? null),
    zodiacs: {
      lucky: luckyBranches.map(z),
      caution: cautionBranch ? { ...z(cautionBranch), isOwnZodiac: cautionBranch === ownBranch } : null,
    },
    scores: {
      love: clamp(60 + 5 * months('meetingOrDeepeningLove')),
      money: clamp(60 + 5 * months('moneyOpportunities')),
      career: clamp(60 + 4 * months('makingAChange') + 2 * months('steadyGroundedChoices')),
    },
    luckyColor: el ? { color: COLOR[el], element: el } : null,
  }
}

export type YearSnapshotFacts = ReturnType<typeof buildYearSnapshotFacts>
