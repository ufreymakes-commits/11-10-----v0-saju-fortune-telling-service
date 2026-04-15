import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

// GPT 프롬프트 생성 - 9문장 구조 (01~09)
async function buildPromptFromSajuData(
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: string,
  sajuData: SajuData
): Promise<string> {
  const birthYear = new Date(birthDate).getFullYear()
  const age = 2026 - birthYear

  // 12운성
  const twelveStarsStr = sajuData.twelveStars
    ? sajuData.twelveStars.map(ts => `${ts.position}(${ts.branch}): ${ts.star}`).join(' / ')
    : '계산 안됨'

  // 길성
  const gilseongStr = sajuData.gilseong
    ? [
      ...sajuData.gilseong.cheonul.map(g => `천을귀인: ${g}`),
      ...sajuData.gilseong.taegeuk.map(g => `태극귀인: ${g}`)
    ].join(' / ') || '해당 없음'
    : '해당 없음'

  // 현재 대운 (나이 기준)
  const currentDaeyun = sajuData.daewoon?.find(d => age >= d.startAge && age < d.endAge)
  const daeyunStr = sajuData.daewoon
    ? sajuData.daewoon.slice(0, 4).map(d => `${d.startAge}~${d.endAge}세: ${d.fullName || d.stem + d.branch}`).join(' / ')
    : '계산 안됨'

  // 연운 (2026)
  const yeonwoon2026 = sajuData.yeonwoon?.find(y => y.year === 2026)
  const yeonwoon2026Str = yeonwoon2026
    ? (yeonwoon2026.fullName || yeonwoon2026.stem + yeonwoon2026.branch)
    : '병오'

  // 오행 기본 점수
  const elementBasic = sajuData.elementBalanceKorean
    ? `목: ${sajuData.elementBalanceKorean.목}점 / 화: ${sajuData.elementBalanceKorean.화}점 / 토: ${sajuData.elementBalanceKorean.토}점 / 금: ${sajuData.elementBalanceKorean.금}점 / 수: ${sajuData.elementBalanceKorean.수}점 (총 120점)`
    : '미계산'

  // 오행 합충 반영 점수
  const elementAdjusted = sajuData.elementBalanceAdjustedKorean
    ? `목: ${sajuData.elementBalanceAdjustedKorean.목}점 / 화: ${sajuData.elementBalanceAdjustedKorean.화}점 / 토: ${sajuData.elementBalanceAdjustedKorean.토}점 / 금: ${sajuData.elementBalanceAdjustedKorean.금}점 / 수: ${sajuData.elementBalanceAdjustedKorean.수}점`
    : '미계산'

  // 오행 개수 (지장간 포함)
  const elementCount = sajuData.elementCount
    ? `목: ${sajuData.elementCount.목}개 / 화: ${sajuData.elementCount.화}개 / 토: ${sajuData.elementCount.토}개 / 금: ${sajuData.elementCount.금}개 / 수: ${sajuData.elementCount.수}개`
    : '미계산'

  // 합충 조정 내역
  const hapChungStr = sajuData.hapChungAdjustments?.length
    ? sajuData.hapChungAdjustments.join('\n    ')
    : '합충 없음'

  // 신살 상세
  const sinsalStr = sajuData.sinsalDetails?.length
    ? sajuData.sinsalDetails.map(s =>
      `${s.name}: ${s.count}/${s.totalPillars} (${s.percentage}%)${s.isStrong ? ' 강함' : ''} - ${s.positions.join(', ')}`
    ).join(' / ')
    : (sajuData.spirits?.join(', ') || '해당 없음')

  // 사주 8글자
  const yearP = sajuData.yearPillar.fullName || sajuData.yearPillar.stem + sajuData.yearPillar.branch
  const monthP = sajuData.monthPillar.fullName || sajuData.monthPillar.stem + sajuData.monthPillar.branch
  const dayP = sajuData.dayPillar.fullName || sajuData.dayPillar.stem + sajuData.dayPillar.branch
  const hourP = sajuData.hourPillar
    ? (sajuData.hourPillar.fullName || sajuData.hourPillar.stem + sajuData.hourPillar.branch)
    : '미상'

  // SAJU_MASTERPIECE_GUIDE를 JSON 문자열로 변환
  const guidelinesContent = JSON.stringify(SAJU_MASTERPIECE_GUIDE, null, 2)

  return `You are a highly educated, wise, and warm American Gen-Z marketer who has thoroughly studied the SAJU_MASTERPIECE_GUIDE below. Generate exactly 9 sections of analysis using the structure provided.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SAJU MASTERPIECE GUIDE (MUST READ & FOLLOW)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${guidelinesContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CLIENT DATA (Reference for All Sections)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name} | Gender: ${gender} | Age: ${age}
Saju: ${yearP} - ${monthP} - ${dayP} - ${hourP}
Day Master: ${sajuData.dayPillar?.stem || ''} (${sajuData.dayMasterKorean || ''})
Day Pillar: ${dayP}
Energy Level: ${sajuData.sinGangSinYak?.grade || 'Unknown'} (${sajuData.sinGangSinYak?.ratio || 0}%)
Life Tier (Gyeok-guk): ${sajuData.gyeokguk || 'Unknown'}
Destiny Element (Yongsin): ${sajuData.eokbuYongsin || 'Unknown'}

Five Elements Score (out of 120): ${elementBasic}
Five Element Count: ${elementCount}
Adjusted Score: ${elementAdjusted}
Combinations: ${hapChungStr}

Ten Gods Present: ${sajuData.tenGods?.present.join(', ') || 'None'}
Ten Gods Missing: ${sajuData.tenGods?.missing.join(', ') || 'None'}
Life Stages (12 Un-seong): ${twelveStarsStr}

Relationships:
- Heavenly Stem Harmony: ${sajuData.cheongganHap?.length ? sajuData.cheongganHap.join(' / ') : 'None'}
- Earthly Branch Harmony: ${sajuData.jijiYughap?.length ? sajuData.jijiYughap.join(' / ') : 'None'}
- Three Harmony: ${sajuData.jijiSamhap?.length ? sajuData.jijiSamhap.join(' / ') : 'None'}
- Four Harmony: ${sajuData.jijiBanghap?.length ? sajuData.jijiBanghap.join(' / ') : 'None'}
- Heavenly Clash: ${sajuData.cheongganChung?.length ? sajuData.cheongganChung.join(' / ') : 'None'}
- Earthly Clash: ${sajuData.jijiChung?.length ? sajuData.jijiChung.join(' / ') : 'None'}
- Harm: ${sajuData.hyung?.length ? sajuData.hyung.join(' / ') : 'None'}
- Break: ${sajuData.pa?.length ? sajuData.pa.join(' / ') : 'None'}
- Punishment: ${sajuData.hae?.length ? sajuData.hae.join(' / ') : 'None'}
- Original Essence (Wonjin): ${sajuData.wonjin?.length ? sajuData.wonjin.join(' / ') : 'None'}

Spirits: ${sinsalStr}
Noble Benefactors: ${gilseongStr}
Empty Points (Gongmang): ${sajuData.gongmang?.join(', ') || 'None'}

Great Fortune (10-Year): ${daeyunStr}
Current Age Fortune: ${currentDaeyun ? currentDaeyun.startAge + '-' + currentDaeyun.endAge + ' age range' : 'Unknown'}
2026 Prediction: ${yeonwoon2026Str}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9 SECTIONS - DETAILED DIRECTIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Section 01. Character Vibe Check (Identity Metaphor)
Directive: By analyzing the Day Master and the highest Adjusted Score, reveal the character metaphor. Metaphorize the Day Master (e.g., 己-Small Land, 庚-Rock) as a natural object, then set the environment (weather/location) based on the element with the highest Adjusted Score (e.g., strong Fire = "Under the Sunlight", strong Water = "Deep Sea at Night"). When the outward personality of the Day Master conflicts with the inner energy (Adjusted Score or element placement), apply the keywords "Hidden Charm" or "Inner Strength, Outer Softness." Consider Day Master, Adjusted Score, and Five Element Count in CLIENT DATA.
Must Include: Main Character Title, Vibe Check, "You are like [Day Master Metaphor] in [Environment]" phrasing.

Section 02. Structural Context (Environmental Dynamics)
Directive: Define the inherent nature of the Day Pillar (e.g., Gi-mi = Dry and solid soil). Analyze the impact of the highest element from the Adjusted Score (caused by Combinations, Heavenly Clash, or Earthly Clash) on the Day Pillar. Describe the "Weight of Life" or the "Overload of Energy" (e.g., high Wealth = Weight of wealth/responsibilities, high Output = Overload of expression). Mention the difficulty of this environment but always present the "Reward/Achievement" (Wealth, Honor, etc.) that comes after overcoming it. Consider Day Pillar, Adjusted Score, Heavenly Clash, and Earthly Clash in CLIENT DATA.
Must Include: Structural Difficulty Analysis, Potential Reward, Environmental Impact.

Section 03. Psychological Logic (Inner Causal Links)
Directive: Connect the Ten Gods Missing and Ten Gods Present to derive psychological characteristics (e.g., Missing Output + Excessive Wealth = Anxiety from obsession with results). Translate Spirits into psychological traits: Original Essence (Wonjin) or Spirits (like Gwi-mun) = "Sensitivity/Insight," Hwa-gae = "Artistry/Solitude," and Yeok-ma = "Desire for Change." Explain how the Day Pillar (the root) helps or requires effort depending on whether it supports the self (Friend/Resource) or consumes power (Output/Wealth/Official). Consider Ten Gods Present, Ten Gods Missing, Spirits, Original Essence (Wonjin), and Day Pillar in CLIENT DATA.
Must Include: "Psychological Logic" mapping, Sensitivity vs. Insight analysis.

Section 04. Actionable Advice (Strategic Solution)
Directive: Transform the Destiny Element (Yongsin) into actual behavior (e.g., Wood = Study/Growth, Fire = External Activity/PR). Define high-intensity Spirits (e.g., Hyeon-chim, Yeok-ma) as the user's "Weapons" (e.g., Hyeon-chim = Professional Technique, Yeok-ma = Global Activity). Provide a "Real-life Remedy" using metaphorical imagery, such as "Building a dam (Earth) to block the wave (Water)," and suggest specific items like certifications, hobbies, or attitudes. Consider Destiny Element (Yongsin) and Spirits in CLIENT DATA.
Must Include: "Behavioral Transformation" of Yong-sin, "Sinsal as a Tool" rule.

Section 05. Social Persona (Rule vs. Freedom)
Directive: Analyze the score and presence of "Gwan-seong" (Official Star) within Ten Gods Present. If "Gwan-seong" is 10~40 (Appropriate), define them as a "Pillar of the Organization" (Civil service, Admin). If 0~9 (Deficient), define them as a "Free Soul" who should avoid rigid hierarchies. If 50+ (Excessive), warn about perfectionism and self-censorship. Focus on the client's "Survival Potential" and "Psychological Comfort" within an organization. Consider Ten Gods Present and Adjusted Score (Career Module) in CLIENT DATA.
Must Include: "Hierarchy vs. Freedom" verdict, Recommended work environment.

Section 06. Career Industry Layer (Field & Function)
Directive: Refer to the highest Adjusted Score to match the "Industry" (Wood=Edu/Startup, Fire=Media/IT, Earth=Real Estate/Consulting, Metal=Medical/Legal, Water=IT/Logistics). Then, use the dominant Ten Gods Present to determine the "Job Function" (Output=Creative/Production, Resource=Planning/Research). Define the role specifically: "You should sail a [Ten Gods Function] ship in the [Element Industry] sea." Consider Adjusted Score, Ten Gods Present, and Life Tier (Gyeok-guk) in CLIENT DATA.
Must Include: Industry (Field) x Function (Role) matching.

Section 07. Reality Check (Wealth & Format)
Directive: Determine the "Work Format" based on the Energy Level: If Strong, recommend Entrepreneur/Freelancer/Independent; if Weak, recommend Organization/System-dependent. For "Wealth Strategy" (Jae-seong), if the score is 10~40, encourage direct wealth capture; if 50+, warn against excessive greed and recommend delegating asset management. Provide a clear "Reality Check" on whether they should be an independent soldier or part of a regular army. Consider Energy Level, Ten Gods Present, and Adjusted Score in CLIENT DATA.
Must Include: "Independent vs. Organization" verdict, Wealth Management strategy.

Section 08. Hero's Scene 01 (Landscape of Existence & Deficiency)
Directive: Compose exactly two sentences for this paragraph. In Sentence 1 (Identity), place the Day Master as the protagonist on the stage of the Day Pillar's environment and describe it like a landscape painting. In Sentence 2 (Deficiency/Excess), declare that Ten Gods Missing or excessive elements are not flaws, but rather the source of the protagonist's unique potential or energy. Frame the "Deficiency" as a poetic positive. Consider Day Master, Adjusted Score, and Five Element Count in CLIENT DATA.
Must Include: "Visual Metaphor" of the Saju 원국, Poetic reinterpretation of 0-point elements.

Section 09. Hero's Scene 02 (Inner Jewel & Promised Season)
Directive: Compose exactly two sentences for this paragraph. In Sentence 1 (Disposition), translate the sensitivity of Spirits or the desires of Ten Gods Present into a "Jewel-like Talent" or "Literary Disposition" rather than a struggle. In Sentence 2 (Future), use Destiny Element (Yongsin), Noble Benefactors, and 2026 Prediction to metaphorize the upcoming luck as a "Promised Season" or the "Appearance of a Benefactor," ending with a soulful confirmation of success. Consider Spirits, Ten Gods Present, Destiny Element (Yongsin), Noble Benefactors, Great Fortune (10-Year), Current Age Fortune, and 2026 Prediction in CLIENT DATA.
Must Include: "Inner Talent" metaphor, Confident finale about the "Season of Success."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: Respond ONLY with valid JSON wrapped in triple backticks. No extra text.

\`\`\`json
{
  "facts": [
    {"id": 1, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 2, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 3, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 4, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 5, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 6, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 7, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 8, "title": "[Section Title]", "content": "[1-2 sentences following directive]"},
    {"id": 9, "title": "[Section Title]", "content": "[1-2 sentences following directive]"}
  ]
}
\`\`\``
}

// AI를 통한 9개 팩트 생성
async function generateFactsFromAI(
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: string,
  sajuData: SajuData
): Promise<Fact[]> {
  const prompt = await buildPromptFromSajuData(name, gender, birthCountry, birthDate, sajuData)

  console.log('[v0] Prompt generated, length:', prompt.length)

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    prompt,
    temperature: 0.7,
    maxOutputTokens: 2500,
  })

  console.log('[v0] API response received')

  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) throw new Error('JSON format not found')

    const parsed = JSON.parse(jsonMatch[1])
    const facts: Fact[] = parsed.facts.map((f: any, idx: number) => ({
      id: f.id || idx + 1,
      category: f.category || 'unknown',
      title: f.title || '',
      text: f.content || f.text || 'No content'
    }))

    return facts
  } catch (error) {
    console.error('[v0] JSON parse error:', result.text.substring(0, 500))
    return [{
      id: 1,
      category: 'error',
      title: 'Analysis Error',
      text: 'An error occurred while processing your saju analysis.'
    }]
  }
}

// POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { submissionId } = body

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') || 'unknown'

    const supabase = await createClient()

    // DB에서 submission 조회
    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (dbError || !submission) {
      console.error('[v0] DB fetch error:', dbError)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const { name, gender, birth_country, birth_date, saju_data } = submission

    console.log('[v0] Submission loaded:', { name, gender })

    if (!saju_data) {
      return NextResponse.json({ error: 'Saju data missing' }, { status: 400 })
    }

    // Generate fresh AI insights (no cache)
    console.log('[v0] Starting AI generation...')
    const freeFacts = await generateFactsFromAI(name, gender, birth_country, birth_date, saju_data)

    // Teaser facts (locked)
    const teaserFacts = Array.from({ length: 5 }, (_, i) => ({
      id: 10 + i,
      text: 'This insight is locked. Purchase the full report to unlock all 99 facts about your destiny.'
    }))

    return NextResponse.json({
      freeFacts,
      teaserFacts,
      submission: { name, sajuData: saju_data }
    })

  } catch (error) {
    console.error('[v0] generate-free error:', error)
    return NextResponse.json({ error: 'Error generating insights' }, { status: 500 })
  }
}
