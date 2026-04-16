import { calculateSaju } from './lib/saju-calculator'

/**
 * Test Case 1: 2002-03-03 오후 3시 30분, 서울, 여자
 * 정답: 9세 신축, 19세 경자, 29세 기해, 39세 무술, 49세 정유, ...99세 임진
 */
console.log('\n===== TEST CASE 1: 2002-03-03 오후 3시 30분, 서울, 여자 =====')
const result1 = calculateSaju({
  year: 2002,
  month: 3,
  date: 3,
  hour: 15,
  minute: 30,
  gender: 'female',
  timeZone: 'Asia/Seoul'
})

console.log('대운 (처음 5개):')
result1.daewoon?.slice(0, 5).forEach((d, idx) => {
  console.log(`${idx + 1}. ${d.startAge}세 ${d.stem}${d.branch} (${d.startAge}~${d.endAge}세)`)
})

const expected1 = [
  { age: 9, ganzi: '신축' },
  { age: 19, ganzi: '경자' },
  { age: 29, ganzi: '기해' },
  { age: 39, ganzi: '무술' },
  { age: 49, ganzi: '정유' }
]

console.log('\n검증:')
expected1.forEach(exp => {
  const found = result1.daewoon?.find(d => Math.abs(d.startAge - exp.age) < 1)
  const match = found ? `${found.stem}${found.branch}` : '없음'
  const status = match === exp.ganzi ? '✅' : '❌'
  console.log(`${status} ${exp.age}세: 예상=${exp.ganzi}, 실제=${match}`)
})

/**
 * Test Case 2: 2002-03-03 오후 3시 30분, 뉴욕 미국, 남자
 * 정답: 1세 계묘, 11세 갑진, 21세 을사, 31세 병오, ...91세 임자
 */
console.log('\n\n===== TEST CASE 2: 2002-03-03 오후 3시 30분, 뉴욕, 남자 =====')
const result2 = calculateSaju({
  year: 2002,
  month: 3,
  date: 3,
  hour: 15,
  minute: 30,
  gender: 'male',
  timeZone: 'America/New_York'
})

console.log('대운 (처음 5개):')
result2.daewoon?.slice(0, 5).forEach((d, idx) => {
  console.log(`${idx + 1}. ${d.startAge}세 ${d.stem}${d.branch} (${d.startAge}~${d.endAge}세)`)
})

const expected2 = [
  { age: 1, ganzi: '계묘' },
  { age: 11, ganzi: '갑진' },
  { age: 21, ganzi: '을사' },
  { age: 31, ganzi: '병오' },
  { age: 91, ganzi: '임자' }
]

console.log('\n검증:')
expected2.forEach(exp => {
  const found = result2.daewoon?.find(d => Math.abs(d.startAge - exp.age) < 1)
  const match = found ? `${found.stem}${found.branch}` : '없음'
  const status = match === exp.ganzi ? '✅' : '❌'
  console.log(`${status} ${exp.age}세: 예상=${exp.ganzi}, 실제=${match}`)
})

console.log('\n\n===== SUMMARY =====')
console.log('테스트 1 (여자): 모든 값이 ✅이면 통과')
console.log('테스트 2 (남자): 모든 값이 ✅이면 통과')
