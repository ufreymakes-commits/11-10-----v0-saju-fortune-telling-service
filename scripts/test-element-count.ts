/**
 * 오행 개수 계산 로직 테스트
 * 
 * 테스트 케이스:
 * 1. 병자/계사/기미/임신 (사주)
 *    - 천간: 병, 계, 기, 임 = 화(병) 수(계) 토(기) 수(임)
 *    - 지지: 자(수) 사(화) 미(토) 신(금)
 *    - 지장간: 자(수-계), 사(화-병 화-정 토-무), 미(토-기 화-정 목-을), 신(금-경 수-임)
 * 
 * 2. 시간이 없는 경우 (자정 전 또는 미기재)
 * 3. 오행이 편중된 경우
 * 4. 모든 오행이 균형잡힌 경우
 */

import { countElementsBasic, countElementsWithHiddenStems } from '../lib/saju/core-calculator'

// 테스트 케이스 1: 병자/계사/기미/임신
const testCase1 = {
  year: { stem: '병' as any, branch: '자' as any },
  month: { stem: '계' as any, branch: '사' as any },
  day: { stem: '기' as any, branch: '미' as any },
  hour: { stem: '임' as any, branch: '신' as any }
}

console.log('=== 테스트 케이스 1: 병자/계사/기미/임신 ===')
console.log('천간/지지만 개수:', countElementsBasic(testCase1))
console.log('지장간 포함 개수:', countElementsWithHiddenStems(testCase1))

// 기대값:
// 천간/지지만: 목0 화2 토1 금1 수3
// 지장간포함: 목1 화5 토2 금2 수4

console.log('\n기대값 검증:')
const basic1 = countElementsBasic(testCase1)
const hidden1 = countElementsWithHiddenStems(testCase1)

const basicExpected = { 목: 0, 화: 2, 토: 1, 금: 1, 수: 3 }
const hiddenExpected = { 목: 1, 화: 5, 토: 2, 금: 2, 수: 4 }

console.log('기본 개수 일치:', 
  basic1.목 === basicExpected.목 && 
  basic1.화 === basicExpected.화 && 
  basic1.토 === basicExpected.토 && 
  basic1.금 === basicExpected.금 && 
  basic1.수 === basicExpected.수 ? '✅ 통과' : '❌ 실패')

console.log('지장간 포함 일치:',
  hidden1.목 === hiddenExpected.목 && 
  hidden1.화 === hiddenExpected.화 && 
  hidden1.토 === hiddenExpected.토 && 
  hidden1.금 === hiddenExpected.금 && 
  hidden1.수 === hiddenExpected.수 ? '✅ 통과' : '❌ 실패')

// 테스트 케이스 2: 시간 없는 경우
const testCase2 = {
  year: { stem: '병' as any, branch: '자' as any },
  month: { stem: '계' as any, branch: '사' as any },
  day: { stem: '기' as any, branch: '미' as any },
  hour: null
}

console.log('\n=== 테스트 케이스 2: 시간 없음 ===')
console.log('천간/지지만 개수:', countElementsBasic(testCase2 as any))
console.log('지장간 포함 개수:', countElementsWithHiddenStems(testCase2 as any))

const basic2 = countElementsBasic(testCase2 as any)
const hidden2 = countElementsWithHiddenStems(testCase2 as any)

// 기대값: 임신 없으므로 -1씩
const basicExpected2 = { 목: 0, 화: 2, 토: 1, 금: 1, 수: 2 }
const hiddenExpected2 = { 목: 1, 화: 4, 토: 2, 금: 1, 수: 3 }

console.log('기본 개수 일치:',
  basic2.목 === basicExpected2.목 && 
  basic2.화 === basicExpected2.화 && 
  basic2.토 === basicExpected2.토 && 
  basic2.금 === basicExpected2.금 && 
  basic2.수 === basicExpected2.수 ? '✅ 통과' : '❌ 실패')

console.log('지장간 포함 일치:',
  hidden2.목 === hiddenExpected2.목 && 
  hidden2.화 === hiddenExpected2.화 && 
  hidden2.토 === hiddenExpected2.토 && 
  hidden2.금 === hiddenExpected2.금 && 
  hidden2.수 === hiddenExpected2.수 ? '✅ 통과' : '❌ 실패')

// 테스트 케이스 3: 동일 오행 편중
const testCase3 = {
  year: { stem: '갑' as any, branch: '인' as any },  // 목목
  month: { stem: '을' as any, branch: '묘' as any },  // 목목
  day: { stem: '경' as any, branch: '신' as any },   // 금금
  hour: { stem: '신' as any, branch: '유' as any }   // 금금
}

console.log('\n=== 테스트 케이스 3: 목/금 편중 ===')
console.log('천간/지지만 개수:', countElementsBasic(testCase3))
console.log('지장간 포함 개수:', countElementsWithHiddenStems(testCase3))

const basic3 = countElementsBasic(testCase3)
const hidden3 = countElementsWithHiddenStems(testCase3)

// 기대값: 목4 금4
const basicExpected3 = { 목: 4, 화: 0, 토: 0, 금: 4, 수: 0 }

console.log('기본 개수 일치:',
  basic3.목 === basicExpected3.목 && 
  basic3.화 === basicExpected3.화 && 
  basic3.토 === basicExpected3.토 && 
  basic3.금 === basicExpected3.금 && 
  basic3.수 === basicExpected3.수 ? '✅ 통과' : '❌ 실패')

console.log('지장간 포함 개수 합계:', 
  hidden3.목 + hidden3.화 + hidden3.토 + hidden3.금 + hidden3.수, 
  '(예상 12: 천간/지지 8 + 지장간 4)')

console.log('\n✅ 모든 테스트 완료!')
