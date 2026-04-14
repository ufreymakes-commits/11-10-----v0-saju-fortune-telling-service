import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { getAllInterpretationsForSaju, formatInterpretationsForPrompt } from '@/lib/saju/interpretation-service'

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

  // DB에서 해설 데이터 가져오기
  const dayStem = sajuData.dayPillar?.stem || ''
  const sipsung = sajuData.tenGods?.present || []
  const unseong12 = sajuData.twelveStars?.map(ts => ts.star) || []
  const sinsal = sajuData.spirits || []
  
  const interpretations = await getAllInterpretationsForSaju(dayStem, sipsung, unseong12, sinsal)
  const dbInterpretationStr = formatInterpretationsForPrompt(interpretations)

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

  return `당신은 사주 전문가 겸 심리상담가입니다. 한국 고전 명리학을 미국 Gen Z들에게 쉽게 설명하는 전문가입니다.

## 필수 규칙 (절대 지키기)
1. 아래 "DB 해설 참고 데이터"를 반드시 활용하고 참고해서 문장을 작성하세요. 
2. 너무 딱딱한 사주 용어 말고, 친구에게 설명하는 톤으로 작성하세요.
3. 구체적인 상황과 예시를 들어서 "어? 이거 정말 나네!" 하는 느낌이 들도록 하세요.
4. 한 문장이 50자~100자 정도의 적당한 길이로 작성하세요.
5. 이 사람이 "도대체 뭐가 나를 이렇게 만드는 거야?" 하는 의문에 직접적으로 답해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 클라이언트 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이름: ${name} | 성별: ${gender} | 나이: ${age}세
사주: ${yearP} - ${monthP} - ${dayP} - ${hourP}

## DB 해설 참고 데이터 (반드시 참고하고 활용해서 문장 작성)
${dbInterpretationStr || '(해설 데이터 없음)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 분석 데이터 (참고용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[일간]: ${sajuData.dayPillar?.stem || ''}
[오행 점수]: ${elementBasic}
[오행 조정후]: ${elementAdjusted}
[12운성]: ${twelveStarsStr}
[신살]: ${sinsalStr}
[2026년 운]: ${yeonwoon2026Str}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9개 문장 작성 지침
━━━━━━━━━━���━━━━━━━━━━━━━━━━━
반드시 JSON 형식으로 응답하세요:

\`\`\`json
{
  "facts": [
    {
      "id": 1,
      "title": "당신의 핵심 성격",
      "content": "일간과 오행 분포 기반 성격 해석. 구체적인 행동 패턴과 함께."
    },
    {
      "id": 2,
      "title": "감정&생각의 세계",
      "content": "오행 불균형에서 오는 심리 상태. 당신이 왜 자주 이런 기분인지 설명."
    },
    {
      "id": 3,
      "title": "에너지 과다/부족",
      "content": "십신 점수 불균형이 일상에서 나타나는 방식. 장점과 주의점."
    },
    {
      "id": 4,
      "title": "지금의 시간들",
      "content": "12운성과 월지 기반. 지금 당신이 어떤 단계를 지나고 있는지."
    },
    {
      "id": 5,
      "title": "사람들 앞에서의 당신",
      "content": "사회적 직분과 첫인상. 하지만 실제 내면은 다를 수도 있다는 의미."
    },
    {
      "id": 6,
      "title": "본모습 vs 보이는 모습",
      "content": "일주와 월주의 차이로 오는 갭. 왜 다를 수밖에 없는지."
    },
    {
      "id": 7,
      "title": "일 & 커리어",
      "content": "당신의 일 스타일과 추천 분야. 신살과 격국 기반의 구체적 조언."
    },
    {
      "id": 8,
      "title": "관계 & 연애",
      "content": "신살과 12운성 기반 대인관계 패턴. 당신이 사람들과 어떻게 연결되는지."
    },
    {
      "id": 9,
      "title": "2026년, 당신의 운",
      "content": "올해의 기운과 기대할 수 있는 변화. 주의해야 할 점도 함께."
    }
  ]
}
\`\`\`

## 각 문장별 작성 팁:
1번: "당신은 [일간 특성]인 사람인데, 일상에서는 [구체적 행동]으로 드러나요."
2번: "오행이 [불균형 방식]이라서, 당신은 자주 [심리 상태]를 느껴요."
3번: "[십신 이름]이 너무 많아서 당신은 [과다 증상], 반대로는 [부족 증상]이 있어요."
4번: "지금 당신은 [12운성 단계]를 지나고 있어서, [상황 설명]인 시기예요."
5번: "월지 때문에 사람들 앞에서 당신은 [외적 이미지]로 보여요."
6번: "그런데 사실 내면은 [일주 특성]라서 완전 다를 수 있어요."
7번: "당신의 일 스타일은 [격국 기반], 추천 분야는 [신살 고려]예요."
8번: "신살이 [신살 이름]이라서, 당신은 관계에서 [대인관계 패턴]해요."
9번: "2026년 ${yeonwoon2026Str}년이라서, 당신에게는 [연운 해석]이 예상돼요."

마지막 주의: 너무 일반적인 문장은 쓰지 마세요. "당신은 민감할 수 있어요" 이런 식은 금지. 구체적으로!`
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

    // Rate Limit 체크 - 개발 중 비활성화 (배포 시 아래 주석 해제)
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
