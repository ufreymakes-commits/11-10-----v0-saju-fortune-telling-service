import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createAdminClient } from '@/lib/supabase/server'

// ================================================================
// STAGE 1: Build complete allSajuData (99 facts와 동일하게)
// ================================================================
function buildAllSajuData(
  personAName: string,
  personBName: string,
  sajuDataA: Record<string, unknown>,
  sajuDataB: Record<string, unknown>
) {
  const formatSajuData = (name: string, saju: Record<string, unknown>) => {
    // 99 facts의 allSajuData 구조와 동일하게 구성
    return {
      name,
      // 기본 정보
      birthDate: saju.birthDate || '',
      
      // 4주 (천간/지지)
      fourPillars: saju.fourPillars || {},
      
      // 일간 (중요)
      dayMaster: (saju.dayPillar as any)?.stem || '',
      dayMasterKorean: saju.dayMasterKorean || '',
      
      // 격국
      lifeStage: saju.gyeokguk || '',
      
      // 신강/신약
      energyGrade: (saju.sinGangSinYak as any)?.grade || '',
      energyRatio: (saju.sinGangSinYak as any)?.ratio || 0,
      
      // 오행 개수
      elementCountBasic: saju.elementCountBasic || {},
      elementCountWithHidden: saju.elementCount || {},
      
      // 오행 점수
      elementScore: saju.elementBalanceKorean || {},
      dominantElement: saju.dominantElement || '',
      
      // 십신
      tenGodsPresent: (saju.tenGods as any)?.present || [],
      tenGodsMissing: (saju.tenGods as any)?.missing || [],
      tenGodsCounts: saju.tenGodsCounts || {},
      tenGodsByPosition: (saju.tenGods as any)?.byPosition || {},
      
      // 12운성
      twelveStars: saju.twelveStars || [],
      
      // 관계식
      harmonies: {
        cheongganHap: saju.cheongganHap || [],
        jijiYughap: saju.jijiYughap || [],
        jijiSamhap: saju.jijiSamhap || [],
        jijiBanghap: saju.jijiBanghap || []
      },
      
      clashes: {
        cheongganChung: saju.cheongganChung || [],
        jijiChung: saju.jijiChung || []
      },
      
      hyeong: saju.hyeong || [],
      pa: saju.pa || [],
      hae: saju.hae || [],
      wonjin: saju.wonjin || [],
      
      // 길성
      gilseong: saju.gilseong || {},
      
      // 공망
      gongmang: saju.gongmang || [],
      
      // 신살
      spirits: saju.spirits || [],
      sinsalDetails: saju.sinsalDetails || [],
      sinsalSummary: saju.sinsalSummary || '',
      sinsalCombinedGuide: saju.sinsalCombinedGuide || '',
      
      // 12신살
      twelveSinsalByYearBranch: saju.twelveSinsalByYearBranch || {},
      twelveSinsalByDayBranch: saju.twelveSinsalByDayBranch || {},
      
      // 용신
      yongsin: saju.yongsin || { eokbu: 'None', johu: 'None', exists: false },
      
      // 대운
      daewoon: saju.daewoon || [],
      
      // 연운
      yeonwoon: saju.yeonwoon || { current2026: 'N/A', allYears: [] },
      
      // 합충 정보
      hapChungSummary: saju.hapChungSummary || '',
      hapChungAdjustmentDetails: saju.hapChungAdjustmentDetails || []
    }
  }

  return {
    personA: formatSajuData(personAName, sajuDataA),
    personB: formatSajuData(personBName, sajuDataB)
  }
}

// ================================================================
// 궁합 점수 계산 함수 (데이터 기반 - 일관된 결과)
// ================================================================
function calculateCompatibilityScore(sajuA: Record<string, unknown>, sajuB: Record<string, unknown>): {
  score: number
  relationshipType: 'Soulmate Type' | 'Complementary Type' | 'Effort-Required Type' | 'Karmic Type'
} {
  let score = 50 // 기본 점수

  // 1. 일간합 체크 (갑기, 을경, 병신, 정임, 무계) - +15점
  const dayMasterA = (sajuA.dayMaster as string) || ''
  const dayMasterB = (sajuB.dayMaster as string) || ''
  const ilganHapPairs = [
    ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']
  ]
  const hasIlganHap = ilganHapPairs.some(
    ([a, b]) => (dayMasterA === a && dayMasterB === b) || (dayMasterA === b && dayMasterB === a)
  )
  if (hasIlganHap) score += 15

  // 2. 일지 육합 체크 - +12점
  const dayBranchA = (sajuA.dayPillar as any)?.branch || ''
  const dayBranchB = (sajuB.dayPillar as any)?.branch || ''
  const yukHapPairs = [
    ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']
  ]
  const hasYukHap = yukHapPairs.some(
    ([a, b]) => (dayBranchA === a && dayBranchB === b) || (dayBranchA === b && dayBranchB === a)
  )
  if (hasYukHap) score += 12

  // 3. 일지 삼합 체크 - +8점
  const samhapGroups = [
    ['寅', '午', '戌'], ['申', '子', '辰'], ['巳', '酉', '丑'], ['亥', '卯', '未']
  ]
  const hasSamhap = samhapGroups.some(
    group => group.includes(dayBranchA) && group.includes(dayBranchB)
  )
  if (hasSamhap) score += 8

  // 4. 일지충 체크 - -10점
  const chungPairs = [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']
  ]
  const hasChung = chungPairs.some(
    ([a, b]) => (dayBranchA === a && dayBranchB === b) || (dayBranchA === b && dayBranchB === a)
  )
  if (hasChung) score -= 10

  // 5. 원진 체크 - -8점
  const wonjinPairs = [
    ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']
  ]
  const hasWonjin = wonjinPairs.some(
    ([a, b]) => (dayBranchA === a && dayBranchB === b) || (dayBranchA === b && dayBranchB === a)
  )
  if (hasWonjin) score -= 8

  // 6. 오행 상생/상극 체크
  const dominantA = (sajuA.dominantElement as string) || ''
  const dominantB = (sajuB.dominantElement as string) || ''
  // 상생: 목→화→토→금→수→목 (+5점)
  const sangsaeng = [['목', '화'], ['화', '토'], ['토', '금'], ['금', '수'], ['수', '목']]
  const hasSangsaeng = sangsaeng.some(
    ([a, b]) => (dominantA === a && dominantB === b) || (dominantA === b && dominantB === a)
  )
  if (hasSangsaeng) score += 5
  // 상극: 목→토, 토→수, 수→화, 화→금, 금→목 (-5점)
  const sanggeuk = [['목', '토'], ['토', '수'], ['수', '화'], ['화', '금'], ['금', '목']]
  const hasSanggeuk = sanggeuk.some(
    ([a, b]) => (dominantA === a && dominantB === b) || (dominantA === b && dominantB === a)
  )
  if (hasSanggeuk) score -= 5

  // 7. 신강/신약 보완 체크 - +5점
  const gradeA = (sajuA.sinGangSinYak as any)?.grade || ''
  const gradeB = (sajuB.sinGangSinYak as any)?.grade || ''
  if ((gradeA === '신강' && gradeB === '신약') || (gradeA === '신약' && gradeB === '신강')) {
    score += 5
  }

  // 점수 범위 제한 (40-95)
  score = Math.max(40, Math.min(95, score))

  // 관계 유형 결정 (점수 기반)
  let relationshipType: 'Soulmate Type' | 'Complementary Type' | 'Effort-Required Type' | 'Karmic Type'
  if (score >= 80) {
    relationshipType = 'Soulmate Type'
  } else if (score >= 65) {
    relationshipType = 'Complementary Type'
  } else if (score >= 50) {
    relationshipType = 'Effort-Required Type'
  } else {
    relationshipType = 'Karmic Type'
  }

  return { score, relationshipType }
}

// ================================================================
// Gemini helper - AI SDK 사용 (generate-gemini와 동일)
// ================================================================
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const result = await generateText({
    model: 'google/gemini-2.5-
    2026-06-03 05:28:03.029 [info] [v0] Gemini: Stage 1 response received, parsing...
2026-06-03 05:28:03.030 [info] [v0] Gemini: Raw response length: 36280
2026-06-03 05:28:03.030 [info] [v0] Gemini: ===== STAGE 1 OUTPUT =====
2026-06-03 05:28:03.030 [info] [v0] Gemini: social_genes.career_fit = Your core social DNA is all about that 정인격 (Direct Resource Structure). This means you're naturally wired for roles that involve deep learning, research, teaching, or counseling. You thrive in environments where knowledge is power and stability is key. Think of it as having main character energy in any field that values intellect, certification, and a solid foundation of understanding. You're not just about surface-level stuff; you're here for the deep dives and the real wisdom.
2026-06-03 05:28:03.030 [info] [v0] Gemini: independence_index = {"singang_sinyak":"중화신강 (Balanced Strong)","percentage":"55%","life_strategy":"With a 'Balanced Strong' Day Master at 55%, you've got a super robust sense of self and serious willpower. You're not easily swayed by others and prefer to be the main character of your own story, calling the shots. You can handle pressure like a champ and bounce back from anything. This totally aligns with your 'True Predator' vibe in career, meaning you're naturally inclined to lead, innovate, and carve out your own path. Don't be afraid to trust your gut and take charge, because you're built for it."}
2026-06-03 05:28:03.031 [info] [v0] Gemini: Full Stage 1 Output: {
  "persona_conflict": {
    "day_master": "己 (Gi Earth)",
    "month_branch": "巳 (Sa Fire)",
    "analysis": "Okay, so your core vibe, your Day Master 己 (Gi Earth), is all about being grounded, nurturing, and super adaptable, kinda like fertile soil. But then your Month Branch, 巳 (Sa Fire), which sets your early life and social scene, is straight-up fire energy. For you, that fire translates to 정인 (Direct Resource), meaning a deep-seated need for knowledge, wisdom, and stability. It's not a clash, more like your nurturing core gets a major glow-up from a super intellectual and supportive environment. You're naturally grounded but also lowkey brilliant, always soaking up info, and can totally bring the heat with your ideas when needed. It's like you're a chill, wise sage with a secret competitive streak and a knack for expressing yourself."
  },
  "energy_overload": {
    "dominant_element": "Fire (화)",
    "dominant_ten_god": "정인 (Direct Resource)",
    "effect": "Your chart is seriously lit with Fire energy, making it your dominant element. For you, 己 (Gi Earth), Fire translates directly to 정인 (Direct Resource). This means you've got a massive drive for learning, wisdom, and soaking up knowledge like a sponge. You're probably super thoughtful, value deep understanding, and crave stability and security. This energy can make you a total brainiac, always seeking to understand the 'why' behind everything. Just make sure you don't get stuck in analysis paralysis, 'cause all that thinking can sometimes lead to overthinking or being a bit too cautious."
  },
  "social_genes": {
    "gyeokguk": "정인격 (Direct Resource Structure)",
    "career_fit": "Your core social DNA is all about that 정인격 (Direct Resource Structure). This means you're naturally wired for roles that involve deep learning, research, teaching, or counseling. You thrive in environments where knowledge is power and stability is key. Think of it as having main character energy in any field that values intellect, certification, and a solid foundation of understanding. You're not just about surface-level stuff; you're here for the deep dives and the real wisdom."
  },
  "career_analysis": {
    "independence_index_type": "The True Predator (Independent + Strong Day Master)",
    "structural_core": "Based on your innate social DNA as a knowledge-seeker (정인) and your 'True Predator' work style, you are best suited for leading with deep expertise and a strong, independent drive, particularly in roles like an Independent Consultant, an EdTech Founder, or a Strategic Advisor.",
    "talent_aura": "Because your fiery energy, combined with leadership (장성살), precision (현침살), drive (겁살), and mobility (지살), creates a dynamic and impactful aura, you can also stand out in fields such as Digital Content Strategy, High-Tech Product Management, or Global Business Development.",
    "specific_recommendations": [
      "Independent Consultant",
      "EdTech Founder",
      "Strategic Advisor",
      "Digital Content Strategist",
      "High-Tech Product Manager",
      "Global Business Developer"
    ]
  },
  "romance_spouse": {
    "spouse_star_presence": "For you, a female 己 (Gi Earth) Day Master, your spouse star is Wood (官星). This star is chilling as a Hidden Stem (乙, 편관) within your Day Branch (未), your spouse palace. This means your future partner is definitely out there, but their presence might not be super obvious at first. Relationships for you tend to be a slow burn, maturing through shared experiences before that 'official' commitment vibe kicks in. It's less about instant fireworks and more about a deep, evolving connection.",
    "spouse_palace_dynamic": "Your spouse palace, the Day Branch (未), has some interesting dynamics. It's got a 'harm' (해) and 'wonjin' (원진) relationship with your Year Branch (子). This can sometimes mean subtle emotional distance or a feeling of being misunderstood in close relationships, possibly linked to early life experiences or family vibes. However, your Month Branch (巳) forms a partial seasonal harmony (방합) with your Day Branch (未), bringing some solid support and warmth to your relationship space from your social circle or family environment. So, while there might be some underlying emotional quirks, there's also a strong foundation of support.",
    "partner_vibe": "Your partner's vibe, based on the 乙 (편관) spouse star, is likely principled and growth-oriented (Wood energy). They tend to be intense, communicate directly, and have a sharp sensitivity. They might be someone with a strong sense of justice, a competitive spirit, or a natural leader who challenges you in a good way. They're not afraid to be real and push for progress, which can be super attractive.",
    "timing_logic": "Okay, let's talk timing! Your current Daewoon (age 26-36, 庚寅) is a major glow-up period for relationships. The 寅 (Wood) in this cycle is your spouse star, so expect significant connections to start popping up from 2022 onwards. You're currently 30 in 2026, so you're right in the thick of this relationship-activating energy. For the 'main character energy' commitment, like marriage, keep an eye on 2034 (age 38, 甲寅) and 2035 (age 39, 乙卯). These years are super potent because your spouse stars (甲 and 乙) show up in the Heavenly Stems, making those relationships public and official. So, meeting could be happening now, and commitment is looking strong in your late 30s."
  },
  "psychological_thirst": {
    "missing_element": "Wood (목) in basic count (but present as hidden stem)",
    "missing_ten_god": "식신 (Eating God), 정관 (Direct Officer)",
    "subconscious_drive": "You're missing 식신 (Eating God) and 정관 (Direct Officer) in your main chart, which can create some interesting subconscious drives. Without 식신, you might lowkey crave more spontaneous self-expression, a desire to nurture others more openly, or a tendency to be more practical than overtly optimistic. It's like you're always looking for ways to let loose and create. As for 정관, its absence might mean you have a subconscious drive for clear structure and boundaries, or a tendency to resist conventional authority unless it totally aligns with your internal principles. You're probably seeking internal order and a sense of purpose rather than just following external rules."
  },
  "core_trauma": {
    "clashes": "You've got a Heavenly Stem clash (천간충) between 丙 (정인) in your Year Stem and 壬 (정재) in your Hour Stem. This means there's a constant internal tug-of-war between your ideals/intellectual pursuits and practical wealth/results. It's like your brain is always debating whether to chase knowledge or the bag, which can be a real vibe killer sometimes. This might show up as challenges in balancing your personal values with financial realities.",
    "voids": "Your Year Branch (子) is in void (공망). This can make your early life, family roots, or broader social connections feel a bit detached or unstable. It's like you're meant to forge your own path, independent of traditional family expectations. This void also amplifies the 'harm' (해) and 'wonjin' (원진) relationships involving 子, making those emotional challenges in relationships feel even more elusive or harder to pin down.",
    "impact": "Beyond the clashes and voids, you also have a 'three punishments' (지세지형) and 'pa' (breakage) between your Month Branch (巳) and Hour Branch (申). This can manifest as internal conflicts, interpersonal friction, or things not going smoothly, especially in your career and personal projects. It's a reminder to practice self-discipline and be super mindful of your communication to avoid misunderstandings or power struggles. Plus, the 'harm' (해) and 'wonjin' (원진) between your Year Branch (子) and Day Branch (未) can lead to emotional distance or subtle resentments in close relationships, potentially stemming from your family background or early experiences. It's a lot, but it also means you're built for resilience."
  },
  "hidden_weapon": {
    "sinsal": "You're packing some serious hidden weapons! You've got 장성살 (leadership), 겁살 (strong drive), and 현침살 (precision), which together make you a powerful, precise, and driven leader. You can cut through complexity like a boss and lead with authority. 지살 (mobility) adds a global, adaptable edge, making you effective in diverse environments. But the real MVP is 태극귀인 (Taegeuk Gwiin), showing up in your Month, Day, and Hour Pillars. This is a major flex, meaning despite any challenges, you'll always find noble assistance and achieve significant success, especially as you mature. You've got that natural grace that attracts support and helps you overcome anything.",
    "guiin": "Your 태극귀인 (Taegeuk Gwiin) is a huge asset, indicating that you're destined for success, often with the help of influential people. It's like you have a built-in cheat code for getting support when you need it most. This means you're not just resilient; you're also blessed with a natural charm that draws in good vibes and helpful connections, ensuring you'll achieve great things, especially in the long run.",
    "application": "These energies mean you're not just smart; you're a strategic powerhouse. You can lead with precision, drive projects forward with unstoppable force, and adapt to any situation. Your ability to attract support (태극귀인) means you're never truly alone in your endeavors, making you a formidable force in any field you choose to dominate. Use your sharp intellect and leadership to inspire and innovate, knowing that the universe has your back."
  },
  "independence_index": {
    "singang_sinyak": "중화신강 (Balanced Strong)",
    "percentage": "55%",
    "life_strategy": "With a 'Balanced Strong' Day Master at 55%, you've got a super robust sense of self and serious willpower. You're not easily swayed by others and prefer to be the main character of your own story, calling the shots. You can handle pressure like a champ and bounce back from anything. This totally aligns with your 'True Predator' vibe in career, meaning you're naturally inclined to lead, innovate, and carve out your own path. Don't be afraid to trust your gut and take charge, because you're built for it."
  },
  "current_coordinate": {
    "current_daewoon": "庚寅 (Geng Yin) - Age 26-36",
    "key_year": "2026 (丙午)",
    "forecast": "You're currently riding the 庚寅 (Geng Yin) Daewoon (age 26-36), which is a whole vibe. The 庚 (Metal) brings strong self-expression and a desire to challenge the status quo, so you might be feeling extra creative and outspoken. The 寅 (Wood) is your spouse star and a super useful element, bringing both pressure and major opportunities for growth, leadership, and significant relationships. It's a period of intense personal development where you're facing responsibilities head-on and breaking free from limitations. The 'Death' (사) Twelve Star here means you're undergoing a profound transformation, shedding old skins to step into your true power. For 2026 (丙午), it's all about deep learning, introspection, and receiving guidance, possibly fueling your existing fiery intellect. This Daewoon is your time to assert your unique path, even if it comes with some internal struggles or external pressures."
  },
  "extra_notes": "Beyond the main points, your chart has some extra spicy details. Your Twelve Stars show a journey from 'Detachment' (절) in early life (연지) to 'Peak Power' (제왕) in your social sphere (월지), then 'Maturity' (관대) in your personal life (일지), and finally 'Charm' (목욕) in your later years (시지). This paints a picture of someone who starts by forging their own path, rises to power, takes on responsibility, and then enjoys a period of popularity and emotional richness. Your Yongshin (useful elements) are Wood, Water, and Metal, and your current Daewoon (庚寅) brings both Metal and Wood, indicating that despite the challenges, this period is actually super favorable for your growth and achievements. Plus, that strong 태극귀인 (Taegeuk Gwiin) is a constant reminder that you're blessed with support and will ultimately achieve great things, no cap."
}
2026-06-03 05:28:03.031 [info] [v0] Gemini: Unknown yongsin format, derived from element balance: Wood
2026-06-03 05:28:03.031 [info] [v0] Gemini: Final yongsinElement: Wood (balanced season: false)
2026-06-03 05:28:03.031 [info] [v0] Gemini: ===== STAGE 2: Final Facts Generation =====
2026-06-03 05:26:39.176 [info] [v0] Gemini: Fetching submission: 9e70ec5c-f574-436e-b586-cdb46b68d47d
2026-06-03 05:26:39.202 [info] [v0] Gemini: Submission fetched successfully
2026-06-03 05:26:39.202 [info] [v0] Gemini: Generating 9 facts for Yuri
2026-06-03 05:26:39.202 [info] [v0] Gemini: ===== COMPLETE CUSTOMER DATA FOR GEMINI 1.5 PRO =====
2026-06-03 05:26:39.203 [info] [v0] Gemini: {
  "name": "Yuri",
  "gender": "female",
  "birthDate": "1996-05-22",
  "birthCountry": "KR",
  "fourPillars": {
    "yearPillar": "丙子",
    "monthPillar": "癸巳",
    "dayPillar": "己未",
    "hourPillar": "壬申"
  },
  "dayMaster": "己",
  "dayMasterKorean": "기",
  "lifeStage": "정인격",
  "energyGrade": "중화신강",
  "energyRatio": 55,
  "elementCountBasic": {
    "금": 1,
    "목": 0,
    "수": 3,
    "토": 2,
    "화": 2
  },
  "elementCountWithHidden": {
    "금": 3,
    "목": 1,
    "수": 5,
    "토": 5,
    "화": 4
  },
  "elementScore": {
    "금": 20,
    "목": 0,
    "수": 30,
    "토": 30,
    "화": 40
  },
  "dominantElement": "fire",
  "tenGodsPresent": [
    "정인",
    "편재",
    "비견",
    "정재",
    "상관",
    "겁재",
    "편관",
    "편인"
  ],
  "tenGodsPresentWithCount": "정인 (2개), 편재 (2개), 일간 (1개), 비견 (1개), 정재 (1개), 상관 (1개)",
  "tenGodsMissing": [
    "식신",
    "정관"
  ],
  "tenGodsCounts": {
    "정인": 2,
    "편재": 2,
    "일간": 1,
    "비견": 1,
    "정재": 1,
    "상관": 1
  },
  "tenGodsByPosition": {
    "dayStem": "일간",
    "hourStem": "정재",
    "yearStem": "정인",
    "dayBranch": "비견",
    "monthStem": "편재",
    "hourBranch": "상관",
    "yearBranch": "편재",
    "monthBranch": "정인"
  },
  "twelveStars": [
    {
      "position": "연지",
      "star": "절",
      "branch": "자"
    },
    {
      "position": "월지",
      "star": "제왕",
      "branch": "사"
    },
    {
      "position": "일지",
      "star": "관대",
      "branch": "미"
    },
    {
      "position": "시지",
      "star": "목욕",
      "branch": "신"
    }
  ],
  "harmonies": {
    "cheongganHap": [],
    "jijiYughap": [
      "월지사+시지신→수(육합)"
    ],
    "jijiSamhap": [
      "시지신+연지자→수(반합)"
    ],
    "jijiBanghap": [
      "월지사+일지미→화(방합(부분))"
    ]
  },
  "clashes": {
    "cheongganChung": [
      "연간병↔시간임(천간충)"
    ],
    "jijiChung": []
  },
  "hyeong": [
    "지세지형(월지사+시지신)"
  ],
  "pa": [
    "월지사+시지신(파)"
  ],
  "hae": [
    "연지자+일지미(해)"
  ],
  "wonjin": [
    "연지자+일지미(원진)"
  ],
  "gilseong": {
    "cheonul": [
      "연주",
      "시주"
    ],
    "taegeuk": [
      "월주",
      "일주",
      "시주"
    ]
  },
  "gongmang": [
    "자",
    "축"
  ],
  "spirits": [
    "원진살",
    "장성살",
    "겁살",
    "지살",
    "천살",
    "현침살",
    "태극귀인"
  ],
  "sinsalDetails": [
    {
      "name": "장성살",
      "count": 1,
      "isStrong": false,
      "intensity": 1,
      "positions": [
        "연지"
      ],
      "percentage": 25,
      "usageGuide": "리더십과 권위를 발휘하며 높은 지위나 명예를 얻을 수 있는 기운이 있습니다",
      "totalPillars": 4
    },
    {
      "name": "지살",
      "count": 1,
      "isStrong": false,
      "intensity": 1,
      "positions": [
        "시지"
      ],
      "percentage": 25,
      "usageGuide": "외교적 능력과 현장 감각을 살려 현장직이나 대외 활동에서 빛을 발합니다",
      "totalPillars": 4
    },
    {
      "name": "겁살",
      "count": 1,
      "isStrong": true,
      "intensity": 1.5,
      "positions": [
        "월지"
      ],
      "percentage": 25,
      "usageGuide": "강한 추진력과 돌파력으로 경쟁적인 환경에서 두각을 나타낼 수 있습니다",
      "totalPillars": 4
    },
    {
      "name": "천살",
      "count": 1,
      "isStrong": true,
      "intensity": 1.5,
      "positions": [
        "일지"
      ],
      "percentage": 25,
      "usageGuide": "하늘의 시험처럼 예측 불가한 변화를 겪지만, 이를 통해 단련됩니다",
      "totalPillars": 4
    },
    {
      "name": "현침살",
      "count": 2,
      "isStrong": true,
      "intensity": 3,
      "positions": [
        "일지",
        "시지"
      ],
      "percentage": 50,
      "usageGuide": "섬세하고 예리한 기운으로 기술, 예술, 의료, 디자인 분야에서 뛰어난 재능을 발휘합니다",
      "totalPillars": 4
    },
    {
      "name": "태극귀인",
      "count": 3,
      "isStrong": false,
      "intensity": 3,
      "positions": [
        "월주",
        "일주",
        "시주"
      ],
      "percentage": 75,
      "usageGuide": "타고난 복과 품격이 있어 위기에서 귀인의 도움을 받고 대기만성형으로 성취합니다",
      "totalPillars": 4
    },
    {
      "name": "원진살",
      "count": 2,
      "isStrong": false,
      "intensity": 2,
      "positions": [
        "원진 관계"
      ],
      "percentage": 50,
      "totalPillars": 4
    }
  ],
  "sinsalSummary": "장성살: 1/4 (25%) [강도: 1] - 연지\n지살: 1/4 (25%) [강도: 1] - 시지\n겁살: 1/4 (25%) [강도: 1.5] ✅ - 월지\n천살: 1/4 (25%) [강도: 1.5] ✅ - 일지\n현침살: 2/4 (50%) [강도: 3] ✅ - 일지, 시지\n태극귀인: 3/4 (75%) [강도: 3] - 월주, 일주, 시주\n원진살: 2/4 (50%) [강도: 2] - 원진 관계",
  "sinsalCombinedGuide": "강한 추진력과 돌파력으로 경쟁적인 환경에서 두각을 나타낼 수 있습니다 또한, 하늘의 시험처럼 예측 불가한 변화를 겪지만, 이를 통해 단련됩니다 또한, 섬세하고 예리한 기운으로 기술, 예술, 의료, 디자인 분야에서 뛰어난 재능을 발휘합니다",
  "twelveSinsalByYearBranch": {
    "yearBranch": "子",
    "yearSinsal": "장성살",
    "monthSinsal": "겁살",
    "daySinsal": "천살",
    "hourSinsal": "지살",
    "description": "사회적 성공운 (연지 기준)"
  },
  "twelveSinsalByDayBranch": {
    "dayBranch": "未",
    "yearSinsal": "년살",
    "monthSinsal": "역마살",
    "daySinsal": "화개살",
    "hourSinsal": "겁살",
    "description": "개인적 성향운 (일지 기준)"
  },
  "yongsin": {
    "eokbu": "木(관성) > 水(재성) > 金(식상)",
    "johu": "계·병",
    "exists": true
  },
  "daewoon": [
    {
      "startAge": 6,
      "endAge": 16,
      "ganzi": "임진",
      "fullName": "壬辰",
      "tenGod": "정재",
      "twelveStar": "쇠",
      "element": "N/A"
    },
    {
      "startAge": 16,
      "endAge": 26,
      "ganzi": "신묘",
      "fullName": "辛卯",
      "tenGod": "식신",
      "twelveStar": "병",
      "element": "N/A"
    },
    {
      "startAge": 26,
      "endAge": 36,
      "ganzi": "경인",
      "fullName": "庚寅",
      "tenGod": "상관",
      "twelveStar": "사",
      "element": "N/A"
    },
    {
      "startAge": 36,
      "endAge": 46,
      "ganzi": "기축",
      "fullName": "己丑",
      "tenGod": "비견",
      "twelveStar": "묘",
      "element": "N/A"
    },
    {
      "startAge": 46,
      "endAge": 56,
      "ganzi": "무자",
      "fullName": "戊子",
      "tenGod": "겁재",
      "twelveStar": "절",
      "element": "N/A"
    },
    {
      "startAge": 56,
      "endAge": 66,
      "ganzi": "정해",
      "fullName": "丁亥",
      "tenGod": "편인",
      "twelveStar": "태",
      "element": "N/A"
    },
    {
      "startAge": 66,
      "endAge": 76,
      "ganzi": "병술",
      "fullName": "丙戌",
      "tenGod": "정인",
      "twelveStar": "양",
      "element": "N/A"
    },
    {
      "startAge": 76,
      "endAge": 86,
      "ganzi": "을유",
      "fullName": "乙酉",
      "tenGod": "편관",
      "twelveStar": "장생",
      "element": "N/A"
    }
  ],
  "yeonwoon": {
    "current2026": "丙午",
    "allYears": [
      {
        "year": 2026,
        "ganzi": "병오",
        "fullName": "丙午",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2027,
        "ganzi": "정미",
        "fullName": "丁未",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2028,
        "ganzi": "무신",
        "fullName": "戊申",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2029,
        "ganzi": "기유",
        "fullName": "己酉",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2030,
        "ganzi": "경술",
        "fullName": "庚戌",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2031,
        "ganzi": "신해",
        "fullName": "辛亥",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2032,
        "ganzi": "임자",
        "fullName": "壬子",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2033,
        "ganzi": "계축",
        "fullName": "癸丑",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2034,
        "ganzi": "갑인",
        "fullName": "甲寅",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      },
      {
        "year": 2035,
        "ganzi": "을묘",
        "fullName": "乙卯",
        "tenGod": "N/A",
        "twelveStar": "N/A"
      }
    ]
  },
  "hapChungSummary": "",
  "hapChungAdjustmentDetails": []
}
2026-06-03 05:26:39.203 [info] [v0] Gemini: ==================================================
2026-06-03 05:26:39.203 [info] [v0] Gemini: ===== STAGE 1: Deep Analysis =====
2026-06-03 05:26:39.203 [info] [v0] Gemini: allSajuData.gyeokguk = undefined
2026-06-03 05:26:39.203 [info] [v0] Gemini: allSajuData.strength_analysis = undefined
2026-06-03 05:26:39.203 [info] [v0] Gemini: allSajuData.ten_gods_summary = undefined
2026-06-03 05:26:39.203 [info] [v0] Gemini: stage1SystemPrompt length = 19870 chars
2026-06-03 05:26:39.204 [info] [v0] Gemini: stage1UserPrompt length = 10161 chars
2026-06-03 05:28:15.535 [info] [v0] Gemini: Stage 2 completed, generated 9 facts
2026-06-03 05:28:15.536 [info] [v0] Gemini: Using 9 facts (limited to 9)
2026-06-03 05:28:16.140 [error] [v0] Gemini: Error: TypeError: Cannot read properties of undefined (reading 'match')
    at T (.next/server/chunks/0kd0_next_dist_esm_build_templates_app-route_00t821g.js:596:1134)
    at async l (.next/server/chunks/0kd0_next_dist_esm_build_templates_app-route_00t821g.js:596:4962)
    at async s (.next/server/chunks/0kd0_next_dist_esm_build_templates_app-route_00t821g.js:596:6003)
    at async Module.D [as handler] (.next/server/chunks/0kd0_next_dist_esm_build_templates_app-route_00t821g.js:596:7110)
    at async handler (___next_launcher.cjs:216:7)
    at async Server.r (../../opt/rust/nodejs.js:2:15574)-lite',
    system: systemPrompt,
    prompt: userPrompt,
    temperature: options?.temperature ?? 0,
    maxTokens: options?.maxTokens ?? 3000
  })
  return result.text
}

// ================================================================
// Main route
// ================================================================
export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    if (!submissionId) return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Check payment is completed
    const { data: payment, error: paymentError } = await supabase
      .from('compatibility_payments')
      .select('status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 403 })
    }

    // 2. Check if report already exists
    const { data: existingReport } = await supabase
      .from('compatibility_reports')
      .select('id, facts')
      .eq('submission_id', submissionId)
      .single()

    if (existingReport?.facts) {
      return NextResponse.json({ success: true, reportId: existingReport.id })
    }

    // 3. Fetch submission data
    const { data: submission, error: subError } = await supabase
      .from('compatibility_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 4. Stage 1: Build context interpretation (~2500 chars)
    const allSajuData = buildAllSajuData(
      submission.person_a_name,
      submission.person_b_name,
      submission.person_a_saju_data || {},
      submission.person_b_saju_data || {}
    )

    console.log('[v0] Compatibility: ===== COMPLETE SAJU DATA FOR STAGE 1 & 2 =====')
    console.log('[v0] Compatibility:', JSON.stringify(allSajuData, null, 2))
    console.log('[v0] Compatibility: ====================================================')

    const stage1SystemPrompt = `👑 [최종 Prompt Instruction: 궁합 실전 해석 - 심화 업데이트본]
1. 데이터 전처리 (오행 궁합 및 십성 치환)
오행 구족 확인: Person A와 B의 elementBalanceWithHiddenStems를 합산하여 5가지 오행(목, 화, 토, 금, 수)이 모두 갖춰지는지(최소 4개 이상) 확인한다.

시너지 궁합 (결핍 보완): A에게 부족한 오행(10점 미만 또는 0점)을 B가 풍부하게 가지고 있다면, 이를 '운의 균형이 맞춰지는 시너지 궁합'으로 정의한다.

보완 오행의 십성 해석: B가 채워주는 오행이 A의 tenGods(십성) 중 무엇에 해당하는지 도출하여 관계의 성격을 규명한다. (비겁: 주체성, 식상: 표현력, 재성: 경제관념, 관성: 안정감, 인성: 심리적 수용)

2. 구조적 매칭 (겉궁합 및 속궁합 정밀 검출)
겉궁합 (일간 천간합 및 배합 분석): A와 B의 일간(Day Master) 조합을 표의 기준에 따라 분석한다.

대길(大吉) - 정배합(정) & 편배합(편): 천간합이 성립하는 최고의 조합이다.

정배합(음양의 조화): 남갑+여기, 남병+여신, 남무+�����, 남경+여을, 남임+여정. (안정적이고 이상적인 결합)

편배합(강한 인력): 남을+여경, 남정+여임, 남기+여갑, 남신+여병, 남계+여무. (다이나믹하고 강렬한 끌림)

대흉(大凶) - 상극(극) 조합: 서로의 에너지를 심하게 억눌러 갈등이 깊은 조합이다.

조합: 남을+여신, 남병+여임, 남정+여계, 남무+여갑, 남기+여을, 남경+여병, 남신+여정, 남임+여무, 남계+여기.

해석: "성격 차이가 극명하며 서로에게 상처를 주기 쉬운 조합"으로 분류하고 주의를 당부한다.

해석 가이드: "대길 조합은 첫눈에 반하거나 대화가 막힘없이 통하는 사이"이나, 운이 나쁠 때는 소유욕과 집착으로 변할 수 있음을 경고한다.

속궁합 (일지 육합 및 삼합): 일지는 '배우자궁'을 의미하며, 육합(자축, 인해 등)과 삼합(인오술 등)을 통해 정서적 깊이와 에너지의 시너지를 확인한다.

3. 힐러 로직 (상호 구원 및 충돌 방어 체계)
상호 보완성 점수: B의 dominantElement(월지 중심)가 A의 취약 오행을 보완하면서 동시에 A의 yongsin(용신)인지 확인하여 점수화한다.

띠 궁합 (지지 충): 띠끼리 충(자오충, 묘유충 등)이 발생할 경우, "강렬한 스파크는 있으나 현실적인 부딪힘이 잦을 수 있음"을 경고한다.

복제 인간 리스크: 동일한 일주(예: 둘 다 庚申)일 경우, 운의 흐름이 같아 동반 하락할 위험을 고지하고 '다름의 미학'을 강조한다.

4. 성격 동기화 (가치관 및 일상 실전 팁)
도화로운 육합 실전 가이드:

자축/오미: 비슷함에 끌림. 천천히 스며들 것.

인해: 금사빠 조합. 기브앤테이크 필수.

묘술: 다름에 끌림. 상호 영역 존중 필수.

진유: 일상 침범 주의. 전략적 거리두기 권장.

사신: 능력에 매료됨. 공동의 목표 설정 필수.

가치관 분석: 월지(사회적 면모)와 일지(개인적 면모) 간의 형/충/파/해를 통해 가치관 일치도를 판별한다.

5. 운명의 파동 (대운 동기화)
운의 동기화율: 향후 30년 대운을 비교하여 한 명의 하락기를 다른 한 명이 보완할 수 있는지 퍼센트(%)로 제시한다.

6. 종합 결론 및 현실 개운법
궁합 정의: [소울메이트형 / 상호보완형 / 노력필요형 / 카르마형] 중 하나로 정의한다.

현실 점검: "사주 궁합이 대길(大吉)이어도 배려가 없으면 무용지물이며, 대흉(大凶)이어도 서로의 다름을 인정하면 극복 가능하다"는 도화로운식 현실 조언을 덧붙인다.

맞춤 개운 솔루션: 상대의 풍부한 오행을 활용해 내 삶의 어떤 영역(공부/재물/정서 등)을 확장할 수 있는지 구체적인 액션 플랜을 제시한다.

7. 필수 : 이 둘의 관계가 이 4가지 중 어떤 유형인지 [소울메이트형 / 상호보완형 / 노력필요형 / 카르마형] 중 최종 타입을 확정하고 명확하게 작성합니다.
`

    const stage1UserPrompt = `두 사람의 사주 데이터를 확인한 후 아래 4000 글자의 해설지를 작성하라. 3번부터는 [최종 Prompt Instruction: 궁합 실전 해석 - 심화 업데이트본] 을 참고해서 작성하라. 

    1. 두 사람의 사주 데이터를 보며 기본적인 사주의 특징과 성향 이해
    2. 두 사람의 구체적인 사주 분석 (사주팔자, 일간, 월지, 격국, 오행, 십신, 신살, 신강/신약 등 종체적인 두 사람의 개개인 사주 해석, 그리고 기관이나 직장에서 일하는 직장인 타입인지, 전문가 혹은 사업가 타입인지, 프리랜서인지도 어느정도 파악하고 있어야 함.)
    3. 데이터 전처리 (오행 궁합 및 십성 치환)
    4. 구조적 매칭 (겉궁합 및 속궁합 정밀 검출)
    5. 힐러 로직 (상호 구원 및 충돌 방어 체계)
    6. 성격 동기화 (가치관 및 일상 실전 팁)
    7. 운명의 파동 (대운 동기화) 참고; 1990-2030 Ganji: 庚午,辛未,壬申,癸酉,甲戌,乙亥,丙子,丁丑,戊寅,己卯,庚辰,辛巳,壬午,癸未,甲申,乙酉,丙戌,丁亥,戊子,己丑,庚寅,辛卯,壬辰,癸巳,甲午,乙未,丙申,丁酉,戊戌,己亥,庚子,辛丑,壬寅,癸卯,甲辰,乙巳,丙午,丁未,戊申,己酉,庚戌
    8. 종합 결론 및 현실 개운법

Compatibility Chart Data (Complete Saju Information):
${JSON.stringify(allSajuData, null, 2)}`

    const contextInterpretation = await callGemini(stage1SystemPrompt, stage1UserPrompt, {
      temperature: 0,
      maxTokens: 4000
    })

    // Save stage 1 result
    const { data: reportRow, error: insertError } = await supabase
      .from('compatibility_reports')
      .insert({
        submission_id: submissionId,
        section_key: 'compatibility_full',
        context_interpretation: contextInterpretation,
        is_paid: true,
      })
      .select('id')
      .single()

    if (insertError || !reportRow) {
      console.error('[v0] Compatibility report insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save report context' }, { status: 500 })
    }

    // 5. Stage 2: Generate structured report sections from Stage 1 context
    const stage2SystemPrompt = `2명의 고객 사주 데이터를 각각 확인하고, 1단계에서 작성한 4000자 해설지를 확인하라. 너는 최고의 현대 사주 명리학 전문 사주 해설가이다. 문장을 쓸 때, 늘 임팩트있고 구체적으로 지침하려 하며, 두루뭉실보다는 눈에 보이는 현상, 들리는 말의 현상 등, 고객들이 직접 일상생활에서 마주하는 일들을 기반으로 해설을 하는 경향이 있다. 20-30대 젊은 고객들이 이해할 수 있도록 따끔하고 정확하고 친절하면서도, 읽는 사람이 너무 무섭거나 부정적으로 생각하지 않도록 긍정적인 방향의 개운법이나 더 나아질 수 있또록 위안과 위로 감동을 주는 것을 목표로 한다. `

    // Calculate compatibility score and relationship type (data-based, consistent)
    const compatibilityResult = calculateCompatibilityScore(
      submission.person_a_saju_data || {},
      submission.person_b_saju_data || {}
    )
    
    console.log('[v0] Compatibility: Calculated score:', compatibilityResult.score, 'Type:', compatibilityResult.relationshipType)

    const stage2UserPrompt = `두 사람을 위한 사주 궁합 레포트를 만들어라. 각각 7개의 섹션으로 이루어진 주제에 따라 문장들을 작성해라. 미국인 Gen-z 해설가가 말하는 것 처럼, 너무 가볍지 않은 선에서 gen-z 용어도 가끔 섞어서 넣어준다. (no cap, vibe, aura, for real 등). 참고로 현대에선 동성애자 커플도 종종 있으니, 같은 성별의 사주 궁합 요청이 들어와도 놀라지 말고 침착하고 친절하게 이성커플과 같은 대우로 풀이를 작성하라.

=== CRITICAL LENGTH REQUIREMENT ===
EACH SECTION MUST BE AT LEAST 1,500-2,000 CHARACTERS (approximately 300-400 words).
DO NOT write short paragraphs. Each section should have 4-6 substantial paragraphs with detailed analysis.
If your content is shorter than 1,500 characters per section, you MUST expand it with more details, examples, and insights.

=== CRITICAL RULES (MUST FOLLOW) ===
1. ABSOLUTELY NO Chinese characters (한자) allowed. Never write 甲, 乙, 丙, 丁, 戊, 己, 庚, 辛, 壬, 癸, etc.
2. ABSOLUTELY NO Korean text allowed. Never write 갑, 을, 병, 정, 무, 기, 경, 신, 임, 계, etc.
3. ABSOLUTELY NO markdown formatting. Never use * or **, ##, *, or any markdown symbols.
4. ALL text must be in plain English only.
5. When referencing elements, use English: Wood, Fire, Earth, Metal, Water (NOT 목화토금수).
6. When referencing stems, translate to English descriptions (e.g., "Yang Wood energy" instead of "甲목").
7. EACH SECTION MUST BE LONG AND DETAILED (minimum 1,500 characters).

IMPORTANT - Title format rules:
- Section 1-6 titles MUST be poetic English phrases WITHOUT any brackets or tags. Example: "Spring Rain Nurturing Parched Earth" NOT "[Birth of Landscape] Spring Rain..."
- Section 7 title MUST be EXACTLY: "${compatibilityResult.relationshipType}" (This is pre-calculated based on chart analysis)
- ALL content must be in English.
    
섹션 1: 두 사람이 그리는 한 폭의 수묵화
제목 예시 (영어로): "Spring Rain Nurturing Parched Earth", or "A Majestic Pine Standing on Fertile Ground" or "Where the moist earth embraces the forest's song." (예시입니다)

내용 지침:
형상화: 두 사람의 dayMaster(일간)를 자연물에 비유하여 만남의 첫인상을 시각적으로 묘사합니다.
만남의 의미: Person A의 부족한 기운을 B가 어떻게 채워주는지, 혹은 비슷한 기운이 만나 어떤 폭발력을 내는지 서술합니다.
내면의 욕구: tenGodsCounts와 energyGrade를 분석하여 두 사람이 인생에서 공통적으로 지향하는 가치나 개인적인 삶의 욕구를 비교합니다.
하모니 시뮬레이션: 두 사람이 만났을 때 흐르는 특유의 분위기를 실제 자주 할만한 대화, 들을 만한 말로 상상해서 표현합니다. 랜덤 예시: "A님은 주로 '너 덕분에 진짜 심리적으로 든든해'라고 말하고, B님은 '내가 더 실용적으로 먼저 잘 챙겨줄게'라는 말을 자주 주고받을 흐름이네요."

섹션 2: 겉과 속, 우리가 연결되는 방식
제목 예시 (영어로): "Love at First Sight and Deepening Connection Over Time"

내용 지침:
겉궁합 (정신적 안정): 일간합(갑기, 을경 등) 여부를 분석하여 첫인상과 심리적 편안함을 리딩합니다.
주의사항 고지: 일간합이 있을 경우, 운이 나쁠 때 발생할 수 있는 '집착' 리스크를 부드럽게 경고합니다.
속궁합 (현실적 밀도): 일지 육합/삼합을 통해 정서적 깊이를 분석합니다.

섹션 3: 누가 누구를 더 필요로 하는가
제목 (영어로): "The Energy Flow in This Relationship: Who's Steering?"

내용 지침:
에너지 분석: energyGrade와 tenGods를 분석하여 두 사람 사이의 갑을 관계(혹은 동등함) 분석합니다.

섹션 4: 우리가 반복해서 부딪히는 진짜 이유
제목 (영어로): "Warning: Where Your Dissonance Begins"

내용 지침:
현실적 시나리오: clashes(충), wonjin(원진), hyeong(형) 데이터를 기반으로 두 사람이 실제로 싸우게 될 상황을 예시합니다.
포인트: 구체적인 화법 가이드와 함께 둘이 같이 하면 좋을 활동이나 데이트를 추천합니다. 너무 뻔한 소리나 두루뭉실한 소리 금지!

섹션 5: 밤의 하모니와 현실적인 경제 공동체
제목 (영어로): "Your Secret Chemistry and Financial Synergy"

내용 지침:
밤의 하모니: jijiYughap(속궁합)을 활용한 잠자리 성향을 언급합니다. 무례하지 않게 적당한 수위로 근거있게 이야기합니다.
재물운 시너지: tenGodsCounts를 결합하여 두 사람의 재물운을 분석합니다.실제로 구체적으로 두 사람의 돈을 모으는 방식이나 일하는 커리어 방식을 해설지에서 참고해서, 함께 재물을 관리하고 늘려나가는 아주 현대적이고 구체적인 방법을 제시합니다.

섹션 6: 이 관계의 정점과 결혼의 문턱
제목 (영어로): "Your Timeline Together and Marriage Opportunities"

내용 지침:
시기 지정: daewoon과 yeonwoon을 매칭하여 결혼운이 들어오는 시기를 연도로 명확히 집어줍니다. 최근 과거의 10년부터 앞으로의 10년 중 가장 유력한 연도들을 몇개 뽑아 정확하게 근거와 함께 짚어냅니다. 이별수가 있다면, '이별수가 있다' 라고 단정지어 이야기 하기 보다는, 특정 연도에 거리감이 생기거나 갈등이 일어날 수 있으니 지혜롭게 해결하는 방법에 대해서 이야기를 초점 맞추어 서술합니다. 이 분들이 만약 결혼하게 된다면 서로에게 어떤 부부가 될지 귀엽게 상상해봅니다. 출산으로 아이가 들어오는 운이 보인다면, 출산 연도를 암시해도 좋겠습니다. 출산이 꼭 아이가 아니더라도, 건물이나 업에서의 좋은 결과물이 될 수도 있겠지만요.

섹션 7: 최종 관계 타입
CRITICAL: 제목은 반드시 다음 4개 중 하나만 정확히 작성: "Soulmate Type" / "Complementary Type" / "Effort-Required Type" / "Karmic Type"

내����� 지���:
운명의 파동: 향후 30년의 daewoon 흐름을 분석하여 두 사람의 에너지의 상승장과 하락장이 어떻게 교차하는지 보여줍니다. 사주 궁합보다 중요한 것은 배려"임을 강조하는 따뜻한 조언과 함께, 상대의 에너지를 통해 고객과 상대 파트너 각각의 삶에서 어떤 영역(재물, 명예, 공부 등)이 확장되는지 구체적인 개운 액션 플랜을 제시하며 마무리합니다.
관계 정의: 위 4가지 타입 중 최종 타입을 본문에서도 명확히 설명합니다.
현실 점검 및 처방: 구체적인 개운 액션 플랜을 제시하며 감동적으로 이 관계에 대해서 서술하며 마무리합니다. 누구에게나 들어맞을 절대 뻔한 소리나 두루뭉실한 소리는 금지!

Names: ${submission.person_a_name} & ${submission.person_b_name}

Stage 1 Context:
${contextInterpretation}

Return a JSON array of 7 sections with this structure:
[
  {
    "title": "Section Title in English",
    "content": "Section content here..."
  }
]`

    const stage2Raw = await callGemini(stage2SystemPrompt, stage2UserPrompt, {
      temperature: 0,
      maxTokens: 8000
    })

    console.log('[v0] Compatibility: Stage 2 raw response length:', stage2Raw.length)

    // === JSON 파싱 (generate-gemini의 정확한 로직 동일 적용) ===
    let stage2JsonMatch = stage2Raw.match(/```json\n([\s\S]*?)\n```/)
    
    if (!stage2JsonMatch) {
      stage2JsonMatch = stage2Raw.match(/```json([\s\S]*?)```/)
    }
    
    if (!stage2JsonMatch) {
      const directJsonMatch = stage2Raw.match(/(\[[\s\S]*\])/)
      if (directJsonMatch) {
        stage2JsonMatch = [null, directJsonMatch[1]]
      }
    }
    
    if (!stage2JsonMatch) {
      console.error('[v0] Compatibility: Stage 2 raw response:', stage2Raw)
      return NextResponse.json({ error: 'Failed to parse Stage 2 response' }, { status: 500 })
    }

    let facts: unknown[] = []
    try {
      facts = JSON.parse(stage2JsonMatch[1])
      if (!Array.isArray(facts)) {
        facts = [facts] // 단일 객체면 배열로 감싸기
      }
    } catch (parseErr) {
      console.error('[v0] Compatibility: JSON parse error:', parseErr, 'Raw:', stage2JsonMatch[1])
      facts = [{ title: 'Compatibility Report', content: stage2Raw, score: null }]
    }

    console.log(`[v0] Compatibility: Generated ${facts.length} facts from Stage 2`)

    // Save stage 2 result
    await supabase
      .from('compatibility_reports')
      .update({ facts })
      .eq('id', reportRow.id)

    return NextResponse.json({ 
      success: true, 
      reportId: reportRow.id
    })
  } catch (error) {
    console.error('[v0] Generate compatibility error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
