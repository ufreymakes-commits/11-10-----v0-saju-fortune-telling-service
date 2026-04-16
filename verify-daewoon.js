#!/usr/bin/env node

/**
 * 대운 계산 검증 스크립트
 * 3가지 테스트 케이스: 1996-05-22, 2000-04-07, 1995-05-27
 */

const stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const branches = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
const stemToHanja = {
  "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
  "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸"
}
const branchToHanja = {
  "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
  "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥"
}

// 올바른 60간지 계산
function getSixtyGanjiIndex(stem, branch) {
  const stemIdx = stems.indexOf(stem)
  const branchIdx = branches.indexOf(branch)
  return (stemIdx * 12 + branchIdx) % 60
}

// 60간지 인덱스로부터 간지 추출
function getGanzhiFromIndex(idx) {
  const stem = stems[Math.floor(idx / 12) % 10]
  const branch = branches[idx % 12]
  return { stem, branch }
}

// 테스트 케이스
const testCases = [
  {
    name: "Case 1: 1996-05-22 15:30 South Korea Female",
    monthStem: "사",
    monthBranch: "사",
    gender: "female",
    expectedDaewoon: [
      "0.4 ~ 10.4: 임진(壬辰)",
      "10.4 ~ 20.4: 신묘(辛卯)",
      "20.4 ~ 30.4: 경인(庚寅)",
      "30.4 ~ 40.4: 기축(己丑)",
      "40.4 ~ 50.4: 무자(戊子)",
      "50.4 ~ 60.4: 정해(丁亥)",
      "60.4 ~ 70.4: 병술(丙戌)",
      "70.4 ~ 80.4: 을유(乙酉)"
    ]
  },
  {
    name: "Case 2: 2000-04-07 15:06 Los Angeles Female",
    monthStem: "진",
    monthBranch: "진",
    gender: "female",
    expectedDaewoon: [
      "1.0 ~ 11.0: 기묘(己卯)",
      "11.0 ~ 21.0: 무인(戊寅)",
      "21.0 ~ 31.0: 정축(丁丑)",
      "31.0 ~ 41.0: 병자(丙子)",
      "41.0 ~ 51.0: 을해(乙亥)",
      "51.0 ~ 61.0: 갑술(甲戌)",
      "61.0 ~ 71.0: 계유(癸酉)",
      "71.0 ~ 81.0: 임신(壬申)"
    ]
  },
  {
    name: "Case 3: 1995-05-27 21:35 Philippines Female",
    monthStem: "을",
    monthBranch: "오",
    gender: "female",
    expectedDaewoon: [
      "1.9 ~ 11.9: 경진(庚辰)",
      "11.9 ~ 21.9: 기묘(己卯)",
      "21.9 ~ 31.9: 무인(戊寅)",
      "31.9 ~ 41.9: 정축(丁丑)",
      "41.9 ~ 51.9: 병자(丙子)",
      "51.9 ~ 61.9: 을해(乙亥)",
      "61.9 ~ 71.9: 갑술(甲戌)",
      "71.9 ~ 81.9: 계유(癸酉)"
    ]
  }
]

console.log("=== 대운 계산 검증 ===\n")

testCases.forEach(testCase => {
  console.log(`\n${testCase.name}`)
  console.log(`월주: ${testCase.monthStem}${testCase.monthBranch}`)
  console.log(`성별: ${testCase.gender}`)
  
  const monthPillarIndex = getSixtyGanjiIndex(testCase.monthStem, testCase.monthBranch)
  console.log(`월주 60간지 인덱스: ${monthPillarIndex}`)
  
  // 여자는 역순 (-1)
  const dir = testCase.gender === 'female' ? -1 : 1
  
  console.log("\n계산된 대운:")
  for (let i = 0; i < 8; i++) {
    const idx = (monthPillarIndex + dir * (i + 1) + 600) % 60
    const { stem, branch } = getGanzhiFromIndex(idx)
    console.log(`  ${i + 1}. [인덱스 ${idx}] ${stem}${branch}(${stemToHanja[stem]}${branchToHanja[branch]})`)
  }
  
  console.log("\n예상된 대운:")
  testCase.expectedDaewoon.forEach((exp, i) => {
    console.log(`  ${i + 1}. ${exp}`)
  })
  
  console.log("\n" + "=".repeat(50))
})

console.log("\n✅ 검증 완료. 계산된 간지와 예상 값을 비교해주세요.")
