/**
 * lib/saju/skeleton.ts
 *
 * 사주 전문가 해설지(정답지 4건)를 기준으로 역산한 "결정론적 해석 뼈대".
 * 입력: calculateSaju()의 반환값(SajuData). 출력: LLM(Stage 2)에 넘길 확정 값 + 근거.
 *
 * 정답지에서 확인된 규칙만 넣었고, 표본이 적어 임계값이 고정되지 않은 곳은 THRESHOLDS 로 분리했다.
 * LLM 은 이 결과를 "문장으로 옮기는 일"만 한다.
 */

export type Group = '비겁' | '식상' | '재성' | '관성' | '인성'
type El = '목' | '화' | '토' | '금' | '수'

const EL_ORDER: El[] = ['목', '화', '토', '금', '수']
const STEM_EL: Record<string, El> = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토', 기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
}
const GOD_GROUP: Record<string, Group> = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성',
  편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
}
const POS = ['yearStem', 'yearBranch', 'monthStem', 'monthBranch', 'dayBranch', 'hourStem', 'hourBranch'] as const // 일간 자리는 제외

// 표본 4개로는 확정 못 한 값. 사주 전문가 확인 후 조정.
export const THRESHOLDS = {
  independenceGap: 2,   // A-B' ≥ 2 → Independent, |A-B'| ≤ 1 → Hybrid, ≤ -2 → Organizational
  heavyGroup: 3,        // 8글자 중 한 십성 그룹이 3개 이상이면 태과/다(多)
}

const INDUSTRY: Record<El, string[]> = {
  목: ['education', 'growth', 'content', 'planning'],
  화: ['media', 'marketing', 'influence', 'entertainment'],
  토: ['real estate', 'operations', 'management', 'systems'],
  금: ['finance', 'law', 'technology', 'data', 'analysis'],
  수: ['trade', 'logistics', 'communication', 'distribution', 'platforms', 'information'],
}
const SHINSAL_CAREER: Record<string, string> = {
  현침살: 'precision / medical / IT / design',
  도화살: 'public exposure / content / branding',
  년살: 'public exposure / charm',
  역마살: 'mobility / travel / trade / global work',
  화개살: 'art / philosophy / study',
  문창귀인: 'writing / education / research',
  장성살: 'leadership',
}

// ---------- 인접 기둥 규칙 (정답지 3건에서 일관) ----------
// 육합·충·형·파·반합·천간합충 = 인접 기둥만. 삼합(3글자)·해·원진 = 거리 무관.
const PILLAR_IDX: Record<string, number> = { 연: 0, 월: 1, 일: 2, 시: 3 }
function pillarsIn(s: string): number[] {
  const m = [...s.matchAll(/(연|월|일|시)(간|지)/g)]
  return [...new Set(m.map((x) => PILLAR_IDX[x[1]]))].sort((a, b) => a - b)
}
function isDistanceFree(s: string): boolean {
  if (/\(해\)|원진/.test(s)) return true
  if (/\(삼합\)|\(방합\)/.test(s)) return true // 3글자 완성형만
  return false
}
export function splitByAdjacency(list: string[] | undefined) {
  const kept: string[] = []
  const dropped: string[] = []
  for (const s of list ?? []) {
    const p = pillarsIn(s)
    const ok = isDistanceFree(s) || p.length < 2 || p.every((v, i) => i === 0 || v - p[i - 1] === 1)
    ;(ok ? kept : dropped).push(s)
  }
  return { kept, dropped }
}

// ---------- 본체 ----------
export function buildSkeleton(saju: any, gender: 'male' | 'female') {
  const dm = saju.dayMasterKorean as string
  const dmEl = STEM_EL[dm]
  const di = EL_ORDER.indexOf(dmEl)
  const elToGroup: Record<El, Group> = {
    [EL_ORDER[di]]: '비겁',
    [EL_ORDER[(di + 1) % 5]]: '식상',
    [EL_ORDER[(di + 2) % 5]]: '재성',
    [EL_ORDER[(di + 3) % 5]]: '관성',
    [EL_ORDER[(di + 4) % 5]]: '인성',
  } as Record<El, Group>

  const bp = saju.tenGods?.byPosition ?? {}
  const gods: Record<string, string> = {}
  for (const k of POS) if (bp[k]) gods[k] = bp[k]

  const godCount: Record<string, number> = {}
  const groupCount: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 }
  for (const g of Object.values(gods)) {
    godCount[g] = (godCount[g] || 0) + 1
    groupCount[GOD_GROUP[g]]++
  }

  // 1) 우세 오행: 8글자 개수 최다 → 동률이면 지장간 가중 점수
  const cnt: Record<El, number> = saju.elementCountBasicKorean
  const w: Record<El, number> = saju.elementBalanceWithHiddenStemsKorean
  const maxCnt = Math.max(...EL_ORDER.map((e) => cnt[e] || 0))
  const tied = EL_ORDER.filter((e) => (cnt[e] || 0) === maxCnt)
  const dominantElement = tied.sort((a, b) => (w[b] || 0) - (w[a] || 0))[0]
  const dominantGroup = elToGroup[dominantElement]

  // 2) 결핍: 8글자 기준 0개 (지장간 제외)
  const missingElements = EL_ORDER.filter((e) => (cnt[e] || 0) === 0)

  // 3) 관성 상태
  const officer = groupCount['관성']
  const officerStatus =
    officer === 0 ? '무관' : godCount['편관'] && godCount['정관'] ? '관살혼잡' : officer >= 2 ? '관성강' : '관성약'

  // 4) 태과/다(多) 플래그
  const heavy = (Object.keys(groupCount) as Group[]).filter((g) => groupCount[g] >= THRESHOLDS.heavyGroup)
  const flagNames: Record<Group, string> = { 비겁: '비겁태과', 식상: '식상태과', 재성: '재다', 관성: '관성태과', 인성: '인성태과' }
  const flags = heavy.map((g) => flagNames[g])
  if (godCount['편재'] && godCount['정재']) flags.push('재성혼잡')
  if ((godCount['겁재'] || 0) >= 2 && groupCount['재성'] >= 1) flags.push('군겁쟁재')

  // 5) 일하는 방식: A(독립) vs B'(조직 = 관성+정재, 인성 제외)
  const A = (godCount['비견'] || 0) + (godCount['겁재'] || 0) + (godCount['식신'] || 0) + (godCount['상관'] || 0) + (godCount['편재'] || 0)
  const Bp = (godCount['편관'] || 0) + (godCount['정관'] || 0) + (godCount['정재'] || 0)
  const gap = A - Bp
  const workFormat =
    gap >= THRESHOLDS.independenceGap ? 'Independent' : gap <= -THRESHOLDS.independenceGap ? 'Organizational' : 'Hybrid'

  // 6) 합충 (인접 규칙 적용)
  const rel = {
    jijiChung: splitByAdjacency(saju.jijiChung),
    cheongganChung: splitByAdjacency(saju.cheongganChung),
    cheongganHap: splitByAdjacency(saju.cheongganHap),
    jijiYughap: splitByAdjacency(saju.jijiYughap),
    jijiSamhap: splitByAdjacency(saju.jijiSamhap),
    jijiBanghap: splitByAdjacency(saju.jijiBanghap),
    hyeong: splitByAdjacency(saju.hyeong),
    pa: splitByAdjacency(saju.pa),
    hae: splitByAdjacency(saju.hae),
    wonjin: splitByAdjacency(saju.wonjin),
  }
  const monthBranchClashed = rel.jijiChung.kept.some((s) => s.includes('월지'))
  const palace = Object.entries(rel).flatMap(([k, v]) => v.kept.filter((s) => s.includes('일지')).map((s) => `${k}: ${s}`))

  // 7) 배우자성
  const spouseGroup: Group = gender === 'female' ? '관성' : '재성'
  const spouseCount = groupCount[spouseGroup]
  const spouseStemVisible = (['yearStem', 'monthStem', 'hourStem'] as const).some((k) => gods[k] && GOD_GROUP[gods[k]] === spouseGroup)
  const spouse = {
    group: spouseGroup,
    count: spouseCount,
    visibility: spouseCount === 0 ? 'absent' : spouseStemVisible ? 'stem' : 'branch',
    fallbackDayBranchTenGod: spouseCount === 0 ? gods['dayBranch'] : undefined,
    palaceRelations: palace,
  }

  // 8) 신살 → 직업 modifier
  const sinsalNames = new Set<string>([
    ...Object.values(saju.expertSinsal ?? {}).flat() as string[],   // 전문가 기준 신살 (expert-sinsal.ts)
    ...(saju.sinsalDetails ?? []).map((d: any) => d.name),
    ...Object.values(saju.hybridTwelveSinsal?.byDayBranch ?? {}),
    ...Object.values(saju.hybridTwelveSinsal?.byYearBranch ?? {}),
  ] as string[])
  const shinsalModifiers = Object.keys(SHINSAL_CAREER).filter((n) => sinsalNames.has(n)).map((n) => `${n} → ${SHINSAL_CAREER[n]}`)

  // 9) 확정값: 가장 센 십성 그룹(전문가 가중 점수 기준), 신강/신약 필터, 직업 유형 — LLM이 직접 판단하지 않도록 코드에서 확정
  const totals: Record<string, number> | undefined = saju.expert?.totals
  const ranked = totals ? Object.entries(totals).sort((x, y) => y[1] - x[1]) : []
  const dominantTenGod = ranked.length ? { group: ranked[0][0], score: ranked[0][1], ranking: ranked.map(([g, v]) => `${g} ${v}`) } : null
  const strengthFilter: 'Strong' | 'Weak' = saju.expert ? (saju.expert.strong ? 'Strong' : 'Weak') : 'Weak'
  const careerType = {
    primary: workFormat,                       // Independent | Hybrid | Organizational
    strength: strengthFilter,                  // Strong | Weak  (전문가 점수 60 이상이면 Strong)
    label: `${workFormat} + ${strengthFilter} Day Master`,
  }

  return {
    dayMaster: dm,
    elementToGroup: elToGroup,
    dominantTenGod,
    strengthFilter,
    careerType,
    dominant: { element: dominantElement, group: dominantGroup, tiedAtCount: tied, rule: '8글자 개수 최다 → 동률은 지장간 가중' },
    missingElements,
    officerStatus,
    flags,
    groupCount,
    independence: { A, Bprime: Bp, gap, workFormat, note: "B'=관성+정재 (인성 제외)" },
    monthBranch: { tenGod: gods['monthBranch'], clashed: monthBranchClashed },
    industry: INDUSTRY[dominantElement],
    shinsalModifiers,
    spouse,
    relations: Object.fromEntries(Object.entries(rel).map(([k, v]) => [k, v])),
    isStrongByCalc: saju.expert?.strong ?? false,   // 전문가 기준: 비겁+인성 점수 >= 60 (이전의 ratio>=50은 더 이상 쓰지 않음)
    expert: saju.expert && {
      grade: saju.expert.grade,                 // 신약 / 중화신약 / 중화신강 / 신강
      score: saju.expert.support,               // 0~120
      eokbuName: saju.expert.eokName,           // 군비쟁재격 등
      yongsinGroups: saju.expert.eokYong,       // 예: ['관성']
      heesinGroups: saju.expert.eokHee,
      borderline: saju.expert.border,           // 경쟁 그룹 점수 차 3 이하
      gyeokguk: saju.expert.gyeok,
      outlier: saju.expert.outlier,             // 외격 의심 (기준선 미확정)
    },
  }
}