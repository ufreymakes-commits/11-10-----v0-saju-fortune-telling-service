const fs = require('fs');
const path = require('path');

// ========== 상수 ==========
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

// 절(節) 인덱스 -> 월지 인덱스
// 소한(0)->축, 입춘(2)->인, 경칩(4)->묘, 청명(6)->진, 입하(8)->사, 망종(10)->오
// 소서(12)->미, 입추(14)->신, 백로(16)->유, 한로(18)->술, 입동(20)->해, 대설(22)->자
const JEOL_TO_BRANCH = { 0:1, 2:2, 4:3, 6:4, 8:5, 10:6, 12:7, 14:8, 16:9, 18:10, 20:11, 22:0 };
const JEOL_INDICES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

// ========== 절기 데이터 로드 ==========
let jeolgiData = null;

function parseDateTime(str) {
  if (!str || str.trim() === '') return null;
  const parts = str.trim().split(' ');
  if (parts.length !== 2) return null;
  const [y, m, d] = parts[0].split('-').map(Number);
  const [h, min, s] = parts[1].split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, min, s || 0));
}

function loadJeolgiData() {
  if (jeolgiData) return jeolgiData;
  try {
    const filePath = path.join(__dirname, 'jeolgi-table.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    jeolgiData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split('\t');
      if (cols.length < 25) continue;
      
      const year = parseInt(cols[0], 10);
      if (isNaN(year)) continue;
      
      const terms = [];
      for (let j = 1; j <= 24; j++) {
        terms.push(parseDateTime(cols[j]));
      }
      if (terms.filter(t => t !== null).length === 24) {
        jeolgiData.push({ year, terms });
      }
    }
    console.log(`절기 데이터: ${jeolgiData.length}년 로드됨 (${jeolgiData[0]?.year}-${jeolgiData[jeolgiData.length-1]?.year})`);
    return jeolgiData;
  } catch (e) {
    console.error('절기 데이터 로드 실패:', e.message);
    return [];
  }
}

// ========== 핵심 계산 함수 ==========

// 현재 절기 찾기 (UTC 기준)
function findCurrentSolarTerm(utcDate) {
  const data = loadJeolgiData();
  const year = utcDate.getUTCFullYear();
  
  const currYear = data.find(e => e.year === year);
  const prevYear = data.find(e => e.year === year - 1);
  
  if (!currYear) return null;
  
  // 현재 연도 첫 절기 이전이면 전년도 마지막 절기 사용
  if (utcDate < currYear.terms[0]) {
    if (prevYear) return { year: year - 1, termIndex: 23 };
    return null;
  }
  
  // 현재 연도에서 해당 절기 찾기
  for (let i = 23; i >= 0; i--) {
    if (currYear.terms[i] && utcDate >= currYear.terms[i]) {
      return { year, termIndex: i };
    }
  }
  return null;
}

// 사주 연도 (입춘 기준)
function getSajuYear(utcDate) {
  const data = loadJeolgiData();
  const year = utcDate.getUTCFullYear();
  const currYear = data.find(e => e.year === year);
  
  if (!currYear || !currYear.terms[2]) return year;
  
  const ipchun = currYear.terms[2]; // 입춘
  return utcDate < ipchun ? year - 1 : year;
}

// 월지 계산 (절기 기준)
function getMonthBranchIndex(utcDate) {
  const result = findCurrentSolarTerm(utcDate);
  if (!result) return (utcDate.getUTCMonth() + 2) % 12;
  
  let termIndex = result.termIndex;
  // 절(節)이 아니면 이전 절로
  if (!JEOL_INDICES.includes(termIndex)) {
    termIndex = termIndex - 1;
    if (termIndex < 0) termIndex = 22;
  }
  return JEOL_TO_BRANCH[termIndex];
}

// 월간 계산
function getMonthStemIndex(yearStemIndex, monthBranchIndex) {
  // 갑/기년 인월(1월)은 병인, 을/경년은 무인, 병/신년은 경인, 정/임년은 임인, 무/계년은 갑인
  const baseStems = [2, 4, 6, 8, 0];
  const base = baseStems[yearStemIndex % 5];
  const offset = (monthBranchIndex - 2 + 12) % 12;
  return (base + offset) % 10;
}

// 연주 계산
function getYearPillar(utcDate) {
  const sajuYear = getSajuYear(utcDate);
  const index = ((sajuYear - 1984) % 60 + 60) % 60;
  return SIXTY_JIAZI[index];
}

// 월주 계산
function getMonthPillar(yearStem, utcDate) {
  const yearStemIndex = STEMS.indexOf(yearStem);
  const monthBranchIndex = getMonthBranchIndex(utcDate);
  const monthStemIndex = getMonthStemIndex(yearStemIndex, monthBranchIndex);
  return STEMS[monthStemIndex] + BRANCHES[monthBranchIndex];
}

// 일주 계산 (현지 날짜 기준)
function getDayPillar(year, month, day) {
  const baseDate = new Date(Date.UTC(1996, 4, 22)); // 기미일
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
  const index = ((diffDays + 55) % 60 + 60) % 60;
  return SIXTY_JIAZI[index];
}

// 시주 계산
function getHourBranchIndex(hour, minute = 0) {
  const totalMin = hour * 60 + minute;
  return Math.floor(((totalMin + 30) % 1440) / 120);
}

function getHourPillar(dayStem, hour, minute = 0) {
  const branchIndex = getHourBranchIndex(hour, minute);
  const hourStem = HOUR_STEM_TABLE[dayStem][branchIndex];
  return hourStem + BRANCHES[branchIndex];
}

// ========== 타임존 ==========
const TZ_OFFSETS = {
  'KR': 9, 'JP': 9, 'CN': 8, 'VN': 7, 'TH': 7, 'ID-JKT': 7,
  'US-LAX': -8, 'US-NYC': -5, 'US-CHI': -6, 'US-DEN': -7, 'US-ANC': -9,
  'IN-CCU': 5.5, 'IN-DEL': 5.5, 'IN-BOM': 5.5,
  'GB': 0, 'UK': 0, 'DE': 1, 'FR': 1, 'IT': 1, 'ES': 1, 'SE': 1,
  'AU-SYD': 10, 'NZ': 12, 'BR-SAO': -3, 'MX-MEX': -6, 'MX-CUU': -7,
  'AR': -3, 'CA-TOR': -5, 'RU-MOW': 3, 'HK': 8, 'SG': 8, 'MY': 8,
  'PH': 8, 'EG': 2, 'ZA': 2, 'NG': 1, 'KE': 3, 'PK': 5, 'BD': 6,
  'UA': 2, 'GT': -6, 'IQ': 3, 'SA': 3, 'AE': 4, 'TR': 3, 'PL': 1,
  'NL': 1, 'BE': 1, 'AT': 1, 'CH': 1, 'GR': 2, 'PT': 0, 'CZ': 1,
  'HU': 1, 'RO': 2, 'IL': 2, 'CL': -3, 'CO': -5, 'PE': -5, 'VE': -4,
  'NO': 1, 'DK': 1, 'FI': 2, 'IE': 0, 'NP': 5.75, 'IR': 3.5, 'KZ': 6, 'RW': 2
};

// ========== 메인 계산 ==========
function calculateSaju(dateStr, timeStr, country) {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hour = null, minute = 0;
  if (timeStr && timeStr.includes(':')) {
    [hour, minute] = timeStr.split(':').map(Number);
  }
  
  const offset = TZ_OFFSETS[country] || 0;
  const localHour = hour !== null ? hour : 12;
  
  // 현지 시간 -> UTC
  const localDate = new Date(year, month - 1, day, localHour, minute, 0);
  const utcTime = localDate.getTime() - (offset * 60 * 60 * 1000);
  const utcDate = new Date(utcTime);
  
  // 야자시 보정
  let adjYear = year, adjMonth = month, adjDay = day;
  if (hour !== null && hour >= 23) {
    const next = new Date(year, month - 1, day + 1);
    adjYear = next.getFullYear();
    adjMonth = next.getMonth() + 1;
    adjDay = next.getDate();
  }
  
  // 계산
  const yearPillar = getYearPillar(utcDate);
  const monthPillar = getMonthPillar(yearPillar[0], utcDate);
  const dayPillar = getDayPillar(adjYear, adjMonth, adjDay);
  const hourPillar = hour !== null ? getHourPillar(dayPillar[0], hour, minute) : '';
  
  return { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };
}

// ========== 72개 테스트 케이스 ==========
const testCases = [
  { date: '1996-05-22', time: '16:30', country: 'KR', expected: { year: '병자', month: '계사', day: '기미', hour: '임신' } },
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

// ========== 실행 ==========
let passed = 0, failed = 0;
const failures = [];

for (const tc of testCases) {
  const r = calculateSaju(tc.date, tc.time, tc.country);
  const e = tc.expected;
  
  const yOk = r.year === e.year;
  const mOk = r.month === e.month;
  const dOk = r.day === e.day;
  const hOk = r.hour === e.hour;
  
  if (yOk && mOk && dOk && hOk) {
    passed++;
  } else {
    failed++;
    failures.push({
      input: `${tc.date} ${tc.time} (${tc.country})`,
      expected: `연=${e.year} 월=${e.month} 일=${e.day} 시=${e.hour}`,
      result: `연=${r.year}${yOk?'✓':'✗'} 월=${r.month}${mOk?'✓':'✗'} 일=${r.day}${dOk?'✓':'✗'} 시=${r.hour}${hOk?'✓':'✗'}`
    });
  }
}

console.log(`\n=== 테스트 결과: ${passed}/${testCases.length} 통과 ===\n`);

if (failures.length > 0 && failures.length <= 20) {
  console.log('실패한 케이스:');
  for (const f of failures) {
    console.log(`\n${f.input}`);
    console.log(`  기대: ${f.expected}`);
    console.log(`  결과: ${f.result}`);
  }
} else if (failures.length > 20) {
  console.log(`실패 케이스가 ${failures.length}개로 너무 많아 처음 10개만 출력:`);
  for (let i = 0; i < 10; i++) {
    const f = failures[i];
    console.log(`\n${f.input}`);
    console.log(`  기대: ${f.expected}`);
    console.log(`  결과: ${f.result}`);
  }
}
