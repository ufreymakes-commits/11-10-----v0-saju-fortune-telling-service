// ================================================================
// Saju Constants - 사주 상수 데이터
// Converted from constant.gs
// ================================================================

// 천간 (10 Heavenly Stems)
export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export type Stem = typeof STEMS[number];

// 지지 (12 Earthly Branches)
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
export type Branch = typeof BRANCHES[number];

// 오행 (Five Elements)
export const ELEMENTS = ["목", "화", "토", "금", "수"] as const;
export type Element = typeof ELEMENTS[number];

// 천간 → 오행 매핑
export const STEM_TO_ELEMENT: Record<Stem, Element> = {
  "갑": "목", "을": "목",
  "병": "화", "정": "화",
  "무": "토", "기": "토",
  "경": "금", "신": "금",
  "임": "수", "계": "수"
};

// 지지 → 오행 매핑
export const BRANCH_TO_ELEMENT: Record<Branch, Element> = {
  "인": "목", "묘": "목",
  "사": "화", "오": "화",
  "진": "토", "술": "토", "축": "토", "미": "토",
  "신": "금", "유": "금",
  "해": "수", "자": "수"
};

// 천간 음양
export const STEM_YIN_YANG: Record<Stem, "양" | "음"> = {
  "갑": "양", "을": "음",
  "병": "양", "정": "음",
  "무": "양", "기": "음",
  "경": "양", "신": "음",
  "임": "양", "계": "음"
};

// 지지 음양
export const BRANCH_YIN_YANG: Record<Branch, "양" | "음"> = {
  "자": "양", "축": "음",
  "인": "양", "묘": "음",
  "진": "양", "사": "음",
  "오": "양", "미": "음",
  "신": "양", "유": "음",
  "술": "양", "해": "음"
};

// 장간 (Hidden Stems in Branches)
export const HIDDEN_STEMS: Record<Branch, Stem[]> = {
  "자": ["계"],
  "축": ["기", "계", "신"],
  "인": ["갑", "병", "무"],
  "묘": ["을"],
  "진": ["무", "을", "계"],
  "사": ["병", "무", "경"],
  "오": ["정", "기"],
  "미": ["기", "정", "을"],
  "신": ["경", "임", "무"],
  "유": ["신"],
  "술": ["무", "신", "정"],
  "해": ["임", "갑"]
};

// 60갑자 (60 Sexagenary Cycle)
export const SIXTY_JIAZI = [
  "갑자","을축","병인","정묘","무진","기사","경오","신미","임신","계유",
  "갑술","을해","병자","정축","무인","기묘","경진","신사","임오","계미",
  "갑신","을유","병술","정해","무자","기축","경인","신묘","임진","계사",
  "갑오","을미","병신","정유","무술","기해","경자","신축","임인","계묘",
  "갑진","을사","병오","정미","무신","기유","경술","신해","임자","계축",
  "갑인","을묘","병진","정사","무오","기미","경신","신유","임술","계해"
] as const;

// 십성 (Ten Gods) 관계표
export const TEN_GODS_TABLE: Record<Stem, Record<Stem, string>> = {
  "갑": {"갑":"비견","을":"겁재","병":"식신","정":"상관","무":"편재","기":"정재","경":"편관","신":"정관","임":"편인","계":"정인"},
  "을": {"갑":"겁재","을":"비견","병":"상관","정":"식신","무":"정재","기":"편재","경":"정관","신":"편관","임":"정인","계":"편인"},
  "병": {"갑":"편인","을":"정인","병":"비견","정":"겁재","무":"식신","기":"상관","경":"편재","신":"정재","임":"편관","계":"정관"},
  "정": {"갑":"정인","을":"편인","병":"겁재","정":"비견","무":"상관","기":"식신","경":"정재","신":"편재","임":"정관","계":"편관"},
  "무": {"갑":"편관","을":"정관","병":"편인","정":"정인","무":"비견","기":"겁재","경":"식신","신":"상관","임":"편재","계":"정재"},
  "기": {"갑":"정관","을":"편관","병":"정인","정":"편인","무":"겁재","기":"비견","경":"상관","신":"식신","임":"정재","계":"편재"},
  "경": {"갑":"편재","을":"정재","병":"편관","정":"정관","무":"편인","기":"정인","경":"비견","신":"겁재","임":"식신","계":"상관"},
  "신": {"갑":"정재","을":"편재","병":"정관","정":"편관","무":"정인","기":"편인","경":"겁재","신":"비견","임":"상관","계":"식신"},
  "임": {"갑":"식신","을":"상관","병":"편재","정":"정재","무":"편관","기":"정관","경":"편인","신":"정인","임":"비견","계":"겁재"},
  "계": {"갑":"상관","을":"식신","병":"정재","정":"편재","무":"정관","기":"편관","경":"정인","신":"편인","임":"겁재","계":"비견"}
};

// 십성 영문 변환
export const TEN_GODS_ENGLISH: Record<string, string> = {
  "비견": "Shoulder to Shoulder (Bi-gyeon)",
  "겁재": "Rob Wealth (Geop-jae)",
  "식신": "Eating God (Sik-sin)",
  "상관": "Hurting Officer (Sang-gwan)",
  "편재": "Indirect Wealth (Pyeon-jae)",
  "정재": "Direct Wealth (Jeong-jae)",
  "편관": "7 Killings (Pyeon-gwan)",
  "정관": "Direct Officer (Jeong-gwan)",
  "편인": "Indirect Seal (Pyeon-in)",
  "정인": "Direct Seal (Jeong-in)"
};

// 천간 발음
export const STEM_PRONUNCIATION: Record<Stem, string> = {
  "갑": "Gap-mok", "을": "Eul-mok",
  "병": "Byeong-hwa", "정": "Jeong-hwa",
  "무": "Mu-to", "기": "Gi-to",
  "경": "Gyeong-geum", "신": "Sin-geum",
  "임": "Im-su", "계": "Gye-su"
};

// 지지 발음
export const BRANCH_PRONUNCIATION: Record<Branch, string> = {
  "자": "Ja", "축": "Chuk", "인": "In", "묘": "Myo",
  "진": "Jin", "사": "Sa", "오": "O", "미": "Mi",
  "신": "Sin", "유": "Yu", "술": "Sul", "해": "Hae"
};

// 오행 영문
export const ELEMENT_ENGLISH: Record<Element, string> = {
  "목": "Wood", "화": "Fire", "토": "Earth", "금": "Metal", "수": "Water"
};

// 한자 변환
export const STEM_HANJA: Record<Stem, string> = {
  "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
  "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸"
};

export const BRANCH_HANJA: Record<Branch, string> = {
  "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
  "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥"
};

export const ELEMENT_HANJA: Record<Element, string> = {
  "목": "木", "화": "火", "토": "土", "금": "金", "수": "水"
};

// 시주 계산용 천간 매핑 (일간 기준)
export const HOUR_STEM_TABLE: Record<Stem, Stem[]> = {
  "갑": ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"],
  "기": ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"],
  "을": ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  "경": ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  "병": ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  "신": ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  "정": ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  "임": ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  "무": ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"],
  "계": ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
};

// 월주 계산용 천간 매핑 (연간 기준)
export const MONTH_STEM_TABLE: Record<Stem, Stem[]> = {
  "갑": ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  "기": ["병", "정", "무", "기", "경", "신", "임", "계", "갑", "을", "병", "정"],
  "을": ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  "경": ["무", "기", "경", "신", "임", "계", "갑", "을", "병", "정", "무", "기"],
  "병": ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  "신": ["경", "신", "임", "계", "갑", "을", "병", "정", "무", "기", "경", "신"],
  "정": ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"],
  "임": ["임", "계", "갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"],
  "무": ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"],
  "계": ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계", "갑", "을"]
};

// 12운성
export const TWELVE_STARS = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
export type TwelveStar = typeof TWELVE_STARS[number];

export const TWELVE_STARS_ENGLISH: Record<TwelveStar, string> = {
  "장생": "Birth (Jang-saeng)",
  "목욕": "Bath (Mok-yok)",
  "관대": "Crown (Gwan-dae)",
  "건록": "Prosperity (Geon-rok)",
  "제왕": "Peak (Je-wang)",
  "쇠": "Decline (Soe)",
  "병": "Illness (Byeong)",
  "사": "Death (Sa)",
  "묘": "Grave (Myo)",
  "절": "Extinction (Jeol)",
  "태": "Conception (Tae)",
  "양": "Nurture (Yang)"
};

// 장생지지 (12운성 계산용)
export const JANG_SAENG_BRANCH: Record<Stem, Branch> = {
  "갑": "해", "을": "오", "병": "인", "정": "유",
  "무": "인", "기": "유", "경": "사", "신": "자", "임": "신", "계": "묘"
};

// 국가별 타임존 데이터
// meridian은 실제 도시/지역의 경도 (진태양시 계산용)
export const TIMEZONE_OFFSETS: Record<string, { offset: number; meridian: number }> = {
  // 미국 (실제 도시 경도)
  "US-NYC": { offset: -5, meridian: -74 },    // 뉴욕 실제 경도
  "US-CHI": { offset: -6, meridian: -87.6 },  // 시카고
  "US-DEN": { offset: -7, meridian: -105 },   // 덴버
  "US-LAX": { offset: -8, meridian: -118 },   // 로스앤젤레스
  "US-ANC": { offset: -9, meridian: -150 },   // 앵커리지
  "US-HNL": { offset: -10, meridian: -158 },  // 호놀룰루
  "US-PPG": { offset: -11, meridian: -170 },  // 파고파고
  "US-SJU": { offset: -4, meridian: -66 },    // 산후안
  "US-GUM": { offset: 10, meridian: 145 },    // 괌
  // 한국
  "KR": { offset: 9, meridian: 127 },         // 서울 실제 경도
  // 일본
  "JP": { offset: 9, meridian: 140 },         // 도쿄 실제 경도
  // 중국
  "CN": { offset: 8, meridian: 116 },         // 베이징 실제 경도
  // 영국
  "GB-LON": { offset: 0, meridian: 0 },
  // 독일
  "DE": { offset: 1, meridian: 15 },
  // 프랑스
  "FR-PAR": { offset: 1, meridian: 15 },
  // 호주
  "AU-SYD": { offset: 10, meridian: 150 },
  "AU-MEL": { offset: 10, meridian: 150 },
  "AU-BRI": { offset: 10, meridian: 150 },
  "AU-PER": { offset: 8, meridian: 120 },
  "AU-ADL": { offset: 9.5, meridian: 142.5 },
  "AU-DAR": { offset: 9.5, meridian: 142.5 },
  // 캐나다
  "CA-YYT": { offset: -3.5, meridian: -52.5 },
  "CA-YHZ": { offset: -4, meridian: -60 },
  "CA-YYZ": { offset: -5, meridian: -75 },
  "CA-YWG": { offset: -6, meridian: -90 },
  "CA-YYC": { offset: -7, meridian: -105 },
  "CA-YVR": { offset: -8, meridian: -120 },
  // 브라질
  "BR-SAO": { offset: -3, meridian: -45 },
  "BR-SSA": { offset: -3, meridian: -45 },  // Salvador
  "BR-POA": { offset: -3, meridian: -45 },  // Porto Alegre
  "BR-BSB": { offset: -3, meridian: -45 },
  "BR-MAO": { offset: -4, meridian: -60 },
  "BR-RBR": { offset: -5, meridian: -75 },
  // 인도 (실제 도시 경도)
  "IN-BOM": { offset: 5.5, meridian: 72.8 },  // 뭄바이
  "IN-DEL": { offset: 5.5, meridian: 77.2 },  // 델리
  "IN-CCU": { offset: 5.5, meridian: 88.4 },  // 콜카타
  // 러시아
  "RU-MOW": { offset: 3, meridian: 45 },
  "RU-SVX": { offset: 5, meridian: 75 },
  "RU-OVB": { offset: 7, meridian: 105 },
  "RU-VVO": { offset: 10, meridian: 150 },
  // 기타 주요 국가 (단일 시간대)
  "AF": { offset: 4.5, meridian: 67.5 },
  "AL": { offset: 1, meridian: 15 },
  "DZ": { offset: 1, meridian: 15 },
  "AD": { offset: 1, meridian: 15 },
  "AO": { offset: 1, meridian: 15 },
  "AG": { offset: -4, meridian: -60 },
  "AR": { offset: -3, meridian: -45 },
  "AM": { offset: 4, meridian: 60 },
  "AT": { offset: 1, meridian: 15 },
  "AZ": { offset: 4, meridian: 60 },
  "BS": { offset: -5, meridian: -75 },
  "BH": { offset: 3, meridian: 45 },
  "BD": { offset: 6, meridian: 90 },
  "BB": { offset: -4, meridian: -60 },
  "BY": { offset: 3, meridian: 45 },
  "BE": { offset: 1, meridian: 15 },
  "BZ": { offset: -6, meridian: -90 },
  "BJ": { offset: 1, meridian: 15 },
  "BT": { offset: 6, meridian: 90 },
  "BO": { offset: -4, meridian: -60 },
  "BA": { offset: 1, meridian: 15 },
  "BW": { offset: 2, meridian: 30 },
  "BN": { offset: 8, meridian: 120 },
  "BG": { offset: 2, meridian: 30 },
  "BF": { offset: 0, meridian: 0 },
  "BI": { offset: 2, meridian: 30 },
  "CV": { offset: -1, meridian: -15 },
  "KH": { offset: 7, meridian: 105 },
  "CM": { offset: 1, meridian: 15 },
  "CF": { offset: 1, meridian: 15 },
  "TD": { offset: 1, meridian: 15 },
  "CL-SCL": { offset: -3, meridian: -45 },
  "CO": { offset: -5, meridian: -75 },
  "KM": { offset: 3, meridian: 45 },
  "CG": { offset: 1, meridian: 15 },
  "CR": { offset: -6, meridian: -90 },
  "HR": { offset: 1, meridian: 15 },
  "CU": { offset: -5, meridian: -75 },
  "CY": { offset: 2, meridian: 30 },
  "CZ": { offset: 1, meridian: 15 },
  "DK-CPH": { offset: 1, meridian: 15 },
  "DJ": { offset: 3, meridian: 45 },
  "DM": { offset: -4, meridian: -60 },
  "DO": { offset: -4, meridian: -60 },
  "EC-UIO": { offset: -5, meridian: -75 },
  "EG": { offset: 2, meridian: 30 },
  "SV": { offset: -6, meridian: -90 },
  "GQ": { offset: 1, meridian: 15 },
  "ER": { offset: 3, meridian: 45 },
  "EE": { offset: 2, meridian: 30 },
  "SZ": { offset: 2, meridian: 30 },
  "ET": { offset: 3, meridian: 45 },
  "FJ": { offset: 12, meridian: 180 },
  "FI": { offset: 2, meridian: 30 },
  "GA": { offset: 1, meridian: 15 },
  "GM": { offset: 0, meridian: 0 },
  "GE": { offset: 4, meridian: 60 },
  "GH": { offset: 0, meridian: 0 },
  "GR": { offset: 2, meridian: 30 },
  "GD": { offset: -4, meridian: -60 },
  "GT": { offset: -6, meridian: -90 },
  "GN": { offset: 0, meridian: 0 },
  "GW": { offset: 0, meridian: 0 },
  "GY": { offset: -4, meridian: -60 },
  "HT": { offset: -5, meridian: -75 },
  "HN": { offset: -6, meridian: -90 },
  "HU": { offset: 1, meridian: 15 },
  "IS": { offset: 0, meridian: 0 },
  "ID-JKT": { offset: 7, meridian: 105 },
  "ID-UPG": { offset: 8, meridian: 120 },
  "ID-DJJ": { offset: 9, meridian: 135 },
  "IR": { offset: 3.5, meridian: 52.5 },
  "IQ": { offset: 3, meridian: 45 },
  "IE": { offset: 0, meridian: 0 },
  "IL": { offset: 2, meridian: 30 },
  "IT": { offset: 1, meridian: 15 },
  "JM": { offset: -5, meridian: -75 },
  "JO": { offset: 2, meridian: 30 },
  "KZ": { offset: 6, meridian: 90 },
  "KE": { offset: 3, meridian: 45 },
  "KI-TRW": { offset: 12, meridian: 180 },
  "KW": { offset: 3, meridian: 45 },
  "KG": { offset: 6, meridian: 90 },
  "LA": { offset: 7, meridian: 105 },
  "LV": { offset: 2, meridian: 30 },
  "LB": { offset: 2, meridian: 30 },
  "LS": { offset: 2, meridian: 30 },
  "LR": { offset: 0, meridian: 0 },
  "LY": { offset: 2, meridian: 30 },
  "LI": { offset: 1, meridian: 15 },
  "LT": { offset: 2, meridian: 30 },
  "LU": { offset: 1, meridian: 15 },
  "MG": { offset: 3, meridian: 45 },
  "MW": { offset: 2, meridian: 30 },
  "MY": { offset: 8, meridian: 120 },
  "MV": { offset: 5, meridian: 75 },
  "ML": { offset: 0, meridian: 0 },
  "MT": { offset: 1, meridian: 15 },
  "MH": { offset: 12, meridian: 180 },
  "MR": { offset: 0, meridian: 0 },
  "MU": { offset: 4, meridian: 60 },
  "MX-MEX": { offset: -6, meridian: -90 },
  "MX-TIJ": { offset: -8, meridian: -120 },
  "MX-CUU": { offset: -7, meridian: -106 },  // 치와와 실제 경도
  "MX-CUN": { offset: -5, meridian: -75 },
  "MD": { offset: 2, meridian: 30 },
  "MC": { offset: 1, meridian: 15 },
  "MN-ULN": { offset: 8, meridian: 120 },
  "ME": { offset: 1, meridian: 15 },
  "MA": { offset: 1, meridian: 15 },
  "MZ": { offset: 2, meridian: 30 },
  "MM": { offset: 6.5, meridian: 97.5 },
  "NA": { offset: 2, meridian: 30 },
  "NR": { offset: 12, meridian: 180 },
  "NP": { offset: 5.75, meridian: 86.25 },
  "NL-AMS": { offset: 1, meridian: 15 },
  "NZ-AKL": { offset: 12, meridian: 180 },
  "NI": { offset: -6, meridian: -90 },
  "NE": { offset: 1, meridian: 15 },
  "NG": { offset: 1, meridian: 15 },
  "KP": { offset: 9, meridian: 135 },
  "MK": { offset: 1, meridian: 15 },
  "NO": { offset: 1, meridian: 15 },
  "OM": { offset: 4, meridian: 60 },
  "PK": { offset: 5, meridian: 75 },
  "PW": { offset: 9, meridian: 135 },
  "PS": { offset: 2, meridian: 30 },
  "PA": { offset: -5, meridian: -75 },
  "PG-POM": { offset: 10, meridian: 150 },
  "PY": { offset: -4, meridian: -60 },
  "PE": { offset: -5, meridian: -75 },
  "PH": { offset: 8, meridian: 121 },  // 마닐라 실제 경도
  "PL": { offset: 1, meridian: 15 },
  "PT-LIS": { offset: 0, meridian: 0 },
  "QA": { offset: 3, meridian: 45 },
  "RO": { offset: 2, meridian: 30 },
  "RW": { offset: 2, meridian: 30 },
  "KN": { offset: -4, meridian: -60 },
  "LC": { offset: -4, meridian: -60 },
  "VC": { offset: -4, meridian: -60 },
  "WS": { offset: 13, meridian: 195 },
  "SM": { offset: 1, meridian: 15 },
  "ST": { offset: 0, meridian: 0 },
  "SA": { offset: 3, meridian: 45 },
  "SN": { offset: 0, meridian: 0 },
  "RS": { offset: 1, meridian: 15 },
  "SC": { offset: 4, meridian: 60 },
  "SL": { offset: 0, meridian: 0 },
  "SG": { offset: 8, meridian: 120 },
  "SK": { offset: 1, meridian: 15 },
  "SI": { offset: 1, meridian: 15 },
  "SB": { offset: 11, meridian: 165 },
  "SO": { offset: 3, meridian: 45 },
  "ZA-JNB": { offset: 2, meridian: 30 },
  "SS": { offset: 2, meridian: 30 },
  "ES-MAD": { offset: 1, meridian: 15 },
  "LK": { offset: 5.5, meridian: 82.5 },
  "SD": { offset: 2, meridian: 30 },
  "SR": { offset: -3, meridian: -45 },
  "SE": { offset: 1, meridian: 15 },
  "CH": { offset: 1, meridian: 15 },
  "SY": { offset: 2, meridian: 30 },
  "TW": { offset: 8, meridian: 120 },
  "TJ": { offset: 5, meridian: 75 },
  "TZ": { offset: 3, meridian: 45 },
  "TH": { offset: 7, meridian: 105 },
  "TL": { offset: 9, meridian: 135 },
  "TG": { offset: 0, meridian: 0 },
  "TO": { offset: 13, meridian: 195 },
  "TT": { offset: -4, meridian: -60 },
  "TN": { offset: 1, meridian: 15 },
  "TR": { offset: 3, meridian: 45 },
  "TM": { offset: 5, meridian: 75 },
  "TV": { offset: 12, meridian: 180 },
  "UG": { offset: 3, meridian: 45 },
  "UA": { offset: 2, meridian: 30 },
  "AE": { offset: 4, meridian: 60 },
  "UY": { offset: -3, meridian: -45 },
  "UZ": { offset: 5, meridian: 75 },
  "VU": { offset: 11, meridian: 165 },
  "VA": { offset: 1, meridian: 15 },
  "VE": { offset: -4, meridian: -60 },
  "VN": { offset: 7, meridian: 106 },  // 호치민 실제 경도
  // 인도네시아
  "ID-JKT": { offset: 7, meridian: 107 },  // 자카르타 실제 경도
  "ID-UPG": { offset: 8, meridian: 120 },  // Makassar (WITA)
  "ID-DJJ": { offset: 9, meridian: 135 },  // Jayapura (WIT)
  "YE": { offset: 3, meridian: 45 },
  "ZM": { offset: 2, meridian: 30 },
  "ZW": { offset: 2, meridian: 30 }
};

// 기본 타임존 (매칭 못 찾을 경우)
export const DEFAULT_TIMEZONE = { offset: 0, meridian: 0 };
