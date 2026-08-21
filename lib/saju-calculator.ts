// Saju (Four Pillars) Calculator
// Complete analysis including all advanced calculations

import type { BirthInfo, SajuData } from './types'
import { runFullAnalysis, calculateElementScoresWithHiddenStems, countElementsBasic, calculateYeonWoon } from './saju/core-calculator'
import {
  calcTwelveStars,
  calcTwelveSinsal,
  calcHybridTwelveSinsal,
  calcCheongganHap,
  calcJijiYughap,
  calcJijiSamhap,
  calcJijiBanghap,
  calcCheongganChung,
  calcJijiChung,
  calcGongmang,
  calcHyeong,
  calcPa,
  calcHae,
  calcWonjin,
  calcGilseong,
  calcSinGangSinYak,
  getEokbuYongsin,
  calcJohuYongsin,
  calcAllSinsal,
  calcDetailedSinsal,
  calcDaeyun,
  enrichDaeWoonWithTenGodsAndStars
} from './saju/advanced'
import { STEMS, BRANCHES, STEM_TO_ELEMENT } from './saju/constants'
import { calculateMarriageTiming } from './saju/marriage-timing'
import { calculateDecadeFortune } from './saju/decade-fortune'

// Heavenly Stems in Hanja (천간 한자)
const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const STEMS_KOREAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']

// Earthly Branches in Hanja (지지 한자)
const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const BRANCHES_KOREAN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

// Convert Korean to Hanja
function koreanStemToHanja(korean: string): string {
  const index = STEMS_KOREAN.indexOf(korean)
  return index >= 0 ? STEMS_HANJA[index] : korean
}

function koreanBranchToHanja(korean: string): string {
  const index = BRANCHES_KOREAN.indexOf(korean)
  return index >= 0 ? BRANCHES_HANJA[index] : korean
}

// Parse birth time from form format "HH:MM AM/PM" to 24h format
function parseBirthTime(timeStr: string | undefined): string | undefined {
  if (!timeStr) return undefined
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return undefined
  
  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const period = match[3]?.toUpperCase()
  
  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

// 격국 계산
function calcGyeokguk(dayMaster: string, monthBranch: string, allStems: string[]): string {
  // 월지 지장간의 본기로 격국 결정
  const JIJANGGAN_BONGI: Record<string, string> = {
    '자': '계', '축': '기', '인': '갑', '묘': '을', '진': '무', '사': '병',
    '오': '정', '미': '기', '신': '경', '유': '신', '술': '무', '해': '임'
  }
  
  const TEN_GODS_FOR_GYEOK: Record<string, Record<string, string>> = {
    '갑': { '갑': '비견격', '을': '겁재격', '병': '식신격', '정': '상관격', '무': '편재격', '기': '정재격', '경': '편관격', '신': '정관격', '임': '편인격', '계': '정인격' },
    '을': { '을': '비견격', '갑': '겁재격', '정': '식신격', '병': '상관격', '기': '편재격', '무': '정재격', '신': '편관격', '경': '정관격', '계': '편인격', '임': '정인격' },
    '병': { '병': '비견격', '정': '겁재격', '무': '식신격', '기': '상관격', '경': '편재격', '신': '정재격', '임': '편관격', '계': '정관격', '갑': '편인격', '을': '정인격' },
    '정': { '정': '비견격', '병': '겁재격', '기': '식신격', '무': '상관격', '신': '편재격', '경': '정재격', '계': '편관격', '임': '정관격', '을': '편인격', '갑': '정인격' },
    '무': { '무': '비견격', '기': '겁재격', '경': '식신격', '신': '상관격', '임': '편재격', '계': '정재격', '갑': '편관격', '을': '정관격', '병': '편인격', '정': '정인격' },
    '기': { '기': '비견격', '무': '겁재격', '신': '식신격', '경': '상관격', '계': '편재격', '임': '정재격', '을': '편관격', '갑': '정관격', '정': '편인격', '병': '정인격' },
    '경': { '경': '비견격', '신': '겁재격', '임': '식신격', '계': '상관격', '갑': '편재격', '을': '정재격', '병': '편관격', '정': '정관격', '무': '편인격', '기': '정인격' },
    '신': { '신': '비견격', '경': '겁재격', '계': '식신격', '임': '상관격', '을': '편재격', '갑': '정재격', '정': '편관격', '병': '정관격', '기': '편인격', '무': '정인격' },
    '임': { '임': '비견격', '계': '겁재격', '갑': '식신격', '을': '상관격', '병': '편재격', '정': '정재격', '무': '편관격', '기': '정관격', '경': '편인격', '신': '정인격' },
    '계': { '계': '비견격', '임': '겁재격', '을': '식신격', '갑': '상관격', '정': '편재격', '병': '정재격', '기': '편관격', '무': '정관격', '신': '편인격', '경': '정인격' }
  }

  const bongi = JIJANGGAN_BONGI[monthBranch]
  if (!bongi) return '미정격'
  
  // 투출 확인 (천간에 본기가 있는지)
  const isTuchul = allStems.includes(bongi)
  
  const gyeokTable = TEN_GODS_FOR_GYEOK[dayMaster]
  if (!gyeokTable) return '미정격'
  
  const gyeok = gyeokTable[bongi]
  return gyeok ? (isTuchul ? gyeok : `${gyeok}(본기)`) : '미정격'
}

export function calculateSaju(birthInfo: BirthInfo): SajuData {
  const birthTime = parseBirthTime(birthInfo.birthTime)
  const date = new Date(birthInfo.birthDate)
  
  let hour: number | undefined
  let minute: number | undefined
  if (birthTime) {
    const [h, m] = birthTime.split(':').map(Number)
    hour = h
    minute = m
  }
  
  // 기본 분석 실행 (새 필드: timezone, longitude 전달)
  const analysis = runFullAnalysis({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour,
    minute,
    gender: birthInfo.gender as 'male' | 'female',
    country: birthInfo.birthCountry,
    // 새 필드: 도시 선택 시 정밀 진태양시 계산에 사용
    timezone: birthInfo.timezone,
    longitude: birthInfo.longitude,
    latitude: birthInfo.latitude
  })
  
  const fp = analysis.fourPillars
  
  // 한자 변환
  const yearStemHanja = koreanStemToHanja(fp.year.stem)
  const yearBranchHanja = koreanBranchToHanja(fp.year.branch)
  const monthStemHanja = koreanStemToHanja(fp.month.stem)
  const monthBranchHanja = koreanBranchToHanja(fp.month.branch)
  const dayStemHanja = koreanStemToHanja(fp.day.stem)
  const dayBranchHanja = koreanBranchToHanja(fp.day.branch)
  
  let hourStemHanja: string | null = null
  let hourBranchHanja: string | null = null
  if (fp.hour && fp.hour.stem && fp.hour.branch) {
    hourStemHanja = koreanStemToHanja(fp.hour.stem)
    hourBranchHanja = koreanBranchToHanja(fp.hour.branch)
  }
  
  // 한글 천간/지지 (advanced.ts 함수들에 전달용)
  const yearStem = fp.year.stem
  const yearBranch = fp.year.branch
  const monthStem = fp.month.stem
  const monthBranch = fp.month.branch
  const dayStem = fp.day.stem
  const dayBranch = fp.day.branch
  const hourStem = fp.hour?.stem || null
  const hourBranch = fp.hour?.branch || null
  
  const allBranches = [yearBranch, monthBranch, dayBranch]
  if (hourBranch) allBranches.push(hourBranch)
  
  const allStems = [yearStem, monthStem, dayStem]
  if (hourStem) allStems.push(hourStem)
  
  // === 12운성 ===
  const twelveStars = calcTwelveStars(
    dayStem as any,
    yearBranch as any,
    monthBranch as any,
    dayBranch as any,
    hourBranch as any
  )
  
  // === ���계식 계산 ===
  const cheongganHap = calcCheongganHap(
    yearStem as any, monthStem as any, dayStem as any, hourStem as any
  )
  const jijiYughap = calcJijiYughap(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  const jijiSamhap = calcJijiSamhap(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  const jijiBanghap = calcJijiBanghap(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  const cheongganChung = calcCheongganChung(
    yearStem as any, monthStem as any, dayStem as any, hourStem as any
  )
  const jijiChung = calcJijiChung(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  const gongmang = calcGongmang(dayStem as any, dayBranch as any)
  const hyeong = calcHyeong(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  const pa = calcPa(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  const hae = calcHae(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  const wonjin = calcWonjin(
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  
  // === 길성 ===
  const gilseong = calcGilseong(
    dayStem as any,
    yearStem as any, monthStem as any, hourStem as any,
    yearBranch as any, monthBranch as any, dayBranch as any, hourBranch as any
  )
  
  // === 신강/신약 ===
  const sinGangSinYak = calcSinGangSinYak(
    dayStem as any, monthBranch as any,
    yearStem as any, monthStem as any, dayStem as any, hourStem as any,
    yearBranch as any, dayBranch as any, hourBranch as any
  )
  
  // === 용신 ===
  const eokbuYongsin = getEokbuYongsin(dayStem as any, sinGangSinYak.ratio >= 50)
  const johuYongsin = calcJohuYongsin(dayStem as any, monthBranch as any)
  
  // === 격국 ===
  const gyeokguk = calcGyeokguk(dayStem, monthBranch, allStems)
  
  // === 신살 (advanced.ts의 정확한 로직 사용) ===
  const spirits = calcAllSinsal(
    yearBranch as string,
    monthBranch as string,
    dayBranch as string,
    hourBranch as string | null,
    dayStem as string,
    birthInfo.gender,
    yearStem as string,
    monthStem as string,
    hourStem as string | null
  )
  
  // === 상세 신살 분석 (위치, 강도, 활용 가이드 포함) ===
  const detailedSinsal = calcDetailedSinsal(
    yearBranch as string,
    monthBranch as string,
    dayBranch as string,
    hourBranch as string | null,
    dayStem as string,
    yearStem as string,
    monthStem as string,
    hourStem as string | null
  )
  
  // === 12신살 계산 (연지 기준 - 사회적 성공운) ===
  const twelveSinsal = calcTwelveSinsal(
    yearBranch as string,
    monthBranch as string,
    dayBranch as string,
    hourBranch as string | null
  )
  
  // === 하이브리드 12신살 (연지 + 일지 기준) - 100만명 일관성 ===
  const hybridTwelveSinsal = calcHybridTwelveSinsal(
    yearBranch as string,
    monthBranch as string,
    dayBranch as string,
    hourBranch as string | null
  )
  
  // === 오행 "존재감" 계산 (지장간 미포함) - 오행분포(오각형)용 ===
  // 사주 8글자에 겉으로 드러난 오행의 단순 개수. 어떤 오행이 많이/적게 존재하는지 보여주는 보조 지표.
  const elementCountBasic = countElementsBasic(fp)
  
  // === 오행 "영향력" 계산 (지장간 포함, 가중 점수) - 실제 해석의 메인 근거 ===
  // 천간/지지 가중치 + 지장간을 반영한 오행 세력. 오행 강약·성향 해석 시 우선적으로 사용.
  const elementScoresWithHiddenStems = calculateElementScoresWithHiddenStems(fp)
  
  const elementCountBasicEnglish = {
    wood: elementCountBasic['목'] || 0,
    fire: elementCountBasic['화'] || 0,
    earth: elementCountBasic['토'] || 0,
    metal: elementCountBasic['금'] || 0,
    water: elementCountBasic['수'] || 0
  }
  
  // 지장간 포함 점수 (해석의 메인 근거)
  const elementBalanceWithHiddenStems = {
    wood: elementScoresWithHiddenStems['목'] || 0,
    fire: elementScoresWithHiddenStems['화'] || 0,
    earth: elementScoresWithHiddenStems['토'] || 0,
    metal: elementScoresWithHiddenStems['금'] || 0,
    water: elementScoresWithHiddenStems['수'] || 0
  }
  
  const elementBalanceWithHiddenStemsKorean = {
    목: elementScoresWithHiddenStems['목'] || 0,
    화: elementScoresWithHiddenStems['화'] || 0,
    토: elementScoresWithHiddenStems['토'] || 0,
    금: elementScoresWithHiddenStems['금'] || 0,
    수: elementScoresWithHiddenStems['수'] || 0
  }
  
  // 대운 (정확한 계산) + 십신/12운성 추가
  const daeyunGender: 'male' | 'female' = birthInfo.gender === 'female' ? 'female' : 'male'
  const daewoonEnriched = enrichDaeWoonWithTenGodsAndStars(
    calcDaeyun(
      date,
      daeyunGender,
      yearStem,
      monthStem,
      monthBranch
    ),
    dayStem
  )
  
  // 연운 (리포트 상단 표기용: 현재 ~ +9년)
  const yeonwoonMapped = analysis.yeonwoon.map(y => ({
    year: y.year,
    stem: y.stem,
    branch: y.branch,
    fullName: `${koreanStemToHanja(y.stem)}${koreanBranchToHanja(y.branch)}`
  }))
  
  // 결혼 타이밍 전용 연운 범위: 성인이 된 시점(만 19세)부터 현재+9년까지
  // → 이미 성인기를 지나온 사람(예: 1996년생)의 경우 과거의 결혼/인연 시기도 함께 짚어줘야 하므로
  //   "현재 ~ +9년"만 보는 리포트 상단용 yeonwoon과 별도로 넓은 범위를 계산한다.
  const birthYearForTiming = date.getFullYear()
  const currentYearForTiming = new Date().getFullYear()
  const adultYear = birthYearForTiming + 19
  const timingRangeStart = Math.min(adultYear, currentYearForTiming)
  const timingRangeEnd = currentYearForTiming + 9
  const timingYearCount = timingRangeEnd - timingRangeStart + 1
  const yeonwoonForTiming = calculateYeonWoon(timingRangeStart, timingYearCount).map(y => ({
    year: y.year,
    stem: y.stem,
    branch: y.branch,
    fullName: `${koreanStemToHanja(y.stem)}${koreanBranchToHanja(y.branch)}`
  }))
  
  // === 결혼/연애 타이밍 (결정론적 계산 - AI가 재계산하지 않고 그대로 인용) ===
  const marriageTiming = calculateMarriageTiming({
    gender: daeyunGender,
    dayStem,
    dayBranch,
    yearStem,
    yearBranch,
    monthStem,
    monthBranch,
    hourStem,
    hourBranch,
    birthYear: birthYearForTiming,
    currentYear: currentYearForTiming,
    daewoon: daewoonEnriched,
    yeonwoon: yeonwoonForTiming
  })
  
  // === 대운 곡선 & 연도별 하이라이트 (결정론적 계산 - AI가 재계산하지 않고 그대로 인용) ===
  const decadeFortune = calculateDecadeFortune({
    gender: daeyunGender,
    dayStem,
    dayBranch,
    monthBranch,
    yearBranch,
    hourBranch,
    birthYear: birthYearForTiming,
    isDayMasterStrong: sinGangSinYak.ratio >= 50,
    daewoon: daewoonEnriched
  })
  
  return {
    // 4주 (한자)
    yearPillar: {
      stem: yearStemHanja,
      branch: yearBranchHanja,
      fullName: `${yearStemHanja}${yearBranchHanja}`,
      fullNameKorean: `${yearStem}${yearBranch}`
    },
    monthPillar: {
      stem: monthStemHanja,
      branch: monthBranchHanja,
      fullName: `${monthStemHanja}${monthBranchHanja}`,
      fullNameKorean: `${monthStem}${monthBranch}`
    },
    dayPillar: {
      stem: dayStemHanja,
      branch: dayBranchHanja,
      fullName: `${dayStemHanja}${dayBranchHanja}`,
      fullNameKorean: `${dayStem}${dayBranch}`
    },
    hourPillar: hourStemHanja && hourBranchHanja ? {
      stem: hourStemHanja,
      branch: hourBranchHanja,
      fullName: `${hourStemHanja}${hourBranchHanja}`,
      fullNameKorean: `${hourStem}${hourBranch}`
    } : undefined,
    
    // 일간
    dayMaster: dayStemHanja,
    dayMasterKorean: dayStem,
    
    // 오행 "존재감" (지장간 미포함 - 단순 개수) - 오행분포(오각형) 표시용, 보조 근거
    elementCountBasic: elementCountBasicEnglish,
    elementCountBasicKorean: {
      목: elementCountBasic['목'] || 0,
      화: elementCountBasic['화'] || 0,
      토: elementCountBasic['토'] || 0,
      금: elementCountBasic['금'] || 0,
      수: elementCountBasic['수'] || 0
    },
    
    // 오행 "영향력" (지장간 포함 - 가중 점수) - 모든 해석의 메인 근거
    elementBalanceWithHiddenStems,
    elementBalanceWithHiddenStemsKorean,
    dominantElement: Object.entries(elementBalanceWithHiddenStems).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0],
    
    // 12운성
    twelveStars: twelveStars.map(ts => ({
      position: ts.position,
      branch: ts.branch,
      star: ts.star
    })),
    
    // 십신 (각 위치별 + 보유/부재)
    tenGods: {
      present: analysis.tenGods.present,
      missing: analysis.tenGods.missing,
      details: analysis.tenGods.details,
      byPosition: analysis.tenGods.byPosition
    },
    
    // 관계식
    cheongganHap,
    jijiYughap,
    jijiSamhap,
    jijiBanghap,
    cheongganChung,
    jijiChung,
    hyeong,
    pa,
    hae,
    wonjin,
    
    // 길성
    gilseong,
    
    // 공망
    gongmang,
    
    // 신강/신약
    sinGangSinYak: {
      grade: sinGangSinYak.grade,
      ratio: sinGangSinYak.ratio
    },
    
    // 용신
    eokbuYongsin,
    johuYongsin,
    
    // 격국
    gyeokguk,
    
    // 신살 (기본)
    spirits,
    
    // 신살 (상세 분석 - 위치, 강도, 활용 가이드)
    sinsalDetails: detailedSinsal.details,
    sinsalSummary: detailedSinsal.summary,
    sinsalCombinedGuide: detailedSinsal.combinedGuide,
    
    // 12신살 (연지 기준 - 사회적 성공운)
    twelveSinsal,
    
    // 하이브리드 12신살 (연지 + 일지 기준 모두)
    hybridTwelveSinsal,
    
    // 대운 (정확한 계산) + 십신/12운성 추가
    daewoon: daewoonEnriched,
    
    // 연운
    yeonwoon: yeonwoonMapped,
    
  // 결혼/연애 타이밍 (결정론적 계산 결과 - 리포트에서는 이 값을 그대로 인용만 할 것)
    marriageTiming,
    // 대운 곡선 & 연도별 하이라이트 (결정론적 계산 결과 - 리포트에서는 이 값을 그대로 인용만 할 것)
    decadeFortune
  }
  }

// Helper function to get element description
export function getElementDescription(element: string): string {
  const descriptions: Record<string, string> = {
    Wood: 'Growth, creativity, flexibility, and compassion',
    Fire: 'Passion, enthusiasm, warmth, and leadership',
    Earth: 'Stability, nurturing, reliability, and practicality',
    Metal: 'Precision, determination, organization, and strength',
    Water: 'Wisdom, adaptability, intuition, and depth'
  }
  return descriptions[element] || ''
}
