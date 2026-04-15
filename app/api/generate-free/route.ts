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

**Section 01. Character Vibe Check (Day Pillar Metaphor)**
Directive: Pull a title using the "Gen Z Text" for the Day Pillar from [SAJU_MASTERPIECE_GUIDE]. Metaphorize the user's situation as a "natural landscape," reflecting the surrounding Five Elements scores (out of 120) to define the character's background in exactly one sentence. Consider 'Day Master','Adjusted Score','Day Pillar' from CLIENT DATA.
Must Include: Main Character Title, Vibe Check, Nature-to-Life Metaphor.

**Section 02. Inner Reversal (The Psychological Conflict)**
Directive: Explain the gap between the outward appearance and the inner self as a "three-dimensional charm" rather than a contradiction. Pinpoint the emotional reality—whether it's deep-sea overthinking (Water excess) or lava-like desire (Fire/Wealth excess)—so the client feels, "This is 100% me". Consider 'Day Master', 'Heavenly Stem Harmony', 'Ten Gods Present', 'Five Element Count','Punishment', 'Original Essence (Wonjin)' in CLIENT DATA.
Must Include: "Hidden Shadow (The Twist)" style, "Low-key/High-key" phrasing.

**Section 03. Energy Stat Analysis (10 Gods Lore)**
Directive: Describe the highest and lowest "10 Gods" scores like video game stats, highlighting the user's "cheat-code-level talents". Use the "12 Stages of Life" (12 Un-seong) to strategically analyze if their current energy is in its "prime" (Imperial/Cap) or a "restructuring phase" (Death/Grave). Consider 'Ten Gods Present', 'Ten Gods Missing', 'Life Stages', 'Energy Level' in CLIENT DATA.
Must Include: "Secret Lore (Technical Saju)" terminology, "Stat" metaphors.

**Section 04. Micro-Action for a "God-Tier" Life (Remedy)**
Directive: Provide highly specific, actionable behavioral guidelines to fill the missing energies. Utilize the [Remedy/Action Guidelines] from [SAJU_MASTERPIECE_GUIDE] to suggest a "small win" that can immediately turn their life in a positive direction. Consider 'Destiny Element','Adjusted Score', 'Empty Points (Gongmang)' in CLIENT DATA.
Must Include: "Micro-Action Practicality" rule (e.g., specific time routines, item usage).

**Section 05. Social Persona (Gyeok-guk DNA)**
Directive: Explain the "Social License" granted by the world based on the Month Branch (Gyeok-guk). Interpret any changes caused by Clashes or Harmonies as a "hidden ultimate move" that even the client didn't know they had, making them feel proud of their social role. Consider 'Life Tier (Gyeok-guk)', Relationships (especially Clash/Harmony) in CLIENT DATA.
Must Include: Modern career translation of Gyeok-guk terms (e.g., Proper Resource -> Professional Knowledge Licenser).

**Section 06. Career Industry Layer (Elemental Matching)**
Directive: Refer to CAREER_MODULE in [SAJU_MASTERPIECE_GUIDE] to pinpoint the industry and work format (Business vs. Organization) where the client naturally shines. Suggest categories so specific that the client reacts with, "Chills... that's exactly what I've been interested in lately!". Consider 'Life Tier (Gyeok-guk)', 'Ten Gods Present', 'Adjusted Score', 'Spirits' in CLIENT DATA.
Must Include: "By any chance, aren't you interested in this (Industry) as a (Role)?" phrasing.

**Section 07. Reality Check (Deficiency Risk)**
Directive: Warn them about potential mistakes caused by deficient (0 pts) or excessive energies like a blunt friend. Ensure the tone isn't a "label" but a vibe of "fix this one thing and you're invincible," framing risks as the "last puzzle piece for success". Consider 'Ten Gods Missing', 'Relationships', 'Adjusted Score', 'Energy Level' in CLIENT DATA.
Must Include: "Reality Check" interjection, "Red Flag" terminology.

**Section 08. Current Fortune Update (Dae-un Vibe)**
Directive: Combine the energies of the 10-year Great Fortune (Dae-un) and the Yearly Fortune (Se-un) to identify the current "season". Use the Gen Z terminology from [SAJU_MASTERPIECE_GUIDE] to frame hard times as "hardcore quests for leveling up" and good times as "God-Mode buffs". Consider 'Great Fortune (10-Year)', 'Current Age Fortune', '2026 Prediction', 'Heavenly Clash', 'Earthly Clash' in CLIENT DATA.
Must Include: "God-Mode Activated," "Season Update" terminology.

**Section 09. Hero's Journey (Life Theme)**
Directive: Bind the essence of the Day Pillar with their strongest positive energy (Noble Benefactor/Yong-sin) to elevate their life into a "Great Journey". End with a soul-stirring sentence that makes them fall in love with themselves, emphasizing that they are "already more than enough". Consider 'Noble Benefactors', 'Day Master', 'Adjusted Score' in CLIENT DATA.
Must Include: "Hero's Journey Outro" style, an emotional/inspiring finale.

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
