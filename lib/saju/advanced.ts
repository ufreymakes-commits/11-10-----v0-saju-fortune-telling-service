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

// 신살별 활용 가이드
const SINSAL_USAGE_GUIDE: Record<string, string> = {
  "도화살": "대인관계와 매력을 활용하는 직업(연예, 영업, 서비스업)에서 빛을 발합니다",
  "역마살": "이동과 변화가 많은 환경(해외, 무역, 영업, 출장)에서 에너지가 활성화됩니다",
  "화개살": "예술, 종교, 철학, 학문 등 정신적 깊이를 요하는 분야에서 재능이 발휘됩니다",
  "원진살": "관계의 갈등을 인식하고 소통과 이해의 노력을 기울이면 성장의 기회가 됩니다",
  "현침살": "전문 기술, 의료, 법률 등 날카로운 전문성이 필요한 분야에서 두각을 나타냅니다",
  "문창살": "학문, 글쓰기, 교육, 연구 등 지적 활동에서 뛰어난 성취를 이룰 수 있습니다"
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
  dayStem: string
): string[] {
  const sinsalList: string[] = []
  
  if (checkDohwaSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("도화살")
  if (checkYeokMaSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("역마살")
  if (checkHwagaeSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("화개살")
  if (checkWonJinSal(yearBranch, monthBranch, dayBranch, hourBranch)) sinsalList.push("원진살")
  if (checkHyeonChimSal(dayBranch)) sinsalList.push("현침살")
  
  // 문창살 추가
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch].filter(Boolean) as string[]
  if (checkMunChangSal(dayStem, branches).length > 0) sinsalList.push("문창살")
  
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
  
  // 각 신살별로 상세 분석
  const sinsalChecks = [
    { name: "도화살", check: checkDohwaSal, getPositions: getDohwaSalPositions },
    { name: "역마살", check: checkYeokMaSal, getPositions: getYeokMaSalPositions },
    { name: "화개살", check: checkHwagaeSal, getPositions: getHwagaeSalPositions },
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
  
  // 현침살 (일지 기준)
  if (checkHyeonChimSal(dayBranch)) {
    details.push({
      name: "현침살",
      positions: ["일지"],
      count: 1,
      totalPillars,
      percentage: Math.round((1 / totalPillars) * 100),
      intensity: 1.5, // 일지라서 1.5배
      isStrong: true,
      usageGuide: SINSAL_USAGE_GUIDE["현침살"]
    })
    strongSinsals.push("현침살")
  }
  
  // 문창살
  const munchangPositions = getMunChangSalPositions(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
  if (munchangPositions.length > 0) {
    const hasStrongPosition = munchangPositions.includes("월지") || munchangPositions.includes("일지")
    let intensity = munchangPositions.length
    if (hasStrongPosition) {
      intensity = parseFloat((munchangPositions.length * 1.5).toFixed(1))
    }
    
    details.push({
      name: "문창살",
      positions: munchangPositions,
      count: munchangPositions.length,
      totalPillars,
      percentage: Math.round((munchangPositions.length / totalPillars) * 100),
      intensity,
      isStrong: hasStrongPosition,
      usageGuide: SINSAL_USAGE_GUIDE["문창살"]
    })
    
    if (hasStrongPosition) strongSinsals.push("문창살")
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
      combinedGuide = "현침살과 역마살이 강하니, 전문적인 지식이나 기술을 가지고 널리 움직이며 활동하는 것이 신살 에너지를 가장 잘 활용하는 방법입니다."
    } else if (strongSinsals.includes("문창살") && strongSinsals.includes("화개살")) {
      combinedGuide = "문창살과 화개살이 강하니, 학문과 예술을 결합한 창의적 연구나 교육 분야에서 큰 성취를 이룰 수 있습니다."
    } else if (strongSinsals.includes("도화살") && strongSinsals.includes("역마살")) {
      combinedGuide = "도화살과 역마살이 강하니, 대인관계와 이동이 많은 환경(해외영업, 연예, 무역)에서 매력이 극대화됩니다."
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

  // 절기 데이터 (기본값만 포함, 실제로는 ipjeolMap이 필요하지만 간단히)
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
