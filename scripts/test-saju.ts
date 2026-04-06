// Test script for Saju calculation verification
// Run with: npx ts-node scripts/test-saju.ts

import { runFullAnalysis } from '../lib/saju/calculator';

interface TestCase {
  date: string;
  time: string;
  country: string;
  gender: 'male' | 'female';
  expected: {
    year: string;  // e.g., "정축"
    month: string; // e.g., "갑진"
    day: string;   // e.g., "을미"
    hour: string;  // e.g., "병술" or "시간 모름"
    dayMaster: string; // e.g., "을목"
  };
}

const testCases: TestCase[] = [
  {
    date: '1996-05-22',
    time: '14:30',
    country: 'KR', // South Korea
    gender: 'female',
    expected: {
      year: '병자',
      month: '계사',
      day: '기미',
      hour: '임신',
      dayMaster: '기토'
    }
  },
  {
    date: '1997-04-23',
    time: '20:15',
    country: 'US-LAX', // Los Angeles
    gender: 'male',
    expected: {
      year: '정축',
      month: '갑진',
      day: '을미',
      hour: '병술',
      dayMaster: '을목'
    }
  },
  {
    date: '1994-06-01',
    time: '00:24',
    country: 'US-LAX', // Los Angeles
    gender: 'female',
    expected: {
      year: '갑술',
      month: '기사',
      day: '무오',
      hour: '임자',
      dayMaster: '무토'
    }
  },
  {
    date: '1983-01-22',
    time: '07:30',
    country: 'US-NYC', // New York
    gender: 'female',
    expected: {
      year: '임술',
      month: '계축',
      day: '경술',
      hour: '경진',
      dayMaster: '경금'
    }
  },
  {
    date: '1992-08-19',
    time: '10:30',
    country: 'VN', // Vietnam
    gender: 'female',
    expected: {
      year: '임신',
      month: '무신',
      day: '정묘',
      hour: '을사',
      dayMaster: '정화'
    }
  },
  {
    date: '2000-12-25',
    time: '07:00',
    country: 'IN-CCU', // India - East (Kolkata)
    gender: 'female',
    expected: {
      year: '경진',
      month: '무자',
      day: '정사',
      hour: '계묘',
      dayMaster: '정화'
    }
  },
  {
    date: '1980-02-12',
    time: '10:10',
    country: 'KR', // South Korea
    gender: 'female',
    expected: {
      year: '경신',
      month: '무인',
      day: '을묘',
      hour: '신사',
      dayMaster: '을목'
    }
  },
  {
    date: '2026-04-02',
    time: '',
    country: 'ID-JKT', // Indonesia - Jakarta
    gender: 'female',
    expected: {
      year: '병오',
      month: '신묘',
      day: '병오',
      hour: '시간 모름',
      dayMaster: '병화'
    }
  }
];

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

function parseTime(timeStr: string): { hour?: number; minute?: number } {
  if (!timeStr) return {};
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

console.log('=== Saju Calculation Test ===\n');

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const { year, month, day } = parseDate(tc.date);
  const { hour, minute } = parseTime(tc.time);
  
  try {
    const result = runFullAnalysis({
      year,
      month,
      day,
      hour,
      minute,
      gender: tc.gender,
      country: tc.country
    });
    
    const fp = result.fourPillars;
    const actual = {
      year: `${fp.year.stem}${fp.year.branch}`,
      month: `${fp.month.stem}${fp.month.branch}`,
      day: `${fp.day.stem}${fp.day.branch}`,
      hour: fp.hour ? `${fp.hour.stem}${fp.hour.branch}` : '시간 모름',
      dayMaster: `${fp.day.stem}${result.dayMasterElement.slice(0, 1)}`
    };
    
    const yearMatch = actual.year === tc.expected.year;
    const monthMatch = actual.month === tc.expected.month;
    const dayMatch = actual.day === tc.expected.day;
    const hourMatch = tc.expected.hour === '시간 모름' || actual.hour === tc.expected.hour;
    
    const allMatch = yearMatch && monthMatch && dayMatch && hourMatch;
    
    console.log(`Test: ${tc.date} ${tc.time || '(no time)'} ${tc.country}`);
    console.log(`  Expected: 연${tc.expected.year} 월${tc.expected.month} 일${tc.expected.day} 시${tc.expected.hour}`);
    console.log(`  Actual:   연${actual.year} 월${actual.month} 일${actual.day} 시${actual.hour}`);
    console.log(`  Result: ${allMatch ? '✓ PASS' : '✗ FAIL'}`);
    
    if (!allMatch) {
      if (!yearMatch) console.log(`    - Year: expected ${tc.expected.year}, got ${actual.year}`);
      if (!monthMatch) console.log(`    - Month: expected ${tc.expected.month}, got ${actual.month}`);
      if (!dayMatch) console.log(`    - Day: expected ${tc.expected.day}, got ${actual.day}`);
      if (!hourMatch) console.log(`    - Hour: expected ${tc.expected.hour}, got ${actual.hour}`);
      failed++;
    } else {
      passed++;
    }
    console.log('');
  } catch (error) {
    console.log(`Test: ${tc.date} ${tc.time || '(no time)'} ${tc.country}`);
    console.log(`  ERROR: ${error}`);
    console.log('');
    failed++;
  }
}

console.log('=== Summary ===');
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);
