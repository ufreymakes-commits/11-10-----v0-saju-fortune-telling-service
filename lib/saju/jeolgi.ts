// 절기(Solar Terms) Calculator
// 24 Solar Terms in order (index 0-23)
// 절기 순서: 소한(0), 대한(1), 입춘(2), 우수(3), 경칩(4), 춘분(5), 청명(6), 곡우(7),
//           입하(8), 소만(9), 망종(10), 하지(11), 소서(12), 대서(13), 입추(14), 처서(15),
//           백로(16), 추분(17), 한로(18), 상강(19), 입동(20), 소설(21), 대설(22), 동지(23)

// Import inline data instead of reading from file
import { 
  SOLAR_TERM_NAMES as TERM_NAMES,
  JEOL_TERM_INDICES as JEOL_INDICES,
  JEOL_TO_BRANCH as BRANCH_MAP,
  getJeolgiData
} from './jeolgi-data'

export interface JeolgiEntry {
  year: number
  terms: Date[] // 24 solar terms as Date objects (UTC)
}

// Re-export constants
export const SOLAR_TERM_NAMES = TERM_NAMES
export const JEOL_TERM_INDICES = JEOL_INDICES
export const JEOL_TO_BRANCH = BRANCH_MAP

// For backward compatibility
export const MONTH_DETERMINING_TERMS = JEOL_TERM_INDICES
export const TERM_TO_BRANCH = JEOL_TO_BRANCH

// Get the jeolgi entry for a specific year
export function getJeolgiForYear(year: number): JeolgiEntry | null {
  const data = getJeolgiData()
  const entry = data[year]
  if (!entry) return null
  return {
    year,
    terms: entry.map(ts => new Date(ts))
  }
}

// Legacy function for compatibility
export function loadJeolgiData(): JeolgiEntry[] {
  const data = getJeolgiData()
  return Object.entries(data).map(([yearStr, timestamps]) => ({
    year: parseInt(yearStr, 10),
    terms: timestamps.map(ts => new Date(ts))
  }))
}

// Find which solar term period a given date falls into
// Returns the index of the most recent solar term (0-23)
export function findCurrentSolarTerm(date: Date): { termIndex: number; year: number } | null {
  const data = getJeolgiData()
  const targetTime = date.getTime()
  
  // Check current year and previous year
  const checkYear = date.getUTCFullYear()
  const years = [checkYear - 1, checkYear, checkYear + 1]
  
  let latestTerm: { termIndex: number; year: number; time: number } | null = null
  
  for (const year of years) {
    const entry = data[year]
    if (!entry) continue
    
    for (let i = 0; i < entry.length; i++) {
      const termTime = entry[i]
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
    const month = date.getUTCMonth()
    return (month + 2) % 12
  }
  
  // Find the most recent 절(節) term
  let termIndex = result.termIndex
  
  // If current term is a 기(氣) (odd index), go back to previous 절
  if (!JEOL_TERM_INDICES.includes(termIndex)) {
    termIndex = termIndex - 1
    if (termIndex < 0) termIndex = 22
  }
  
  return JEOL_TO_BRANCH[termIndex]
}

// Calculate month stem (천간) based on year stem and month branch
export function getMonthStem(yearStemIndex: number, monthBranchIndex: number): number {
  const baseStems = [2, 4, 6, 8, 0]
  const baseStem = baseStems[yearStemIndex % 5]
  const branchOffset = (monthBranchIndex - 2 + 12) % 12
  return (baseStem + branchOffset) % 10
}

// Get the year's first jeolgi (입춘) to determine if we're in the new year
export function getIpchun(year: number): Date | null {
  const data = getJeolgiData()
  const entry = data[year]
  if (!entry) return null
  return new Date(entry[2]) // 입춘 is at index 2
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
