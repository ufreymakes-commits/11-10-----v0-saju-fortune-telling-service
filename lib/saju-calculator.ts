// Saju (Four Pillars) Calculator
// Connects to the full saju calculation module

import type { BirthInfo, SajuData } from './types'
import { runFullAnalysis } from './saju'

// Heavenly Stems in Hanja (천간 한자)
const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const STEMS_KOREAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const STEMS_ENGLISH = ['Gap', 'Eul', 'Byeong', 'Jeong', 'Mu', 'Gi', 'Gyeong', 'Sin', 'Im', 'Gye']

// Earthly Branches in Hanja (지지 한자)
const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const BRANCHES_KOREAN = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const BRANCHES_ENGLISH = ['Ja', 'Chuk', 'In', 'Myo', 'Jin', 'Sa', 'O', 'Mi', 'Sin', 'Yu', 'Sul', 'Hae']

// Element mapping for stems
const STEMS_ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water']

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
  
  // Handle "HH:MM AM/PM" format
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

export function calculateSaju(birthInfo: BirthInfo): SajuData {
  const birthTime = parseBirthTime(birthInfo.birthTime)
  const date = new Date(birthInfo.birthDate)
  
  // Parse time
  let hour: number | undefined
  let minute: number | undefined
  if (birthTime) {
    const [h, m] = birthTime.split(':').map(Number)
    hour = h
    minute = m
  }
  
  // Run the full analysis using our saju module
  const analysis = runFullAnalysis({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour,
    minute,
    gender: birthInfo.gender as 'male' | 'female',
    country: birthInfo.birthCountry
  })
  
  // Convert results to SajuData format with Hanja characters
  // Access fourPillars object structure
  const fp = analysis.fourPillars
  const yearStemHanja = koreanStemToHanja(fp.year.stem)
  const yearBranchHanja = koreanBranchToHanja(fp.year.branch)
  const monthStemHanja = koreanStemToHanja(fp.month.stem)
  const monthBranchHanja = koreanBranchToHanja(fp.month.branch)
  const dayStemHanja = koreanStemToHanja(fp.day.stem)
  const dayBranchHanja = koreanBranchToHanja(fp.day.branch)
  
  let hourPillar: { stem: string; branch: string } | undefined
  if (fp.hour && fp.hour.stem && fp.hour.branch) {
    hourPillar = {
      stem: koreanStemToHanja(fp.hour.stem),
      branch: koreanBranchToHanja(fp.hour.branch)
    }
  }
  
  // Calculate element balance from analysis (Korean keys: 목, 화, 토, 금, 수)
  const ec = analysis.elementCount
  const elements = {
    wood: ec['목'] || 0,
    fire: ec['화'] || 0,
    earth: ec['토'] || 0,
    metal: ec['금'] || 0,
    water: ec['수'] || 0
  }
  
  // Determine dominant element
  const dominantElement = Object.entries(elements).reduce((a, b) => 
    elements[a[0] as keyof typeof elements] > elements[b[0] as keyof typeof elements] ? a : b
  )[0]
  
  // Day Master info
  const dayStemIndex = STEMS_HANJA.indexOf(dayStemHanja)
  const dayMasterElement = dayStemIndex >= 0 ? STEMS_ELEMENTS[dayStemIndex] : 'Earth'
  
  // Lucky element (生: supporting element)
  const luckyElementMap: Record<string, string> = {
    Wood: 'Water',
    Fire: 'Wood',
    Earth: 'Fire',
    Metal: 'Earth',
    Water: 'Metal'
  }
  
  // Personality types based on Day Master
  const personalityTypes: Record<string, string> = {
    '甲': 'The Pioneer',
    '乙': 'The Diplomat',
    '丙': 'The Illuminator',
    '丁': 'The Nurturer',
    '戊': 'The Mountain',
    '己': 'The Garden',
    '庚': 'The Warrior',
    '辛': 'The Jewel',
    '壬': 'The Ocean',
    '癸': 'The Rain'
  }
  
  return {
    yearPillar: {
      stem: yearStemHanja,
      branch: yearBranchHanja
    },
    monthPillar: {
      stem: monthStemHanja,
      branch: monthBranchHanja
    },
    dayPillar: {
      stem: dayStemHanja,
      branch: dayBranchHanja
    },
    hourPillar,
    dominantElement: dominantElement.charAt(0).toUpperCase() + dominantElement.slice(1),
    elementBalance: elements,
    dayMaster: dayStemHanja,
    luckyElement: luckyElementMap[dayMasterElement] || 'Water',
    personalityType: personalityTypes[dayStemHanja] || 'The Seeker',
    // Include additional analysis data
    tenGods: {
      present: analysis.tenGods.present,
      missing: analysis.tenGods.missing
    },
    // Convert spirits array to object format
    spirits: analysis.spirits.reduce((acc, spirit) => {
      acc[spirit] = true
      return acc
    }, {} as Record<string, boolean>),
    // Convert daewoon to match SajuData format
    daewoon: analysis.daewoon.map(d => ({
      startAge: d.startAge,
      endAge: d.startAge + 9,
      stem: d.stem,
      branch: d.branch
    })),
    yeonwoon: analysis.yeonwoon.map(y => ({
      year: y.year,
      stem: y.stem,
      branch: y.branch
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

// Helper function to format Saju data for display
export function formatSajuForDisplay(saju: SajuData) {
  return {
    fourPillars: [
      { name: 'Year Pillar', stem: saju.yearPillar.stem, branch: saju.yearPillar.branch },
      { name: 'Month Pillar', stem: saju.monthPillar.stem, branch: saju.monthPillar.branch },
      { name: 'Day Pillar', stem: saju.dayPillar.stem, branch: saju.dayPillar.branch },
      ...(saju.hourPillar ? [{ name: 'Hour Pillar', stem: saju.hourPillar.stem, branch: saju.hourPillar.branch }] : [])
    ],
    summary: `Your Day Master is ${saju.dayMaster}, making you "${saju.personalityType}". Your dominant element is ${saju.dominantElement}, and your lucky element is ${saju.luckyElement}.`
  }
}
