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
  // Four Pillars (사주팔자)
  yearPillar: { stem: string; branch: string }
  monthPillar: { stem: string; branch: string }
  dayPillar: { stem: string; branch: string }
  hourPillar?: { stem: string; branch: string }
  
  // Five Elements
  dominantElement: string
  elementBalance: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }
  
  // Additional analysis
  dayMaster: string
  luckyElement: string
  personalityType: string
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
  isMasked?: boolean
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
