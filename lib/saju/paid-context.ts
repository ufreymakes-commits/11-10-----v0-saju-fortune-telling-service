// 유료 리포트 프롬프트용 "정리된 사주 데이터". 옛 필드(조후 문자열, 옛 신살, 옛 강도 %, 과거 중심 결혼 타이밍)를 제거하고
// 전문가 기준 확정값만 남겨 LLM 에게 모순 없는 단일 근거를 준다.
import { STEM_PRONUNCIATION, TEN_GODS_ENGLISH, STEM_TO_ELEMENT, ELEMENTS, ELEMENT_ENGLISH } from './constants'
import { yearGanzi, yearNickname, buildLovePeak } from './romance'

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
    reportYear: { year: reportYear, ganziEn: yearGanzi(reportYear), nickname: yearNickname(reportYear) },
    dayMaster: dm ? { stem: (STEM_PRONUNCIATION as any)[dm], element: dmEl ? (ELEMENT_ENGLISH as any)[dmEl] : null } : null,
  }
  if (expert) {
    finalFacts.strength = { grade: expert.grade, score: expert.support, outOf: 120, note: 'This is a 0-120 score, NOT a percentage. Never write it as "%".', gotMonthSupport: monthGod ? SELF_GODS.includes(monthGod) : null }
    finalFacts.gyeokguk = { name: expert.gyeok, monthStemRevealed: expert.gyeokTuchul }
    finalFacts.yongsin = {
      primary: { source: expert.headline?.source === '조후' ? 'Climate balance (Johu) comes first because the season is extreme and not yet balanced in the chart' : 'Strength balance (Eokbu)', elements: toEn(expert.headline?.elements) },
      climate: { applies: !!expert.johu?.applicable, kind: expert.johu?.kind === '조열' ? 'hot and dry' : expert.johu?.kind === '한습' ? 'cold and damp' : null, stillUrgent: !!expert.johu?.urgent, neededElements: toEn(expert.johu?.elements) },
      balance: { patternName: expert.eokName, usefulGroups: expert.eokYong, usefulElements: (expert.eokYong || []).map(groupEl), supportingElements: (expert.eokHee || []).map(groupEl) },
      note: 'When the climate element is the primary one, the strength-balance element is still a real second lever. Present both; never call either the only Useful God.',
    }
  }
  // 대운: 이전 / 현재 / 다음
  const decs: any[] | undefined = saju?.decadeFortune?.decades
  if (decs) {
    const i = decs.findIndex((x) => x.startYear <= reportYear && reportYear < x.endYear)
    const fmt = (x: any) => x && ({ ganzi: x.ganziKorean ?? x.ganzi, ages: `${x.startAge}-${x.endAge}`, years: `${x.startYear}-${x.endYear}`, stemTenGodEn: TEN_GODS_ENGLISH[x.stemTenGod] ?? x.stemTenGod, twelveStar: x.twelveStar, score: x.score })
    finalFacts.luckCycles = { previous: i > 0 ? fmt(decs[i - 1]) : null, current: i >= 0 ? fmt(decs[i]) : null, next: i >= 0 && decs[i + 1] ? fmt(decs[i + 1]) : null, changesInYear: i >= 0 ? decs[i].endYear : null, note: 'Use these for "current / previous / next" cycle statements. Do not work out the current cycle from age yourself.' }
  }
  // 신살: 전문가 기준 슬롯별 + 12신살 (옛 spirits 오탐 제거)
  finalFacts.sinsalByPillar = saju?.expertSinsal ?? null
  // 연애운 정점: 만 19~39세 구간에서 점수가 가장 높은 해 (romance.ts buildLovePeak). 옛 marriageTiming 은 사용하지 않는다.
  finalFacts.lovePeak = buildLovePeak(saju, gender, reportYear, birthYear)
  return { sajuForPrompt: sd, finalFacts }
}
