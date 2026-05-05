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
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gabmok.png?v=1777872574",
    themeTitle: "The Pioneer",
    themeDescription: "Yang wood — bold, driven, born to lead",
    keywords: ["Bold", "Driven", "Leader"],
    color: "text-green-500"
  },
  "을": {
    stem: "을",
    stemHanja: "乙",
    element: "목",
    yinYang: "음",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/eulmok.png?v=1777872574",
    themeTitle: "The Adapter",
    themeDescription: "Yin wood — flexible, resilient, always finds a way",
    keywords: ["Flexible", "Resilient", "Creative"],
    color: "text-emerald-400"
  },
  "병": {
    stem: "병",
    stemHanja: "丙",
    element: "화",
    yinYang: "양",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/byeonghwa.png?v=1777872574",
    themeTitle: "The Energizer",
    themeDescription: "Yang fire — bright, radiant, lights up every room",
    keywords: ["Bright", "Radiant", "Charismatic"],
    color: "text-orange-500"
  },
  "정": {
    stem: "정",
    stemHanja: "丁",
    element: "화",
    yinYang: "음",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/jeonghwa.png?v=1777872574",
    themeTitle: "The Empath",
    themeDescription: "Yin fire — warm, gentle, melts hearts without trying",
    keywords: ["Warm", "Gentle", "Empathetic"],
    color: "text-red-400"
  },
  "무": {
    stem: "무",
    stemHanja: "戊",
    element: "토",
    yinYang: "양",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/muto.png?v=1777872573",
    themeTitle: "The Anchor",
    themeDescription: "Yang earth — steady, solid, holds everything together",
    keywords: ["Steady", "Solid", "Reliable"],
    color: "text-amber-600"
  },
  "기": {
    stem: "기",
    stemHanja: "己",
    element: "토",
    yinYang: "음",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gito.png?v=1777872574",
    themeTitle: "The Nurturer",
    themeDescription: "Yin earth — quiet but capable, grows everything around them",
    keywords: ["Caring", "Capable", "Harmonious"],
    color: "text-yellow-600"
  },
  "경": {
    stem: "경",
    stemHanja: "庚",
    element: "금",
    yinYang: "양",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gyeonggeum.png?v=1777872574",
    themeTitle: "The Straight Shooter",
    themeDescription: "Yang metal — principled, sharp, says it like it is",
    keywords: ["Principled", "Sharp", "Direct"],
    color: "text-slate-400"
  },
  "신": {
    stem: "신",
    stemHanja: "辛",
    element: "금",
    yinYang: "음",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/singeum.png?v=1777872573",
    themeTitle: "The Perfectionist",
    themeDescription: "Yin metal — precise, aesthetic, refuses to settle",
    keywords: ["Precise", "Aesthetic", "Refined"],
    color: "text-zinc-300"
  },
  "임": {
    stem: "임",
    stemHanja: "壬",
    element: "수",
    yinYang: "양",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/imsu.png?v=1777872574",
    themeTitle: "The Free Spirit",
    themeDescription: "Yang water — expansive, boundless, flows on its own terms",
    keywords: ["Expansive", "Adventurous", "Flowing"],
    color: "text-blue-500"
  },
  "계": {
    stem: "계",
    stemHanja: "癸",
    element: "수",
    yinYang: "음",
    imagePath: "https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gyesu.png?v=1777872574",
    themeTitle: "The Mind Reader",
    themeDescription: "Yin water — deep, sensitive, feels everything unsaid",
    keywords: ["Intuitive", "Deep", "Sensitive"],
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
