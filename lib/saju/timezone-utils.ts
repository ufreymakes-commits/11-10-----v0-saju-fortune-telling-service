/**
 * 타임존 유틸리티 함수
 * 
 * Luxon을 사용하여 섬머타임(DST) 자동 보정 처리
 * - 사용자가 입력한 현지 시간을 자동으로 표준시로 변환
 * - 진태양시 계산은 기존 경도(meridian) 기반 로직 유지
 */

import { DateTime } from 'luxon';
import { getIanaTimezone } from './timezone-iana';
import { TIMEZONE_OFFSETS, DEFAULT_TIMEZONE } from './constants';

export interface ConvertedTime {
  // UTC 기준 시간
  utcYear: number;
  utcMonth: number;
  utcDay: number;
  utcHour: number;
  utcMinute: number;
  
  // 표준시 기준 시간 (섬머타임 보정 후)
  standardYear: number;
  standardMonth: number;
  standardDay: number;
  standardHour: number;
  standardMinute: number;
  
  // 섬머타임 정보
  isDST: boolean;
  dstOffsetMinutes: number; // 섬머타임으로 인한 추가 오프셋 (분)
  
  // 경도 (진태양시 계산용)
  meridian: number;
  
  // 표준 오프셋 (시간)
  standardOffset: number;
}

/**
 * 현지 시간을 UTC 및 표준시로 변환 (섬머타임 자동 보정)
 * 
 * @param year 연도
 * @param month 월 (1-12)
 * @param day 일
 * @param hour 시 (0-23)
 * @param minute 분 (0-59)
 * @param countryCode 국가 코드 (예: "US-LAX", "KR")
 * @returns 변환된 시간 정보
 */
// DST가 없는 국가/지역 목록 (1988년 이후 한국 등)
const NO_DST_COUNTRIES = ['KR', 'JP', 'CN', 'SG', 'HK', 'TW', 'TH', 'VN', 'PH', 'MY', 'ID-JKT', 'ID-UPG', 'ID-DJJ'];

export function convertToStandardTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  countryCode: string
): ConvertedTime {
  const ianaZone = getIanaTimezone(countryCode);
  const tzData = TIMEZONE_OFFSETS[countryCode] || DEFAULT_TIMEZONE;
  
  // DST가 없는 국가는 바로 폴백 (섬머타임 보정 없이 그대로)
  if (NO_DST_COUNTRIES.includes(countryCode)) {
    return fallbackConversion(year, month, day, hour, minute, tzData);
  }
  
  // IANA 타임존이 있으면 Luxon으로 정확한 변환
  if (ianaZone) {
    try {
      // 현지 시간으로 DateTime 생성
      const localDt = DateTime.fromObject(
        { year, month, day, hour, minute, second: 0 },
        { zone: ianaZone }
      );
      
      if (!localDt.isValid) {
        // 유효하지 않은 날짜 (예: 섬머타임 전환 시 건너뛴 시간)
        // 기본 오프셋 방식으로 폴백
        return fallbackConversion(year, month, day, hour, minute, tzData);
      }
      
      // 섬머타임 여부 확인
      const isDST = localDt.isInDST;
      
      // 표준 오프셋과 실제 오프셋 차이 계산
      // Luxon의 offset은 분 단위, 음수는 UTC보다 서쪽
      const actualOffsetMinutes = localDt.offset;
      const standardOffsetMinutes = tzData.offset * 60;
      const dstOffsetMinutes = actualOffsetMinutes - standardOffsetMinutes;
      
      // UTC로 변환
      const utcDt = localDt.toUTC();
      
      // 표준시로 변환 (섬머타임 보정 제거)
      // 표준시 = UTC + 표준오프셋
      const standardDt = utcDt.plus({ minutes: standardOffsetMinutes });
      
      return {
        utcYear: utcDt.year,
        utcMonth: utcDt.month,
        utcDay: utcDt.day,
        utcHour: utcDt.hour,
        utcMinute: utcDt.minute,
        
        standardYear: standardDt.year,
        standardMonth: standardDt.month,
        standardDay: standardDt.day,
        standardHour: standardDt.hour,
        standardMinute: standardDt.minute,
        
        isDST,
        dstOffsetMinutes,
        meridian: tzData.meridian,
        standardOffset: tzData.offset
      };
    } catch (error) {
      console.error('[v0] Luxon conversion error:', error);
      return fallbackConversion(year, month, day, hour, minute, tzData);
    }
  }
  
  // IANA 타임존이 없으면 기존 방식 사용
  return fallbackConversion(year, month, day, hour, minute, tzData);
}

/**
 * 폴백 변환 (IANA 타임존 없을 때)
 * 기존 고정 오프셋 방식 사용 - 섬머타임 미적용
 */
function fallbackConversion(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tzData: { offset: number; meridian: number }
): ConvertedTime {
  // UTC 계산
  const localMinutes = year * 525600 + month * 43800 + day * 1440 + hour * 60 + minute;
  const offsetMinutes = tzData.offset * 60;
  
  // 간단한 UTC 변환 (Date 객체 사용)
  const localDate = new Date(year, month - 1, day, hour, minute, 0);
  const utcTime = localDate.getTime() - offsetMinutes * 60 * 1000;
  const utcDate = new Date(utcTime);
  
  return {
    utcYear: utcDate.getUTCFullYear(),
    utcMonth: utcDate.getUTCMonth() + 1,
    utcDay: utcDate.getUTCDate(),
    utcHour: utcDate.getUTCHours(),
    utcMinute: utcDate.getUTCMinutes(),
    
    // 표준시 = 현지시간 (섬머타임 없음)
    standardYear: year,
    standardMonth: month,
    standardDay: day,
    standardHour: hour,
    standardMinute: minute,
    
    isDST: false,
    dstOffsetMinutes: 0,
    meridian: tzData.meridian,
    standardOffset: tzData.offset
  };
}

/**
 * 섬머타임이 적용되는 국가/기간인지 확인
 * 
 * @param year 연도
 * @param month 월
 * @param day 일
 * @param countryCode 국가 코드
 * @returns 섬머타임 적용 여부
 */
export function isDaylightSavingTime(
  year: number,
  month: number,
  day: number,
  countryCode: string
): boolean {
  const ianaZone = getIanaTimezone(countryCode);
  if (!ianaZone) return false;
  
  try {
    const dt = DateTime.fromObject(
      { year, month, day, hour: 12 },
      { zone: ianaZone }
    );
    return dt.isInDST;
  } catch {
    return false;
  }
}

/**
 * 특정 연도의 섬머타임 시작/종료 날짜 조회
 * 
 * @param year 연도
 * @param countryCode 국가 코드
 * @returns 섬머타임 시작/종료 정보 또는 null
 */
export function getDSTTransitions(
  year: number,
  countryCode: string
): { start: Date | null; end: Date | null } | null {
  const ianaZone = getIanaTimezone(countryCode);
  if (!ianaZone) return null;
  
  try {
    // 해당 연도의 매월 1일 체크해서 DST 전환점 찾기
    let start: Date | null = null;
    let end: Date | null = null;
    let prevIsDST = false;
    
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = DateTime.fromObject({ year, month }, { zone: ianaZone }).daysInMonth || 31;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dt = DateTime.fromObject({ year, month, day, hour: 12 }, { zone: ianaZone });
        const isDST = dt.isInDST;
        
        if (month === 1 && day === 1) {
          prevIsDST = isDST;
          continue;
        }
        
        if (isDST !== prevIsDST) {
          if (isDST) {
            start = dt.toJSDate();
          } else {
            end = dt.toJSDate();
          }
          prevIsDST = isDST;
        }
      }
    }
    
    return { start, end };
  } catch {
    return null;
  }
}

/**
 * 균시차(Equation of Time) 계산
 * 
 * 균시차는 평균태양시와 진태양시의 차이입니다.
 * 지구 궤도의 이심률과 자전축 경사로 인해 발생하며,
 * 연중 약 -14분 ~ +16분 범위로 변화합니다.
 * 
 * @param year 연도
 * @param month 월 (1-12)
 * @param day 일
 * @returns 균시차 (분 단위, 양수면 진태양시가 평균태양시보다 빠름)
 */
export function calculateEquationOfTime(year: number, month: number, day: number): number {
  // 연초부터의 일수 계산 (1월 1일 = 1)
  const startOfYear = new Date(year, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const dayOfYear = Math.floor((targetDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // B 값 계산 (라디안)
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  
  // 균시차 공식 (Spencer, 1971)
  // 결과는 분 단위
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  
  return EoT;
}

/**
 * 경도 보정값 계산
 * 
 * 표준 자오선과 실제 위치의 경도 차이를 시간으로 변환합니다.
 * 경도 1도 = 4분의 시간 차이
 * 
 * @param actualLongitude 실제 경도 (동경 양수, 서경 음수)
 * @param standardMeridian 표준 자오선 경도 (예: 한국 135, 미국 동부 -75)
 * @returns 경도 보정값 (분 단위)
 */
export function calculateLongitudeCorrection(actualLongitude: number, standardMeridian: number): number {
  // 경도 차이 (도)
  const longitudeDifference = actualLongitude - standardMeridian;
  
  // 경도 1도 = 4분
  return longitudeDifference * 4;
}

/**
 * 진태양시(True Solar Time / Local Apparent Time) 계산
 * 
 * 진태양시는 해당 위치에서 태양이 실제로 보이는 위치를 기준으로 한 시간입니다.
 * 사주(四柱) 계산에서 가장 정확한 시간 기준으로 사용됩니다.
 * 
 * 진태양시 = 지방평균시(LMT) + 균시차(EoT)
 * 지방평균시 = 표준시 + 경도보정
 * 
 * @param year 연도
 * @param month 월 (1-12)
 * @param day 일
 * @param hour 시 (0-23)
 * @param minute 분 (0-59)
 * @param actualLongitude 실제 경도
 * @param standardMeridian 표준 자오선 경도
 * @returns 진태양시 정보
 */
export interface TrueSolarTime {
  hour: number;
  minute: number;
  // 전체 보정값 (분)
  totalCorrectionMinutes: number;
  // 경도 보정값 (분)
  longitudeCorrectionMinutes: number;
  // 균시차 (분)
  equationOfTimeMinutes: number;
  // 날짜 변경 여부 (-1: 전날, 0: 같은 날, 1: 다음 날)
  dayChange: number;
  // 변경된 날짜 (날짜 변경 시)
  adjustedYear: number;
  adjustedMonth: number;
  adjustedDay: number;
}

export function calculateTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  actualLongitude: number,
  standardMeridian: number
): TrueSolarTime {
  // 1. 균시차 계산
  const eot = calculateEquationOfTime(year, month, day);
  
  // 2. 경도 보정 계산
  const longitudeCorrection = calculateLongitudeCorrection(actualLongitude, standardMeridian);
  
  // 3. 총 보정값 (분)
  // 진태양시 = 표준시 + 경도보정 + 균시차
  const totalCorrection = longitudeCorrection + eot;
  
  // 4. 보정 적용
  let totalMinutes = hour * 60 + minute + totalCorrection;
  let dayChange = 0;
  
  // 날짜 경계 처리
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayChange = -1;
  } else if (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayChange = 1;
  }
  
  // 날짜 조정
  const baseDate = new Date(year, month - 1, day);
  baseDate.setDate(baseDate.getDate() + dayChange);
  
  const adjustedHour = Math.floor(totalMinutes / 60);
  const adjustedMinute = Math.round(totalMinutes % 60);
  
  return {
    hour: adjustedHour,
    minute: adjustedMinute,
    totalCorrectionMinutes: Math.round(totalCorrection * 10) / 10,
    longitudeCorrectionMinutes: Math.round(longitudeCorrection * 10) / 10,
    equationOfTimeMinutes: Math.round(eot * 10) / 10,
    dayChange,
    adjustedYear: baseDate.getFullYear(),
    adjustedMonth: baseDate.getMonth() + 1,
    adjustedDay: baseDate.getDate()
  };
}

/**
 * IANA 타임존과 경도를 사용한 통합 시간 변환
 * 
 * DST 자동 보정 + 경도 보정 + 균시차를 모두 적용하여
 * 가장 정확한 진태양시를 계산합니다.
 * 
 * @param year 연도
 * @param month 월 (1-12)
 * @param day 일
 * @param hour 시 (0-23)
 * @param minute 분 (0-59)
 * @param ianaTimezone IANA 타임존 (예: "Asia/Seoul", "America/New_York")
 * @param longitude 실제 경도
 * @returns 진태양시 정보
 */
export function convertWithTimezoneAndLongitude(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  ianaTimezone: string,
  longitude: number
): TrueSolarTime & { isDST: boolean; standardTime: ConvertedTime } {
  // 1. Luxon으로 DST 보정된 표준시 얻기
  const dt = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: ianaTimezone }
  );
  
  const isDST = dt.isInDST;
  const offsetMinutes = dt.offset; // 분 단위 (UTC와의 차이)
  
  // 표준 자오선 계산 (오프셋 기반)
  // 오프셋(분) / 60 * 15 = 표준 자오선 경도
  const standardMeridian = (offsetMinutes / 60) * 15;
  
  // 2. 진태양시 계산
  const trueSolar = calculateTrueSolarTime(
    year, month, day, hour, minute,
    longitude,
    standardMeridian
  );
  
  // 3. 기존 ConvertedTime 형식도 함께 반환 (하위 호환성)
  const utcDt = dt.toUTC();
  const standardDt = dt.setZone('UTC').plus({ minutes: offsetMinutes });
  
  const standardTime: ConvertedTime = {
    utcYear: utcDt.year,
    utcMonth: utcDt.month,
    utcDay: utcDt.day,
    utcHour: utcDt.hour,
    utcMinute: utcDt.minute,
    standardYear: year,
    standardMonth: month,
    standardDay: day,
    standardHour: hour,
    standardMinute: minute,
    isDST,
    dstOffsetMinutes: isDST ? 60 : 0,
    meridian: standardMeridian,
    standardOffset: offsetMinutes / 60
  };
  
  return {
    ...trueSolar,
    isDST,
    standardTime
  };
}
