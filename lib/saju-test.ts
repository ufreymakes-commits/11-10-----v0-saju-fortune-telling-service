// Test cases for saju-calculator to verify it works for various birth dates
// Not hardcoded to 1996-05-22 case

import { calculateSaju } from './saju-calculator'
import type { BirthInfo } from './types'

export function runSajuTests() {
  console.log('[v0] ===== SAJU CALCULATOR TEST SUITE =====')

  const testCases: Array<{ name: string; birthInfo: BirthInfo }> = [
    {
      name: 'Test 1: 1996-05-22 오후 4시 30분 여성 (Original case)',
      birthInfo: {
        name: '테스트1',
        gender: 'female',
        birthDate: new Date(1996, 4, 22), // May 22, 1996
        birthTime: '4:30 PM',
        birthCountry: 'KR'
      }
    },
    {
      name: 'Test 2: 2000-01-01 자정 남성 (Different date)',
      birthInfo: {
        name: '테스트2',
        gender: 'male',
        birthDate: new Date(2000, 0, 1), // Jan 1, 2000
        birthTime: '12:00 AM',
        birthCountry: 'KR'
      }
    },
    {
      name: 'Test 3: 1985-12-25 오전 10시 여성 (Another case)',
      birthInfo: {
        name: '테스트3',
        gender: 'female',
        birthDate: new Date(1985, 11, 25), // Dec 25, 1985
        birthTime: '10:00 AM',
        birthCountry: 'KR'
      }
    },
    {
      name: 'Test 4: 2010-07-15 오후 2시 남성 (Recent)',
      birthInfo: {
        name: '테스트4',
        gender: 'male',
        birthDate: new Date(2010, 6, 15), // Jul 15, 2010
        birthTime: '2:00 PM',
        birthCountry: 'KR'
      }
    },
    {
      name: 'Test 5: 1970-03-10 오전 6시 여성 (Older)',
      birthInfo: {
        name: '테스트5',
        gender: 'female',
        birthDate: new Date(1970, 2, 10), // Mar 10, 1970
        birthTime: '6:00 AM',
        birthCountry: 'KR'
      }
    }
  ]

  testCases.forEach(({ name, birthInfo }) => {
    console.log(`\n[v0] ${name}`)
    try {
      const result = calculateSaju(birthInfo)
      
      console.log(`[v0] ✓ Calculation success`)
      console.log(`[v0]   - Day Master: ${result.dayMaster} (${result.dayMasterKorean})`)
      console.log(`[v0]   - 4 Pillars: ${result.yearPillar.fullNameKorean} ${result.monthPillar.fullNameKorean} ${result.dayPillar.fullNameKorean} ${result.hourPillar?.fullNameKorean || 'N/A'}`)
      console.log(`[v0]   - Element balance: ${result.elementBalanceKorean?.목}목 ${result.elementBalanceKorean?.화}화 ${result.elementBalanceKorean?.토}토 ${result.elementBalanceKorean?.금}금 ${result.elementBalanceKorean?.수}수`)
      console.log(`[v0]   - 12운성 개수: ${result.twelveStars?.length || 0}`)
      console.log(`[v0]   - 십신 보유: ${result.tenGods?.present?.join(', ') || 'none'}`)
      console.log(`[v0]   - 신강/신약: ${result.sinGangSinYak?.grade} (${result.sinGangSinYak?.ratio}%)`)
      console.log(`[v0]   - 격국: ${result.gyeokguk}`)
      console.log(`[v0]   - 신살: ${result.spirits?.join(', ') || 'none'}`)
      console.log(`[v0]   - 관계식(천간합): ${result.cheongganHap?.join(', ') || 'none'}`)
      console.log(`[v0]   - 관계식(지지육합): ${result.jijiYughap?.join(', ') || 'none'}`)
      console.log(`[v0]   - 용신: ${result.eokbuYongsin} / ${result.johuYongsin}`)
    } catch (error) {
      console.error(`[v0] ✗ Calculation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  console.log(`\n[v0] ===== TEST SUITE COMPLETE =====`)
}
