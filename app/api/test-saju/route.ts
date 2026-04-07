import { NextResponse } from 'next/server';
import { calculateFourPillars } from '@/lib/saju/calculator';
import { COUNTRIES } from '@/lib/types';

// 국가 라벨 -> 코드 매핑
const COUNTRY_MAP: Record<string, string> = {};
for (const country of COUNTRIES) {
  COUNTRY_MAP[country.label] = country.value;
}

// 테스트 케이스 파싱
function parseTestCase(line: string) {
  const parts = line.split('\t');
  if (parts.length < 7) return null;
  
  const num = parseInt(parts[0].trim(), 10);
  const date = parts[1].trim();
  const time = parts[2].trim();
  const countryLabel = parts[3].trim();
  const gender = parts[5].trim().toLowerCase();
  
  // 기대값 파싱 (간지만 추출)
  const yearMatch = parts[6].match(/^([가-힣]+)/);
  const monthMatch = parts[7]?.match(/^([가-힣]+)/);
  const dayMatch = parts[8]?.match(/^([가-힣]+)/);
  const hourMatch = parts[9]?.match(/^([가-힣]+)/);
  
  const expected = {
    year: yearMatch?.[1] || '',
    month: monthMatch?.[1] || '',
    day: dayMatch?.[1] || '',
    hour: hourMatch?.[1] || '시간 모름'
  };
  
  // 국가 코드 찾기
  let countryCode = COUNTRY_MAP[countryLabel];
  if (!countryCode) {
    // 부분 매칭 시도
    for (const [label, code] of Object.entries(COUNTRY_MAP)) {
      if (label.includes(countryLabel) || countryLabel.includes(label.split(' - ')[0])) {
        countryCode = code;
        break;
      }
    }
  }
  
  return { num, date, time, countryLabel, countryCode, gender, expected };
}

export async function POST(request: Request) {
  try {
    const { testCases } = await request.json();
    const results: any[] = [];
    let passed = 0;
    let failed = 0;
    
    for (const line of testCases) {
      const tc = parseTestCase(line);
      if (!tc) continue;
      
      const [year, month, day] = tc.date.split('-').map(Number);
      let hour: number | undefined;
      let minute: number | undefined;
      
      if (tc.time && tc.time !== '') {
        const timeParts = tc.time.split(':');
        hour = parseInt(timeParts[0], 10);
        minute = parseInt(timeParts[1], 10) || 0;
      }
      
      try {
        const pillars = calculateFourPillars({
          year, month, day, hour, minute,
          country: tc.countryCode || 'KR',
          gender: tc.gender.includes('female') ? 'female' : 'male'
        });
        
        const actual = {
          year: pillars.year.fullPillar,
          month: pillars.month.fullPillar,
          day: pillars.day.fullPillar,
          hour: pillars.hour?.fullPillar || '시간 모름'
        };
        
        const yearOk = actual.year === tc.expected.year;
        const monthOk = actual.month === tc.expected.month;
        const dayOk = actual.day === tc.expected.day;
        const hourOk = actual.hour === tc.expected.hour || tc.expected.hour === '시간 모른';
        
        const allOk = yearOk && monthOk && dayOk && hourOk;
        
        if (allOk) {
          passed++;
        } else {
          failed++;
          results.push({
            num: tc.num,
            date: tc.date,
            time: tc.time,
            country: tc.countryLabel,
            countryCode: tc.countryCode,
            expected: tc.expected,
            actual,
            yearOk, monthOk, dayOk, hourOk
          });
        }
      } catch (err: any) {
        failed++;
        results.push({
          num: tc.num,
          date: tc.date,
          time: tc.time,
          country: tc.countryLabel,
          countryCode: tc.countryCode,
          error: err.message
        });
      }
    }
    
    return NextResponse.json({
      total: passed + failed,
      passed,
      failed,
      failures: results.slice(0, 50) // 처음 50개 실패만 반환
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
