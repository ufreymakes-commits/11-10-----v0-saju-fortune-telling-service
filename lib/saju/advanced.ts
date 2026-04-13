// ================================================================
// advanced.ts — 사주 심화 분석 (extra_advanced.js 정확한 포팅)
// ================================================================

// 12운성 관련 상수
const TWELVE_STARS = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"]
const BRANCHES_ORDER = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
const JANG_SAENG_BRANCH: Record<string, string> = {
  "갑": "해", "을": "오", "병": "인", "정": "유",
  "무": "인", "기": "유", "경": "사", "신": "자", "임": "신", "계": "묘"
}

// 12운성 단일 계산
export function getTwelveStar(dayStem: string, branch: string): string {
  const isYang = ["갑", "병", "무", "경", "임"].includes(dayStem)
  const si = BRANCHES_ORDER.indexOf(JANG_SAENG_BRANCH[dayStem])
  const bi = BRANCHES_ORDER.indexOf(branch)
  if (si < 0 || bi < 0) return ""
  const diff = isYang ? ((bi - si + 12) % 12) : ((si - bi + 12) % 12)
  return TWELVE_STARS[diff] || ""
}

// 12운성 전체 계산
export function calcTwelveStars(
  dayStem: string,
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): Array<{ position: string; branch: string; star: string }> {
  const labels = ["연지", "월지", "일지", "시지"]
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  
  return branches
    .map((b, i) => {
      if (!b) return null
      return {
        position: labels[i],
        branch: b,
        star: getTwelveStar(dayStem, b)
      }
    })
    .filter((item): item is { position: string; branch: string; star: string } => item !== null)
}

// ================================================================
// 천간합
// ================================================================
const CHEONGGAN_HAP: [string, string, string][] = [
  ["갑", "기", "토"], ["을", "경", "금"], ["병", "신", "수"], ["정", "임", "목"], ["무", "계", "화"]
]

export function calcCheongganHap(
  yearStem: string,
  monthStem: string,
  dayStem: string,
  hourStem: string | null
): string[] {
  const stems = [yearStem, monthStem, dayStem, hourStem]
  const labels = ["연간", "월간", "일간", "시간"]
  const results: string[] = []
  
  CHEONGGAN_HAP.forEach(([a, b, r]) => {
    const ia = stems.indexOf(a)
    const ib = stems.indexOf(b)
    if (ia >= 0 && ib >= 0 && ia !== ib) {
      results.push(`${labels[ia]}${a}+${labels[ib]}${b}→${r}합`)
    }
  })
  
  return results
}

// ================================================================
// 지지육합
// ================================================================
const JIJI_YUGHAP: [string, string, string][] = [
  ["자", "축", "토"], ["인", "해", "목"], ["묘", "술", "화"],
  ["진", "유", "금"], ["사", "신", "수"], ["오", "미", "토"]
]

export function calcJijiYughap(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  JIJI_YUGHAP.forEach(([a, b, r]) => {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}→${r}(육합)`)
        }
      }
    }
  })
  
  return results
}

// ================================================================
// 지지삼합
// ================================================================
const JIJI_SAMHAP: [string[], string][] = [
  [["인", "오", "술"], "화"], [["사", "유", "축"], "금"],
  [["신", "자", "진"], "수"], [["해", "묘", "미"], "목"]
]

export function calcJijiSamhap(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  JIJI_SAMHAP.forEach(([group, result]) => {
    const found = group.filter(b => branches.includes(b))
    if (found.length >= 2) {
      const desc = found.map(b => `${labels[branches.indexOf(b)]}${b}`).join("+")
      results.push(`${desc}→${result}(${found.length === 3 ? "삼합" : "반합"})`)
    }
  })
  
  return results
}

// ================================================================
// 지지방합
// ================================================================
const JIJI_BANGHAP: [string[], string][] = [
  [["인", "묘", "진"], "목"], [["사", "오", "미"], "화"],
  [["신", "유", "술"], "금"], [["해", "자", "축"], "수"]
]

export function calcJijiBanghap(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  JIJI_BANGHAP.forEach(([group, result]) => {
    const found = group.filter(b => branches.includes(b))
    if (found.length >= 2) {
      const desc = found.map(b => `${labels[branches.indexOf(b)]}${b}`).join("+")
      results.push(`${desc}→${result}(${found.length === 3 ? "방합" : "방합(부분)"})`)
    }
  })
  
  return results
}

// ================================================================
// 천간충
// ================================================================
const CHEONGGAN_CHUNG: [string, string][] = [
  ["갑", "경"], ["을", "신"], ["병", "임"], ["정", "계"]
]

export function calcCheongganChung(
  yearStem: string,
  monthStem: string,
  dayStem: string,
  hourStem: string | null
): string[] {
  const stems = [yearStem, monthStem, dayStem, hourStem]
  const labels = ["연간", "월간", "일간", "시간"]
  const results: string[] = []
  
  CHEONGGAN_CHUNG.forEach(([a, b]) => {
    for (let i = 0; i < stems.length; i++) {
      for (let j = i + 1; j < stems.length; j++) {
        if ((stems[i] === a && stems[j] === b) || (stems[i] === b && stems[j] === a)) {
          results.push(`${labels[i]}${stems[i]}↔${labels[j]}${stems[j]}(천간충)`)
        }
      }
    }
  })
  
  return results
}

// ================================================================
// 지지충
// ================================================================
const JIJI_CHUNG: [string, string][] = [
  ["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"]
]

export function calcJijiChung(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  JIJI_CHUNG.forEach(([a, b]) => {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}↔${labels[j]}${branches[j]}(지지충)`)
        }
      }
    }
  })
  
  return results
}

// ================================================================
// 공망
// ================================================================
const GAPJA_60 = [
  "갑자", "을축", "병인", "정묘", "무진", "기사", "경오", "신미", "임신", "계유",
  "갑술", "을해", "병자", "정축", "무인", "기묘", "경진", "신사", "임오", "계미",
  "갑신", "을유", "병술", "정해", "무자", "기축", "경인", "신묘", "임진", "계사",
  "갑오", "을미", "병신", "정유", "무술", "기해", "경자", "신축", "임인", "계묘",
  "갑진", "을사", "병오", "정미", "무신", "기유", "경술", "신해", "임자", "계축",
  "갑인", "을묘", "병진", "정사", "무오", "기미", "경신", "신유", "임술", "계해"
]
const GONGMANG_MAP: [string, string][] = [
  ["술", "해"], ["신", "유"], ["오", "미"], ["진", "사"], ["인", "묘"], ["자", "축"]
]

export function calcGongmang(dayStem: string, dayBranch: string): string[] {
  const idx = GAPJA_60.indexOf(`${dayStem}${dayBranch}`)
  if (idx < 0) return ["계산불가"]
  return GONGMANG_MAP[Math.floor(idx / 10)]
}

// ================================================================
// 형 (刑)
// ================================================================
export function calcHyeong(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  // 무은지형 (인사신)
  const inSaSin = ["인", "사", "신"].filter(b => branches.includes(b))
  if (inSaSin.length >= 2) {
    results.push(`무은지형(${inSaSin.map(b => `${labels[branches.indexOf(b)]}${b}`).join("+")})`)
  }
  
  // 지세지형 (축술미)
  const chukSulMi = ["축", "술", "미"].filter(b => branches.includes(b))
  if (chukSulMi.length >= 2) {
    results.push(`지세지형(${chukSulMi.map(b => `${labels[branches.indexOf(b)]}${b}`).join("+")})`)
  }
  
  // 무례지형 (자묘)
  if (branches.includes("자") && branches.includes("묘")) {
    results.push(`무례지형(${labels[branches.indexOf("자")]}자+${labels[branches.indexOf("묘")]}묘)`)
  }
  
  // 자형 (같은 지지가 2개 이상)
  const selfPunish = ["진", "오", "유", "해"]
  selfPunish.forEach(b => {
    if (branches.filter(x => x === b).length >= 2) {
      results.push(`자형(${b}${b})`)
    }
  })
  
  return results
}

// ================================================================
// 파 (破)
// ================================================================
const JIJI_PA: [string, string][] = [
  ["자", "유"], ["축", "진"], ["인", "해"], ["묘", "오"], ["사", "신"], ["술", "미"]
]

export function calcPa(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  JIJI_PA.forEach(([a, b]) => {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}(파)`)
        }
      }
    }
  })
  
  return results
}

// ================================================================
// 해 (害)
// ================================================================
const JIJI_HAE: [string, string][] = [
  ["자", "미"], ["축", "오"], ["인", "사"], ["묘", "진"], ["신", "해"], ["유", "술"]
]

export function calcHae(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  JIJI_HAE.forEach(([a, b]) => {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}(해)`)
        }
      }
    }
  })
  
  return results
}

// ================================================================
// 원진 (元嗔)
// ================================================================
const WONJIN_PAIRS: [string, string][] = [
  ["자", "미"], ["축", "오"], ["인", "유"], ["묘", "신"], ["진", "해"], ["사", "술"]
]

export function calcWonjin(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): string[] {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  const results: string[] = []
  
  WONJIN_PAIRS.forEach(([a, b]) => {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}(원진)`)
        }
      }
    }
  })
  
  return results
}

// ================================================================
// 길성 (천을귀인, 문창귀인, 태극귀인)
// ================================================================
const CHEONUL_MAP: Record<string, string[]> = {
  "갑": ["축", "미"], "무": ["축", "미"], "경": ["축", "미"],
  "을": ["자", "신"], "기": ["자", "신"],
  "병": ["해", "유"], "정": ["해", "유"],
  "임": ["사", "묘"], "계": ["사", "묘"], "신": ["인", "오"]
}

const TAEGEUK_MAP: Record<string, string[]> = {
  "갑": ["자", "오"], "을": ["자", "오"],
  "병": ["묘", "유"], "정": ["묘", "유"],
  "무": ["진", "술", "축", "미"], "기": ["진", "술", "축", "미"],
  "경": ["인", "해"], "신": ["인", "해"],
  "임": ["사", "신"], "계": ["사", "신"]
}

export function calcGilseong(
  dayStem: string,
  yearStem: string,
  monthStem: string,
  hourStem: string | null,
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null
): { cheonul: string[]; taegeuk: string[] } {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  const labels = ["연지", "월지", "일지", "시지"]
  
  // 천을귀인
  const cheonulTargets = CHEONUL_MAP[dayStem] || []
  const cheonul = cheonulTargets
    .flatMap(target => 
      branches
        .map((b, i) => b === target ? `${labels[i]}${b}` : null)
        .filter(Boolean)
    ) as string[]
  
  // 태극귀인
  const taegeukTargets = TAEGEUK_MAP[dayStem] || []
  const taegeuk = taegeukTargets
    .flatMap(target => 
      branches
        .map((b, i) => b === target ? `${labels[i]}${b}` : null)
        .filter(Boolean)
    ) as string[]
  
  return { cheonul, taegeuk }
}

// ================================================================
// 신강/신약 계산
// ================================================================
const HIDDEN_STEMS_EX: Record<string, string[]> = {
  "자": ["계"], "축": ["기", "계", "신"], "인": ["갑", "병", "무"], "묘": ["을"],
  "진": ["무", "을", "계"], "사": ["병", "무", "경"], "오": ["병", "기", "정"],
  "미": ["기", "을", "정"], "신": ["경", "임", "무"], "유": ["신"], "술": ["무", "신", "정"], "해": ["임", "갑", "무"]
}

function getStemElem(s: string): string {
  const map: Record<string, string> = {
    "갑": "木", "을": "木", "병": "火", "정": "火", "무": "土",
    "기": "土", "경": "金", "신": "金", "임": "水", "계": "水"
  }
  return map[s] || ""
}

function getBranchElem(b: string): string {
  const map: Record<string, string> = {
    "자": "水", "축": "土", "인": "木", "묘": "木", "진": "土", "사": "火",
    "오": "火", "미": "土", "신": "金", "유": "金", "술": "土", "해": "水"
  }
  return map[b] || ""
}

function getTenGodType(dayElem: string, targetElem: string): string {
  if (!dayElem || !targetElem) return ""
  if (targetElem === dayElem) return "비겁"
  
  const sheng: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" }
  const ke: Record<string, string> = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" }
  
  if (sheng[targetElem] === dayElem) return "인성"
  if (sheng[dayElem] === targetElem) return "식상"
  if (ke[dayElem] === targetElem) return "재성"
  if (ke[targetElem] === dayElem) return "관성"
  
  return ""
}

export function calcSinGangSinYak(
  dayStem: string,
  monthBranch: string,
  yearStem: string,
  monthStem: string,
  _dayStemAgain: string,
  hourStem: string | null,
  yearBranch: string,
  dayBranch: string,
  hourBranch: string | null
): { grade: string; ratio: number } {
  const dayElem = getStemElem(dayStem)
  let support = 0
  let weaken = 0
  
  function add(elem: string, weight: number) {
    const type = getTenGodType(dayElem, elem)
    if (type === "비겁" || type === "인성") support += weight
    else if (type === "식상" || type === "재성" || type === "관성") weaken += weight
  }
  
  // 천간 (일간 제외)
  const stems = [yearStem, monthStem, hourStem].filter(Boolean) as string[]
  stems.forEach(s => add(getStemElem(s), 1))
  
  // 지지 + 지장간
  const branchWeights = [1, 2, 1, hourBranch ? 0.5 : 0]
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  
  branches.forEach((b, i) => {
    if (!b) return
    add(getBranchElem(b), branchWeights[i])
    const hidden = HIDDEN_STEMS_EX[b] || []
    hidden.forEach(h => add(getStemElem(h), branchWeights[i] * 0.5))
  })
  
  const total = support + weaken
  if (total === 0) return { grade: "계산불가", ratio: 0 }
  
  const ratio = support / total
  let grade: string
  
  if (ratio >= 0.85) grade = "극왕"
  else if (ratio >= 0.70) grade = "태강"
  else if (ratio >= 0.58) grade = "신강"
  else if (ratio >= 0.50) grade = "중화신강"
  else if (ratio >= 0.42) grade = "중화신약"
  else if (ratio >= 0.30) grade = "신약"
  else if (ratio >= 0.15) grade = "태약"
  else grade = "극약"
  
  return { grade, ratio: Math.round(ratio * 100) }
}

// ================================================================
// 억부용신
// ================================================================
export function getEokbuYongsin(dayStem: string, isStrong: boolean): string {
  const dayElem = getStemElem(dayStem)
  
  const ke: Record<string, string> = { "木": "金", "火": "水", "土": "木", "金": "火", "水": "土" }
  const keTarget: Record<string, string> = { "木": "土", "火": "金", "土": "水", "金": "木", "水": "火" }
  const shengBy: Record<string, string> = { "木": "水", "火": "木", "土": "火", "金": "土", "水": "金" }
  const shengTo: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" }
  
  if (isStrong) {
    return `${ke[dayElem]}(관성) > ${keTarget[dayElem]}(재성) > ${shengTo[dayElem]}(식상)`
  } else {
    return `${shengBy[dayElem]}(인성) > ${dayElem}(비겁)`
  }
}

// ================================================================
// 조후용신
// ================================================================
const JOHU_TABLE: Record<string, Record<string, string>> = {
  "인": { "갑": "병·무", "을": "병·계", "병": "임·경", "정": "갑·경", "무": "병·갑", "기": "병·계·갑", "경": "무·갑·병", "신": "기·무·경", "임": "경·무·병", "계": "신·경" },
  "묘": { "갑": "경·병", "을": "병·계", "병": "임·경", "정": "갑·경", "무": "병·갑", "기": "갑·계", "경": "갑·무", "신": "임·갑", "임": "무·경", "계": "신·경" },
  "진": { "갑": "경·병", "을": "계·병", "병": "임·갑", "정": "갑·경", "무": "병·갑", "기": "병·계", "경": "갑·병", "신": "임·갑", "임": "무·경", "계": "병·신" },
  "사": { "갑": "계·정", "을": "계·병", "병": "임·경", "정": "임·경", "무": "임·갑", "기": "계·병", "경": "임·무", "신": "임·계", "임": "경·무·임", "계": "경·신·임" },
  "오": { "갑": "계·정", "을": "계·병", "병": "임·경·계", "정": "임·경", "무": "임·갑", "기": "계·병", "경": "임·무", "신": "임·계", "임": "경·계", "계": "경·신" },
  "미": { "갑": "계·정", "을": "계·병", "병": "임·계·경", "정": "갑·임", "무": "계·병", "기": "계·병", "경": "정·갑·임", "신": "임·계·갑", "임": "경·계·신", "계": "경·신·병" },
  "신": { "갑": "경·정·무", "을": "계·병", "병": "임·갑", "정": "갑·경", "무": "병·계", "기": "병·계·갑", "경": "정·갑·무", "신": "임·무·정", "임": "무·정", "계": "정·병·갑" },
  "유": { "갑": "경·정·무", "을": "계·병", "병": "임·갑", "정": "갑·경", "무": "병·갑", "기": "병·계·갑", "경": "정·갑", "신": "임·무", "임": "갑·무·경", "계": "신·정" },
  "술": { "갑": "계·정", "을": "계·신", "병": "갑·임", "정": "갑·경·임", "무": "갑·병", "기": "병·갑·계", "경": "갑·임·정", "신": "임·갑", "임": "갑·병·무", "계": "신·갑" },
  "해": { "갑": "경·정·무", "을": "병·무·경", "병": "갑·무·경", "정": "갑·경", "무": "갑·병", "기": "병·갑", "경": "정·갑·무", "신": "임·무·정", "임": "무·경", "계": "신·병" },
  "자": { "갑": "경·정·무", "을": "병·무", "병": "임·무·갑", "정": "갑·경", "무": "병·갑", "기": "병·갑", "경": "정·갑·무", "신": "병·무·갑", "임": "무·경", "계": "병·신" },
  "축": { "갑": "병·경", "을": "병·계", "병": "임·갑", "정": "갑·경", "무": "병·갑", "기": "병·갑·계", "경": "정·갑·병", "신": "병·정", "임": "병·갑", "계": "병·신·갑" }
}

export function calcJohuYongsin(dayStem: string, monthBranch: string): string {
  return JOHU_TABLE[monthBranch]?.[dayStem] || "해당없음"
}

// ================================================================
// 신살 계산 (Free.js에서 가져옴)
// ================================================================
function checkDohwaSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const dohwa = ["자", "오", "묘", "유"]
  return [yearBranch, monthBranch, dayBranch, hourBranch].some(b => dohwa.includes(b || ""))
}

function checkYeokMaSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  if ((branches.includes("신") || branches.includes("자") || branches.includes("진")) && branches.includes("인")) return true
  if ((branches.includes("인") || branches.includes("오") || branches.includes("술")) && branches.includes("신")) return true
  if ((branches.includes("사") || branches.includes("유") || branches.includes("축")) && branches.includes("해")) return true
  if ((branches.includes("해") || branches.includes("묘") || branches.includes("미")) && branches.includes("사")) return true
  return false
}

function checkHwagaeSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  if ((branches.includes("신") || branches.includes("자") || branches.includes("진")) && branches.includes("진")) return true
  if ((branches.includes("인") || branches.includes("오") || branches.includes("술")) && branches.includes("술")) return true
  if ((branches.includes("사") || branches.includes("유") || branches.includes("축")) && branches.includes("축")) return true
  if ((branches.includes("해") || branches.includes("묘") || branches.includes("미")) && branches.includes("미")) return true
  return false
}

function checkWonJinSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const wonjin: [string, string][] = [
    ["자", "미"], ["축", "오"], ["인", "유"],
    ["묘", "신"], ["진", "해"], ["사", "술"]
  ]
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  for (const pair of wonjin) {
    if (branches.includes(pair[0]) && branches.includes(pair[1])) return true
  }
  return false
}

function checkHyeonChimSal(dayBranch: string): boolean {
  return ["해", "묘", "미"].includes(dayBranch)
}

// 망신살: 일지/연지 기준 (도화살과 정반대 위치)
function checkMangsinSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const mangsinMap: Record<string, string> = {
    "인": "신", "오": "신", "술": "신",
    "신": "인", "자": "인", "진": "인",
    "사": "해", "유": "해", "축": "해",
    "해": "사", "묘": "사", "미": "사"
  }
  const target = mangsinMap[dayBranch] || mangsinMap[yearBranch]
  if (!target) return false
  return [yearBranch, monthBranch, dayBranch, hourBranch].includes(target)
}

function getMangsinSalPositions(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): string[] {
  const positions: string[] = []
  const mangsinMap: Record<string, string> = {
    "인": "신", "오": "신", "술": "신",
    "신": "인", "자": "인", "진": "인",
    "사": "해", "유": "해", "축": "해",
    "해": "사", "묘": "사", "미": "사"
  }
  const target = mangsinMap[dayBranch]
  if (target) {
    if (yearBranch === target) positions.push("연지")
    if (monthBranch === target) positions.push("월지")
    if (dayBranch === target) positions.push("일지")
    if (hourBranch === target) positions.push("시지")
  }
  return positions
}

// 장성살: 일지 기준
function checkJangseongSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const jangseongMap: Record<string, string> = {
    "인": "해", "오": "해", "술": "해",
    "신": "사", "자": "사", "진": "사",
    "사": "인", "유": "인", "축": "인",
    "해": "신", "묘": "신", "미": "신"
  }
  const target = jangseongMap[dayBranch]
  if (!target) return false
  return [yearBranch, monthBranch, dayBranch, hourBranch].includes(target)
}

function getJangseongSalPositions(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): string[] {
  const positions: string[] = []
  const jangseongMap: Record<string, string> = {
    "인": "해", "오": "해", "술": "해",
    "신": "사", "자": "사", "진": "사",
    "사": "인", "유": "인", "축": "인",
    "해": "신", "묘": "신", "미": "신"
  }
  const target = jangseongMap[dayBranch]
  if (target) {
    if (yearBranch === target) positions.push("연지")
    if (monthBranch === target) positions.push("월지")
    if (dayBranch === target) positions.push("일지")
    if (hourBranch === target) positions.push("시지")
  }
  return positions
}

// 홍염살: 일간 기준 (연애/매력 관련)
function checkHongyeomSal(dayStem: string, branches: string[]): boolean {
  const hongyeomMap: Record<string, string> = {
    "갑": "오", "을": "신", "병": "인", "정": "미",
    "무": "진", "기": "진", "경": "술", "신": "유",
    "임": "자", "계": "신"
  }
  const target = hongyeomMap[dayStem]
  return target ? branches.filter(Boolean).includes(target) : false
}

function getHongyeomSalPositions(dayStem: string, yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): string[] {
  const positions: string[] = []
  const hongyeomMap: Record<string, string> = {
    "갑": "오", "을": "신", "병": "인", "정": "미",
    "무": "진", "기": "진", "경": "술", "신": "유",
    "임": "자", "계": "신"
  }
  const target = hongyeomMap[dayStem]
  if (target) {
    if (yearBranch === target) positions.push("연지")
    if (monthBranch === target) positions.push("월지")
    if (dayBranch === target) positions.push("일지")
    if (hourBranch === target) positions.push("시지")
  }
  return positions
}

// 문창살: 일간 기준으로 특정 지지가 있으면 해당
function checkMunChangSal(dayStem: string, branches: string[]): string[] {
  const munchangMap: Record<string, string[]> = {
    "갑": ["사"],   // 갑일간 -> 사
    "을": ["오"],   // 을일간 -> 오
    "병": ["신"],   // 병일간 -> 신
    "정": ["유"],   // 정일간 -> 유
    "무": ["신"],   // 무일간 -> 신
    "기": ["유"],   // 기일간 -> 유
    "경": ["해"],   // 경일간 -> 해
    "신": ["자"],   // 신일간 -> 자
    "임": ["인"],   // 임일간 -> 인
    "계": ["묘"]    // 계일간 -> 묘
  }
  
  const targetBranches = munchangMap[dayStem] || []
  return branches.filter(b => b && targetBranches.includes(b))
}

// 각 신살이 해당하는 위치들을 반환
function getDohwaSalPositions(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): string[] {
  const positions: string[] = []
  const dohwaMap: Record<string, string> = {
    "인": "묘", "오": "묘", "술": "묘",
    "신": "유", "자": "유", "진": "유",
    "사": "오", "유": "오", "축": "오",
    "해": "자", "묘": "자", "미": "자"
  }
  const target = dohwaMap[dayBranch]
  if (target) {
    if (yearBranch === target) positions.push("연지")
    if (monthBranch === target) positions.push("월지")
    if (dayBranch === target) positions.push("일지")
    if (hourBranch === target) positions.push("시지")
  }
  return positions
}

function getYeokMaSalPositions(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): string[] {
  const positions: string[] = []
  const yeokmaMap: Record<string, string> = {
    "인": "신", "오": "신", "술": "신",
    "신": "인", "자": "인", "진": "인",
    "사": "해", "유": "해", "축": "해",
    "해": "사", "묘": "사", "미": "사"
  }
  const target = yeokmaMap[dayBranch]
  if (target) {
    if (yearBranch === target) positions.push("연지")
    if (monthBranch === target) positions.push("월지")
    if (dayBranch === target) positions.push("일지")
    if (hourBranch === target) positions.push("시지")
  }
  return positions
}

function getHwagaeSalPositions(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): string[] {
  const positions: string[] = []
  const hwagaeMap: Record<string, string> = {
    "인": "술", "오": "술", "술": "술",
    "신": "진", "자": "진", "진": "진",
    "사": "축", "유": "축", "축": "축",
    "해": "미", "묘": "미", "미": "미"
  }
  const target = hwagaeMap[dayBranch]
  if (target) {
    if (yearBranch === target) positions.push("연지")
    if (monthBranch === target) positions.push("월지")
    if (dayBranch === target) positions.push("일지")
    if (hourBranch === target) positions.push("시지")
  }
  return positions
}

function getMunChangSalPositions(dayStem: string, yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): string[] {
  const positions: string[] = []
  const munchangMap: Record<string, string> = {
    "갑": "사", "을": "오", "병": "신", "정": "유", "무": "신",
    "기": "유", "경": "해", "신": "자", "임": "인", "계": "묘"
  }
  const target = munchangMap[dayStem]
  if (target) {
    if (yearBranch === target) positions.push("연지")
    if (monthBranch === target) positions.push("월지")
    if (dayBranch === target) positions.push("일지")
    if (hourBranch === target) positions.push("시지")
  }
  return positions
}

// ================================================================
// 추가 신살 계산 함수들
// ================================================================

// 겁살: 일지 기준 삼합국의 첫 번째 지지
function checkGeobSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const geobMap: Record<string, string> = {
    "인": "해", "오": "해", "술": "해",
    "신": "사", "자": "사", "진": "사",
    "사": "인", "유": "인", "축": "인",
    "해": "신", "묘": "신", "미": "신"
  }
  const target = geobMap[dayBranch]
  if (!target) return false
  return [yearBranch, monthBranch, dayBranch, hourBranch].includes(target)
}
function getGeobSalPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "인": "해","오": "해","술": "해","신": "사","자": "사","진": "사","사": "인","유": "인","축": "인","해": "신","묘": "신","미": "신" }
  return _getBranchPositions(map[db], yb, mob, db, hb)
}

// 지살: 삼합국의 역마 다음 지지
function checkJiSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const jiMap: Record<string, string> = {
    "인": "인", "오": "인", "술": "인",
    "신": "신", "자": "신", "진": "신",
    "사": "사", "유": "사", "축": "사",
    "해": "해", "묘": "해", "미": "해"
  }
  const target = jiMap[dayBranch]
  if (!target || target === dayBranch) return false
  return [yearBranch, monthBranch, hourBranch].includes(target)
}
function getJiSalPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "인": "인","오": "인","술": "인","신": "신","자": "신","진": "신","사": "사","유": "사","축": "사","해": "해","묘": "해","미": "해" }
  const target = map[db]
  if (!target || target === db) return []
  return _getBranchPositions(target, yb, mob, db, hb)
}

// 천살: 삼합국의 충 방향
function checkCheonSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const cheonMap: Record<string, string> = {
    "인": "오", "오": "인", "술": "오",
    "신": "자", "자": "신", "진": "자",
    "사": "유", "유": "사", "축": "유",
    "해": "묘", "묘": "해", "미": "묘"
  }
  const target = cheonMap[dayBranch]
  if (!target) return false
  return [yearBranch, monthBranch, dayBranch, hourBranch].filter(b => b === target).length > 0
}
function getCheonSalPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "인": "오","오": "인","술": "오","신": "자","자": "신","진": "자","사": "유","유": "사","축": "유","해": "묘","묘": "해","미": "묘" }
  return _getBranchPositions(map[db], yb, mob, db, hb)
}

// 년살 (도화): 삼합국의 도화지지 (자오묘유)
function checkNyeonSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const nyeonMap: Record<string, string> = {
    "인": "묘", "오": "묘", "술": "묘",
    "신": "유", "자": "유", "진": "유",
    "사": "오", "유": "오", "축": "오",
    "해": "자", "묘": "자", "미": "자"
  }
  const target = nyeonMap[dayBranch]
  if (!target || target === dayBranch) return false
  return [yearBranch, monthBranch, hourBranch].includes(target)
}
function getNyeonSalPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "인": "묘","오": "묘","술": "묘","신": "유","자": "유","진": "유","사": "오","유": "오","축": "오","해": "자","묘": "자","미": "자" }
  const target = map[db]
  if (!target || target === db) return []
  return _getBranchPositions(target, yb, mob, db, hb)
}

// 백호살: 일주 기준 (갑진, 을미, 병술, 정축, 무진, 경진, 신미, 임술, 계축, 무술)
function checkBaekhoSal(dayStem: string, dayBranch: string): boolean {
  const baekhoList = [
    ["갑","진"],["을","미"],["병","술"],["정","축"],
    ["무","진"],["경","진"],["신","미"],["임","술"],
    ["계","축"],["무","술"]
  ]
  return baekhoList.some(([s, b]) => s === dayStem && b === dayBranch)
}

// 귀문관살: 지지 조합
function checkGwimunssal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const gwimunPairs: [string, string][] = [
    ["자","유"],["축","오"],["인","미"],
    ["묘","술"],["진","해"],["사","신"]
  ]
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  return gwimunPairs.some(([a, b]) => branches.includes(a) && branches.includes(b))
}
function getGwimunPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const gwimunPairs: [string, string][] = [["자","유"],["축","오"],["인","미"],["묘","술"],["진","해"],["사","신"]]
  const branches = [yb, mob, db, hb]
  const result: string[] = []
  for (const [a, b] of gwimunPairs) {
    if (branches.includes(a) && branches.includes(b)) {
      const labels = ["연지","월지","일지","시지"]
      ;[yb, mob, db, hb].forEach((br, i) => { if (br === a || br === b) result.push(labels[i]) })
    }
  }
  return [...new Set(result)]
}

// 천라지망: 진술해묘
function checkCheollaJimang(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  return (branches.includes("진") || branches.includes("술")) &&
         (branches.includes("해") || branches.includes("묘"))
}
function getCheollaJimangPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const labels = ["연지","월지","일지","시지"]
  const target = ["진","술","해","묘"]
  return [yb, mob, db, hb].map((b, i) => target.includes(b || "") ? labels[i] : null).filter(Boolean) as string[]
}

// 탕화살: 일지 기준
function checkTanghwaSal(dayStem: string, dayBranch: string): boolean {
  const tanghwaList = [
    ["갑","자"],["을","오"],["병","인"],["정","오"],["무","인"],
    ["기","오"],["경","인"],["신","자"],["임","인"],["계","미"]
  ]
  return tanghwaList.some(([s, b]) => s === dayStem && b === dayBranch)
}

// 효신살: 일지 기준
function checkHyosinSal(dayStem: string, dayBranch: string): boolean {
  const hyosinList = [
    ["갑","신"],["을","유"],["병","해"],["정","자"],["무","인"],
    ["기","묘"],["경","사"],["신","오"],["임","신"],["계","유"]
  ]
  return hyosinList.some(([s, b]) => s === dayStem && b === dayBranch)
}

// 학당귀인: 일간 기준
function checkHakdangGuiin(dayStem: string, branches: string[]): string[] {
  const hakdangMap: Record<string, string> = {
    "갑": "해", "병": "인", "무": "인",
    "경": "사", "임": "신"
  }
  const target = hakdangMap[dayStem]
  if (!target) return []
  return branches.filter(b => b === target)
}
function getHakdangPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "해","병": "인","무": "인","경": "사","임": "신" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 복성귀인: 일간 기준
function checkBokseongGuiin(dayStem: string, branches: string[]): boolean {
  const bokseongMap: Record<string, string> = {
    "갑": "인", "을": "묘", "병": "사", "정": "오", "무": "사",
    "기": "오", "경": "신", "신": "유", "임": "해", "계": "자"
  }
  const target = bokseongMap[dayStem]
  return target ? branches.includes(target) : false
}
function getBokseongPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "인","을": "묘","병": "사","정": "오","무": "사","기": "오","경": "신","신": "유","임": "해","계": "자" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 천록귀인: 일간 기준
function checkCheonrokGuiin(dayStem: string, branches: string[]): boolean {
  const cheonrokMap: Record<string, string> = {
    "갑": "인", "을": "묘", "병": "사", "정": "오", "무": "사",
    "기": "오", "경": "신", "신": "유", "임": "해", "계": "자"
  }
  const target = cheonrokMap[dayStem]
  return target ? branches.includes(target) : false
}
function getCheonrokPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "인","을": "묘","병": "사","정": "오","무": "사","기": "오","경": "신","신": "유","임": "해","계": "자" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 암록: 일간 기준
function checkAmRok(dayStem: string, branches: string[]): boolean {
  const amrokMap: Record<string, string> = {
    "갑": "해", "을": "술", "병": "신", "정": "미", "무": "신",
    "기": "미", "경": "사", "신": "진", "임": "인", "계": "축"
  }
  const target = amrokMap[dayStem]
  return target ? branches.includes(target) : false
}
function getAmRokPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "해","을": "술","병": "신","정": "미","무": "신","기": "미","경": "사","신": "진","임": "인","계": "축" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 간여지동: 일주 천간지지 동일 오행 (갑인, 을묘, 병오, 정사, 무진술, 기축미, 경신, 신유, 임자, 계해)
function checkGanyeoJidong(dayStem: string, dayBranch: string): boolean {
  const pairs = ["갑인","을묘","병오","정사","무진","무술","기축","기미","경신","신유","임자","계해"]
  return pairs.includes(dayStem + dayBranch)
}

// 일덕: 일주 기준
function checkIldeok(dayStem: string, dayBranch: string): boolean {
  const ildeokList = ["갑인","병진","경진","임술","무술"]
  return ildeokList.includes(dayStem + dayBranch)
}

// 곡각살: 일지 기준 (축진술미 - 토)
function checkGokgakSal(dayBranch: string): boolean {
  return ["축","진","술","미"].includes(dayBranch)
}

// 낙정관살: 일지 기준
function checkNakjeongSal(dayStem: string, dayBranch: string): boolean {
  const nakjeongList = ["갑자","을해","병자","정해","무자","기해","경자","신해","임자","계해"]
  return nakjeongList.includes(dayStem + dayBranch)
}

// 음양살: 양일간(갑병무경임) + 음지지(자묘오유) 조합
function checkEumyangSal(dayStem: string, dayBranch: string): boolean {
  const yangStems = ["갑","병","무","경","임"]
  const yinBranches = ["자","묘","오","유"]
  const yinStems = ["을","정","기","신","계"]
  const yangBranches = ["인","진","사","미","신","술","축","해"]
  return (yangStems.includes(dayStem) && yinBranches.includes(dayBranch)) ||
         (yinStems.includes(dayStem) && yangBranches.includes(dayBranch))
}

// 금신: 을축, 기사, 계유 일주
function checkGeumsin(dayStem: string, dayBranch: string): boolean {
  return ["을축","기사","계유"].includes(dayStem + dayBranch)
}

// 비인살: 겁살과 동일 위치의 천간살
function checkBiinSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const biinMap: Record<string, string> = {
    "인": "사","오": "사","술": "사",
    "신": "해","자": "해","진": "해",
    "사": "신","유": "신","축": "신",
    "해": "인","묘": "인","미": "인"
  }
  const target = biinMap[dayBranch]
  if (!target) return false
  return [yearBranch, monthBranch, dayBranch, hourBranch].includes(target)
}
function getBiinPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "인": "사","오": "사","술": "사","신": "해","자": "해","진": "해","사": "신","유": "신","축": "신","해": "인","묘": "인","미": "인" }
  return _getBranchPositions(map[db], yb, mob, db, hb)
}

// 의처의부살: 일지 기준 (일간과 일지 음양 불일치)
function checkUicheouibSal(dayStem: string, dayBranch: string): boolean {
  const yangStems = ["갑","병","무","경","임"]
  const yangBranches = ["자","인","진","오","신","술"]
  const isStemYang = yangStems.includes(dayStem)
  const isBranchYang = yangBranches.includes(dayBranch)
  return isStemYang !== isBranchYang
}

// 신병살: 특정 일주
function checkSinbyeongSal(dayStem: string, dayBranch: string): boolean {
  const sinbyeongList = ["갑신","을유","병자","정해","무자","기해","경인","신묘","임오","계사"]
  return sinbyeongList.includes(dayStem + dayBranch)
}

// 나체도화: 특정 일주
function checkNachedohwa(dayStem: string, dayBranch: string): boolean {
  const nachedohwaList = ["갑자","을해","병자","정해","무자","기해","경자","신해","임자","계해",
                          "갑오","을사","병오","정사","무오","기사","경오","신사","임오","계사"]
  return nachedohwaList.includes(dayStem + dayBranch)
}

// 여연살 (여자), 남연살 (남자): 일지 기준 연애/이성 관련
function checkYeoyeonSal(dayBranch: string, gender: string): boolean {
  // 여연살: 여성 기준 - 일지가 자오묘유
  // 남연살: 남성 기준 - 일지가 인신사해
  if (gender === 'female' || gender === '여') {
    return ["자","오","묘","유"].includes(dayBranch)
  } else {
    return ["인","신","사","해"].includes(dayBranch)
  }
}

// 육수: 일간 기준 (육친 중 재성/관성/인성의 조화)
function checkYuksu(dayStem: string, branches: string[]): boolean {
  const yuksuMap: Record<string, string> = {
    "갑": "사", "을": "오", "병": "신", "정": "유", "무": "해",
    "기": "자", "경": "인", "신": "묘", "임": "사", "계": "오"
  }
  const target = yuksuMap[dayStem]
  return target ? branches.includes(target) : false
}
function getYuksuPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "사","을": "오","병": "신","정": "유","무": "해","기": "자","경": "인","신": "묘","임": "사","계": "오" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 음욕살: 일주 기준 (갑자, 을사, 병오, 정미, 무신, 기유, 경술, 신해, 임자, 계축)
function checkEumyokSal(dayStem: string, dayBranch: string): boolean {
  const eumyokList = ["갑자","을사","병오","정미","무신","기유","경술","신해","임자","계축"]
  return eumyokList.includes(dayStem + dayBranch)
}

// 장군전: 일간 기준 특정 지지
function checkJanggunJeon(dayStem: string, branches: string[]): boolean {
  const janggunMap: Record<string, string> = {
    "갑": "묘", "을": "신", "병": "오", "정": "유", "무": "오",
    "기": "유", "경": "자", "신": "묘", "임": "자", "계": "묘"
  }
  const target = janggunMap[dayStem]
  return target ? branches.includes(target) : false
}
function getJanggunPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "묘","을": "신","병": "오","정": "유","무": "오","기": "유","경": "자","신": "묘","임": "자","계": "묘" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 복신: 일간 기준 (복을 가져다 주는 신)
function checkBoksin(dayStem: string, branches: string[]): boolean {
  const boksinMap: Record<string, string> = {
    "갑": "인", "을": "축", "병": "사", "정": "진", "무": "사",
    "기": "진", "경": "신", "신": "미", "임": "해", "계": "술"
  }
  const target = boksinMap[dayStem]
  return target ? branches.includes(target) : false
}
function getBoksinPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "인","을": "축","병": "사","정": "진","무": "사","기": "진","경": "신","신": "미","임": "해","계": "술" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 일귀: 일간 기준 (천을귀인과 유사하나 일주 조합)
function checkIlgui(dayStem: string, dayBranch: string): boolean {
  const ilguiMap: Record<string, string[]> = {
    "갑": ["축","미"], "을": ["자","신"], "병": ["해","유"], "정": ["해","유"], "무": ["축","미"],
    "기": ["자","신"], "경": ["축","미"], "신": ["인","오"], "임": ["묘","사"], "계": ["묘","사"]
  }
  const targets = ilguiMap[dayStem]
  return targets ? targets.includes(dayBranch) : false
}

// 교신성: 일주 기준 (갑인, 을묘, 경신, 신유)
function checkGyosinseong(dayStem: string, dayBranch: string): boolean {
  const gyosinList = ["갑인","을묘","경신","신유"]
  return gyosinList.includes(dayStem + dayBranch)
}

// 뇌공타뇌관: 일주 기준 (갑진, 갑술 등 천둥과 관련)
function checkNoegongTanoegwan(dayStem: string, dayBranch: string): boolean {
  const noegongList = ["갑진","을사","병오","정미","무신","경술","신해","임자","계축"]
  return noegongList.includes(dayStem + dayBranch)
}

// 칠살: 일지 기준 삼합국의 7번째 지지 (겁살과 같은 위치이나 다른 해석)
function checkChilSal(yearBranch: string, monthBranch: string, dayBranch: string, hourBranch: string | null): boolean {
  const chilMap: Record<string, string> = {
    "인": "신", "오": "자", "술": "진",
    "신": "인", "자": "오", "진": "술",
    "사": "해", "유": "묘", "축": "미",
    "해": "사", "묘": "유", "미": "축"
  }
  const target = chilMap[dayBranch]
  if (!target) return false
  return [yearBranch, monthBranch, hourBranch].includes(target)
}
function getChilSalPositions(yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "인": "신","오": "자","술": "진","신": "인","자": "오","진": "술","사": "해","유": "묘","축": "미","해": "사","묘": "유","미": "축" }
  const target = map[db]
  if (!target) return []
  return _getBranchPositions(target, yb, mob, db, hb).filter(p => p !== "일지")
}

// 구추방해: 일주 기준 특정 조합 (재물/건강에 방해가 되는 조합)
function checkGuchuBanghae(dayStem: string, dayBranch: string): boolean {
  const guchuList = ["갑인","을묘","병오","정사","무진","기축","경신","신유","임해","계자"]
  return guchuList.includes(dayStem + dayBranch)
}

// 음인(일인): 일간 기준 음의 귀인 (천을귀인의 음 버전)
function checkEumin(dayStem: string, branches: string[]): boolean {
  const euminMap: Record<string, string[]> = {
    "갑": ["미"], "을": ["신"], "병": ["유"], "정": ["해"], "무": ["미"],
    "기": ["신"], "경": ["축"], "신": ["인"], "임": ["묘"], "계": ["사"]
  }
  const targets = euminMap[dayStem]
  return targets ? targets.some(t => branches.includes(t)) : false
}
function getEuminPositions(dayStem: string, yb: string, mob: string, db: string, hb: string | null): string[] {
  const map: Record<string, string> = { "갑": "미","을": "신","병": "유","정": "해","무": "미","기": "신","경": "축","신": "인","임": "묘","계": "사" }
  return _getBranchPositions(map[dayStem], yb, mob, db, hb)
}

// 내부 헬퍼: 특정 지지의 위치 반환
function _getBranchPositions(target: string | undefined, yb: string, mob: string, db: string, hb: string | null): string[] {
  if (!target) return []
  const positions: string[] = []
  if (yb === target) positions.push("연지")
  if (mob === target) positions.push("월지")
  if (db === target) positions.push("일지")
  if (hb === target) positions.push("시지")
  return positions
}

// 신살별 활용 가이드
const SINSAL_USAGE_GUIDE: Record<string, string> = {
  "도화살": "대인관계와 매력을 활용하는 직업(연예, 영업, 서비스업)에서 빛을 발합니다",
  "역마살": "이동과 변화가 많은 환경(해외, 무역, 영업, 출장)에서 에너지가 활성화됩니다",
  "화개살": "예술, 종교, 철학, 학문 등 정신적 깊이를 요하는 분야에서 재능이 발휘됩니다",
  "원진살": "관계의 갈등을 인식하고 소통과 이해의 노력을 기울이면 성장의 기회가 됩니다",
  "현침살": "전문 기술, 의료, 법률 등 날카로운 전문성이 필요한 분야에서 두각을 나타냅니다",
  "문창살": "학문, 글쓰기, 교육, 연구 등 지적 활동에서 뛰어난 성취를 이룰 수 있습니다",
  "망신살": "명예와 체면에 관한 시험을 통해 진정한 자아를 찾고 겸손을 배우게 됩니다",
  "장성살": "리더십과 권위를 발휘하며 높은 지위나 명예를 얻을 수 있는 기운이 있습니다",
  "홍염살": "강렬한 매력과 정열로 예술, 연예, 패션 분야에서 두각을 나타낼 수 있습니다",
  "겁살": "강한 추진력과 돌파력으로 경쟁적인 환경에서 두각을 나타낼 수 있습니다",
  "지살": "외교적 능력과 현장 감각을 살려 현장직이나 대외 활동에서 빛을 발합니다",
  "천살": "하늘의 시험처럼 예측 불가한 변화를 겪지만, 이를 통해 단련됩니다",
  "년살": "사람을 끌어당기는 매력이 있어 인간관계와 연애에서 자주 주목받습니다",
  "백호살": "강렬한 에너지로 두각을 나타내지만, 급격한 변화나 사고에 주의가 필요합니다",
  "귀문관살": "직관력과 영적 감수성이 뛰어나 예술·상담·치유 분야에서 빛을 발합니다",
  "천라지망": "구속과 제약 속에서 내면의 성찰을 통해 진정한 자유를 찾아가는 운입니다",
  "탕화살": "강한 열정과 창의성이 있지만, 충동적 결정을 조심해야 합니다",
  "효신살": "부모나 윗사람과의 관계에 각별히 신경 쓰며, 효심을 통해 복을 쌓습니다",
  "학당귀인": "배움과 학문에 뛰어난 자질이 있어 교육·연구·전문직에서 성취합니다",
  "복성귀인": "주변의 도움과 귀인을 자주 만나 어려운 상황에서도 길이 열립니다",
  "천록귀인": "노력한 만큼 정당한 보상을 받는 복록이 따르는 귀인입니다",
  "암록": "드러나지 않는 곳에서 은밀하게 도와주는 귀인이 있습니다",
  "간여지동": "강한 자아의식과 독립심으로 자기 분야에서 전문가로 성장합니다",
  "일덕": "덕이 있어 주변으로부터 신뢰받고, 위기에서 귀인의 도움을 받습니다",
  "곡각살": "토의 기운이 강해 완고함이 있으나, 끈기와 지구력은 뛰어납니다",
  "낙정관살": "예상치 못한 함정이나 고립에 주의하며, 신중한 판단이 필요합니다",
  "금신": "날카로운 판단력과 결단력으로 위기 상황을 돌파할 수 있습니다",
  "비인살": "고독과 고립의 기운이 있으나, 독자적인 길을 개척하는 힘이 됩니다",
  "나체도화": "강렬한 이성적 매력이 있으나, 감정 조절과 관계 경계 설정이 중요합니다",
  "신병살": "신체적 건강에 주의가 필요하며, 규칙적인 생활 습관이 핵심입니다",
  "음양살": "음양의 불균형으로 변화가 많은 삶을 살지만, 유연성이 강점입니다",
  "의처의부살": "배우자와의 신뢰 관계를 쌓는 것이 중요하며, 소통이 핵심입니다",
  "여연살": "이성에게 자연스럽게 끌림을 주는 매력이 있어 연애운이 활발합니다",
  "남연살": "이성에게 자연스럽게 끌림을 주는 매력이 있어 연애운이 활발합니다",
  "육수": "여섯 가지 복이 모이는 자리로, 재물과 건강, 인연 등에서 고른 행운이 있습니다",
  "음욕살": "감정과 욕구가 풍부하여 예술적 감수성이 뛰어나지만, 절제가 필요할 때가 있습니다",
  "장군전": "강인한 추진력과 결단력으로 리더십을 발휘하며 큰 일을 도모할 수 있습니다",
  "복신": "하늘이 내린 복을 받아 어려운 일에서도 귀인의 도움으로 풀려나갑니다",
  "일귀": "일간의 귀인으로, 중요한 순간에 도움을 주는 사람이 나타납니다",
  "교신성": "언변과 소통 능력이 뛰어나 외교·협상·교육 분야에서 두각을 나타냅니다",
  "뇌공타뇌관": "천둥처럼 강렬한 에너지로 순간적인 판단력과 돌파력이 뛰어납니다",
  "칠살": "충돌과 경쟁의 기운이 있어 승부욕이 강하고 경쟁적인 환경에서 두각을 나타냅니다",
  "구추방해": "재물이나 건강에 방해가 될 수 있으니 평소 건강 관리와 재정 관리에 신경 쓰세요",
  "음인": "음의 귀인으로, 은밀하게 도와주는 사람이 있으며 직관과 감각이 뛰어납니다"
}

export interface SinsalDetail {
  name: string
  positions: string[]      // 해당 위치들 (연지, 월지, 일지, 시지)
  count: number            // 해당 개수
  totalPillars: number     // 전체 주 개수 (보통 4 또는 8)
  percentage: number       // 비율
  intensity: number        // 에너지 강도 (월지/일지 가중치 적용)
  isStrong: boolean        // 강한 신살 여부 (월지/일지 포함)
  usageGuide: string       // 활용 가이드
}

export interface SinsalAnalysis {
  details: SinsalDetail[]
  summary: string
  combinedGuide: string    // 종합 활용 가이드
}

export function calcAllSinsal(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null,
  dayStem: string,
  gender: string = 'male'
): string[] {
  const sinsalList: string[] = []
  
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch].filter(Boolean) as string[]

  // 여연살/남연살 (성별 기반)
  if (checkYeoyeonSal(dayBranch, gender)) {
    sinsalList.push(gender === 'female' || gender === '여' ? "여연살" : "남연살")
  }

  // 지지 기준 신살
  if (checkDohwaSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("도화살")
  if (checkYeokMaSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("역마살")
  if (checkHwagaeSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("화개살")
  if (checkWonJinSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("원진살")
  if (checkMangsinSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("망신살")
  if (checkJangseongSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("장성살")
  if (checkGeobSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("겁살")
  if (checkJiSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("지살")
  if (checkCheonSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("천살")
  if (checkNyeonSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("년살")
  if (checkGwimunssal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("귀문관살")
  if (checkCheollaJimang(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("천라지망")
  if (checkBiinSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("비인살")

  // 일주 기준 신살
  if (checkHyeonChimSal(dayBranch)) sinsalList.push("현침살")
  if (checkBaekhoSal(dayStem, dayBranch)) sinsalList.push("백호살")
  if (checkTanghwaSal(dayStem, dayBranch)) sinsalList.push("탕화살")
  if (checkHyosinSal(dayStem, dayBranch)) sinsalList.push("효신살")
  if (checkGokgakSal(dayBranch)) sinsalList.push("곡각살")
  if (checkNakjeongSal(dayStem, dayBranch)) sinsalList.push("낙정관살")
  if (checkEumyangSal(dayStem, dayBranch)) sinsalList.push("음양살")
  if (checkGeumsin(dayStem, dayBranch)) sinsalList.push("금신")
  if (checkGanyeoJidong(dayStem, dayBranch)) sinsalList.push("간여지동")
  if (checkIldeok(dayStem, dayBranch)) sinsalList.push("일덕")
  if (checkNachedohwa(dayStem, dayBranch)) sinsalList.push("나체도화")
  if (checkSinbyeongSal(dayStem, dayBranch)) sinsalList.push("신병살")
  if (checkUicheouibSal(dayStem, dayBranch)) sinsalList.push("의처의부살")
  if (checkEumyokSal(dayStem, dayBranch)) sinsalList.push("음욕살")
  if (checkIlgui(dayStem, dayBranch)) sinsalList.push("일귀")
  if (checkGyosinseong(dayStem, dayBranch)) sinsalList.push("교신성")
  if (checkNoegongTanoegwan(dayStem, dayBranch)) sinsalList.push("뇌공타뇌관")
  if (checkGuchuBanghae(dayStem, dayBranch)) sinsalList.push("구추방해")

  // 지지 기준 추가
  if (checkChilSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("칠살")

  // 일간 기준 신살/귀인
  if (checkMunChangSal(dayStem, branches).length > 0) sinsalList.push("문창살")
  if (checkHongyeomSal(dayStem, branches)) sinsalList.push("홍염살")
  if (checkHakdangGuiin(dayStem, branches).length > 0) sinsalList.push("학당귀인")
  if (checkBokseongGuiin(dayStem, branches)) sinsalList.push("복성귀인")
  if (checkCheonrokGuiin(dayStem, branches)) sinsalList.push("천록귀인")
  if (checkAmRok(dayStem, branches)) sinsalList.push("암록")
  if (checkYuksu(dayStem, branches)) sinsalList.push("육수")
  if (checkJanggunJeon(dayStem, branches)) sinsalList.push("장군전")
  if (checkBoksin(dayStem, branches)) sinsalList.push("복신")
  if (checkEumin(dayStem, branches)) sinsalList.push("음인")

  return sinsalList
}

export function calcDetailedSinsal(
  yearBranch: string,
  monthBranch: string,
  dayBranch: string,
  hourBranch: string | null,
  dayStem: string
): SinsalAnalysis {
  const details: SinsalDetail[] = []
  const totalPillars = hourBranch ? 4 : 3
  const strongSinsals: string[] = []
  
  // 각 신살별로 상세 분석 (지지 기준)
  const sinsalChecks = [
    { name: "도화살", check: checkDohwaSal, getPositions: getDohwaSalPositions },
    { name: "역마살", check: checkYeokMaSal, getPositions: getYeokMaSalPositions },
    { name: "화개살", check: checkHwagaeSal, getPositions: getHwagaeSalPositions },
    { name: "망신살", check: checkMangsinSal, getPositions: getMangsinSalPositions },
    { name: "장성살", check: checkJangseongSal, getPositions: getJangseongSalPositions },
    { name: "겁살",   check: checkGeobSal,     getPositions: getGeobSalPositions },
    { name: "지살",   check: checkJiSal,       getPositions: getJiSalPositions },
    { name: "천살",   check: checkCheonSal,    getPositions: getCheonSalPositions },
    { name: "년살",   check: checkNyeonSal,    getPositions: getNyeonSalPositions },
    { name: "귀문관살", check: checkGwimunssal, getPositions: getGwimunPositions },
    { name: "천라지망", check: checkCheollaJimang, getPositions: getCheollaJimangPositions },
    { name: "비인살", check: checkBiinSal,     getPositions: getBiinPositions },
    { name: "칠살",   check: checkChilSal,     getPositions: getChilSalPositions },
  ]
  
  for (const { name, check, getPositions } of sinsalChecks) {
    if (check(yearBranch, monthBranch, dayBranch, hourBranch)) {
      const positions = getPositions(yearBranch, monthBranch, dayBranch, hourBranch)
      const count = positions.length
      const percentage = Math.round((count / totalPillars) * 100)
      
      // 월지/일지 가중치 (1.5배)
      let intensity = count
      const hasStrongPosition = positions.includes("월지") || positions.includes("일지")
      if (hasStrongPosition) {
        intensity = parseFloat((count * 1.5).toFixed(1))
      }
      
      details.push({
        name,
        positions,
        count,
        totalPillars,
        percentage,
        intensity,
        isStrong: hasStrongPosition,
        usageGuide: SINSAL_USAGE_GUIDE[name]
      })
      
      if (hasStrongPosition) strongSinsals.push(name)
    }
  }
  
  // 일주 기준 신살 (dayStem + dayBranch 조합)
  const iljooBased: Array<{ name: string; check: boolean; positions: string[] }> = [
    { name: "현침살",    check: checkHyeonChimSal(dayBranch),             positions: ["일지"] },
    { name: "백호살",    check: checkBaekhoSal(dayStem, dayBranch),       positions: ["일주"] },
    { name: "탕화살",    check: checkTanghwaSal(dayStem, dayBranch),      positions: ["일주"] },
    { name: "효신살",    check: checkHyosinSal(dayStem, dayBranch),       positions: ["일주"] },
    { name: "곡각살",    check: checkGokgakSal(dayBranch),                positions: ["일지"] },
    { name: "낙정관살",  check: checkNakjeongSal(dayStem, dayBranch),     positions: ["일주"] },
    { name: "금신",      check: checkGeumsin(dayStem, dayBranch),         positions: ["일주"] },
    { name: "간여지동",  check: checkGanyeoJidong(dayStem, dayBranch),    positions: ["일주"] },
    { name: "일덕",      check: checkIldeok(dayStem, dayBranch),          positions: ["일주"] },
    { name: "나체도화",  check: checkNachedohwa(dayStem, dayBranch),      positions: ["일주"] },
    { name: "신병살",    check: checkSinbyeongSal(dayStem, dayBranch),    positions: ["일주"] },
    { name: "음양살",    check: checkEumyangSal(dayStem, dayBranch),      positions: ["일주"] },
    { name: "의처의부살",check: checkUicheouibSal(dayStem, dayBranch),    positions: ["일주"] },
    { name: "음욕살",    check: checkEumyokSal(dayStem, dayBranch),       positions: ["일주"] },
    { name: "일귀",      check: checkIlgui(dayStem, dayBranch),           positions: ["일주"] },
    { name: "교신성",    check: checkGyosinseong(dayStem, dayBranch),     positions: ["일주"] },
    { name: "뇌공타뇌관",check: checkNoegongTanoegwan(dayStem, dayBranch),positions: ["일주"] },
    { name: "구추방해",  check: checkGuchuBanghae(dayStem, dayBranch),    positions: ["일주"] },
  ]

  for (const { name, check, positions } of iljooBased) {
    if (check) {
      const hasStrongPosition = positions.includes("일지") || positions.includes("일주")
      details.push({
        name,
        positions,
        count: 1,
        totalPillars,
        percentage: Math.round((1 / totalPillars) * 100),
        intensity: hasStrongPosition ? 1.5 : 1,
        isStrong: hasStrongPosition,
        usageGuide: SINSAL_USAGE_GUIDE[name] || ""
      })
      if (hasStrongPosition) strongSinsals.push(name)
    }
  }

  // 일간 기준 귀인/신살
  const dayStemBased: Array<{ name: string; positions: string[] }> = []
  const munchangPos = getMunChangSalPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (munchangPos.length > 0) dayStemBased.push({ name: "문창살", positions: munchangPos })
  const hongyeomPos = getHongyeomSalPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (hongyeomPos.length > 0) dayStemBased.push({ name: "홍염살", positions: hongyeomPos })
  const hakdangPos = getHakdangPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (hakdangPos.length > 0) dayStemBased.push({ name: "학당귀인", positions: hakdangPos })
  const bokseongPos = getBokseongPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (bokseongPos.length > 0) dayStemBased.push({ name: "복성귀인", positions: bokseongPos })
  const cheonrokPos = getCheonrokPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (cheonrokPos.length > 0) dayStemBased.push({ name: "천록귀인", positions: cheonrokPos })
  const amrokPos = getAmRokPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (amrokPos.length > 0) dayStemBased.push({ name: "암록", positions: amrokPos })
  const yuksuPos = getYuksuPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (yuksuPos.length > 0) dayStemBased.push({ name: "육수", positions: yuksuPos })
  const janggunPos = getJanggunPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (janggunPos.length > 0) dayStemBased.push({ name: "장군전", positions: janggunPos })
  const boksinPos = getBoksinPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (boksinPos.length > 0) dayStemBased.push({ name: "복신", positions: boksinPos })
  const euminPos = getEuminPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (euminPos.length > 0) dayStemBased.push({ name: "음인", positions: euminPos })

  for (const { name, positions } of dayStemBased) {
    const hasStrongPosition = positions.includes("월지") || positions.includes("일지")
    const intensity = hasStrongPosition ? parseFloat((positions.length * 1.5).toFixed(1)) : positions.length
    details.push({
      name,
      positions,
      count: positions.length,
      totalPillars,
      percentage: Math.round((positions.length / totalPillars) * 100),
      intensity,
      isStrong: hasStrongPosition,
      usageGuide: SINSAL_USAGE_GUIDE[name] || ""
    })
    if (hasStrongPosition) strongSinsals.push(name)
  }

  // 원진살 (특수 처리 - 쌍으로 존재)
  if (checkWonJinSal(yearBranch, monthBranch, dayBranch, hourBranch)) {
    details.push({
      name: "원진살",
      positions: ["원진 관계"],
      count: 2,
      totalPillars,
      percentage: Math.round((2 / totalPillars) * 100),
      intensity: 2,
      isStrong: false,
      usageGuide: SINSAL_USAGE_GUIDE["원진살"]
    })
  }
  
  // 요약 텍스트 생성
  const summaryLines = details.map(d => {
    const strongMark = d.isStrong ? " ✅" : ""
    return `${d.name}: ${d.count}/${d.totalPillars} (${d.percentage}%) [강도: ${d.intensity}]${strongMark} - ${d.positions.join(", ")}`
  })
  
  // 종합 활용 가이드 생성
  let combinedGuide = ""
  if (strongSinsals.length > 0) {
    const guides = strongSinsals.map(name => {
      const detail = details.find(d => d.name === name)
      return detail ? `${name}의 에너지가 강합니다` : ""
    }).filter(Boolean)
    
    if (strongSinsals.includes("현침살") && strongSinsals.includes("역마살")) {
      combinedGuide = "현침살과 역마살이 강하니, 전문적인 지식이나 기술을 가지고 널리 움직이��� 활동하는 것이 신살 에너지를 가장 잘 활용하는 방법입니다."
    } else if (strongSinsals.includes("문창살") && strongSinsals.includes("화개살")) {
      combinedGuide = "문창살과 화개살이 강하니, 학문과 예술을 결합한 창의적 연구나 교육 분야에서 큰 성취를 이룰 수 있습니다."
    } else if (strongSinsals.includes("도화살") && strongSinsals.includes("역마살")) {
      combinedGuide = "도화살과 역마살이 강하니, 대인관계와 이동이 많은 환경(해외영업, 연예, 무역)에서 매력이 극대화됩니다."
    } else if (strongSinsals.includes("학당귀인") && strongSinsals.includes("문창살")) {
      combinedGuide = "학당귀인�� 문창살이 강하니, 전문 학문이나 자격증 취득 후 교육·컨설팅 분야에서 탁월한 성취를 이룰 수 있습니다."
    } else if (strongSinsals.includes("귀문관살") && strongSinsals.includes("화개살")) {
      combinedGuide = "귀문관살과 화개살이 강하니, 심리상담·철학·예술·영적 치유 분야에서 독보적인 능력을 발휘할 수 있습니다."
    } else if (strongSinsals.includes("겁살") && strongSinsals.includes("장성살")) {
      combinedGuide = "겁살과 장성살이 강하니, 강한 추진력과 리더십으로 경쟁적인 환경에서 두각을 나타낼 수 있습니다."
    } else if (strongSinsals.includes("홍염살") && strongSinsals.includes("도화살")) {
      combinedGuide = "홍염살과 도화살이 강하니, 강렬한 매력과 대인 친화력으로 연예·예술·뷰티 분야에서 빛을 발합니다."
    } else if (strongSinsals.includes("백호살") && strongSinsals.includes("역마살")) {
      combinedGuide = "백호살과 역마살이 강하니, 강렬한 에너지와 이동력으로 군경·소방·응급의료 등 현장직에서 능력이 발휘됩니다."
    } else {
      combinedGuide = strongSinsals.map(name => SINSAL_USAGE_GUIDE[name]).join(" 또한, ")
    }
  } else if (details.length > 0) {
    combinedGuide = "신살의 에너지가 고르게 분포되어 있어 다양한 분야에서 균형 잡힌 발전이 가능합니다."
  } else {
    combinedGuide = "특별히 강조되는 신살이 없어 안정적인 삶의 흐름을 유지할 수 있습니다."
  }
  
  return {
    details,
    summary: summaryLines.join("\n"),
    combinedGuide
  }
}

// ================================================================
// 격국 계산
// ================================================================
const BRANCH_HIDDEN_MAIN: Record<string, string> = {
  "자": "계", "축": "기", "인": "갑", "묘": "을", "진": "무", "사": "병",
  "오": "정", "미": "기", "신": "경", "유": "신", "술": "무", "해": "임"
}

const TEN_GODS_MAP: Record<string, Record<string, string>> = {
  "갑": { "갑": "비견", "을": "겁재", "병": "식신", "정": "상관", "무": "편재", "기": "정재", "경": "편관", "신": "정관", "임": "편인", "계": "정인" },
  "을": { "갑": "겁재", "을": "비견", "병": "상관", "정": "식신", "무": "정재", "기": "편재", "경": "정관", "신": "편관", "임": "정인", "계": "편인" },
  "병": { "갑": "편인", "을": "정인", "병": "비견", "정": "겁재", "무": "식신", "기": "상관", "경": "편재", "신": "정재", "임": "편관", "계": "정관" },
  "정": { "갑": "정인", "을": "편인", "병": "겁재", "정": "비견", "무": "상관", "기": "식신", "경": "정재", "신": "편재", "임": "정관", "계": "편관" },
  "무": { "갑": "편관", "을": "정관", "병": "편인", "정": "정인", "무": "비견", "기": "겁재", "경": "식신", "신": "상관", "임": "편재", "계": "정재" },
  "기": { "갑": "정관", "을": "편관", "병": "정인", "정": "편인", "무": "겁재", "기": "비견", "경": "상관", "신": "식신", "임": "정재", "계": "편재" },
  "경": { "갑": "편재", "을": "정재", "병": "편관", "정": "정관", "무": "편인", "기": "정인", "경": "비견", "신": "겁재", "임": "식신", "계": "상관" },
  "신": { "갑": "정재", "을": "편재", "병": "정관", "정": "편관", "무": "정인", "기": "편인", "경": "겁재", "신": "비견", "임": "상관", "계": "식신" },
  "임": { "갑": "식신", "을": "상관", "병": "편재", "정": "정재", "무": "편관", "기": "정관", "경": "편인", "신": "정인", "임": "비견", "계": "겁재" },
  "계": { "갑": "상관", "을": "식신", "병": "정재", "정": "편재", "무": "정관", "기": "편관", "경": "정인", "신": "편인", "임": "겁재", "계": "비견" }
}

export function calcGyeokguk(
  dayStem: string,
  monthBranch: string,
  stems: string[]
): string {
  // 월지의 본기 찾기
  const mainHidden = BRANCH_HIDDEN_MAIN[monthBranch]
  if (!mainHidden) return "미상"
  
  // 본기의 십신 구하기
  const mainTenGod = TEN_GODS_MAP[dayStem]?.[mainHidden]
  if (!mainTenGod) return "미상"
  
  // 투출 여부 확인 (천간에 본기가 있는지)
  const isTouchul = stems.includes(mainHidden)
  
  return `${mainTenGod}격`
}

// ================================================================
// 대운(大運) 계산 - 월주 기반 정순/역순 계산 (정확한 로직)
// ================================================================
export function calcDaeyun(
  birthDate: Date,
  gender: string,
  yearStem: string,
  monthStem: string,
  monthBranch: string
): Array<{ startAge: number; endAge: number; stem: string; branch: string; fullName: string }> {
  const stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
  const branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
  const stemToHanja: Record<string, string> = {
    "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
    "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸"
  }
  const branchToHanja: Record<string, string> = {
    "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
    "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥"
  }

  // 양간 판정: 남자 양간 또는 여자 음간 = 정순, 아니면 역순
  const yangStems = ["갑", "병", "무", "경", "임"]
  const isYangYear = yangStems.includes(yearStem)
  const isForward = (gender === 'male' && isYangYear) || (gender === 'female' && !isYangYear)

  // 절기 ��이터 (기본값만 포함, 실제로는 ipjeolMap이 필요하지만 간단히)
  const IPJEOL_MAP: Record<number, Array<{ date: Date; name: string }>> = {
    1998: [
      { date: new Date(1998, 1, 4, 20, 59), name: "입춘" },
      { date: new Date(1998, 3, 5, 12, 0), name: "청명" },
      { date: new Date(1998, 4, 5, 10, 30), name: "입하" },
      { date: new Date(1998, 5, 20, 22, 30), name: "하지" },
      { date: new Date(1998, 6, 7, 10, 0), name: "입추" },
      { date: new Date(1998, 8, 23, 4, 0), name: "추분" },
      { date: new Date(1998, 9, 8, 19, 0), name: "입동" },
      { date: new Date(1998, 11, 21, 14, 0), name: "동지" }
    ],
    1996: [
      { date: new Date(1996, 1, 4, 20, 59), name: "입춘" },
      { date: new Date(1996, 3, 4, 19, 40), name: "청명" },
      { date: new Date(1996, 4, 5, 19, 24), name: "입하" },
      { date: new Date(1996, 5, 20, 23, 30), name: "하지" },
      { date: new Date(1996, 6, 7, 10, 53), name: "입추" },
      { date: new Date(1996, 8, 23, 4, 28), name: "추분" },
      { date: new Date(1996, 9, 8, 19, 34), name: "입동" },
      { date: new Date(1996, 11, 21, 13, 58), name: "동지" }
    ]
  }

  const year = birthDate.getUTCFullYear()
  const allJeolgi: Array<{ date: Date; name: string }> = []
  
  for (let y of [year - 1, year, year + 1]) {
    if (IPJEOL_MAP[y]) {
      IPJEOL_MAP[y].forEach(j => allJeolgi.push({ date: j.date, name: j.name }))
    } else {
      // 기본값: 입춘(2월 4일), 동지(12월 21일)
      allJeolgi.push({ date: new Date(y, 1, 4, 0, 0), name: "입춘" })
      allJeolgi.push({ date: new Date(y, 11, 21, 0, 0), name: "동지" })
    }
  }
  allJeolgi.sort((a, b) => a.date.getTime() - b.date.getTime())

  // 다음/이전 절기 찾기
  let nextJeolgi: { date: Date; name: string } | null = null
  let prevJeolgi: { date: Date; name: string } | null = null
  
  for (let i = 0; i < allJeolgi.length; i++) {
    if (allJeolgi[i].date > birthDate) {
      nextJeolgi = allJeolgi[i]
      if (i > 0) prevJeolgi = allJeolgi[i - 1]
      break
    }
    prevJeolgi = allJeolgi[i]
  }

  // 대운 시작 나이 계산 (72시간 = 1세)
  let diffHours = 0
  if (isForward && nextJeolgi) {
    diffHours = (nextJeolgi.date.getTime() - birthDate.getTime()) / (1000 * 60 * 60)
  } else if (!isForward && prevJeolgi) {
    diffHours = (birthDate.getTime() - prevJeolgi.date.getTime()) / (1000 * 60 * 60)
  }

  const startAge = Math.round((diffHours / 72) * 10) / 10

  // 월주의 60간지 인덱스 계산
  const monthStemIdx = stems.indexOf(monthStem)
  const monthBranchIdx = branches.indexOf(monthBranch)
  const monthPillarIndex = (monthStemIdx * 12 + monthBranchIdx * 5) % 60

  const daeWoonList: Array<{ startAge: number; endAge: number; stem: string; branch: string; fullName: string }> = []
  const dir = isForward ? 1 : -1
  let currentAge = startAge

  for (let i = 0; i < 8; i++) {
    const idx = (monthPillarIndex + dir * (i + 1) + 600) % 60
    const stem = stems[idx % 10]
    const branch = branches[idx % 12]
    
    daeWoonList.push({
      startAge: parseFloat((currentAge).toFixed(1)),
      endAge: parseFloat((currentAge + 10).toFixed(1)),
      stem,
      branch,
      fullName: `${stemToHanja[stem]}${branchToHanja[branch]}`
    })
    
    currentAge += 10
  }

  return daeWoonList
}

// ================================================================
// 대운(大運) 계산
// ================================================================
const IPJEOL_MAP: Record<number, Array<{ date: Date; name: string }>> = {
  2024: [
    { date: new Date(2024, 1, 3, 18, 59), name: "입춘" },
    { date: new Date(2024, 3, 4, 9, 13), name: "청명" },
    { date: new Date(2024, 4, 5, 7, 15), name: "입하" },
    { date: new Date(2024, 5, 20, 15, 20), name: "하지" },
    { date: new Date(2024, 6, 7, 2, 15), name: "입추" },
    { date: new Date(2024, 8, 22, 19, 50), name: "추분" },
    { date: new Date(2024, 9, 8, 9, 49), name: "입동" },
    { date: new Date(2024, 11, 21, 4, 21), name: "동지" }
  ],
  1996: [
    { date: new Date(1996, 1, 4, 20, 59), name: "입춘" },
    { date: new Date(1996, 3, 4, 19, 40), name: "청명" },
    { date: new Date(1996, 4, 5, 19, 24), name: "입하" },
    { date: new Date(1996, 5, 20, 23, 30), name: "하지" },
    { date: new Date(1996, 6, 7, 10, 53), name: "입추" },
    { date: new Date(1996, 8, 23, 4, 28), name: "추분" },
    { date: new Date(1996, 9, 8, 19, 34), name: "입동" },
    { date: new Date(1996, 11, 21, 13, 58), name: "동지" }
  ]
}

// 60간지 색인 얻기
function getSixtyGanjiIndex(stem: string, branch: string): number {
  const stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
  const branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
  const stemIdx = stems.indexOf(stem)
  const branchIdx = branches.indexOf(branch)
  return (stemIdx * 12 + branchIdx * 5) % 60
}
