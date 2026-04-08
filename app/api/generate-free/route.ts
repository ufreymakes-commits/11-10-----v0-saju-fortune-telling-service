import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'

// 사주 키 생성 (캐싱용)
function generateSajuKey(sajuData: SajuData): string {
  const { yearPillar, monthPillar, dayPillar, hourPillar } = sajuData
  return `${yearPillar?.fullName || 'unknown'}_${monthPillar?.fullName || 'unknown'}_${dayPillar?.fullName || 'unknown'}_${hourPillar?.fullName || 'unknown'}`
}

// Rate Limit 체크 (IP당 하루 3회)
async function checkRateLimit(supabase: Awaited<ReturnType<typeof createClient>>, ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0]
  const MAX_REQUESTS = 3
  
  // 현재 요청 횟수 조회
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('ip_address', ip)
    .eq('request_date', today)
    .single()
  
  if (!rateLimit) {
    // 첫 요청 - 새 레코드 생성
    await supabase.from('rate_limits').insert({
      ip_address: ip,
      request_date: today,
      request_count: 1
    })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }
  
  if (rateLimit.request_count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }
  
  // 요청 횟수 증가
  await supabase
    .from('rate_limits')
    .update({ 
      request_count: rateLimit.request_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('ip_address', ip)
    .eq('request_date', today)
  
  return { allowed: true, remaining: MAX_REQUESTS - rateLimit.request_count - 1 }
}

// 캐시에서 결과 조회
async function getCachedFacts(supabase: Awaited<ReturnType<typeof createClient>>, sajuKey: string): Promise<Fact[] | null> {
  const { data: cache } = await supabase
    .from('saju_cache')
    .select('free_facts, hit_count')
    .eq('saju_key', sajuKey)
    .single()
  
  if (cache) {
    // 캐시 히트 카운트 증가
    await supabase
      .from('saju_cache')
      .update({ 
        hit_count: cache.hit_count + 1,
        updated_at: new Date().toISOString()
      })
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

// AI 프롬프트 생성
function buildPrompt(sajuData: SajuData, name: string, gender: string): string {
  const { 
    yearPillar, monthPillar, dayPillar, hourPillar,
    dayMaster, dominantElement, personalityType, 
    luckyElement, elementBalance,
    tenGods, hiddenStems, twelveStages
  } = sajuData

  return `You are a master of Saju (Korean Four Pillars of Destiny / 사주팔자), with 30+ years of experience providing accurate, personalized readings that leave people amazed at how precisely you understand them.

## Client Information
- Name: ${name}
- Gender: ${gender}
- Four Pillars (사주): 
  - Year: ${yearPillar?.fullName || 'Unknown'} (${yearPillar?.heavenlyStem?.korean || ''}${yearPillar?.earthlyBranch?.korean || ''})
  - Month: ${monthPillar?.fullName || 'Unknown'} (${monthPillar?.heavenlyStem?.korean || ''}${monthPillar?.earthlyBranch?.korean || ''})
  - Day: ${dayPillar?.fullName || 'Unknown'} (${dayPillar?.heavenlyStem?.korean || ''}${dayPillar?.earthlyBranch?.korean || ''})
  - Hour: ${hourPillar?.fullName || 'Unknown'} (${hourPillar?.heavenlyStem?.korean || ''}${hourPillar?.earthlyBranch?.korean || ''})
- Day Master (일간): ${dayMaster}
- Dominant Element: ${dominantElement}
- Personality Type: ${personalityType}
- Lucky Element (용신): ${luckyElement}
- Element Balance: ${JSON.stringify(elementBalance)}
${tenGods ? `- Ten Gods (십신): ${JSON.stringify(tenGods)}` : ''}
${hiddenStems ? `- Hidden Stems (지장간): ${JSON.stringify(hiddenStems)}` : ''}
${twelveStages ? `- Twelve Stages (12운성): ${JSON.stringify(twelveStages)}` : ''}

## Your Task
Generate exactly 9 personalized facts about this person based on their Saju chart. Each fact should:
1. Be specific to THEIR chart, not generic horoscope-style statements
2. Feel eerily accurate - like you know them personally
3. Reference specific elements, pillars, or interactions in their chart
4. Be written in a warm, conversational tone
5. Mix different life aspects: personality traits, hidden tendencies, relationship patterns, career inclinations, life challenges

## Output Format
Return ONLY a JSON array with exactly 9 objects, each with:
- "id": number (1-9)
- "category": one of "personality", "career", "love", "future"
- "text": the fact (2-3 sentences, address them by name at least once)

Example format:
[
  {"id": 1, "category": "personality", "text": "${name}, your..."},
  ...
]

IMPORTANT: 
- Do NOT include markdown code blocks or any text before/after the JSON
- Make each fact feel like a revelation, not a fortune cookie
- Be specific about their chart's unique combinations
- Write as if you've known them for years`
}

// AI로 사실 생성
async function generateFactsWithAI(sajuData: SajuData, name: string, gender: string): Promise<Fact[]> {
  const prompt = buildPrompt(sajuData, name, gender)
  
  try {
    const { text } = await generateText({
      model: 'anthropic/claude-3-haiku-20240307', // 저렴하고 빠른 모델
      prompt,
      maxOutputTokens: 2000,
      temperature: 0.7,
    })
    
    // JSON 파싱
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[v0] Failed to parse AI response:', text)
      throw new Error('Invalid AI response format')
    }
    
    const facts = JSON.parse(jsonMatch[0]) as Fact[]
    return facts.slice(0, 9) // 정확히 9개만 반환
  } catch (error) {
    console.error('[v0] AI generation error:', error)
    // 폴백: 기본 템플릿 사용
    return generateFallbackFacts(sajuData, name)
  }
}

// 폴백 팩트 생성 (AI 실패 시)
function generateFallbackFacts(sajuData: SajuData, name: string): Fact[] {
  const { dayMaster, dominantElement, personalityType, luckyElement, elementBalance } = sajuData
  
  return [
    { id: 1, category: 'personality', text: `${name}, your Day Master is ${dayMaster}, which means you possess a unique inner strength that others often admire from afar.` },
    { id: 2, category: 'personality', text: `As "${personalityType}", you have an innate ability to see possibilities where others see obstacles.` },
    { id: 3, category: 'personality', text: `Your dominant element is ${dominantElement}. This shapes how you interact with the world and process emotions.` },
    { id: 4, category: 'career', text: `People with your chart often find success in careers that allow for creative expression and leadership.` },
    { id: 5, category: 'career', text: `Your ${luckyElement} element is what brings you fortune. Surrounding yourself with ${luckyElement.toLowerCase()}-associated environments can enhance your luck.` },
    { id: 6, category: 'love', text: `In relationships, you tend to be deeply loyal and seek meaningful connections over superficial ones.` },
    { id: 7, category: 'future', text: `Your element balance shows ${Object.entries(elementBalance).sort((a, b) => b[1] - a[1])[0][0]} is strongest. This influences your life path significantly.` },
    { id: 8, category: 'future', text: `The cosmos suggests that your greatest personal growth will come through embracing challenges.` },
    { id: 9, category: 'personality', text: `${name}, your birth chart reveals a soul that has been on a long journey. This lifetime holds special significance for you.` }
  ]
}

// 티저 팩트 생성 (결제 유도용)
function generateTeaserFacts(sajuData: SajuData): Fact[] {
  const { dominantElement, dayMaster } = sajuData
  
  return [
    {
      id: 10,
      text: `Your ideal romantic partner has a specific element that complements your ${dominantElement} nature perfectly...`,
      category: 'love',
      isMasked: true
    },
    {
      id: 11,
      text: `There is a specific year in your near future that will be transformative for your career...`,
      category: 'career',
      isMasked: true
    },
    {
      id: 12,
      text: `Your hidden talent that most people never discover about themselves is connected to your ${dayMaster} energy...`,
      category: 'personality',
      isMasked: true
    }
  ]
}

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    
    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submission ID' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // IP 주소 가져오기
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               'unknown'
    
    // Rate Limit 체크
    const { allowed, remaining } = await checkRateLimit(supabase, ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily limit reached. Please try again tomorrow.', remaining: 0 },
        { status: 429 }
      )
    }
    
    // Get submission data
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()
    
    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    const sajuData = submission.saju_data as SajuData
    const sajuKey = generateSajuKey(sajuData)
    
    // 이미 이 submission에 대한 리포트가 있는지 확인
    const { data: existingReport } = await supabase
      .from('reports')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('section_key', 'free_preview')
      .single()
    
    if (existingReport) {
      return NextResponse.json({
        freeFacts: existingReport.facts.filter((f: Fact) => !f.isMasked),
        teaserFacts: existingReport.facts.filter((f: Fact) => f.isMasked),
        submission: {
          name: submission.name,
          sajuData: submission.saju_data
        },
        cached: true,
        remaining
      })
    }
    
    // 캐시에서 동일한 사주 결과 확인
    const cachedFacts = await getCachedFacts(supabase, sajuKey)
    let freeFacts: Fact[]
    
    if (cachedFacts) {
      console.log('[v0] Cache hit for saju:', sajuKey)
      freeFacts = cachedFacts
    } else {
      console.log('[v0] Cache miss, generating with AI for:', sajuKey)
      // AI로 새로운 팩트 생성
      freeFacts = await generateFactsWithAI(sajuData, submission.name, submission.gender || 'unknown')
      // 캐시에 저장
      await cacheFacts(supabase, sajuKey, freeFacts)
    }
    
    const teaserFacts = generateTeaserFacts(sajuData)
    
    // 리포트 저장
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        submission_id: submissionId,
        section_key: 'free_preview',
        facts: [...freeFacts, ...teaserFacts],
        is_free: true
      })
    
    if (insertError) {
      console.error('[v0] Error storing free facts:', insertError)
    }
    
    return NextResponse.json({
      freeFacts,
      teaserFacts,
      submission: {
        name: submission.name,
        sajuData: submission.saju_data
      },
      cached: !!cachedFacts,
      remaining
    })
  } catch (error) {
    console.error('[v0] Generate free facts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
