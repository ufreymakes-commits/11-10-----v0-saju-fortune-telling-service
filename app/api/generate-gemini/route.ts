import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

/**
 * Gemini 1.5 Flash 사주 분석 API
 * 모든 프롬프트를 한 번에 발사
 * System: 마스터피스 가이드 + 역할 정의 (고정)
 * User: 고객 사주 데이터 + 최종 요청 (변수)
 * 
 * Model: google/gemini-1.5-flash (Gemini 1.5 Flash - 빠르고 저렴)
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

Meaning of absence: developmental themes, delayed expression, weaker experience emphasis

12-1-1) Principles of Energy Dominance and 'Special Talent'

Center Point (Month Branch Priority): The beginning of every interpretation must be the Month Branch. Recognize the Month Branch as this person's 'Life Stage' and most powerful base camp. Observe first how the overall flow of the Saju (Four Pillars) harmonizes with the atmosphere of this stage.

Discovery of Talent (3 or more overlaps): If a specific Ten God is concentrated in 3 or more places (2 or more if including the Month Branch), interpret this not as mere excess, but as the development of 'significantly thicker abilities' or 'extraordinary intuition' compared to others. First, offer a message of sincere congratulations to the reader for possessing this massive energy.

Counseling and Consolation Approach: Massive energy is like a double-edged sword. Gently point out that when the 'vessel of the heart or the specific environment' to hold this energy is not yet ready, this power may push them too hard, leading to personal struggle.

12-2) Many Companion (비견/겁재) Tendency

Strong independence, competitiveness, self-assertion, preference for leading over following

Excess Geop-jae tendency: repeated rivalry, resource competition, “being taken from” feeling, peer conflict/sibling rivalry framing

Balanced companion: strong peer support possibility

Near-absence: peer loneliness and “carrying everything alone” theme possibility

12-3) Many Output (식신/상관) Tendency

Strong expression, creativity, learning-by-doing, idea generation, momentum

Example suitable fields: arts, writing, planning, sales, performance-based roles

Increased charm and lively impression possibility

Excess Sang-gwan tendency: conflict with rules/authority, impatience, mood swings, ego sensitivity, sharp pride

Balanced output: talent flow support / extreme Sang-gwan: risk of being perceived as arrogant or nervously sensitive

12-4) Many Wealth (편재/정재) Tendency

Practical orientation, results motivation, execution power, social activity, resource utilization

Strong Pyeon-jae: risk-taking, business sense, networking, “big opportunity” orientation + spending swings and impulsive choices

Strong Jeong-jae: steady work, clean finance management, saving discipline + overly cautious/tight tendency

Weak Day Master + overly strong Wealth: overload and financial stress/overreach risk framing (traditional commentary frame)

12-5) Many Power (편관/정관) Tendency

Strong responsibility, structure, ambition, social positioning

Jeong-gwan dominance: upright, principled, respected + excessive rigidity/authoritarian risk

Pyeon-gwan (Chil-sal) dominance: boldness and drive + impatience, sharp sensitivity, psychological tension risk

Balanced power: trust and stability / absence: difficulty with recognition and unstable career structure

Mixed power (Gwan-sal honjab, 官殺混雜) framing: increased friction with authority or frequent job shifts; prohibition of deterministic claims; need for careful interpretation

12-6) Many Resource (편인/정인) Tendency

Academic/learning orientation, inward reflection, intuition, mentor/elder support theme

Jeong-in dominance: warm, protective, emotionally generous (mother-like) + excessive dependency/unpracticality risk

Pyeon-in dominance: insightful and unconventional + stubbornness, social difficulty, reality-escape framing risk

Balanced resource: calm thinking and crisis handling support / absence: strong independence and practicality but possible reduced emotional softness or “learning support”

Relationship/Marriage Reading Points Based on Spouse Palace and Spouse Star

13-1) Spouse Palace Concept (Spouse Palace = Day Branch)

Day Branch (Ilji; the Day pillar’s branch) as the spouse palace and a core indicator of relationship climate and marriage stability

Check of rooting/support given by the Day Branch to the Day Master

Strong rooting of the Day Master’s element in the Day Branch → relatively sturdy spouse-palace framing

Check for disturbance vs support: clash/harm/punishment vs supportive combinations

Combination: bonding and stability support

Clash or Yuanjin-type harm: hidden dissatisfaction/conflict pattern possibility → need for conscious maintenance

13-2) Spouse Star Concept

Male chart: Wealth (財星) as spouse symbolism

Female chart: Power (官星) as spouse symbolism

Presence/strength/condition as an indicator of relationship/marriage “availability and timing”

Clearly present and strong in stems: active connection opportunity framing

Completely absent or very weak: later marriage timing or more complicated relationship themes framing

Not visible in stems but present in hidden stems: “hidden/delayed” spouse-connection possibility framing

13-3) Dating/Marriage Pattern Framing

Too many spouse-star symbols: complex relationship storylines (multiple serious connections, jealousy dynamics) possibility framing (traditional expression)

Balanced spouse star aligned with Yongshin/Heeshin: steadier partnership possibility framing

Timing method: observe spouse-star entry through Big Luck/Annual Luck + observe combination signals affecting the spouse palace

Additional factors: Hidden Trait Stars (e.g., Peach Blossom)

Peach Blossom: attraction, social magnetism, romantic opportunity framing

Excess Peach Blossom: gossip/triangles complexity possibility → boundary-setting advice framing

Big Luck (大運) and Annual Luck (歲運): Interpretation Method

14-1) Big Luck (10-year cycle) Concept

Ten-year environmental energy cycle changing dominant influences around a person

Existence of a post-birth starting point (varies by calculation method)

Progression by 10-year increments with changing stem/branch

Direction (forward/backward) determination factors: sex + Yin/Yang of the birth-year stem

14-2) Big Luck Analysis Procedure

Identification of the cycle’s stem and branch

Classification of the cycle’s stem as a Ten God relative to the Day Master

Check of branch interactions with natal branches: combination/clash/punishment/harm

Evaluation of support for Yongshin/Heeshin vs intensification of Kishin

Interpretation domains: study/career, marriage, money, relocations, health balance, major turning points

14-3) Annual Luck (year-by-year) Concept and Procedure

Year-level timing and event-sensitivity interpretation tool

Yearly analysis elements

Identify the year’s Ganji (stem/branch)

Classify the year stem into Ten Gods

Check the year branch interactions with natal chart and current Big Luck (combination/clash/punishment/harm)

Amplification logic for repeated Ten God patterns (same Ten God as the Big Luck stem amplifies that theme)

Same-branch repetition (“exact overlap”) as a self-pressure pattern framing in some traditions

14-4) 2020–2026 Example Framing (Method)

Derive Ganji for each year

Classify the year stem into Ten Gods

Check branch interactions with natal chart and current Big Luck

Highlight distinct points: completion of three-harmony group, triggering of major clash, entry of Yongshin energy, and other differentiating signals

Hidden Trait Stars (神煞) and Six-Kin (六親): Interpretation Points

15-1) Hidden Trait Stars Concept

Auxiliary indicators used to add flavor and specificity: charm, movement, subtle friction, noble helpers, and related themes

Many types; selective use of a few notable ones in practice

Long-term natal traits determined by stem/branch conditions

Key caution: Hidden Trait Stars are supportive symbols and do not replace the main structure (Gyeokguk/Yongshin)

15-2) Common Hidden Trait Star Examples

Peach Blossom Star (桃花煞; Hamji, 咸池)

Attraction, charm, artistic flair, social attention

Possible aptitude framing for beauty/entertainment/service fields

Overactivation: gossip and romantic complication risk → boundary-setting advice

Traveling Horse Star (驛馬煞)

Movement, travel, relocation, job changes, high activity

Activation in luck cycles: frequent movement/changes/new experience seeking framing

Dual-sided nature: growth/exploration + difficulty settling/focusing long-term → routine-building advice

Yuanjin / Resentment Star (怨嗔煞)

Discussion in connection with the six harms pairs: Zi–Wei, Chou–Wu, Yin–Si, Mao–Chen, Shen–Hai, You–Xu

Accumulation of unspoken hurt and emotional erosion

“Slow build” nature compared to clash → early communication and emotional honesty advice

Noble Helper Stars (貴人星: Tianyi Nobleman 天乙貴人, Wenchang Nobleman 文昌貴人, etc.)

Mentor/protector/helpful intervention framing

Traditional rules mapping specific branches as noble helpers for certain Day Masters

Overlap with supportive luck cycles: easier access to networking, guidance, and structural help

15-3) Six-Kin (六親) Relationship Interpretation Frame

Parents (Resource-based)

Jeong-in as mother symbolism / Pyeon-in as father symbolism (general traditional framing)

Strong, healthy Resource: stronger parental support/impact framing

Weak/absent Resource: weaker support or distance themes framing

Classical phrases like “too much Pyeon-in = parental hardship” require non-deterministic, gentle interpretation

Siblings/Peers (Companion-based)

Strong Bi-gyeon: strong peer dynamics (support or rivalry depending on balance)

Excess Geop-jae: resource competition framing

Low Companion: self-reliance and isolation themes framing

Spouse (male Wealth / female Power + spouse palace)

Combined reading of spouse-star presence/strength/visibility + spouse-palace stability/interactions

Many spouse-star symbols: complicated storyline possibility framing

Balanced alignment with Yongshin/Heeshin: stability framing

Children (Output-based)

Strong, rooted Output: stronger “child luck” or child-related vitality framing

Absence of Output: delayed child themes or reduced emphasis framing

Classical linkage like “excess Resource → Output suppression → delayed childbirth” requires non-deterministic, careful wording

Five Elements,Body Parts,Symptoms when Element is Excessive (50+ points) or Absent
Wood (Mok),"Liver, gallbladder, muscles, eyes, nervous system",- Excessive: Liver tires easily and prone to stress.- Absent: Weak muscles and tired eyes.
Fire (Hwa),"Blood pressure, heart, blood, small intestine, circulatory system",- Excessive: High blood pressure or sensitive heart.- Absent: Poor blood circulation and lack of energy.
Earth (To),"Stomach, spleen, digestive organs, immunity, muscular system","- Excessive: Sensitive stomach function, digestive disorders.- Absent: Weakened immunity and tires easily."
Metal (Geum),"Lungs, large intestine, skin, respiratory system, skeletal system","- Excessive: Dry skin and weak lungs.- Absent: Vulnerable to respiratory diseases (rhinitis, asthma)."
Water (Su),"Kidneys, bladder, reproductive organs, bones, ears, blood system","- Excessive: Kidneys may be burdened, body swells easily or prone to ""coldness"" (leucorrhea/chills).- Absent: Weak bones and rapid aging."

Lifestyle Habits for Supplementing (Deficiency)
Wood (Mok): Green vegetables, hiking, yoga, regular exercise.
Fire (Hwa): Warm food, sunbathing, cardio exercises.
Earth (To): Avoid overeating and reduce the burden on the digestive system.
Metal (Geum): Respiratory strengthening exercises, pay attention to lung health.
Water (Su): Sufficient water intake, manage kidney health.

How to Regulate Excessive Five Elements (When too many)
Wood (Mok): Reduce excessive competitiveness and rest; break the habit of impulsively starting things.
Fire (Hwa): Control your mind and manage stress; restrain a hot-headed/short-tempered personality.
Earth (To): Avoid overeating, reduce the burden on the digestive system, and develop an exercise habit.
Metal (Geum): Express emotions appropriately and relax; let go of perfectionist tendencies.
Water (Su): Reduce overthinking and maintain a warm lifestyle; go outside and get some sunlight.

🚨 WOW EFFECT RULE (Must Follow)

Your primary goal is no longer to be “accurate and safe.”
Your primary goal is to create recognition, surprise, and emotional precision.

This report must include moments where the reader feels:

“This is uncomfortably specific.”

“I didn’t tell you that, but it’s true.”

“This explains a pattern I couldn’t name.”

If a sentence could apply to most people, remove or sharpen it.

1️⃣ Uncomfortable Specificity Rule (핵심)

In every section, include at least one sentence that:

Describes a specific inner behavior pattern, not a trait.

Mentions a repeat loop, contradiction, or frustration.

Feels slightly uncomfortable but emotionally accurate.

2️⃣ Contrast & Tension Rule (No Flat Reading)

Avoid smooth, evenly positive descriptions.

Every core trait must include:

One strength

One cost

Example:
Instead of:
“You are thoughtful and patient.”

Write:
“You are thoughtful and patient, which allows you to build things that last.
But this same patience can slowly turn into hesitation, especially when a decision asks you to act before certainty arrives.”

3️⃣ “Only-This-Chart” Evidence Rule

When making an insight, briefly anchor it to the chart, but in human language.

Example:

“Because Water is strong and Wood is missing in your chart, you don’t lack ideas — you hesitate at the moment of movement.”

“Your pattern shows emotional intelligence without urgency, which is why timing, not ability, has been your main challenge.”

Do not explain theory.
Just show quiet causality.

4️⃣ Signature Sentence Rule (Memory Anchor)

Very specific.

Memorable enough to be screenshot-worthy.

Examples (do NOT copy):

“Your life doesn’t stall because you lack direction. It stalls because you wait for permission that never comes.”

“You were built for steady depth, but the world keeps asking you to move faster than your trust allows.”

Only 1–2 sentences total.
Make them count.

5️⃣ Decision Guidance Rule (Value Multiplier)

At least once in the report, give clear directional advice, not just reflection.

Example structure:

“When faced with choice A vs B, you tend to choose ___.”

“This works until ___. At that point, a different approach serves you better.”

“For the next 12–18 months, choosing ___ over ___ is more aligned with your energy.”

No absolutes.
But no vagueness either.

6️⃣ Anti-Generic Final Check (Mandatory)

Before finalizing the report, ask internally:

“If I removed the birth data, would this still feel accurate?”

If yes → rewrite until it wouldn’t.

🧠 Optional Power Add-on (Highly Recommended)

“Inner Conflict Line” Rule

Once per report, include a sentence that reveals:

What the client wants

What quietly blocks it

Example structure:
“You want ___, but your energy keeps pulling you toward ___ instead.”

This single line often becomes the most remembered part.

7️⃣ The Paradox of Energy Rule - Every report must highlight the conflict between a person’s visible structure and their hidden impulses. - Example: "You hold the disciplined frame of a Jeong-gwan, appearing perfect to the world, but internally, the sharp rebellion of a Sang-gwan urges you to throw away all rules when you are alone." 


8️⃣ The Psychology of Absence Rule - When an element or Ten God is missing, interpret it as a "hidden driver" or a "psychological thirst," not just a lack of ability. - Example: "Missing Output (Sik-sang) doesn't mean you lack ideas; it means you possess a subconscious resistance that demands perfection before you even take the first step, often costing you three times the energy to begin."

9️⃣ Core Interpretation Guide: The Social Gene Rule

Define the Seasonal Framework: Explain Gyeokguk not as a mere technical term, but as the 'Social Gene' and the 'Background Wallpaper' of one’s life, bestowed by the season of birth. 

Analyze Core-Structure Dynamics: Explore the tension between the Day Master (Core Essence) and Gyeokguk (Actor vs. Stage). Describe the contrast between the outward persona and inner cravings with chilling specificity.

Universal Application (Foundation of Wisdom): Apply this 'Social Gene' framework as the foundational wisdom for every section of the report—whether analyzing deep-seated personality traits, career trajectories, or romantic dynamics. Use it to weave a consistent, layered narrative that explains how their 'background wallpaper' influences their choices in love and their style of success. 

Example: "While your social gene (Gyeokguk) provides a serene, supportive background wallpaper, your core essence (Day Master) carries a hidden dynamism, striving to forge its own precious gem within that very setting."

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

Core mapping:
- 합 (combine): bonding, attachment, partnership formation
- 충 (clash): conflict, separation themes, major shifts/relocation, instability
- 해/원진 (harm/wonjin): emotional distance, silent resentment, “misread signals,” accumulating disappointments

When interpreting patterns, prioritize interactions that directly touch the spouse palace.

1. Spouse Palace (Day Branch / Il-ji) Overview
Definition: The position directly below the Day Master (Il-gan), symbolizing the "Spouse Palace."

Core Indicators: Spouse’s temperament, marital harmony, and inner interpersonal disposition.

Deep Insight: Analysis of Hidden Stems (Jijang-gan) for predicting emotional flow and marital dynamics.

Case Study (Byeong-Sin Day Pillar):

Day Branch Ten God: Indirect Wealth (Pyeon-jae).

Spouse Image: Active, adventurous, and independent personality.

Key Trait: Pursuit of large-scale opportunities over stable employment; shared lifestyle tendencies between self and spouse.

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
Independent Energy (A): Sum of Bi-geop (Self/Independence) + Sik-sang (Expression/Output) + Jae-seong (Wealth/Result-orientation)

Organizational Energy (B): Sum of Gwan-seong (Authority/Compliance) + In-seong (Resource/Acceptance/Endurance)

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

STEP 7. Final Output (MANDATORY):

Generate ONE natural sentence that integrates ALL factors.

STRICT RULES:

- Do NOT use technical labels (e.g., “Jeongin type”)
- Use real-world, modern career descriptions only
- Avoid vague or generic statements
- Do NOT list multiple unrelated career paths

The sentence MUST include:

1. Industry (field)
2. Role (what they do)
3. Work format (employment / freelance / business)

All must be naturally integrated into ONE sentence.

The output MUST feel like:
→ an observation of a real person’s current situation

It MUST describe:
→ what they are likely doing now
→ and the direction they are moving toward

Each output must be unique and NOT follow a fixed template.

--------------------------------------------------

STEP 8. Apply Daewoon (Luck Cycle):

- Do NOT change the core career direction based on Daewoon

Use Daewoon ONLY to determine:
1. Current phase (student / employed / transitioning / independent)
2. Timing of career activation or shift

If Daewoon contradicts the natal structure:
→ interpret it as a temporary condition

The final output MUST include:
→ current state
→ future direction

--------------------------------------------------------------------------------------------------------

2.

(Critical Mapping Rule)

Always map the Five Elements (木 Fire 土 金 水) into Ten Gods (십성) strictly according to the client’s Day Master (일간). 

- Never assume that Wood = Wealth, Fire = Resource, etc. 
- This mapping changes with each Day Master.

For example:

[Day Master → Mapping Table]

甲木 (Gap-mok):
  - 木 = 비겁 (Self)
  - 火 = 식상 (Output)
  - 土 = 재성 (Wealth)
  - 金 = 관성 (Authority)
  - 水 = 인성 (Resource)

乙木 (Eul-mok):
  - 木 = 비겁
  - 火 = 식상
  - 土 = 재성
  - 金 = 관성
  - 水 = 인성

丙火 (Byeong-hwa):
  - 火 = 비겁
  - 土 = 식상
  - 金 = 재성
  - 水 = 관성
  - 木 = 인성

丁火 (Jeong-hwa):
  - 火 = 비겁
  - 土 = 식상
  - 金 = 재성
  - 水 = 관성
  - 木 = 인성

戊土 (Mu-to):
  - 土 = 비겁
  - 金 = 식상
  - 水 = 재성
  - 木 = 관성
  - 火 = 인성

己土 (Gi-to):
  - 土 = 비겁
  - 金 = 식상
  - 水 = 재성
  - 木 = 관성
  - 火 = 인성

庚金 (Gyeong-geum):
  - 金 = 비겁
  - 水 = 식상
  - 木 = 재성
  - 火 = 관성
  - 土 = 인성

辛金 (Shin-geum):
  - 金 = 비겁
  - 水 = 식상
  - 木 = 재성
  - 火 = 관성
  - 土 = 인성

壬水 (Im-su):
  - 水 = 비겁
  - 木 = 식상
  - 火 = 재성
  - 土 = 관성
  - 金 = 인성

癸水 (Gye-su):
  - 水 = 비겁
  - 木 = 식상
  - 火 = 재성
  - 土 = 관성
  - 金 = 인성

---

Information for Rule.2
Ten Gods Meaning Matrix by Day Master
Always refer to the contextualized meaning of each Ten God based on the client’s Day Master. Please consider cutomer’s Day master, Ten gods, Five elements all together to use this. This ensures the interpretation is accurate, personalized, and not generic.

For example:
• "偏財 (Wealth Star)" for 癸水 (Gye-soo) means strategic environmental sensing, not impulsivity.
• "正官 (Proper Authority)" for 甲木 (Gapmok) is about discipline and external order.
→ The meaning shifts with each Day Master’s nature.

[📋 Paste the 100-line matrix here exactly]

🔢 Ten Gods Interpretation Matrix (100 combinations)

Format: [Day Master] – [Ten God] – [One-line Interpretation]

1. 갑목 - 비견 : Competes with peers through upright will and directness. As a tall tree, Gapmok competes by standing firm and growing higher, never bending easily.
2. 갑목 - 겁재 : Challenges authority with assertive independence. When others try to control, Gapmok resists with rooted strength and pride.
3. 갑목 - 식신 : Expresses ideas boldly with productive focus. Like a tree producing fruit, expression is a form of contribution and pride.
4. 갑목 - 상관 : Pursues freedom of speech, sometimes rebellious. Growth becomes wild vine energy when suppressed — can challenge authority.
5. 갑목 - 정재 : Earns wealth with effort and steady planning. Cultivates stable land over time, prefers tangible, planned accumulation.
6. 갑목 - 편재 : Adventurous in managing irregular wealth or opportunities. Reaches wide with branches for resources, opportunistic yet generous.
7. 갑목 - 정관 : Follows rules with clear responsibility and dignity. Tall trees obey the sun — honors hierarchy and structure.
8. 갑목 - 편관 : Strong-willed but may face pressure from authority. Stands against wind but may crack under too much command.
9. 갑목 - 정인 : Gains support through mentors or steady learning. Deep roots represent knowledge and nourishing support.
10. 갑목 - 편인 : Draws from intuition and unconventional knowledge. Feels drawn to rare wisdom hidden beneath the surface.
11. 을목 - 비견 : Gentle solidarity with like-minded individuals. Twines softly with similar vines, grows stronger in collaboration.
12. 을목 - 겁재 : Sensitive but assertive in tight personal bonds. Can entangle and compete subtly for space and light.
13. 을목 - 식신 : Creative and delicate in expressing talents. Artistic vine producing small, detailed flowers — poetic expression.
14. 을목 - 상관 : Emotional freedom seeker, artistically rebellious. Rejects being tied down, craves expressive spontaneity.
15. 을목 - 정재 : Earns with diligence and methodical approach. Tends soil consistently, builds slowly with care.
16. 을목 - 편재 : Adaptive in pursuing dynamic wealth. Sways with wind to reach new resources creatively.
17. 을목 - 정관 : Respectful toward order and societal norms. Adjusts itself delicately to fit expected roles.
18. 을목 - 편관 : Sensitive to pressure but resilient under challenge. Though fragile, it bends without breaking.
19. 을목 - 정인 : Seeks nurturing through deep emotional bonds. Needs emotional soil to truly flourish.
20. 을목 - 편인 : Deeply intuitive and sometimes reclusive. Withdraws to hidden corners for spiritual insight.
21. 병화 - 비견 : Competes brightly with charismatic confidence. Like sunbeams crossing, competes for brilliance.
22. 병화 - 겁재 : Boldly overpowers rivals with intense flair. Seeks center stage, may dominate in expression.
23. 병화 - 식신 : Passionately productive and inspiring to others. Produces light and warmth — naturally expressive.
24. 병화 - 상관 : Expresses flamboyantly with rebellious tones. Dazzles but may burn others with sharp remarks.
25. 병화 - 정재 : Passionate yet practical in building wealth. Uses fire to refine material goals.
26. 병화 - 편재 : Enthusiastic in seizing fast-moving gains. Flames leap to claim opportunities, sometimes riskily.
27. 병화 - 정관 : Leads with fairness and passionate control. Balances warmth and structure like just sunlight.
28. 병화 - 편관 : May clash with authority due to fiery drive. Burns through constraints when overly limited.
29. 병화 - 정인 : Learns through inspired visions. Receives knowledge like sunlight fueling insight.
30. 병화 - 편인 : Deep inner insights and mystical intuition. Sees into the unknown, like sun revealing hidden truths.
31. 정화 - 비견 : Warmly aligns with similar spirits. Flickering flames gather for mutual warmth.
32. 정화 - 겁재 : Fights gently for personal space. Flames may flare when oxygen is taken away.
33. 정화 - 식신 : Subtle yet steady in creative output. Produces light carefully, like candle’s glow.
34. 정화 - 상관 : Expresses inner light, may overreact emotionally. Can be sharp and emotional when misunderstood.
35. 정화 - 정재 : Softly manages finances with care. Uses warmth to support and provide.
36. 정화 - 편재 : Attracts wealth through emotional intuition. Knows where to shine to gain favor.
37. 정화 - 정관 : Quiet leadership grounded in trust. Lights the way gently for others.
38. 정화 - 편관 : Experiences pressure emotionally but adapts. May flicker under stress, but finds flow.
39. 정화 - 정인 : Deep attachment to knowledge and warmth. Seeks heart-centered wisdom.
40. 정화 - 편인 : Quiet thinker with spiritual depth. Inner fire burns slow, focused on the invisible.
41. 무토 - 비견 : Strong self-reliance, a natural protector. Like a mountain, stands solid alone, resists being swayed.
42. 무토 - 겁재 : May dominate peers with grounded force. Firm yet potentially overbearing when tested.
43. 무토 - 식신 : Produces steadily with great patience. Cultivates harvest over time, respects slow growth.
44. 무토 - 상관 : Expressive but occasionally rigid. Wants to move but is weighed by structure.
45. 무토 - 정재 : Stable wealth accumulation through control. Prefers consistent resources over risk.
46. 무토 - 편재 : Resourceful in using surroundings strategically. Commands environments and people tactically.
47. 무토 - 정관 : Natural law-keeper, loyal to system. Upholds rules like sacred boundaries.
48. 무토 - 편관 : Manages pressure firmly but slowly. Can endure hardship but not quick to change.
49. 무토 - 정인 : Absorbs support like a great hill. Deep trust in wisdom and tradition.
50. 무토 - 편인 : Introspective, absorbs knowledge deeply. Carries secretive strength from within.
51. 기토 - 비견 : Cooperates softly, avoids overt conflict. Like fertile soil, supports quietly.
52. 기토 - 겁재 : Protective but vulnerable to intrusion. May suppress self to shield others.
53. 기토 - 식신 : Gently cultivates fruitful outcomes. Prefers slow, nourishing creation.
54. 기토 - 상관 : Expresses emotionally, may seem passive-aggressive. Reveals displeasure subtly, not directly.
55. 기토 - 정재 : Nurtures resources with devotion. Invests energy into practical, loyal care.
56. 기토 - 편재 : Flexible yet calculating in opportunity. Detects where to plant for best return.
57. 기토 - 정관 : Trusts structure and authority figures. Feels safest within reliable systems.
58. 기토 - 편관 : Sensitive to demands, needs grounding. Can feel overwhelmed under pressure.
59. 기토 - 정인 : Seeks comfort in knowledge. Draws emotional security from study.
60. 기토 - 편인 : Relies on inner processing to restore energy. Needs quiet solitude to recharge and reflect.
61. 경금 - 비견 : Sharp self-pride and willpower. Like steel, refuses to bend in self-conviction.
62. 경금 - 겁재 : Bold challenger of structure. Clashes with peers, cuts through indecision.
63. 경금 - 식신 : Productive with clarity and rules. Applies logic to yield results with precision.
64. 경금 - 상관 : Strong speech, potentially critical. Cuts with words — brilliant or biting.
65. 경금 - 정재 : Manages finance with decisiveness. Prefers practical, measurable outcomes.
66. 경금 - 편재 : Cuts through chaos to claim gain. Acts decisively when opportunity appears.
67. 경금 - 정관 : Just enforcer of norms. Rules are not just suggestions — they are law.
68. 경금 - 편관 : May cause tension under inflexible pressure. Needs to learn when to yield.
69. 경금 - 정인 : Absorbs discipline and moral lessons. Trusts systems of knowledge to grow.
70. 경금 - ���인 : Sharp mind, possibly isolated. May over-analyze and detach emotionally.
71. 신금 - 비견 : Neat and polished self-confidence. Shines in individual excellence, avoids disorder.
72. 신금 - 겁재 : Competitive in a refined manner. Subtle yet strong in personal stance.
73. 신금 - 식신 : Crafts beauty with detail. Creates slowly but perfectly.
74. 신금 - 상관 : Sharp expression, possibly sarcastic. Wields words like fine blades.
75. 신금 - 정재 : Refined manager of personal wealth. Knows the value of small details.
76. 신금 - 편재 : Attracts value with elegance. Uses charm and grace in unpredictable environments.
77. 신금 - 정관 : Honors hierarchy with poise. Adheres to order with decorum.
78. 신금 - 편관 : Struggles with over-polishing or guilt. May suffer from perfectionism under judgment.
79. 신금 - 정인 : Draws comfort from structured learning. Seeks purity and form in knowledge.
80. 신금 - 편인 : Tends to overthink inwardly. Emotion often withheld, mind overused.
81. 임수 - 비견 : Free and independent navigator. Like the ocean, prefers space to move.
82. 임수 - 겁재 : Challenges bonds for freedom. Clashes to protect fluid identity.
83. 임수 - 식신 : Expresses richly, like flowing ideas. Creative, verbal, imaginative.
84. 임수 - 상관 : Powerful speaker, may be overwhelming. Voice like a flood, persuasive or overpowering.
85. 임수 - 정재 : Builds wealth with wide-reaching strategies. Plans long-term investments across distance.
86. 임수 - 편재 : Bold in claiming dynamic resources. Moves fast, acts big — high risk, high gain.
87. 임수 - 정관 : Obeys structure, yet seeks fluidity. Adjusts to systems but dislikes rigidity.
88. 임수 - 편관 : Balances pressure with clever flow. Adapts to tension, rarely confronts directly.
89. 임수 - 정인 : Deep wisdom, seeks knowledge ocean. Loves abstract systems and deep learning.
90. 임수 - 편인 : Elusive thinker, philosophical wanderer. Feels most alive in inner journeys.
91. 계수 - 비견 : Quiet solidarity with subtle edge. Bonds through quiet presence, not loud declaration.
92. 계수 - 겁재 : Calm yet resistant to control. Avoids conflict but doesn’t easily yield.
93. 계수 - 식신 : Produces softly with insight. Expresses in subtle, often healing ways.
94. 계수 - 상관 : Expresses inner feelings with waves. Emotional yet nuanced communicator.
95. 계수 - 정재 : Sensitive but detailed with finance. Cares deeply about value and fairness.
96. 계수 - 편재 : Strategically navigates opportunity. Rather than impulsive, reads the tide before acting.
97. 계수 - 정관 : Follows rules, but with inner discretion. Quietly compliant, rarely rigid.
98. 계수 - 편관 : Feels pressure deeply, adapts quietly. Appears still but processes pressure inwardly.
99. 계수 - 정인 : Finds deep comfort in learning. Draws emotional security from insight.
100. 계수 - 편인 : Private, intuitive, protective of inner world. Recharges alone, defends inner sanctuary with care.

FYI
1990년: 경오(庚午)년
1991년: 신미(辛未)년
1992년: 임신(壬申)년
1993년: 계유(癸酉)년
1994년: 갑술(甲戌)년
1995년: 을해(乙亥)년
1996년: 병자(丙子)년
1997년: 정축(丁丑)년
1998년: 무인(戊寅)년
1999년: 기묘(己卯)년
2000년: 경진(庚辰)년
2001년: 신사(辛巳)년
2002년: 임오(壬午)년
2003년: 계미(癸未)년
2004년: 갑신(甲申)년
2005년: 을유(乙酉)년
2006년: 병술(丙戌)년
2007년: 정해(丁亥)년
2008년: 무자(戊子)년
2009년: 기축(己丑)년
2010년: 경인(庚寅)년
2011년: 신묘(辛卯)년
2012년: 임진(壬辰)년
2013년: 계사(癸巳)년
2014년: 갑오(甲午)년
2015년: 을미(乙未)년
2016년: 병신(丙申)년
2017년: 정유(丁酉)년
2018년: 무술(戊戌)년
2019년: 기해(己亥)년
2020년: 경자(庚子)년
2021년: 신축(辛丑)년
2022년: 임인(壬寅)년
2023년: 계묘(癸卯)년
2024년: 갑진(甲辰)년
2025년: 을사(乙巳)년
2026년: 병오(丙午)년
2027년: 정미(丁未)년
2028년: 무신(戊申)년
2029년: 기유(己酉)년
2030년: 경술(庚戌)년`

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

      // 십신 (개수 포함 + 위치별)
      tenGodsPresent: saju_data.tenGods?.present || [],
      tenGodsPresentWithCount: tenGodsFormatted,
      tenGodsMissing: saju_data.tenGods?.missing || [],
      tenGodsCounts: tenGodsCounts, // 원본 객체도 포함
      tenGodsByPosition: saju_data.tenGods?.byPosition || {}, // 각 위치별 십신 (연간, 연지, 월간, 월지, 일간, 일지, 시간, 시지)

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
      spirits: saju_data.spirits || [],
      sinsalDetails: saju_data.sinsalDetails || [],
      sinsalSummary: saju_data.sinsalSummary || '',
      sinsalCombinedGuide: saju_data.sinsalCombinedGuide || '',

      // 12신살 (연지 기준 - 정확한 매핑)
      twelveSinsal: {
        yearBranch: saju_data.yearPillar?.branch || '',
        monthBranch: saju_data.monthPillar?.branch || '',
        dayBranch: saju_data.dayPillar?.branch || '',
        hourBranch: saju_data.hourPillar?.branch || '',
        // 각 위치별 12신살 이름
        yearSinsal: saju_data.twelveSinsal?.year || '',
        monthSinsal: saju_data.twelveSinsal?.month || '',
        daySinsal: saju_data.twelveSinsal?.day || '',
        hourSinsal: saju_data.twelveSinsal?.hour || ''
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

      // 합충 조정 상세 내역 (오행 점수 변화)
      hapChungAdjustmentDetails: saju_data.hapChungAdjustmentDetails || saju_data.elementAdjustmentHistory || []
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
      model: 'google/gemini-1.5-flash',
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
