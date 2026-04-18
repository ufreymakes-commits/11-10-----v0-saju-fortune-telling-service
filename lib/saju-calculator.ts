// Saju (Four Pillars) Calculator
// Complete analysis including all advanced calculations

import type { BirthInfo, SajuData } from './types'
import { runFullAnalysis, calculateElementScores, calculateElementScoresWithHiddenStems, calculateElementScoresWithHapChung, countElementsWithHiddenStems } from './saju/core-calculator'
import {
  calcTwelveStars,
  calcTwelveSinsal,
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
  
  // 기본 분석 실행
  const analysis = runFullAnalysis({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour,
    minute,
    gender: birthInfo.gender as 'male' | 'female',
    country: birthInfo.birthCountry
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
  
  // === 12신살 계산 (연지 기준 삼합 그룹) ===
  const twelveSinsal = calcTwelveSinsal(
    yearBranch as string,
    monthBranch as string,
    dayBranch as string,
    hourBranch as string | null
  )
  
  // === 오행 개수 계산 (지장간 포함) - 비율 표시용 ===
  const elementCounts = countElementsWithHiddenStems(fp)
  
  // === 오행 점수 계산 (수치론 점수 방식: 총 120점) ===
  // 천간: 각 10점, 지지: 연지 10점, 월지 30점, 일지 20점, 시지 20점
  const elementScores = calculateElementScores(fp)
  
  // === 지장간 포함 오행 점수 계산 ===
  // 천간 + 지지 본기 + 지장간 (본기 50%, 중기 30%, 말기 20%)
  const elementScoresWithHiddenStems = calculateElementScoresWithHiddenStems(fp)
  
  // === 합충 반영 오행 점수 계산 ===
  const hapChungAnalysis = calculateElementScoresWithHapChung(
    fp,
    allStems,
    allBranches
  )
  
  // 기본 점수 (지장간 미포함) - 천간 + 지지만
  const elementBalance = {
    wood: elementScores['목'] || 0,
    fire: elementScores['화'] || 0,
    earth: elementScores['토'] || 0,
    metal: elementScores['금'] || 0,
    water: elementScores['수'] || 0
  }
  
  // 오행 한글 키 (기본)
  const elementBalanceKorean = {
    목: elementScores['목'] || 0,
    화: elementScores['화'] || 0,
    토: elementScores['토'] || 0,
    금: elementScores['금'] || 0,
    수: elementScores['수'] || 0
  }
  
  // 지장간 포함 점수
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
  
  // 합충 반영 점수
  const elementBalanceAdjusted = {
    wood: hapChungAnalysis.adjustedScores['목'] || 0,
    fire: hapChungAnalysis.adjustedScores['화'] || 0,
    earth: hapChungAnalysis.adjustedScores['토'] || 0,
    metal: hapChungAnalysis.adjustedScores['금'] || 0,
    water: hapChungAnalysis.adjustedScores['수'] || 0
  }
  
  const elementBalanceAdjustedKorean = {
    목: hapChungAnalysis.adjustedScores['목'] || 0,
    화: hapChungAnalysis.adjustedScores['화'] || 0,
    토: hapChungAnalysis.adjustedScores['토'] || 0,
    금: hapChungAnalysis.adjustedScores['금'] || 0,
    수: hapChungAnalysis.adjustedScores['수'] || 0
  }
  
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
    
    // 오행 개수 (지장간 포함 - 비율 표시용)
    elementCount: {
      목: elementCounts['목'] || 0,
      화: elementCounts['화'] || 0,
      토: elementCounts['토'] || 0,
      금: elementCounts['금'] || 0,
      수: elementCounts['수'] || 0
    },
    
    // 오행 (기본 점수 - 수치론 120점)
    elementBalance,
    elementBalanceKorean,
    dominantElement: Object.entries(elementBalance).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0],
    
    // 오행 (지장간 포함 점수)
    elementBalanceWithHiddenStems,
    elementBalanceWithHiddenStemsKorean,
    
    // 오행 (합충 반영 점수)
    elementBalanceAdjusted,
    elementBalanceAdjustedKorean,
    hapChungAdjustments: hapChungAnalysis.adjustments,
    hapChungSummary: hapChungAnalysis.summary,
    
    // 12운성
    twelveStars: twelveStars.map(ts => ({
      position: ts.position,
      branch: ts.branch,
      star: ts.star
    })),
    
    // 십신
    tenGods: {
      present: analysis.tenGods.present,
      missing: analysis.tenGods.missing
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
    
    // 12신살 (연지 기준 삼합 그룹)
    twelveSinsal,
    
    // 대운 (정확한 계산) + 십신/12운성 추가
    daewoon: enrichDaeWoonWithTenGodsAndStars(
      calcDaeyun(
        date,
        birthInfo.gender === '여' || birthInfo.gender === 'female' ? 'female' : 'male',
        yearStem,
        monthStem,
        monthBranch
      ),
      dayStem
    ),
    
    // 연운
    yeonwoon: analysis.yeonwoon.map(y => ({
      year: y.year,
      stem: y.stem,
      branch: y.branch,
      fullName: `${koreanStemToHanja(y.stem)}${koreanBranchToHanja(y.branch)}`
    }))
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
