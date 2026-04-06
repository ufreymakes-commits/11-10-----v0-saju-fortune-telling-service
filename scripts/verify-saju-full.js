// 72개 전체 테스트 케이스
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const SIXTY_JIAZI = [
  "갑자", "을축", "병인", "정묘", "무진", "기사", "경오", "신미", "임신", "계유",
  "갑술", "을해", "병자", "정축", "무인", "기묘", "경진", "신사", "임오", "계미",
  "갑신", "을유", "병술", "정해", "무자", "기축", "경인", "신묘", "임진", "계사",
  "갑오", "을미", "병신", "정유", "무술", "기해", "경자", "신축", "임인", "계묘",
  "갑진", "을사", "병오", "정미", "무신", "기유", "경술", "신해", "임자", "계축",
  "갑인", "을묘", "병진", "정사", "무오", "기미", "경신", "신유", "임술", "계해"
];

const HOUR_STEM_TABLE = {
  "갑": ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"],
  "을": ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  "병": ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  "정": ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  "무": ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"],
  "기": ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"],
  "경": ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  "신": ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  "임": ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  "계": ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
};

// 72개 테스트 케이스 (사용자 제공)
const testCases = [
  { date: '1996-05-22', time: '14:30', country: 'KR', expected: { year: '병자', month: '계사', day: '기미', hour: '임신' } },
  { date: '1997-04-23', time: '20:15', country: 'US-LAX', expected: { year: '정축', month: '갑진', day: '을미', hour: '병술' } },
  { date: '1994-06-01', time: '00:24', country: 'US-LAX', expected: { year: '갑술', month: '기사', day: '무오', hour: '임자' } },
  { date: '1983-01-22', time: '07:30', country: 'US-NYC', expected: { year: '임술', month: '계축', day: '경술', hour: '경진' } },
  { date: '1992-08-19', time: '10:30', country: 'VN', expected: { year: '임신', month: '무신', day: '정묘', hour: '을사' } },
  { date: '2000-12-25', time: '07:00', country: 'IN-CCU', expected: { year: '경진', month: '무자', day: '정사', hour: '계묘' } },
  { date: '1980-02-12', time: '10:10', country: 'KR', expected: { year: '경신', month: '무인', day: '을묘', hour: '신사' } },
  { date: '2026-04-02', time: '', country: 'ID-JKT', expected: { year: '병오', month: '신묘', day: '병오', hour: '' } },
  { date: '1998-09-03', time: '11:45', country: 'MX-CUU', expected: { year: '무인', month: '경신', day: '계축', hour: '무오' } },
  { date: '1997-01-09', time: '03:40', country: 'PH', expected: { year: '병자', month: '신축', day: '신해', hour: '경인' } },
  { date: '1955-03-15', time: '06:00', country: 'US-NYC', expected: { year: '을미', month: '기묘', day: '정축', hour: '계묘' } },
  { date: '1962-08-22', time: '14:30', country: 'JP', expected: { year: '임인', month: '무신', day: '계묘', hour: '경신' } },
  { date: '1978-11-30', time: '23:45', country: 'GB', expected: { year: '무오', month: '계해', day: '기사', hour: '병자' } },
  { date: '1985-06-10', time: '09:15', country: 'AU-SYD', expected: { year: '을축', month: '임오', day: '기해', hour: '기사' } },
  { date: '1990-01-01', time: '00:00', country: 'KR', expected: { year: '기사', month: '병자', day: '무자', hour: '임자' } },
  { date: '2001-07-04', time: '16:20', country: 'US-CHI', expected: { year: '신사', month: '갑오', day: '갑진', hour: '임신' } },
  { date: '1973-12-25', time: '12:00', country: 'DE', expected: { year: '계축', month: '갑자', day: '병인', hour: '갑오' } },
  { date: '1968-02-29', time: '05:30', country: 'CA-TOR', expected: { year: '무신', month: '갑인', day: '무신', hour: '을묘' } },
  { date: '2010-10-10', time: '10:10', country: 'CN', expected: { year: '경인', month: '병술', day: '기유', hour: '기사' } },
  { date: '1999-09-09', time: '09:09', country: 'FR', expected: { year: '기묘', month: '계유', day: '을미', hour: '경진' } },
  { date: '1945-08-15', time: '12:00', country: 'KR', expected: { year: '을유', month: '갑신', day: '계해', hour: '무오' } },
  { date: '2000-01-01', time: '00:01', country: 'NZ', expected: { year: '기묘', month: '병자', day: '기해', hour: '갑자' } },
  { date: '1987-05-05', time: '17:30', country: 'TH', expected: { year: '정묘', month: '을사', day: '신축', hour: '정유' } },
  { date: '1956-07-17', time: '21:00', country: 'EG', expected: { year: '병신', month: '을미', day: '갑술', hour: '을해' } },
  { date: '2015-03-21', time: '06:45', country: 'BR-SAO', expected: { year: '을미', month: '기묘', day: '병진', hour: '신묘' } },
  { date: '1971-09-08', time: '15:15', country: 'IT', expected: { year: '신해', month: '정유', day: '병자', hour: '병신' } },
  { date: '2020-02-02', time: '02:02', country: 'RU-MOW', expected: { year: '기해', month: '정축', day: '신사', hour: '기축' } },
  { date: '1964-04-04', time: '04:04', country: 'MX-MEX', expected: { year: '갑진', month: '무진', day: '병자', hour: '경인' } },
  { date: '1982-06-21', time: '18:30', country: 'AR', expected: { year: '임술', month: '병오', day: '무인', hour: '신유' } },
  { date: '2005-11-11', time: '11:11', country: 'ZA', expected: { year: '을유', month: '정해', day: '계사', hour: '무오' } },
  { date: '1959-10-03', time: '08:20', country: 'IN-DEL', expected: { year: '기해', month: '계유', day: '병오', hour: '임진' } },
  { date: '1993-02-14', time: '14:14', country: 'US-DEN', expected: { year: '계유', month: '갑인', day: '정사', hour: '정미' } },
  { date: '1976-08-08', time: '08:08', country: 'HK', expected: { year: '병진', month: '병신', day: '갑인', hour: '무진' } },
  { date: '2018-12-31', time: '23:59', country: 'SG', expected: { year: '무술', month: '갑자', day: '기유', hour: '병자' } },
  { date: '1951-01-25', time: '07:00', country: 'PK', expected: { year: '경인', month: '기축', day: '을해', hour: '경진' } },
  { date: '1969-07-20', time: '20:17', country: 'US-NYC', expected: { year: '기유', month: '신미', day: '기사', hour: '갑술' } },
  { date: '2008-08-08', time: '08:08', country: 'CN', expected: { year: '무자', month: '경신', day: '무진', hour: '병진' } },
  { date: '1984-03-03', time: '03:03', country: 'ES', expected: { year: '갑자', month: '정묘', day: '신축', hour: '경인' } },
  { date: '1995-05-15', time: '15:15', country: 'MY', expected: { year: '을해', month: '신사', day: '경술', hour: '갑신' } },
  { date: '1961-12-12', time: '12:12', country: 'SE', expected: { year: '신축', month: '경자', day: '을미', hour: '임오' } },
  { date: '2012-12-21', time: '11:11', country: 'GT', expected: { year: '임진', month: '임자', day: '갑오', hour: '경오' } },
  { date: '1977-07-07', time: '07:07', country: 'NG', expected: { year: '정사', month: '정미', day: '신해', hour: '임진' } },
  { date: '1989-11-09', time: '18:53', country: 'DE', expected: { year: '기사', month: '을해', day: '기유', hour: '계유' } },
  { date: '2003-04-09', time: '09:30', country: 'IQ', expected: { year: '계미', month: '병진', day: '경오', hour: '신사' } },
  { date: '1966-06-06', time: '06:06', country: 'KE', expected: { year: '병오', month: '갑오', day: '임인', hour: '계묘' } },
  { date: '1958-01-31', time: '16:45', country: 'US-LAX', expected: { year: '정유', month: '계축', day: '계묘', hour: '경신' } },
  { date: '2022-02-22', time: '22:22', country: 'UA', expected: { year: '임인', month: '임인', day: '신해', hour: '기해' } },
  { date: '1974-10-15', time: '10:30', country: 'BD', expected: { year: '갑인', month: '갑술', day: '정유', hour: '을사' } },
  { date: '1991-08-19', time: '19:00', country: 'RU-MOW', expected: { year: '신미', month: '병신', day: '계미', hour: '임술' } },
  { date: '2007-07-07', time: '07:07', country: 'UK', expected: { year: '정해', month: '정미', day: '신유', hour: '임진' } },
  { date: '1953-06-02', time: '02:30', country: 'GB', expected: { year: '계사', month: '정사', day: '을축', hour: '정축' } },
  { date: '1986-04-26', time: '01:23', country: 'UA', expected: { year: '병인', month: '임진', day: '갑자', hour: '을축' } },
  { date: '2016-06-23', time: '07:00', country: 'GB', expected: { year: '병신', month: '갑오', day: '기유', hour: '무진' } },
  { date: '1970-04-22', time: '12:00', country: 'US-NYC', expected: { year: '경술', month: '경진', day: '갑진', hour: '경오' } },
  { date: '2011-03-11', time: '14:46', country: 'JP', expected: { year: '신묘', month: '신묘', day: '계유', hour: '경신' } },
  { date: '1979-02-01', time: '03:30', country: 'IR', expected: { year: '무오', month: '을축', day: '정미', hour: '임인' } },
  { date: '1996-07-05', time: '17:00', country: 'US-ANC', expected: { year: '병자', month: '갑오', day: '경진', hour: '을유' } },
  { date: '2019-05-01', time: '00:00', country: 'JP', expected: { year: '기해', month: '무진', day: '기축', hour: '갑자' } },
  { date: '1963-11-22', time: '12:30', country: 'US-CHI', expected: { year: '계묘', month: '계해', day: '임자', hour: '병오' } },
  { date: '1988-09-17', time: '10:00', country: 'KR', expected: { year: '무진', month: '신유', day: '계해', hour: '정사' } },
  { date: '2004-12-26', time: '07:58', country: 'ID-JKT', expected: { year: '갑신', month: '병자', day: '병오', hour: '임진' } },
  { date: '1957-10-04', time: '19:28', country: 'KZ', expected: { year: '정유', month: '기유', day: '경진', hour: '병술' } },
  { date: '1981-07-29', time: '11:00', country: 'GB', expected: { year: '신유', month: '을미', day: '병진', hour: '갑오' } },
  { date: '2009-01-20', time: '12:05', country: 'US-NYC', expected: { year: '무자', month: '을축', day: '정축', hour: '병오' } },
  { date: '1972-02-21', time: '08:15', country: 'US-NYC', expected: { year: '임자', month: '임인', day: '계해', hour: '병진' } },
  { date: '1994-04-06', time: '20:27', country: 'RW', expected: { year: '갑술', month: '무진', day: '갑인', hour: '갑술' } },
  { date: '2017-08-21', time: '11:49', country: 'US-LAX', expected: { year: '정유', month: '무신', day: '임자', hour: '병오' } },
  { date: '1960-05-22', time: '15:11', country: 'CL', expected: { year: '경자', month: '신사', day: '기미', hour: '임신' } },
  { date: '1992-04-29', time: '17:00', country: 'US-LAX', expected: { year: '임신', month: '갑진', day: '신해', hour: '정유' } },
  { date: '2006-02-10', time: '09:30', country: 'SA', expected: { year: '병술', month: '경인', day: '신유', hour: '계사' } },
  { date: '1983-09-01', time: '06:26', country: 'RU-MOW', expected: { year: '계해', month: '경신', day: '무자', hour: '을묘' } },
  { date: '2021-01-06', time: '14:00', country: 'US-NYC', expected: { year: '경자', month: '무자', day: '무자', hour: '기미' } },
];

function getYearPillar(year, month, day) {
  // 입춘 기준: 대략 2월 4일 전후
  // 간단히 2월 4일 이전이면 전년도로 계산
  let actualYear = year;
  if (month < 2 || (month === 2 && day < 4)) {
    actualYear = year - 1;
  }
  const index = ((actualYear - 1984) % 60 + 60) % 60;
  return SIXTY_JIAZI[index];
}

function getMonthBranch(month, day) {
  // 절기 기준 월지 (간략화)
  // 입춘(2/4)~경칩(3/6): 인월, 경칩~청명(4/5): 묘월, ...
  const boundaries = [
    { m: 2, d: 4, branch: 2 },   // 인
    { m: 3, d: 6, branch: 3 },   // 묘
    { m: 4, d: 5, branch: 4 },   // 진
    { m: 5, d: 6, branch: 5 },   // 사
    { m: 6, d: 6, branch: 6 },   // 오
    { m: 7, d: 7, branch: 7 },   // 미
    { m: 8, d: 8, branch: 8 },   // 신
    { m: 9, d: 8, branch: 9 },   // 유
    { m: 10, d: 8, branch: 10 }, // 술
    { m: 11, d: 7, branch: 11 }, // 해
    { m: 12, d: 7, branch: 0 },  // 자
    { m: 1, d: 6, branch: 1 },   // 축
  ];
  
  for (let i = boundaries.length - 1; i >= 0; i--) {
    const b = boundaries[i];
    if (month > b.m || (month === b.m && day >= b.d)) {
      return b.branch;
    }
  }
  return 1; // 축월 (default)
}

function getMonthStem(yearStemIndex, monthBranchIndex) {
  const baseStems = [2, 4, 6, 8, 0]; // 갑/기->병, 을/경->무, 병/신->경, 정/임->임, 무/계->갑
  const base = baseStems[yearStemIndex % 5];
  const branchOffset = (monthBranchIndex - 2 + 12) % 12;
  return (base + branchOffset) % 10;
}

function getDayPillar(year, month, day) {
  // 기준일: 1996-05-22 = 기미(55)
  const baseDate = new Date(Date.UTC(1996, 4, 22));
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  const index = ((diffDays + 55) % 60 + 60) % 60;
  return SIXTY_JIAZI[index];
}

function getHourBranchIndex(hour, minute = 0) {
  const totalMin = hour * 60 + minute;
  return Math.floor(((totalMin + 30) % 1440) / 120);
}

function getHourPillar(dayStem, hour, minute = 0) {
  const branchIndex = getHourBranchIndex(hour, minute);
  const hourStem = HOUR_STEM_TABLE[dayStem][branchIndex];
  return hourStem + BRANCHES[branchIndex];
}

// 테스트 실행
let passed = 0;
let failed = 0;
const failures = [];

for (const tc of testCases) {
  const [year, month, day] = tc.date.split('-').map(Number);
  let hour = null, minute = 0;
  if (tc.time) {
    const parts = tc.time.split(':').map(Number);
    hour = parts[0];
    minute = parts[1] || 0;
  }
  
  const yearPillar = getYearPillar(year, month, day);
  const monthBranchIndex = getMonthBranch(month, day);
  const yearStemIndex = STEMS.indexOf(yearPillar[0]);
  const monthStemIndex = getMonthStem(yearStemIndex, monthBranchIndex);
  const monthPillar = STEMS[monthStemIndex] + BRANCHES[monthBranchIndex];
  const dayPillar = getDayPillar(year, month, day);
  const dayStem = dayPillar[0];
  const hourPillar = hour !== null ? getHourPillar(dayStem, hour, minute) : '';
  
  const yearOk = yearPillar === tc.expected.year;
  const monthOk = monthPillar === tc.expected.month;
  const dayOk = dayPillar === tc.expected.day;
  const hourOk = tc.expected.hour === '' ? hourPillar === '' : hourPillar === tc.expected.hour;
  
  if (yearOk && monthOk && dayOk && hourOk) {
    passed++;
  } else {
    failed++;
    failures.push({
      date: tc.date,
      time: tc.time,
      country: tc.country,
      expected: tc.expected,
      result: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
      errors: {
        year: !yearOk,
        month: !monthOk,
        day: !dayOk,
        hour: !hourOk
      }
    });
  }
}

console.log(`\n=== 전체 테스트 결과: ${passed}/${testCases.length} 통과 ===\n`);

if (failures.length > 0) {
  console.log('실패한 케이스:');
  for (const f of failures) {
    console.log(`\n${f.date} ${f.time} (${f.country})`);
    console.log(`  기대: 연=${f.expected.year} 월=${f.expected.month} 일=${f.expected.day} 시=${f.expected.hour}`);
    console.log(`  결과: 연=${f.result.year}${f.errors.year ? '✗' : '✓'} 월=${f.result.month}${f.errors.month ? '✗' : '✓'} 일=${f.result.day}${f.errors.day ? '✗' : '✓'} 시=${f.result.hour}${f.errors.hour ? '✗' : '✓'}`);
  }
}
