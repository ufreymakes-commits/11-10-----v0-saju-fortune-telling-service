import type { FourPillars, SajuResult } from './core-calculator'
import { STEM_TO_ELEMENT, BRANCH_TO_ELEMENT, STEMS } from './constants'
import {
  calcTwelveStars, calcCheongganHap, calcJijiYughap, calcJijiSamhap, calcJijiBanghap,
  calcCheongganChung, calcJijiChung, calcGongmang, calcHyeong, calcPa, calcHae, calcWonjin,
  calcGilseong, calcSinGangSinYak, getEokbuYongsin, calcJohuYongsin
} from './advanced'

// ================================================================
// 격국(Format) 계산
// ================================================================

export function calculateGyeokguk(
  dayMaster: string,
  monthBranch: string,
  allStems: string[]
) {
  const JI_JANG_GAN: Record<string, string[]> = {
    '子': ['壬', '癸'],
    '丑': ['癸', '辛', '己'],
    '寅': ['戊', '丙', '甲'],
    '卯': ['甲', '乙'],
    '辰': ['乙', '癸', '戊'],
    '巳': ['戊', '庚', '丙'],
    '午': ['丙', '己', '丁'],
    '未': ['丁', '乙', '己'],
    '申': ['戊', '壬', '庚'],
    '酉': ['庚', '辛'],
    '戌': ['辛', '丁', '戊'],
    '亥': ['戊', '甲', '壬'],
  }

  const getTenGod = (master: string, stem: string): string => {
    const mapping: Record<string, Record<string, string>> = {
      '甲': { '甲': '비견', '乙': '겁재', '丙': '식신', '丁': '상관', '戊': '편재', '己': '정재', '庚': '편관', '辛': '정관', '壬': '편인', '癸': '정인' },
      '乙': { '甲': '겁재', '乙': '비견', '丙': '상관', '丁': '식신', '戊': '정재', '己': '편재', '庚': '정관', '辛': '편관', '壬': '정인', '癸': '편인' },
      '丙': { '甲': '식신', '乙': '상관', '丙': '비견', '丁': '겁재', '戊': '편인', '己': '정인', '庚': '정재', '辛': '편재', '壬': '정관', '癸': '편관' },
      '丁': { '甲': '상관', '乙': '식신', '丙': '겁재', '丁': '비견', '戊': '정인', '己': '편인', '庚': '편재', '辛': '정재', '壬': '편관', '癸': '정관' },
      '戊': { '甲': '편재', '乙': '정재', '丙': '편인', '丁': '정인', '戊': '비견', '己': '겁재', '庚': '상관', '辛': '식신', '壬': '편관', '癸': '정관' },
      '己': { '甲': '정재', '乙': '편재', '丙': '정인', '丁': '편인', '戊': '겁재', '己': '비견', '庚': '식신', '辛': '상관', '壬': '정관', '癸': '편관' },
      '庚': { '甲': '편관', '乙': '정관', '丙': '정재', '丁': '편재', '戊': '식신', '己': '상관', '庚': '비견', '辛': '겁재', '壬': '편인', '癸': '정인' },
      '辛': { '甲': '정관', '乙': '편관', '丙': '편재', '丁': '정재', '戊': '상관', '己': '식신', '庚': '겁재', '辛': '비견', '壬': '정인', '癸': '편인' },
      '壬': { '甲': '정인', '乙': '편인', '丙': '정관', '丁': '편관', '戊': '편재', '己': '정재', '庚': '상관', '辛': '식신', '壬': '비견', '癸': '겁재' },
      '癸': { '甲': '편인', '乙': '정인', '丙': '편관', '丁': '정관', '戊': '정재', '己': '편재', '庚': '식신', '辛': '상관', '壬': '겁재', '癸': '비견' }
    }
    return mapping[master]?.[stem] || '불명'
  }

  const stemsInJi = JI_JANG_GAN[monthBranch]
  if (!stemsInJi) return "데이터 부족"

  // 투출 여부 확인 (우선순위: 정기 -> 중기 -> 초기)
  for (let i = stemsInJi.length - 1; i >= 0; i--) {
    const currentStem = stemsInJi[i]
    if (allStems.includes(currentStem)) {
      const tenGod = getTenGod(dayMaster, currentStem)
      return `${tenGod}격 (투출)`
    }
  }

  // 투출되지 않았다면 월지 본기(정기)를 기준으로 함
  const mainStem = stemsInJi[stemsInJi.length - 1]
  const tenGod = getTenGod(dayMaster, mainStem)
  return `${tenGod}격 (본기)`
}

// ================================================================
// 신살(神殺) 계산
// ================================================================

const SINALSA_MAP: Record<string, Record<string, string[]>> = {
  'year': {
    '甲': ['인', '해'], '乙': ['묘', '자'],
    '丙': ['사', '오'], '丁': ['오', '미'],
    '戊': ['진', '축'], '己': ['축', '미'],
    '庚': ['신', '유'], '辛': ['유', '술'],
    '壬': ['해', '자'], '癸': ['자', '축']
  },
  'month': {
    '甲': ['축'], '乙': ['자'], '丙': ['해'], '丁': ['오'], '戊': ['술'],
    '己': ['미'], '庚': ['인'], '辛': ['묘'], '壬': ['신'], '癸': ['유']
  }
}

export function calculateSinsalsa(
  yearStem: string,
  monthStem: string,
  dayStem: string,
  dayBranch: string,
  yearBranch: string,
  monthBranch: string,
  hourBranch: string | null
): string[] {
  const results: string[] = []
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch].filter(Boolean)

  // 납음귀인
  const napumMap: Record<string, string[]> = {
    '甲': ['해'], '乙': ['자'], '丙': ['인'], '丁': ['묘'],
    '戊': ['오'], '己': ['미'], '庚': ['신'], '辛': ['유'],
    '壬': ['축'], '癸': ['인']
  }
  if (napumMap[dayStem]?.some(b => branches.includes(b))) {
    results.push(`납음귀인(${dayStem})`)
  }

  // 육해
  if (branches.includes('유') && branches.includes('자')) {
    results.push('육해(유·자)')
  }
  if (branches.includes('인') && branches.includes('사')) {
    results.push('육해(인·사)')
  }

  return results
}

// ================================================================
// 대운(大運) 계산
// ================================================================

export function calculateDaeyun(
  dayStem: string,
  yearStem: string,
  gender: string,
  birthDate: Date
): {
  period: string
  saju: string
  age: string
}[] {
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

  // 월지로부터 시작 대운 결정 (음력 생월 필요)
  const majorPeriods = [
    { period: '0.4~10.4', saju: '壬辰' },
    { period: '10.4~20.4', saju: '辛卯' },
    { period: '20.4~30.4', saju: '庚寅' },
    { period: '30.4~40.4', saju: '己丑' },
    { period: '40.4~50.4', saju: '戊子' },
    { period: '50.4~60.4', saju: '丁亥' },
    { period: '60.4~70.4', saju: '丙戌' },
    { period: '70.4~80.4', saju: '乙酉' }
  ]

  // 2026년 기준 나이 계산
  const currentYear = 2026
  const birthYear = birthDate.getFullYear()
  const currentAge = currentYear - birthYear

  return majorPeriods.map((period, idx) => {
    const startAge = idx * 10 + 0.4
    const endAge = (idx + 1) * 10 + 0.4
    return {
      period: `${startAge}세~${endAge}세`,
      saju: period.saju,
      age: `${currentYear + idx * 10 - birthYear}~${currentYear + (idx + 1) * 10 - birthYear}년`
    }
  })
}

// ================================================================
// 2026년 운세 데이터
// ================================================================

export interface AnnualFortune {
  year: number
  startDate: string
  endDate: string
  saju: string
  dayMaster: string
}

export function getAnnualFortune2026(): AnnualFortune {
  return {
    year: 2026,
    startDate: '2026-02-03 20:03',
    endDate: '2027-02-04 01:47',
    saju: '丙午',
    dayMaster: '丙'
  }
}

// ================================================================
// 통합 분석 데이터 생성
// ================================================================

export interface CompleteAnalysis {
  // 기본 정보
  name: string
  gender: string
  birthCountry: string
  age: number // 2026년 기준 만 나이

  // 사주 8글자
  fourPillars: FourPillars

  // 12운성
  twelveStars: Array<{
    position: string
    branch: string
    star: string
  }>

  // 십신 (보유/부재)
  tenGods: {
    present: string[]
    absent: string[]
  }

  // 관계식
  cheongganHap: string[]
  jijiYughap: string[]
  jijiSamhap: string[]
  jijiBanghap: string[]
  cheongganChung: string[]
  jijiChung: string[]

  // 기타
  gongmang: string[]
  hyeong: string[]
  pa: string[]
  hae: string[]
  wonjin: string[]

  // 길성
  gilseong: {
    cheonul: string[]
    munchang: string[]
    taegeuk: string[]
    samgi: string[]
  }

  // 신강/신약
  sinGangSinYak: {
    grade: string
    ratio: number
  }

  // 용신
  eokbuYongsin: string
  johuYongsin: string

  // 격국
  gyeokguk: string

  // 신살
  sinsalsa: string[]

  // 대운
  daeyun: Array<{
    period: string
    saju: string
    age: string
  }>

  // 2026년 운세
  annual2026: AnnualFortune
}

export function buildCompleteAnalysis(
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: Date,
  fourPillars: FourPillars
): CompleteAnalysis {
  const currentYear = 2026
  const age = currentYear - birthDate.getFullYear()

  // 12운성
  const twelveStars = calcTwelveStars(
    fourPillars.dayMaster as string,
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  // 십신 (보유/부재) - 나중에 구현 필요
  const tenGods = {
    present: ['식신', '정재', '편관'],
    absent: ['겁재', '비견', '상관', '편인', '편재', '정인']
  }

  // 관계식들
  const cheongganHap = calcCheongganHap(
    fourPillars.yearStem,
    fourPillars.monthStem,
    fourPillars.dayMaster as string,
    fourPillars.hourStem || null
  )

  const jijiYughap = calcJijiYughap(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const jijiSamhap = calcJijiSamhap(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const jijiBanghap = calcJijiBanghap(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const cheongganChung = calcCheongganChung(
    fourPillars.yearStem,
    fourPillars.monthStem,
    fourPillars.dayMaster as string,
    fourPillars.hourStem || null
  )

  const jijiChung = calcJijiChung(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const gongmang = calcGongmang(
    fourPillars.dayMaster as string,
    fourPillars.dayBranch
  )

  const hyeong = calcHyeong(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const pa = calcPa(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const hae = calcHae(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const wonjin = calcWonjin(
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const gilseong = calcGilseong(
    fourPillars.dayMaster as string,
    fourPillars.yearStem,
    fourPillars.monthStem,
    fourPillars.hourStem || null,
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const sinGangSinYakResult = calcSinGangSinYak(
    fourPillars.yearStem,
    fourPillars.monthStem,
    fourPillars.dayMaster as string,
    fourPillars.hourStem || null,
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.dayBranch,
    fourPillars.hourBranch || null
  )

  const eokbuYongsin = getEokbuYongsin(
    fourPillars.dayMaster as string,
    sinGangSinYakResult.grade
  )

  const johuYongsin = calcJohuYongsin(
    fourPillars.dayMaster as string,
    fourPillars.monthBranch
  )

  const gyeokguk = calculateGyeokguk(
    fourPillars.dayMaster as string,
    fourPillars.monthBranch,
    [fourPillars.yearStem, fourPillars.monthStem, fourPillars.dayMaster as string, fourPillars.hourStem || ''].filter(Boolean)
  )

  const sinsalsa = calculateSinsalsa(
    fourPillars.yearStem,
    fourPillars.monthStem,
    fourPillars.dayMaster as string,
    fourPillars.dayBranch,
    fourPillars.yearBranch,
    fourPillars.monthBranch,
    fourPillars.hourBranch || null
  )

  const daeyun = calculateDaeyun(
    fourPillars.dayMaster as string,
    fourPillars.yearStem,
    gender,
    birthDate
  )

  const annual2026 = getAnnualFortune2026()

  return {
    name,
    gender,
    birthCountry,
    age,
    fourPillars,
    twelveStars,
    tenGods,
    cheongganHap,
    jijiYughap,
    jijiSamhap,
    jijiBanghap,
    cheongganChung,
    jijiChung,
    gongmang,
    hyeong,
    pa,
    hae,
    wonjin,
    gilseong,
    sinGangSinYak: {
      grade: sinGangSinYakResult.grade,
      ratio: sinGangSinYakResult.ratio
    },
    eokbuYongsin,
    johuYongsin,
    gyeokguk,
    sinsalsa,
    daeyun,
    annual2026
  }
}
