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
  { value: 'US', label: 'United States' },
  { value: 'KR', label: 'South Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'BR', label: 'Brazil' },
  { value: 'IN', label: 'India' },
  { value: 'MX', label: 'Mexico' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'SG', label: 'Singapore' },
  { value: 'TH', label: 'Thailand' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'PH', label: 'Philippines' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'OTHER', label: 'Other' }
]
