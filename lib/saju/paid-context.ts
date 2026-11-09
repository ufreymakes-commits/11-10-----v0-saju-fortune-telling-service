// 유료 리포트 프롬프트용 "정리된 사주 데이터". 옛 필드(조후 문자열, 옛 신살, 옛 강도 %, 과거 중심 결혼 타이밍)를 제거하고
// 전문가 기준 확정값만 남겨 LLM 에게 모순 없는 단일 근거를 준다.
import { BRANCH_PRONUNCIATION, STEM_PRONUNCIATION, TEN_GODS_ENGLISH, STEM_TO_ELEMENT, ELEMENTS, ELEMENT_ENGLISH } from './constants'
import { yearGanzi, yearNickname, buildLovePeak } from './romance'
import { calculateDecadeFortune } from './decade-fortune'
import { romanizeName } from '../romanize-name'

// LLM 에 한글이 들어가면 한글을 그대로 따라 쓰고 뒤에 영어 괄호를 붙인다(그 뒤 한글만 지워져 "(Hurting Officer)" 같은 빈 괄호 문장이 됨).
// 그래서 프롬프트에 들어가는 신살 이름 / 12운성 / 등급은 미리 영어로 바꿔 둔다.
const SINSAL_GLOSS: Record<string, string> = { 도화살: 'Peach Blossom', 홍염살: 'Red Flame', 백호살: 'White Tiger', 현침살: 'Sharp Needle', 공망: 'Void', 원진살: 'Resentment', 재고귀인: 'Wealth Vault', 천을귀인: 'Noble Helper', 태극귀인: 'Grand Ultimate Noble', 천록귀인: 'Heavenly Salary', 양인살: 'Blade', 고신살: 'Lonely Star', 과숙살: 'Widow Star', 음양살: 'Yin-Yang Imbalance', 음욕살: 'Passion', 여연살: 'Romance Star', 남연살: 'Romance Star', 효신살: 'Owl Spirit', 학당귀인: 'Scholar Noble', 문창귀인: 'Literary Noble', 역마살: 'Traveling Horse', 화개살: 'Canopy', 괴강: 'Kwegang', 간여지동: 'Same Stem and Branch', 금여: 'Golden Carriage', 암록: 'Hidden Salary', 정록: 'Salary Seat', 복성귀인: 'Fortune Star' }
const STAR_EN: Record<string, string> = { 장생: 'Birth', 목욕: 'Bath', 관대: 'Crown', 건록: 'Prosperity', 제왕: 'Peak', 쇠: 'Decline', 병: 'Illness', 사: 'Death', 묘: 'Tomb', 절: 'Extinction', 태: 'Conception', 양: 'Nurture' }
const GRADE_EN: Record<string, string> = { 상: 'High', 중: 'Medium', 하: 'Low' }
const GRADE_STR_EN: Record<string, string> = { 신약: 'Weak', 중화신약: 'Balanced-leaning Weak', 중화신강: 'Balanced-leaning Strong', 신강: 'Strong' }
const GROUP_EN: Record<string, string> = { 비겁: 'Peers (Shoulder to Shoulder / Rob Wealth)', 식상: 'Output (Eating God / Hurting Officer)', 재성: 'Wealth', 관성: 'Officer', 인성: 'Seal (Resource)' }
const PATTERN_EN: Record<string, string> = { 군비쟁재격: 'Rob Wealth Fighting Wealth', 인중용재격: 'Seal-heavy, Wealth as medicine', 관살태과격: 'Excess Officers', 재중용비격: 'Wealth-heavy, Peers as medicine' }
const GYEOK_EN: Record<string, string> = { 정관격: 'Direct Officer pattern', 편관격: 'Indirect Officer pattern', 정재격: 'Direct Wealth pattern', 편재격: 'Indirect Wealth pattern', 식신격: 'Eating God pattern', 상관격: 'Hurting Officer pattern', 정인격: 'Direct Seal pattern', 편인격: 'Indirect Seal pattern', 비견격: 'Shoulder to Shoulder pattern', 겁재격: 'Rob Wealth pattern' }
// 정답지 10개 대조: 개운 항목(방위·색·숫자)의 오행 = "쓸 수 있는 오행(조후/억부 용신·희신·격국용신) 중 원국 8글자에 하나도 없는 오행" (8/8 포함).
// 후보가 여러 개면 헤드라인 용신 순서를 우선(7/8; 1건은 정답지가 다른 후보를 고름).
const LUCKY_TABLE: Record<string, { dir: string; colors: string[]; numbers: string }> = {
  Wood: { dir: 'East', colors: ['green', 'teal'], numbers: '3 and 8' }, Fire: { dir: 'South', colors: ['red', 'orange'], numbers: '2 and 7' },
  Earth: { dir: 'Center, Southwest or Northeast', colors: ['yellow', 'brown'], numbers: '5 and 10' }, Metal: { dir: 'West', colors: ['white', 'silver', 'gold'], numbers: '4 and 9' },
  Water: { dir: 'North', colors: ['black', 'navy'], numbers: '1 and 6' },
}
function luckyItems(saju: any, groupEl: (g: string) => string | null) {
  const e = saju?.expert; if (!e) return null
  const EN_TO_KO: Record<string, string> = { Wood: '목', Fire: '화', Earth: '토', Metal: '금', Water: '수' }
  const head: string[] = (e.headline?.elements ?? []).map((k: string) => (ELEMENT_ENGLISH as any)[k]).filter(Boolean)
  const cand: string[] = []
  for (const x of [...head, ...(e.eokYong ?? []).map(groupEl), ...(e.eokHee ?? []).map(groupEl), ...(e.gyeokYong ?? []).map(groupEl)]) if (x && !cand.includes(x)) cand.push(x)
  const cnt = saju.elementCountBasicKorean ?? {}
  const missing = cand.filter((x) => (cnt[EN_TO_KO[x]] ?? 0) === 0)
  const primary = missing[0] ?? head[0] ?? cand[0]
  if (!primary) return null
  const secondary = head[0] && head[0] !== primary ? head[0] : null
  return {
    primaryElement: primary, basis: missing.length ? 'a useful element that is completely missing from the chart' : 'the first Useful God element',
    direction: [LUCKY_TABLE[primary].dir, secondary ? LUCKY_TABLE[secondary].dir : null].filter(Boolean),
    colors: [...LUCKY_TABLE[primary].colors.slice(0, 2), ...(secondary ? LUCKY_TABLE[secondary].colors.slice(0, 1) : [])],
    luckyNumbers: LUCKY_TABLE[primary].numbers,
    note: 'Use ONLY these directions, colors and numbers (3 colors max, one pair of numbers, 2 directions max). Explain in one line why this element: it is a Useful God element that your chart is missing. NAMING RULE: never call this element the "primary lucky element" or the "primary Useful God" (the headline Useful God is in yongsin.primary and may be a different element). Call it "the element behind your lucky directions, colors and numbers".',
  }
}
const ganziEn = (g?: string) => g && g.length >= 2 ? `${((STEM_PRONUNCIATION as any)[g[0]] ?? g[0]).split('-')[0]}-${(BRANCH_PRONUNCIATION as any)[g[1]] ?? g[1]}` : g
export const sinsalEn = (ko: string) => { const r = romanizeName(ko).replace(/\s+/g, ''); return SINSAL_GLOSS[ko] ? `${r} (${SINSAL_GLOSS[ko]})` : r }

/** 저장된 saju_data 의 decadeFortune 은 옛 연도 계산(시작 연도 +1 오류)을 담고 있을 수 있다. 저장된 값을 믿지 않고 항상 다시 계산해 채운다. */
export function refreshDecadeFortune(saju: any, gender: 'male' | 'female', birthYear?: number) {
  try {
    if (!saju || !birthYear || !Array.isArray(saju.daewoon)) return saju
    const k = (p: any) => p?.fullNameKorean || ''
    const dayK = k(saju.dayPillar), monthK = k(saju.monthPillar), yearK = k(saju.yearPillar), hourK = k(saju.hourPillar)
    if (!dayK || !monthK || !yearK) return saju
    return {
      ...saju,
      decadeFortune: calculateDecadeFortune({
        gender, dayStem: dayK.charAt(0), dayBranch: dayK.charAt(1), monthBranch: monthK.charAt(1), yearBranch: yearK.charAt(1), hourBranch: hourK.charAt(1) || null,
        birthYear, isDayMasterStrong: saju.expert ? !!saju.expert.strong : (saju.sinGangSinYak?.ratio ?? 0) >= 50, daewoon: saju.daewoon,
      }),
    }
  } catch (e) { console.error('[v0] refreshDecadeFortune failed (using stored decadeFortune):', e); return saju }
}

const GROUPS = ['비겁', '식상', '재성', '관성', '인성'] as const
const SELF_GODS = ['비견', '겁재', '정인', '편인']   // 월지가 이 십성이면 득령(月令을 얻음)

/** 옛 marriageTiming signals(한글) → 영어 근거. 번역 못 하는 항목은 버린다. */
export function signalToEnglish(sig: string): string | null {
  const ten = (k: string) => TEN_GODS_ENGLISH[k] ?? k
  let m: RegExpMatchArray | null
  if ((m = sig.match(/세운 천간에 배우자성\((.{2})\) 출현/))) return `the year's Heavenly Stem carries your spouse star, ${ten(m[1])}`
  if ((m = sig.match(/세운 지지에 배우자성\((.{2})\) 출현/))) return `the year's Earthly Branch carries your spouse star, ${ten(m[1])}`
  if ((m = sig.match(/대운 천간에 배우자성\((.{2})\) 동반/))) return `your current luck cycle's Heavenly Stem also carries the spouse star, ${ten(m[1])}`
  if ((m = sig.match(/세운 천간에 식상\((.{2})\) 출현/))) return `the year's Heavenly Stem brings an expression star, ${ten(m[1])}, which lifts charm and romance`
  if (/일지와 육합/.test(sig)) return `the year forms a Hap (Combination) with your Day Branch, the spouse palace`
  if (/일지와 삼합\(반합\)/.test(sig)) return `the year forms a half Samhap (Triple Harmony) with your Day Branch, the spouse palace`
  return null
}

export function buildPaidContext(saju: any, gender: 'male' | 'female', reportYear: number, birthYear?: number) {
  const sd = JSON.parse(JSON.stringify(saju ?? {}))
  // 옛/모순 필드 제거 (설명은 route 의 이전 단계 메모 참고)
  for (const k of ['johuYongsin', 'spirits', 'sinsalDetails', 'sinsalSummary', 'sinsalCombinedGuide', 'hapChungSummary', 'hapChungAdjustmentDetails', 'elementAdjustmentHistory', 'marriageTiming', 'sinGangSinYak', 'decadeFortune', 'gilseong']) delete sd[k]

  const expert = saju?.expert
  const dm: string = saju?.dayMasterKorean || saju?.dayPillar?.fullNameKorean?.[0] || ''
  const dmEl = (STEM_TO_ELEMENT as any)[dm] as string | undefined
  const di = dmEl ? (ELEMENTS as readonly string[]).indexOf(dmEl) : -1
  const groupEl = (g: string) => (di < 0 ? null : (ELEMENT_ENGLISH as any)[(ELEMENTS as any)[(di + GROUPS.indexOf(g as any)) % 5]])
  const toEn = (els: string[] = []) => els.map((e) => (ELEMENT_ENGLISH as any)[e]).filter(Boolean)

  const monthGod = saju?.tenGods?.byPosition?.monthBranch
  const finalFacts: any = {
    note: 'FINAL code-computed facts. They override anything you would infer yourself and any older field. Do not recalculate.',
    reportYear: { year: reportYear, ganziEn: ganziEn(yearGanzi(reportYear)), nickname: yearNickname(reportYear) },
    dayMaster: dm ? { stem: (STEM_PRONUNCIATION as any)[dm], element: dmEl ? (ELEMENT_ENGLISH as any)[dmEl] : null } : null,
  }
  if (expert) {
    finalFacts.strength = { grade: GRADE_STR_EN[expert.grade] ?? expert.grade, score: expert.support, outOf: 120, note: 'This is a 0-120 score, NOT a percentage. Never write it as "%".', gotMonthSupport: monthGod ? SELF_GODS.includes(monthGod) : null }
    {
      const g = String(finalFacts.strength.grade)
      const weak = /weak/i.test(g)
      const mid = /balanced/i.test(g)
      finalFacts.strength.rule = weak
        ? 'The Day Master is WEAK. Never call it strong or self-reliant by strength.'
        : mid
          ? 'The Day Master is near balance (' + g + '). Describe it as balanced; do not call it clearly strong or clearly weak.'
          : 'The Day Master is STRONG. Never call it weak. Never use "Weak Self", "Overwhelming Wealth, Weak Self" or "Jae-Da-Sin-Yak". A pattern of Rob Wealth fighting for wealth is fine; it does not make the chart weak.'
    }
    {
      const bp = saju?.tenGods?.byPosition
      if (bp) {
        const t = (k: string) => (bp[k] && bp[k] !== '일간' ? ((TEN_GODS_ENGLISH as any)[bp[k]] ?? bp[k]) : null)
        const POS: Record<string, string> = { yearStem: 'Year Stem', yearBranch: 'Year Branch', monthStem: 'Month Stem', monthBranch: 'Month Branch', dayBranch: 'Day Branch', hourStem: 'Hour Stem', hourBranch: 'Hour Branch' }
        const byGod: Record<string, string[]> = {}
        for (const k of Object.keys(POS)) { const g = t(k); if (g) (byGod[g] ||= []).push(POS[k]) }
        finalFacts.tenGodsByGod = { ...byGod, note: 'Same data grouped by ten god. When you say where a ten god sits, copy these positions exactly. Stems and branches are different positions: never merge "Year Stem and Month Stem" with "Year Branch and Month Branch".' }
        finalFacts.tenGodsByPosition = { yearStem: t('yearStem'), yearBranch: t('yearBranch'), monthStem: t('monthStem'), monthBranch: t('monthBranch'), dayBranch: t('dayBranch'), hourStem: t('hourStem'), hourBranch: t('hourBranch'), note: 'Use these exact positions. A ten god is attached to the position listed here only (a stem is not a branch).' }
      }
    }
    finalFacts.gyeokguk = { name: GYEOK_EN[expert.gyeok] ?? expert.gyeok, monthStemRevealed: expert.gyeokTuchul }
    finalFacts.yongsin = {
      primary: { source: expert.headline?.source === '조후' ? 'Climate balance (Johu) comes first because the season is extreme and not yet balanced in the chart' : 'Strength balance (Eokbu)', elements: toEn(expert.headline?.elements) },
      climate: { applies: !!expert.johu?.applicable, kind: expert.johu?.kind === '조열' ? 'hot and dry' : expert.johu?.kind === '한습' ? 'cold and damp' : null, stillUrgent: !!expert.johu?.urgent, neededElements: toEn(expert.johu?.elements) },
      balance: { patternName: PATTERN_EN[expert.eokName] ?? expert.eokName, usefulGroups: (expert.eokYong || []).map((g: string) => GROUP_EN[g] ?? g), usefulElements: (expert.eokYong || []).map(groupEl), supportingElements: (expert.eokHee || []).map(groupEl) },
      note: 'When the climate element is the primary one, the strength-balance element is still a real second lever. Present both; never call either the only Useful God.',
    }
  }
  // 대운: 이전 / 현재 / 다음
  const decs: any[] | undefined = saju?.decadeFortune?.decades
  if (decs) {
    const i = decs.findIndex((x) => x.startYear <= reportYear && reportYear < x.endYear)
    const fmt = (x: any) => x && ({ ganzi: ganziEn(x.ganziKorean ?? x.ganzi), yearsActive: `${x.startYear}-${x.endYear - 1}`, internationalAges: `${x.startAge - 1}-${x.endAge - 2}`, stemTenGodEn: TEN_GODS_ENGLISH[x.stemTenGod] ?? x.stemTenGod, twelveStar: STAR_EN[x.twelveStar] ?? x.twelveStar, score: GRADE_EN[x.score] ?? x.score })
    finalFacts.luckCycles = { previous: i > 0 ? fmt(decs[i - 1]) : null, current: i >= 0 ? fmt(decs[i]) : null, next: i >= 0 && decs[i + 1] ? fmt(decs[i + 1]) : null, all: decs.map(fmt), changesInYear: i >= 0 ? decs[i].endYear : null, note: 'Use these for "current / previous / next" cycle statements. Cite the YEARS (yearsActive), and if you give ages use internationalAges only (never Korean-age numbers). Do not work out the current cycle from age yourself. "all" lists EVERY 10-year cycle with its exact years and ages: when you mention any cycle (including childhood ones) use its years and ages from "all" exactly, never your own numbers, and never mention a cycle that is not in the list.' }
  }
  finalFacts.luckyItems = luckyItems(saju, groupEl)
  // 신살: 전문가 기준 슬롯별 + 12신살 (옛 spirits 오탐 제거)
  finalFacts.sinsalByPillar = saju?.expertSinsal ? Object.fromEntries(Object.entries(saju.expertSinsal).map(([slot, names]) => [({ 시: 'hour', 일: 'day', 월: 'month', 연: 'year' } as any)[slot] ?? slot, (names as string[]).map(sinsalEn)])) : null
  // 연애운 정점: 만 19~39세 구간에서 점수가 가장 높은 해 (romance.ts buildLovePeak). 옛 marriageTiming 은 사용하지 않는다.
  finalFacts.lovePeak = buildLovePeak(saju, gender, reportYear, birthYear)
  return { sajuForPrompt: sd, finalFacts }
}
