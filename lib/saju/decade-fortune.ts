// ================================================================
// 대운 곡선 & 연도별 하이라이트 계산 (결정론적 로직 - AI 추론 아님)
// ================================================================
// [1단계] 신강/신약에 따라 유리한 십신(용신) 그룹과 불리한 십신(기신) 그룹을 확정
// [2단계] 대운(8구간, 출생~약 90세) 각각의 점수(상/중/하)를 용신 여부 + 12운성 강약으로 계산
// [3단계] 각 대운 10년 안에서 "전환점/연애·결혼/충·원진 격동" 조건에 해당하는 연도만
//         추려 2~3개의 하이라이트 연도로 선정하고, 그 연도의 점수와 근거(signals)를 남긴다
//
// 이 모듈의 출력은 saju_data.decadeFortune에 저장되며,
// AI(유료 리포트 생성 프롬프트)는 여기서 이미 결정된 score/tags/signals를 바탕으로
// 100~160자 문장만 작성하고, 점수나 연도 자체를 새로 만들어내지 않는다.
// ================================================================

import { calculateYeonWoon } from './core-calculator'
import { getTwelveStar } from './advanced'

type Gender = 'male' | 'female'
export type FortuneScore = '상' | '중' | '하'

// 십신 테이블 (일간 기준) - marriage-timing.ts와 동일한 로컬 정의 (범용 문자열 키 조회용)
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

// 지장간 (본기만 사용 - 세운 격동/전환점 판단은 본기 기준으로 충분)
const HIDDEN_STEMS_BONGI: Record<string, string> = {
  '자': '계', '축': '기', '인': '갑', '묘': '을', '진': '무', '사': '병',
  '오': '정', '미': '기', '신': '경', '유': '신', '술': '무', '해': '임'
}

// 십신 → 6그룹 매핑
const TEN_GOD_GROUP: Record<string, string> = {
  '비견': '비겁', '겁재': '비겁',
  '식신': '식상', '상관': '식상',
  '편재': '재성', '정재': '재성',
  '편관': '관성', '정관': '관성',
  '편인': '인성', '정인': '인성'
}

// 12운성 강/약 분류 (RULE 1) - 나머지(목욕/쇠/양)는 중립
const STRONG_TWELVE_STARS = ['건록', '제왕', '관대', '장생']
const WEAK_TWELVE_STARS = ['절', '태', '병', '사', '묘']

// 지지 육합 / 삼합 (marriage-timing.ts와 동일 데이터)
const JIJI_YUGHAP: [string, string, string][] = [
  ['자', '축', '토'], ['인', '해', '목'], ['묘', '술', '화'],
  ['진', '유', '금'], ['사', '신', '수'], ['오', '미', '토']
]
const JIJI_SAMHAP: [string[], string][] = [
  [['인', '오', '술'], '화'], [['사', '유', '축'], '금'],
  [['신', '자', '진'], '수'], [['해', '묘', '미'], '목']
]

// 지지 충 / 원진 (advanced.ts의 JIJI_CHUNG / WONJIN_PAIRS와 동일 데이터)
const JIJI_CHUNG: [string, string][] = [
  ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']
]
const WONJIN_PAIRS: [string, string][] = [
  ['자', '미'], ['축', '오'], ['인', '유'], ['묘', '신'], ['진', '해'], ['사', '술']
]

// 한자 변환용 (saju-calculator.ts와 동일 데이터, 로컬 중복)
const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const STEMS_KOREAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const BRANCHES_KOREAN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

function toHanjaGanzi(stem: string, branch: string): string {
  const si = STEMS_KOREAN.indexOf(stem)
  const bi = BRANCHES_KOREAN.indexOf(branch)
  return `${si >= 0 ? STEMS_HANJA[si] : stem}${bi >= 0 ? BRANCHES_HANJA[bi] : branch}`
}

function getSipsin(dayStem: string, otherStem: string | undefined | null): string {
  if (!otherStem) return ''
  return TEN_GODS_TABLE[dayStem]?.[otherStem] || ''
}

function getBongi(branch: string | undefined | null): string {
  if (!branch) return ''
  return HIDDEN_STEMS_BONGI[branch] || ''
}

function isBranchPairMatch(pairs: [string, string][], a: string, b: string): boolean {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
}

function hasHapWithDayBranch(dayBranch: string, targetBranch: string): boolean {
  const yughap = JIJI_YUGHAP.some(([a, b]) => (dayBranch === a && targetBranch === b) || (dayBranch === b && targetBranch === a))
  if (yughap) return true
  return JIJI_SAMHAP.some(([group]) => group.includes(dayBranch) && group.includes(targetBranch) && dayBranch !== targetBranch)
}

// RULE 1: 용신(유리) 여부 + 12운성 강약으로 상/중/하 판정
function scoreFromGroupAndStar(
  group: string,
  twelveStar: string,
  favorableGroups: string[],
  unfavorableGroups: string[]
): FortuneScore {
  const isFavorable = favorableGroups.includes(group)
  const isUnfavorable = unfavorableGroups.includes(group)
  const starStrong = STRONG_TWELVE_STARS.includes(twelveStar)
  const starWeak = WEAK_TWELVE_STARS.includes(twelveStar)

  if (isFavorable && starStrong) return '상'
  if (isUnfavorable && starWeak) return '하'
  return '중'
}

export interface DecadeYearHighlight {
  year: number
  age: number
  isBeforeAdult: boolean // age < 20 → AI가 학업/재능 위주로 커리어 항목을 서술해야 함
  ganzi: string
  ganziKorean: string
  stemTenGod: string
  branchTenGod: string
  twelveStar: string
  score: FortuneScore
  tags: Array<'turning_point' | 'romance' | 'turbulence'>
  signals: string[]
}

export interface DecadePeriod {
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  stem: string
  branch: string
  ganzi: string
  ganziKorean: string
  stemTenGod: string
  twelveStar: string
  score: FortuneScore
  highlightYears: DecadeYearHighlight[]
}

export interface DecadeFortuneResult {
  isDayMasterStrong: boolean
  favorableTenGodGroups: string[] // 우선순위 순서, 예: ['관성','재성','식상'] 또는 ['인성','비겁']
  unfavorableTenGodGroups: string[]
  primaryFavorableGroup: string // 위 배열의 1번째 (전환점 판정 기준)
  decades: DecadePeriod[]
}

export function calculateDecadeFortune(params: {
  gender: Gender
  dayStem: string
  dayBranch: string
  monthBranch: string
  yearBranch: string
  hourBranch: string | null
  birthYear: number
  isDayMasterStrong: boolean
  daewoon: Array<{
    startAge: number
    endAge: number
    stem: string
    branch: string
    fullName: string
    tenGod: string
    twelveStar: string
  }>
}): DecadeFortuneResult {
  const { gender, dayStem, dayBranch, monthBranch, birthYear, isDayMasterStrong, daewoon } = params

  // ============================================================
  // [1단계] 억부용신 그룹 확정 (getEokbuYongsin과 동일한 이론, 십신 그룹 단위로 직접 표현)
  // ============================================================
  const favorableTenGodGroups = isDayMasterStrong ? ['관성', '재성', '식상'] : ['인성', '비겁']
  const unfavorableTenGodGroups = isDayMasterStrong ? ['비겁', '인성'] : ['관성', '재성', '식상']
  const primaryFavorableGroup = favorableTenGodGroups[0]

  const decades: DecadePeriod[] = daewoon.map(d => {
    const stemGroup = TEN_GOD_GROUP[d.tenGod] || ''
    const score = scoreFromGroupAndStar(stemGroup, d.twelveStar, favorableTenGodGroups, unfavorableTenGodGroups)

    const startYear = birthYear + d.startAge
    const endYear = birthYear + d.endAge
    const yearCount = Math.max(1, endYear - startYear + 1)
    const yearsInDecade = calculateYeonWoon(startYear, yearCount)

    // ==========================================================
    // [2단계] 연도별 태그/점수 산출 (RULE 2~ RULE 5의 판정 조건)
    // ==========================================================
    const yearCandidates: DecadeYearHighlight[] = yearsInDecade.map(y => {
      const age = y.year - birthYear
      const stemTenGod = getSipsin(dayStem, y.stem)
      const branchTenGod = getSipsin(dayStem, getBongi(y.branch))
      const twelveStar = getTwelveStar(dayStem, y.branch)
      const stemGroupOfYear = TEN_GOD_GROUP[stemTenGod] || ''
      const branchGroupOfYear = TEN_GOD_GROUP[branchTenGod] || ''
      const yearScore = scoreFromGroupAndStar(stemGroupOfYear, twelveStar, favorableTenGodGroups, unfavorableTenGodGroups)

      const tags: DecadeYearHighlight['tags'] = []
      const signals: string[] = []

      // RULE 2.1 — The Turning Point: 그 해가 1순위 용신(primaryFavorableGroup)을 포함하는지
      if (stemGroupOfYear === primaryFavorableGroup || branchGroupOfYear === primaryFavorableGroup) {
        tags.push('turning_point')
        signals.push(`용신(${primaryFavorableGroup}) 도래`)
      }

      // RULE 2.2 / RULE 5 — The Romance: 식상 출현, 일지와 합, 성별에 맞는 배우자성 출현
      const siksangAppears = stemTenGod === '식신' || stemTenGod === '상관' || branchTenGod === '식신' || branchTenGod === '상관'
      const hapWithDayBranch = hasHapWithDayBranch(dayBranch, y.branch)
      const spouseStarGroup = gender === 'female' ? '관성' : '재성'
      const spouseStarAppears = stemGroupOfYear === spouseStarGroup || branchGroupOfYear === spouseStarGroup

      if (siksangAppears) signals.push('식상 출현 — 매력/설렘 상승기')
      if (hapWithDayBranch) signals.push('일지와 합 — 인연이 들어오는 흐름')
      if (spouseStarAppears) signals.push(`배우자성(${spouseStarGroup}) 출현 — 진지한 상대`)
      if (siksangAppears || hapWithDayBranch || spouseStarAppears) tags.push('romance')

      // RULE 2.3 — The Turbulence: 월지 또는 일지와 충/원진
      const chungWithMonth = isBranchPairMatch(JIJI_CHUNG, y.branch, monthBranch)
      const chungWithDay = isBranchPairMatch(JIJI_CHUNG, y.branch, dayBranch)
      const wonjinWithMonth = isBranchPairMatch(WONJIN_PAIRS, y.branch, monthBranch)
      const wonjinWithDay = isBranchPairMatch(WONJIN_PAIRS, y.branch, dayBranch)
      if (chungWithMonth || chungWithDay) {
        tags.push('turbulence')
        signals.push(`${chungWithMonth ? '월지' : '일지'}와 충 — 갈등/변동 주의`)
      } else if (wonjinWithMonth || wonjinWithDay) {
        tags.push('turbulence')
        signals.push(`${wonjinWithMonth ? '월지' : '일지'}와 원진 — 오해/거리감 주의`)
      }

      return {
        year: y.year,
        age,
        isBeforeAdult: age < 20,
        ganzi: toHanjaGanzi(y.stem, y.branch),
        ganziKorean: `${y.stem}${y.branch}`,
        stemTenGod,
        branchTenGod,
        twelveStar,
        score: yearScore,
        tags,
        signals
      }
    })

    // ==========================================================
    // [3단계] 대운 10년 안에서 2~3개 하이라이트 연도만 선정
    // ==========================================================
    const scoreRank: Record<FortuneScore, number> = { '상': 2, '중': 1, '하': 0 }
    const tagged = yearCandidates.filter(y => y.tags.length > 0)
    tagged.sort((a, b) => (b.tags.length - a.tags.length) || (scoreRank[b.score] - scoreRank[a.score]) || (a.year - b.year))

    let highlightYears = tagged.slice(0, 3)
    if (highlightYears.length < 2) {
      // 태그가 거의 없는 조용한 대운이라면, 그 안에서 점수가 가장 극단적인 연도로 최소 2개를 보충
      const remaining = yearCandidates.filter(y => !highlightYears.includes(y))
      remaining.sort((a, b) => Math.abs(scoreRank[b.score] - 1) - Math.abs(scoreRank[a.score] - 1) || a.year - b.year)
      for (const candidate of remaining) {
        if (highlightYears.length >= 2) break
        highlightYears.push(candidate)
      }
      highlightYears.sort((a, b) => a.year - b.year)
    }

    return {
      startAge: d.startAge,
      endAge: d.endAge,
      startYear,
      endYear,
      stem: d.stem,
      branch: d.branch,
      ganzi: d.fullName,
      ganziKorean: `${d.stem}${d.branch}`,
      stemTenGod: d.tenGod,
      twelveStar: d.twelveStar,
      score,
      highlightYears
    }
  })

  return {
    isDayMasterStrong,
    favorableTenGodGroups,
    unfavorableTenGodGroups,
    primaryFavorableGroup,
    decades
  }
}
