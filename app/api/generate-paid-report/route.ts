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
 * 3. 90개 사실 생성 + decadeFortune의 하이라이트 연도마다 6개 필드 서술 생성 (AI는 점수/연도를 재계산하지 않음)
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
Every score, tag, and highlight year below is final. Your only task for this object is to narrate
each highlightYears[] entry into the 6 required text fields following the Mapping Rules.
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
  - **Future timing (2026 and beyond only):** Only reference \`bestMeetingYear\` / \`bestMarriageYear\` and any \`candidates\` entries with \`isPast: false\`. Explicitly identify one or two pivotal years for romance/marriage from these, and explain "Why" using the \`signals\` already computed (spouse star visibility, Day Branch hap/chung, etc.). Never mention a future year that isn't present in this data.
  - **If the strongest future signal is not marriage-grade** (e.g. category is "무자"/"과다", or the top future candidate's signals are dating-type signals like Dohwa/Siksang rather than an actual spouse-star activation, or \`bestMarriageYear\` is null): explicitly say so, and reinterpret what that year's energy is more likely to manifest as instead — for example a major contract or business partnership, a significant career leap, childbirth/family expansion, a big relocation, or another life-defining commitment consistent with the rest of the chart. Ground this alternative interpretation in the actual Ten God/element signals for that year, not a generic guess.
  - **Past timing (before 2026):** Use \`pastBestMeetingYear\` / \`pastBestMarriageYear\` (and any earlier \`candidates\` with \`isPast: true\`) to call out one or two genuinely memorable past years the customer should recognize (e.g. a defining relationship, breakup, or turning point in their dating life). For each, explain "Why" it was defining using its \`signals\`, and imagine concretely what likely happened to the customer that year so it feels like a specific memory being surfaced, not a vague statement.
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
AFTER THE 90 CARDS, GENERATE THE DECADE FORTUNE HIGHLIGHT CARDS:
========================================

AFTER successfully generating the 90 main facts, you MUST generate highlight-year cards for the
pre-computed \`decadeFortune\` object inside \`saju_data\`. This object already contains, for EVERY
Daewoon (10-year period) from birth to ~90 years old, a deterministic overall score (상/중/하) and
2-3 already-selected highlight years with their Ten God / 12-Star / Hap-Chung signals. You do NOT
recompute, invent, or second-guess any score, year, or signal. Your ONLY job is to turn each already
selected highlight year into 6 short natural-language fields by strictly following the IF-THEN
mapping rules below.

======================================================
[SYSTEM: HOROSCOPE LIFELINE & HIGHLIGHT MAPPING RULES]
======================================================
You are a precise Saju lifecycle analyzer. Your task is to narrate a lifetime timeline (Daewoon) and
its 2-3 highlight years (Yeonwoon) per decade. You MUST strictly map the data using the following
IF-THEN rules. Do NOT invent interpretations outside these rules. Maintain the "Gen-Z wise friend"
persona in the final output.

[RULE 1: OVERALL SCORE - ALREADY COMPUTED, DO NOT RECALCULATE]
Each decade's \`score\` field and each highlight year's \`score\` field in \`decadeFortune\` is already
one of 상 (High) / 중 (Medium) / 하 (Low), computed from Eokbu Yongshin (Favorable Elements) and the
12 Stars (Strength). Simply read and narrate this value — never override it based on your own
impression of the chart.

[RULE 2: WHY THESE YEARS WERE SELECTED - ALREADY COMPUTED, DO NOT RESELECT]
Each highlight year's \`tags\` array (turning_point / romance / turbulence) and \`signals\` array
already tell you why that specific year was chosen out of the 10-year Daewoon. Use these tags and
signals as the factual basis for your narration; do not pick different years or claim different
reasons.

[RULE 3: CAREER & WEALTH MAPPING (By Age & Ten Gods)]
Use the highlight year's \`isBeforeAdult\` flag and its \`stemTenGod\`/\`branchTenGod\` values.

IF isBeforeAdult is true (age < 20, focus on Study/Talent):
- In-seong (인성, Resource): Peak academic focus, strong concentration, favor from teachers.
- Sik-sang (식상, Output): Creative explosion, discovering physical/artistic talents, hard to sit still.
- Gwan-seong (관성, Authority): Taking leadership roles (class president), stress from strict rules.
- Bi-geop (비겁, Self) / Jae-seong (재성, Wealth): Distractions from study, focusing on peer groups or early hustle.

IF isBeforeAdult is false (age >= 20, focus on Job/Money):
- Jae-seong (재성, Wealth): Strong cash flow, investment opportunities, successful job hunting.
- Gwan-seong (관성, Authority): Promotion, leveling up in status, taking on heavy organizational responsibilities.
- Sik-sang (식상, Output): Starting a side-hustle, launching new projects, creative independence.
- Bi-geop (비겁, Self): Collaboration or fierce competition. If isDayMasterStrong is true: beware of losing money to others. If false: great teamwork and networking.
- In-seong (인성, Resource): Gaining certifications, signing important contracts, real estate documentation.

[RULE 4: HUMAN RELATIONSHIPS MAPPING]
- IF Bi-geop (비겁): Theme is friends and colleagues.
- IF In-seong (인성): Theme is mentors, bosses, or parents.
- IF Sik-sang (식상): Theme is juniors, subordinates, or children.
- IF the year's \`tags\` array includes "turbulence" (a Chung or Wonjin signal is present): Output a warning -> "Miscommunications are highly likely. Keep emotional distance and avoid unnecessary arguments this year."

[RULE 5: ROMANCE & LOVE MAPPING]
- IF the year's \`tags\` includes "romance" because of a Sik-sang signal: Magnetic energy is high. Active flirting and dating phase (The Meeting).
- IF the year's \`tags\` includes "romance" because of a Hap-with-Day-Branch signal: A stable person enters your personal space.
- IF Female AND the year's \`tags\` includes "romance" because of a Gwan-seong (spouse star) signal: Serious, commitment-ready partner enters.
- IF Male AND the year's \`tags\` includes "romance" because of a Jae-seong (spouse star) signal: Serious, commitment-ready partner enters.
- IF the year's \`tags\` does NOT include "romance" at all: do not fabricate a romance narrative — briefly say this year's energy is not centered on romance.

[RULE 6: HEALTH & ENERGY MAPPING]
- Identify the most EXCESSIVE or COMPLETELY MISSING element in the natal chart from \`elementBalanceWithHiddenStems\`.
- IF the highlight year's \`twelveStar\` is 병(Byeong/Sickness), 사(Sa/Death), 묘(Myo/Tomb), or 절(Jeol/Cut):
  -> Output a Health Warning based on the vulnerable element:
     * Wood (목): Liver, spine, burnout.
     * Fire (화): Heart, blood pressure, stress.
     * Earth (토): Stomach, digestion, skin.
     * Metal (금): Lungs, respiratory, joints.
     * Water (수): Kidneys, hormones, reproductive system.
  -> Advice: "Your physical battery is draining faster than usual. Prioritize deep rest, immune care, and mental detox over hustle."
- IF the highlight year's \`twelveStar\` is NOT one of those four: give a lighter, energy-maintenance-focused note instead of a warning.

[RULE 7: FINAL ADVICE (Based on the year's already-computed score)]
- IF score is 상 (High): "The wind is at your back. Stop overthinking and go all-in. High risk brings high reward right now."
- IF score is 하 (Low): "This is a mandatory pit-stop. Do not force expansion. Focus on leveling up your hidden skills, saving money, and protecting your peace."
- IF score is 중 (Medium): "A bridging period. Balance is key—take calculated risks but keep a safety net."
(Rewrite each of the above in your own Gen-Z wise-friend voice rather than quoting it verbatim, but keep the same underlying advice for that score.)

[OUTPUT FORMAT EXPECTATION PER HIGHLIGHT YEAR]
For every highlight year across every decade in \`decadeFortune.decades[].highlightYears[]\`, produce
exactly these 6 text fields, each 100-160 characters (including spaces), in the Gen-Z wise-friend
tone, written in English only (no Korean/Chinese characters):
1. overallVibe — Overall Vibe & Score narration (state High/Medium/Low in plain words per Rule 1).
2. careerWealth — Career/Wealth narration per Rule 3.
3. relationships — Relationships narration per Rule 4.
4. romance — Romance narration per Rule 5.
5. health — Health narration per Rule 6.
6. coreAdvice — Core Advice narration per Rule 7.

Do NOT skip any highlight year. Do NOT add, remove, or reorder decades or highlight years — use
exactly the years and order given in \`decadeFortune\`.

OUTPUT JSON STRUCTURE - ABSOLUTELY CRITICAL:
You MUST return EXACTLY 9 sections with EXACTLY 10 cards each = 90 total cards. 
DO NOT return fewer cards. The user PAID for 90 facts. Returning less is unacceptable.

Then, APPEND the decade fortune highlight narrations as a separate array named "decadeFortuneCards".

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
      "year": 2004,
      "age": 8,
      "overallVibe": "[100-160 chars]",
      "careerWealth": "[100-160 chars]",
      "relationships": "[100-160 chars]",
      "romance": "[100-160 chars]",
      "health": "[100-160 chars]",
      "coreAdvice": "[100-160 chars]"
    }
    ... (one object per highlight year, for every decade in decadeFortune.decades, in the same order)
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
          maxOutputTokens: 16000,
          temperature: 0,
        })
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
      year: number
      age: number
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
      // 없으면 insert (hidden_cards 컬럼에 대운 하이라이트 연도 카드를 저장 - 컬럼명은 레거시, 내용은 decadeFortuneCards)
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
