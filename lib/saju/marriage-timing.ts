// ================================================================
// 결혼/연애 타이밍 계산 (결정론적 로직 - AI 추론 아님)
// ================================================================
// [1단계] 원국에서 배우자성(관성/재성) 위치로 결혼 형태/적령기 분류
// [2단계] 대운/세운에서 배우자성·일지합·식상 신호가 겹치는 해를 스코어링하여
//         '연애(만남) 유력 시기'와 '결혼 유력 시기'를 특정
//
// 이 모듈의 출력은 saju_data.marriageTiming에 저장되며,
// AI(리포트 생성 프롬프트)는 이 값을 그대로 인용만 하고 재계산하지 않는다.
// ================================================================

type Gender = 'male' | 'female'

// 십신 테이블 (일간 기준) - constants.ts의 TEN_GODS_TABLE과 동일하나,
// 대운/세운 등 임의 문자열 키 조회를 위해 범용 Record<string, ...> 타입으로 로컬 정의
const TEN_GODS_TABLE: Record<string, Record<string, string>> = {
  '갑': { '갑': '비견', '을': '겁재', '병': '식신', '정': '상관', '무': '편재', '기': '정재', '경': '편관', '신': '정관', '임': '편인', '계': '정인' },
  '을': { '갑': '겁재', '을': '비견', '병': '상관', '정': '식신', '무': '정재', '기': '편재', '경': '정관', '신': '편관', '임': '정인', '계': '편인' },
  '병': { '갑': '편인', '을': '정인', '병': '비견', '정': '겁재', '무': '식신', '기': '상관', '경': '편재', '신': '정재', '임': '편관', '계': '정관' },
  '정': { '갑': '정인', '을': '편인', '병': '겁재', '정': '비견', '무': '상관', '기': '식신', '경': '정재', '신': '편재', '임': '정관', '계': '편관' },
  '무': { '갑': '편관', '을': '정관', '병': '편인', '정': '정인', '무': '비견', '기': '겁재', '경': '식신', '신': '상관', '임': '편재', '계': '정재' },
  '기': { '갑': '정관', '을': '편관', '병': '정인', '정': '편인', '무': '겁재', '기': '비견', '경': '상관', '신': '식신', '임': '정재', '계': '편재' },
  '경': { '갑': '편재', '을': '정재', '병': '편관', '정': '정관', '무': '편인', '기': '정인', '경': '비견', '신': '겁재', '임': '식신', '계': '상관' },
  '신': { '갑': '정재', '을': '편재', '병': '정관', '정': '편관', '무': '정인', '기': '편인', '경': '겁재', '신': '비견', '임': '상관', '계': '식신' },
  '임': { '갑': '식신', '을': '상관', '병': '편재', '정': '정재', '무': '편관', '기': '정관', '경': '편인', '신': '정인', '임': '비견', '계': '겁재' },
  '계': { '갑': '상관', '을': '식신', '병': '정재', '정': '편재', '무': '정관', '기': '편관', '경': '정인', '신': '편인', '임': '겁재', '계': '비견' }
}

// 지장간 (본기 → 중기 → 말기 순서) - constants.ts의 HIDDEN_STEMS와 동일 데이터
const HIDDEN_STEMS: Record<string, string[]> = {
  '자': ['계'],
  '축': ['기', '계', '신'],
  '인': ['갑', '병', '무'],
  '묘': ['을'],
  '진': ['무', '을', '계'],
  '사': ['병', '무', '경'],
  '오': ['병', '기', '정'],
  '미': ['기', '을', '정'],
  '신': ['경', '임', '무'],
  '유': ['신'],
  '술': ['무', '신', '정'],
  '해': ['임', '갑', '무']
}

interface DaewoonEntry {
  startAge: number
  endAge: number
  stem: string
  branch: string
  fullName: string
  tenGod?: string
  twelveStar?: string
}

interface YeonwoonEntry {
  year: number
  stem: string
  branch: string
  fullName: string
}

export interface MarriageTimingCandidate {
  year: number
  ganzi: string // 한자 간지, 예: "戊申"
  ganziKorean: string // 한글 간지, 예: "무신"
  source: 'yeonwoon' | 'daewoon'
  signals: string[]
  score: number
  meetingScore: number
  marriageScore: number
  type: 'meeting' | 'marriage' | 'both' | 'candidate'
}

export interface MarriageTimingResult {
  category: '조기 결혼' | '적정/보통' | '만혼 추천' | '과다' | '무자'
  condition: string
  recommendedTiming: string
  advice: string
  spouseStarTenGods: string[]
  spouseStarCount: number
  spouseStarPositions: string[]
  bestMeetingYear: MarriageTimingCandidate | null
  bestMarriageYear: MarriageTimingCandidate | null
  candidates: MarriageTimingCandidate[]
  windowNote: string | null
}

// 지지 육합 (2글자 조합)
const JIJI_YUGHAP: [string, string, string][] = [
  ['자', '축', '토'], ['인', '해', '목'], ['묘', '술', '화'],
  ['진', '유', '금'], ['사', '신', '수'], ['오', '미', '토']
]

// 지지 삼합 그룹 (3글자, 2글자만 겹쳐도 반합으로 인정)
const JIJI_SAMHAP: [string[], string][] = [
  [['인', '오', '술'], '화'], [['사', '유', '축'], '금'],
  [['신', '자', '진'], '수'], [['해', '묘', '미'], '목']
]

function getSipsin(dayStem: string, otherStem: string | undefined | null): string {
  if (!otherStem) return ''
  return TEN_GODS_TABLE[dayStem]?.[otherStem] || ''
}

function getBongi(branch: string | undefined | null): string {
  if (!branch) return ''
  return HIDDEN_STEMS[branch]?.[0] || ''
}

// 일지와 특정 지지의 합 관계 확인 (육합 우선, 없으면 삼합/반합)
function checkDayBranchHap(dayBranch: string, targetBranch: string): { type: 'yukhap' | 'samhap'; element: string } | null {
  for (const [a, b, element] of JIJI_YUGHAP) {
    if ((dayBranch === a && targetBranch === b) || (dayBranch === b && targetBranch === a)) {
      return { type: 'yukhap', element }
    }
  }
  for (const [group, element] of JIJI_SAMHAP) {
    if (group.includes(dayBranch) && group.includes(targetBranch) && dayBranch !== targetBranch) {
      return { type: 'samhap', element }
    }
  }
  return null
}

export function calculateMarriageTiming(params: {
  gender: Gender
  dayStem: string
  dayBranch: string
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  hourStem: string | null
  hourBranch: string | null
  birthYear: number
  daewoon: DaewoonEntry[]
  yeonwoon: YeonwoonEntry[]
}): MarriageTimingResult {
  const {
    gender, dayStem, dayBranch,
    yearStem, yearBranch, monthStem, monthBranch,
    hourStem, hourBranch, birthYear, daewoon, yeonwoon
  } = params

  const spouseStarTenGods = gender === 'female' ? ['정관', '편관'] : ['정재', '편재']
  const siksangTenGods = ['식신', '상관']

  // ============================================================
  // [1단계] 원국 배우자성 위치 파악 (조기/적정/만혼/과다/무자)
  // ============================================================
  const spouseStarPositions: string[] = []
  let primaryCount = 0 // 천간 + 지지 본기(연월일시)에서 발견된 개수
  let hiddenOnlyCount = 0 // 지장간(중기/말기)에서만 발견된 개수

  const stemPositions: [string, string | null][] = [
    ['연간', yearStem], ['월간', monthStem], ['시간', hourStem]
  ]
  stemPositions.forEach(([label, stem]) => {
    if (stem && spouseStarTenGods.includes(getSipsin(dayStem, stem))) {
      primaryCount++
      spouseStarPositions.push(label)
    }
  })

  const branchPositions: [string, string | null][] = [
    ['연지', yearBranch], ['월지', monthBranch], ['일지', dayBranch], ['시지', hourBranch]
  ]
  branchPositions.forEach(([label, branch]) => {
    if (!branch) return
    const bongi = getBongi(branch)
    if (spouseStarTenGods.includes(getSipsin(dayStem, bongi))) {
      primaryCount++
      spouseStarPositions.push(label)
    }
    const hidden = HIDDEN_STEMS[branch] || []
    hidden.slice(1).forEach(hs => {
      if (spouseStarTenGods.includes(getSipsin(dayStem, hs))) {
        hiddenOnlyCount++
        spouseStarPositions.push(`${label}(지장간)`)
      }
    })
  })

  const spouseStarCount = primaryCount
  const totalCount = primaryCount + hiddenOnlyCount

  const hasYear = spouseStarPositions.some(p => p.startsWith('연간') || p.startsWith('연지'))
  const hasMonth = spouseStarPositions.some(p => p.startsWith('월간') || p.startsWith('월지'))
  const hasDayBranch = spouseStarPositions.some(p => p === '일지')
  const hasHour = spouseStarPositions.some(p => p.startsWith('시간') || p.startsWith('시지'))

  let category: MarriageTimingResult['category']
  let condition: string
  let recommendedTiming: string
  let advice: string

  if (totalCount === 0) {
    category = '무자'
    condition = '원국 및 지장간에 관성(여)/재성(남) 없음'
    recommendedTiming = '38세 이후 (무조건 늦게)'
    advice = '원국에 배우자성이 없어 대운/세운에 관성(여)/재성(남)이 들어올 때가 결혼 타이밍입니다. 여럿 만나보고 신중히 결정하는 것을 추천합니다.'
  } else if (spouseStarCount >= 3) {
    category = '과다'
    condition = '관성(여)/재성(남) 다자 (원국 3개 이상)'
    recommendedTiming = '33세 이후 (뭉쳐 있을 시) / 38세 이후 (흩어져 있을 시)'
    advice = gender === 'female'
      ? '통제받는 느낌에 스트레스를 받을 수 있어 배우자와의 경계 설정이 중요합니다.'
      : '재물과 연애에 대한 관심이 과다해질 수 있어 배우자의 간섭이나 갈등에 유의해야 합니다.'
  } else if (hasYear || hasMonth) {
    category = '조기 결혼'
    condition = '연주 / 월주에 관성(여)/재성(남) 존재'
    recommendedTiming = '나이 상관 없음 ~ 33세 이전'
    advice = '일찍 연애/결혼하는 경향이 있습니다. 주말부부나 업상대체 직업(배우자와 떨어져 지내는 직업 등)을 고려하면 도움이 됩니다.'
  } else if (hasDayBranch) {
    category = '적정/보통'
    condition = '일지에 관성(여)/재성(남) 존재'
    recommendedTiming = '나이 상관 없음'
    advice = '일지는 천륜(배우자궁)의 위치로, 무난한 시기에 자연스럽게 결혼운이 옵니다. 편관 관련 직업(군경, 활인업 등)과 인연이면 더욱 좋습니다.'
  } else if (hasHour) {
    category = '만혼 추천'
    condition = '시주에 관성(여)/재성(남) 존재'
    recommendedTiming = '38세 이후'
    advice = '연하를 만나거나 배우자를 경시할 우려가 있어, 늦게 결혼할수록 안정적입니다. 배우자를 존중하는 태도가 필요합니다.'
  } else {
    category = '만혼 추천'
    condition = '지장간(중기/말기)에만 관성(여)/재성(남) 존재 (미약함)'
    recommendedTiming = '35세 이후'
    advice = '배우자성이 드러나지 않고 숨어 있어 인연이 늦게, 혹은 우연한 계기로 나타나는 경우가 많습니다.'
  }

  // ============================================================
  // [2단계] 대운/세운에서 구체적 이벤트 연도 스코어링
  // ============================================================
  const candidates: MarriageTimingCandidate[] = []

  yeonwoon.forEach(y => {
    const daewoonPeriod = daewoon.find(d => {
      const startYear = birthYear + d.startAge
      const endYear = birthYear + d.endAge
      return y.year >= startYear && y.year <= endYear
    })

    const yearStemTenGod = getSipsin(dayStem, y.stem)
    const yearBranchTenGod = getSipsin(dayStem, getBongi(y.branch))
    const daewoonStemTenGod = daewoonPeriod?.tenGod || getSipsin(dayStem, daewoonPeriod?.stem)
    const daewoonBranchTenGod = daewoonPeriod ? getSipsin(dayStem, getBongi(daewoonPeriod.branch)) : ''
    const hap = checkDayBranchHap(dayBranch, y.branch)

    const signals: string[] = []
    let meetingScore = 0
    let marriageScore = 0

    if (spouseStarTenGods.includes(yearStemTenGod)) {
      signals.push(`세운 천간에 배우자성(${yearStemTenGod}) 출현`)
      marriageScore += 3
    }
    if (spouseStarTenGods.includes(yearBranchTenGod)) {
      signals.push(`세운 지지에 배우자성(${yearBranchTenGod}) 출현`)
      marriageScore += 2
    }
    if (daewoonPeriod && spouseStarTenGods.includes(daewoonStemTenGod)) {
      signals.push(`대운 천간에 배우자성(${daewoonStemTenGod}) 동반`)
      marriageScore += 2
    }
    if (daewoonPeriod && spouseStarTenGods.includes(daewoonBranchTenGod)) {
      signals.push(`대운 지지에 배우자성(${daewoonBranchTenGod}) 동반`)
      marriageScore += 1
    }
    if (hap) {
      signals.push(`일지와 ${hap.type === 'yukhap' ? '육합' : '삼합(반합)'} (${hap.element}) — 인연이 들어오는 흐름`)
      meetingScore += 2
      marriageScore += 1
    }
    if (siksangTenGods.includes(yearStemTenGod)) {
      signals.push(`세운 천간에 식상(${yearStemTenGod}) 출현 — 연애/설렘 상승`)
      meetingScore += 2
    }

    if (signals.length === 0) return

    candidates.push({
      year: y.year,
      ganzi: y.fullName,
      ganziKorean: `${y.stem}${y.branch}`,
      source: 'yeonwoon',
      signals,
      score: meetingScore + marriageScore,
      meetingScore,
      marriageScore,
      type: 'candidate'
    })
  })

  candidates.sort((a, b) => b.score - a.score || a.year - b.year)

  const meetingSorted = [...candidates].filter(c => c.meetingScore > 0).sort((a, b) => b.meetingScore - a.meetingScore || a.year - b.year)
  // 결혼 유력 시기는 실제 배우자성 신호(천간/지지, 세운 또는 대운)가 있어야 함 - 합(연애)만으로는 결혼 시기로 보지 않음
  const marriageSorted = [...candidates]
    .filter(c => c.marriageScore > 0 && c.signals.some(s => s.includes('배우자성')))
    .sort((a, b) => b.marriageScore - a.marriageScore || a.year - b.year)

  const bestMeetingYear = meetingSorted[0] ? { ...meetingSorted[0], type: 'meeting' as const } : null
  const bestMarriageYear = marriageSorted[0] ? { ...marriageSorted[0], type: 'marriage' as const } : null

  if (bestMeetingYear && bestMarriageYear && bestMeetingYear.year === bestMarriageYear.year) {
    bestMeetingYear.type = 'both'
    bestMarriageYear.type = 'both'
  }

  const windowNote = !bestMarriageYear
    ? '제공된 기간(현재 ~ +9년) 내에는 배우자성이 뚜렷하게 들어오는 세운/대운이 없습니다. 다음 대운 시기를 함께 참고하세요.'
    : null

  return {
    category,
    condition,
    recommendedTiming,
    advice,
    spouseStarTenGods,
    spouseStarCount: totalCount,
    spouseStarPositions,
    bestMeetingYear,
    bestMarriageYear,
    candidates: candidates.slice(0, 6),
    windowNote
  }
}
