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
