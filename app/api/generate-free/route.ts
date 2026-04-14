import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { promises as fs } from 'fs'
import path from 'path'

// 사주 분석 가이드라인 파일 읽기
async function getAnalysisGuidelines(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), 'lib/saju/analysis-guidelines.md/analysis-guidelines1.md')
    const content = await fs.readFile(filePath, 'utf-8')
    console.log('[v0] 가이드라인 파일 로드 성공, 길이:', content.length)
    return content
  } catch (error) {
    console.error('[v0] 가이드라인 파일 로드 실패:', error)
    return ''
  }
}

// Rate Limit 체크 (IP당 하루 N회)
async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ip: string,
  maxRequests: number = 10
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0]

  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('ip_address', ip)
    .eq('request_date', today)
    .single()

  if (!rateLimit) {
    await supabase.from('rate_limits').insert({
      ip_address: ip,
      request_date: today,
      request_count: 1
    })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (rateLimit.request_count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  await supabase
    .from('rate_limits')
    .update({ request_count: rateLimit.request_count + 1 })
    .eq('ip_address', ip)
    .eq('request_date', today)

  return { allowed: true, remaining: maxRequests - rateLimit.request_count - 1 }
}

// 캐시에서 결과 조회
async function getCachedFacts(supabase: Awaited<ReturnType<typeof createClient>>, sajuKey: string): Promise<Fact[] | null> {
  const { data: cache } = await supabase
    .from('saju_cache')
    .select('free_facts, hit_count')
    .eq('saju_key', sajuKey)
    .single()

  if (cache?.free_facts) {
    await supabase
      .from('saju_cache')
      .update({ hit_count: (cache.hit_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('saju_key', sajuKey)
    return cache.free_facts as Fact[]
  }
  return null
}

// 캐시에 결과 저장
async function cacheFacts(supabase: Awaited<ReturnType<typeof createClient>>, sajuKey: string, freeFacts: Fact[]): Promise<void> {
  await supabase.from('saju_cache').upsert({
    saju_key: sajuKey,
    free_facts: freeFacts,
    updated_at: new Date().toISOString()
  }, { onConflict: 'saju_key' })
}

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

  // 사주 분석 가이드라인 MD 파일 읽기
  const guidelinesContent = await getAnalysisGuidelines()

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
      `${s.name}: ${s.count}/${s.totalPillars} (${s.percentage}%)${s.isStrong ? ' ✅강함' : ''} - ${s.positions.join(', ')}`
    ).join(' / ')
    : (sajuData.spirits?.join(', ') || '해당 없음')

  // 사주 8글자
  const yearP = sajuData.yearPillar.fullName || sajuData.yearPillar.stem + sajuData.yearPillar.branch
  const monthP = sajuData.monthPillar.fullName || sajuData.monthPillar.stem + sajuData.monthPillar.branch
  const dayP = sajuData.dayPillar.fullName || sajuData.dayPillar.stem + sajuData.dayPillar.branch
  const hourP = sajuData.hourPillar
    ? (sajuData.hourPillar.fullName || sajuData.hourPillar.stem + sajuData.hourPillar.branch)
    : '미상'

  return `You are a highly educated, wise, and warm American Gen-Z marketer who has thoroughly read the analysis-guidelines1.md file and fully understands Saju (Korean fortune-telling) analysis. You must generate an analysis consisting of nine sections, strictly adhering to the 9 Rules for the "Modern Mystic" Format writing style and the 9-Step Sectional Frame Prompt Instructions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 사주 분석 가이드라인 (필독!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${guidelinesContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 클라이언트 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이름: ${name} | 성별: ${gender} | 나이: ${age}세
사주: ${yearP} - ${monthP} - ${dayP} - ${hourP}
일간: ${sajuData.dayPillar?.stem || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 분석 데이터 (GPT는 이 데이터를 기반으로 분석)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 핵심 정보
- 일간(Day Master): ${sajuData.dayPillar?.stem || ''} (${sajuData.dayMasterKorean || ''})
- 신강/신약: ${sajuData.sinGangSinYak?.grade || '미정'} (${sajuData.sinGangSinYak?.ratio || 0}%)
- 격국: ${sajuData.gyeokguk || '미정'}
- 용신(억부): ${sajuData.eokbuYongsin || '미정'}
- 용신(조후): ${sajuData.johuYongsin || '미정'}

### 오행 분포
- 기본 점수 (120점 기준): ${elementBasic}
- 오행 개수 (지장간 포함): ${elementCount}
- 합충 반영 후: ${elementAdjusted}
- 합충 조정 내역:
    ${hapChungStr}

### 십신 (十神)
- 보유: ${sajuData.tenGods?.present.join(', ') || '없음'}
- 부재: ${sajuData.tenGods?.missing.join(', ') || '없음'}

### 12운성
${twelveStarsStr}

### 관계식
- 천간합: ${sajuData.cheongganHap?.length ? sajuData.cheongganHap.join(' / ') : '없음'}
- 지지육합: ${sajuData.jijiYughap?.length ? sajuData.jijiYughap.join(' / ') : '없음'}
- 지지삼합: ${sajuData.jijiSamhap?.length ? sajuData.jijiSamhap.join(' / ') : '없음'}
- 지지방합: ${sajuData.jijiBanghap?.length ? sajuData.jijiBanghap.join(' / ') : '없음'}
- 천간충: ${sajuData.cheongganChung?.length ? sajuData.cheongganChung.join(' / ') : '없음'}
- 지지충: ${sajuData.jijiChung?.length ? sajuData.jijiChung.join(' / ') : '없음'}
- 형: ${sajuData.hyung?.length ? sajuData.hyung.join(' / ') : '없음'}
- 파: ${sajuData.pa?.length ? sajuData.pa.join(' / ') : '없음'}
- 해: ${sajuData.hae?.length ? sajuData.hae.join(' / ') : '없음'}
- 원진: ${sajuData.wonjin?.length ? sajuData.wonjin.join(' / ') : '없음'}

### 신살 (상세)
${sinsalStr}
- 활용 가이드: ${sajuData.sinsalCombinedGuide || '해당 없음'}

### 길성
${gilseongStr}

### 공망
${sajuData.gongmang?.join('·') || '없음'}

### 대운
${daeyunStr}
- 현재 대운: ${currentDaeyun ? `${currentDaeyun.startAge}~${currentDaeyun.endAge}세 ${currentDaeyun.fullName || currentDaeyun.stem + currentDaeyun.branch}` : '계산 안됨'}

### 2026년 운세
- 간지: ${yeonwoon2026Str}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9개 문장 작성 지침
━━━━━━━━━━���━━━━━━━━━━━━━━━━━
반드시 JSON 형식으로 응답하세요:

\`\`\`json
{
  "facts": [
    {
      "id": 1,
      "title": "[Main Character Title]",
      "content": "일간 메타포와 오행 분포를 자연 풍경으로 비유하여 사용자의 바이브를 한 문장으로 정의하세요. (필수: Vibe Check)"
    },
    {
      "id": 2,
      "title": "[The Inner Twist]",
      "content": "겉모습과 실제 내면의 갭을 '입체적인 매력'으로 서술하세요. (필수: Low-key/High-key 표현)"
    },
    {
      "id": 3,
      "title": "[Hidden Stat Analysis]",
      "content": "가장 높은/낮은 십성 점수를 게임 스탯처럼 분석하고 12운성으로 현재 기세를 설명하세요. (필수: Secret Lore)"
    },
    {
      "id": 4,
      "title": "[God-Tier Micro-Habit]",
      "content": "부족한 기운을 채울 수 있는 아주 구체적이고 사소한 루틴 하나를 제안하세요. (필수: Micro-Action)"
    },
    {
      "id": 5,
      "title": "[Social Persona DNA]",
      "content": "월지 격국을 통해 사회적 면허증을 설명하고, 나만 몰랐던 필살기를 언급하세요. (필수: 현대적 직업 언어)"
    },
    {
      "id": 6,
      "title": "[Career Industry Match]",
      "content": "오행 점수 기반으로 성공할 수 있는 구체적인 산업군과 업무 형태를 콕 집어 제안하세요. (필수: 'Chills' 유발 디테일)"
    },
    {
      "id": 7,
      "title": "[Reality Check]",
      "content": "결핍된 기운이 일으킬 실수를 blunt한 친구처럼 경고하되 성공을 위한 퍼즐로 프레이밍하세요. (필수: Red Flag)"
    },
    {
      "id": 8,
      "title": "[God-Mode Update]",
      "content": "대운과 세운을 결합해 지금이 어떤 '시즌'인지 정의하세요. (필수: 2026년 연운 반영)"
    },
    {
      "id": 9,
      "title": "[The Hero's Journey]",
      "content": "본질과 귀인 에너지를 묶어 인생 전체를 긍정하는 감동적인 문장으로 마무리하세요. (필수: Self-affirmation)"
    }
  ]
}
\`\`\`

## 각 문장별 작성 팁:
To create a consistent, high-converting format that sounds like a human Gen Z marketer rather than a rigid AI, you need to blend ancient wisdom with modern street-smarts. Since you are aiming for 9 compact sections with 1-2 punchy sentences each, here are the 9 style and formatting rules to follow:

9 Rules for the "Modern Mystic" Format
1. The "Main Character" Title Rule
Every section needs a title that sounds like a movie or a trending TikTok topic. Use metaphors that combine the elemental (Water, Earth, Fire) with a lifestyle vibe.

Bad: Your Financial Luck.

Good: The Potential Cash Mogul: Unclogging the Revenue.

2. Start with a "Vibe Check"
Instead of cold analysis, start by describing the user’s "aura" or current feeling. Use a 1-sentence hook that makes them feel seen.

Example: "You give off major calm vibes on the outside, but your inner world is literal boiling lava."

3. The "Gen Z Dialect" Sprinkle
Insert 1-2 slang terms per section to humanize the text. Use them as adjectives to keep the insight professional but the delivery relatable.

Keywords: Vibe, Low-key, High-key, Main Character Energy, Red Flag, Ghosting, Glow-up, It is what it is, No-gatekeeping.

4. The "Nature-to-Life" Metaphor
Bridge the Saju technicality (Gimi, Wood, Water) to a real-life scenario immediately.

Example: "No Wood energy in your chart? That means you low-key hate being controlled by a corporate system."

5. Technical Saju as a "Secret Lore"
Don't hide the technical terms (Sik-sang, Wonjin-sal), but treat them like a "secret character stat" in a video game. This builds authority while staying compact.

Example: "With your Hyeon-chim-sal (needle energy), your eye for detail is actually elite."

6. Use "Reality Check" Interjections
Break the "Fortune Teller" wall by talking like a blunt friend. Use phrases like "Let’s be real," "Honestly," or "Fact check."

Example: "Reality check: Your stubbornness isn't a flex; it's a hurdle you need to jump."

7. The "Micro-Action" Practicality
Since sentences are limited, your advice must be a "Micro-habit" rather than a vague life goal.

Example: "Supplement your Wood energy by setting a 30-minute 'no-disturb' routine—it’s literally you planting a tree."

8. Address the "Hidden Shadow" (The Twist)
Every section should mention a "twist" or a "reversal" (the gap between appearance and reality). This is what creates the "How did they know?!" reaction.

Example: "You look like a sweetheart, but you have a cold streak that never looks back once you're done."

9. The "Hero's Journey" Outro
Always end on a high note. The final sentence of the 9th section must empower the user to take control of their "destiny" rather than feeling ruled by it.

Example: "Don't fold—just enjoy the ride. You’re the one who’s going to end up at the top."

Example of the "Compact Format" (Section 1: Identity)
The Red Rose of the Desert
You give off major calm energy, but inside you're a reversal of charm with realistic desires boiling like lava. You’re the ultimate "iron hand in a velvet glove," serving unparalleled survival instinct and CEO-level life force.

-

9-Step Sectional Frame Prompt Instructions

Section 01. Character Vibe Check (Day Pillar Metaphor)

Directive: Pull a title using the "Gen Z Text" for the Day Pillar from [SAJU_ALGORITHM]. Metaphorize the user's situation as a "natural landscape," reflecting the surrounding Five Elements scores (out of 120) to define the character's background in exactly one sentence.

Must Include: Main Character Title, Vibe Check, Nature-to-Life Metaphor.

Section 02. Inner Reversal (The Psychological Conflict)

Directive: Explain the gap between the outward appearance and the inner self as a "three-dimensional charm" rather than a contradiction. Pinpoint the emotional reality—whether it’s deep-sea overthinking (Water excess) or lava-like desire (Fire/Wealth excess)—so the client feels, "This is 100% me".

Must Include: "Hidden Shadow (The Twist)" style, "Low-key/High-key" phrasing.

Section 03. Energy Stat Analysis (10 Gods Lore)

Directive: Describe the highest and lowest "10 Gods" scores like video game stats, highlighting the user's "cheat-code-level talents". Use the "12 Stages of Life" (12 Un-seong) to strategically analyze if their current energy is in its "prime" (Imperial/Cap) or a "restructuring phase" (Death/Grave).

Must Include: "Secret Lore (Technical Saju)" terminology, "Stat" metaphors.

Section 04. Micro-Action for a "God-Tier" Life (Remedy)

Directive: Provide highly specific, actionable behavioral guidelines to fill the missing energies. Utilize the [Remedy/Action Guidelines] from [SAJU_ALGORITHM] to suggest a "small win" that can immediately turn their life in a positive direction.

Must Include: "Micro-Action Practicality" rule (e.g., specific time routines, item usage).

Section 05. Social Persona (Gyeok-guk DNA)

Directive: Explain the "Social License" granted by the world based on the Month Branch (Gyeok-guk). Interpret any changes caused by Clashes or Harmonies as a "hidden ultimate move" that even the client didn't know they had, making them feel proud of their social role.

Must Include: Modern career translation of Gyeok-guk terms (e.g., Proper Resource → Professional Knowledge Licenser).

Section 06. Career Industry Layer (Elemental Matching)

Directive: Refer to [SAJU_ALGORITHM] [TABLE B: Modern Industries] to pinpoint the industry and work format (Business vs. Organization) where the client naturally shines. Suggest categories so specific that the client reacts with, "Chills... that's exactly what I've been interested in lately!".

Must Include: "By any chance, aren't you interested in this (Industry) as a (Role)?" phrasing.

Section 07. Reality Check (Deficiency Risk)

Directive: Warn them about potential mistakes caused by deficient (0 pts) or excessive energies like a blunt friend. Ensure the tone isn't a "label" but a vibe of "fix this one thing and you're invincible," framing risks as the "last puzzle piece for success".

Must Include: "Reality Check" interjection, "Red Flag" terminology.

Section 08. Current Fortune Update (Dae-un Vibe)

Directive: Combine the energies of the 10-year Great Fortune (Dae-un) and the Yearly Fortune (Se-un) to identify the current "season". Use the Gen Z "Fact-Check" data from [SAJU_ALGORITHM] to frame hard times as "hardcore quests for leveling up" and good times as "God-Mode buffs".

Must Include: "God-Mode Activated," "Season Update" terminology.

Section 09. Hero’s Journey (Life Theme)

Directive: Bind the essence of the Day Pillar with their strongest positive energy (Noble Benefactor/Yong-sin) to elevate their life into a "Great Journey". End with a soul-stirring sentence that makes them fall in love with themselves, emphasizing that they are "already more than enough".

Must Include: "Hero’s Journey Outro" style, an emotional/inspiring finale.

Writing Tips (AI GenZ Marketer’s Guide)
Compactness & The Art of the Summary: Compress all data into a maximum of 2 sentences per section.

Term Branding: Briefly mention technical terms (Gimi, Hyeon-chim, etc.) as "Secret Lore" in the body, but use catchy branding for titles like "The Red Rose of the Desert".

Conflict Resolution (The Twist): If the Gyeok-guk (Persona) and the actual scores (Inner Self) clash, present it as a "charming reversal" rather than a contradiction so the client embraces their complexity.

Balance of "Chills" and "Hope": * Every piece of advice must conclude with hope and self-affirmation.

Match the 10 Gods and Elemental scores so precisely during career suggestions that the client has a "chills" moment, feeling like their deepest thoughts were read.

Sublimate even negative Shinsal (Wonjin, Gong-mang, etc.) into "a unique intuition others don't have" or "the art of emptying to fill even more".`
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

  console.log('[v0] GPT 프롬프트 생성 완료')
  console.log('[v0] 프롬프트 길이:', prompt.length)
  console.log('[v0] API 호출 시작...')

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    prompt,
    temperature: 0.7,
    maxOutputTokens: 2500,
  })

  console.log('[v0] GPT 응답 수신 완료')

  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없음')

    const parsed = JSON.parse(jsonMatch[1])
    const facts: Fact[] = parsed.facts.map((f: any, idx: number) => ({
      id: f.id || idx + 1,
      category: f.category || 'unknown',
      title: f.title || '',
      text: f.content || f.text || '내용 없음'
    }))

    return facts
  } catch {
    console.error('[v0] JSON 파싱 실패:', result.text.substring(0, 500))
    return [{
      id: 1,
      category: 'error',
      title: '분석 오류',
      text: '사주 분석 결과를 처리하는 중 오류가 발생했습니다.'
    }]
  }
}

// POST 핸들러
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { submissionId } = body

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') || 'unknown'

    const supabase = await createClient()

    // Rate Limit 체크 - 개발 중 비활성화 (배포 시 아래 주석 ���제)
    // const { allowed, remaining } = await checkRateLimit(supabase, ip, 100)
    // if (!allowed) {
    //   return NextResponse.json({ error: '하루 10회 ��한입니다.' }, { status: 429 })
    // }

    // DB에서 submission 조회
    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (dbError || !submission) {
      console.error('[v0] DB fetch error:', dbError)
      return NextResponse.json({ error: '제출 데이터를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { name, gender, birth_country, birth_date, saju_data } = submission

    console.log('[v0] Submission 조회 성공:', { name, gender, birth_country })
    console.log('[v0] saju_data 키:', Object.keys(saju_data || {}))

    if (!saju_data) {
      return NextResponse.json({ error: '사주 데이터가 없습니다.' }, { status: 400 })
    }

    // 캐시 키 생성
    const sajuKey = `${saju_data.yearPillar?.fullName || saju_data.yearPillar?.stem}_${saju_data.monthPillar?.fullName || saju_data.monthPillar?.stem}_${saju_data.dayPillar?.fullName || saju_data.dayPillar?.stem}_${saju_data.hourPillar?.fullName || 'none'}`

    // 캐시 확인
    const cachedFacts = await getCachedFacts(supabase, sajuKey)
    let freeFacts: Fact[]

    if (cachedFacts) {
      console.log('[v0] 캐시 히트!')
      freeFacts = cachedFacts
    } else {
      console.log('[v0] ���시 미스, AI 생성 시작...')
      freeFacts = await generateFactsFromAI(name, gender, birth_country, birth_date, saju_data)
      await cacheFacts(supabase, sajuKey, freeFacts)
    }

    // 티저 팩트 (locked)
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
    return NextResponse.json({ error: '팩트 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
