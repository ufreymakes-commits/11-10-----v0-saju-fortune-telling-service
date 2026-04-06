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

// 타임존 오프셋 (시간 단위)
const TIMEZONE_OFFSETS: Record<string, number> = {
  "KR": 9,
  "JP": 9,
  "CN": 8,
  "US-NYC": -5,
  "US-CHI": -6,
  "US-DEN": -7,
  "US-LAX": -8,
  "US-ANC": -9,
  "PH": 8,
  "HU": 1,
  "FI": 2,
  "IN-BOM": 5.5,
  "IN-DEL": 5.5,
  "IN-CCU": 5.5,
  "BR-SAO": -3,
  "BR-SSA": -3,
  "BR-POA": -3,
  "BR-BSB": -3,
  "ZA-JNB": 2,
  "PL": 1,
  "KE": 3,
  "BA": 1,
  "TR": 3,
  "NP": 5.75,
  "BD": 6,
  "NL-AMS": 1,
  "FR-PAR": 1,
  "IT": 1,
  "GB-LON": 0,
  "AT": 1,
  "MX-CUU": -7,
  "ID-JKT": 7,
  "VN": 7
};

// 일주 계산 (기준: 1996-05-22 = 기미, index 55)
function getDayPillarIndex(year: number, month: number, day: number): number {
  const baseDate = new Date(Date.UTC(1996, 4, 22)); // 1996-05-22
  const baseIndex = 55; // 기미
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  return ((diffDays + baseIndex) % 60 + 60) % 60;
}

// 연주 계산 (입춘 기준 - 간단 버전: 2월 4일 기준)
function getYearPillarIndex(year: number, month: number, day: number): number {
  let actualYear = year;
  // 입춘 전이면 전년도
  if (month < 2 || (month === 2 && day < 4)) {
    actualYear = year - 1;
  }
  // 1984 = 갑자년 (index 0)
  return ((actualYear - 1984) % 60 + 60) % 60;
}

// 월지 계산 (절기 기준 - 간단 버전)
function getMonthBranchIndex(month: number, day: number): number {
  // 절기 기준 월지 (대략적)
  // 인(2)월 시작: 2/4, 묘(3): 3/6, 진(4): 4/5, 사(5): 5/6, 
  // 오(6): 6/6, 미(7): 7/7, 신(8): 8/8, 유(9): 9/8,
  // 술(10): 10/8, 해(11): 11/7, 자(12): 12/7, 축(1): 1/6
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
  
  // 현재 월의 절기를 지났는지 확인
  for (let i = transitions.length - 1; i >= 0; i--) {
    const t = transitions[i];
    if (month > t.month || (month === t.month && day >= t.day)) {
      return t.branch;
    }
  }
  // 1월 6일 전이면 전년 12월 자월
  return 0; // 자
}

// 월간 계산
function getMonthStemIndex(yearStemIndex: number, monthBranchIndex: number): number {
  // 년간 기준 인월 천간
  const baseStems = [2, 4, 6, 8, 0]; // 갑/기→병, 을/경→무, 병/신→경, 정/임→임, 무/계→갑
  const baseStemIndex = baseStems[yearStemIndex % 5];
  
  // 인월(2)부터 시작, 월지 인덱스에 따라 천간 결정
  // 월지: 자(0), 축(1), 인(2), 묘(3), 진(4), 사(5), 오(6), 미(7), 신(8), 유(9), 술(10), 해(11)
  // 인월이 기준이므로 offset 계산
  const branchOffset = (monthBranchIndex - 2 + 12) % 12;
  return (baseStemIndex + branchOffset) % 10;
}

// 시주 계산
function getHourBranchIndex(hour: number): number {
  // 23-01: 자(0), 01-03: 축(1), 03-05: 인(2), ...
  if (hour >= 23 || hour < 1) return 0;
  if (hour < 3) return 1;
  if (hour < 5) return 2;
  if (hour < 7) return 3;
  if (hour < 9) return 4;
  if (hour < 11) return 5;
  if (hour < 13) return 6;
  if (hour < 15) return 7;
  if (hour < 17) return 8;
  if (hour < 19) return 9;
  if (hour < 21) return 10;
  return 11;
}

function getHourStemIndex(dayStemIndex: number, hourBranchIndex: number): number {
  // 일간 기준 자시 천간
  const baseStems = [0, 2, 4, 6, 8]; // 갑/기→갑, 을/경→병, 병/신→무, 정/임→경, 무/계→임
  const baseStemIndex = baseStems[dayStemIndex % 5];
  return (baseStemIndex + hourBranchIndex) % 10;
}

// 테스트 케이스
interface TestCase {
  date: string;
  time: string;
  country: string;
  expected: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
}

const testCases: TestCase[] = [
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
    
    // 일주 계산
    const dayIndex = getDayPillarIndex(year, month, day);
    const dayPillar = SIXTY_JIAZI[dayIndex];
    
    // 연주 계산
    const yearIndex = getYearPillarIndex(year, month, day);
    const yearPillar = SIXTY_JIAZI[yearIndex];
    
    // 월지 계산
    const monthBranchIndex = getMonthBranchIndex(month, day);
    const yearStemIndex = STEMS.indexOf(yearPillar[0]);
    const monthStemIndex = getMonthStemIndex(yearStemIndex, monthBranchIndex);
    const monthPillar = STEMS[monthStemIndex] + BRANCHES[monthBranchIndex];
    
    // 시주 계산
    const hourBranchIndex = getHourBranchIndex(hour);
    const dayStemIndex = STEMS.indexOf(dayPillar[0]);
    const hourStemIndex = getHourStemIndex(dayStemIndex, hourBranchIndex);
    const hourPillar = STEMS[hourStemIndex] + BRANCHES[hourBranchIndex];
    
    const result = {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
    };
    
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
