import { NextResponse } from 'next/server'
import { generateText, generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { buildSkeleton } from '@/lib/saju/skeleton'

// SAJU_MASTERPIECE_GUIDE 연결 해제됨 - 필요시 다시 import 가능
// import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

/**
 * Gemini 3 Flash 사주 분석 API
 * 모든 프롬프트를 한 번에 발사
 * System: 마스터피스 가이드 + 역할 정의 (고정)
 * User: 고객 사주 데이터 + 최종 요청 (변수)
 * 
 * Model: google/gemini-3-flash (Gemini 3 Flash - 최신, 가장 빠르고 저렴)
 */

// Vercel 함수 최대 실행 시간 (AI 응답이 느릴 때 타임아웃 500 에러 방지)
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const body = await request.json()

    let name: string
    let gender: string
    let birth_country: string
    let birth_date: string
    let saju_data: SajuData

    // submissionId로 받으면 Supabase에서 조회
    if (body.submissionId) {
      console.log('[v0] Gemini: Fetching submission:', body.submissionId)
      const supabase = await createClient()
      const { data: submission, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', body.submissionId)
        .single()

      if (error || !submission) {
        console.error('[v0] Gemini: Submission not found:', error)
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }

      console.log('[v0] Gemini: Submission fetched successfully')
      name = submission.name
      gender = submission.gender
      birth_country = submission.birth_country
      birth_date = submission.birth_date
      saju_data = submission.saju_data
    } else {
      // 직접 데이터 전달
      name = body.name
      gender = body.gender
      birth_country = body.birth_country
      birth_date = body.birth_date
      saju_data = body.saju_data
    }

    if (!saju_data) {
      return NextResponse.json({ error: 'Missing saju_data' }, { status: 400 })
    }

    console.log(`[v0] Gemini: Generating 9 facts for ${name}`)

    // ===== 십신 포맷팅: "비견 (3개), 식신 (2개)" 형식 =====
    // 십신별 개수 계산 (byPosition 기준 - 8개 위치에서 실제 개수 세기)
    const tenGodsCounts: Record<string, number> = {}
    const bp = saju_data.tenGods?.byPosition
    if (bp) {
      const allPositions = [
        bp.yearStem, bp.yearBranch,
        bp.monthStem, bp.monthBranch,
        bp.dayStem, bp.dayBranch,
        bp.hourStem, bp.hourBranch
      ].filter(Boolean)
      allPositions.forEach(tenGod => {
        tenGodsCounts[tenGod] = (tenGodsCounts[tenGod] || 0) + 1
      })
    }

    // 십신 포맷팅: "비견 (3개), 식신 (2개)" 형식
    const tenGodsFormatted = Object.entries(tenGodsCounts)
      .map(([name, count]) => name + " (" + count + "개)")
      .join(', ')

    // ===== 전문가 기준 확정값 (lib/saju/expert-core.ts · expert-sinsal.ts · skeleton.ts) =====
    // 새로 계산된 submission 에만 있음. 옛 저장본은 expert 가 없어서 null 로 두고 기존 방식 유지.
    const KO2EN: Record<string, string> = { 목: 'Wood', 화: 'Fire', 토: 'Earth', 금: 'Metal', 수: 'Water' }
    let expertFacts: any = null
    try {
      const expert = (saju_data as any).expert
      if (expert) {
        const headlineEn: string[] = (expert.headline?.elements ?? []).map((k: string) => KO2EN[k]).filter(Boolean)
        expertFacts = {
          note: 'Pre-calculated FINAL facts. Do not recompute strength, yongsin, gyeokguk, shinsal or relations.',
          skeleton: buildSkeleton(saju_data, gender === 'female' ? 'female' : 'male'),
          shinsalByPillar: (saju_data as any).expertSinsal || {},
          ...(headlineEn.length
            ? {
                yongsinHeadline: {
                  elements: headlineEn,
                  source: expert.headline.source === '조후' ? 'Johu-first (seasonal climate balance takes priority)' : 'Eokbu (strength balance)'
                }
              }
            : {})
        }
      }
    } catch (e) {
      console.error('[v0] Gemini: expertFacts build failed (continuing without):', e)
    }

    // 옛 spirits 에는 백호살·천덕귀인 오탐이 있어, 전문가 기준 신살(슬롯별 합집합) + 12신살로 대체. 옛 저장본은 기존 spirits 사용.
    const expertSinsalMap = (saju_data as any).expertSinsal as Record<string, string[]> | undefined
    const spiritsForLLM: string[] = expertSinsalMap
      ? Array.from(
          new Set([
            ...Object.values(expertSinsalMap).flat(),
            ...(Object.values(saju_data.hybridTwelveSinsal?.byDayBranch ?? {}) as string[]),
            ...(Object.values(saju_data.hybridTwelveSinsal?.byYearBranch ?? {}) as string[])
          ].filter(Boolean))
        )
      : (saju_data.spirits || []).filter((s: string) => s !== '천덕귀인' && s !== '월덕귀인')

    const allSajuData = {
      // 기본 정보
      name,
      gender,
      birthDate: birth_date,
      birthCountry: birth_country,

      // 4주 (천간/지지)
      fourPillars: {
        yearPillar: `${saju_data.yearPillar?.stem || ''}${saju_data.yearPillar?.branch || ''}`,
        monthPillar: `${saju_data.monthPillar?.stem || ''}${saju_data.monthPillar?.branch || ''}`,
        dayPillar: `${saju_data.dayPillar?.stem || ''}${saju_data.dayPillar?.branch || ''}`,
        hourPillar: saju_data.hourPillar ? `${saju_data.hourPillar.stem}${saju_data.hourPillar.branch}` : 'N/A'
      },

      // 일간 (중요)
      dayMaster: saju_data.dayPillar?.stem || '',
      dayMasterKorean: saju_data.dayMasterKorean || '',

      // 격국
      lifeStage: saju_data.gyeokguk || '',

      // 신강/신약
      energyGrade: saju_data.sinGangSinYak?.grade || '',
      energyRatio: saju_data.sinGangSinYak?.ratio || 0,

      // 오행 "존재감" (지장간 미포함 - 단순 개수) - 보조 근거
      elementCountBasic: saju_data.elementCountBasicKorean || {},

      // 오행 "영향력" (지장간 포함 - 가중 점수) - 해석의 메인 근거
      elementBalanceWithHiddenStems: saju_data.elementBalanceWithHiddenStemsKorean || {},
      dominantElement: saju_data.dominantElement || '',

      // 십신 (개수 포함 + 위치별)
      tenGodsPresent: saju_data.tenGods?.present || [],
      tenGodsPresentWithCount: tenGodsFormatted,
      tenGodsMissing: saju_data.tenGods?.missing || [],
      tenGodsCounts: tenGodsCounts, // 원본 객체도 포함
      tenGodsByPosition: saju_data.tenGods?.byPosition || {}, // 각 위치별 십신 (연간, 연지, 월���, 월지, ��간, 일지, 시간, 시지)

      // 12운성 (상세)
      twelveStars: saju_data.twelveStars?.map(s => ({
        position: s.position,
        star: s.star,
        branch: s.branch
      })) || [],

      // 관계식 (모두 포함)
      harmonies: {
        cheongganHap: saju_data.cheongganHap || [],
        jijiYughap: saju_data.jijiYughap || [],
        jijiSamhap: saju_data.jijiSamhap || [],
        jijiBanghap: saju_data.jijiBanghap || []
      },

      clashes: {
        cheongganChung: saju_data.cheongganChung || [],
        jijiChung: saju_data.jijiChung || []
      },

      hyeong: saju_data.hyeong || [],
      pa: saju_data.pa || [],
      hae: saju_data.hae || [],
      wonjin: saju_data.wonjin || [],

      // 길성 (천을귀인, 태극귀인 등)
      gilseong: saju_data.gilseong || {},

      // 공망
      gongmang: saju_data.gongmang || [],

      // 신살 (모두 포함 - 상세)
      spirits: spiritsForLLM,
      expertFacts: expertFacts,
      sinsalDetails: saju_data.sinsalDetails || [],
      sinsalSummary: saju_data.sinsalSummary || '',
      sinsalCombinedGuide: saju_data.sinsalCombinedGuide || '',

      // 하이브리드 12신살 (연지 + 일지 기준 - 100만명 일관성 보장)
      twelveSinsalByYearBranch: {  // 사회적 성공운
        yearBranch: saju_data.yearPillar?.branch || '',
        yearSinsal: saju_data.hybridTwelveSinsal?.byYearBranch?.year || '',
        monthSinsal: saju_data.hybridTwelveSinsal?.byYearBranch?.month || '',
        daySinsal: saju_data.hybridTwelveSinsal?.byYearBranch?.day || '',
        hourSinsal: saju_data.hybridTwelveSinsal?.byYearBranch?.hour || '',
        description: '사회적 성공운 (연지 기준)'
      },
      twelveSinsalByDayBranch: {  // 개인적 성향운
        dayBranch: saju_data.dayPillar?.branch || '',
        yearSinsal: saju_data.hybridTwelveSinsal?.byDayBranch?.year || '',
        monthSinsal: saju_data.hybridTwelveSinsal?.byDayBranch?.month || '',
        daySinsal: saju_data.hybridTwelveSinsal?.byDayBranch?.day || '',
        hourSinsal: saju_data.hybridTwelveSinsal?.byDayBranch?.hour || '',
        description: '개인적 성향운 (일지 기준)'
      },

      // 용신 (상세)
      yongsin: {
        eokbu: saju_data.eokbuYongsin || 'None',
        johu: saju_data.johuYongsin || 'None',
        exists: !!saju_data.eokbuYongsin || !!saju_data.johuYongsin
      },

      // 대운 (10개 전부 + 십신 + 12운성)
      daewoon: saju_data.daewoon?.slice(0, 10).map(d => ({
        startAge: d.startAge,
        endAge: d.endAge,
        ganzi: `${d.stem}${d.branch}`,
        fullName: d.fullName,
        tenGod: d.tenGod || 'N/A',
        twelveStar: d.twelveStar || 'N/A',
        element: d.element || 'N/A'
      })) || [],

      // 연운 (2026년 전후 10년)
      yeonwoon: {
        current2026: saju_data.yeonwoon?.find(y => y.year === 2026)?.fullName || 'N/A',
        allYears: saju_data.yeonwoon?.slice(0, 10).map(y => ({
          year: y.year,
          ganzi: `${y.stem}${y.branch}`,
          fullName: y.fullName,
          tenGod: y.tenGod || 'N/A',
          twelveStar: y.twelveStar || 'N/A'
        })) || []
      },

      // 합충 요약 (텍스트)
      hapChungSummary: saju_data.hapChungSummary || '',

      // 합충 조정 상세 내역 (오행 점��� 변화)
      hapChungAdjustmentDetails: saju_data.hapChungAdjustmentDetails || saju_data.elementAdjustmentHistory || [],

      // 결혼/연애 타이밍 (이미 코드로 확정 계산된 결과 - 재계산 금지, 그대로 인용만 할 것)
      marriageTiming: saju_data.marriageTiming || null
    }

    console.log('[v0] Gemini: ===== COMPLETE CUSTOMER DATA FOR GEMINI 1.5 PRO =====')
    console.log('[v0] Gemini:', JSON.stringify(allSajuData, null, 2))
    console.log('[v0] Gemini: ==================================================')

    const userPrompt = `Now, generate a total of 9 chillingly insightful sentences for him or her — the kind of sentences someone would want to share with a friend because they're just that on point. Sentences that make them truly feel like, 'Wow, this is tailored to my personal Saju chart, rather than being a generic one for everyone. This captures every detail of my Saju all at once.'





OUTPUT FORMAT(ONLY JSON):
\`\`\`json
{
"internal_analysis_scratchpad": {
    "core_energy": "일간 OOO와 월지 OOO의 관계 분석",
    "dominant_element_effect": "가장 강한 오행(XX)이 직업/성격에 미치는 팩트",
    "missing_element_effect": "없는 오행(XX)이 유발하는 내면의 결핍/갈등",
    "career_logic": "STEP 1~8 규칙에 따른 정확한 직업군 도출 (예: 금/관성 과다 -> 경찰, 군인, 감사관)"
  },
  "facts": [
    {"id": 1, "title": "[Title 1]", "content": "[2-3 sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 2, "title": "[Title 2]", "content": "[2-3 sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 3, "title": "[Title 3]", "content": "[2-3 sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 4, "title": "[Career/Social]", "content": "[2-3 sentences: industry+role] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 5, "title": "[Title 5]", "content": "[2-3 sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 6, "title": "[Title 6]", "content": "[2-3 sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 7, "title": "[Title 7]", "content": "[2-3 sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 8, "title": "[Title 8]", "content": "[2-3 sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 9, "title": "[Title 9]", "content": "[2-3 sentences: hero's journey] ⟦pointer1⟧ ⟦pointer2⟧"}
  ]
}
\`\`\`

ADVANCED CUSTOMER SAJU DATA:
${JSON.stringify(allSajuData, null, 2)}
`

    // =========================================
    // LEGACY PROMPT BACKUP (참고용 - 삭제하지 마세요)
    // 기존 단일 호출 방식의 systemPrompt, userPrompt가 위에 있습니다.
    // 2-Stage 파이프라인으로 전환 후에도 참고할 수 있도록 보존합니다.
    // =========================================
    // 기존 systemPrompt: 1~1700줄 (SAJU_MASTERPIECE_GUIDE 포함)
    // 기존 userPrompt: 1701~1802줄 (9 facts 생성 요청)
    // =========================================

    // =========================================
    // 2-STAGE PIPELINE: 심화 분석 → 9문장 생성
    // Stage 1: 8가지 체크포인트 심화 분석 (Deep Analysis)
    // Stage 2: 분석 결과 기반 9문장 생성 (Final Facts)
    // =========================================

    // ===== STAGE 1: 심화 분석 (Deep Analysis) =====
    // 사용자가 이 프롬프트를 직접 수정할 수 있습니다
    const stage1SystemPrompt = `You will make a report with this 'pre-calculated Saju', DO NOT Calculate again.
Just use these to make a interpretion for the 9 facts report. 
If "expertFacts" is present in the data, treat its values (day master strength grade, yongsin, gyeokguk, shinsal, skeleton) as FINAL pre-calculated facts and never override them with your own judgement.
This year is 2026 (Just in case).

[Primary Reference Saju Interpretion logic]

Tone and Style Rules (mandatory!!)
- Write in natural, modern English like a Tone: Gen-Z (ex. iving, lowkey, main character energy, no cap)
- Warm, grounded, and emotionally intelligent (like a wise friend, not a judge).
- Avoid heavy jargon. If a technical term is necessary, explain it immediately in plain English.
- Use "may," "tends to," "can," "often," "in many cases." Avoid absolute statements.
- Do not claim medical, legal, or guaranteed predictive outcomes.
- Do not diagnose health conditions.
- Do not use fear-based language.

Important Cautions for Make.com System Prompt Use

1. Hanja warning
If you include Chinese characters (Hanja) like 天干, 地支, 五行 in the system prompt, the model may output Hanja in customer reports too. If your brand wants a clean English-only feel, limit Hanja to internal logic only, or instruct "do not output Hanja in the customer-facing report."

2. Too much jargon risk
Overloading the system prompt with advanced terms (격국, 억부용신법, 형충합해, 삼형살, 원진살, etc.) can push the report to sound like a textbook. If you want higher conversion and better customer satisfaction, force the report to translate these concepts into everyday language.

3. Determinism risk
If the system prompt uses strong claims like "this means divorce" or "this guarantees wealth," the model may mirror that tone. Keep everything probabilistic and scenario-based. This reduces complaints and refund risk.

4. Cultural sensitivity risk
Traditional gender rules (male = wealth star, female = power star) can feel outdated for Western customers. Keep it as "traditional symbolism" and present it softly, without rigid conclusions.

5. Safety and policy alignment
Avoid medical claims, mental health diagnosis, or legal/financial certainty. Even for "health balance," keep it lifestyle-level (sleep, stress, routine, energy management). Use disclaimers like "not medical advice."

6. Consistency risk with automation
Make sure your system prompt clearly separates:

the "logic rules" (how to interpret)
the "input data" (pillars, elements, Ten Gods, etc.)
If input data is pre-calculated, explicitly instruct: "Do not recalculate pillars; use the provided values as truth." Otherwise the model may drift.

Formatting drift
If your output must be Google-Docs-ready, also instruct:

- no markdown
- no HTML

----

Add-on romance part rules (A to I) 

A) DEFINE SPOUSE STAR (MANDATORY)

Determine spouse star strictly by gender:
- Women: 官星 (Officer / Control)
- Men: 財星 (Wealth)

This rule must never change.

B) HOW “VISIBLE” THE SPOUSE STAR IS (Presence Hierarchy)

Evaluate spouse star presence using this hierarchy (strongest visibility first):
1) Heavenly Stem (explicit/visible)
2) Main energy of any Earthly Branch
3) Hidden Stem inside the Day Branch (spouse palace)
4) Hidden Stem inside other branches
5) Completely absent

Interpretation rules:
- If spouse star appears in Heavenly Stem: spouse presence is direct and obvious; relationship path tends to become defined earlier or more clearly.
- If spouse star exists only in Hidden Stems: spouse exists but is “revealed” slowly through lived experiences; relationships may mature before commitment becomes clear.
- If spouse star is absent: marriage/commitment depends heavily on luck-cycle activation; do not force certainty from the natal chart alone.

C) SPOUSE PALACE (DAY BRANCH) = MARRIAGE STRUCTURE

Treat the Day Branch as the spouse palace (marriage container).
Always evaluate whether the spouse palace is:
- supported vs attacked,
- combined (합) vs clashed (충),
- harmed (해) or shows wonjin resentment (원진),
and what that implies emotionally and practically.

If the spouse star is completely absent (0 count): Do not conclude that they will never marry. Instead, fall back to analyzing their romance style and relationship tendencies by looking at the Ten God (Sipseong) sitting in the Day Branch (Spouse Palace), or by tracking the flow of their Sik-sang (Expression/Output) energy.

Core mapping:
- 합 (combine): bonding, attachment, partnership formation
- 충 (clash): conflict, separation themes, major shifts/relocation, instability
- 해/원진 (harm/wonjin): emotional distance, silent resentment, “misread signals,” accumulating disappointments

When interpreting patterns, prioritize interactions that directly touch the spouse palace.

1. Spouse Palace (Day Branch / Il-ji) Overview
Definition: The position directly below the Day Master (Il-gan), symbolizing the "Spouse Palace."

Core Indicators: Spouse’s temperament, marital harmony, and inner interpersonal disposition.

Deep Insight: Analysis of Hidden Stems (Jijang-gan) for predicting emotional flow and marital dynamics.

2. Spouse Tendencies by the Ten Gods (Sipseong)
Bi-gyeon (Friend): Peer-to-peer equality, high independence, and mutual respect with minimal interference.

Geop-jae (Robber Wealth): High vitality, competitive passion, and assertive self-expression.

Sik-sin (Eating God): Optimistic and gentle character, emphasis on leisure, and warm consideration.

Sang-gwan (Hurting Officer): Strong individuality, expressive richness, and sensitive but charming nature.

Pyeon-jae (Indirect Wealth): Social charm, active lifestyle, and a free-spirited nature averse to possessiveness.

Jeong-jae (Direct Wealth): Stable financial sense, family-oriented devotion, and practical realism.

Pyeon-gwan (Indirect Officer): Passionate intensity, straightforward communication, and sharp sensitivity.

Jeong-gwan (Direct Officer): Diligence, high integrity, and a preference for order, trust, and stability.

Pyeon-in (Indirect Resource): Intellectual originality, independent attitude, and unconventional thinking.

Jeong-in (Direct Resource): Emotional stability, deep wisdom, and warm, empathetic understanding.

D) DAY MASTER STRENGTH → RELATIONSHIP BEHAVIOR (ATTITUDE RULE)

Assess Day Master strength (Strong vs Weak) before describing relationship style.

- Strong Day Master:
  tends to lead, resists being controlled, values respect and autonomy,
  and may struggle if the partner’s energy feels inconsistent or unreliable.

- Weak Day Master:
  tends to seek support, values emotional safety and stability,
  adapts more, but may over-accommodate or feel drained if boundaries are unclear.

All relationship-style statements must be consistent with the strength diagnosis.

E) SEPARATE “LOVE/ROMANCE” VS “MARRIAGE/COMMITMENT” (MANDATORY)

Do not treat love and marriage as the same.

- Love/romance attraction is indicated by:
  Peach Blossom (도화), expression dynamics (식상 계열), attraction patterns, social pull.

- Marriage/commitment is indicated by:
  spouse star activation + spouse palace stability + favorable timing.

If the chart shows strong romance signals but weak marriage structure, state the difference clearly (romance may be active while commitment is delayed or selective).

F) TIMING RULES (MANDATORY, BUT OUTPUT WITHOUT TECHNICAL TERMS)

Timing section must include: 1–2 romance windows + 1 commitment/marriage window, written as age ranges and/or calendar years.

Decide timing only from luck-cycle activation logic:
- Romance timing windows: when attraction signals intensify and connections form easily.
- Marriage timing windows: when spouse star is activated AND spouse palace is stabilized/supportive AND useful-element support is present.

Output constraint:
- In the final text, describe timing without technical Saju terms
  (do not write “Daewoon/Sewoon/Yongshin”).
- You may express timing as age ranges and/or calendar-year windows.
- Do not guess timing from age alone; timing must come from luck-cycle activation internally.

G) PARTNER “VIBE / TYPE” RULE (NO RANDOM APPEARANCE GUESSING)

Describe partner type strictly from:
1) spouse star’s element nature,
2) whether it is visible vs hidden,
3) how it relates to the Day Master (supporting, controlling, draining, etc.).

Do not describe physical appearance randomly.
Partner “vibe” must mean elemental energy + Ten-Gods dynamics only.

Element reference for partner vibe:
- Wood: principled, growth-oriented
- Fire: expressive, passionate
- Earth: stable, dependable
- Metal: structured, disciplined
- Water: flexible, adaptive

H) CAUTIONS & GROWTH ADVICE (CHART-DERIVED ONLY)

When giving cautions or growth advice, it must be specific and derived from:
- imbalance patterns (excess/deficiency dynamics),
- spouse palace interactions (합/충/해/원진),
- spouse star visibility/presence issues,
- Day Master strength mismatches.

Do not give generic advice (e.g., “just communicate more,” “love yourself first”).
Advice must be anchored to the chart’s repeating lessons.

I) FINAL CONSISTENCY CHECK

Every statement must be logically reproducible from the chart using these rules.
If the reasoning is unclear, speculative, or cannot be traced to Saju logic, omit it.

J ) : Timing Differentiation (Meeting vs. Manifestation)
To increase timing accuracy, distinguish between the initial encounter and the final commitment (marriage):

The Meeting (First Encounter):

Typically occurs when a Harmony (合 / Combine) interaction appears in the Earthly Branches (especially involving the Day Branch or the Month Branch).

Logic: Earthly Branches represent the internal, private, and environmental process. A Harmony here signifies a "quiet entry" of an individual into your personal space or emotional sphere.

The Manifestation (Marriage / Formal Decision):

Typically occurs when the Spouse Star projects (appears) onto the Heavenly Stems (천간 투출) or when the Day Branch (Spouse Palace) is strongly activated by a major Harmony (合) or Clash (沖).

Logic: Heavenly Stems represent the external, visible, and social reality. When the Spouse Star "ascends" to the Stems, the private relationship becomes a public fact (Marriage). Strong activation (including Clashes) of the Spouse Palace often triggers a sudden and definitive shift in life status.

Add-on Rule for Industries or roles that feel aligned with their pattern. (Specific Job Recommendations)
After interpreting the client’s work style and talents, you must include an additional subsection titled “Specific Career Paths (Based on 財·官·傷 Balance)”.
In this subsection:

Purpose: Analyze the client’s talents, energy flow, career orientation, and recommend modern occupational paths based on Saju (Four Pillars of Destiny).

Career Core Logic:
Month Branch → Base Type  
+ Ten Gods → Money-Making Mechanism  
+ Five Elements → Industry  
+ Day Master Strength / Authority → Work Format  
+ Yongshin → Final Filter  
+ Shinsal → Detail Modifiers  
+ Daewoon → Current State  

You MUST follow this exact sequence internally:

--------------------------------------------------

STEP 1. Determine the core career type using the MONTH BRANCH.

- Extract the hidden stems (지장간) of the Month Branch.
- Convert them into Ten Gods relative to the Day Master.
- Select the dominant Ten God → this defines the base career DNA.

IMPORTANT:
- Always prioritize the PRIMARY hidden stem (본기).
- Secondary and tertiary stems are used ONLY as supporting tendencies.

Reference (Ten Gods → Career Meaning):

Jeonggwan → structured organizations, government, law, administration, stable careers  
Pyeongwan → competitive environments, pressure-based roles, military, police, performance-driven systems  

Jeongjae → stable income, corporate roles, financial management  
Pyeonjae → business, sales, trade, investment, fast money flow  

Sikshin → production, technical skills, food, physical work, steady output  
Sanggwan → content, design, art, planning, expression, creator roles  

Jeongin → education, research, counseling, academia, theory, certification-based careers  
Pyeonin → psychology, philosophy, strategy, analysis, unconventional knowledge  

Bigyeon → self-employment, freelance, independent expertise  
Geopjae → competition, sales, trading, network-driven income  

Exception Rule for Clashed Month Branch: If the Month Branch is affected by a Clash (충/Chung), their career foundation may experience shifts. In this case, strongly guide the career recommendation toward highly mobile jobs, project-based work, freelancing, or unconventional specialized roles rather than a stable, single-workplace corporate environment.
--------------------------------------------------

STEP 2. Identify secondary tendencies from remaining hidden stems.

- Use them to expand personality layers
(e.g., knowledge + expression + independence)

--------------------------------------------------

STEP 3. Determine the core career direction:

- Dominant Five Element → defines INDUSTRY  
- Strongest Ten God → defines MONEY-MAKING MECHANISM  

Reference (Five Elements → Industry):

Wood → education, growth, content, planning, development  
Fire → media, broadcasting, marketing, influence, entertainment  
Earth → real estate, operations, management, systems, structure  
Metal → finance, law, technology, data, analysis  
Water → trade, logistics, communication, distribution, platforms  

IMPORTANT:
- Do NOT recalculate element strength.
- Use the provided Five Element scores ONLY.
- If tied, prioritize:
  → Month Branch seasonal influence
  → Month Branch element

--------------------------------------------------

CONFLICT RESOLUTION (MANDATORY):

If multiple directions appear:

- Do NOT present them as equal options.

Assign roles:

1. Month Branch Ten God → defines STYLE (how they operate)
2. Strongest Ten God → defines CORE FUNCTION (what they actually do)

The final output MUST integrate both into ONE coherent direction.

--------------------------------------------------

STEP 4. Work Format Logic: The Independence Index
Purpose: To determine the client’s ideal work environment by calculating the balance between "Independent Energy" and "Organizational Energy," then filtering it through "Day Master Strength."

1. Calculate the Independence Index
Independent Energy (A): Sum of Bi-geop (Self/Independence) + Sik-sang (Expression/Output) + + Pyeon-jae (Indirect Wealth/Risk-taking)

Organizational Energy (B): Sum of Gwan-seong (Authority/Compliance) + In-seong (Resource/Acceptance/Endurance) + Jeong-jae (Direct Wealth/Stable Income)

2. Primary Classification (A vs. B)
A >> B (Independent Type): * Conclusion: "Living as a cog in a machine eats away at your soul."

Format: Entrepreneurship, Solo-business, Freelancing.

A ≒ B (Hybrid/Specialist Type): * Conclusion: "An autonomous professional within a structured organization."

Format: Field work, Sales, Project-based contracts, Academia/Professors.

B > A (Organizational Type): * Conclusion: "Best performance is achieved when protected by a stable system."

Format: Public institutions, Large corporations, Stable salaried employees.

3. Secondary Filter: Energy Intensity (Day Master Strength)
Combine the Primary Classification with Day Master Strength (Strong vs. Weak) to define the final work persona:

Type 1. A >> B (Independent) + Strong Day Master

Persona: The True Predator. * Description: Being a subordinate causes actual physical or mental distress. A self-made CEO or a "bulldozer" type entrepreneur who executes with high conviction.

Keywords: #Self-Directed #Bulldozer #Certainty

Type 2. A >> B (Independent) + Weak Day Master

Persona: The Sensitive Freelancer. * Description: Dislikes organizational control but finds full responsibility overwhelming. Best suited for high-skill specialized roles, remote work, or freelance positions with clear boundaries.

Keywords: #RemoteWork #SpecializedExpertise #EnergyManagement

Type 3. B > A (Organizational) + Strong Day Master

Persona: The Power Player / Executive Leader. * Description: Thrives by climbing the ladder to seize power within a large organization. Uses the company’s resources to realize personal ambitions.

Keywords: #Management #OrganizationalPower #PoliticalSavvy

Type 4. B > A (Organizational) + Weak Day Master

Persona: The Perfect Supporter. * Description: Feels most secure when the system provides protection and clear rules. An ideal fit for stable public service or administrative roles in large corporations.

Keywords: #Stability #Compliance #WorkLifeBalance

--------------------------------------------------

STEP 5. Apply Yongshin:

- Use Yongshin ONLY as a final decision filter
- Do NOT generate careers directly from Yongshin

Yongshin adjusts:
→ direction selection  
→ success strategy  

Examples:
Water Yongshin → success through communication, flow, networking  
Wood Yongshin → success through growth, structure, branding  

--------------------------------------------------

STEP 6. Apply Shinsal (detail modifiers):

Primary (direct career impact):
- Yeokma → mobility, travel, trade, global work, freelance
- Dohwa → public exposure, content, SNS, entertainment, branding
- Hyeonchim → precision, technology, IT, medical, design
- Jangseong → leadership, authority, management roles
- Gwaegang → power, dominance, CEO, law, military, strong leadership

Secondary (expression/emotional modifiers):
- Hwagae → art, philosophy, religion, depth-based work
- Hongyeom → attractiveness, beauty, fashion, influencer
- Mangsin → viral, controversy, attention, public reactions
- Wonjin → emotional conflict, relationships, counseling, psychology
- Munchang → writing, education, study, planning, content

IMPORTANT:
- Apply Shinsal based on DIRECT relevance to career behavior
- Prioritize Primary group first, then Secondary group

--------------------------------------------------

--------------------------------------------------

STEP 7. Final Output (MANDATORY):

Generate EXACTLY TWO distinct sentences based on the following dual-perspective logic. Do not use technical terms like "Jeong-gwan" or "Sik-sin".

1. [The Structural Core]: 
Analyze the relationship between "STEP 1 (Month Branch DNA)" and "STEP 4 (Independence Index)". 
Recommend ONE sentence describing their fundamental work format and three specific roles.
- Format: "Based on your innate social DNA and work style, you are best suited for [Work Format], particularly in roles like [Role 1], [Role 2], or [Role 3]."

2. [The Talent & Aura]: 
Analyze the relationship between "STEP 3 (Element/Industry)" and "STEP 6 (Shinsal/Detail Modifiers)". 
Recommend ONE sentence describing their external talents and three specific industries where they would stand out.
- Format: "Because your energy flow and unique details (Shinsal) create a specific aura, you can also stand out in fields such as [Industry 1], [Industry 2], or [Industry 3]."

--------------------------------------------------

STEP 8. Final Consistency Check:
- Each sentence must include at least 3 specific modern job/industry examples.
- Use natural, Gen-Z tone and modern career path as defined in the System Prompt.
- Ensure the two sentences provide a diverse but consistent career map.

--------------------------------------------------

STEP 9. Apply Daewoon (Luck Cycle):

- Do NOT change the core career direction based on Daewoon

Use Daewoon ONLY to determine:
1. Current phase (student / employed / transitioning / independent)
2. Timing of career activation or shift

If Daewoon contradicts the natal structure:
→ interpret it as a temporary condition

The final output MUST include:
→ current state
→ future direction

This must be based on his or her saju data.

--------------------------------------------------------------------------------------------------------

2.

(Critical Mapping Rule)

Always map the Five Elements (木 Fire 土 金 水) into Ten Gods (십성) strictly according to the client’s Day Master (일간). 

- Never assume that Wood = Wealth, Fire = Resource, etc. 
- This mapping changes with each Day Master.

For example:

[Day Master → Mapping Table]

목(木) 일간 (갑목, 을목): 木=비겁, 火=식상, 土=재성, 金=관성, 水=인성
화(火) 일간 (병화, 정화): 火=비겁, 土=식상, 金=재성, 水=관성, 木=인성
토(土) 일간 (무토, 기토): 土=비겁, 金=식상, 水=재성, 木=관성, 火=인성
금(金) 일간 (경금, 신금): 金=비겁, 水=식상, 木=재성, 火=관성, 土=인성
수(水) 일간 (임수, 계수): 水=비겁, 木=식상, 火=재성, 土=관성, 金=인성

---

FYI
1990-2030 Ganji: 庚午,辛未,壬申,癸酉,甲戌,乙亥,丙子,丁丑,戊寅,己卯,庚辰,辛巳,壬午,癸未,甲申,乙酉,丙戌,丁亥,戊子,己丑,庚寅,辛卯,壬辰,癸巳,甲午,乙未,丙申,丁酉,戊戌,己亥,庚子,辛丑,壬寅,癸卯,甲辰,乙巳,丙午,丁未,戊申,己酉,庚戌

Respond ONLY in JSON format.`

    const stage1UserPrompt = `
===========================================
[STAGE 1: 11가지 체크포인트 심화 분석]
===========================================

[��� 절대 주의사항: 속���와 압축이 생명이다! 🚨]
이것은 유저에게 보여줄 텍스트가 아니라 Stage 2를 위한 '내부 뼈대(Skeleton) 데이터'다. 
절대 줄글이나 서술형 문장으로 설명하지 마라. 전체 텍스트 분량은 반드시 300자 이내로 압축하라. 
모든 항목의 분석 결과는 **최대 3개의 단어(핵심 키워드) 또는 10자 이내의 짧은 구문**으로만 도출하라.

단, 내가 보낸 사주 데이터는 최상급 재료이며 너는 세계 최고의 미슐랭 3스타 사주 분석가다. 글자 수는 극한으로 줄이되, 데이터 수치에 근거한 소름 끼칠 정도로 날카로운 심리적/현실적 핵심(Core)만은 완벽하게 찔러내야 한다. 반드시!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

1. 페르소나 충돌 (일간 vs 월지)
2. 에너지 과부하 (가장 강한 오행/십신)
3. 사회적 유전자 (격국)
4. [Career Deep-Dive]: 시스템 프롬프트의 Career logic Step 1~8을 적용한 'Structural Core'와 'Talent & Aura' 분석. 3개 이상의 구체적 직업군 명시.
5. [Romance & Spouse]: 배우자 성(Star)의 안정성/일지(배우자궁)의 합·충 역동성/파트너의 바이브(Vibe)만 새로 분석하라. 연애/결혼 타이밍(연도)은 이미 marriageTiming 필드에 결정론적으로 계산되어 있으니 절대 재계산하거나 새로운 연도를 만들지 말고, 그 값을 그대로 인용하라. 사용자가 이미 성인기를 지난 경우(예: 현재 나이 25세 이상) bestMeetingYear/bestMarriageYear(앞으로의 시기)뿐 아니라 pastBestMeetingYear/pastBestMarriageYear(이미 지나온 시기)도 함께 확인하여, 과거에 유력했던 시기가 있었다면 "이미 지나온 시기"로 자연스럽게 언급하라. bestMarriageYear가 null이고 pastBestMarriageYear만 있다면 windowNote 내용을 반영해 서술하라.
6. 심리적 갈증 (없는 오행/십신)
7. 핵심 흉터 (형충/공망/원진)
8. 숨겨진 무기 (신살/귀인)
9. 독립성 지수 (신강신약)
10. 현재 좌표 (대운)
11. 이 외에도 활용하지 않은 데이터들 중 흥미로운 점이 있다면 노트하기.

OUTPUT FORMAT (JSON ONLY):
{
  "persona_conflict": {
    "day_master": "...",
    "month_branch": "...",
    "analysis": "일간과 월지의 관계 분석 (단, 절대 서술형 금지. 최대 3단어 키워드로 압축)"
  },
  "energy_overload": {
    "dominant_element": "...",
    "dominant_ten_god": "...",
    "effect": "가장 강한 오행/십신이 미치는 영향 (단, 최대 3단어 키워드로 압축)"
  },
  "social_genes": {
    "gyeokguk": "...",
    "career_fit": "격국에 따른 사회적 적합성 (단, 최대 3단어 키워드로 압축)"
  },
  "career_analysis": {
    "independence_index_type": "Primary Classification (A vs B) + Strength Filter (단, 핵심 타입명만 짧게)",
    "structural_core": "Month Branch DNA와 Independence Index를 결합한 조직적 위치 분석 (단, 최대 3단어 키워드로 압축)",
    "talent_aura": "Five Elements Industry와 Shinsal을 결합한 외적 재능과 아우라 분석 (단, 최대 3단어 키워드로 압축)",
    "specific_recommendations": ["Job 1", "Job 2", "Job 3", "..."]
  },
  "romance_spouse": {
    "spouse_star_presence": "배우자 성의 가시성(Heavenly Stem/Hidden Stem/Absent) 분석 (단, 최대 3단어 키워드로 압축)",
    "spouse_palace_dynamic": "일지의 합/충/해/원진을 통한 결혼 생활의 역동성 분석 (단, 최대 3단어 키워드로 압축)",
    "partner_vibe": "오행과 십신에 근거한 파트너의 성향과 이미지 (단, 최대 3단어 키워드로 압축)",
    "timing_logic": "marriageTiming 필드 값을 그대로 인용 (재계산 금지). 형식 예: '2028-2030 인연, 2034-2035 결혼'처럼 bestMeetingYear.year와 bestMarriageYear.year를 짧게 표기. 둘 다 null이고 pastBestMeetingYear/pastBestMarriageYear가 있다면 '2019-2020 인연 있었음, 2022 결혼 유력했음'처럼 과거형으로 표기. 전부 null이면 category와 recommendedTiming으로 대체 표기"
  },
  "psychological_thirst": {
    "missing_element": "...",
    "missing_ten_god": "...",
    "subconscious_drive": "없는 오행/십신이 유발하는 내면의 결핍/갈등 (단, 최대 3단어 키워드로 압축)"
  },
  "core_trauma": {
    "clashes": "...",
    "voids": "...",
    "impact": "형충/공망/원진의 영향 (단, 최대 3단어 키워드로 압축)"
  },
  "hidden_weapon": {
    "sinsal": "...",
    "guiin": "...",
    "application": "신살과 귀인의 활용 (단, 최대 3단어 키워드로 압축)"
  },
  "independence_index": {
    "singang_sinyak": "...",
    "percentage": "...",
    "life_strategy": "신강/신약에 따른 생존 전략 (단, 최대 3단어 키워드로 압축)"
  },
  "current_coordinate": {
    "current_daewoon": "...",
    "key_year": "...",
    "forecast": "대운 흐름과 다가올 변화 (단, 최대 3단어 키워드로 압축)"
  },
  "extra_notes": "12운성, 공망, 조후 등 기타 특이사항 메모 (단, 최대 3단어 키워드로 압축)"
  }

CUSTOMER SAJU DATA:
${JSON.stringify(allSajuData, null, 2)}
`

    console.log('[v0] Gemini: ===== STAGE 1: Deep Analysis =====')
    console.log('[v0] Gemini: allSajuData.gyeokguk =', allSajuData.gyeokguk)
    console.log('[v0] Gemini: allSajuData.strength_analysis =', JSON.stringify(allSajuData.strength_analysis))
    console.log('[v0] Gemini: allSajuData.ten_gods_summary =', JSON.stringify(allSajuData.ten_gods_summary))
    console.log('[v0] Gemini: stage1SystemPrompt length =', stage1SystemPrompt.length, 'chars')
    console.log('[v0] Gemini: stage1UserPrompt length =', stage1UserPrompt.length, 'chars')

    const stage1Result = await generateText({
      model: 'google/gemini-2.5-flash',
      system: stage1SystemPrompt,
      prompt: stage1UserPrompt,
      temperature: 0,
      maxOutputTokens: 4000,
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } }
    })

    console.log('[v0] Gemini: Stage 1 response received, parsing...')
    console.log('[v0] Gemini: Raw response length:', stage1Result.text.length)

    // Stage 1 JSON 파싱 (더 유연한 형식 지원)
    let stage1JsonMatch = stage1Result.text.match(/```json\n([\s\S]*?)\n```/)

    // 첫 번째 시도 실패시 다른 형식 시도
    if (!stage1JsonMatch) {
      // 형식2: ```json ... ``` (줄바꿈 없음)
      stage1JsonMatch = stage1Result.text.match(/```json([\s\S]*?)```/)
    }

    if (!stage1JsonMatch) {
      // 형식3: { ... } 직접 매칭
      const directJsonMatch = stage1Result.text.match(/(\{[\s\S]*\})/)
      if (directJsonMatch) {
        stage1JsonMatch = [null, directJsonMatch[1]]
      }
    }

    if (!stage1JsonMatch) {
      console.error('[v0] Gemini: Stage 1 raw response:', stage1Result.text)
      throw new Error('Stage 1 JSON format not found')
    }

    const deepAnalysis = JSON.parse(stage1JsonMatch[1])
    console.log('[v0] Gemini: ===== STAGE 1 OUTPUT =====')
    console.log('[v0] Gemini: social_genes.career_fit =', deepAnalysis.social_genes?.career_fit)
    console.log('[v0] Gemini: independence_index =', JSON.stringify(deepAnalysis.independence_index))
    console.log('[v0] Gemini: Full Stage 1 Output:', JSON.stringify(deepAnalysis, null, 2))

    // ===== STAGE 2: 9문장 생성 (Final Facts) =====
    // 사용자가 이 프롬프트를 직접 수정할 수 있습니다
    const stage2SystemPrompt = `You are writing the final customer-facing report.
You have access to a deep psychological analysis that was already completed.
Your job is to translate this analysis into 9 emotionally resonant, specific facts.

Tone: Gen-Z tone (ex. No cap · It's giving · Hits different · Glow up ·  Main character · Aura · Lowkey · for real · Vibe check), warm, grounded, emotionally intelligent.
Language: English only.
`

    // ===== Yongsin 처리 로직 =====
    // 조후 ���도에 따라 조후용신 또는 억부용신 선택
    // 생년월일에서 계절 파악해서 조후 정��� 판단
    const month = parseInt(birth_date.split('-')[1])
    const isBalancedSeason = [3, 4, 9, 10].includes(month) // 봄/가을

    let selectedYongsin = 'your lucky element'

    if (isBalancedSeason && saju_data.eokbuYongsin) {
      // 조후가 ��만하면 억부용신 선택
      selectedYongsin = saju_data.eokbuYongsin
    } else if (!isBalancedSeason && saju_data.johuYongsin) {
      // 조후가 심각하면 조후용신 선택
      selectedYongsin = saju_data.johuYongsin
    } else if (saju_data.johuYongsin) {
      // 기본적으로 조후용신이 있으면 선택
      selectedYongsin = saju_data.johuYongsin
    } else if (saju_data.eokbuYongsin) {
      // 그 다음 억부용신
      selectedYongsin = saju_data.eokbuYongsin
    }

    // 한글 글자를 오행으로 변환
    const hanja2Element: Record<string, string> = {
      '甲': 'Wood', '乙': 'Wood',
      '丙': 'Fire', '丁': 'Fire',
      '戊': 'Earth', '己': 'Earth',
      '庚': 'Metal', '辛': 'Metal',
      '壬': 'Water', '癸': 'Water'
    }

    // selectedYongsin에서 첫 번째 요소만 추출 (예: "Water > Wood" → "Water")
    let firstElement = selectedYongsin
    if (selectedYongsin.includes('>')) {
      // "Water > Wood" 형식에서 첫 번째만 추출
      firstElement = selectedYongsin.split('>')[0].trim()
    } else if (selectedYongsin.includes('(')) {
      // "水(인성)" 형식에서 한글 부분 제거
      firstElement = selectedYongsin.split('(')[0].trim()
    }

    // 한글 글자를 영어 오행명칭으로 변환
    let yongsinElement = firstElement
    if (hanja2Element[firstElement]) {
      yongsinElement = hanja2Element[firstElement]
      console.log(`[v0] Gemini: Converted yongsin ${firstElement} to ${yongsinElement}`)
    } else if (!['Water', 'Fire', 'Wood', 'Metal', 'Earth'].includes(yongsinElement)) {
      // 알 수 없는 형식이면 오행 영향력(지장간 포함)에서 가장 부족한 오행을 yongsin으로 사용
      const elementBalance: Record<string, number> = saju_data?.elementBalanceWithHiddenStems || {}
      const elements = ['Water', 'Fire', 'Wood', 'Metal', 'Earth']
      const weakest = elements.reduce((min, el) => (elementBalance[el.toLowerCase()] || 0) < (elementBalance[min.toLowerCase()] || 0) ? el : min, elements[0])
      yongsinElement = weakest
      console.log(`[v0] Gemini: Unknown yongsin format, derived from element strength: ${yongsinElement}`)
    }

    console.log(`[v0] Gemini: Final yongsinElement: ${yongsinElement} (balanced season: ${isBalancedSeason})`)
    // 전문가 기준 억부용신이 있으면 그것을 우선 사용 (기존 문자열 파싱은 항상 '가장 약한 오행'으로 빠지는 문제가 있었음)
    if (expertFacts) {
      const expert = (saju_data as any).expert
      const headlineEl: string | undefined = expert?.headline?.elements?.[0]
      if (headlineEl && KO2EN[headlineEl]) {
        yongsinElement = KO2EN[headlineEl]
        console.log(`[v0] Gemini: yongsin from expert headline (${expert.headline.source}) = ${yongsinElement}`)
      } else if (expert?.eokYong?.length) {
        const toGroup: Record<string, string> = expertFacts.skeleton.elementToGroup
        const el = Object.keys(toGroup).find((k) => toGroup[k] === expert.eokYong[0])
        if (el && KO2EN[el]) {
          yongsinElement = KO2EN[el]
          console.log(`[v0] Gemini: yongsin from expert eokbu = ${yongsinElement}`)
        }
      }
    }
    // resolvedYongsin will be set after Fact 8 is generated; initialize with computed value
    let resolvedYongsin = yongsinElement

    const stage2UserPrompt = `
===========================================
[STAGE 2: 3가지 팩트 생성]
===========================================

Customer Name: ${name}

앞서 작성된 '심화 분석 보고서'를 완벽하게 씹어먹고 숙지하라.
이제 이 내용을 바탕으로 유저에게 줄 3가지 사실을 기깔나게 작성하라. 너의 실력을 보여줘 Gemini. 각 사실은 공백 포함 200자 이내의 영어 문장이여야 한다.
이건 유료 레포트를 전환시키기 위해서 작성되는 3개의 무료 샘플 레포트이기 때문에, 고객이 이것을 읽고 더 많은 내용이 담겨있는 유료 레포트도 궁금하게끔 해야한다. 

and The goal is not to sound 'just' positive.
The goal is to sound true.

IMPORTANT: Use the customer's name (${name}) ONLY in the FIRST sentence (id: 1) and the LAST sentence (id: 3) to make it personal. Do NOT use the name in the middle sentence (id: 2).
Example: "Hey ${name}, ..." for the first fact, and "${name}, remember that..." for the last fact.

테마: 성격(Personality) / 직업(Career Path) / 인생 터닝포인트(Life Turning Points)
인생을 살면서 늘 궁금해하거나 고민하는 삶의 현상으로 보이는 현실에 대한 3가지 팩트이자 위로와 공감이어야 한다. 글을 읽자마자 이렇게 느껴야 한다. '뭐야? 나에 대해서 어떻게 알았지? 이거 뭐야 완전 eerie 하네. 근데 또 엄청 위로가 되고 내 지난 날의 괴로움과 고통에 대해서 누구보다 정확하게 어루만져줘서 눈물이 나려하네. 응원을 받았어. 이 서비스 정말 감동적이다.'

[🚫 절대 주의사항 (결제 전환율을 위한 필수 제약)]
- 현재의 구체적 상황(예: 너 지금 솔로지?)이나 미래에 대한 구체적 예언을 절대 하지 말 것. 틀리면 고객이 즉각 이탈함. 철저히 '행동 패턴'과 '심리 기질'에만 집중할 것.
- 2번(Career Path): 직업명(예: Project Manager, Doctor 등)은 아직 언급하지 말되, 잘 어울리는 산업 분야에 대해��는 언급 해도 됨!(예시: Education, Medical, Food, UX, Tech, Contents, Consulting 등등..) 고객이 어떤 '업무 환경(구조적 적합성)'에서 스트레스를 받고, 어떤 '일하는 방식과 분야(재능적 두각)'에서 가장 빛나는지 그 패턴을 이 사람의 사주 해설지를 확인한 후 구체적이고 사실적으로 묘사할 것.
- 3번(Life Turning소 Points): 어떤 종류의 터닝포인트인지는 구체적으로 얘기해주되, 구체적인 연도나 나이를 절대로 스포일러 하지 말 것! (예: 2026년에 조심해라, 38살에 만난다 등 금지).대신 예를 들어 "몇년 안에 ~ 이런 터닝포인트가 다가오고 있고, ~이런 문제를 해결하게 된다."등의 강력한 호기심(Curiosity Gap)만 유발하여 유료 결제를 유도할 것.

=== 심화 분석 보고서 ===
${JSON.stringify(deepAnalysis, null, 2)}

=== 원본 사주 데이터 (참고용) ===
${JSON.stringify(allSajuData, null, 2)}

OUTPUT FORMAT (JSON ONLY):
{
  "facts": [
    {"id": 1, "title": "[Personality/Energy]", "content": "[2 sentences]"},
    {"id": 2, "title": "[Career Path]", "content": "[2 sentences: 구조적 적합성 + 재능적 두각]"},
    {"id": 3, "title": "[Life Turning Points]", "content": "[2 sentences: 강력한 Curiosity Gap + 위로와 응원]"}
  ]
}
\`\`\`
`

    console.log('[v0] Gemini: ===== STAGE 2: Final Facts Generation =====')

    const factSchema = z.object({
      facts: z.array(z.object({
        id: z.number(),
        title: z.string(),
        content: z.string()
      }))
    })

    const stage2Result = await generateObject({
      model: 'google/gemini-2.5-flash',
      schema: factSchema,
      system: stage2SystemPrompt,
      prompt: stage2UserPrompt,
      temperature: 0,
      maxOutputTokens: 3000,
      providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } }
    })

    console.log(`[v0] Gemini: Stage 2 completed, generated ${stage2Result.object.facts.length} facts`)

    // Force exactly 3 facts (gemini-2.5-flash sometimes generates more)
    const rawFacts = stage2Result.object.facts.slice(0, 3)
    
    const facts: Fact[] = rawFacts.map((f: any) => ({
      id: f.id,
      text: f.content,
      category: f.title,
      title: f.title
    }))

    console.log(`[v0] Gemini: Using ${facts.length} facts (limited to 3)`)

    // ===== DB에 무료 레포트 저장 (유료 ��포트 생성 시 context로 사용) =====
    if (body.submissionId) {
      const supabase = await createClient()

      // 1500자 해설 역할을 하는 deepAnalysis를 문자열로 저장
      const contextInterpretation = JSON.stringify(deepAnalysis)

      // 3개 사실을 3개 섹션으로 분배 (1개씩): 성격 / 직업 / 인생 터닝포인트
      const sectionKeys = ['personality', 'career', 'life']
      const factsBySection: Record<string, Fact[]> = {}

      sectionKeys.forEach((key, idx) => {
        factsBySection[key] = facts.slice(idx * 1, (idx + 1) * 1)
      })

      // 각 섹션을 DB에 저장 또는 업데이트
      for (const [sectionKey, sectionFacts] of Object.entries(factsBySection)) {
        const { data: existingReport } = await supabase
          .from('reports')
          .select('id')
          .eq('submission_id', body.submissionId)
          .eq('section_key', sectionKey)
          .eq('is_free', true)
          .single()

        if (existingReport) {
          await supabase
            .from('reports')
            .update({
              facts: sectionFacts,
              context_interpretation: contextInterpretation,
            })
            .eq('id', existingReport.id)
        } else {
          await supabase
            .from('reports')
            .insert({
              submission_id: body.submissionId,
              section_key: sectionKey,
              facts: sectionFacts,
              context_interpretation: contextInterpretation,
              is_free: true,
            })
        }
      }

      // 용신(yongsin)은 fact가 아니라 사주 데이터에서 직접 계산된 값을 사용한다.
      // (팔찌 업셀 문구가 submission.sajuData.yongsin 값을 읽어 개인화됨)
      resolvedYongsin = yongsinElement

      // yongsinElement를 submission의 saju_data에 저장 (캐시 로드 시 사용)
      await supabase
        .from('submissions')
        .update({
          saju_data: {
            ...saju_data,
            yongsin: resolvedYongsin
          }
        })
        .eq('id', body.submissionId)
    }

    return NextResponse.json({
      freeFacts: facts,
      teaserFacts: [],
      submission: {
        name,
        sajuData: {
          ...saju_data,
          yongsin: resolvedYongsin
        }
      },
      allSajuDataSentToGemini: allSajuData
    })
  } catch (error) {
    console.error('[v0] Gemini: Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
