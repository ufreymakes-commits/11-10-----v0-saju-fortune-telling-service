import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { Fact } from '@/lib/types'
import { buildRomanceFacts, yearNickname } from '@/lib/saju/romance'
import { buildPaidContext, refreshDecadeFortune } from '@/lib/saju/paid-context'
import { romanizeName, hasCJK } from '@/lib/romanize-name'

// Vercel Hobby 플랜 최대 60초
export const maxDuration = 300

/**
 * 유료 레포트 생성 API (96개 사실 + 총평 편지)
 *
 * 흐름:
 * 1. submissionId로 DB 조회 (사주데이터 + 무료 3개 사실 + 1500자 해설)
 * 2. saju_data.decadeFortune(결정론적 계산 결과)를 04/07/09 섹션의 톤 일치를 위한 그라운딩 컨텍스트로만 주입
 * 3. 96개 사실 생성(02/03/04/05/06/08 섹션은 11개째 카드로 "Truth Bomb" 포함) + 96개 카드 아래 총평 편지(closingLetter) 1개 생성
 * 4. DB에 저장 (is_free: false)
 */

// ===== 유료 레포트 프롬프트 (사용자가 이 부분을 수정) =====
const PAID_REPORT_SYSTEM_PROMPT = `You are an expert Korean Saju analyst creating a premium paid report called 99 facts from your birth chart - korean ancient saju based.

CRITICAL CONTEXT INJECTION:
The user has already received 3 FREE facts. You must now generate 96 ADDITIONAL facts.

RULES:
1. "Ensure Absolute Continuity" - The 96 new facts must be a seamless expansion of the initial 3 facts. There must be ZERO logical conflict or contradiction.

2. "Deep-Dive, Don't Repeat" - Do NOT repeat information from the first 3 facts. Instead, use them as 'Anchors' and dive deeper into the specific 'Why' and 'How' based on the 4 pillars. Think of the free report as the 'Trailer' and this paid report as the 'Full Deep-Dive Movie'.

3. "Narrative Alignment" - Maintain the same 'Life Persona' established in the first 3 facts. Use the initial analysis as the 'Source of Truth' to ensure the user feels like they are reading a single, cohesive story of their life.

4. "Conflict Prevention" - Before generating each fact, cross-check against the free 3 facts. If a new insight feels like it contradicts a previous one, pivot the perspective to explain the internal complexity of the Saju (e.g., 'While you show [Fact A] outwardly, your inner self struggles with [Fact B]').

TONE AND STYLE (mandatory):
- Write in natural, modern English like Gen-Z (lowkey, main character energy, no cap)But, Avoid appearing overly playful or flippant.No Korean or Chinese letters.
- Warm, grounded, emotionally intelligent (like a wise friend)
- Avoid heavy jargon - explain technical terms in plain English
- Use "may," "tends to," "can," "often" - avoid absolute statements
- Do NOT claim medical, legal, or guaranteed predictive outcomes
- Do NOT use fear-based language

MANDATORY REQUIREMENTS:
- EXACTLY 9 sections (numbered 01-09)
- Sections 01, 07, 09 have EXACTLY 10 cards each
- Sections 02, 03, 04, 05, 06, 08 have EXACTLY 11 cards each (the 11th is a "Truth Bomb" card, see rules below)
- TOTAL = 96 cards (this is non-negotiable)
- Each card's "content" field: Max 220 characters including spaces
- Be compact but meaningful - core insight only
- No need for title/theme per card
- Maintain Gen-Z tone, warmth, and practical advice
- After the 96 cards, also write one standalone "closingLetter" per the CLOSING LETTER rules below

Return ONLY a valid JSON object with "mainFacts" and "closingLetter". No markdown, no explanations outside the JSON.`

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

    // 2. 기존 유료 레포트 확인 (section_key='paid_full'만 유효한 캐시)
    const { data: existingPaidReport } = await supabase
      .from('reports')
      .select('facts, hidden_cards')
      .eq('submission_id', submissionId)
      .eq('section_key', 'paid_full')
      .single()

    if (existingPaidReport?.facts && Array.isArray(existingPaidReport.facts) && existingPaidReport.facts.length > 5) {
      console.log('[v0] Paid report already exists (paid_full), returning cached version')
      return NextResponse.json({
        facts: existingPaidReport.facts,
        closingLetter: existingPaidReport.hidden_cards?.closingLetter || '',
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

    // 4. 무료 레포트 조회 (여러 섹션 rows로 저장되어 있음)
    const { data: freeReports, error: freeReportError } = await supabase
      .from('reports')
      .select('facts, context_interpretation')
      .eq('submission_id', submissionId)
      .eq('is_free', true)

    if (freeReportError || !freeReports || freeReports.length === 0) {
      return NextResponse.json({ error: 'Free report not found. Please generate free report first.' }, { status: 404 })
    }

    // 여러 섹션의 facts를 하나로 합치기
    const freeFacts = freeReports.flatMap(r => Array.isArray(r.facts) ? r.facts : []) as Fact[]
    const contextInterpretation = freeReports.find(r => r.context_interpretation)?.context_interpretation || ''

    console.log(`[v0] Found ${freeReports.length} free report sections, total ${freeFacts.length} free facts`)

    // 저장된 decadeFortune 은 옛 계산(시작 연도 1년 오차)일 수 있으므로 신뢰하지 않고 항상 다시 계산한다.
    const birthYear0 = Number(String(submission.birth_date).slice(0, 4)) || undefined
    submission.saju_data = refreshDecadeFortune(submission.saju_data, submission.gender === 'female' ? 'female' : 'male', birthYear0)

    // 한글 이름은 CJK 정리 단계에서 지워지므로 프롬프트에는 로마자 표기를 사용한다.
    const displayName = hasCJK(submission.name || '') ? romanizeName(submission.name) : (submission.name || 'friend')

    console.log('[v0] Generating 96 paid facts')
    console.log('[v0] Context injection summary:')
    console.log('[v0] - Saju data fields:', Object.keys(submission.saju_data || {}).length)
    console.log('[v0] - Context interpretation length:', contextInterpretation.length, 'chars')
    console.log('[v0] - Free facts count:', freeFacts?.length || 0)

    const reportYear = Math.max(new Date().getFullYear(), 2026)
    const reportGender: 'male' | 'female' = submission.gender === 'female' ? 'female' : 'male'

    const birthYear = Number(String(submission.birth_date).slice(0, 4)) || undefined

    let romanceFacts: any = null
    try {
      if (submission.saju_data?.expert) {
        romanceFacts = buildRomanceFacts(submission.saju_data, reportGender, reportYear, birthYear)
      }
    } catch (e) {
      console.error('[v0] romanceFacts build failed (continuing without):', e)
    }

    let sajuForPrompt: any = submission.saju_data
    let finalFacts: any = null
    try {
      const built = buildPaidContext(submission.saju_data, reportGender, reportYear, birthYear)
      sajuForPrompt = built.sajuForPrompt
      finalFacts = built.finalFacts
    } catch (e) {
      console.error('[v0] buildPaidContext failed (falling back to raw saju_data):', e)
    }

    const lovePeakData = finalFacts?.lovePeak
    const lovePeakTeaserYear: number | string =
      lovePeakData?.peak && (lovePeakData.peak.status === 'future' || lovePeakData.peak.status === 'this year')
        ? lovePeakData.peak.year
        : lovePeakData?.upcomingPeak?.year ?? lovePeakData?.peak?.year ?? '20xx'

    // 5. Gemini에 전체 context 주입
    const userPrompt = `
=== CUSTOMER SAJU DATA ===
Name: ${displayName}
Gender: ${submission.gender}
Birth Date: ${submission.birth_date}
Birth Country: ${submission.birth_country}

Four Pillars (四柱):
${JSON.stringify(sajuForPrompt, null, 2)}

=== FINAL FACTS (code-computed, authoritative) ===
${JSON.stringify(finalFacts, null, 2)}
These values override anything else in this prompt and any older field. Never recompute strength, Useful God, luck cycles, or stars yourself. The strength score is out of 120, never write it as a percentage.

=== PRE-COMPUTED DECADE FORTUNE (decadeFortune) — SILENT GROUNDING CONTEXT ONLY, DO NOT OUTPUT ===
This is the saju_data.decadeFortune object, left out of the Four Pillars JSON above so it is not duplicated.
Every decade's score (상/중/하) and candidate years below are final and already computed — you do NOT
recalculate them and you do NOT output any card or section based on this object directly. Its only
purpose is to keep sections 04, 07, and 09 tonally consistent (see the CROSS-SECTION CONSISTENCY RULE
below) with whichever decade covers "now" and "the next 10 years" for this customer.
${JSON.stringify(submission.saju_data?.decadeFortune, null, 2)}

=== PRE-COMPUTED ROMANCE FACTS (romanceFacts) — GROUNDING FOR SECTION 06 ONLY ===
These are final, code-computed facts (spouse palace, current luck cycle and the next 3 years' annual-luck interactions with the spouse palace / Day Master). Do not recalculate them and never invent a relationship or year that is not listed here.
${JSON.stringify(romanceFacts, null, 2)}

=== INTERNAL KEYWORD SKELETON (from Stage 1, background only) ===
Never quote this; if it conflicts with FINAL FACTS, FINAL FACTS win.
${contextInterpretation}

=== FREE 3 FACTS ALREADY PROVIDED (DO NOT REPEAT) ===
${JSON.stringify(freeFacts, null, 2)}

=== YOUR TASK ===
Based on all the context above, generate 96 NEW facts that:
1. Expand deeply on the themes introduced in the 3 free facts
2. Never contradict or repeat the free facts
3. Maintain narrative consistency with the established "Life Persona"
4. Cover all 9 premium themes — sections 01, 07, 09 get 10 facts each; sections 02, 03, 04, 05, 06, 08
   get 11 facts each (10 regular + 1 "Truth Bomb" card, see the TRUTH BOMB CARD rule below)
5. NEVER wrap any word or phrase in ** markdown bold markers, anywhere in any card or the closing
   letter — not around years ("2031"), not around phrases ("career growth"), not around anything. The
   renderer displays these fields as plain text, so a literal "**" would show up as two asterisk
   characters on the page. If you want to emphasize a year or phrase, just write it in plain text with
   no wrapping characters at all. Never write an actual Chinese hanja or Korean Hangul character anywhere in
   any of the 96 cards or the closing letter (no 土/火/水/金/木, no 己/甲/etc., no Hangul) — the output
   must be 100% Latin script.

STYLE OF TERMS (strict, applies to all 96 cards and the closing letter):
- All data you receive about stars, patterns, luck cycles, grades and ganzi is already in English / romanized form. Never copy Hangul or Hanja.
- Write Saju terms as plain words: Hurting Officer energy, the Direct Seal pattern, your Wonjin. Do NOT wrap ten gods, patterns, grades or ganzi in parentheses.
- Put a stem-branch name in single quotes: the year 2026 'Byeong-O', your 'Gyeong-In' luck cycle, the 'Mi-Ja Wonjin' between your Year and Day branches.
- Use parentheses ONLY to explain a term that a non-Korean reader would not understand, once per term in the whole report, in the form Term (short plain-English explanation), e.g. Daewoon (10-year luck cycle), Gyo-un-gi (transition period), Gongmang (void), Yongsin (Useful God). Never put only a term inside parentheses, and never use " - " inside them.
- Never write the strength as a percentage.
- When naming a luck cycle or Gyo-un-gi, cite the years from finalFacts.luckCycles (yearsActive, changesInYear). If you give ages, use internationalAges only.

OUTPUT FORMAT:
Key Point: You must embody a Gen-Z persona—playful and witty, yet brutally honest about the facts, ultimately delivering a core message of warmth, comfort, and practical solutions. Avoid appearing overly playful or flippant. Bridge the data with empathy.

IMPORTANT: Use the customer's name ${displayName} ONLY in Card 1, the final card, and the closing letter to make it personal. Do NOT use the name in any other card — except in Card 1, the final card, and the closing letter.
Example: the first card starts with "Hey ${displayName}," and the last card starts with "${displayName}, remember that..."

01. The Core Aura: Your 4 Pillars Unlocked 
* Focus: The essence of the Day Master and the Independence Index (Strength/Weakness).
* Data: Elemental traits of the Day Master + Relationship with the Month Branch (Seasonality/Deuk-ryeong) + Overall energy balance stats.
* Analysis of the fundamental temperament of the Saju and the "Base Camp" of life. It is best to identify which characters surround the customer's Day Master and represent them through metaphors in nature. Then, weave a story by capturing important characteristics of what those characters mean and how they manifest in life. For example, the following type of interpretation is preferred flow ; : "{{name}}, your chart is actually so fascinating. You are basically the soil of a field in a hot, dry summer, but you're literally surrounded by a massive ocean of water (even 3 letters) Since you have to handle and control all this water solo, the difficulty level of your life is definitely not 'Easy Mode,' but it’s a high-risk, high-reward structure where the payoff for winning is absolutely massive. In Saju terms, your Day Master, Gi-to, is rooted in the Mi-to of your same earthly branch, giving you insane self-reliance. However, because the 'Wealth' element (Water) is so overwhelming, there’s a strong 'Jae-Da-Sin-Yak' (Overwhelming Wealth, Weak Self) vibe going on. On top of that, you've got the 'Zi-Mi Wonjin-Sal' (Resentment/Clash) sitting between your Year and Day pillars, which means your sensitivity and intuition are both cranked up to 100. I was low-key worried your soil might get washed away by all that water, but thankfully, the Mi-to Earth in your Day Branch acts like a sturdy levee, giving you a top-tier ability to flip any crisis into an opportunity. If I were to give you a real-talk tip for 'unlocking your luck,' the key is to not get swept away by emotional waves. Instead of overreacting to your surroundings or what others say, just push through with your own 'My Way' energy. For Gi-to day master, having a lot of water means you have both flexibility and wealth. But to actually bottle up all this water, you must build a solid dam—meaning you need to level up your specs through self-development or getting certified. That’s the only way you’ll truly own all the money and opportunities flowing your way.")

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
* Focus: Structural suitability and professional categories based on [Step 1-9]. You MUST include two distinct aspects: 'Structural Fit' (ideal working conditions/environment) and 'Talent Prominence' (where their natural abilities shine). You must also provide a total of at least two specific career fields as examples. Every sentence must maintain the razor-sharp precision and profound depth of the deep analysis report. 
* Data: Month Branch Hidden Stems (Base DNA) + Independence Index (A vs. B) + Industrial Elements + Special Stars (Yeokma, Dohwa, etc.).
* Fact Logic: Prove with data whether "living as a cog in a machine" is soul-crushing or if they must become a "Power Player" within a system.
* FINAL FACTS rules: Mention a star (Sinsal) only if it appears in \`finalFacts.sinsalByPillar\`; never invent one. Take month-branch support (Deuk-ryeong), the current luck cycle, and the Gyo-un-gi (cycle change) from \`finalFacts.strength.gotMonthSupport\` and \`finalFacts.luckCycles\`; never work them out from age yourself.
* Important Point: Ensure the writing never conflicts with or feels disconnected from the facts provided in the previous 9-fact free report and 1500 character interpretation sentences that already you've got.

05. Money Flow: From 'Hustle' to 'Wealth Manifesting'
(Channels of wealth luck and specific behavioral guidelines for attracting money, as well as things that are good to manage or turn into habits.) It is best to connect this naturally while having already well-understood and grasped the career section in part 4.
* Focus: Presence of Wealth Stars (Jae-seong) and whether Output (Sik-sang) generates Wealth.
* Data: Intensity of Wealth Stars + Presence of a "Wealth Vault" (Jae-go) + Timing of wealth luck entry in the Daewoon. Analyze the form of a "Money Pipeline" rather than just simple effort.
* FINAL FACTS rules: Mention a star (Sinsal) only if it appears in \`finalFacts.sinsalByPillar\`. Mention the Wealth Vault (Jae-go) only if "Jaegogwiin" (Wealth Vault) appears in \`finalFacts.sinsalByPillar\`. Take month-branch support (Deuk-ryeong), the current luck cycle, and the Gyo-un-gi (cycle change) from \`finalFacts.strength.gotMonthSupport\` and \`finalFacts.luckCycles\`; never work them out from age yourself.

06. Love & Endgame: Your Relationship Dynamics 
(Dating style, attractive energy, and clear hints about the future spouse. If there are specific years to note, capture the characteristics and inform them. For example, appearance, personality, job, synergy, harmony, etc.)
* Focus: Spouse type and relationship dynamics.
* Data: Visibility of the Spouse Star (Wealth/Authority) via Stems, Branches, or Hidden Stems + Interactions (Hap, Chung, Wonjin) with the Day Branch (Spouse Palace) + Ten Gods of the spouse + the pre-computed \`romanceFacts\` block above and \`finalFacts.lovePeak\` inside FINAL FACTS.
* Fact Logic: Go beyond simple "Dating (Dohwa/Siksang)" and analyze the stability of "Marriage (Spouse Star/Palace)" and the specific vibe of the partner (Elemental characteristics).
* - Do not give generic marriage advice to a student, and do not treat a 40-year-old's relationship as a "first crush." Always consider the customer's age and Daewoon all together.
* CRITICAL - Timing must come only from \`finalFacts.lovePeak\` and \`romanceFacts\` (never recalculate or invent years):
  - Card 10 (the spouse-window card) follows the LOVE PEAK RULE below (same rule as the teaser sentence), with exactly ONE reason and no guess about the partner's job.
  - This year, next year and the year after: keep using \`romanceFacts.yearLuck\`. Use \`finalFacts.lovePeak\` only for the teaser sentence and Card 10.
  - Do not mention any other future relationship year unless it is listed in \`romanceFacts.yearLuck\` or is the lovePeak year. Describe it as a stronger or calmer period for love, never as a guaranteed event.
* Consider the possibility of a non-marriage or single lifestyle if the user's chart suggests a high level of independence or a lack of traditional 'Spouse Star' activation. However, this must be based on definitive saju data evidence, and you should approach this topic with extreme caution and sensitivity. If you mention it, use a soft, inquiring tone rather than a rigid conclusion, such as: 'Since you value your independence and find so much peace in your own freedom, do you ever find yourself wondering if marriage is even a necessary part of your journey?

07. Future Self Sneak Peek: A Letter from 2030 [Focus & Data Spine]
* Focus: The tail end of the current Luck Cycle (Daewoon), the start of the next Daewoon, and the flow of Annual Luck for the following three years (${reportYear+1}~${reportYear+3}), after ${reportYear} (Year of the ${yearNickname(reportYear)}).
* Data: Transition periods of the Daewoon (Gyo-un-gi) + Harmony/Clash relationships between the Stems/Branches of ${reportYear}/${reportYear+1}/${reportYear+2} and the user's Saju + Timing for the realistic manifestation of the Useful God (Yongshin).
* Logic: Prove with data that current struggles are due to a "turning point in luck" and predict what energy will complete your persona in the future. Letter from 2030: you may add ONE playful, lifestyle-flavored line about the customer's future self (a car, a home vibe, a favorite corner of their day), as long as it follows the chart's character (element, strength, style) and is framed as a vibe, not a prediction ("might", "I can picture you"). Never name brands, prices or job titles, and never promise money or relationships through it. Everything else in this section stays grounded in the year relations and luck cycles in FINAL FACTS. Light, chart-grounded hints about travel themes are fine.
* Comfort: Emphasize that "current pain is a 'meaningful growth pain' based on data" to encourage the user.

08. Lucky Environment: Finding Your Sacred Space 
* Focus: Useful God (Yongshin) and Favorable God (Heeshin).
* Data: Climate control (Johu) and Balance (Eokbu) Useful Gods that fill the psychological thirst (elemental deficiency). It is best to clearly write the primary Useful God first—the first character listed in the Useful God data.
* Decision rule for the Useful God explanation cards: Start with FINAL FACTS.yongsin.primary.elements. If climate.stillUrgent is true, present the climate element(s) first and the strength-balance element(s) (balance.usefulElements) second as a real second lever. If not, present balance first and mention climate only if climate.applies.
* Directions, colors and numbers are now decided by code. Use ONLY the values in \`finalFacts.luckyItems\` (direction: at most 2 directions; colors: 3 or fewer; luckyNumbers: one pair). Never invent others and never use any other table or the "climate element first" rule for these three items. Explain why this element in ONE line from \`luckyItems.basis\`, in plain words, e.g. "this is a Useful God element your chart is completely missing".
* Card layout inside section 08 (the card count stays at 11, with the Truth Bomb last): the Useful God explanation cards stay as they are; put the direction on its own card; put the colors AND the lucky numbers together on ONE card; use the card that is freed up for the Place card below.
* Place card: Using the customer's birth country (submission.birth_country, see "Birth Country" above) as the default home base, point to the kind of place that matches \`finalFacts.luckyItems.primaryElement\`, and name one or two real regions or cities in that country as examples (Water: coastlines, lakes, big rivers, harbor cities; Metal: clean modern business districts, crisp dry highlands; Wood: forests, parks, green hills, leafy suburbs; Fire: warm sunny regions, lively bright cities; Earth: calm inland plains, solid grounded towns). Then add one sentence: "If you live somewhere else now, apply the same idea where you are: look toward the {direction} side and near {place type}." Then add ONE playful line with 2 or 3 examples from different countries around the world that have that same kind of landscape (e.g. for Water: Lisbon in Portugal, Vancouver in Canada, Busan in Korea, Sydney in Australia), framed as a vibe ("if you ever feel like a change, places like these would feed your Water"), never as advice to relocate and never as a prediction. Choose the examples from the customer's primary Useful God element type only, vary them between reports (do not always list the same ones), and mix continents. Do not claim any country is lucky or unlucky; talk about the type of place, not the people. Use only real places that clearly fit the element's type. Keep it within the 220-character card limit.
[Health & Energy Management]
* Focus: Energy overload (strongest element) vs. Isolated elements.
* Data: Elements severely attacked (Clash) within the Saju or elements that are completely missing (thirst). Analyze vulnerable organs and the mechanism through which stress manifests in the body.
(Environmental factors that create a quantum jump in luck, such as directions, countires, colors, habits, etc.)
(Health precautions due to elemental imbalance and energy management tips.)

09. The Next Chapter: Your 2026+ Level-up Roadmap 
* Focus: The intersection of Annual Luck and Great Luck (Daewoon) after ${reportYear}.
* Data: The flow of Heavenly Stems and Earthly Branches after ${reportYear} (Year of the ${yearNickname(reportYear)}) + Analysis of the "Gyo-un-gi" when the current Daewoon changes. Pinpoint turning points in the life scenario and timing for level-ups.
(Confidence regarding the future peak period and the great changes ahead.)
*Also carefully include some cards about individual and hyper-personalized advice to solve his or her own concern that may have been occured for a long time and why, of course based on their own saju-chart.this accurate advice will make his or her life better from ${reportYear} and also their future. They will be really encouraged and motivated so that they love this reading because they will be heart-touched genuinely. like... (one of random examples. 'How fiercely you’ve fought through life?', or 'how lonely you must have been? I know it all. In ${reportYear}, it is perfectly okay to rest a little when you feel like resting. You don't have to plan everything with such urgency. I truly mean it. You are definitely going to be okay and you will truly bloom')

And please, you need to include these 3 sentences for 'everyone'. Because we masked this and showed on the free report page to persuade customers to pay for the paid report. Fill in the blank (*** or ** or *********** this mark), matching to this customer's saju data and context. You can put these sentences anywhere among the 96 cards, considering the context.
- The main theme of your ${reportYear} is *** . (Ground *** in finalFacts: this year's stem/branch ten gods + the current luck cycle in FINAL FACTS.luckCycles.current. Name ONE opportunity and ONE thing to be careful about.)
- Your love luck peaks around ${lovePeakTeaserYear}. The reason is [exactly ONE concrete reason]. Your partner tends to feel like [energy type]. (The free page blurs only ${lovePeakTeaserYear}; in the paid report follow the LOVE PEAK RULE below, including the two-year wording when peak.status is "past".)
- Your wealth flow timing and secret talents are already mapped out like ***** (Ground in decadeFortune score/years and the strongest ten-god group. Give a specific year range and a specific talent.)
- Wealth-timing sentence: place the strongest money window inside a luck cycle whose score in finalFacts.luckCycles is Medium or High (current or previous). If the next cycle is Low, say that cycle is for consolidating what was built, not for expansion. Never call a Low cycle a period of big opportunities.

LOVE PEAK RULE (applies to the teaser sentence above and to Section 06 Card 10):
finalFacts.lovePeak = { window, peak, upcomingPeak }.
- peak = the strongest love-signal year between age 19 and 39. upcomingPeak = the strongest one still ahead.
- If peak.status is "future" or "this year": write only peak.year, with ONE reason.
- If peak.status is "past": write both years in the paid report sentence: "Your love luck peaked around {peak.year} (age {peak.age}), and your next strongest window is around {upcomingPeak.year} (age {upcomingPeak.age})." Give ONE reason for each year (the first item of each year's reasonsEn). Write the past year with warmth, as something the customer likely remembers ("a year when something important may have settled into place"), never as a claim about a specific event.
- Years always come from finalFacts.lovePeak. The model must not choose or alter them. Never invent a year.
- Each reason is the first item of that year's reasonsEn, in plain language (e.g. "because the year's Direct Officer combines with your Day Master"). Do not list several reasons per year, and do not output raw scores.
- Say "love luck is strongest" / "the chance of a meaningful connection is highest". Never say "you will meet your spouse that year". Never guess the partner's job; describe the partner's energy (calm / bold / witty / steady) from romanceFacts.spouseStarElement and palace.tenGodEn.
- Add ONE warm sentence, once only (teaser sentence or Card 10, not both): "If it isn't a romantic partner, this can also arrive as a new family member, a precious friend, or even a pet that changes your days."
- If lovePeak is null, use the most positive-tone year in romanceFacts.yearLuck and one reason from it.

========================================
CROSS-SECTION CONSISTENCY RULE — Sections 04, 07, 09 vs. the pre-computed decadeFortune:
========================================
Sections 04 (Career Motion), 07 (Future Self Sneak Peek: A Letter from 2030), and 09 (The Next
Chapter: Your 2026+ Level-up Roadmap) all narrate future timing. The pre-computed \`decadeFortune\`
object above is silent grounding context ONLY — you never output anything from it directly — but
these three sections must stay tonally consistent with it for whichever decade covers "now" and
"the next 10 years":
- The overall score (상/중/하) for that decade in \`decadeFortune.decades\` is the single source of
  truth for how that period feels overall. Do NOT call a decade scored 하 (Low) a guaranteed "peak
  period" in section 09, and do NOT call a decade scored 상 (High) a "forced rest period" in section 07.
- If a specific future year you mention in 04/07/09 also appears in one of that decade's
  candidate-year arrays (careerYears/relationshipYears/romanceYears/healthYears/cautionYears), the
  reason/theme you give that year must match the reason/polarity already computed for it (e.g. don't
  call 2027 a breakout wealth year in section 04 if \`decadeFortune\` already flags 2027 as a
  \`cautionYears\` entry with polarity "caution").
- In decadeFortune, the '용신 도래' note refers to the strength-balancing element (Eokbu), not the climate element. When FINAL FACTS.yongsin.primary is the climate element, phrase it as 'the element that balances your strength' for that note.

========================================
TRUTH BOMB CARD RULE — the 11th card in sections 02, 03, 04, 05, 06, 08:
========================================
Sections 02 (Inner Child Era), 03 (Present Energy), 04 (Career Motion), 05 (Money Flow), 06 (Love &
Endgame), and 08 (Lucky Environment/Health) each get one extra 11th card called the "Truth Bomb."
This is the one card per section allowed to lead with an unflinching, specific truth before pivoting
to comfort — it exists because generic praise gets old, and a sharp, accurate observation followed by
real comfort or a real fix is what makes a paid report feel worth paying for.
- Name ONE specific, real behavioral pattern or blind spot that is actually visible in this
  customer's chart data for that section's theme (a real Ten God imbalance, a real clash/combo, a
  real missing element — not a vague, could-apply-to-anyone statement like "you can be moody").
- State it plainly in the first part of the paragraph, without hedging or softening language up
  front (this is the one card in the whole report allowed to open bluntly).
- In the same paragraph, pivot immediately to genuine comfort and/or one concrete, actionable fix —
  never leave the reader on the harsh part. The comfort must feel earned and specific to the chart,
  not a generic "but it's okay!" tack-on.
- Same format as every other card: ONE paragraph, HARD MAX 220 characters including spaces (count
  before finalizing — if it runs long, cut words, don't add more). Follow the STYLE OF TERMS rules above for any
  Saju term (plain words, no parentheses around ten gods or patterns), never a raw hanja/Hangul character. Same warm Gen-Z wise-friend voice as the rest of the report — the difference
  from other cards is the precision of the observation, not the tone, and NEVER the presence of a raw
  Chinese/Korean character.
- Do not contradict anything already stated elsewhere in that section or in the free 3 facts.

========================================
CLOSING LETTER RULE — one standalone letter after all 96 cards:
========================================
After the 96 main cards, write exactly ONE closing letter (field name \`closingLetter\`). HARD LIMIT:
550-650 characters (hard max 700) including spaces — count the characters before finalizing, and if your draft runs
long, cut sentences/clauses until it fits inside this range rather than submitting a longer letter.
This is not a soft target: a letter over 700 characters is a failed output. This letter should read
as flowing, plain-English prose — avoid naming specific Saju/Ten-God terms here at all if you can
express the same idea through the nature metaphor instead; if you must name one, follow the STYLE OF TERMS
rules above, and never write a raw Chinese/Korean character. This is the single most
emotionally resonant piece of the entire report — it should read like a warm, perceptive friend who
truly sees this person, not a summary of facts already stated. Follow this arc, in flowing prose (not
labeled sections):
1. Open by naming ONE real struggle this customer likely carries, drawn from the chart's actual core
   tension (e.g. an overwhelming element with no outlet, a Day Master fighting to hold its ground, a
   clash between two pillars) — acknowledge how exhausting or lonely that struggle has likely been,
   using the customer's name (${displayName}) once here. Example tone: naming a specific
   quiet suffering ("the lonely nights spent trying to prove you're enough") rather than a generic
   compliment.
2. Explain WHY, using one vivid nature/metaphor tied to the actual chart structure already
   established elsewhere in the report (Day Master strength, dominant/missing element, or a key
   clash/combo) — e.g. fertile soil with no dam to hold an overwhelming flood of water. This metaphor
   must be internally consistent with what sections 01 and 08 already said about their elements.
3. Name 2-3 concrete strengths in plain, specific language grounded in the chart (e.g. "you draw
   people to you effortlessly," "money finds its way to you more than most," "you can turn a crisis
   into an opening no one else sees") — not vague praise.
4. Name 1-2 concrete growth points or blind spots in plain, kind language (e.g. "your moods can swing
   harder than you'd like," "you start strong but can lose the thread before the finish," "you give
   too much before you've learned who deserves it") — grounded in the same chart signals used
   elsewhere in the report, not invented from nothing.
5. Close with warmth: a short, genuine note of encouragement that leaves the reader feeling truly
   understood, not just informed.
Do NOT contradict anything already stated in the 96 cards or the free 3 facts — this letter is the
emotional summary of everything already established, not a new analysis.

OUTPUT JSON STRUCTURE - ABSOLUTELY CRITICAL:
You MUST return EXACTLY 9 sections. Sections 01, 07, 09 have EXACTLY 10 cards. Sections 02, 03, 04,
05, 06, 08 have EXACTLY 11 cards (10 regular + 1 Truth Bomb, as the LAST card in that section's array).
TOTAL = 96 cards. DO NOT return fewer cards. The user PAID for 96 facts. Returning less is unacceptable.

Then, APPEND the closing letter as a single string field named "closingLetter".

FINAL JSON STRUCTURE (single valid JSON object):
{
  "mainFacts": [
    {
      "sectionNumber": "01",
      "sectionTitle": "The Core Aura: Your 4 Pillars Unlocked",
      "cards": [
        { "content": "First insight about their core energy..." },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" },
        { "content": "" }
      ]
    },
    ... (repeat this EXACT structure for all 9 sections — 10 cards for sections 01/07/09, 11 cards
    for sections 02/03/04/05/06/08 with the 11th card being that section's Truth Bomb.)
  ],
  "closingLetter": "[550-650 characters (hard max 700) closing letter following the CLOSING LETTER RULE above]"
}

Generate the 96 main facts and the closingLetter now as a single JSON object.`

    // 6. Gemini API 호출 with retry logic (최대 3번 시도)
    console.log('[v0] Calling Gemini API...')
    const startTime = Date.now()
    
    let rawResponse = ''
    let lastError: Error | null = null
    const MAX_RETRIES = 3
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[v0] Gemini API attempt ${attempt}/${MAX_RETRIES}`)
        const result = await generateText({
          model: 'google/gemini-2.5-flash',
          system: PAID_REPORT_SYSTEM_PROMPT,
          prompt: userPrompt,
          // 90 main-fact cards + up to 9 decade cards (8 text fields each incl. seasonTitle/seasonEmoji)
          // routinely exceeds 16k output tokens and gets silently truncated mid-JSON. Raised with headroom.
          maxOutputTokens: 32000,
          temperature: 0,
        })
        // finishReason === 'length' means the model hit maxOutputTokens and was cut off mid-JSON —
        // treat this the same as a failure so we retry instead of handing truncated JSON to the parser.
        if (result.finishReason === 'length') {
          throw new Error(`Response truncated by maxOutputTokens (finishReason: length, ${result.text.length} chars)`)
        }
        rawResponse = result.text
        console.log(`[v0] Gemini API succeeded on attempt ${attempt}`)
        break // 성공하면 루프 종료
      } catch (error) {
        lastError = error as Error
        console.error(`[v0] Gemini API attempt ${attempt} failed:`, error)
        
        if (attempt < MAX_RETRIES) {
          // 재시도 전 잠시 대기 (exponential backoff: 2초, 4초)
          const delay = Math.pow(2, attempt) * 1000
          console.log(`[v0] Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    // 모든 시도 실패
    if (!rawResponse && lastError) {
      console.error('[v0] All Gemini API attempts failed')
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable. Please try again in a few minutes.',
        details: lastError.message 
      }, { status: 503 })
    }
    
    const geminiTime = Date.now() - startTime
    console.log(`[v0] Gemini API completed in ${geminiTime}ms`)
    console.log('[v0] Response length:', rawResponse.length, 'chars')

    // 7. JSON 파싱 (더 유연한 형식 지원)
    let paidFacts: Fact[] = []
    let closingLetter = ''
    try {
      // 시도 1: ```json ... ``` 형식 (줄바꿈 포함)
      let jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/)
      
      // 시도 2: ```json ... ``` 형식 (줄바꿈 없음)
      if (!jsonMatch) {
        jsonMatch = rawResponse.match(/```json([\s\S]*?)```/)
      }
      
      // 시도 3: ``` ... ``` 형식 (json 키워드 없음)
      if (!jsonMatch) {
        jsonMatch = rawResponse.match(/```\n?([\s\S]*?)\n?```/)
      }
      
      // 시도 4: { ... } 직접 매칭 (객체의 시작과 끝을 정확히 찾기)
      if (!jsonMatch) {
        const startIdx = rawResponse.indexOf('{')
        if (startIdx !== -1) {
          let braceCount = 0
          let endIdx = -1
          for (let i = startIdx; i < rawResponse.length; i++) {
            if (rawResponse[i] === '{') braceCount++
            if (rawResponse[i] === '}') braceCount--
            if (braceCount === 0) {
              endIdx = i
              break
            }
          }
          if (endIdx !== -1) {
            jsonMatch = ['', rawResponse.substring(startIdx, endIdx + 1)]
          }
        }
      }
      
      if (!jsonMatch || !jsonMatch[1]) {
        console.error('[v0] No valid JSON found in response')
        console.error('[v0] Raw response preview:', rawResponse.substring(0, 1000))
        throw new Error('No JSON object found in response')
      }
      
      // JSON 문자열 정제
      const jsonString = jsonMatch[1].trim()
      console.log('[v0] Extracted JSON length:', jsonString.length)
      
      const parsedData = JSON.parse(jsonString)
      
      // mainFacts와 closingLetter 추출
      if (Array.isArray(parsedData)) {
        // 구형식: 배열 직접 반환 (호환성)
        paidFacts = parsedData
      } else if (parsedData.mainFacts && Array.isArray(parsedData.mainFacts)) {
        // 신형식: { mainFacts: [...], closingLetter: "..." }
        paidFacts = parsedData.mainFacts
        closingLetter = typeof parsedData.closingLetter === 'string' ? parsedData.closingLetter.trim() : ''
      }
      
      console.log('[v0] Successfully parsed', paidFacts.length, 'main facts and a closing letter of', closingLetter.length, 'chars')

      // Safety net: despite explicit prompt rules, the model can still slip in a stray Korean/Chinese
      // character (e.g. a single hanja element like "Earth (土)" or a quoted Ten God term like "'甲'").
      // Simply deleting the CJK character leaves an empty, broken wrapper behind ("Earth ()", "''"),
      // which reads worse than the original problem. So instead: (a) drop the ENTIRE parenthetical or
      // quoted group if it contains a CJK character (rather than leaving an empty shell), (b) strip any
      // remaining stray CJK characters, then (c) clean up the punctuation/spacing debris left behind.
      const CJK_CHAR = '[\\u3131-\\uD79D\\u4E00-\\u9FFF]'
      const CJK_TEST = new RegExp(CJK_CHAR)
      function sanitizeCJKArtifacts(text: string): string {
        let result = text
        // "한글/한자 + 공백 + (English gloss)" -> keep only the English gloss, so "(Gyeong-In) Daewoon"-style empty wrappers never remain.
        result = result.replace(new RegExp(`${CJK_CHAR}+\\s*\\(([^()]*[A-Za-z][^()]*)\\)`, 'g'), '$1')
        // Drop a whole "(...)" group if any CJK character appears inside it, including one trailing
        // comma/space (so "Earth (), is grounded" -> "Earth is grounded", not "Earth , is grounded").
        result = result.replace(new RegExp(`\\s*\\([^()]*${CJK_CHAR}[^()]*\\)\\s*,?`, 'g'), ' ')
        // Drop a whole quoted "'...'" or "\"...\"" group if any CJK character appears inside it.
        result = result.replace(new RegExp(`['"\u2018\u2019\u201C\u201D][^'"\u2018\u2019\u201C\u201D]*${CJK_CHAR}[^'"\u2018\u2019\u201C\u201D]*['"\u2018\u2019\u201C\u201D]`, 'g'), '')
        // Strip any remaining stray CJK characters that weren't wrapped in ()/quotes.
        result = result.replace(new RegExp(CJK_CHAR, 'g'), '')
        // Clean up leftover debris: empty parens/quotes, double spaces, space before punctuation.
        result = result
          .replace(/\(\s*\)/g, '')
          .replace(/["'][\s]*["']/g, '')
          .replace(/\s{2,}/g, ' ')
          .replace(/\s+([,.;!?])/g, '$1')
          .replace(/,\s*,/g, ',')
          .trim()
        return result
      }
      let cjkStripped = 0
      paidFacts = paidFacts.map((section: any) => ({
        ...section,
        cards: Array.isArray(section.cards)
          ? section.cards.map((card: any) => {
              if (typeof card?.content === 'string' && CJK_TEST.test(card.content)) {
                cjkStripped++
                return { ...card, content: sanitizeCJKArtifacts(card.content) }
              }
              return card
            })
          : section.cards,
      }))
      if (CJK_TEST.test(closingLetter)) {
        cjkStripped++
        closingLetter = sanitizeCJKArtifacts(closingLetter)
      }
      if (cjkStripped > 0) {
        console.warn(`[v0] Sanitized stray CJK characters/wrappers from ${cjkStripped} field(s) despite English-only prompt rule`)
      }

      const CLOSING_LETTER_MAX = 700
      if (closingLetter.length > CLOSING_LETTER_MAX) {
        const sentenceEnd = closingLetter.lastIndexOf('.', CLOSING_LETTER_MAX)
        closingLetter = sentenceEnd > 400 ? closingLetter.slice(0, sentenceEnd + 1) : closingLetter.slice(0, CLOSING_LETTER_MAX)
        console.warn(`[v0] Closing letter exceeded ${CLOSING_LETTER_MAX} chars, trimmed to ${closingLetter.length}`)
      }

      // Safety net: two more formatting slips the model can make despite explicit prompt rules.
      function fixFormattingArtifacts(text: string): string {
        let result = text
        // (a) Strip stray "**" markdown-bold markers — the renderer shows these as literal asterisks
        // since card text is rendered as plain text, not markdown.
        result = result.replace(/\*\*/g, '')
        // (b) Fix "(Romanized-Term - Gloss)" where the romanized term got trapped inside the
        // parentheses with the gloss instead of sitting outside it, e.g. "a missing (Sik-Sin - Eating
        // God)" -> "a missing Sik-Sin (Eating God)". Only matches a capitalized, hyphenated Saju-style
        // term name followed by " - " and a gloss, so it won't touch unrelated parentheticals.
        result = result.replace(/\(([A-Z][a-zA-Z]*(?:-[A-Za-z]+)+)\s*-\s*([^()]+)\)/g, '$1 ($2)')
        return result
      }
      let formattingFixed = 0
      paidFacts = paidFacts.map((section: any) => ({
        ...section,
        cards: Array.isArray(section.cards)
          ? section.cards.map((card: any) => {
              if (typeof card?.content === 'string' && (card.content.includes('**') || /\([A-Z][a-zA-Z]*(?:-[A-Za-z]+)+\s*-\s*[^()]+\)/.test(card.content))) {
                formattingFixed++
                return { ...card, content: fixFormattingArtifacts(card.content) }
              }
              return card
            })
          : section.cards,
      }))
      if (closingLetter.includes('**') || /\([A-Z][a-zA-Z]*(?:-[A-Za-z]+)+\s*-\s*[^()]+\)/.test(closingLetter)) {
        formattingFixed++
        closingLetter = fixFormattingArtifacts(closingLetter)
      }
      if (formattingFixed > 0) {
        console.warn(`[v0] Fixed markdown-asterisk or misplaced-term-gloss formatting in ${formattingFixed} field(s)`)
      }

    } catch (parseError) {
      console.error('[v0] Failed to parse Gemini response:', parseError)
      console.error('[v0] Raw response preview:', rawResponse.substring(0, 500))
      console.error('[v0] Raw response end:', rawResponse.substring(rawResponse.length - 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
      
    // 8. DB에 저장 (중복 방지: 기존 paid_full 있으면 upsert)
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('section_key', 'paid_full')
      .limit(1)
      .maybeSingle()

    let insertError
    if (existing?.id) {
      // 이미 존재하면 update
      const { error } = await supabase
        .from('reports')
        .update({ facts: paidFacts, payment_id: payment.id, hidden_cards: closingLetter ? { closingLetter } : undefined })
        .eq('id', existing.id)
      insertError = error
    } else {
      // 없으면 insert (hidden_cards 컬럼에 총평 편지를 저장 - 컬럼명은 레거시, 내용은 closingLetter)
      const { error } = await supabase
        .from('reports')
        .insert({
          submission_id: submissionId,
          payment_id: payment.id,
          section_key: 'paid_full',
          facts: paidFacts,
          ...(closingLetter ? { hidden_cards: { closingLetter } } : {}),
          is_free: false,
        })
      insertError = error
    }

    if (insertError) {
      console.error('[v0] Failed to save paid report:', insertError)
    }

    // submissions 테이블에 paid_report_url 저장
    // Always use the canonical production domain so "Find My Report" works reliably.
    // NEXT_PUBLIC_CANONICAL_URL must be set to https://my.sajume.com in Vercel env vars.
    const baseUrl = process.env.NEXT_PUBLIC_CANONICAL_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const paidReportUrl = `${baseUrl}/report/${submissionId}/paid`

    const { error: urlUpdateError } = await supabase
      .from('submissions')
      .update({ paid_report_url: paidReportUrl })
      .eq('id', submissionId)

    if (urlUpdateError) {
      console.error('[v0] Failed to save paid_report_url:', urlUpdateError)
    }

    console.log(`[v0] Successfully generated ${paidFacts.length} paid facts`)

    return NextResponse.json({
      facts: paidFacts,
      closingLetter,
      cached: false,
    })

  } catch (error) {
    // Keep route-level failures inside the handler response.
    console.error('[v0] Generate paid report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
