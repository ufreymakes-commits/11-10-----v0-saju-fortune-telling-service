import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

/**
 * Gemini 1.5 Pro Test Version: 
 * 모든 프롬프트를 한 번에 발사
 * System: 마스터피스 가이드 + 역할 정의 (고정)
 * User: 고객 사주 데이터 + 최종 요청 (변수)
 * 
 * Model: google/gemini-1.5-pro (Gemini 1.5 Pro 테스트)
 */

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

    // ===== SYSTEM PROMPT (고정: 마스터피스 가이드 + 역할 정의) =====
    const systemPrompt = `You will make a report with this 'pre-calculated Saju', DO NOT Calculate again.
Just use these to make a interpretion for the 9 facts report. 
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
Definition of Saju (Four Pillars)

Birth chart (myeongsik, 命式) concept based on four pillars: Year (年), Month (月), Day (日), Hour (時)

Structure of each pillar as a pair: one Heavenly Stem (Cheongan, 天干) character + one Earthly Branch (Jiji, 地支) character

Eight-character (palja, 八字) composition principle totaling 8 characters

Interpretive framework linking the four pillars to life domains/palaces (gung, 宮): ancestry, parents, self, children

Traditional interpretive purpose for inferring life flow, themes, temperament, relationships, and timing patterns

Heavenly Stems (天干): Concept and Components

List of the 10 Heavenly Stems: Gap (甲), Eul (乙), Byeong (丙), Jeong (丁), Mu (戊), Gi (己), Gyeong (庚), Sin (辛), Im (壬), Gye (癸)

Each stem's Five Elements (Ohaeng, 五行) identity: Wood, Fire, Earth, Metal, Water

Each stem's Yin/Yang (Eum/Yang, 陰陽) polarity

Example mapping: Byeong Fire (丙火) = Yang (陽) Fire / Gye Water (癸水) = Yin (陰) Water

Symbolism of "heaven energy" as outward, visible, direct modes of expression

Assumption of fixed attributes enabling element/polarity identification by the character alone

Earthly Branches (地支): Concept and Components

List of the 12 Earthly Branches: Ja (子), Chuk (丑), In (寅), Myo (卯), Jin (辰), Sa (巳), O (午), Mi (未), Sin (申), Yu (酉), Sul (戌), Hae (亥)

Symbolism of "earth energy," including seasonal, directional, and time-based qualities

Each branch's seasonal atmosphere, symbolic animal, elemental nature, and Yin/Yang character

Example mapping: In Wood (寅木) = early-spring Wood energy and Tiger symbol / Ja Water (子水) = deep-winter Water energy and Rat symbol

Importance of memorizing branches as a core foundation for later interpretation

Branch interaction interpretation factors: Combination (合), Clash (沖), Punishment (刑), Harm (害)

Hidden Stems (支藏干, Hidden Stems): Concept

Hidden Heavenly Stem energies inside an Earthly Branch ("stems within branches" concept)

Structure of 1 to 3 hidden stems contained within a single branch

Example: Sin (申) branch containing Mu (戊), Im (壬), and Gyeong (庚) internally

Assumption of fixed hidden-stem combinations for each of the 12 branches

Classification system: Primary qi (Jeonggi, 正氣), Secondary qi (Junggi, 中氣), Residual qi (Yeogi, 餘氣)

Role as "non-visible / behind-the-scenes" information within the chart

Importance as a clue for selecting Yongshin (用神)

Premise of activation potential through luck cycles (hidden energies becoming active)

Day Master (일간) and Ten Gods (十神): Concept

Day Master (Ilgan; the Day Stem) as the symbol of the self and the central reference point for interpretation

Ten Gods (Sipsin; Ten Relationships) as a relational classification system defined relative to the Day Master

Classification criteria: Five Element generating/controlling relationships + same/different Yin/Yang polarity combinations

Scope of Ten Gods application: all other stems + key energies within branches (hidden stems) classified in relation to the Day Master

Five paired categories (ten total)

Bi-gyeon / Geop-jae (比肩 / 劫財)

Sik-shin / Sang-gwan (食神 / 傷官)

Pyeon-jae / Jeong-jae (偏財 / 正財)

Pyeon-gwan (Chil-sal) / Jeong-gwan (偏官 / 七殺 / 正官)

Pyeon-in / Jeong-in (偏印 / 正印, also called Insu, 印綬)

Six-kin (Yukchin, 六親) symbolic linkage concept mapping categories to roles such as siblings/peers, parents, spouse, children

Example links

Bi-gyeon: same element + same polarity as the Day Master → sibling / close peer / partner symbolism

Jeong-in: energy that generates (生) the Day Master → mother / support / learning symbolism

Inference targets using Ten Gods distribution: sibling support, parental support, spouse connection, child blessings, and overall social structure themes

Chart Structure (Gyeokguk, 格局) and the Yongshin/Heeshin Selection Frame

6-1) Meaning of Gyeokguk and Determination Principle

Gyeokguk as the chart's structural "frame / format / template" concept

Tradition of determining structure primarily through the Month Commander (Wolryeong, 月令): Month Branch energy and seasonal force

Anchor principle from classical rule: "Yongshin is primarily sought from the Month Commander" (八字用神 專求月令)

Classification approach based on the Month Branch's Ten Gods "power zone"

Assumption of considering the Month Branch's primary hidden stem (Jeonggi, 正氣) and rooting (geun, 根)

Example structure labels: Companion structure, Output structure, Wealth structure, Power structure, Resource structure (비견격, 식신격, 재격, 관격, 인수격, etc.)

Use after structure confirmation: framework for Yongshin selection and for reading favorable/unfavorable luck-cycle tendencies

6-2) Example Logic for Structure Judgment

Month Branch primary hidden stem corresponding to Resource (energy generating the Day Master) → possible Resource-type structure (Insu-gyeok, 인수격)

Month Branch primary hidden stem corresponding to Power (energy controlling the Day Master) → possible Power-type structure (Gwan-gyeok, 관격)

Use of structure to identify the "main story" and set emphasis direction for balance

Yongshin (用神): Concept and Selection Procedure

7-1) Definition of Yongshin

Yongshin as the most necessary "useful energy" for harmony

Core selection of the element or Ten God needed to balance the entire chart

Concept of the suppress-and-support method (Eokbu-yongshinbeop, 抑扶用神法)

Consideration of Day Master strength or weakness and Five Element excess or deficiency

Suppression of excessive energies

Support of lacking energies

In charts with strong seasonal imbalance, Yongshin is fixed as the element that restores seasonal harmony (Johu Yongshin) before any structural optimization is considered.

7-2) Factors Considered in Selecting Yongshin

Traditional priority principle: when strong seasonal excess or deficiency exists, Yongshin is determined primarily from the Month Commander (Johu-first principle), overriding later structural considerations.

Practical integrated judgment factors

Overall Five Element distribution

Interaction patterns: combination, clash, punishment, and harm

Seasonal amplification or weakening effects on specific energies

7-3) Yongshin Selection Process

Step 1: Judge Day Master strength (strong or weak; singang/sinyak, 신강/신약)

Step 2: Identify Five Element imbalance (excess versus deficiency or absence)

Step 3: Fix Yongshin based on seasonal regulation if Month Commander imbalance is dominant (Johu Yongshin).
Only after Yongshin is fixed, identify secondary supportive elements (Heeshin) for structural and long-term balance.

7-4) Example Direction for Yongshin

Very strong Day Master with excessive Earth (土)
→ Need energy that drains or regulates Earth
→ Possible selection of Power (官星) for control and structuring function

Very weak Day Master
→ Need supportive energies such as Companion (비견/겁재) or Resource (인성)
→ Direction of stabilizing and strengthening self energy

Strong Day Master born in a hot season (e.g., Fire-dominant months):
Primary Yongshin = Water (for seasonal cooling and regulation)
Secondary Heeshin = Wood (for controlled growth and directional use of energy)

Heeshin (喜神) and Kishin (忌神): Concepts

Heeshin is selected only after Yongshin is fixed and serves to support the stabilized system, not to replace the primary Yongshin.

Heeshin as a supportive "joyful helper" energy that assists Yongshin and increases harmony

Example: if Wood (木) functions as a structural or growth-supporting element, Water (水) may act as Heeshin because it generates Wood

Kishin as a disruptive or destabilizing energy that breaks balance

Either already excessive energy or energy that directly damages Yongshin

Example: Wood-supported structure with excessively strong Metal (金) cutting Wood
→ That Metal treated as Kishin, with interpretation leaning toward restraining Metal influence

Three-summary Definitions

Yongshin: the most necessary core energy that restores overall balance, prioritized by seasonal regulation when applicable

Heeshin: secondary supportive energy that assists Yongshin and contributes to long-term stability and growth

Kishin: destabilizing energy that disrupts balance or damages Yongshin

Strong vs Weak Day Master (신강 / 신약): Meaning and Criteria

9-1) Meaning

Strong/weak judgment as the degree of power the Day Master holds within the chart

Role as the starting point that changes Yongshin selection and luck-cycle interpretation

Month Commander (season of birth) as the top priority reference plus additional factors in synthesis

9-2) Key Criteria

Seasonal support (Month Commander)

Standard of thriving vs declining season for the Day Master's element (생지/왕지 vs unfavorable season)

Example: Wood Day Master born in spring → strong tendency / Fire Day Master born in deep winter → weak tendency

Presence of Companion and Resource

Many same-element markers (비견/겁재) + rooting in branches → Day Master strengthening

Clear, strong Resource (인성) expressed in stems → "backing/backup power" strengthening Day Master

Deficiency of Companion/Resource → potential sharp weakening due to lack of support

Pressure from Output, Wealth, Power

Output (식신/상관): draining (설기) of Day Master energy through expression/action

Wealth (편재/정재): management/control burden; excessive strength can overwhelm

Power/Seven Killings (정관/편관): control of Day Master; excessive strength can suppress

Excessive draining/controlling forces → relatively weak Day Master

For an already strong Day Master, appropriate draining/control → venting excess and supporting balance

9-3) Integrated Conclusion Frame

Synthesis of (Month Commander + Companion/Resource + Output/Wealth/Power pressure) plus an overall Five Element distribution overview

Strong Day Master strategy: regulation and release (control/drain)

Weak Day Master strategy: support and stabilization (support/generation)

9-4) Tendency Framing (as tendencies, not absolutes)

Strong Day Master tendency: autonomy, self-respect, drive, leadership / possible stubbornness and rigidity

Weak Day Master tendency: flexibility, cooperation, social smoothness / possible indecision and feeling overwhelmed

Five Elements (五行) Generating/Controlling Flow Analysis

9-5) The Drama of Self and Stage: The Triangular Relationship of Day Master, Month Branch, and Day Branch (Mandatory Logic)

Social Genes (Day Master + Month Branch): Define the Month Branch as the 'Seasonal Stage' where this person was born.

Deuk-ryeong (Seasonal Support): Describe them as a "lucky person for whom the world started on their side" and pinpoint the source of their innate confidence.

Sil-ryeong (Seasonal Pressure): Read them as a "great survivor who has disciplined themselves through harsh seasons." Emphasize that their strong vitality is a testament to victory, not merely a result of hardship.

Inner Roots (Day Master + Day Branch): Define the Day Branch as this person's 'most private footing.'

Gan-yeo-ji-dong / Strong Roots: Express this as a "firm core unshaken by external storms." Congratulate this not as 'stubbornness,' but as 'perfect alignment with oneself' and 'professional craftsmanship.'

10-1) Core Principle

Generating cycle (相生): Wood → Fire → Earth → Metal → Water → Wood

Controlling cycle (相剋): Wood controls Earth, Fire controls Metal, Earth controls Water, Metal controls Wood, Water controls Fire

10-2) Imbalance and Broken Circulation Concept

Possibility of excess, deficiency, or absence of specific elements

Example: strong Fire and Earth + weak Water and Wood → excessive Fire→Earth generating action + weakened/broken Earth→Metal→Water→Wood flow

Dual-sided nature of biased flow: strong talents/personality advantages + possible strain/deficiency/internal disharmony signals

10-3) Interpretation Method

Identification of excessive elements

Identification of deficient/absent elements

Identification of blocked/stuck flow points

Balancing interpretation: suppress excess + support deficiency + restore smoother circulation

Example style: Earth Day Master + excessive Fire → Fire generates Earth too much, strengthening Earth excessively; Earth can suppress Water (Earth controls Water), weakening Water dynamics → balance logic linking to Yongshin and luck interpretation through generating/controlling relationships

Earthly Branch Interactions: Combination (合), Clash (沖), Punishment (刑), Harm (害)

11-1) Importance

Concept of special relationships among the four branches (Year/Month/Day/Hour)

Tools for interpreting relationship dynamics and change/events

Interpretive method linking effects to palaces/life domains (including spouse palace)

11-2) Combination (合): Six Combinations (六合) and Three-Harmony (三合)

Combination as binding/cooperative strengthening between branches, with possible formation of a new elemental tendency

Six Combination pairs (六合)

Zi–Chou (子丑)

Yin–Hai (寅亥)

Mao–Xu (卯戌)

Chen–You (辰酉)

Si–Shen (巳申)

Wu–Wei (午未)

Keywords when combination forms: cooperation, attachment, pulling together

Example: Day Branch + Year Branch combination → possible reading of stronger harmony between spouse domain and family domain

Three-Harmony groups (三合) completing a full elemental "bureau" (方局), maximizing a specific element

Shen–Zi–Chen = Water group (水局)

Hai–Mao–Wei = Wood group (木局)

Yin–Wu–Xu = Fire group (火局)

Si–You–Chou = Metal group (金局)

When 三合 completes: extreme strengthening of that element + potential triggering of change through luck cycles + possible interpretation of networking/helpful people dynamics depending on context

11-3) Clash (沖)

Clash as direct opposition and collision relationship

Six clash pairs (六冲)

Zi–Wu (子午)

Chou–Wei (丑未)

Yin–Shen (寅申)

Mao–You (卯酉)

Chen–Xu (辰戌)

Si–Hai (巳亥)

Clash keywords: sudden change, conflict, separation, turning point

Natal clash presence: potential for periodic big shifts and dramatic relationship dynamics

Dual-sided nature: not only negative; can break stagnation and force growth

11-4) Punishment (刑)

Punishment as friction, repeated tension, stress-pattern concept

Representative forms

Zi–Mao punishment (子卯刑): "no-respect punishment" (無禮之刑)

Yin–Si–Shen punishment (寅巳申刑): "no-grace punishment" (無恩之刑)

Chou–Xu–Wei punishment (丑戌未刑): "power-based punishment" (恃勢之刑)

Pattern characteristics: internal pressure, ongoing irritation, repetitive relationship strain rather than explosive events

When involving the Day Branch (spouse palace): emphasis on repeated relationship tension possibility

11-5) Harm (害) and Yuanjin (怨嗔)

Harm as subtle erosion accumulating discomfort, mistrust, resentment over time

Six harms (六害)

Zi–Wei (子未)

Chou–Wu (丑午)

Yin–Si (寅巳)

Mao–Chen (卯辰)

Shen–You (申酉)

Xu–Hai (戌亥)

Yuanjin as an interpretive layer linked to harm: unspoken bitterness and accumulated emotional irritation

When touching spouse palace or key palaces: implication of early communication and emotional maintenance needs

11-6) Evaluation Priority and Activation Conditions

Stacking possibility when multiple interactions coexist

Rule-of-thumb priority for event intensity: Clash > Combination > Punishment/Harm

Stronger activation when natal "seeds" meet matching branches in luck cycles (Big Luck/Annual Luck)

Three evaluation inclusions

Which interaction exists in the natal chart

Which palace is affected

When it is activated by luck cycles

Ten Gods Distribution-Based Tendency and Strategy Analysis

12-1) Meaning of Distribution Analysis

Counting Ten Gods categories across stems and key branch energies (hidden stems) as an inference basis

Premise of non-moral judgment for "more/less" (talent and bias can coexist)

Meaning of absence: developmental themes, ...`

    // ===== 십신 포맷팅: "비견 (3개), 식신 (2개)" 형식 =====
    // 십신별 개수 계산
    const tenGodsCounts: Record<string, number> = {}
    if (saju_data.tenGods?.present) {
      saju_data.tenGods.present.forEach(tenGod => {
        tenGodsCounts[tenGod] = (tenGodsCounts[tenGod] || 0) + 1
      })
    }
    
    // 십신 포맷팅: "비견 (3개), 식신 (2개)" 형식
    const tenGodsFormatted = Object.entries(tenGodsCounts)
      .map(([name, count]) => `${name} (${count}개)`)
      .join(', ')
    
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
      
      // 오행 점수 3가지 (모두 포함)
      elementBasic: saju_data.elementBalanceKorean || {}, // 지장간 미포함
      elementWithHiddenStems: saju_data.elementBalanceWithHiddenStemsKorean || {}, // 지장간 포함
      elementAdjusted: saju_data.elementBalanceAdjustedKorean || {}, // 합충 반영
      elementCount: saju_data.elementCount || {},
      dominantElement: saju_data.dominantElement || '',
      
      // 십신 (개수 포함)
      tenGodsPresent: saju_data.tenGods?.present || [],
      tenGodsPresentWithCount: tenGodsFormatted,
      tenGodsMissing: saju_data.tenGods?.missing || [],
      tenGodsCounts: tenGodsCounts, // 원본 객체도 포함
      
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
      
      // 신살 (모두 포함)
      spirits: saju_data.spirits || [],
      sinsalDetails: saju_data.sinsalDetails || [],
      sinsalSummary: saju_data.sinsalSummary || '',
      sinsalCombinedGuide: saju_data.sinsalCombinedGuide || '',
      
      // 용신 (상세)
      yongsin: {
        eokbu: saju_data.eokbuYongsin || 'None',
        johu: saju_data.johuYongsin || 'None',
        exists: !!saju_data.eokbuYongsin || !!saju_data.johuYongsin
      },
      
      // 대운 (처음 3개 + 십신 + 12운성)
      daewoon: saju_data.daewoon?.slice(0, 3).map(d => ({
        startAge: d.startAge,
        endAge: d.endAge,
        ganzi: `${d.stem}${d.branch}`,
        fullName: d.fullName,
        tenGod: d.tenGod || 'N/A',
        twelveStar: d.twelveStar || 'N/A'
      })) || [],
      
      // 연운 (2026년 포함)
      yeonwoon: {
        current2026: saju_data.yeonwoon?.find(y => y.year === 2026)?.fullName || 'N/A',
        allYears: saju_data.yeonwoon?.slice(0, 5).map(y => ({
          year: y.year,
          ganzi: `${y.stem}${y.branch}`,
          fullName: y.fullName
        })) || []
      },
      
      // 합충 요약
      hapChungSummary: saju_data.hapChungSummary || ''
    }

    console.log('[v0] Gemini: ===== COMPLETE CUSTOMER DATA FOR GEMINI 1.5 PRO =====')
    console.log('[v0] Gemini:', JSON.stringify(allSajuData, null, 2))
    console.log('[v0] Gemini: ==================================================')

    const userPrompt = `Now, generate a total of 9 chillingly insightful sentences for him or her — the kind of sentences someone would want to share with a friend because they're just that on point.Sentences that make them truly feel like, 'Wow, this is tailored to my personal Saju chart, rather than being a generic one for everyone. This captures every detail of my Saju all at once.

Before writing the 9 sentences, silently read and internalize the full Advanced Saju Data field({{ 11.\`22\` }}). Treat every value — 12운성, 공망, 형, 원진, 천간합, 삼합, 길성, 조후용신, 신강신약 percentage — as background intelligence that shapes how you see this person's life. You do not need to mention any of these terms. You do not need to explain them. Just let them inform the specificity of what you write, the way a doctor reads lab results before speaking to a patient — the results never appear in the conversation, but they make every observation more precise. The 9 sentences should feel like they could only have been written for this exact chart, not because they reference Saju structure, but because they describe a life too accurately to be generic.

Each sentence must feel realistic, specific, and emotionally resonant, as if it could have truly happened in their life.Make each line count.

Please include years(e.g., "in 2017", "by 2032") wherever possible to enhance realism.This year is 2026 just in case to know.

Focus on uncovering aspects like:

What kind of job they are likely doing now(guess a few jobs with the career rule step 1 to 8),

Whether they're working in a company, for the government, running their own business, freelancing, or unemployed,

    When their first love happened, and when they got married or will get married or they don't want to get married,

What kind of person they married(age difference, looks, personality, job),

    What their family dynamics are like(relationship with parents or siblings),

What they will be doing in the future(very specific),

    If they have any health issues, what would be the likely cause,

      Which region or country would bring them better fortune,

        What inner thoughts they've repeated often throughout life,

          What others have told them frequently,

            How they looked or behaved across childhood, youth, adulthood, and old age.

🧱 Formatting Rules(Critical)

⚠️ Count down every sentence from 1 to 9.

🚫 Only use English.Do not include Korean, Chinese, or any other languages.

🧠 Sentences must be detailed, clear, and insightful; avoid being overly short or vague.Writing just two clear compact sentences for every nine is sufficient.Please provide each numbered point with an average of 50 characters.

💥 Make each sentence emotionally piercing or deeply accurate, as if you truly know them.

✍️ Report Structure:

  Introduction(2 sentences): Describe their inborn energy and overall personality.Include a sentence like: "The phrase you probably hear most often from others is: '***'." In the report introduction or personality section, you must provide one warm summary sentence from a positive perspective: "You are a person standing on the footing of [Self (Day Branch)] within the environment of [Stage (Month Branch)]."

  Body 1(2 sentences): Detailed analysis of wealth and career.Provide two sentences that define the core theme of their career and financial life.These must be realistic, specific, and address the practical concerns or dreams they are likely to have.Avoid vague generalizations.

    Body 2(3 sentences): Love, health, and relationships.Provide two sentences about their main themes in love and marriage.These should be highly factual and specific, not ambiguous.You may mention the timing of their first love, but do not reveal the spouse's profession or personality yet(as this is a free report).

      Conclusion(2 sentences): Advice for improving fortune and future direction. (But don't spoil the exact luck element yet as it will appear on another premium report ) Identify a specific theme that might be causing them inner struggle. Offer two sentences of realistic yet touching comfort. If they are someone better suited for living abroad rather than their home country, provide encouragement for that path. Alternatively, if they have a painful past, offer sincere consolation.

OUTPUT FORMAT(ONLY JSON):
\`\`\`json
{
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
${JSON.stringify(allSajuData, null, 2)}`

    console.log('[v0] Gemini: Calling Gemini 1.5 Pro with System/User separation')

    // generateText with Gemini 1.5 Pro
    const result = await generateText({
      model: 'google/gemini-1.5-pro',
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8,
      maxTokens: 3000
    })

    console.log('[v0] Gemini: Response received, parsing...')

    // JSON 파싱
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      console.error('[v0] Gemini: JSON not found in response')
      throw new Error('JSON format not found')
    }

    const parsed = JSON.parse(jsonMatch[1])
    const facts: Fact[] = parsed.facts.map((f: any) => ({
      id: f.id,
      text: f.content,
      category: f.title,
      title: f.title
    }))

    console.log(`[v0] Gemini: Generated ${facts.length} facts`)
    console.log('[v0] Gemini: ===== COMPLETE SAJU DATA SENT TO GEMINI 1.5 PRO =====')
    console.log(JSON.stringify(allSajuData, null, 2))
    console.log('[v0] Gemini: ====================================================')

    // 프론트엔드가 기대하는 형식으로 응답 준비
    // freeFacts: 9개 무료 인사이트
    // teaserFacts: 티저 (빈 배열, 유료 서비스에서 사용)
    // submission: 고객 정보 + 사주 데이터 + allSajuData (검증용)
    return NextResponse.json({
      freeFacts: facts,
      teaserFacts: [],
      submission: {
        name,
        sajuData: saju_data
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
