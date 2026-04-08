import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'

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

// GPT 프롬프트 생성 (saju_data에서 직접)
function buildPromptFromSajuData(
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: string,
  sajuData: SajuData
): string {
  const birthYear = new Date(birthDate).getFullYear()
  const age = 2026 - birthYear

  // 12운성
  const twelveStarsStr = sajuData.twelveStars
    ? sajuData.twelveStars.map(ts => `${ts.position}${ts.branch}:${ts.star}`).join(' / ')
    : '계산 안됨'

  // 길성
  const gilseongStr = sajuData.gilseong
    ? [
        ...sajuData.gilseong.cheonul.map(g => `천을귀인:${g}`),
        ...sajuData.gilseong.taegeuk.map(g => `태극귀인:${g}`)
      ].join(' / ')
    : '해당 없음'

  // 대운
  const daeyunStr = sajuData.daewoon
    ? sajuData.daewoon.slice(0, 3).map(d => `${d.startAge}~${d.endAge}세: ${d.fullName || d.stem + d.branch}`).join(' / ')
    : '계산 안됨'

  // 연운 (2026)
  const yeonwoon2026 = sajuData.yeonwoon?.find(y => y.year === 2026)

  return `당신은 30년 이상의 경력을 가진 사주 명리학 대가입니다. 당신의 해석은 매우 정확하고, 사람들이 "와, 정말 내 얘기다!"라고 놀라워합니다.

## 클라이언트 정보
- 이름: ${name}
- 성별: ${gender}
- 출생국: ${birthCountry}
- 2026년 기준 나이: ${age}세

## 사주 8글자
- 년주: ${sajuData.yearPillar.fullName || sajuData.yearPillar.stem + sajuData.yearPillar.branch} (${sajuData.yearPillar.fullNameKorean || ''})
- 월주: ${sajuData.monthPillar.fullName || sajuData.monthPillar.stem + sajuData.monthPillar.branch} (${sajuData.monthPillar.fullNameKorean || ''})
- 일주: ${sajuData.dayPillar.fullName || sajuData.dayPillar.stem + sajuData.dayPillar.branch} (${sajuData.dayPillar.fullNameKorean || ''})
- 시주: ${sajuData.hourPillar ? (sajuData.hourPillar.fullName || sajuData.hourPillar.stem + sajuData.hourPillar.branch) : '미상'} ${sajuData.hourPillar?.fullNameKorean ? `(${sajuData.hourPillar.fullNameKorean})` : ''}

## 핵심 분석 데이터

### 기본 요소
- 일간 (Day Master): ${sajuData.dayMaster} (${sajuData.dayMasterKorean || ''})
- 12운성: ${twelveStarsStr}
- 신강/신약: ${sajuData.sinGangSinYak?.grade || '미정'} (${sajuData.sinGangSinYak?.ratio || 0}%)
- 격국: ${sajuData.gyeokguk || '미정'}

### 오행 밸런스
${sajuData.elementBalanceKorean 
  ? `목: ${sajuData.elementBalanceKorean.목} / 화: ${sajuData.elementBalanceKorean.화} / 토: ${sajuData.elementBalanceKorean.토} / 금: ${sajuData.elementBalanceKorean.금} / 수: ${sajuData.elementBalanceKorean.수}`
  : `Wood: ${sajuData.elementBalance.wood} / Fire: ${sajuData.elementBalance.fire} / Earth: ${sajuData.elementBalance.earth} / Metal: ${sajuData.elementBalance.metal} / Water: ${sajuData.elementBalance.water}`}

### 십신 (十神)
- 보유 십신: ${sajuData.tenGods?.present.join(', ') || '없음'}
- 부재 십신: ${sajuData.tenGods?.missing.join(', ') || '없음'}

### 관계식 (關係式)
- 천간합: ${sajuData.cheongganHap?.length ? sajuData.cheongganHap.join(' / ') : '없음'}
- 지지육합: ${sajuData.jijiYughap?.length ? sajuData.jijiYughap.join(' / ') : '없음'}
- 지지삼합: ${sajuData.jijiSamhap?.length ? sajuData.jijiSamhap.join(' / ') : '없음'}
- 지지방합: ${sajuData.jijiBanghap?.length ? sajuData.jijiBanghap.join(' / ') : '없음'}
- 천간충: ${sajuData.cheongganChung?.length ? sajuData.cheongganChung.join(' / ') : '없음'}
- 지지충: ${sajuData.jijiChung?.length ? sajuData.jijiChung.join(' / ') : '없음'}
- 형: ${sajuData.hyeong?.length ? sajuData.hyeong.join(' / ') : '없음'}
- 파: ${sajuData.pa?.length ? sajuData.pa.join(' / ') : '없음'}
- 해: ${sajuData.hae?.length ? sajuData.hae.join(' / ') : '없음'}
- 원진: ${sajuData.wonjin?.length ? sajuData.wonjin.join(' / ') : '없음'}

### 길성 (吉星)
${gilseongStr}

### 신살 (神殺)
${sajuData.spirits?.length ? sajuData.spirits.join(', ') : '해당 없음'}

### 공망 (空亡)
${sajuData.gongmang?.join('·') || '계산 안됨'}

### 용신 (用神)
- 억부용신: ${sajuData.eokbuYongsin || '미정'}
- 조후용신: ${sajuData.johuYongsin || '미정'}

### 대운 (大運)
${daeyunStr}

### 2026년 운세
- 간지: ${yeonwoon2026 ? (yeonwoon2026.fullName || yeonwoon2026.stem + yeonwoon2026.branch) : '병오 (丙午)'}

## 작업 지시사항

위의 사주 정보를 종합적으로 분석하여 **정확히 9개의 놀라운 사실**을 한국어로 생성해주세요. 각 팩트는:
1. 그 사람의 실제 특성을 반영해야 합니다
2. 깊이있고 정확해 보여야 합니다
3. "와, 이거 정말 내 얘기다!"라고 느끼게 만들어야 합니다
4. 친근하고 대화하듯이 작성하되, 전문성도 느껴져야 합니다

**팩트 카테고리:**
1-3: 성격 & 본질 (일간의 특성, 십신 보유/부재, 신강약)
4-6: 직업 & 재능 (십신, 격국, 용신)
7-8: 연애 & 관계 (십신, 길성, 신살)
9: 2026년 운세 (연도 간지 영향)

**출력 형식 (JSON):**
\`\`\`json
{
  "facts": [
    {
      "category": "성격",
      "title": "당신의 핵심 특성",
      "content": "구체적이고 깊이 있는 설명..."
    }
  ]
}
\`\`\`

모든 분석은 한국 사주 명리학 전통에 기반하며, 이 사람의 구체적인 데이터를 반영해야 합니다.`
}

// AI를 통한 9개 팩트 생성
async function generateFactsFromAI(
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: string,
  sajuData: SajuData
): Promise<Fact[]> {
  const prompt = buildPromptFromSajuData(name, gender, birthCountry, birthDate, sajuData)

  console.log('[v0] GPT 프롬프트 생성 완료, API 호출 시작...')

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
      id: idx + 1,
      category: f.category || 'unknown',
      text: f.content || f.text || '내용 없음'
    }))

    return facts
  } catch (error) {
    console.error('[v0] AI 응답 파싱 실패:', error)
    // 폴백
    return getFallbackFacts(name, sajuData)
  }
}

// 폴백 팩트
function getFallbackFacts(name: string, sajuData: SajuData): Fact[] {
  return [
    { id: 1, category: '성격', text: `${name}님, 당신의 일간은 ${sajuData.dayMaster}입니다. 이는 당신의 핵심 본질을 나타냅니다.` },
    { id: 2, category: '성격', text: `당신은 ${sajuData.sinGangSinYak?.grade || '중화'}의 성향으로, 균형 잡힌 에너지를 가지고 있습니다.` },
    { id: 3, category: '성격', text: `12운성에 따르면 당신의 운의 흐름이 독특합니다.` },
    { id: 4, category: '직업', text: `당신의 격국은 ${sajuData.gyeokguk || '미정'}으로, 특정 분야에서 두각을 나타낼 수 있습니다.` },
    { id: 5, category: '직업', text: `보유한 십신(${sajuData.tenGods?.present.slice(0, 3).join(', ') || '비견'})을 활용하면 성공 확률이 높습니다.` },
    { id: 6, category: '직업', text: `용신인 ${sajuData.eokbuYongsin || '목'}의 기운을 활용하면 좋습니다.` },
    { id: 7, category: '연애', text: `당신의 연애 성향은 ${sajuData.spirits?.includes('도화살') ? '매력적이고 인기가 많습니다' : '진지하고 깊은 관계를 추구합니다'}.` },
    { id: 8, category: '관계', text: `대인관계에서 ${sajuData.gilseong?.cheonul.length ? '귀인의 도움을 받을 운이 있습니다' : '자수성가 타입입니다'}.` },
    { id: 9, category: '2026년', text: `2026년 병오년은 당신에게 새로운 기회의 해가 될 것입니다.` }
  ]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { submissionId } = body

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 
               headersList.get('x-real-ip') || 'unknown'

    const supabase = await createClient()

    // Rate Limit 체크
    const { allowed, remaining } = await checkRateLimit(supabase, ip, 10)
    if (!allowed) {
      return NextResponse.json({ error: '하루 10회 제한입니다.' }, { status: 429 })
    }

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
      console.log('[v0] 캐시 미스, AI 생성 시작...')
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
    }, {
      headers: { 'X-Remaining-Requests': remaining.toString() }
    })

  } catch (error) {
    console.error('[v0] generate-free error:', error)
    return NextResponse.json({ error: '팩트 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
