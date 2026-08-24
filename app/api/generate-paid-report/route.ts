import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { Fact } from '@/lib/types'
import { calculateDecadeFortune } from '@/lib/saju/decade-fortune'

// Vercel Hobby 플랜 최대 60초
export const maxDuration = 300

/**
 * 유료 레포트 생성 API (90개 사실 + 대운 하이라이트 연도 카드)
 *
 * 흐름:
 * 1. submissionId로 DB 조회 (사주데이터 + 무료 3개 사실 + 1500자 해설)
 * 2. saju_data.decadeFortune(결정론적 계산 결과)와 모든 context를 Gemini에 주입
 * 3. 90개 사실 생성 + decadeFortune의 대운(10년)마다 6개 카테고리 문단 생성 (AI는 점수/연도를 재계산하지 않음)
 * 4. DB에 저장 (is_free: false)
 */

// ===== 유료 레포트 프롬프트 (사용자가 이 부분을 수정) =====
const PAID_REPORT_SYSTEM_PROMPT = `You are an expert Korean Saju analyst creating a premium paid report called 99 facts from your birth chart - korean ancient saju based.

CRITICAL CONTEXT INJECTION:
The user has already received 3 FREE facts. You must now generate 90 ADDITIONAL facts.

RULES:
1. "Ensure Absolute Continuity" - The 90 new facts must be a seamless expansion of the initial 3 facts. There must be ZERO logical conflict or contradiction.

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
- EXACTLY 10 cards per section (no more, no less)
- TOTAL = 90 cards (this is non-negotiable)
- Each card's "content" field: Max 220 characters including spaces
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

    // 2. 기존 유료 레포트 확인 (section_key='paid_full'만 유효한 캐시)
    const { data: existingPaidReport } = await supabase
      .from('reports')
      .select('facts')
      .eq('submission_id', submissionId)
      .eq('section_key', 'paid_full')
      .single()

    if (existingPaidReport?.facts && Array.isArray(existingPaidReport.facts) && existingPaidReport.facts.length > 5) {
      console.log('[v0] Paid report already exists (paid_full), returning cached version')
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

    // 레거시 submission 호환: saju_data에 decadeFortune이 없으면(구버전 계산 결과) 즉석으로 계산해 채워 넣는다.
    // 새 submission은 calculateSaju()가 이미 decadeFortune을 포함해 저장하므로 이 분기를 타지 않는다.
    if (submission.saju_data && !submission.saju_data.decadeFortune) {
      try {
        const sd = submission.saju_data
        // pillar.stem/branch는 한자로 저장되어 있으므로, decade-fortune.ts가 요구하는 한글 간지는
        // fullNameKorean(예: "갑자")에서 분리해 사용한다.
        const dayKorean = sd.dayPillar?.fullNameKorean || ''
        const monthKorean = sd.monthPillar?.fullNameKorean || ''
        const yearKorean = sd.yearPillar?.fullNameKorean || ''
        const hourKorean = sd.hourPillar?.fullNameKorean || ''
        const dayStem = dayKorean.charAt(0)
        const dayBranch = dayKorean.charAt(1)
        const monthBranch = monthKorean.charAt(1)
        const yearBranch = yearKorean.charAt(1)
        const hourBranch = hourKorean.charAt(1) || null
        const birthYear = new Date(submission.birth_date).getFullYear()
        if (dayStem && dayBranch && monthBranch && yearBranch && Array.isArray(sd.daewoon) && sd.sinGangSinYak) {
          submission.saju_data = {
            ...sd,
            decadeFortune: calculateDecadeFortune({
              gender: submission.gender === 'female' ? 'female' : 'male',
              dayStem,
              dayBranch,
              monthBranch,
              yearBranch,
              hourBranch,
              birthYear,
              isDayMasterStrong: sd.sinGangSinYak.ratio >= 50,
              daewoon: sd.daewoon
            })
          }
          console.log('[v0] Computed decadeFortune on the fly for legacy submission')
        }
      } catch (fallbackError) {
        console.error('[v0] Failed to compute fallback decadeFortune:', fallbackError)
      }
    }

    console.log(`[v0] Generating 90 paid facts for ${submission.name}`)
    console.log('[v0] Context injection summary:')
    console.log('[v0] - Saju data fields:', Object.keys(submission.saju_data || {}).length)
    console.log('[v0] - Context interpretation length:', contextInterpretation.length, 'chars')
    console.log('[v0] - Free facts count:', freeFacts?.length || 0)

    // 5. Gemini에 전체 context 주입
    const userPrompt = `
=== CUSTOMER SAJU DATA ===
Name: ${submission.name}
Gender: ${submission.gender}
Birth Date: ${submission.birth_date}
Birth Country: ${submission.birth_country}

Four Pillars (四柱):
${JSON.stringify(submission.saju_data, null, 2)}

=== PRE-COMPUTED DECADE FORTUNE (decadeFortune) — DO NOT RECALCULATE ===
This is the exact same object as saju_data.decadeFortune above, isolated here so you don't miss it.
Every decade's score and every category's candidate years below are final. Your only task for this
object is to write ONE set of 6 category paragraphs PER DECADE (not per year) following the Mapping Rules.
${JSON.stringify(submission.saju_data?.decadeFortune, null, 2)}

=== 1500-CHARACTER INTERPRETATION (from Stage 1) ===
${contextInterpretation}

=== FREE 3 FACTS ALREADY PROVIDED (DO NOT REPEAT) ===
${JSON.stringify(freeFacts, null, 2)}

=== YOUR TASK ===
Based on all the context above, generate 90 NEW facts that:
1. Expand deeply on the themes introduced in the 3 free facts
2. Never contradict or repeat the free facts
3. Maintain narrative consistency with the established "Life Persona"
4. Cover all 9 premium themes (10 facts each)
5. Don't use ** this mark or Chinese letter and Korean Letter. Use only English.

OUTPUT FORMAT:
Key Point: You must embody a Gen-Z persona—playful and witty, yet brutally honest about the facts, ultimately delivering a core message of warmth, comfort, and practical solutions. Avoid appearing overly playful or flippant. Bridge the data with empathy.

IMPORTANT: Use the customer's name ${submission.name} ONLY in the FIRST sentence (id: 1) and the LAST sentence (id: 99) to make it personal. Do NOT use the name in any other sentences.
Example: "${submission.name},...", for the first fact and, ${submission.name}, remember that..." for the last fact.

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
* Important Point: Ensure the writing never conflicts with or feels disconnected from the facts provided in the previous 9-fact free report and 1500 character interpretation sentences that already you've got.

05. Money Flow: From 'Hustle' to 'Wealth Manifesting'
(Channels of wealth luck and specific behavioral guidelines for attracting money, as well as things that are good to manage or turn into habits.) It is best to connect this naturally while having already well-understood and grasped the career section in part 4.
* Focus: Presence of Wealth Stars (Jae-seong) and whether Output (Sik-sang) generates Wealth.
* Data: Intensity of Wealth Stars + Presence of a "Wealth Vault" (Jae-go) + Timing of wealth luck entry in the Daewoon. Analyze the form of a "Money Pipeline" rather than just simple effort.

06. Love & Endgame: Your Relationship Dynamics 
(Dating style, attractive energy, and clear hints about the future spouse. If there are specific years to note, capture the characteristics and inform them. For example, appearance, personality, job, synergy, harmony, etc.)
* Focus: Spouse type and relationship dynamics.
* Data: Visibility of the Spouse Star (Wealth/Authority) via Stems, Branches, or Hidden Stems + Interactions (Hap, Chung, Wonjin) with the Day Branch (Spouse Palace) + Ten Gods of the spouse + the pre-computed \`marriageTiming\` object inside \`saju_data\` (category, bestMeetingYear, bestMarriageYear, pastBestMeetingYear, pastBestMarriageYear, candidates, windowNote).
* Fact Logic: Go beyond simple "Dating (Dohwa/Siksang)" and analyze the stability of "Marriage (Spouse Star/Palace)" and the specific vibe of the partner (Elemental characteristics).
* - Do not give generic marriage advice to a student, and do not treat a 40-year-old's relationship as a "first crush." Always consider the customer's age and Daewoon all together.
* CRITICAL - Timing must come only from \`marriageTiming\` (never recalculate or invent new years):
  - **Future timing (2026 and beyond only) — FIXED SELECTION ORDER, do not pick freely:** If \`bestMeetingYear\` exists, it is always the primary pivotal year to call out first — never substitute a different \`candidates\` year for it. If \`bestMarriageYear\` also exists AND its year is different from \`bestMeetingYear\`'s year, mention it second as a distinct moment. If \`bestMeetingYear\` is null but \`bestMarriageYear\` exists, use \`bestMarriageYear\` as the primary one instead. Only fall back to the highest-scored \`isPast: false\` entry in \`candidates\` if both are null. Do not swap this order or choose a different year across regenerations — the same submission's data must always surface the same future year(s) here. Explain "Why" using the \`signals\` already computed (spouse star visibility, Day Branch hap/chung, etc.). Never mention a future year that isn't present in this data.
  - **If the strongest future signal is not marriage-grade** (e.g. category is "무자"/"과다", or the top future candidate's signals are dating-type signals like Dohwa/Siksang rather than an actual spouse-star activation, or \`bestMarriageYear\` is null): explicitly say so, and reinterpret what that year's energy is more likely to manifest as instead — for example a major contract or business partnership, a significant career leap, childbirth/family expansion, a big relocation, or another life-defining commitment consistent with the rest of the chart. Ground this alternative interpretation in the actual Ten God/element signals for that year, not a generic guess.
  - **Past timing (before 2026) — FIXED SELECTION ORDER, do not pick freely:** If \`pastBestMeetingYear\` exists, it is always the primary genuinely memorable past year to call out first — never substitute a different \`candidates\` year for it. If \`pastBestMarriageYear\` also exists AND its year is different from \`pastBestMeetingYear\`'s year, mention it second as a distinct, secondary moment. If \`pastBestMeetingYear\` is null but \`pastBestMarriageYear\` exists, use \`pastBestMarriageYear\` as the primary one instead. Only fall back to the highest-scored \`isPast: true\` entry in \`candidates\` if both are null. Do not swap this order or choose a different year across regenerations — the same submission's data must always surface the same past year(s) here. For each year used, explain "Why" it was defining using its \`signals\`, and imagine concretely what likely happened to the customer that year so it feels like a specific memory being surfaced, not a vague statement.
  - If \`windowNote\` is present, weave its meaning naturally into the writing instead of quoting it verbatim.
* Consider the possibility of a non-marriage or single lifestyle if the user's chart suggests a high level of independence or a lack of traditional 'Spouse Star' activation. However, this must be based on definitive saju data evidence, and you should approach this topic with extreme caution and sensitivity. If you mention it, use a soft, inquiring tone rather than a rigid conclusion, such as: 'Since you value your independence and find so much peace in your own freedom, do you ever find yourself wondering if marriage is even a necessary part of your journey?

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
(Environmental factors that create a quantum jump in luck, such as directions, countires, colors, habits, etc.)
(Health precautions due to elemental imbalance and energy management tips.)

09. The Next Chapter: Your 2026+ Level-up Roadmap 
* Focus: The intersection of Annual Luck and Great Luck (Daewoon) after 2026.
* Data: The flow of Heavenly Stems and Earthly Branches after 2026 (Year of the Fire Horse) + Analysis of the "Gyo-un-gi" when the current Daewoon changes. Pinpoint turning points in the life scenario and timing for level-ups.
(Confidence regarding the future peak period and the great changes ahead.)
*Also carefully include some cards about individual and hyper-personalized advice to solve his or her own concern that may have been occured for a long time and why, of course based on their own saju-chart.this accurate advice will make his or her life better from 2026 and also their future. They will be really encouraged and motivated so that they love this reading because they will be heart-touched genuinely. like... (one of random examples. 'How fiercely you’ve fought through life?', or 'how lonely you must have been? I know it all. In 2026, it is perfectly okay to rest a little when you feel like resting. You don't have to plan everything with such urgency. I truly mean it. You are definitely going to be okay and you will truly bloom')

And please, you need to include these 3 sentences for 'everyone'. Because we masked this and showed on the free report page to persuade customers to pay for the paid report. Fill in the blank (*** or ** or *********** this mark), matching to this customer's saju data and context. You can put these sentences anyway in 90 sentences, considering the context.
- The main theme of your 2026 is *** . Congratulations! But be careful of , as doesn't fit well with your lifestyle.
- The period from 20** to 20** is the best time to meet your spouse. Your spouse will probably be in charge of ** and work as a ***.
- Your wealth flow timing and secret talents are already mapped out like ***** Ready to see your future from this angle? (explain in details)

========================================
CROSS-SECTION CONSISTENCY RULE — 90 CARDS (sections 04, 07, 09) vs. DECADE FORTUNE / "Your Life Eras":
========================================
Sections 04 (Career Motion), 07 (Future Self Sneak Peek: A Letter from 2030), and 09 (The Next
Chapter: Your 2026+ Level-up Roadmap) all narrate future timing that OVERLAPS in years with the
per-decade Season cards you will generate from \`decadeFortune\` below (the "Your Life Eras" section
in the UI). These two outputs will be shown on the same report page, so they MUST NOT contradict
each other for the same years:
- The overall score (상/중/하) for whichever decade covers "now" and "the next 10 years" in
  \`decadeFortune.decades\` is the single source of truth for how that period feels overall. Sections
  04/07/09 must describe consistent tone for that stretch of years — e.g. do NOT call a decade
  scored 하 (Low) a guaranteed "peak period" in section 09, and do NOT call a decade scored 상 (High)
  a "forced rest period" in section 07.
- If a specific future year appears in BOTH a 90-card section (04/07/09) and one of the decade's
  candidate-year arrays (careerYears/relationshipYears/romanceYears/healthYears/cautionYears), the
  reason/theme you give that year in the 90 cards must match the reason/polarity already computed
  for it in \`decadeFortune\` (e.g. don't call 2027 a breakout wealth year in section 04 if
  \`decadeFortune\` already flags 2027 as a \`cautionYears\` entry with polarity "caution").
- Sections 04/07/09 should go deeper and more specific (exact career fields, a vivid "letter from
  2030" narrative, hyper-personalized advice) rather than repeating the Life Eras season card
  word-for-word — treat Life Eras as the big-picture season/vibe, and 04/07/09 as the detailed
  zoom-in, but never let the zoom-in disagree with the big picture.

========================================
AFTER THE 90 CARDS, GENERATE THE DECADE FORTUNE CARDS (ONE PER DECADE):
========================================

AFTER successfully generating the 90 main facts, you MUST generate exactly ONE card PER DECADE for
the pre-computed \`decadeFortune\` object inside \`saju_data\`. This object already contains, for EVERY
Daewoon (10-year period) from birth to ~90 years old, a deterministic overall score (상/중/하) and,
for 5 categories (career/wealth, relationships, romance, health, encouragement/caution), up to 2
already-selected "candidate years" with their Ten God / 12-Star / Hap-Chung reason. You do NOT
recompute, invent, or second-guess any score or candidate year. Your job is to (a) name this decade
as a "season" with a short evocative title + one emoji, and (b) weave the already-selected candidate
years into 6 flowing paragraphs per decade — by strictly following the IF-THEN mapping rules below.

======================================================
[SYSTEM: HOROSCOPE LIFELINE & HIGHLIGHT MAPPING RULES]
======================================================
You are a precise Saju lifecycle analyzer. Your task is to narrate a lifetime timeline (Daewoon) as
ONE cohesive card per 10-year decade, citing only the specific years already selected for you. You
MUST strictly map the data using the following IF-THEN rules. Do NOT invent interpretations outside
these rules, and do NOT cite any year that does not appear in that decade's candidate-year arrays.
Maintain the "Gen-Z wise friend" persona in the final output. Remember the CROSS-SECTION CONSISTENCY
RULE above: whichever decade here covers "now" and "the next 10 years" must stay tonally consistent
with what you already wrote in sections 04/07/09 of the 90 main facts — do not contradict that
decade's score or any shared year's polarity.

[RULE 0: SEASON TITLE & EMOJI - CREATIVE, BUT GROUNDED IN THE DATA]
Give this decade a short evocative "season" name (2-4 words, title case, English, no colon inside
it) that captures its dominant theme, plus ONE emoji that fits it. Base the theme on: the decade's
\`score\`, its dominant candidate-year categories (e.g. mostly careerYears -> an ambition/建설 theme;
mostly romanceYears -> a connection theme; mostly cautionYears with "caution" polarity -> a
rest/consolidation theme), and \`isYouthDecade\`. Do NOT always default to positive-sounding names —
a 하 (Low) decade dominated by caution years should get an honest, still-dignified name like "Quiet
Reset" or "Winter Roots" 🌱 rather than a falsely upbeat one, and a 상 (High) decade dominated by
career/romance signals can get an energetic name like "High Tide" 🌊 or "Open Road" 🛣️. Vary the
vocabulary and emoji across decades for the same person — never reuse the same title or emoji twice
for one person's set of decades. Keep it punchy and metaphor-driven (nature, seasons, tides, roads,
weather), not literal ("Good Career Decade" is bad; "High Tide" is good).

[RULE 1: OVERALL SCORE - ALREADY COMPUTED, DO NOT RECALCULATE]
Each decade's \`score\` field in \`decadeFortune\` is already one of 상 (High) / 중 (Medium) / 하 (Low),
computed from Eokbu Yongshin (Favorable Elements) and the 12 Stars (Strength). Simply read and
narrate this value — never override it based on your own impression of the chart.

[RULE 2: WHICH YEARS TO CITE - ALREADY COMPUTED, DO NOT RESELECT]
Each decade has 5 candidate-year arrays: \`careerYears\`, \`relationshipYears\`, \`romanceYears\`,
\`healthYears\`, \`cautionYears\`. Each entry has \`year\`, \`age\`, \`polarity\` ("favorable" or "caution"),
and \`reason\`. When writing a category's paragraph, cite ONLY the years from that category's own
array (e.g. only \`careerYears\` inside \`careerWealth\`). If an array is empty, do not invent a year —
say that decade's energy for that theme is calm/steady with no single standout year.

[RULE 3: CAREER & WEALTH MAPPING (careerWealth field, uses careerYears + isYouthDecade)]
Use the decade's \`isYouthDecade\` flag to set the frame, then cite \`careerYears\` entries by year:
- IF isYouthDecade is true (this decade is mostly under 20, focus on Study/Talent): frame favorable
  years as peak focus, creative breakthroughs, or leadership opportunities (class president, talent
  discovery); frame caution years as distraction from study or peer-group pressure.
- IF isYouthDecade is false (adult decade, focus on Job/Money): frame favorable years as strong cash
  flow, promotions, side-hustle launches, or important contracts; frame caution years as overspending,
  workplace conflict, or a period to consolidate rather than expand.
- Always mention the specific year(s) from \`careerYears\` by name when citing them.

[RULE 4: HUMAN RELATIONSHIPS MAPPING (relationships field, uses relationshipYears)]
Cite \`relationshipYears\` entries. A caution entry (from Chung/Wonjin turbulence) means:
miscommunication is likely that year — advise keeping emotional distance and avoiding unnecessary
arguments. A favorable entry means smooth energy with friends/colleagues, mentors/parents, or
juniors/children (the \`reason\` field tells you which). If the array is empty, say this decade's
relationships stay fairly stable without one dramatic year.

[RULE 5: ROMANCE & LOVE MAPPING (romance field, uses romanceYears)]
Cite \`romanceYears\` entries (always favorable when present) using their \`reason\`: Sik-sang signal =
magnetic/flirty energy and active dating phase; Hap-with-Day-Branch signal = a stable person enters
your life; spouse-star signal (관성 for female, 재성 for male) = a serious, commitment-ready partner.
IF \`romanceYears\` is empty: do not fabricate a romance narrative — briefly say this decade's energy
isn't centered on romance and point the reader toward the career/relationship themes instead.

[RULE 6: HEALTH & ENERGY MAPPING (health field, uses healthYears)]
Identify the most EXCESSIVE or COMPLETELY MISSING element in the natal chart from
\`elementBalanceWithHiddenStems\`. For each caution entry in \`healthYears\` (weak 12-Star year), output
a Health Warning based on that vulnerable element, and cite the specific year:
   * Wood (목): Liver, spine, burnout.
   * Fire (화): Heart, blood pressure, stress.
   * Earth (토): Stomach, digestion, skin.
   * Metal (금): Lungs, respiratory, joints.
   * Water (수): Kidneys, hormones, reproductive system.
Advice for caution years: "Your physical battery is draining faster than usual. Prioritize deep rest,
immune care, and mental detox over hustle." For favorable entries (strong 12-Star year), give a
lighter, energy-is-good note instead of a warning, citing that year. If \`healthYears\` is empty,
give a general, lightly reassuring note without naming a specific year.

[RULE 7: ENCOURAGEMENT & CAUTION MAPPING (coreAdvice field, uses cautionYears + decade score)]
This is the decade's closing "cheer + watch out" paragraph. Start from the decade's \`score\` for
overall tone:
- IF score is 상 (High): the wind is at your back — go for it, high risk brings high reward now.
- IF score is 하 (Low): a mandatory pit-stop — don't force expansion, level up hidden skills, save
  money, protect your peace.
- IF score is 중 (Medium): a bridging period — balance calculated risks with a safety net.
(Rewrite in your own Gen-Z wise-friend voice, not verbatim, but keep the same underlying advice.)
Then cite \`cautionYears\`: favorable entries ("turning point" years) are explicit "go for it, this is
your year to try" call-outs; caution entries (Chung/Wonjin) are explicit "slow down and protect
yourself" call-outs. Name the specific years.

[OUTPUT FORMAT EXPECTATION PER DECADE]
For every decade in \`decadeFortune.decades[]\`, produce exactly ONE card with these 8 fields, written
in English only (no Korean/Chinese characters). Naturally weave in the specific years from that
category's candidate array (never invent a year not present in the data):
1. seasonTitle — 2-4 word evocative season name per Rule 0 (e.g. "High Tide", "Quiet Reset").
2. seasonEmoji — exactly ONE emoji matching seasonTitle per Rule 0.
3. overallVibe — Overall flow of this whole decade (state High/Medium/Low in plain words per Rule 1),
   using a nature/metaphor tied to the customer's chart and echoing the seasonTitle, mostly framed
   positively since cautions are covered in the other fields below. 150-260 characters.
4. careerWealth — Career/Wealth narration per Rule 3, citing careerYears. 150-260 characters.
5. relationships — Family/friends/workplace narration per Rule 4, citing relationshipYears. 150-260 characters.
6. romance — Romance narration per Rule 5, citing romanceYears (or explicitly noting none). 150-260 characters.
7. health — Health narration per Rule 6, citing healthYears. 150-260 characters.
8. coreAdvice — Encouragement + caution narration per Rule 7, citing cautionYears. 150-260 characters.

Do NOT skip any decade. Do NOT add, remove, or reorder decades — produce exactly one card per
decade, in the same order as \`decadeFortune.decades\`.

OUTPUT JSON STRUCTURE - ABSOLUTELY CRITICAL:
You MUST return EXACTLY 9 sections with EXACTLY 10 cards each = 90 total cards. 
DO NOT return fewer cards. The user PAID for 90 facts. Returning less is unacceptable.

Then, APPEND the decade fortune cards as a separate array named "decadeFortuneCards" — exactly ONE
object per decade (8 total, matching \`decadeFortune.decades.length\`).

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
    ... (repeat this EXACT structure for all 9 sections, each with EXACTLY 10 cards.)
  ],
  "decadeFortuneCards": [
    {
      "startAge": 0,
      "endAge": 9,
      "startYear": 1996,
      "endYear": 2005,
      "seasonTitle": "[2-4 word evocative name]",
      "seasonEmoji": "[single emoji]",
      "overallVibe": "[150-260 chars]",
      "careerWealth": "[150-260 chars]",
      "relationships": "[150-260 chars]",
      "romance": "[150-260 chars]",
      "health": "[150-260 chars]",
      "coreAdvice": "[150-260 chars]"
    }
    ... (one object per decade in decadeFortune.decades, in the same order, using that decade's own startAge/endAge/startYear/endYear)
  ]
}

Generate both the 90 main facts and the decadeFortuneCards now as a single JSON object.`

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
    let decadeFortuneCards: Array<{
      startAge: number
      endAge: number
      startYear: number
      endYear: number
      seasonTitle: string
      seasonEmoji: string
      overallVibe: string
      careerWealth: string
      relationships: string
      romance: string
      health: string
      coreAdvice: string
    }> = []
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
      
      // mainFacts와 decadeFortuneCards 추출
      if (Array.isArray(parsedData)) {
        // 구형식: 배열 직접 반환 (호환성)
        paidFacts = parsedData
      } else if (parsedData.mainFacts && Array.isArray(parsedData.mainFacts)) {
        // 신형식: { mainFacts: [...], decadeFortuneCards: [...] }
        paidFacts = parsedData.mainFacts
        decadeFortuneCards = parsedData.decadeFortuneCards || []
      }
      
      console.log('[v0] Successfully parsed', paidFacts.length, 'main facts and', decadeFortuneCards.length, 'decade fortune cards')
      
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
        .update({ facts: paidFacts, payment_id: payment.id, hidden_cards: decadeFortuneCards.length > 0 ? decadeFortuneCards : undefined })
        .eq('id', existing.id)
      insertError = error
    } else {
      // 없으면 insert (hidden_cards 컬럼에 대운별 6개 카테고리 카드를 저장 - 컬럼명은 레거시, 내용은 decadeFortuneCards)
      const { error } = await supabase
        .from('reports')
        .insert({
          submission_id: submissionId,
          payment_id: payment.id,
          section_key: 'paid_full',
          facts: paidFacts,
          ...(decadeFortuneCards.length > 0 ? { hidden_cards: decadeFortuneCards } : {}),
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

    console.log(`[v0] Successfully generated ${paidFacts.length} paid facts for ${submission.name}`)

    return NextResponse.json({
      facts: paidFacts,
      decadeFortuneCards,
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
