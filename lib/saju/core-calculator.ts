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
  // 진태양시 보정이 이미 경도 기반으로 적용되므로 +30분 offset 불필요
  // 정시 기준: 자시(23:00-01:00), 축시(01:00-03:00), ...
  const totalMin = hour * 60 + minute;
  
  // 23:00 이후는 자시(0)
  if (totalMin >= 1380) return 0; // 23:00~23:59
  if (totalMin < 60) return 0;    // 00:00~00:59
  
  // 01:00부터 2시간 단위
  return Math.floor((totalMin - 60) / 120) + 1;
}

// ================================================================
// 월지 계산 (절기 기준)
// ================================================================

export function getMonthBranch(year: number, month: number, day: number, hour: number = 0): Branch {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
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

export function calcSolarTime(
  year: number, month: number, day: number, 
  hour: number, minute: number,
  actualLongitude: number, standardMeridian: number
): SolarTimeResult {
  const correctionMinutes = Math.round((actualLongitude - standardMeridian) * 4);
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

export function getYearPillar(year: number, month: number, day: number, hour: number = 0): Pillar {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
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
  const tz = TIMEZONE_OFFSETS[country] || DEFAULT_TIMEZONE;
  
  const localHour = hour ?? 12;
  const localMinute = minute ?? 0;
  
  let stdYear: number, stdMonth: number, stdDay: number, stdHour: number, stdMinute: number;
  let utcYear: number, utcMonth: number, utcDay: number, utcHour: number, utcMinute: number;
  let isDST = false;
  
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
  }
  
  const utcDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute));

  // 연주
  const yearPillar = getYearPillar(
    utcDate.getUTCFullYear(), 
    utcDate.getUTCMonth() + 1, 
    utcDate.getUTCDate(), 
    utcDate.getUTCHours()
  );

  // 월주
  const monthBranch = getMonthBranch(
    utcDate.getUTCFullYear(), 
    utcDate.getUTCMonth() + 1, 
    utcDate.getUTCDate(), 
    utcDate.getUTCHours()
  );
  const monthPillar = getMonthPillar(yearPillar.stem, monthBranch);

  // 진태양시
  const standardMeridian = tz.offset * 15;
  const actualLongitude = tz.meridian;
  
  const solarTime = calcSolarTime(
    stdYear, stdMonth, stdDay, stdHour, stdMinute,
    actualLongitude, standardMeridian
  );
  
  // 야자시 보정
  let dayCalcYear = solarTime.year;
  let dayCalcMonth = solarTime.month;
  let dayCalcDay = solarTime.day;
  
  if (solarTime.hour >= 23) {
    const nextDate = new Date(solarTime.year, solarTime.month - 1, solarTime.day + 1);
    dayCalcYear = nextDate.getFullYear();
    dayCalcMonth = nextDate.getMonth() + 1;
    dayCalcDay = nextDate.getDate();
  }

  // 일주
  const dayPillar = getDayPillar(dayCalcYear, dayCalcMonth, dayCalcDay);

  // 시주
  let hourPillar: Pillar | null = null;
  if (hour !== undefined) {
    hourPillar = getHourPillar(dayPillar.stem, solarTime.hour, solarTime.minute);
  }

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar
  };
}

// ================================================================
// 오행 점수 계산 (수치론 점수 방식)
// 천간: 각 10점, 지지: 연지 10점, 월지 30점, 일지 20점, 시지 20점
// 지장간(숨겨진 천간)은 사용 안함, 총 120점
// ================================================================

export function calculateElementScores(fourPillars: FourPillars): ElementCount {
  const scores: ElementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

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

  // 지지 점수 (연지 10점, 월지 30점, 일지 20점, 시지 20점)
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

export function calculateTenGods(fourPillars: FourPillars): { present: string[]; missing: string[]; details: TenGodResult[] } {
  const dayStem = fourPillars.day.stem;
  const details: TenGodResult[] = [];
  const presentSet = new Set<string>();

  const yearTenGod = TEN_GODS_TABLE[dayStem][fourPillars.year.stem];
  details.push({ position: "연간", stem: fourPillars.year.stem, tenGod: yearTenGod });
  presentSet.add(yearTenGod);

  const monthTenGod = TEN_GODS_TABLE[dayStem][fourPillars.month.stem];
  details.push({ position: "월간", stem: fourPillars.month.stem, tenGod: monthTenGod });
  presentSet.add(monthTenGod);

  if (fourPillars.hour) {
    const hourTenGod = TEN_GODS_TABLE[dayStem][fourPillars.hour.stem];
    details.push({ position: "시간", stem: fourPillars.hour.stem, tenGod: hourTenGod });
    presentSet.add(hourTenGod);
  }

  const branches = [
    { pos: "연지", branch: fourPillars.year.branch },
    { pos: "월지", branch: fourPillars.month.branch },
    { pos: "일지", branch: fourPillars.day.branch },
  ];
  if (fourPillars.hour) {
    branches.push({ pos: "시지", branch: fourPillars.hour.branch });
  }

  for (const { branch } of branches) {
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
