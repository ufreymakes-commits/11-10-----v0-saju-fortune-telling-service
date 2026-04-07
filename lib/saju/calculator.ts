// ================================================================
// Saju Calculator - 사주 계산 핵심 로직
// Converted from free.gs + premium.gs
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
import { convertToStandardTime } from './timezone-utils';

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
  longitude?: number;
  /**
   * 섬머타임(DST) 자동 보정 건너뛰기
   * - true: 입력된 시간이 이미 표준시로 변환된 경우 (기존 Sajume 사용자 데이터)
   * - false/undefined: 사용자가 기억하는 현지 시간 그대로 입력 (새 서비스, 기본값)
   */
  skipDSTCorrection?: boolean;
}

// 절기 데이터는 jeolgi.ts에서 로드됨 (1900-2059)

// ================================================================
// 시간을 지지 인덱스로 변환
// ================================================================

export function getHourBranchIndex(hour: number, minute: number = 0): number {
  // 원본 공식: Math.floor(((totalMin + 30) % 1440) / 120)
  // 30분 offset을 적용하여 시간대 경계를 23:30, 01:30, 03:30... 으로 조정
  // 
  // 23:30-01:29 → 자(0)
  // 01:30-03:29 → 축(1)
  // 03:30-05:29 → 인(2)
  // 05:30-07:29 → 묘(3)
  // 07:30-09:29 → 진(4)
  // 09:30-11:29 → 사(5)
  // 11:30-13:29 → 오(6)
  // 13:30-15:29 → 미(7)
  // 15:30-17:29 → 신(8)
  // 17:30-19:29 → 유(9)
  // 19:30-21:29 → 술(10)
  // 21:30-23:29 → 해(11)
  
  const totalMin = hour * 60 + minute;
  return Math.floor(((totalMin + 30) % 1440) / 120);
}

// ================================================================
// 월지 계산 (절기 기준) - jeolgi.ts의 데이터 사용
// ================================================================

export function getMonthBranch(year: number, month: number, day: number, hour: number = 0): Branch {
  // Create a UTC date from the input
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  
  // Get month branch index from solar term data
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
}

/**
 * 진태양시 계산
 * @param year 연도
 * @param month 월
 * @param day 일
 * @param hour 시
 * @param minute 분
 * @param actualLongitude 실제 경도 (도시의 경도)
 * @param standardMeridian 표준 자오선 경도 (타임존 * 15)
 */
export function getSolarTime(
  year: number, month: number, day: number, 
  hour: number, minute: number,
  actualLongitude: number, standardMeridian: number
): SolarTimeResult {
  // 경도 차이에 따른 시간 보정 (1도 = 4분)
  const correctionMinutes = Math.round((actualLongitude - standardMeridian) * 4);
  
  // Date 객체로 시간 계산
  const localDate = new Date(year, month - 1, day, hour, minute, 0);
  localDate.setMinutes(localDate.getMinutes() + correctionMinutes);
  
  return {
    year: localDate.getFullYear(),
    month: localDate.getMonth() + 1,
    day: localDate.getDate(),
    hour: localDate.getHours(),
    minute: localDate.getMinutes(),
    correctionMinutes
  };
}

// ================================================================
// 일주 계산 (60갑자) - 원본: 1984-01-31 기준일 (갑자일)
// ================================================================

export function getDayPillar(year: number, month: number, day: number): Pillar {
  // 기준일: 1984-01-31 = 갑자일(甲子日, index 0) - 원본 free.gs 기준
  const baseDate = new Date(Date.UTC(1984, 0, 31)); // 1984-01-31 = 갑자일
  const baseIndex = 0; // 갑자 = 0번 인덱스
  
  const targetDate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = Math.round((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const index = ((diffDays % 60) + 60) % 60;
  const pillar = SIXTY_JIAZI[index];
  
  console.log('[v0] Day pillar calc:', year, month, day, '-> diffDays:', diffDays, '-> index:', index, '-> pillar:', pillar);

  return {
    stem: pillar[0] as Stem,
    branch: pillar[1] as Branch,
    fullPillar: pillar
  };
}

// ================================================================
// 연주 계산
// ================================================================

export function getYearPillar(year: number, month: number, day: number, hour: number = 0): Pillar {
  // 입춘 기준으로 연도 결정 - jeolgi.ts 사용
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const actualYear = getSajuYear(utcDate);

  // 1984년 = 갑자년 (index 0)
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
  
  // jeolgi.ts의 getMonthStem 사용
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

export function getHourPillar(dayStem: Stem, hour: number, minute: number = 0): Pillar | null {
  if (hour < 0 || hour > 23) return null;
  
  const branchIndex = getHourBranchIndex(hour, minute);
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
  const { year, month, day, hour, minute, country, skipDSTCorrection } = birthInfo;

  // 타임존 정보 가져오기
  const tz = TIMEZONE_OFFSETS[country] || DEFAULT_TIMEZONE;
  
  // 시간 모를 경우 정오 기준
  const localHour = hour ?? 12;
  const localMinute = minute ?? 0;
  
  let stdYear: number, stdMonth: number, stdDay: number, stdHour: number, stdMinute: number;
  let utcYear: number, utcMonth: number, utcDay: number, utcHour: number, utcMinute: number;
  let isDST = false;
  
  if (skipDSTCorrection) {
    // 섬머타임 보정 건너뛰기: 입력된 시간이 이미 표준시인 경우 (기존 Sajume 데이터)
    stdYear = year;
    stdMonth = month;
    stdDay = day;
    stdHour = localHour;
    stdMinute = localMinute;
    
    // 표준시에서 UTC로 변환 (고정 오프셋 사용)
    const stdDate = new Date(year, month - 1, day, localHour, localMinute, 0);
    const utcTime = stdDate.getTime() - (tz.offset * 60 * 60 * 1000);
    const utcDateObj = new Date(utcTime);
    utcYear = utcDateObj.getUTCFullYear();
    utcMonth = utcDateObj.getUTCMonth() + 1;
    utcDay = utcDateObj.getUTCDate();
    utcHour = utcDateObj.getUTCHours();
    utcMinute = utcDateObj.getUTCMinutes();
  } else {
    // 섬머타임 자동 보정: 사용자가 입력한 현지 시간을 표준시로 변환 (새 서비스)
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
  }
  
  // UTC 시간 (절기 비교용)
  const utcDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute));
  
  console.log('[v0] Birth info:', year, month, day, hour, ':', minute, country, 'skipDST:', skipDSTCorrection);
  console.log('[v0] DST applied:', isDST);
  console.log('[v0] Standard time:', stdYear, stdMonth, stdDay, stdHour, ':', stdMinute);
  console.log('[v0] UTC date:', utcDate.toISOString());

  // 연주 계산 (입춘 기준 - UTC로 비교)
  const yearPillar = getYearPillar(
    utcDate.getUTCFullYear(), 
    utcDate.getUTCMonth() + 1, 
    utcDate.getUTCDate(), 
    utcDate.getUTCHours()
  );

  // 월지 계산 (절기 기준 - UTC로 비교)
  const monthBranch = getMonthBranch(
    utcDate.getUTCFullYear(), 
    utcDate.getUTCMonth() + 1, 
    utcDate.getUTCDate(), 
    utcDate.getUTCHours()
  );

  // 월주 계산
  const monthPillar = getMonthPillar(yearPillar.stem, monthBranch);

  // 진태양시 계산 (경도 기반 시간 보정)
  // 원본 free.gs: 진태양시를 계산한 후 그 날짜/시간으로 일주와 시주를 계산
  const standardMeridian = tz.offset * 15; // 표준 자오선 경도
  const actualLongitude = tz.meridian; // 실제 도시 경도
  
  const solarTime = getSolarTime(
    stdYear, stdMonth, stdDay, stdHour, stdMinute,
    actualLongitude, standardMeridian
  );
  
  console.log('[v0] Solar time correction:', solarTime.correctionMinutes, 'min');
  console.log('[v0] Solar time:', solarTime.year, solarTime.month, solarTime.day, solarTime.hour, ':', solarTime.minute);
  
  // 야자시 보정: 23시 이후는 다음날로 (일주 계산용) - 진태양시 기준
  let dayCalcYear = solarTime.year;
  let dayCalcMonth = solarTime.month;
  let dayCalcDay = solarTime.day;
  
  if (solarTime.hour >= 23) {
    const nextDate = new Date(solarTime.year, solarTime.month - 1, solarTime.day + 1);
    dayCalcYear = nextDate.getFullYear();
    dayCalcMonth = nextDate.getMonth() + 1;
    dayCalcDay = nextDate.getDate();
  }

  // 일주 계산 (진태양시 날짜 기준, 야자시 보정 적용)
  const dayPillar = getDayPillar(dayCalcYear, dayCalcMonth, dayCalcDay);

  // 시주 계산 (진태양시 기준 + 분 단위 적용)
  // 원본 공식: totalMin + 30분 offset -> 시간대 경계를 23:30, 01:30, 03:30... 으로 조정
  let hourPillar: Pillar | null = null;
  if (hour !== undefined) {
    hourPillar = getHourPillar(dayPillar.stem, solarTime.hour, solarTime.minute);
    console.log('[v0] Hour pillar (solar time):', solarTime.hour, ':', solarTime.minute, '->', hourPillar?.fullPillar);
  }

  console.log('[v0] Calculated pillars:');
  console.log('[v0]   Year:', yearPillar.fullPillar);
  console.log('[v0]   Month:', monthPillar.fullPillar);
  console.log('[v0]   Day:', dayPillar.fullPillar);
  console.log('[v0]   Hour:', hourPillar?.fullPillar ?? 'none');

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };
}

// ================================================================
// 오행 개수 계산
// ================================================================

export function countElements(fourPillars: FourPillars, includeHiddenStems: boolean = true): ElementCount {
  const count: ElementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  const pillars = [fourPillars.year, fourPillars.month, fourPillars.day];
  if (fourPillars.hour) pillars.push(fourPillars.hour);

  for (const pillar of pillars) {
    // 천간 오행
    const stemElement = STEM_TO_ELEMENT[pillar.stem];
    count[stemElement]++;

    // 지지 오행
    const branchElement = BRANCH_TO_ELEMENT[pillar.branch];
    count[branchElement]++;

    // 장간 오행
    if (includeHiddenStems) {
      const hiddenStems = HIDDEN_STEMS[pillar.branch];
      for (const hs of hiddenStems) {
        const hsElement = STEM_TO_ELEMENT[hs];
        count[hsElement] += 0.5; // 장간은 0.5 가중치
      }
    }
  }

  return count;
}

// ================================================================
// 십성 계산
// ================================================================

export function calculateTenGods(fourPillars: FourPillars): { present: string[]; missing: string[]; details: TenGodResult[] } {
  const dayStem = fourPillars.day.stem;
  const details: TenGodResult[] = [];
  const presentSet = new Set<string>();

  // 연간
  const yearTenGod = TEN_GODS_TABLE[dayStem][fourPillars.year.stem];
  details.push({ position: "연간", stem: fourPillars.year.stem, tenGod: yearTenGod });
  presentSet.add(yearTenGod);

  // 월간
  const monthTenGod = TEN_GODS_TABLE[dayStem][fourPillars.month.stem];
  details.push({ position: "월간", stem: fourPillars.month.stem, tenGod: monthTenGod });
  presentSet.add(monthTenGod);

  // 시간 (있는 경우)
  if (fourPillars.hour) {
    const hourTenGod = TEN_GODS_TABLE[dayStem][fourPillars.hour.stem];
    details.push({ position: "시간", stem: fourPillars.hour.stem, tenGod: hourTenGod });
    presentSet.add(hourTenGod);
  }

  // 지지 장간에서 십성
  const branches = [
    { pos: "연지", branch: fourPillars.year.branch },
    { pos: "월지", branch: fourPillars.month.branch },
    { pos: "일지", branch: fourPillars.day.branch },
  ];
  if (fourPillars.hour) {
    branches.push({ pos: "시지", branch: fourPillars.hour.branch });
  }

  for (const { pos, branch } of branches) {
    const hidden = HIDDEN_STEMS[branch];
    for (const hs of hidden) {
      const tenGod = TEN_GODS_TABLE[dayStem][hs];
      presentSet.add(tenGod);
    }
  }

  const allTenGods = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
  const present = Array.from(presentSet);
  const missing = allTenGods.filter(tg => !presentSet.has(tg));

  return { present, missing, details };
}

// ================================================================
// 신살 계산
// ================================================================

// 도화���
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

// 역마살
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

// 화개살
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

// 괴강살
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
  
  // 양남음녀 순행, 음남양녀 역행
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

  // 신살 계산
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

  // 대운
  const daewoon = calculateDaeWoon(fourPillars, birthInfo.gender, birthInfo.year);

  // 연운
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
