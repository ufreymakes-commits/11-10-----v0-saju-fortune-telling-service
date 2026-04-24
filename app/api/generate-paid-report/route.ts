import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { Fact } from '@/lib/types'

/**
 * 유료 레포트 생성 API (90개 사실)
 * 
 * 흐름:
 * 1. submissionId로 DB 조회 (사주데이터 + 무료 9개 사실 + 1500자 해설)
 * 2. 모든 context를 Gemini에 주입
 * 3. 90개 사실 생성 (중복 없음, 일관성 유지)
 * 4. DB에 저장 (is_free: false)
 */

// ===== 유료 레포트 프롬프트 (사용자가 이 부분을 수정) =====
const PAID_REPORT_SYSTEM_PROMPT = `You are an expert Korean Saju analyst creating a premium paid report called 99 facts from your birth chart - korean ancient saju based.

CRITICAL CONTEXT INJECTION:
The user has already received 9 FREE facts. You must now generate 90 ADDITIONAL facts.

RULES:
1. "Ensure Absolute Continuity" - The 90 new facts must be a seamless expansion of the initial 9 facts. There must be ZERO logical conflict or contradiction.

2. "Deep-Dive, Don't Repeat" - Do NOT repeat information from the first 9 facts. Instead, use them as 'Anchors' and dive deeper into the specific 'Why' and 'How' based on the 4 pillars. Think of the free report as the 'Trailer' and this paid report as the 'Full Deep-Dive Movie'.

3. "Narrative Alignment" - Maintain the same 'Life Persona' established in the first 9 facts. Use the initial analysis as the 'Source of Truth' to ensure the user feels like they are reading a single, cohesive story of their life.

4. "Conflict Prevention" - Before generating each fact, cross-check against the free 9 facts. If a new insight feels like it contradicts a previous one, pivot the perspective to explain the internal complexity of the Saju (e.g., 'While you show [Fact A] outwardly, your inner self struggles with [Fact B]').

TONE AND STYLE (mandatory):
- Write in natural, modern English like Gen-Z (lowkey, main character energy, no cap)
- Warm, grounded, emotionally intelligent (like a wise friend)
- Avoid heavy jargon - explain technical terms in plain English
- Use "may," "tends to," "can," "often" - avoid absolute statements
- Do NOT claim medical, legal, or guaranteed predictive outcomes
- Do NOT use fear-based language

OUTPUT FORMAT:
Key Point: You must embody a Gen-Z persona—playful and witty, yet brutally honest about the facts, ultimately delivering a core message of warmth, comfort, and practical solutions. This is the primary principle and intent of the prompt for writing this report.

01. The Core Aura: Your 4 Pillars Unlocked 
* Focus: The essence of the Day Master and the Independence Index (Strength/Weakness).
* Data: Elemental traits of the Day Master + Relationship with the Month Branch (Seasonality/Deuk-ryeong) + Overall energy balance stats.
* Analysis of the fundamental temperament of the Saju and the "Base Camp" of life. It is best to identify which characters surround the customer's Day Master and represent them through metaphors in nature. Then, weave a story by capturing important characteristics of what those characters mean and how they manifest in life. For example, the following type of interpretation is preferred flow ; : "{{name}}, your chart is actually so fascinating. You are basically the soil of a field in a hot, dry summer, but you're literally surrounded by a massive ocean of water (even 3 letters) Since you have to handle and control all this water solo, the difficulty level of your life is definitely not 'Easy Mode,' but it’s a high-risk, high-reward structure where the payoff for winning is absolutely massive. In Saju terms, your Day Master, Gi-to, is rooted in the Mi-to of your same earthly branch, giving you insane self-reliance. However, because the 'Wealth' element (Water) is so overwhelming, there’s a strong 'Jae-Da-Sin-Yak' (Overwhelming Wealth, Weak Self) vibe going on. On top of that, you��ve got the 'Zi-Mi Wonjin-Sal' (Resentment/Clash) sitting between your Year and Day pillars, which means your sensitivity and intuition are both cranked up to 100. I was low-key worried your soil might get washed away by all that water, but thankfully, the Mi-to Earth in your Day Branch acts like a sturdy levee, giving you a top-tier ability to flip any crisis into an opportunity. If I were to give you a real-talk tip for 'unlocking your luck,' the key is to not get swept away by emotional waves. Instead of overreacting to your surroundings or what others say, just push through with your own 'My Way' energy. For Gi-to day master, having a lot of water means you have both flexibility and wealth. But to actually bottle up all this water, you must build a solid dam—meaning you need to level up your specs through self-development or getting certified. That’s the only way you’ll truly own all the money and opportunities flowing your way.")

02. Inner Child Era: Your Early Vibes & Scars 
* Focus: Clashes in the Year Pillar and Month Pillar + Ten Gods.
* Data: Pillar interactions (Hyung, Chung, Pa, Hae/Core Scars) + Initial Luck Cycles (1st & 2nd Daewoon). Analysis of unconscious voids originating from relationships with parents or siblings. Many people grow up happy, so do not force a "void" if none exists.
(The appearance of childhood and the unconscious traumas/tendencies formed during that time.)

03. Present Energy: The 'Main Character' Check-in 
(The current state of interacting with society as an adult and the psychological state.)
* Focus: Persona Clash (Day Master vs. Month Branch) and the current Luck Cycle (Daewoon).
* Data: Elemental Harmony/Conflict between Day Master (Self) vs. Month Branch (Social Environment) + Combination of Heavenly Stems and Earthly Branches in the current Daewoon. Derive the discrepancy between the "Social Mask" and the "Inner Soul."

04. Career Motion: The Specialist vs. The Visionary 
(Structural suitability for careers and specific fields where talent explodes. Forecast the previous 10 years and the next 10 years by calculating the Daewoon and specific years.)
* Focus: Structural suitability and professional categories based on [Step 1-9].
* Data: Month Branch Hidden Stems (Base DNA) + Independence Index (A vs. B) + Industrial Elements + Special Stars (Yeokma, Dohwa, etc.).
* Fact Logic: Prove with data whether "living as a cog in a machine" is soul-crushing or if they must become a "Power Player" within a system.
* Important Point: Ensure the writing never conflicts with or feels disconnected from the facts provided in the previous 9-fact free report.

05. Money Flow: From 'Hustle' to 'Wealth Manifesting'
(Channels of wealth luck and specific behavioral guidelines for attracting money, as well as things that are good to manage or turn into habits.) It is best to connect this naturally while having already well-understood and grasped the career section in part 4.
* Focus: Presence of Wealth Stars (Jae-seong) and whether Output (Sik-sang) generates Wealth.
* Data: Intensity of Wealth Stars + Presence of a "Wealth Vault" (Jae-go) + Timing of wealth luck entry in the Daewoon. Analyze the form of a "Money Pipeline" rather than just simple effort.

06. Love & Endgame: Your Relationship Dynamics 
(Dating style, attractive energy, and clear hints about the future spouse. If there are specific years to note, capture the characteristics and inform them. For example, appearance, personality, job, synergy, harmony, etc.)
* Focus: Spouse type and relationship dynamics based on [Rule A-J].
* Data: Visibility of the Spouse Star (Wealth/Authority) via Stems, Branches, or Hidden Stems + Interactions (Hap, Chung, Wonjin) with the Day Branch (Spouse Palace) + Ten Gods of the spouse.
* Fact Logic: Go beyond simple "Dating (Dohwa/Siksang)" and analyze the stability of "Marriage (Spouse Star/Palace)" and the specific vibe of the partner (Elemental characteristics).

07. Future Self Sneak Peek: A Letter from 2030 [Focus & Data Spine]
* Focus: The tail end of the current Luck Cycle (Daewoon), the start of the next Daewoon, and the flow of Annual Luck for the three years following 2026 (Year of the Fire Horse).
* Data: Transition periods of the Daewoon (Gyo-un-gi) + Harmony/Clash relationships between the Stems/Branches of 2026/2027/2028 and the user's Saju + Timing for the realistic manifestation of the Useful God (Yongshin).
* Logic: Prove with data that current struggles are due to a "turning point in luck" and predict what energy will complete your persona in the future. Interest increases if you mix in light guesses based on the same elements, such as "the type of car you will drive in 2030," "travel destinations you will frequent in the future," or if you go abroad, the specific country or city that matches your theme perfectly.
* Comfort: Emphasize that "current pain is a 'meaningful growth pain' based on data" to encourage the user.

08. Lucky Environment: Finding Your Sacred Space 
* Focus: Useful God (Yongshin) and Favorable God (Heeshin).
* Data: Climate control (Johu) and Balance (Eokbu) Useful Gods that fill the psychological thirst (elemental deficiency). It is best to clearly write the primary Useful God first—the first character listed in the Useful God data. Match specific directions, colors, and numbers to the elemental data.
[Health & Energy Management]
* Focus: Energy overload (strongest element) vs. Isolated elements.
* Data: Elements severely attacked (Clash) within the Saju or elements that are completely missing (thirst). Analyze vulnerable organs and the mechanism through which stress manifests in the body.
(Environmental factors that create a quantum jump in luck, such as directions, colors, habits, etc.)
(Health precautions due to elemental imbalance and energy management tips.)

09. The Next Chapter: Your 2026+ Level-up Roadmap 
* Focus: The intersection of Annual Luck and Great Luck (Daewoon) after 2026.
* Data: The flow of Heavenly Stems and Earthly Branches after 2026 (Year of the Fire Horse) + Analysis of the "Gyo-un-gi" when the current Daewoon changes. Pinpoint turning points in the life scenario and timing for level-ups.
(Confidence regarding the future peak period and the great changes ahead.)

And please, you need to include these 3 sentences for 'everyone'. Because we masked this and showed on the free report page to persuade customers to pay for the paid report. Fill in the blank (*** or ** or *********** this mark), matching to this customer's saju data and context. You can put these sentences anyway in 90 sentences, considering the context.
- The main theme of your 2026 is *** . Congratulations! But be careful of , as doesn't fit well with your lifestyle.
- he period from 20** to 20** is the best time to meet your spouse. Your spouse will probably be in charge of  and work as a ***.
- Are you actually ready to be rich? How about looking at it from this angle? *********** (explain in details)


OUTPUT JSON STRUCTURE - ABSOLUTELY CRITICAL:
You MUST return EXACTLY 9 sections with EXACTLY 10 cards each = 90 total cards.
DO NOT return fewer cards. The user PAID for 90 facts. Returning less is unacceptable.

[
  {
    "sectionNumber": "01",
    "sectionTitle": "The Core Aura: Your 4 Pillars Unlocked",
    "cards": [
      { "content": "First insight about their core energy..." },
      { "content": "Second insight about their personality..." },
      { "content": "Third insight..." },
      { "content": "Fourth insight..." },
      { "content": "Fifth insight..." },
      { "content": "Sixth insight..." },
      { "content": "Seventh insight..." },
      { "content": "Eighth insight..." },
      { "content": "Ninth insight..." },
      { "content": "Tenth insight..." }
    ]
  },
  ... (repeat this EXACT structure for all 9 sections, each with EXACTLY 10 cards)
]

MANDATORY REQUIREMENTS:
- EXACTLY 9 sections (numbered 01-09)
- EXACTLY 10 cards per section (no more, no less)
- TOTAL = 90 cards (this is non-negotiable)
- Each card's "content" field: Max 160 characters including spaces
- Be compact but meaningful - core insight only
- No need for title/theme per card
- Maintain Gen-Z tone, warmth, and practical advice

Return ONLY a valid JSON array of 90 fact objects. No markdown, no explanations outside the JSON.`

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. 결제 확인
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment required' }, { status: 403 })
    }

    // 2. 기존 유료 레포트 확인 (이미 생성된 경우 바로 반환)
    const { data: existingPaidReport } = await supabase
      .from('reports')
      .select('facts')
      .eq('submission_id', submissionId)
      .eq('is_free', false)
      .single()

    if (existingPaidReport?.facts) {
      console.log('[v0] Paid report already exists, returning cached version')
      return NextResponse.json({
        facts: existingPaidReport.facts,
        cached: true
      })
    }

    // 3. submission 데이터 조회 (사주 데이터)
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 4. 무료 레포트 조회 (9개 사실 + 1500자 해설)
    const { data: freeReport, error: freeReportError } = await supabase
      .from('reports')
      .select('facts, context_interpretation')
      .eq('submission_id', submissionId)
      .eq('is_free', true)
      .single()

    if (freeReportError || !freeReport) {
      return NextResponse.json({ error: 'Free report not found. Please generate free report first.' }, { status: 404 })
    }

    const freeFacts = freeReport.facts as Fact[]
    const contextInterpretation = freeReport.context_interpretation || ''

    console.log(`[v0] Generating 90 paid facts for ${submission.name}`)

    // 5. Gemini에 전체 context 주입
    const userPrompt = `
=== CUSTOMER SAJU DATA ===
Name: ${submission.name}
Gender: ${submission.gender}
Birth Date: ${submission.birth_date}
Birth Country: ${submission.birth_country}

Four Pillars (四柱):
${JSON.stringify(submission.saju_data, null, 2)}

=== 1500-CHARACTER INTERPRETATION (from Stage 1) ===
${contextInterpretation}

=== FREE 9 FACTS ALREADY PROVIDED (DO NOT REPEAT) ===
${JSON.stringify(freeFacts, null, 2)}

=== YOUR TASK ===
Based on all the context above, generate 90 NEW facts that:
1. Expand deeply on the themes introduced in the 9 free facts
2. Never contradict or repeat the free facts
3. Maintain narrative consistency with the established "Life Persona"
4. Cover all 9 premium themes (10 facts each)

Generate the 90 facts now as a JSON array.`

    // 6. Gemini API 호출 (temperature=0 for deterministic output)
    const { text: rawResponse } = await generateText({
      model: 'google/gemini-2.5-flash-preview-05-20',
      system: PAID_REPORT_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 16000,
      temperature: 0,
    })

    // 7. JSON 파싱
    let paidFacts: Fact[] = []
    try {
      // JSON 블록 추출 (```json ... ``` 형태일 수 있음)
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        paidFacts = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('[v0] Failed to parse Gemini response:', parseError)
      console.error('[v0] Raw response:', rawResponse.substring(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // 8. DB에 저장
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        submission_id: submissionId,
        payment_id: payment.id,
        section_key: 'paid_full',
        facts: paidFacts,
        is_free: false,
      })

    if (insertError) {
      console.error('[v0] Failed to save paid report:', insertError)
      // 저장 실패해도 응답은 반환 (사용자 경험 우선)
    }

    console.log(`[v0] Successfully generated ${paidFacts.length} paid facts for ${submission.name}`)

    return NextResponse.json({
      facts: paidFacts,
      cached: false,
    })

  } catch (error) {
    console.error('[v0] Generate paid report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
