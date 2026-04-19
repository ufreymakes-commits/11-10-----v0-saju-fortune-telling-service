// 10 일간(Day Master) 캐릭터 데이터
// 각 일간별 캐릭터 이미지와 테마 텍스트

export interface DayMasterCharacter {
  stem: string           // 한글 천간 (갑, 을, 병, 정, 무, 기, 경, 신, 임, 계)
  stemHanja: string      // 한자 천간 (甲, 乙, 丙, 丁, 戊, 己, 庚, 辛, 壬, 癸)
  element: string        // 오행 (목, 화, 토, 금, 수)
  yinYang: string        // 음양 (양, 음)
  imagePath: string      // 캐릭터 이미지 경로
  themeTitle: string     // 테마 제목
  themeDescription: string // 테마 설명
  keywords: string[]     // 키워드들
  color: string          // 대표 색상 (Tailwind class)
}

export const DAY_MASTER_CHARACTERS: Record<string, DayMasterCharacter> = {
  "갑": {
    stem: "갑",
    stemHanja: "甲",
    element: "목",
    yinYang: "양",
    imagePath: "/images/characters/gabmok.png",  // 추후 이미지 추가
    themeTitle: "The Pioneer Tree",
    themeDescription: "A towering tree reaching for the sky",
    keywords: ["Leadership", "Growth", "Ambition"],
    color: "text-green-500"
  },
  "을": {
    stem: "을",
    stemHanja: "乙",
    element: "목",
    yinYang: "음",
    imagePath: "/images/characters/eulmok.png",
    themeTitle: "The Flexible Vine",
    themeDescription: "A graceful vine that bends but never breaks",
    keywords: ["Adaptability", "Creativity", "Resilience"],
    color: "text-emerald-400"
  },
  "병": {
    stem: "병",
    stemHanja: "丙",
    element: "화",
    yinYang: "양",
    imagePath: "/images/characters/byeonghwa.png",
    themeTitle: "The Radiant Sun",
    themeDescription: "A brilliant sun illuminating all paths",
    keywords: ["Passion", "Energy", "Charisma"],
    color: "text-orange-500"
  },
  "정": {
    stem: "정",
    stemHanja: "丁",
    element: "화",
    yinYang: "음",
    imagePath: "/images/characters/jeonghwa.png",
    themeTitle: "The Gentle Flame",
    themeDescription: "A warm candlelight guiding the way",
    keywords: ["Warmth", "Insight", "Dedication"],
    color: "text-red-400"
  },
  "무": {
    stem: "무",
    stemHanja: "戊",
    element: "토",
    yinYang: "양",
    imagePath: "/images/characters/muto.png",
    themeTitle: "The Mighty Mountain",
    themeDescription: "An immovable mountain of strength",
    keywords: ["Stability", "Trustworthy", "Grounded"],
    color: "text-amber-600"
  },
  "기": {
    stem: "기",
    stemHanja: "己",
    element: "토",
    yinYang: "음",
    imagePath: "/images/characters/gito.png",  // 이미 저장됨
    themeTitle: "The Nurturing Earth",
    themeDescription: "Fertile soil nurturing all life",
    keywords: ["Caring", "Supportive", "Harmonious"],
    color: "text-yellow-600"
  },
  "경": {
    stem: "경",
    stemHanja: "庚",
    element: "금",
    yinYang: "양",
    imagePath: "/images/characters/gyeonggeum.png",
    themeTitle: "The Strong Sword",
    themeDescription: "A sharp blade cutting through obstacles",
    keywords: ["Justice", "Decisive", "Courageous"],
    color: "text-slate-400"
  },
  "신": {
    stem: "신",
    stemHanja: "辛",
    element: "금",
    yinYang: "음",
    imagePath: "/images/characters/singeum.png",
    themeTitle: "The Precious Jewel",
    themeDescription: "A refined gem reflecting inner beauty",
    keywords: ["Perfectionist", "Elegant", "Sensitive"],
    color: "text-zinc-300"
  },
  "임": {
    stem: "임",
    stemHanja: "壬",
    element: "수",
    yinYang: "양",
    imagePath: "/images/characters/imsu.png",
    themeTitle: "The Vast Ocean",
    themeDescription: "A boundless ocean of wisdom",
    keywords: ["Wisdom", "Flowing", "Adventurous"],
    color: "text-blue-500"
  },
  "계": {
    stem: "계",
    stemHanja: "癸",
    element: "수",
    yinYang: "음",
    imagePath: "/images/characters/gyesu.png",
    themeTitle: "The Gentle Rain",
    themeDescription: "A nourishing rain bringing life",
    keywords: ["Intuitive", "Gentle", "Mysterious"],
    color: "text-cyan-400"
  }
}

// 일간 한글명으로 캐릭터 정보 가져오기
export function getDayMasterCharacter(dayMaster: string): DayMasterCharacter | null {
  return DAY_MASTER_CHARACTERS[dayMaster] || null
}

// 일간 한자로 캐릭터 정보 가져오기 (갑목, 기토 같은 형태)
export function getDayMasterCharacterByFullName(fullName: string): DayMasterCharacter | null {
  // "갑목", "기토" 같은 형태에서 첫 글자(천간) 추출
  const stem = fullName.charAt(0)
  return DAY_MASTER_CHARACTERS[stem] || null
}
