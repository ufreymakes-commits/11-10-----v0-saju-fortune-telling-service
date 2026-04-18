// Sajume Types

export interface BirthInfo {
  name: string
  birthDate: string // YYYY-MM-DD
  birthCountry: string
  birthTime?: string // HH:mm
  gender: 'male' | 'female' | 'other'
  referralSource: string
}

export interface SajuData {
  // 4주 (한자)
  yearPillar: { stem: string; branch: string; fullName?: string; fullNameKorean?: string }
  monthPillar: { stem: string; branch: string; fullName?: string; fullNameKorean?: string }
  dayPillar: { stem: string; branch: string; fullName?: string; fullNameKorean?: string }
  hourPillar?: { stem: string; branch: string; fullName?: string; fullNameKorean?: string }
  
  // 일간
  dayMaster: string
  dayMasterKorean?: string
  
  // 오행 개수 (지장간 미포함 - 천간/지지만)
  elementCountBasic?: { 목: number; 화: number; 토: number; 금: number; 수: number }
  
  // 오행 개수 (지장간 포함 - 잠재적 욕구)
  elementCount?: { 목: number; 화: number; 토: number; 금: number; 수: number }
  
  // 오행 점수 (수치론 120점 - 월령 중심 - 가장 정확)
  elementBalance: { wood: number; fire: number; earth: number; metal: number; water: number }
  elementBalanceKorean?: { 목: number; 화: number; 토: number; 금: number; 수: number }
  dominantElement: string
  
  // 12운성
  twelveStars?: Array<{ position: string; branch: string; star: string }>
  
  // 십신
  tenGods?: { 
    present: string[]
    missing: string[]
    details?: Array<{ position: string; stem: string; tenGod: string }>
    byPosition?: {
      yearStem: string    // 연간 십신
      yearBranch: string  // 연지 십신
      monthStem: string   // 월간 십신
      monthBranch: string // 월지 십신
      dayStem: string     // 일간 십신 (항상 비견)
      dayBranch: string   // 일지 십신
      hourStem: string    // 시간 십신
      hourBranch: string  // 시지 십신
    }
  }
  
  // 관계식
  cheongganHap?: string[]
  jijiYughap?: string[]
  jijiSamhap?: string[]
  jijiBanghap?: string[]
  cheongganChung?: string[]
  jijiChung?: string[]
  hyeong?: string[]
  pa?: string[]
  hae?: string[]
  wonjin?: string[]
  
  // 길성
  gilseong?: { cheonul: string[]; taegeuk: string[] }
  
  // 공망
  gongmang?: string[]
  
  // 신강/신약
  sinGangSinYak?: { grade: string; ratio: number }
  
  // 용신
  eokbuYongsin?: string
  johuYongsin?: string
  
  // 격국
  gyeokguk?: string
  
  // 신살 (기본 목록)
  spirits?: string[]
  
  // 신살 (상세 분석)
  sinsalDetails?: Array<{
    name: string
    positions: string[]
    count: number
    totalPillars: number
    percentage: number
    intensity: number
    isStrong: boolean
    usageGuide: string
  }>
  sinsalSummary?: string
  sinsalCombinedGuide?: string
  
  // 12신살 (연지 기준 - 사회적 성공운)
  twelveSinsal?: {
    year: string  // 연주 12신살 이름 (예: 장성살)
    month: string // 월주 12신살 이름
    day: string   // 일주 12신살 이름
    hour: string  // 시주 12신살 이름
  }
  
  // 하이브리드 12신살 (연지 + 일지 기준 모두 - 100만명 일관성)
  hybridTwelveSinsal?: {
    byYearBranch: {  // 사회적 성공운 (연지 기준)
      year: string
      month: string
      day: string
      hour: string
      description: string
    }
    byDayBranch: {   // 개인적 성향운 (일지 기준)
      year: string
      month: string
      day: string
      hour: string
      description: string
    }
  }
  
  // 대운
  daewoon?: Array<{ startAge: number; endAge: number; stem: string; branch: string; fullName?: string }>
  
  // 연운
  yeonwoon?: Array<{ year: number; stem: string; branch: string; fullName?: string }>
  
  // Deprecated (이전 호환성)
  luckyElement?: string
  personalityType?: string
}

export interface Submission {
  id: string
  name: string
  birth_date: string
  birth_country: string
  birth_time?: string
  gender: string
  referral_source: string
  saju_data?: SajuData
  created_at: string
}

export interface Payment {
  id: string
  submission_id: string
  paypal_order_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}

export interface Report {
  id: string
  submission_id: string
  payment_id?: string
  section_key: string
  facts: Fact[]
  is_free: boolean
  created_at: string
}

export interface Fact {
  id: number
  text: string
  category: string
  title?: string
  isMasked?: boolean
}

// ===== END OF CORE TYPES =====

/**
 * CoreDiagnosisPack: Stage 1의 필수 산출물
 * 모든 9개 InsightBlueprint의 기초가 되는 핵심 진단
 */
export interface CoreDiagnosisPack {
  submissionId: string
  
  // 신강/격/용신 핵심 3지표
  shinGangGrade: string // "Strong" | "Moderate" | "Weak"
  shinGangRatio: number // 0-100
  gapSurvey: {
    // 모든 오행 포함
    woodStatus: 'excess' | 'balanced' | 'deficient'
    fireStatus: 'excess' | 'balanced' | 'deficient'
    earthStatus: 'excess' | 'balanced' | 'deficient'
    metalStatus: 'excess' | 'balanced' | 'deficient'
    waterStatus: 'excess' | 'balanced' | 'deficient'
  }
  
  // 용신 (존재 여부 명시)
  yongsin: {
    exists: boolean // 핵심! 없으면 "용신" 단어 금지
    element?: string
    rationale?: string
    alternatives?: string[] // 용신이 없으면 "차선의 오행" 명시
  }
  
  // 조후 (계절 영향)
  jojo: {
    season: string
    impact: string
    adjustmentFactor: number
  }
  
  // 상위 십신 3개 (기능 기반)
  topTenGods: Array<{
    name: string
    strength: 'strong' | 'moderate' | 'weak'
    role: string
  }>
  
  // 핵심 합충 (존재하는 것만)
  keyHarmonyClash: Array<{
    type: 'harmony' | 'clash'
    pillars: string
    implication: string
  }>
}

/**
 * InsightBlueprint: Stage 1의 설계도
 * 실제 9개 InsightClaim을 생성하기 위한 청사진
 * (본문에 "모든 필드 사용" 억지로 끼우지 않음)
 */
export interface InsightBlueprint {
  id: number
  domain: 'personality' | 'career' | 'relationship' | 'fortune' | 'lifestyle'
  
  // 핵심 주장 (짧음)
  thesis: string // e.g. "You thrive under pressure"
  
  // 인과 관계: 2-4개 단계
  mechanismSteps: MechanismStep[]
  
  // 현실 검증 (반사실 포함)
  lifeSceneCandidates: LifeSceneCandidate[]
  
  // 필수 근거 (본문에 반드시 포함되어야 함)
  mustUseEvidence: Array<{
    type: string
    value: string
    dataField: string
  }>
  
  // 반사실 테스트용 키
  counterfactualKey: string // "이게 바뀌면 이 주장은 무너짐" (e.g. "if Water=0 and Metal=95")
  
  // 포인터 (최종 문장에 표기할 데이��� 참조 위치)
  pointerHints: string[] // ["sinGangSinYak.grade", "elementBalanceAdjusted.wood", ...]
  
  // 용신 주의사항
  yongsinNote?: string // yongsin.exists=false면 ���기에 대체 설명
}

/**
 * CoverageMap: 모든 사주 필드가 9개 인사이트에서 최소 1회 이상 사용되었는가?
 * (본문 강제가 아니라 audit으로 추적)
 */
export interface CoverageMap {
  submissionId: string
  dayMaster: { used: boolean; insightIds: number[] }
  tenGods: { used: boolean; insightIds: number[]; coverage: string[] }
  elements: { used: boolean; insightIds: number[]; coverage: string[] }
  harmonies: { used: boolean; insightIds: number[]; coverage: string[] }
  clashes: { used: boolean; insightIds: number[]; coverage: string[] }
  spirits: { used: boolean; insightIds: number[]; coverage: string[] }
  lifeStages: { used: boolean; insightIds: number[]; coverage: string[] }
  fortunes: { used: boolean; insightIds: number[]; coverage: string[] }
  emptyPoints: { used: boolean; insightIds: number[]; coverage: string[] }
  nobleBenefactors: { used: boolean; insightIds: number[]; coverage: string[] }
  
  // 통계
  totalFields: number
  coveredFields: number
  coveragePercentage: number
}

/**
 * InsightMapV2: 개선된 구조
 * Stage 1 → CoreDiagnosisPack + InsightBlueprint[9] 생성
 * (더 이상 InsightClaim 직접 생성 안 함)
 */
export interface InsightMapV2 {
  submissionId: string
  createdAt: string
  
  // 고객 정보
  clientInfo: {
    name: string
    dayMaster: string
    lifeStage: string
    yongsin: {
      exists: boolean
      element?: string
    }
  }
  
  // 핵심 진단
  coreDiagnosis: CoreDiagnosisPack
  
  // 9개 설계도
  blueprints: InsightBlueprint[]
  
  // 커버리지 감사
  coverage: CoverageMap
  
  version: '2.0'
  stagePassed: 'analysis'
}

// ===== Legacy Support (호환성) =====

/**
 * ValidatedFact: 검증 단계 (Stage 3) 의 최종 결과
 * DDT (Data Density Test) + Counterfactual 통과한 9문장
 */
export interface ValidatedFact {
  id: number
  title: string
  content: string // 최종 생성된 1-2 문장
  
  // 검증 데이터
  evidenceCount: number // 포함된 근거 개수
  dataDensityScore: number // DDT 점수 (0-100)
  counterfactualValid: boolean // 다른 월지에는 성립하지 않나? 
  qualityFlags: string[] // 주의사항 (empty)
  
  // 추적 가능성 (근거 명시)
  trackedEvidence: string[] // 이 문장의 근거가 되는 사주 요소들
}

/**
 * ValidatedReport: 최종 보고서 (Stage 3 완료)
 * - 검증 통과한 9개 검증된 문장 + 메타데이터
 */
export interface ValidatedReport {
  submissionId: string
  facts: ValidatedFact[]
  
  // 전체 검증 결과
  totalDataDensityScore: number // 평균 DDT
  allCounterfactualValid: boolean // 모두 고유한가?
  passedQualityGate: boolean
  
  // 통계
  totalEvidenceUsed: number // 사용된 총 사주 데이터 포인트
  uniqueDataFields: string[] // 사용된 모든 사주 필드명
  
  createdAt: string
  stagePassed: 'validation' // 검증 단계 통과 표시
}

export interface ReportSection {
  key: string
  title: string
  description: string
  factCount: number
  icon: string
}

export const REPORT_SECTIONS: ReportSection[] = [
  {
    key: 'personality',
    title: 'Your Inner Self',
    description: 'Deep insights into your personality, strengths, and hidden traits',
    factCount: 25,
    icon: '✨'
  },
  {
    key: 'career',
    title: 'Career & Wealth',
    description: 'Your destined path to success and financial prosperity',
    factCount: 25,
    icon: '💼'
  },
  {
    key: 'love',
    title: 'Love & Relationships',
    description: 'Understanding your heart and romantic destiny',
    factCount: 25,
    icon: '💜'
  },
  {
    key: 'future',
    title: 'Future & Destiny',
    description: 'What the cosmos has written for your journey ahead',
    factCount: 24,
    icon: '🔮'
  }
]

export const REFERRAL_SOURCES = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'google', label: 'Google Search' },
  { value: 'gpt', label: 'ChatGPT / AI' },
  { value: 'friend', label: 'Friend Recommendation' },
  { value: 'other', label: 'Other' }
]

export const COUNTRIES = [
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AL', label: 'Albania' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'AD', label: 'Andorra' },
  { value: 'AO', label: 'Angola' },
  { value: 'AG', label: 'Antigua and Barbuda' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AM', label: 'Armenia' },
  { value: 'AU-PER', label: 'Australia - Perth' },
  { value: 'AU-EUC', label: 'Australia - Eucla' },
  { value: 'AU-DAR', label: 'Australia - Darwin' },
  { value: 'AU-ADL', label: 'Australia - Adelaide' },
  { value: 'AU-SYD', label: 'Australia - Sydney' },
  { value: 'AU-BRI', label: 'Australia - Brisbane' },
  { value: 'AU-MEL', label: 'Australia - Melbourne' },
  { value: 'AU-HOB', label: 'Australia - Hobart' },
  { value: 'AU-LHI', label: 'Australia - Lord Howe Island' },
  { value: 'AU-NFK', label: 'Australia - Norfolk Island' },
  { value: 'AU-CCK', label: 'Australia - Cocos (Keeling) Islands' },
  { value: 'AU-CXR', label: 'Australia - Christmas Island' },
  { value: 'AT', label: 'Austria' },
  { value: 'AZ', label: 'Azerbaijan' },
  { value: 'BS', label: 'Bahamas' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BB', label: 'Barbados' },
  { value: 'BY', label: 'Belarus' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BZ', label: 'Belize' },
  { value: 'BJ', label: 'Benin' },
  { value: 'BT', label: 'Bhutan' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BA', label: 'Bosnia and Herzegovina' },
  { value: 'BW', label: 'Botswana' },
  { value: 'BR-RBR', label: 'Brazil - Rio Branco' },
  { value: 'BR-MAO', label: 'Brazil - Manaus' },
  { value: 'BR-CGB', label: 'Brazil - Cuiaba' },
  { value: 'BR-CGR', label: 'Brazil - Campo Grande' },
  { value: 'BR-FOR', label: 'Brazil - Fortaleza' },
  { value: 'BR-REC', label: 'Brazil - Recife' },
  { value: 'BR-SSA', label: 'Brazil - Salvador' },
  { value: 'BR-BSB', label: 'Brazil - Brasilia' },
  { value: 'BR-SAO', label: 'Brazil - Sao Paulo' },
  { value: 'BR-POA', label: 'Brazil - Porto Alegre' },
  { value: 'BR-FEN', label: 'Brazil - Fernando de Noronha' },
  { value: 'BN', label: 'Brunei' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'BI', label: 'Burundi' },
  { value: 'CV', label: 'Cabo Verde' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'CM', label: 'Cameroon' },
  { value: 'CA-YYT', label: "Canada - St. John's" },
  { value: 'CA-YHZ', label: 'Canada - Halifax' },
  { value: 'CA-YYZ', label: 'Canada - Toronto' },
  { value: 'CA-YWG', label: 'Canada - Winnipeg' },
  { value: 'CA-YYC', label: 'Canada - Calgary' },
  { value: 'CA-YVR', label: 'Canada - Vancouver' },
  { value: 'CF', label: 'Central African Republic' },
  { value: 'TD', label: 'Chad' },
  { value: 'CL-IPC', label: 'Chile - Easter Island' },
  { value: 'CL-SCL', label: 'Chile - Santiago' },
  { value: 'CL-PUQ', label: 'Chile - Punta Arenas' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colombia' },
  { value: 'KM', label: 'Comoros' },
  { value: 'CG', label: 'Congo (Congo-Brazzaville)' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'HR', label: 'Croatia' },
  { value: 'CU', label: 'Cuba' },
  { value: 'CY', label: 'Cyprus' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'DK-CPH', label: 'Denmark - Copenhagen' },
  { value: 'DK-FAE', label: 'Denmark - Torshavn (Faroe Islands)' },
  { value: 'DK-GOH', label: 'Denmark - Nuuk (Greenland)' },
  { value: 'DK-OBY', label: 'Denmark - Ittoqqortoormiit (Greenland)' },
  { value: 'DK-THU', label: 'Denmark - Pituffik (Greenland)' },
  { value: 'DJ', label: 'Djibouti' },
  { value: 'DM', label: 'Dominica' },
  { value: 'DO', label: 'Dominican Republic' },
  { value: 'CD-FIH', label: 'DR Congo - Kinshasa' },
  { value: 'CD-GOM', label: 'DR Congo - Goma' },
  { value: 'EC-UIO', label: 'Ecuador - Quito' },
  { value: 'EC-GPS', label: 'Ecuador - Puerto Ayora (Galapagos)' },
  { value: 'EG', label: 'Egypt' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'GQ', label: 'Equatorial Guinea' },
  { value: 'ER', label: 'Eritrea' },
  { value: 'EE', label: 'Estonia' },
  { value: 'SZ', label: 'Eswatini' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'FJ', label: 'Fiji' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR-PPT', label: 'France - Papeete (Society Islands)' },
  { value: 'FR-NHV', label: 'France - Nuku Hiva (Marquesas)' },
  { value: 'FR-GMR', label: 'France - Gambier Islands' },
  { value: 'FR-CLI', label: 'France - Clipperton Island' },
  { value: 'FR-PTP', label: 'France - Pointe-a-Pitre (Guadeloupe)' },
  { value: 'FR-CAY', label: 'France - Cayenne (French Guiana)' },
  { value: 'FR-PAR', label: 'France - Paris (Metropolitan France)' },
  { value: 'FR-DZA', label: 'France - Mamoudzou (Mayotte)' },
  { value: 'FR-RUN', label: 'France - Saint-Denis (Reunion)' },
  { value: 'FR-PFR', label: 'France - Port-aux-Francais (Kerguelen Islands)' },
  { value: 'FR-NOU', label: 'France - Noumea (New Caledonia)' },
  { value: 'FR-WLS', label: 'France - Mata-Utu (Wallis and Futuna)' },
  { value: 'GA', label: 'Gabon' },
  { value: 'GM', label: 'Gambia' },
  { value: 'GE', label: 'Georgia' },
  { value: 'DE', label: 'Germany' },
  { value: 'GH', label: 'Ghana' },
  { value: 'GR', label: 'Greece' },
  { value: 'GD', label: 'Grenada' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'GN', label: 'Guinea' },
  { value: 'GW', label: 'Guinea-Bissau' },
  { value: 'GY', label: 'Guyana' },
  { value: 'HT', label: 'Haiti' },
  { value: 'HN', label: 'Honduras' },
  { value: 'HU', label: 'Hungary' },
  { value: 'IS', label: 'Iceland' },
  { value: 'IN-BOM', label: 'India - West (Mumbai, Gujarat)' },
  { value: 'IN-DEL', label: 'India - Central (Delhi, Rajasthan)' },
  { value: 'IN-CCU', label: 'India - East (Kolkata, Assam)' },
  { value: 'ID-JKT', label: 'Indonesia - Jakarta' },
  { value: 'ID-UPG', label: 'Indonesia - Makassar' },
  { value: 'ID-DJJ', label: 'Indonesia - Jayapura' },
  { value: 'IR', label: 'Iran' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IL', label: 'Israel' },
  { value: 'IT', label: 'Italy' },
  { value: 'JM', label: 'Jamaica' },
  { value: 'JP', label: 'Japan' },
  { value: 'JO', label: 'Jordan' },
  { value: 'KZ', label: 'Kazakhstan - Astana' },
  { value: 'KI-TRW', label: 'Kiribati - Tarawa (Gilbert Islands)' },
  { value: 'KI-CXI', label: 'Kiribati - Kanton (Phoenix Islands)' },
  { value: 'KI-KIR', label: 'Kiribati - Kiritimati (Line Islands)' },
  { value: 'KE', label: 'Kenya' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'KG', label: 'Kyrgyzstan' },
  { value: 'LA', label: 'Laos' },
  { value: 'LV', label: 'Latvia' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'LS', label: 'Lesotho' },
  { value: 'LR', label: 'Liberia' },
  { value: 'LY', label: 'Libya' },
  { value: 'LI', label: 'Liechtenstein' },
  { value: 'LT', label: 'Lithuania' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MG', label: 'Madagascar' },
  { value: 'MW', label: 'Malawi' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'MV', label: 'Maldives' },
  { value: 'ML', label: 'Mali' },
  { value: 'MT', label: 'Malta' },
  { value: 'MH', label: 'Marshall Islands' },
  { value: 'MR', label: 'Mauritania' },
  { value: 'MU', label: 'Mauritius' },
  { value: 'MX-TIJ', label: 'Mexico - Tijuana' },
  { value: 'MX-CUU', label: 'Mexico - Chihuahua' },
  { value: 'MX-MEX', label: 'Mexico - Mexico City' },
  { value: 'MX-CUN', label: 'Mexico - Cancun' },
  { value: 'FM-TKK', label: 'Micronesia - Chuuk' },
  { value: 'FM-PNI', label: 'Micronesia - Pohnpei' },
  { value: 'FM-KSA', label: 'Micronesia - Kosrae' },
  { value: 'MD', label: 'Moldova' },
  { value: 'MC', label: 'Monaco' },
  { value: 'MN-HVD', label: 'Mongolia - Hovd' },
  { value: 'MN-ULN', label: 'Mongolia - Ulaanbaatar' },
  { value: 'ME', label: 'Montenegro' },
  { value: 'MA', label: 'Morocco' },
  { value: 'MZ', label: 'Mozambique' },
  { value: 'MM', label: 'Myanmar' },
  { value: 'NA', label: 'Namibia' },
  { value: 'NR', label: 'Nauru' },
  { value: 'NP', label: 'Nepal' },
  { value: 'NL-AMS', label: 'Netherlands - Amsterdam' },
  { value: 'NL-CUR', label: 'Netherlands - Willemstad (Curacao)' },
  { value: 'NZ-AKL', label: 'New Zealand - Auckland' },
  { value: 'NZ-CHT', label: 'New Zealand - Chatham Islands' },
  { value: 'NZ-TKL', label: 'New Zealand - Tokelau' },
  { value: 'NZ-RAR', label: 'New Zealand - Rarotonga (Cook Islands)' },
  { value: 'NZ-IUE', label: 'New Zealand - Alofi (Niue)' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'NE', label: 'Niger' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'KP', label: 'North Korea' },
  { value: 'MK', label: 'North Macedonia' },
  { value: 'NO', label: 'Norway' },
  { value: 'OM', label: 'Oman' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'PW', label: 'Palau' },
  { value: 'PS', label: 'Palestine' },
  { value: 'PA', label: 'Panama' },
  { value: 'PG-POM', label: 'Papua New Guinea - Port Moresby' },
  { value: 'PG-BUA', label: 'Papua New Guinea - Buka (Bougainville)' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'PE', label: 'Peru' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT-LIS', label: 'Portugal - Lisbon' },
  { value: 'PT-PDL', label: 'Portugal - Ponta Delgada (Azores)' },
  { value: 'QA', label: 'Qatar' },
  { value: 'RO', label: 'Romania' },
  { value: 'RU-KGD', label: 'Russia - Kaliningrad' },
  { value: 'RU-MOW', label: 'Russia - Moscow' },
  { value: 'RU-KUF', label: 'Russia - Samara' },
  { value: 'RU-SVX', label: 'Russia - Yekaterinburg' },
  { value: 'RU-OMS', label: 'Russia - Omsk' },
  { value: 'RU-OVB', label: 'Russia - Novosibirsk' },
  { value: 'RU-IKT', label: 'Russia - Irkutsk' },
  { value: 'RU-YKS', label: 'Russia - Yakutsk' },
  { value: 'RU-VVO', label: 'Russia - Vladivostok' },
  { value: 'RU-GDX', label: 'Russia - Magadan' },
  { value: 'RU-PKC', label: 'Russia - Petropavlovsk-Kamchatsky' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'KN', label: 'Saint Kitts and Nevis' },
  { value: 'LC', label: 'Saint Lucia' },
  { value: 'VC', label: 'Saint Vincent and the Grenadines' },
  { value: 'WS', label: 'Samoa' },
  { value: 'SM', label: 'San Marino' },
  { value: 'ST', label: 'Sao Tome and Principe' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'SN', label: 'Senegal' },
  { value: 'RS', label: 'Serbia' },
  { value: 'SC', label: 'Seychelles' },
  { value: 'SL', label: 'Sierra Leone' },
  { value: 'SG', label: 'Singapore' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'SI', label: 'Slovenia' },
  { value: 'SB', label: 'Solomon Islands' },
  { value: 'SO', label: 'Somalia' },
  { value: 'ZA-JNB', label: 'South Africa - Johannesburg' },
  { value: 'ZA-PEI', label: 'South Africa - Prince Edward Islands' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'ES-MAD', label: 'Spain - Madrid' },
  { value: 'ES-LPA', label: 'Spain - Las Palmas (Canary Islands)' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'SD', label: 'Sudan' },
  { value: 'SR', label: 'Suriname' },
  { value: 'SE', label: 'Sweden' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'SY', label: 'Syria' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TJ', label: 'Tajikistan' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'TH', label: 'Thailand' },
  { value: 'TL', label: 'Timor-Leste' },
  { value: 'TG', label: 'Togo' },
  { value: 'TO', label: 'Tonga' },
  { value: 'TT', label: 'Trinidad and Tobago' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'TR', label: 'Turkey' },
  { value: 'TM', label: 'Turkmenistan' },
  { value: 'TV', label: 'Tuvalu' },
  { value: 'UG', label: 'Uganda' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB-LON', label: 'United Kingdom - London' },
  { value: 'GB-GIB', label: 'United Kingdom - Gibraltar' },
  { value: 'GB-AKR', label: 'United Kingdom - Akrotiri (Cyprus base)' },
  { value: 'GB-TCA', label: 'United Kingdom - Turks and Caicos Islands' },
  { value: 'GB-BDA', label: 'United Kingdom - Bermuda' },
  { value: 'GB-FLK', label: 'United Kingdom - Falkland Islands' },
  { value: 'GB-CYM', label: 'United Kingdom - Cayman Islands' },
  { value: 'GB-PCN', label: 'United Kingdom - Pitcairn Islands' },
  { value: 'GB-SHN', label: 'United Kingdom - Saint Helena / Ascension / Tristan da Cunha' },
  { value: 'GB-DGA', label: 'United Kingdom - Diego Garcia (BIOT)' },
  { value: 'GB-SGS', label: 'United Kingdom - South Georgia & South Sandwich Islands' },
  { value: 'US-NYC', label: 'United States - New York' },
  { value: 'US-CHI', label: 'United States - Chicago' },
  { value: 'US-DEN', label: 'United States - Denver' },
  { value: 'US-LAX', label: 'United States - Los Angeles' },
  { value: 'US-ANC', label: 'United States - Anchorage' },
  { value: 'US-HNL', label: 'United States - Honolulu' },
  { value: 'US-PPG', label: 'United States - Pago Pago (American Samoa)' },
  { value: 'US-BAK', label: 'United States - Baker Island' },
  { value: 'US-SJU', label: 'United States - San Juan (Puerto Rico)' },
  { value: 'US-GUM', label: 'United States - Guam' },
  { value: 'US-AWK', label: 'United States - Wake Island' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'UZ', label: 'Uzbekistan' },
  { value: 'VU', label: 'Vanuatu' },
  { value: 'VA', label: 'Vatican City' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'YE', label: 'Yemen' },
  { value: 'ZM', label: 'Zambia' },
  { value: 'ZW', label: 'Zimbabwe' }
]
