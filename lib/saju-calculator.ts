// Saju (Four Pillars) Calculator
// This is a placeholder implementation - replace with your actual Saju calculation logic

import type { BirthInfo, SajuData } from './types'

// Heavenly Stems (천간)
const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const STEMS_ENGLISH = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui']
const STEMS_ELEMENTS = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water']

// Earthly Branches (지지)
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const BRANCHES_ENGLISH = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig']
const BRANCHES_ELEMENTS = ['Water', 'Earth', 'Wood', 'Wood', 'Earth', 'Fire', 'Fire', 'Earth', 'Metal', 'Metal', 'Earth', 'Water']

// Five Elements
const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water']

// PLACEHOLDER: Replace this entire function with your actual Saju calculation logic
export function calculateSaju(birthInfo: BirthInfo): SajuData {
  const date = new Date(birthInfo.birthDate)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Simplified calculation (PLACEHOLDER - replace with accurate algorithm)
  // Year pillar
  const yearStemIndex = (year - 4) % 10
  const yearBranchIndex = (year - 4) % 12
  
  // Month pillar (simplified)
  const monthStemIndex = ((year % 5) * 2 + month - 1) % 10
  const monthBranchIndex = (month + 1) % 12
  
  // Day pillar (simplified - in reality this needs a lookup table)
  const dayNumber = Math.floor(date.getTime() / 86400000)
  const dayStemIndex = dayNumber % 10
  const dayBranchIndex = dayNumber % 12
  
  // Hour pillar (if birth time provided)
  let hourPillar: { stem: string; branch: string } | undefined
  if (birthInfo.birthTime) {
    const [hours] = birthInfo.birthTime.split(':').map(Number)
    const hourBranchIndex = Math.floor((hours + 1) / 2) % 12
    const hourStemIndex = (dayStemIndex * 2 + Math.floor(hours / 2)) % 10
    hourPillar = {
      stem: STEMS_ENGLISH[hourStemIndex],
      branch: BRANCHES_ENGLISH[hourBranchIndex]
    }
  }
  
  // Calculate element balance
  const elements = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0
  }
  
  // Add stem elements
  const stemElement = STEMS_ELEMENTS[dayStemIndex].toLowerCase() as keyof typeof elements
  elements[stemElement] += 2
  elements[STEMS_ELEMENTS[yearStemIndex].toLowerCase() as keyof typeof elements] += 1
  elements[STEMS_ELEMENTS[monthStemIndex].toLowerCase() as keyof typeof elements] += 1
  
  // Add branch elements
  elements[BRANCHES_ELEMENTS[dayBranchIndex].toLowerCase() as keyof typeof elements] += 1
  elements[BRANCHES_ELEMENTS[yearBranchIndex].toLowerCase() as keyof typeof elements] += 1
  elements[BRANCHES_ELEMENTS[monthBranchIndex].toLowerCase() as keyof typeof elements] += 1
  
  // Determine dominant element
  const dominantElement = Object.entries(elements).reduce((a, b) => 
    elements[a[0] as keyof typeof elements] > elements[b[0] as keyof typeof elements] ? a : b
  )[0]
  
  // Determine lucky element (克: controlling element is lucky)
  const luckyElementMap: Record<string, string> = {
    wood: 'Water',
    fire: 'Wood',
    earth: 'Fire',
    metal: 'Earth',
    water: 'Metal'
  }
  
  // Day Master personality types
  const personalityTypes: Record<number, string> = {
    0: 'The Pioneer', // 갑
    1: 'The Diplomat', // 을
    2: 'The Illuminator', // 병
    3: 'The Nurturer', // 정
    4: 'The Foundation', // 무
    5: 'The Harmonizer', // 기
    6: 'The Achiever', // 경
    7: 'The Refiner', // 신
    8: 'The Philosopher', // 임
    9: 'The Mystic' // 계
  }
  
  return {
    yearPillar: {
      stem: STEMS_ENGLISH[yearStemIndex],
      branch: BRANCHES_ENGLISH[yearBranchIndex]
    },
    monthPillar: {
      stem: STEMS_ENGLISH[monthStemIndex],
      branch: BRANCHES_ENGLISH[monthBranchIndex]
    },
    dayPillar: {
      stem: STEMS_ENGLISH[dayStemIndex],
      branch: BRANCHES_ENGLISH[dayBranchIndex]
    },
    hourPillar,
    dominantElement: dominantElement.charAt(0).toUpperCase() + dominantElement.slice(1),
    elementBalance: elements,
    dayMaster: STEMS_ENGLISH[dayStemIndex],
    luckyElement: luckyElementMap[dominantElement.toLowerCase()],
    personalityType: personalityTypes[dayStemIndex]
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
