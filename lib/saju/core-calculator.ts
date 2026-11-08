// ================================================================
// Saju Calculator - 사주 계산 핵심 로직
// Converted from free.gs + premium.gs
// Version: 2026-04-07-v2 - DST + Solar Time support
// ================================================================

import {
  STEMS, BRANCHES, STEM_TO_ELEMENT, BRANCH_TO_ELEMENT,
  STEM_YIN_YANG, HIDDEN_STEMS, SIXTY_JIAZI,
  TEN_GODS_TABLE, HOUR_STEM_TABLE,
  TIMEZONE_OFFSETS, DEFAULT_TIMEZONE,
  type Stem, type Branch, type Element
} from './constants';
import {
  loadJeolgiData,
  getJeolgiForYear,
  getSajuYear,
  getMonthBranchFromSolarTerm,
  getMonthStem,
  findCurrentSolarTerm
} from './jeolgi';
import { convertToStandardTime, convertWithTimezoneAndLongitude, calculateTrueSolarTime } from './timezone-utils';
import { DateTime } from 'luxon';

// ================================================================
// Types
// ================================================================

export interface Pillar {
  stem: Stem;
  branch: Branch;
  fullPillar: string;
}

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

export interface ElementCount {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
}

export interface TenGodResult {
  position: string;
  stem: Stem;
  tenGod: string;
}

export interface SajuAnalysis {
  fourPillars: FourPillars;
  elementCount: ElementCount;
  tenGods: {
    present: string[];
    missing: string[];
    details: TenGodResult[];
  };
  spirits: string[];
  daewoon: DaewoonEntry[];
  yeonwoon: { year: number; stem: Stem; branch: Branch }[];
}

export interface DaewoonEntry {
  startAge: number;
  stem: Stem;
  branch: Branch;
  element: Element;
}

export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  gender: 'male' | 'female';
  country: string;
  /** IANA 타임존 (e.g., "Asia/Seoul", "America/New_York") - 사용자가 도시를 선택하면 자동 설정 */
  timezone?: string;
  /** 실제 출생 도시 경도 - 정밀 진태양시 계산에 사용 */
  longitude?: number;
  /** 실제 출생 도시 위도 */
  latitude?: number;
  /**
   * 섬머타임(DST) 자동 보정 건너뛰기
   * - true: 입력된 시간이 이미 표준시로 변환된 경우 (기존 Sajume 사용자 데이터)
   * - false/undefined: 사용자가 기억하는 현지 시간 그대로 입력 (새 서비스, 기본값)
   */
  skipDSTCorrection?: boolean;
  /** 야자시: 'apply'(기본) = 23~24시에도 일주는 그날 유지(시주 천간만 다음날 기준) / 'none' = 23시부터 다음날 일주 */
  yajasi?: 'apply' | 'none';
}

// 절기 데이터는 jeolgi.ts에서 로드됨 (1900-2059)

// ================================================================
// 시간을 지지 인덱스로 변환
// ================================================================

export function getHourBranchIndex(hour: number, minute: number = 0, countryCode: string = 'KR'): number {
  // 자시: 23:00~01:00 = 0
  // 축시: 01:00~03:00 = 1
  // 인시: 03:00~05:00 = 2
  // ...
  // 미시: 13:00~15:00 = 6
  // 신시: 15:00~17:00 = 7
  // ...
  
  const totalMin = hour * 60 + minute;
  
  // 모든 국가 동일하게 표준 시각 기준으로 계산
  // (30분 보정은 폐기 - 실제 시각으로 계산해야 정확함)
  
  if (totalMin >= 1380) return 0; // 23:00~23:59 = 자시(0)
  if (totalMin < 60) return 0;    // 00:00~00:59 = 자시(0)
  
  // 01:00부터 2시간 단위
  // 01:00~03:00 = 축시(1), 03:00~05:00 = 인시(2), ...
  return Math.floor((totalMin - 60) / 120) + 1;
}

// ================================================================
// 월지 계산 (절기 기준)
// ================================================================

export function getMonthBranch(year: number, month: number, day: number, hour: number = 0, minute: number = 0): Branch {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const branchIndex = getMonthBranchFromSolarTerm(utcDate);
  return BRANCHES[branchIndex];
}

// ================================================================
// 진태양시 계산 (경도 기반 시간 보정)
// ================================================================

export interface SolarTimeResult {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  correctionMinutes: number;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes: number;
}

/**
 * 균시차(Equation of Time) 계산
 * 
 * 지구 궤도의 이심률과 자전축 경사로 인해 발생하는
 * 평균태양시와 진태양시의 차이 (연중 -14분 ~ +16분)
 */
function calculateEoT(year: number, month: number, day: number): number {
  // 연초부터의 일수 계산
  const startOfYear = new Date(year, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const dayOfYear = Math.floor((targetDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // B 값 (라디안)
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  
  // Spencer (1971) 공식
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

export function calcSolarTime(
  year: number, month: number, day: number,
  hour: number, minute: number,
  actualLongitude: number, standardMeridian: number
): SolarTimeResult {
  // ================================================================
  // 진태양시(True Solar Time) 계산
  // 
  // 1. 경도 보정 (LMT - Local Mean Time)
  //    - 타임존의 기준 자오선(standardMeridian)과 실제 도시 경도(actualLongitude) 차이
  //    - 경도 1도 = 4분
  //    - 예: 뉴욕시(-74도) vs 미국 동부 표준(-75도) = 1도 차이 = +4분
  //
  // 2. 균시차 (EoT - Equation of Time)
  //    - 지구 궤도 이심률과 자전축 경사로 인한 보정
  //    - 연중 -14분 ~ +16분 변동
  //    - Spencer (1971) 공식 사용
  // ================================================================
  
  // 1. 경도 보정 (경도 1도 = 4분)
  const longitudeCorrection = (actualLongitude - standardMeridian) * 4;
  
  // 2. 균시차 계산 (Spencer 공식)
  const eot = calculateEoT(year, month, day);
  
  // 3. 총 보정값 = 경도 보정 + 균시차
  const totalCorrection = Math.round(longitudeCorrection + eot);
  
  const localDate = new Date(year, month - 1, day, hour, minute, 0);
  localDate.setMinutes(localDate.getMinutes() + totalCorrection);
  
  return {
    year: localDate.getFullYear(),
    month: localDate.getMonth() + 1,
    day: localDate.getDate(),
    hour: localDate.getHours(),
    minute: localDate.getMinutes(),
    correctionMinutes: totalCorrection,
    longitudeCorrectionMinutes: Math.round(longitudeCorrection),
    equationOfTimeMinutes: Math.round(eot)
  };
}

// ================================================================
// 일주 계산 (60갑자)
// ================================================================

export function getDayPillar(year: number, month: number, day: number): Pillar {
  const baseDate = new Date(Date.UTC(1984, 0, 31));
  const baseIndex = 0;
  
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.round((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const index = ((diffDays % 60) + 60) % 60;
  const pillar = SIXTY_JIAZI[index];

  return {
    stem: pillar[0] as Stem,
    branch: pillar[1] as Branch,
    fullPillar: pillar
  };
}

// ================================================================
// 연주 계산
// ================================================================

export function getYearPillar(year: number, month: number, day: number, hour: number = 0, minute: number = 0): Pillar {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const actualYear = getSajuYear(utcDate);
  const index = ((actualYear - 1984) % 60 + 60) % 60;
  const pillar = SIXTY_JIAZI[index];

  return {
    stem: pillar[0] as Stem,
    branch: pillar[1] as Branch,
    fullPillar: pillar
  };
}

// ================================================================
// 월주 계산
// ================================================================

export function getMonthPillar(yearStem: Stem, monthBranch: Branch): Pillar {
  const yearStemIndex = STEMS.indexOf(yearStem);
  const branchIndex = BRANCHES.indexOf(monthBranch);
  const monthStemIndex = getMonthStem(yearStemIndex, branchIndex);
  const monthStem = STEMS[monthStemIndex];

  return {
    stem: monthStem,
    branch: monthBranch,
    fullPillar: `${monthStem}${monthBranch}`
  };
}

// ================================================================
// 시주 계산
// ================================================================

export function getHourPillar(dayStem: Stem, hour: number, minute: number = 0, countryCode: string = 'KR'): Pillar | null {
  if (hour < 0 || hour > 23) return null;
  
  const branchIndex = getHourBranchIndex(hour, minute, countryCode);
  const branch = BRANCHES[branchIndex];
  const hourStemTable = HOUR_STEM_TABLE[dayStem];
  const stem = hourStemTable[branchIndex];

  return {
    stem,
    branch,
    fullPillar: `${stem}${branch}`
  };
}

// ================================================================
// 사주 4주 계산 (메인 함수)
// ================================================================

export function calculateFourPillars(birthInfo: BirthInfo): FourPillars {
  const { year, month, day, hour, minute, country, skipDSTCorrection, timezone, longitude } = birthInfo;
  const yajasi = birthInfo.yajasi ?? 'apply';
  
  // IANA timezone이 제공된 경우 → Luxon으로 직접 처리 (TIMEZONE_OFFSETS 불필요)
  // country 코드가 TIMEZONE_OFFSETS에 없는 경우도 커버됨 (예: "US", "New York" 등)
  const tz = TIMEZONE_OFFSETS[country] || DEFAULT_TIMEZONE;
  
  const localHour = hour ?? 12;
  const localMinute = minute ?? 0;
  
  let stdYear: number, stdMonth: number, stdDay: number, stdHour: number, stdMinute: number;
  let utcYear: number, utcMonth: number, utcDay: number, utcHour: number, utcMinute: number;
  let isDST = false;
  let resolvedOffset: number = tz.offset; // 실제 사용된 UTC 오프셋 (시간 단위)
  
  if (skipDSTCorrection) {
    stdYear = year;
    stdMonth = month;
    stdDay = day;
    stdHour = localHour;
    stdMinute = localMinute;
    
    const stdDate = new Date(year, month - 1, day, localHour, localMinute, 0);
    const utcTime = stdDate.getTime() - (tz.offset * 60 * 60 * 1000);
    const utcDateObj = new Date(utcTime);
    utcYear = utcDateObj.getUTCFullYear();
    utcMonth = utcDateObj.getUTCMonth() + 1;
    utcDay = utcDateObj.getUTCDate();
    utcHour = utcDateObj.getUTCHours();
    utcMinute = utcDateObj.getUTCMinutes();
    resolvedOffset = tz.offset;
  } else if (timezone) {
    // ================================================================
    // IANA 타임존 직접 사용 (도시 선택 시 - 가장 정확한 경로)
    // Luxon이 DST, 역사적 타임존 변경을 모두 자동 처리
    // ================================================================
    try {
      const localDt = DateTime.fromObject(
        { year, month, day, hour: localHour, minute: localMinute, second: 0 },
        { zone: timezone }
      );
      
      if (!localDt.isValid) throw new Error('Invalid datetime for timezone: ' + timezone);
      
      isDST = localDt.isInDST;
      const actualOffsetMinutes = localDt.offset; // 분 단위 (DST 포함된 실제 오프셋)
      resolvedOffset = actualOffsetMinutes / 60;   // 시간 단위로 변환
      
      // UTC 변환
      const utcDt = localDt.toUTC();
      utcYear = utcDt.year;
      utcMonth = utcDt.month;
      utcDay = utcDt.day;
      utcHour = utcDt.hour;
      utcMinute = utcDt.minute;
      
      // 표준시 = UTC + 실제 오프셋 (DST 포함)
      // 사주 계산은 "사용자가 입력한 현지 시간" 그대로를 기준으로 함
      stdYear = localDt.year;
      stdMonth = localDt.month;
      stdDay = localDt.day;
      stdHour = localDt.hour;
      stdMinute = localDt.minute;
    } catch (err) {
      // IANA 변환 실패 시 기존 방식으로 fallback
      console.log('[v0] IANA path failed, falling back:', err);
      const converted = convertToStandardTime(year, month, day, localHour, localMinute, country);
      stdYear = converted.standardYear;
      stdMonth = converted.standardMonth;
      stdDay = converted.standardDay;
      stdHour = converted.standardHour;
      stdMinute = converted.standardMinute;
      utcYear = converted.utcYear;
      utcMonth = converted.utcMonth;
      utcDay = converted.utcDay;
      utcHour = converted.utcHour;
      utcMinute = converted.utcMinute;
      isDST = converted.isDST;
      resolvedOffset = converted.standardOffset;
    }
  } else {
    const converted = convertToStandardTime(year, month, day, localHour, localMinute, country);
    stdYear = converted.standardYear;
    stdMonth = converted.standardMonth;
    stdDay = converted.standardDay;
    stdHour = converted.standardHour;
    stdMinute = converted.standardMinute;
    utcYear = converted.utcYear;
    utcMonth = converted.utcMonth;
    utcDay = converted.utcDay;
    utcHour = converted.utcHour;
    utcMinute = converted.utcMinute;
    isDST = converted.isDST;
    resolvedOffset = converted.standardOffset;
  }
  
  // UTC 시간은 참조용으로만 저장 (실제 계산에는 진태양시 사용)
  const utcDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute));

  // ================================================================
  // 진태양시 계산 (True Solar Time)
  // standardMeridian: resolvedOffset * 15 (실제 사용된 오프셋 기반)
  // actualLongitude: birthInfo.longitude (도시 선택 시) or tz.meridian (fallback)
  // ================================================================
  const standardMeridian = resolvedOffset * 15;
  const actualLongitude = longitude ?? tz.meridian;
  
  const solarTime = calcSolarTime(
    stdYear, stdMonth, stdDay, stdHour, stdMinute,
    actualLongitude, standardMeridian
  );
  
  // ================================================================
  // 모든 사주(연주, 월주, 일주, 시주)는 진태양시(solarTime) 기준으로 계산
  // 야자시 보정: 23시 ���후는 다음 날로 처리 (일주 계산용)
  // ================================================================
  
  // [전문가 기준 — 정답지 사이트 결과로 확정]
  //  1) 시각 보정 = (출생지 경도 - 표준자오선) x 4분. 균시차 없음. 서울도 동일 공식(-32.1분).
  //  2) 연/월주(절입 판정) = 실제 순간(UTC 기준)을 절입 시각과 비교 (보정 시각 아님)
  //  3) 일주 = 시계상 출생 날짜. 보정으로 자정을 넘겨 전날이 돼도 일주는 시계 날짜 유지
  //  4) 시주 = 보정된 시각. 보정시각 23시 이후면 시주 천간은 다음날 일간 기준
  //  5) 야자시 미적용: 시계 날짜와 보정 날짜가 같고 보정시각이 23시 이후일 때만 일주를 다음날로
  const lonForCorr = actualLongitude ?? 126.978
  const corrMin = lonForCorr * 4 - resolvedOffset * 60 + calculateEoT(stdYear, stdMonth, stdDay)
  const clk = new Date(stdYear, stdMonth - 1, stdDay, stdHour, stdMinute, 0)
  const cor = new Date(clk.getTime() + Math.round(corrMin * 60000))
  const corY = cor.getFullYear(), corM = cor.getMonth() + 1, corD = cor.getDate(), corH = cor.getHours(), corMin2 = cor.getMinutes()
  const isKR = country === 'KR'

  // 연/월주: UTC 순간 → 한국 표준시(절입표 기준)로 환산해서 비교
  const kst = new Date(utcDate.getTime() + 9 * 3600000)
  const ymSrc = { y: kst.getUTCFullYear(), m: kst.getUTCMonth() + 1, d: kst.getUTCDate(), h: kst.getUTCHours(), mi: kst.getUTCMinutes() }
  const yearPillar = getYearPillar(ymSrc.y, ymSrc.m, ymSrc.d, ymSrc.h, ymSrc.mi)
  const monthBranch = getMonthBranch(ymSrc.y, ymSrc.m, ymSrc.d, ymSrc.h, ymSrc.mi)
  const monthPillar = getMonthPillar(yearPillar.stem, monthBranch)

  const clockDay = new Date(stdYear, stdMonth - 1, stdDay)
  const corDay = new Date(corY, corM - 1, corD)
  const dayDiff = Math.round((corDay.getTime() - clockDay.getTime()) / 86400000)   // -1: 보정으로 전날, 0: 같은 날, 1: 다음날
  let dayBase = clockDay
  if (yajasi === 'none' && (dayDiff === 1 || (dayDiff === 0 && corH >= 23))) dayBase = new Date(stdYear, stdMonth - 1, stdDay + 1)
  const dayPillar = getDayPillar(dayBase.getFullYear(), dayBase.getMonth() + 1, dayBase.getDate())

  let hourPillar: Pillar | null = null
  if (hour !== undefined) {
    let stemBase = dayPillar.stem
    if ((corH >= 23 && dayDiff === 0) || dayDiff === 1) {
      const nx = new Date(stdYear, stdMonth - 1, stdDay + 1)
      stemBase = getDayPillar(nx.getFullYear(), nx.getMonth() + 1, nx.getDate()).stem
    }
    hourPillar = getHourPillar(stemBase, corH, corMin2, country)
  }
  void isKR

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };
}

// ================================================================
// 오행 개수 계산 (지장간 포함) - 비율 표시용
// 천간 4개 + 지지 4개 + 지장간(지지마다 1~3개)
// ================================================================

// 오행 개수 계산 (지장간 미포함 - 천간/지지만)
export function countElementsBasic(fourPillars: FourPillars): ElementCount {
  const count: ElementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  
  const pillars = [fourPillars.year, fourPillars.month, fourPillars.day];
  if (fourPillars.hour) pillars.push(fourPillars.hour);
  
  for (const pillar of pillars) {
    // 천간 카운트
    const stemElement = STEM_TO_ELEMENT[pillar.stem];
    count[stemElement]++;
    
    // 지지 카운트
    const branchElement = BRANCH_TO_ELEMENT[pillar.branch];
    count[branchElement]++;
  }
  
  return count;
}

// ================================================================
// 오행 점수 계산 (수치론 점수 방식)
// 지장간(숨겨진 천간)을 포함한 오행 세력 계산
// ================================================================

/**
 * 지장간 포함 오행 점수 계산
 * = 천간 점수 + 지지 본기 점수 + 지장간 점수
 * 지장간 배분: 본기(50%) + 중기(30%) + 말기(20%)
 */
export function calculateElementScoresWithHiddenStems(fourPillars: FourPillars): ElementCount {
  const scores: ElementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  // 지장간 (HIDDEN_STEMS from constants)
  // 자: 계(본) / 축: 기(본) 정(중) ���(말) / 인: 갑(본) 병(중) 무(말) / ... 등
  const HIDDEN_STEMS_INFO: Record<string, Array<{ stem: string; weight: 'main' | 'middle' | 'minor' }>> = {
    '자': [{ stem: '계', weight: 'main' }],
    '축': [
      { stem: '기', weight: 'main' },
      { stem: '정', weight: 'middle' },
      { stem: '계', weight: 'minor' }
    ],
    '인': [
      { stem: '갑', weight: 'main' },
      { stem: '병', weight: 'middle' },
      { stem: '무', weight: 'minor' }
    ],
    '묘': [{ stem: '을', weight: 'main' }],
    '진': [
      { stem: '무', weight: 'main' },
      { stem: '을', weight: 'middle' },
      { stem: '계', weight: 'minor' }
    ],
    '사': [
      { stem: '병', weight: 'main' },
      { stem: '경', weight: 'middle' },
      { stem: '무', weight: 'minor' }
    ],
    '오': [{ stem: '정', weight: 'main' }],
    '미': [
      { stem: '기', weight: 'main' },
      { stem: '을', weight: 'middle' },
      { stem: '정', weight: 'minor' }
    ],
    '신': [
      { stem: '경', weight: 'main' },
      { stem: '임', weight: 'middle' },
      { stem: '무', weight: 'minor' }
    ],
    '유': [{ stem: '신', weight: 'main' }],
    '술': [
      { stem: '무', weight: 'main' },
      { stem: '신', weight: 'middle' },
      { stem: '을', weight: 'minor' }
    ],
    '해': [
      { stem: '임', weight: 'main' },
      { stem: '갑', weight: 'middle' },
      { stem: '을', weight: 'minor' }
    ]
  };

  // 천간 점수 (각 10점)
  const yearStemElement = STEM_TO_ELEMENT[fourPillars.year.stem];
  scores[yearStemElement] += 10;

  const monthStemElement = STEM_TO_ELEMENT[fourPillars.month.stem];
  scores[monthStemElement] += 10;

  const dayStemElement = STEM_TO_ELEMENT[fourPillars.day.stem];
  scores[dayStemElement] += 10;

  if (fourPillars.hour) {
    const hourStemElement = STEM_TO_ELEMENT[fourPillars.hour.stem];
    scores[hourStemElement] += 10;
  }

  // 지지 본기 점수 (연지 10점, 월지 30점, 일지 20점, 시지 20점)
  const yearBranchElement = BRANCH_TO_ELEMENT[fourPillars.year.branch];
  scores[yearBranchElement] += 10;

  const monthBranchElement = BRANCH_TO_ELEMENT[fourPillars.month.branch];
  scores[monthBranchElement] += 30;

  const dayBranchElement = BRANCH_TO_ELEMENT[fourPillars.day.branch];
  scores[dayBranchElement] += 20;

  if (fourPillars.hour) {
    const hourBranchElement = BRANCH_TO_ELEMENT[fourPillars.hour.branch];
    scores[hourBranchElement] += 20;
  }

  // 지장간 점수 추가
  const addHiddenStemScores = (branch: string, weight: number) => {
    const hidden = HIDDEN_STEMS_INFO[branch];
    if (!hidden) return;
    
    hidden.forEach(({ stem, weight: itemWeight }) => {
      const element = STEM_TO_ELEMENT[stem as any];
      if (!element) return;
      
      const points = itemWeight === 'main' ? weight * 0.5 : 
                    itemWeight === 'middle' ? weight * 0.3 : 
                    weight * 0.2;
      scores[element] += points;
    });
  };

  // 연지 지장간 (10점 기준)
  addHiddenStemScores(fourPillars.year.branch, 10);

  // 월지 지장간 (30점 기준)
  addHiddenStemScores(fourPillars.month.branch, 30);

  // 일지 지장간 (20점 기준)
  addHiddenStemScores(fourPillars.day.branch, 20);

  // 시지 지장간 (20점 기준)
  if (fourPillars.hour) {
    addHiddenStemScores(fourPillars.hour.branch, 20);
  }

  return scores;
}

// 오행 개수 계산 (구 방식 - 호환성용, deprecated)
// ================================================================

export function countElements(fourPillars: FourPillars, includeHiddenStems: boolean = true): ElementCount {
  const count: ElementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  const pillars = [fourPillars.year, fourPillars.month, fourPillars.day];
  if (fourPillars.hour) pillars.push(fourPillars.hour);

  for (const pillar of pillars) {
    const stemElement = STEM_TO_ELEMENT[pillar.stem];
    count[stemElement]++;

    const branchElement = BRANCH_TO_ELEMENT[pillar.branch];
    count[branchElement]++;

    if (includeHiddenStems) {
      const hiddenStems = HIDDEN_STEMS[pillar.branch];
      for (const hs of hiddenStems) {
        const hsElement = STEM_TO_ELEMENT[hs];
        count[hsElement] += 0.5;
      }
    }
  }

  return count;
}

// ================================================================
// 십성 계산
// ================================================================

// 지지의 본기(대표 천간) 매핑 - 지지 십신 계산에 사용
const BRANCH_MAIN_STEM: Record<Branch, Stem> = {
  "자": "계", "축": "기", "인": "갑", "묘": "을",
  "진": "무", "사": "병", "오": "정", "미": "기",
  "신": "경", "유": "신", "술": "무", "해": "임"
};

export function calculateTenGods(fourPillars: FourPillars): { 
  present: string[]; 
  missing: string[]; 
  details: TenGodResult[];
  // 각 위치별 십신 (연간/연지/월간/월지/일간/일지/시간/시지)
  byPosition: {
    yearStem: string;
    yearBranch: string;
    monthStem: string;
    monthBranch: string;
    dayStem: string;
    dayBranch: string;
    hourStem: string;
    hourBranch: string;
  }
} {
  const dayStem = fourPillars.day.stem;
  const details: TenGodResult[] = [];
  const presentSet = new Set<string>();

  // 연간 십신
  const yearStemTenGod = TEN_GODS_TABLE[dayStem][fourPillars.year.stem];
  details.push({ position: "연간", stem: fourPillars.year.stem, tenGod: yearStemTenGod });
  presentSet.add(yearStemTenGod);

  // 연지 십신 (본기 기준)
  const yearBranchMainStem = BRANCH_MAIN_STEM[fourPillars.year.branch];
  const yearBranchTenGod = TEN_GODS_TABLE[dayStem][yearBranchMainStem];
  details.push({ position: "연지", stem: yearBranchMainStem, tenGod: yearBranchTenGod });
  presentSet.add(yearBranchTenGod);

  // 월간 십신
  const monthStemTenGod = TEN_GODS_TABLE[dayStem][fourPillars.month.stem];
  details.push({ position: "월간", stem: fourPillars.month.stem, tenGod: monthStemTenGod });
  presentSet.add(monthStemTenGod);

  // 월지 십신 (본기 기준)
  const monthBranchMainStem = BRANCH_MAIN_STEM[fourPillars.month.branch];
  const monthBranchTenGod = TEN_GODS_TABLE[dayStem][monthBranchMainStem];
  details.push({ position: "월지", stem: monthBranchMainStem, tenGod: monthBranchTenGod });
  presentSet.add(monthBranchTenGod);

  // 일간 십신 (자기 자신 = 일간으로 표기)
  const dayStemTenGod = "일간";
  details.push({ position: "일간", stem: dayStem, tenGod: dayStemTenGod });
  // 일간은 presentSet에 추가하지 않음 (비견/겁재와 별도 취급)

  // 일지 십신 (본기 기준)
  const dayBranchMainStem = BRANCH_MAIN_STEM[fourPillars.day.branch];
  const dayBranchTenGod = TEN_GODS_TABLE[dayStem][dayBranchMainStem];
  details.push({ position: "일지", stem: dayBranchMainStem, tenGod: dayBranchTenGod });
  presentSet.add(dayBranchTenGod);

  // 시간/시지 십신
  let hourStemTenGod = "";
  let hourBranchTenGod = "";
  if (fourPillars.hour) {
    hourStemTenGod = TEN_GODS_TABLE[dayStem][fourPillars.hour.stem];
    details.push({ position: "시간", stem: fourPillars.hour.stem, tenGod: hourStemTenGod });
    presentSet.add(hourStemTenGod);

    const hourBranchMainStem = BRANCH_MAIN_STEM[fourPillars.hour.branch];
    hourBranchTenGod = TEN_GODS_TABLE[dayStem][hourBranchMainStem];
    details.push({ position: "시지", stem: hourBranchMainStem, tenGod: hourBranchTenGod });
    presentSet.add(hourBranchTenGod);
  }

  // 지장간 십신도 포함 (보유 십신 계산용)
  const branches = [
    fourPillars.year.branch,
    fourPillars.month.branch,
    fourPillars.day.branch,
  ];
  if (fourPillars.hour) {
    branches.push(fourPillars.hour.branch);
  }
  for (const branch of branches) {
    const hidden = HIDDEN_STEMS[branch];
    for (const hs of hidden) {
      const tenGod = TEN_GODS_TABLE[dayStem][hs];
      presentSet.add(tenGod);
    }
  }

  const allTenGods = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
  const present = Array.from(presentSet);
  const missing = allTenGods.filter(tg => !presentSet.has(tg));

  return { 
    present, 
    missing, 
    details,
    byPosition: {
      yearStem: yearStemTenGod,
      yearBranch: yearBranchTenGod,
      monthStem: monthStemTenGod,
      monthBranch: monthBranchTenGod,
      dayStem: dayStemTenGod,
      dayBranch: dayBranchTenGod,
      hourStem: hourStemTenGod,
      hourBranch: hourBranchTenGod
    }
  };
}

// ================================================================
// 신살 계산
// ================================================================

export function calcDoHwaSal(dayBranch: Branch, allBranches: Branch[]): boolean {
  const doHwaMap: Record<Branch, Branch> = {
    "인": "묘", "오": "묘", "술": "묘",
    "신": "유", "자": "유", "진": "유",
    "사": "오", "유": "오", "축": "오",
    "해": "자", "묘": "자", "미": "자"
  };
  const target = doHwaMap[dayBranch];
  return target ? allBranches.includes(target) : false;
}

export function calcYeokMaSal(dayBranch: Branch, allBranches: Branch[]): boolean {
  const yeokMaMap: Record<Branch, Branch> = {
    "인": "신", "오": "신", "술": "신",
    "신": "인", "자": "인", "진": "인",
    "사": "해", "유": "해", "축": "해",
    "해": "사", "묘": "사", "미": "사"
  };
  const target = yeokMaMap[dayBranch];
  return target ? allBranches.includes(target) : false;
}

export function calcHwaGaeSal(dayBranch: Branch, allBranches: Branch[]): boolean {
  const hwaGaeMap: Record<Branch, Branch> = {
    "인": "술", "오": "술", "술": "술",
    "신": "진", "자": "진", "진": "진",
    "사": "축", "유": "축", "축": "축",
    "해": "미", "묘": "미", "미": "미"
  };
  const target = hwaGaeMap[dayBranch];
  return target ? allBranches.includes(target) : false;
}

export function calcGoeGangSal(dayPillar: string): boolean {
  const goeGangList = ["무진", "경술", "경진", "임술"];
  return goeGangList.includes(dayPillar);
}

// ================================================================
// 대운 계산
// ================================================================

export function calculateDaeWoon(
  fourPillars: FourPillars,
  gender: 'male' | 'female',
  birthYear: number
): DaewoonEntry[] {
  const yearStem = fourPillars.year.stem;
  const monthPillar = fourPillars.month.fullPillar;
  
  const isYang = STEM_YIN_YANG[yearStem] === "양";
  const isMale = gender === "male";
  const isForward = (isYang && isMale) || (!isYang && !isMale);

  const monthIndex = SIXTY_JIAZI.indexOf(monthPillar);
  const daeWoon: DaewoonEntry[] = [];

  for (let i = 1; i <= 10; i++) {
    const idx = isForward
      ? (monthIndex + i) % 60
      : (monthIndex - i + 60) % 60;
    
    const pillar = SIXTY_JIAZI[idx];
    const stem = pillar[0] as Stem;
    const branch = pillar[1] as Branch;

    daeWoon.push({
      startAge: i * 10,
      stem,
      branch,
      element: STEM_TO_ELEMENT[stem]
    });
  }

  return daeWoon;
}

// ================================================================
// 연운 계산
// ================================================================

export function calculateYeonWoon(currentYear: number, count: number = 10): { year: number; stem: Stem; branch: Branch }[] {
  const yeonWoon: { year: number; stem: Stem; branch: Branch }[] = [];
  
  for (let i = 0; i < count; i++) {
    const year = currentYear + i;
    const index = ((year - 1984) % 60 + 60) % 60;
    const pillar = SIXTY_JIAZI[index];
    
    yeonWoon.push({
      year,
      stem: pillar[0] as Stem,
      branch: pillar[1] as Branch
    });
  }

  return yeonWoon;
}

// ================================================================
// 전체 분석 실행
// ================================================================

export function runFullAnalysis(birthInfo: BirthInfo): SajuAnalysis {
  const fourPillars = calculateFourPillars(birthInfo);
  const elementCount = countElements(fourPillars);
  const tenGods = calculateTenGods(fourPillars);

  const allBranches: Branch[] = [
    fourPillars.year.branch,
    fourPillars.month.branch,
    fourPillars.day.branch,
  ];
  if (fourPillars.hour) {
    allBranches.push(fourPillars.hour.branch);
  }

  const spirits: string[] = [];
  if (calcDoHwaSal(fourPillars.day.branch, allBranches)) spirits.push("도화살");
  if (calcYeokMaSal(fourPillars.day.branch, allBranches)) spirits.push("역마살");
  if (calcHwaGaeSal(fourPillars.day.branch, allBranches)) spirits.push("화개살");
  if (calcGoeGangSal(fourPillars.day.fullPillar)) spirits.push("괴강살");

  const daewoon = calculateDaeWoon(fourPillars, birthInfo.gender, birthInfo.year);

  const currentYear = new Date().getFullYear();
  const yeonwoon = calculateYeonWoon(currentYear, 10);

  return {
    fourPillars,
    elementCount,
    tenGods,
    spirits,
    daewoon,
    yeonwoon
  };
}
