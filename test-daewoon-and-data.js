// 테스트: 3가지 케이스로 대운 계산 및 고객 데이터 검증

// ===== TEST CASE 1 =====
console.log("\n========== TEST CASE 1 ==========");
console.log("1996-05-22 15:30 South Korea Female");
console.log("예상 대운:");
console.log("0.4세 ~ 10.4세 → 임진 (壬辰)");
console.log("10.4세 ~ 20.4세 → 신묘 (辛卯)");
console.log("20.4세 ~ 30.4세 → 경인 (庚寅)");
console.log("30.4세 ~ 40.4세 → 기축 (己丑)");
console.log("40.4세 ~ 50.4세 → 무자 (戊子)");
console.log("50.4세 ~ 60.4세 → 정해 (丁亥)");
console.log("60.4세 ~ 70.4세 → 병술 (丙戌)");
console.log("70.4세 ~ 80.4세 → 을유 (乙酉)");

// 사주 계산:
// 1996년 05월 22일 15:30 KST
// 연주: 丙(병) 子(자) → 병인
// 월주: 癸(계) 巳(사) → 계사
// 일주: 己(기) 未(미) → 기미
// 시주: 壬(임) 申(신) → 임신
// 
// 대운 계산:
// 연간: 병 (양간) + 여성 → 역순 (음간 방향)
// 월주: 계사
// 절기: 1996년 5월 22일 15:30 ~ 하지(1996년 5월 20일 23:30)
// 이전 절기: 입춘(1996년 2월 4일 20:59) 또는 청명(1996년 3월 4일 19:40)
// 다음 절기: 하지(1996년 5월 20일 23:30)

const date1 = new Date("1996-05-22T15:30:00+09:00");
console.log("Birth Date (KST):", date1);

// 대운 시작 나이: (하지 ~ 출생시간) = 약 56시간 / 72 = 0.78 ≈ 0.8세
// 아니면 입춘 이후: (출생시간 ~ 다음절기)

// 계산 로직 분석:
// 1. isForward = (gender === 'female' && !isYangYear) → true (여성 + 음간 이므로 정순)
// 2. 절기 찾기: 이전=청명(3/4), 다음=하지(5/20)
// 3. 시간차: 5/22 15:30 - 5/20 23:30 = 약 40시간
// 4. 시작나이: 40 / 72 = 0.56 ≈ 0.6세 (반올림 후 0.6)
// 5. 월주 60간지: 계사 = (2, 6) → (2*12 + 6*5) % 60 = (24 + 30) % 60 = 54
// 6. 대운 계산 (역순 -1):
//    i=0: idx = (54 - 1 + 600) % 60 = 653 % 60 = 53 → stem[3]=정, branch[5]=사 → 정사 (정순)

console.log("\n현재 계산 로직 예상:");
console.log("0.6세 ~ 10.6세 → 정사 (丁巳)");
console.log("\n❌ MISMATCH! 예상값: 임진 (壬辰)");

// ===== TEST CASE 2 =====
console.log("\n========== TEST CASE 2 ==========");
console.log("2000-04-07 15:06 United States - Los Angeles Female");
console.log("예상 대운:");
console.log("1.0세 ~ 11.0세 → 기묘 (己卯)");
console.log("11.0세 ~ 21.0세 → 무인 (戊寅)");
console.log("21.0세 ~ 31.0세 → 정축 (丁丑)");

const date2 = new Date("2000-04-07T15:06:00-07:00"); // LA time = UTC-7
console.log("Birth Date (LA):", date2);
console.log("Birth Date (UTC):", new Date(date2.toLocaleString('en-US', { timeZone: 'UTC' })));

// ===== TEST CASE 3 =====
console.log("\n========== TEST CASE 3 ==========");
console.log("1995-05-27 21:35 Philippines Female");
console.log("예상 대운:");
console.log("1.9세 ~ 11.9세 → 경진 (庚辰)");
console.log("11.9세 ~ 21.9세 → 기묘 (己卯)");
console.log("21.9세 ~ 31.9세 → 무인 (戊寅)");

const date3 = new Date("1995-05-27T21:35:00+08:00"); // Philippines = UTC+8
console.log("Birth Date (Philippines):", date3);

console.log("\n\n========== 문제점 분석 ==========");
console.log("1. 월주 60간지 계산 오류:");
console.log("   현재: (monthStemIdx * 12 + monthBranchIdx * 5) % 60");
console.log("   올바름: 60간지 순서에 따라 직접 계산");
console.log("");
console.log("2. 절기 처리:");
console.log("   입춘 기준이 아니라 일반 절기로 처리");
console.log("   여성의 경우: 이전 절기 기준인지 다음 절기 기준인지 불명확");
console.log("");
console.log("3. Gender 인코딩:");
console.log("   현재: 'male' / 'female' (English)");
console.log("   예상: '남' / '여' (Korean) 또는 제대로 변환되는지 확인 필요");
console.log("");
console.log("4. UTC vs 지역시간:");
console.log("   Date 객체가 UTC 기준인지 확인 필요");
console.log("   지역 시간대별 절기 계산에 영향");
