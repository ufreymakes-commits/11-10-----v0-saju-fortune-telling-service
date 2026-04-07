// ================================================================
// Saju Advanced Analysis - 사주 심화 분석
// Converted from extraadvanced.gs
// ================================================================

import {
  STEMS, BRANCHES, STEM_TO_ELEMENT, BRANCH_TO_ELEMENT,
  HIDDEN_STEMS, SIXTY_JIAZI, STEM_YIN_YANG,
  TWELVE_STARS, JANG_SAENG_BRANCH,
  type Stem, type Branch, type Element, type TwelveStar
} from './constants';
import type { FourPillars } from './core-calculator';

// ================================================================
// 12운성 계산
// ================================================================

export function getTwelveStar(dayStem: Stem, branch: Branch): TwelveStar {
  const isYang = STEM_YIN_YANG[dayStem] === "양";
  const startBranch = JANG_SAENG_BRANCH[dayStem];
  const startIndex = BRANCHES.indexOf(startBranch);
  const branchIndex = BRANCHES.indexOf(branch);

  if (startIndex < 0 || branchIndex < 0) return "장생";

  const diff = isYang
    ? ((branchIndex - startIndex + 12) % 12)
    : ((startIndex - branchIndex + 12) % 12);

  return TWELVE_STARS[diff];
}

export function calcTwelveStars(
  dayStem: Stem,
  yearBranch: Branch,
  monthBranch: Branch,
  dayBranch: Branch,
  hourBranch: Branch | null
): { position: string; branch: Branch; star: TwelveStar }[] {
  const results = [
    { position: "연지", branch: yearBranch, star: getTwelveStar(dayStem, yearBranch) },
    { position: "월지", branch: monthBranch, star: getTwelveStar(dayStem, monthBranch) },
    { position: "일지", branch: dayBranch, star: getTwelveStar(dayStem, dayBranch) },
  ];

  if (hourBranch) {
    results.push({ position: "시지", branch: hourBranch, star: getTwelveStar(dayStem, hourBranch) });
  }

  return results;
}

// ================================================================
// 천간합
// ================================================================

const CHEONGGAN_HAP: [Stem, Stem, Element][] = [
  ["갑", "기", "토"],
  ["을", "경", "금"],
  ["병", "신", "수"],
  ["정", "임", "목"],
  ["무", "계", "화"]
];

export function calcCheongganHap(yearStem: Stem, monthStem: Stem, dayStem: Stem, hourStem: Stem | null): string[] {
  const stems: (Stem | null)[] = [yearStem, monthStem, dayStem, hourStem];
  const labels = ["연간", "월간", "일간", "시간"];
  const results: string[] = [];

  for (const [a, b, result] of CHEONGGAN_HAP) {
    const indexA = stems.indexOf(a);
    const indexB = stems.indexOf(b);
    if (indexA >= 0 && indexB >= 0 && indexA !== indexB) {
      results.push(`${labels[indexA]}${a}+${labels[indexB]}${b}→${result}합`);
    }
  }

  return results;
}

// ================================================================
// 지지육합
// ================================================================

const JIJI_YUGHAP: [Branch, Branch, Element][] = [
  ["자", "축", "토"],
  ["인", "해", "목"],
  ["묘", "술", "화"],
  ["진", "유", "금"],
  ["사", "신", "수"],
  ["오", "미", "토"]
];

export function calcJijiYughap(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: (Branch | null)[] = [yearBranch, monthBranch, dayBranch, hourBranch];
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  for (const [a, b, result] of JIJI_YUGHAP) {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}→${result}(육합)`);
        }
      }
    }
  }

  return results;
}

// ================================================================
// 지지삼합
// ================================================================

const JIJI_SAMHAP: [Branch[], Element][] = [
  [["인", "오", "술"], "화"],
  [["사", "유", "축"], "금"],
  [["신", "자", "진"], "수"],
  [["해", "묘", "미"], "목"]
];

export function calcJijiSamhap(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: Branch[] = [yearBranch, monthBranch, dayBranch];
  if (hourBranch) branches.push(hourBranch);
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  for (const [group, result] of JIJI_SAMHAP) {
    const found = group.filter(b => branches.includes(b));
    if (found.length >= 2) {
      const posLabels = found.map(b => `${labels[branches.indexOf(b)]}${b}`);
      const type = found.length === 3 ? "삼합" : "반합";
      results.push(`${posLabels.join("+")}→${result}(${type})`);
    }
  }

  return results;
}

// ================================================================
// 지지방합
// ================================================================

const JIJI_BANGHAP: [Branch[], Element][] = [
  [["인", "묘", "진"], "목"],
  [["사", "오", "미"], "화"],
  [["신", "유", "술"], "금"],
  [["해", "자", "축"], "수"]
];

export function calcJijiBanghap(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: Branch[] = [yearBranch, monthBranch, dayBranch];
  if (hourBranch) branches.push(hourBranch);
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  for (const [group, result] of JIJI_BANGHAP) {
    const found = group.filter(b => branches.includes(b));
    if (found.length >= 2) {
      const posLabels = found.map(b => `${labels[branches.indexOf(b)]}${b}`);
      const type = found.length === 3 ? "방합" : "방합(부분)";
      results.push(`${posLabels.join("+")}→${result}(${type})`);
    }
  }

  return results;
}

// ================================================================
// 천간충
// ================================================================

const CHEONGGAN_CHUNG: [Stem, Stem][] = [
  ["갑", "경"],
  ["을", "신"],
  ["병", "임"],
  ["정", "계"]
];

export function calcCheongganChung(yearStem: Stem, monthStem: Stem, dayStem: Stem, hourStem: Stem | null): string[] {
  const stems: (Stem | null)[] = [yearStem, monthStem, dayStem, hourStem];
  const labels = ["연간", "월간", "일간", "시간"];
  const results: string[] = [];

  for (const [a, b] of CHEONGGAN_CHUNG) {
    for (let i = 0; i < stems.length; i++) {
      for (let j = i + 1; j < stems.length; j++) {
        if ((stems[i] === a && stems[j] === b) || (stems[i] === b && stems[j] === a)) {
          results.push(`${labels[i]}${stems[i]}↔${labels[j]}${stems[j]}(천간충)`);
        }
      }
    }
  }

  return results;
}

// ================================================================
// 지지충
// ================================================================

const JIJI_CHUNG: [Branch, Branch][] = [
  ["자", "오"],
  ["축", "미"],
  ["인", "신"],
  ["묘", "유"],
  ["진", "술"],
  ["사", "해"]
];

export function calcJijiChung(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: (Branch | null)[] = [yearBranch, monthBranch, dayBranch, hourBranch];
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  for (const [a, b] of JIJI_CHUNG) {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}↔${labels[j]}${branches[j]}(지지충)`);
        }
      }
    }
  }

  return results;
}

// ================================================================
// 공망 계산
// ================================================================

const GONGMANG_MAP: Branch[][] = [
  ["술", "해"],
  ["신", "유"],
  ["오", "미"],
  ["진", "사"],
  ["인", "묘"],
  ["자", "축"]
];

export function calcGongmang(dayStem: Stem, dayBranch: Branch): Branch[] {
  const pillar = `${dayStem}${dayBranch}`;
  const idx = SIXTY_JIAZI.indexOf(pillar);
  if (idx < 0) return [];
  return GONGMANG_MAP[Math.floor(idx / 10)];
}

// ================================================================
// 형 (刑)
// ================================================================

export function calcHyeong(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: Branch[] = [yearBranch, monthBranch, dayBranch];
  if (hourBranch) branches.push(hourBranch);
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  // 무은지형: 인사신
  const muEun = ["인", "사", "신"].filter(b => branches.includes(b as Branch));
  if (muEun.length >= 2) {
    results.push(`무은지형(${muEun.map(b => `${labels[branches.indexOf(b as Branch)]}${b}`).join("+")})`);
  }

  // 지세지형: 축술미
  const jiSe = ["축", "술", "미"].filter(b => branches.includes(b as Branch));
  if (jiSe.length >= 2) {
    results.push(`지세지형(${jiSe.map(b => `${labels[branches.indexOf(b as Branch)]}${b}`).join("+")})`);
  }

  // 무례지형: 자묘
  if (branches.includes("자") && branches.includes("묘")) {
    results.push(`무례지형(${labels[branches.indexOf("자")]}자+${labels[branches.indexOf("묘")]}묘)`);
  }

  // 자형
  const selfPunish: Branch[] = ["진", "오", "유", "해"];
  for (const b of selfPunish) {
    if (branches.filter(x => x === b).length >= 2) {
      results.push(`자형(${b}${b})`);
    }
  }

  return results;
}

// ================================================================
// 파 (破)
// ================================================================

const JIJI_PA: [Branch, Branch][] = [
  ["자", "유"],
  ["축", "진"],
  ["인", "해"],
  ["묘", "오"],
  ["사", "신"],
  ["술", "미"]
];

export function calcPa(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: (Branch | null)[] = [yearBranch, monthBranch, dayBranch, hourBranch];
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  for (const [a, b] of JIJI_PA) {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}(파)`);
        }
      }
    }
  }

  return results;
}

// ================================================================
// 해 (害)
// ================================================================

const JIJI_HAE: [Branch, Branch][] = [
  ["자", "미"],
  ["축", "오"],
  ["인", "사"],
  ["묘", "진"],
  ["신", "해"],
  ["유", "술"]
];

export function calcHae(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: (Branch | null)[] = [yearBranch, monthBranch, dayBranch, hourBranch];
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  for (const [a, b] of JIJI_HAE) {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}(해)`);
        }
      }
    }
  }

  return results;
}

// ================================================================
// 원진
// ================================================================

const WONJIN_PAIRS: [Branch, Branch][] = [
  ["자", "미"],
  ["축", "오"],
  ["인", "유"],
  ["묘", "신"],
  ["진", "해"],
  ["사", "술"]
];

export function calcWonjin(yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null): string[] {
  const branches: (Branch | null)[] = [yearBranch, monthBranch, dayBranch, hourBranch];
  const labels = ["연지", "월지", "일지", "시지"];
  const results: string[] = [];

  for (const [a, b] of WONJIN_PAIRS) {
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          results.push(`${labels[i]}${branches[i]}+${labels[j]}${branches[j]}(원진)`);
        }
      }
    }
  }

  return results;
}

// ================================================================
// 길성 (천을귀인, 문창귀인, 태극귀인, 삼기귀인)
// ================================================================

const CHEONUL_MAP: Partial<Record<Stem, Branch[]>> = {
  "갑": ["축", "미"], "무": ["축", "미"], "경": ["축", "미"],
  "을": ["자", "신"], "기": ["자", "신"],
  "병": ["해", "유"], "정": ["해", "유"],
  "임": ["사", "묘"], "계": ["사", "묘"], "신": ["인", "오"]
};

const MUNCHANG_MAP: Record<Stem, Branch> = {
  "갑": "사", "을": "오", "병": "신", "정": "유", "무": "신",
  "기": "유", "경": "해", "신": "자", "임": "인", "계": "묘"
};

const TAEGEUK_MAP: Partial<Record<Stem, Branch[]>> = {
  "갑": ["자", "오"], "을": ["자", "오"],
  "병": ["묘", "유"], "정": ["묘", "유"],
  "무": ["진", "술", "축", "미"], "기": ["진", "술", "축", "미"],
  "경": ["인", "해"], "신": ["인", "해"],
  "임": ["사", "신"], "계": ["사", "신"]
};

export interface GilseongResult {
  cheonul: string[];
  munchang: string[];
  taegeuk: string[];
  samgi: string[];
}

export function calcGilseong(
  dayStem: Stem,
  yearStem: Stem,
  monthStem: Stem,
  hourStem: Stem | null,
  yearBranch: Branch,
  monthBranch: Branch,
  dayBranch: Branch,
  hourBranch: Branch | null
): GilseongResult {
  const branches: (Branch | null)[] = [yearBranch, monthBranch, dayBranch, hourBranch];
  const stems: (Stem | null)[] = [yearStem, monthStem, dayStem, hourStem];
  const branchLabels = ["연지", "월지", "일지", "시지"];

  const result: GilseongResult = {
    cheonul: [],
    munchang: [],
    taegeuk: [],
    samgi: []
  };

  // 천을귀인
  const cheonulTargets = CHEONUL_MAP[dayStem] || [];
  for (let i = 0; i < branches.length; i++) {
    if (branches[i] && cheonulTargets.includes(branches[i]!)) {
      result.cheonul.push(`${branchLabels[i]}${branches[i]}`);
    }
  }

  // 문창귀인
  const munchangTarget = MUNCHANG_MAP[dayStem];
  for (let i = 0; i < branches.length; i++) {
    if (branches[i] === munchangTarget) {
      result.munchang.push(`${branchLabels[i]}${branches[i]}`);
    }
  }

  // 태극귀인
  const taegeukTargets = TAEGEUK_MAP[dayStem] || [];
  for (let i = 0; i < branches.length; i++) {
    if (branches[i] && taegeukTargets.includes(branches[i]!)) {
      result.taegeuk.push(`${branchLabels[i]}${branches[i]}`);
    }
  }

  // 삼기귀인
  const samgiGroups: Stem[][] = [
    ["갑", "무", "경"],
    ["을", "병", "정"],
    ["임", "계", "신"]
  ];
  for (const group of samgiGroups) {
    if (group.every(s => stems.includes(s))) {
      result.samgi.push(group.join(""));
    }
  }

  return result;
}

// ================================================================
// 신강/신약 판단
// ================================================================

function getTenGodType(dayElement: Element, targetElement: Element): string {
  if (targetElement === dayElement) return "비겁";

  const sheng: Record<Element, Element> = { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" };
  const ke: Record<Element, Element> = { "목": "토", "토": "수", "수": "화", "화": "금", "금": "목" };

  if (sheng[targetElement] === dayElement) return "인성";
  if (sheng[dayElement] === targetElement) return "식상";
  if (ke[dayElement] === targetElement) return "재성";
  if (ke[targetElement] === dayElement) return "관성";

  return "";
}

export interface SinGangSinYakResult {
  grade: string;
  ratio: number;
  supportScore: number;
  weakenScore: number;
}

export function calcSinGangSinYak(
  yearStem: Stem, monthStem: Stem, dayStem: Stem, hourStem: Stem | null,
  yearBranch: Branch, monthBranch: Branch, dayBranch: Branch, hourBranch: Branch | null,
  timeKnown: boolean = true
): SinGangSinYakResult {
  const dayElement = STEM_TO_ELEMENT[dayStem];
  let supportScore = 0;
  let weakenScore = 0;

  function addScore(element: Element, weight: number) {
    const tenGodType = getTenGodType(dayElement, element);
    if (tenGodType === "비겁" || tenGodType === "인성") {
      supportScore += weight;
    } else if (tenGodType === "식상" || tenGodType === "재성" || tenGodType === "관성") {
      weakenScore += weight;
    }
  }

  // 천간 (일간 제외)
  [yearStem, monthStem, hourStem].filter(Boolean).forEach(s => {
    addScore(STEM_TO_ELEMENT[s!], 1);
  });

  // 지지 (가중치: 연지 1, 월지 2, 일지 1, 시지 0.5)
  const branchWeights = [1, 2, 1, timeKnown ? 0.5 : 0];
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch];

  branches.forEach((b, i) => {
    if (!b) return;
    const weight = branchWeights[i];

    // 지지 본기
    addScore(BRANCH_TO_ELEMENT[b], weight);

    // 장간
    const hidden = HIDDEN_STEMS[b] || [];
    hidden.forEach(hs => {
      addScore(STEM_TO_ELEMENT[hs], weight * 0.5);
    });
  });

  const total = supportScore + weakenScore;
  if (total === 0) {
    return { grade: "계산불가", ratio: 0, supportScore: 0, weakenScore: 0 };
  }

  const ratio = Math.round((supportScore / total) * 100);

  let grade: string;
  if (ratio >= 85) grade = "극왕";
  else if (ratio >= 70) grade = "태강";
  else if (ratio >= 58) grade = "신강";
  else if (ratio >= 50) grade = "중화신강";
  else if (ratio >= 42) grade = "중화신약";
  else if (ratio >= 30) grade = "신약";
  else if (ratio >= 15) grade = "태약";
  else grade = "극약";

  return { grade, ratio, supportScore, weakenScore };
}

// ================================================================
// 억부용신
// ================================================================

export function getEokbuYongsin(dayStem: Stem, grade: string): string {
  const dayElement = STEM_TO_ELEMENT[dayStem];
  
  const ke: Record<Element, Element> = { "목": "금", "화": "수", "토": "목", "금": "화", "수": "토" };
  const keTarget: Record<Element, Element> = { "목": "토", "화": "금", "토": "수", "금": "목", "수": "화" };
  const shengBy: Record<Element, Element> = { "목": "수", "화": "목", "토": "화", "금": "토", "수": "금" };
  const shengTo: Record<Element, Element> = { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" };

  const strongGrades = ["신강", "태강", "극왕", "중화신강"];

  if (strongGrades.includes(grade)) {
    return `${ke[dayElement]}(관성) > ${keTarget[dayElement]}(재성) > ${shengTo[dayElement]}(식상)`;
  } else {
    return `${shengBy[dayElement]}(인성) > ${dayElement}(비겁)`;
  }
}

// ================================================================
// 조후용신
// ================================================================

const JOHU_TABLE: Record<Branch, Partial<Record<Stem, string>>> = {
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
};

export function calcJohuYongsin(dayStem: Stem, monthBranch: Branch): string {
  return JOHU_TABLE[monthBranch]?.[dayStem] || "해당없음";
}

// ================================================================
// 심화 분석 통합
// ================================================================

export interface AdvancedAnalysisResult {
  twelveStars: { position: string; branch: Branch; star: TwelveStar }[];
  cheongganHap: string[];
  jijiYughap: string[];
  jijiSamhap: string[];
  jijiBanghap: string[];
  cheongganChung: string[];
  jijiChung: string[];
  gongmang: Branch[];
  hyeong: string[];
  pa: string[];
  hae: string[];
  wonjin: string[];
  gilseong: GilseongResult;
  sinGangSinYak: SinGangSinYakResult;
  eokbuYongsin: string;
  johuYongsin: string;
}

export function runAdvancedAnalysis(fourPillars: FourPillars, timeKnown: boolean = true): AdvancedAnalysisResult {
  const { year, month, day, hour } = fourPillars;
  const ys = year.stem, yb = year.branch;
  const ms = month.stem, mb = month.branch;
  const ds = day.stem, db = day.branch;
  const hs = hour?.stem ?? null, hb = hour?.branch ?? null;

  const sinGangSinYak = calcSinGangSinYak(ys, ms, ds, hs, yb, mb, db, hb, timeKnown);

  return {
    twelveStars: calcTwelveStars(ds, yb, mb, db, hb),
    cheongganHap: calcCheongganHap(ys, ms, ds, hs),
    jijiYughap: calcJijiYughap(yb, mb, db, hb),
    jijiSamhap: calcJijiSamhap(yb, mb, db, hb),
    jijiBanghap: calcJijiBanghap(yb, mb, db, hb),
    cheongganChung: calcCheongganChung(ys, ms, ds, hs),
    jijiChung: calcJijiChung(yb, mb, db, hb),
    gongmang: calcGongmang(ds, db),
    hyeong: calcHyeong(yb, mb, db, hb),
    pa: calcPa(yb, mb, db, hb),
    hae: calcHae(yb, mb, db, hb),
    wonjin: calcWonjin(yb, mb, db, hb),
    gilseong: calcGilseong(ds, ys, ms, hs, yb, mb, db, hb),
    sinGangSinYak,
    eokbuYongsin: getEokbuYongsin(ds, sinGangSinYak.grade),
    johuYongsin: calcJohuYongsin(ds, mb)
  };
}
