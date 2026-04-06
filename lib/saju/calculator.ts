// ================================================================
// Saju Calculator - 사주 계산 핵심 로직
// Converted from free.gs + premium.gs
// ================================================================

import {
  STEMS, BRANCHES, STEM_TO_ELEMENT, BRANCH_TO_ELEMENT,
  STEM_YIN_YANG, HIDDEN_STEMS, SIXTY_JIAZI,
  TEN_GODS_TABLE, HOUR_STEM_TABLE, MONTH_STEM_TABLE,
  TIMEZONE_OFFSETS, DEFAULT_TIMEZONE,
  type Stem, type Branch, type Element
} from './constants';

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
}

// ================================================================
// 절기 데이터 (UTC 기준)
// ================================================================

const JEOLGI_TABLE: Record<number, { month: number; day: number; hour: number }[]> = {
  // 24절기 중 12절기만 사용 (월 전환 기준)
  // 입춘(2월), 경칩(3월), 청명(4월), 입하(5월), 망종(6월), 소서(7월)
  // 입추(8월), 백로(9월), 한로(10월), 입동(11월), 대설(12월), 소한(1월)
  2024: [
    { month: 2, day: 4, hour: 4 },   // 입춘 - 인월 시작
    { month: 3, day: 5, hour: 10 },  // 경칩 - 묘월 시작
    { month: 4, day: 4, hour: 15 },  // 청명 - 진월 시작
    { month: 5, day: 5, hour: 8 },   // 입하 - 사월 시작
    { month: 6, day: 5, hour: 12 },  // 망종 - 오월 시작
    { month: 7, day: 6, hour: 22 },  // 소서 - 미월 시작
    { month: 8, day: 7, hour: 8 },   // 입추 - 신월 시작
    { month: 9, day: 7, hour: 11 },  // 백로 - 유월 시작
    { month: 10, day: 8, hour: 3 },  // 한로 - 술월 시작
    { month: 11, day: 7, hour: 6 },  // 입동 - 해월 시작
    { month: 12, day: 7, hour: 0 },  // 대설 - 자월 시작
    { month: 1, day: 6, hour: 4 },   // 소한 - 축월 시작 (다음해)
  ],
  2025: [
    { month: 2, day: 3, hour: 22 },
    { month: 3, day: 5, hour: 16 },
    { month: 4, day: 4, hour: 21 },
    { month: 5, day: 5, hour: 14 },
    { month: 6, day: 5, hour: 18 },
    { month: 7, day: 7, hour: 4 },
    { month: 8, day: 7, hour: 14 },
    { month: 9, day: 7, hour: 17 },
    { month: 10, day: 8, hour: 9 },
    { month: 11, day: 7, hour: 12 },
    { month: 12, day: 7, hour: 6 },
    { month: 1, day: 5, hour: 10 },
  ],
  2026: [
    { month: 2, day: 4, hour: 4 },
    { month: 3, day: 5, hour: 22 },
    { month: 4, day: 5, hour: 3 },
    { month: 5, day: 5, hour: 20 },
    { month: 6, day: 6, hour: 0 },
    { month: 7, day: 7, hour: 10 },
    { month: 8, day: 7, hour: 20 },
    { month: 9, day: 7, hour: 23 },
    { month: 10, day: 8, hour: 15 },
    { month: 11, day: 7, hour: 18 },
    { month: 12, day: 7, hour: 12 },
    { month: 1, day: 5, hour: 16 },
  ],
};

// 기본 절기 (연도 데이터 없을 경우)
const DEFAULT_JEOLGI = [
  { month: 2, day: 4, hour: 4 },
  { month: 3, day: 6, hour: 0 },
  { month: 4, day: 5, hour: 0 },
  { month: 5, day: 6, hour: 0 },
  { month: 6, day: 6, hour: 0 },
  { month: 7, day: 7, hour: 0 },
  { month: 8, day: 8, hour: 0 },
  { month: 9, day: 8, hour: 0 },
  { month: 10, day: 8, hour: 0 },
  { month: 11, day: 7, hour: 0 },
  { month: 12, day: 7, hour: 0 },
  { month: 1, day: 6, hour: 0 },
];

// ================================================================
// 진태양시 계산
// ================================================================

export function getSolarTime(
  hour: number,
  minute: number,
  longitude: number,
  timezoneOffset: number
): { hour: number; minute: number } {
  // 경도 보정: 표준 자오선과의 차이를 분으로 변환
  const meridian = timezoneOffset * 15; // 표준 자오선
  const longitudeDiff = longitude - meridian;
  const timeCorrectionMinutes = longitudeDiff * 4; // 1도당 4분

  let totalMinutes = hour * 60 + minute + timeCorrectionMinutes;
  
  // 24시간 범위로 정규화
  while (totalMinutes < 0) totalMinutes += 1440;
  while (totalMinutes >= 1440) totalMinutes -= 1440;

  return {
    hour: Math.floor(totalMinutes / 60),
    minute: Math.floor(totalMinutes % 60)
  };
}

// ================================================================
// 시간을 지지 인덱스로 변환
// ================================================================

export function getHourBranchIndex(hour: number): number {
  // 23:00-00:59 → 자(0), 01:00-02:59 → 축(1), ...
  if (hour === 23) return 0; // 자시 (야자시)
  return Math.floor((hour + 1) / 2) % 12;
}

// ================================================================
// 월지 계산 (절기 기준)
// ================================================================

export function getMonthBranch(year: number, month: number, day: number, hour: number = 0): Branch {
  const jeolgi = JEOLGI_TABLE[year] || DEFAULT_JEOLGI;
  
  // 인(寅)월부터 시작: 인(2), 묘(3), 진(4), 사(5), 오(6), 미(7), 신(8), 유(9), 술(10), 해(11), 자(12), 축(1)
  const branchOrder: Branch[] = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"];
  
  for (let i = 0; i < jeolgi.length; i++) {
    const j = jeolgi[i];
    const jMonth = j.month;
    const jDay = j.day;
    const jHour = j.hour;

    if (month === jMonth) {
      if (day < jDay || (day === jDay && hour < jHour)) {
        // 절기 전
        return branchOrder[(i - 1 + 12) % 12];
      }
    }
  }

  // 현재 월의 절기를 찾아서 해당 월지 반환
  for (let i = 0; i < jeolgi.length; i++) {
    if (jeolgi[i].month === month) {
      return branchOrder[i];
    }
  }

  // 기본값
  return branchOrder[(month + 10) % 12];
}

// ================================================================
// 일주 계산 (60갑자)
// ================================================================

export function getDayPillar(year: number, month: number, day: number): Pillar {
  // 기준일: 1900년 1월 1일 = 갑진일 (index 40)
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const index = ((diffDays % 60) + 60 + 40) % 60;
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
  // 입춘 기준으로 연도 결정
  const jeolgi = JEOLGI_TABLE[year] || DEFAULT_JEOLGI;
  const ipchun = jeolgi[0]; // 입춘
  
  let actualYear = year;
  if (month < ipchun.month || (month === ipchun.month && (day < ipchun.day || (day === ipchun.day && hour < ipchun.hour)))) {
    actualYear = year - 1;
  }

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
  const branchIndex = BRANCHES.indexOf(monthBranch);
  const monthStemTable = MONTH_STEM_TABLE[yearStem];
  const monthStem = monthStemTable[branchIndex];

  return {
    stem: monthStem,
    branch: monthBranch,
    fullPillar: `${monthStem}${monthBranch}`
  };
}

// ================================================================
// 시주 계산
// ================================================================

export function getHourPillar(dayStem: Stem, hour: number): Pillar | null {
  if (hour < 0 || hour > 23) return null;

  const branchIndex = getHourBranchIndex(hour);
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
  const { year, month, day, hour, minute, country } = birthInfo;

  // 타임존 정보 가져오기
  const tz = TIMEZONE_OFFSETS[country] || DEFAULT_TIMEZONE;
  
  // 진태양시 계산 (시간 정보가 있는 경우)
  let solarHour = hour ?? -1;
  if (hour !== undefined && minute !== undefined && birthInfo.longitude) {
    const solarTime = getSolarTime(hour, minute, birthInfo.longitude, tz.offset);
    solarHour = solarTime.hour;
  }

  // 야자시 보정: 23시 이후는 다음날로
  let adjustedYear = year;
  let adjustedMonth = month;
  let adjustedDay = day;
  
  if (solarHour === 23 || (hour !== undefined && hour >= 23)) {
    const nextDate = new Date(year, month - 1, day + 1);
    adjustedYear = nextDate.getFullYear();
    adjustedMonth = nextDate.getMonth() + 1;
    adjustedDay = nextDate.getDate();
  }

  // 연주 계산
  const yearPillar = getYearPillar(adjustedYear, adjustedMonth, adjustedDay, solarHour >= 0 ? solarHour : 0);

  // 월지 계산
  const monthBranch = getMonthBranch(adjustedYear, adjustedMonth, adjustedDay, solarHour >= 0 ? solarHour : 0);

  // 월주 계산
  const monthPillar = getMonthPillar(yearPillar.stem, monthBranch);

  // 일주 계산
  const dayPillar = getDayPillar(adjustedYear, adjustedMonth, adjustedDay);

  // 시주 계산 (시간 정보가 있는 경우)
  const hourPillar = solarHour >= 0 ? getHourPillar(dayPillar.stem, solarHour) : null;

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

// 도화살
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
