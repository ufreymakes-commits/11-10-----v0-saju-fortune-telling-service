/**
 * 사주 계산 검증 스크립트
 * Node.js 환경에서 직접 사주 계산 로직을 테스트합니다.
 */

// 60갑자
const SIXTY_JIAZI = [
  "갑자", "을축", "병인", "정묘", "무진", "기사", "경오", "신미", "임신", "계유",
  "갑술", "을해", "병자", "정축", "무인", "기묘", "경진", "신사", "임오", "계미",
  "갑신", "을유", "병술", "정해", "무자", "기축", "경인", "신묘", "임진", "계사",
  "갑오", "을미", "병신", "정유", "무술", "기해", "경자", "신축", "임인", "계묘",
  "갑진", "을사", "병오", "정미", "무신", "기유", "경술", "신해", "임자", "계축",
  "갑인", "을묘", "병진", "정사", "무오", "기미", "경신", "신유", "임술", "계해"
];

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

// 일주 계산 (기준: 1996-05-22 = 기미, index 55)
function getDayPillarIndex(year, month, day) {
  const baseDate = new Date(Date.UTC(1996, 4, 22)); // 1996-05-22
  const baseIndex = 55; // 기미
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  return ((diffDays + baseIndex) % 60 + 60) % 60;
}

// 연주 계산 (입춘 기준 - 간단 버전: 2월 4일 기준)
function getYearPillarIndex(year, month, day) {
  let actualYear = year;
  // 입춘 전이면 전년도
  if (month < 2 || (month === 2 && day < 4)) {
    actualYear = year - 1;
  }
  // 1984 = 갑자년 (index 0)
  return ((actualYear - 1984) % 60 + 60) % 60;
}

// 월지 계산 (절기 기준 - 간단 버전)
function getMonthBranchIndex(month, day) {
  // 절기 기준 월지 (대략적)
  const transitions = [
    { month: 1, day: 6, branch: 1 },   // 축
    { month: 2, day: 4, branch: 2 },   // 인
    { month: 3, day: 6, branch: 3 },   // 묘
    { month: 4, day: 5, branch: 4 },   // 진
    { month: 5, day: 6, branch: 5 },   // 사
    { month: 6, day: 6, branch: 6 },   // 오
    { month: 7, day: 7, branch: 7 },   // 미
    { month: 8, day: 8, branch: 8 },   // 신
    { month: 9, day: 8, branch: 9 },   // 유
    { month: 10, day: 8, branch: 10 }, // 술
    { month: 11, day: 7, branch: 11 }, // 해
    { month: 12, day: 7, branch: 0 },  // 자
  ];
  
  for (let i = transitions.length - 1; i >= 0; i--) {
    const t = transitions[i];
    if (month > t.month || (month === t.month && day >= t.day)) {
      return t.branch;
    }
  }
  return 0;
}

// 월간 계산
function getMonthStemIndex(yearStemIndex, monthBranchIndex) {
  const baseStems = [2, 4, 6, 8, 0]; // 갑/기→병, 을/경→무, 병/신→경, 정/임→임, 무/계→갑
  const baseStemIndex = baseStems[yearStemIndex % 5];
  const branchOffset = (monthBranchIndex - 2 + 12) % 12;
  return (baseStemIndex + branchOffset) % 10;
}

// 시주 계산 (원본 공식: totalMin + 30 offset)
function getHourBranchIndex(hour, minute = 0) {
  const totalMin = hour * 60 + minute;
  return Math.floor(((totalMin + 30) % 1440) / 120);
}

function getHourStemIndex(dayStemIndex, hourBranchIndex) {
  const baseStems = [0, 2, 4, 6, 8]; // 갑/기→갑, 을/경→병, 병/신→무, 정/임→경, 무/계→임
  const baseStemIndex = baseStems[dayStemIndex % 5];
  return (baseStemIndex + hourBranchIndex) % 10;
}

// 테스트 케이스
const testCases = [
  { date: "1996-05-22", time: "14:30", country: "KR", expected: { year: "병자", month: "계사", day: "기미", hour: "임신" } },
  { date: "1997-04-23", time: "20:15", country: "US-LAX", expected: { year: "정축", month: "갑진", day: "을미", hour: "병술" } },
  { date: "1983-01-22", time: "07:30", country: "US-NYC", expected: { year: "임술", month: "계축", day: "경술", hour: "경진" } },
  { date: "1998-09-03", time: "11:45", country: "MX-CUU", expected: { year: "무인", month: "경신", day: "계축", hour: "무오" } },
  { date: "1997-01-09", time: "03:40", country: "PH", expected: { year: "병자", month: "신축", day: "신해", hour: "경인" } },
  { date: "2000-12-25", time: "07:00", country: "IN-CCU", expected: { year: "경진", month: "무자", day: "정사", hour: "계묘" } },
  { date: "1980-02-12", time: "10:10", country: "KR", expected: { year: "경신", month: "무인", day: "을묘", hour: "신사" } },
];

function runTests() {
  console.log("=== 사주 계산 검증 ===\n");
  
  let passed = 0;
  let failed = 0;
  
  for (const tc of testCases) {
    const [year, month, day] = tc.date.split("-").map(Number);
    const [hour, minute] = tc.time ? tc.time.split(":").map(Number) : [12, 0];
    
    const dayIndex = getDayPillarIndex(year, month, day);
    const dayPillar = SIXTY_JIAZI[dayIndex];
    
    const yearIndex = getYearPillarIndex(year, month, day);
    const yearPillar = SIXTY_JIAZI[yearIndex];
    
    const monthBranchIndex = getMonthBranchIndex(month, day);
    const yearStemIndex = STEMS.indexOf(yearPillar[0]);
    const monthStemIndex = getMonthStemIndex(yearStemIndex, monthBranchIndex);
    const monthPillar = STEMS[monthStemIndex] + BRANCHES[monthBranchIndex];
    
    const hourBranchIndex = getHourBranchIndex(hour, minute);
    const dayStemIndex = STEMS.indexOf(dayPillar[0]);
    const hourStemIndex = getHourStemIndex(dayStemIndex, hourBranchIndex);
    const hourPillar = STEMS[hourStemIndex] + BRANCHES[hourBranchIndex];
    
    const result = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };
    
    const yearMatch = result.year === tc.expected.year;
    const monthMatch = result.month === tc.expected.month;
    const dayMatch = result.day === tc.expected.day;
    const hourMatch = result.hour === tc.expected.hour;
    const allMatch = yearMatch && monthMatch && dayMatch && hourMatch;
    
    console.log(`${tc.date} ${tc.time} (${tc.country})`);
    console.log(`  기대: 연=${tc.expected.year} 월=${tc.expected.month} 일=${tc.expected.day} 시=${tc.expected.hour}`);
    console.log(`  결과: 연=${result.year}${yearMatch ? "✓" : "✗"} 월=${result.month}${monthMatch ? "✓" : "✗"} 일=${result.day}${dayMatch ? "✓" : "✗"} 시=${result.hour}${hourMatch ? "✓" : "✗"}`);
    console.log(`  ${allMatch ? "PASS" : "FAIL"}\n`);
    
    if (allMatch) passed++;
    else failed++;
  }
  
  console.log(`\n=== 결과: ${passed}/${passed + failed} 통과 ===`);
}

runTests();
