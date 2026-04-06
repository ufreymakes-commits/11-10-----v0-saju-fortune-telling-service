// 절기(Solar Terms) Table Parser and Calculator
// 24 Solar Terms in order (index 0-23)
// 절기 순서: 소한(0), 대한(1), 입춘(2), 우수(3), 경칩(4), 춘분(5), 청명(6), 곡우(7),
//           입하(8), 소만(9), 망종(10), 하지(11), 소서(12), 대서(13), 입추(14), 처서(15),
//           백로(16), 추분(17), 한로(18), 상강(19), 입동(20), 소설(21), 대설(22), 동지(23)

import fs from 'fs'
import path from 'path'

export interface JeolgiEntry {
  year: number
  terms: Date[] // 24 solar terms as Date objects (UTC)
}

// Solar term names
export const SOLAR_TERM_NAMES = [
  '소한', '대한', '입춘', '우수', '경칩', '춘분', '청명', '곡우',
  '입하', '소만', '망종', '하지', '소서', '대서', '입추', '처서',
  '백로', '추분', '한로', '상강', '입동', '소설', '대설', '동지'
]

// 절(節) - Month-determining terms (12개, 짝수 인덱스가 아닌 특정 인덱스)
// 절기 중 "절"만이 월을 결정함:
// 입춘(2)=인월(1월), 경칩(4)=묘월(2월), 청명(6)=진월(3월), 입하(8)=사월(4월),
// 망종(10)=오월(5월), 소서(12)=미월(6월), 입추(14)=신월(7월), 백로(16)=유월(8월),
// 한로(18)=술월(9월), 입동(20)=해월(10월), 대설(22)=자월(11월), 소한(24/0 다음해)=축월(12월)

// 절기 인덱스 (0-23): 소한(0), 대한(1), 입춘(2), 우수(3), 경칩(4), 춘분(5)...
// "절"은 홀수 달에 들어감: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, (0 for next year)

// Map: 절기 인덱스 -> 해당 월의 지지 인덱스
// 절기명  인덱스  월지(지지인덱스)
// 소한     0      축(1) - 12월 (전년도에서 이어짐)
// 입춘     2      인(2) - 1월
// 경칩     4      묘(3) - 2월
// 청명     6      진(4) - 3월
// 입하     8      사(5) - 4월
// 망종    10      오(6) - 5월
// 소서    12      미(7) - 6월
// 입추    14      신(8) - 7월
// 백로    16      유(9) - 8월
// 한로    18      술(10) - 9월
// 입동    20      해(11) - 10월
// 대설    22      자(0) - 11월

// 절(節) 인덱스 목록
export const JEOL_TERM_INDICES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

// Map 절기 index -> 월지 index
export const JEOL_TO_BRANCH: Record<number, number> = {
  0: 1,   // 소한 -> 축(1) - 음력 12월
  2: 2,   // 입춘 -> 인(2) - 음력 1월
  4: 3,   // 경칩 -> 묘(3) - 음력 2월
  6: 4,   // 청명 -> 진(4) - 음력 3월
  8: 5,   // 입하 -> 사(5) - 음력 4월
  10: 6,  // 망종 -> 오(6) - 음력 5월
  12: 7,  // 소서 -> 미(7) - 음력 6월
  14: 8,  // 입추 -> 신(8) - 음력 7월
  16: 9,  // 백로 -> 유(9) - 음력 8월
  18: 10, // 한로 -> 술(10) - 음력 9월
  20: 11, // 입동 -> 해(11) - 음력 10월
  22: 0,  // 대설 -> 자(0) - 음력 11월
}

// For backward compatibility
export const MONTH_DETERMINING_TERMS = JEOL_TERM_INDICES
export const TERM_TO_BRANCH = JEOL_TO_BRANCH

let jeolgiData: JeolgiEntry[] | null = null

function parseDateTime(dateTimeStr: string): Date | null {
  // Format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD HH:MM:S"
  if (!dateTimeStr || dateTimeStr.trim() === '') return null
  
  const parts = dateTimeStr.trim().split(' ')
  if (parts.length !== 2) return null
  
  const dateParts = parts[0].split('-')
  const timeParts = parts[1].split(':')
  
  if (dateParts.length !== 3 || timeParts.length < 2) return null
  
  const year = parseInt(dateParts[0], 10)
  const month = parseInt(dateParts[1], 10) - 1 // JS months are 0-indexed
  const day = parseInt(dateParts[2], 10)
  const hour = parseInt(timeParts[0], 10)
  const minute = parseInt(timeParts[1], 10)
  const second = timeParts[2] ? parseInt(timeParts[2], 10) : 0
  
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    return null
  }
  
  return new Date(Date.UTC(year, month, day, hour, minute, second))
}

export function loadJeolgiData(): JeolgiEntry[] {
  if (jeolgiData) return jeolgiData
  
  try {
    const filePath = path.join(process.cwd(), 'lib/saju/jeolgi-table.txt')
    console.log('[v0] Loading jeolgi data from:', filePath)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const lines = fileContent.split('\n')
    jeolgiData = []
    
    for (let i = 1; i < lines.length; i++) { // Skip header line
      const line = lines[i].trim()
      if (!line) continue
      
      const columns = line.split('\t')
      if (columns.length < 25) continue
      
      // columns[0] = year, columns[1-24] = 24 solar terms
      const year = parseInt(columns[0], 10)
      if (isNaN(year)) continue
      
      const terms: Date[] = []
      for (let j = 1; j <= 24; j++) {
        const dt = parseDateTime(columns[j])
        if (dt) {
          terms.push(dt)
        }
      }
      
      if (terms.length === 24) {
        jeolgiData.push({ year, terms })
      } else {
        console.log('[v0] Year', year, 'has', terms.length, 'valid terms instead of 24')
      }
    }
    
    console.log('[v0] Loaded jeolgi data for', jeolgiData.length, 'years')
    if (jeolgiData.length > 0) {
      console.log('[v0] Year range:', jeolgiData[0].year, '-', jeolgiData[jeolgiData.length - 1].year)
    }
    return jeolgiData
  } catch (error) {
    console.error('[v0] Error loading jeolgi data:', error)
    jeolgiData = []
    return jeolgiData
  }
}

// Get the jeolgi entry for a specific year
export function getJeolgiForYear(year: number): JeolgiEntry | null {
  const data = loadJeolgiData()
  return data.find(entry => entry.year === year) || null
}

// Find which solar term period a given date falls into
// Returns the index of the most recent solar term (0-23)
export function findCurrentSolarTerm(date: Date): { termIndex: number; year: number } | null {
  const data = loadJeolgiData()
  const targetTime = date.getTime()
  
  // Check current year and previous year and next year
  const checkYear = date.getUTCFullYear()
  const years = [checkYear - 1, checkYear, checkYear + 1]
  
  let latestTerm: { termIndex: number; year: number; time: number } | null = null
  
  for (const year of years) {
    const entry = data.find(e => e.year === year)
    if (!entry) continue
    
    for (let i = 0; i < entry.terms.length; i++) {
      const termTime = entry.terms[i].getTime()
      if (termTime <= targetTime) {
        if (!latestTerm || termTime > latestTerm.time) {
          latestTerm = { termIndex: i, year, time: termTime }
        }
      }
    }
  }
  
  return latestTerm ? { termIndex: latestTerm.termIndex, year: latestTerm.year } : null
}

// Get month branch (지지) based on solar terms
// Returns the branch index (0=자, 1=축, 2=인, ...)
export function getMonthBranchFromSolarTerm(date: Date): number {
  const result = findCurrentSolarTerm(date)
  if (!result) {
    // Fallback: use simple month calculation
    console.log('[v0] No solar term found, using fallback')
    const month = date.getUTCMonth()
    return (month + 2) % 12
  }
  
  console.log('[v0] Current solar term:', result.termIndex, SOLAR_TERM_NAMES[result.termIndex], 'year:', result.year)
  
  // Find the most recent 절(節) term
  // 절 인덱스: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22
  let termIndex = result.termIndex
  
  // If current term is a 기(氣) (odd position from 절), go back to previous 절
  // 기 인덱스: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23
  if (!JEOL_TERM_INDICES.includes(termIndex)) {
    // Go back one to find the 절
    termIndex = termIndex - 1
    if (termIndex < 0) termIndex = 22 // Wrap to 대설
  }
  
  console.log('[v0] Using 절 term:', termIndex, SOLAR_TERM_NAMES[termIndex], '-> branch:', JEOL_TO_BRANCH[termIndex])
  
  return JEOL_TO_BRANCH[termIndex]
}

// Calculate month stem (천간) based on year stem and month branch
// 갑기년(0,5): 병인월부터, 을경년(1,6): 무인월부터, 병신년(2,7): 경인월부터,
// 정임년(3,8): 임인월부터, 무계년(4,9): 갑인월부터
export function getMonthStem(yearStemIndex: number, monthBranchIndex: number): number {
  // 인월(2)의 천간 시작점
  // 갑/기년: 병(2), 을/경년: 무(4), 병/신년: 경(6), 정/임년: 임(8), 무/계년: 갑(0)
  const baseStems = [2, 4, 6, 8, 0] // 갑, 을, 병, 정, 무 순
  const baseStem = baseStems[yearStemIndex % 5]
  
  // 인월(2)부터 시작해서 월지에 따른 오프셋 계산
  // 월지: 자(0), 축(1), 인(2), 묘(3), 진(4), 사(5), 오(6), 미(7), 신(8), 유(9), 술(10), 해(11)
  const branchOffset = (monthBranchIndex - 2 + 12) % 12
  
  return (baseStem + branchOffset) % 10
}

// Get the year's first jeolgi (입춘) to determine if we're in the new year
export function getIpchun(year: number): Date | null {
  const entry = getJeolgiForYear(year)
  if (!entry) return null
  return entry.terms[2] // 입춘 is at index 2
}

// Determine the "saju year" - before 입춘 counts as previous year
export function getSajuYear(date: Date): number {
  const year = date.getUTCFullYear()
  const ipchun = getIpchun(year)
  
  if (ipchun && date.getTime() < ipchun.getTime()) {
    return year - 1
  }
  return year
}
