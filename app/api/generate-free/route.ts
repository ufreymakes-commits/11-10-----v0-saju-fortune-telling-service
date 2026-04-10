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

// GPT 프롬프트 생성 - 9문장 구조 (01~09)
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

  return `당신은 고전 명리학의 격국론(Gyeok-guk)과 현대적 수치론(Energy Scoring)을 결합한 사주 전략가입니다.
내담자의 사주 데이터를 바탕으로 아래 9개 문장을 한국어로 작성해주세요.
각 문장은 정확히 지정된 분석 지침을 따르되, 전문 용어를 최소화하고 내담자가 "와, 이거 진짜 내 얘기다!" 라고 느낄 수 있게 생생하고 구체적으로 작성합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 클라이언트 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 이름: ${name}
- 성별: ${gender}
- 출생국: ${birthCountry}
- 2026년 기준 나이: ${age}세

## 사주 원국 (8글자)
- 년주: ${yearP} (${sajuData.yearPillar.fullNameKorean || ''})
- 월주: ${monthP} (${sajuData.monthPillar.fullNameKorean || ''})
- 일주: ${dayP} (${sajuData.dayPillar.fullNameKorean || ''})
- 시주: ${hourP} ${sajuData.hourPillar?.fullNameKorean ? `(${sajuData.hourPillar.fullNameKorean})` : ''}

## 핵심 분석 데이터

[일간 & 신강약]
- 일간(Day Master): ${sajuData.dayMaster} (${sajuData.dayMasterKorean || ''})
- 신강/신약: ${sajuData.sinGangSinYak?.grade || '미정'} (${sajuData.sinGangSinYak?.ratio || 0}%)
- 격국: ${sajuData.gyeokguk || '미정'}
- 용신(억부): ${sajuData.eokbuYongsin || '미정'} / 용신(조후): ${sajuData.johuYongsin || '미정'}

[오행 분포]
- 기본 점수 (120점): ${elementBasic}
- 오행 개수 (지장간 포함): ${elementCount}
- 합충 반영 후: ${elementAdjusted}
- 합충 조정 내역:
    ${hapChungStr}

[십신 (十神)]
- 보유: ${sajuData.tenGods?.present.join(', ') || '없음'}
- 부재: ${sajuData.tenGods?.missing.join(', ') || '없음'}

[12운성]
${twelveStarsStr}

[관계식]
- 천간합: ${sajuData.cheongganHap?.length ? sajuData.cheongganHap.join(' / ') : '없음'}
- 지지육합: ${sajuData.jijiYughap?.length ? sajuData.jijiYughap.join(' / ') : '없음'}
- 지지삼합: ${sajuData.jijiSamhap?.length ? sajuData.jijiSamhap.join(' / ') : '없음'}
- 지지방합: ${sajuData.jijiBanghap?.length ? sajuData.jijiBanghap.join(' / ') : '없음'}
- 천간충: ${sajuData.cheongganChung?.length ? sajuData.cheongganChung.join(' / ') : '없음'}
- 지지충: ${sajuData.jijiChung?.length ? sajuData.jijiChung.join(' / ') : '없음'}
- 원진: ${sajuData.wonjin?.length ? sajuData.wonjin.join(' / ') : '없음'}

[신살]
${sinsalStr}
종합 활용 가이드: ${sajuData.sinsalCombinedGuide || '해당 없음'}

[길성]
${gilseongStr}

[공망]
${sajuData.gongmang?.join('·') || '없음'}

[대운]
${daeyunStr}
현재 대운: ${currentDaeyun ? `${currentDaeyun.startAge}~${currentDaeyun.endAge}세 ${currentDaeyun.fullName || currentDaeyun.stem + currentDaeyun.branch}` : '계산 안됨'}

[2026년 운세]
간지: ${yeonwoon2026Str}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9문장 작성 지침
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 문장 01~02: 일간 캐릭터 + 오행 분포 설명
- 일간이 어떤 캐릭터인지 설명한다.
- 합충이 반영된 오행 분포를 비유적으로 설명한다. 오행의 각 요소를 일간과의 십신 관계(재성, 관성, 인성, 식상, 비겁)로 해석하여 그 의미를 풀어낸다.
  예: 기토 일간에게 '수'는 재성(돈, 결과물)이다. "비옥한 땅이 넘실대는 홍수같은 물로 둘러싸인 형국..."
- 이 오행 환경 속에서 인생에서 자주 느끼는 문제와 감정이 무엇인지 설명한다.
- 두 문장을 각각 분리하여 작성할 것.

### 문장 03~04: 십신 분포 + 12운성 (에너지 상태)
- 십신 과다(50점 이상)와 부재(0점)를 파악하고 실전 해석한다.
- 문장 01~02를 고려한 종합 한 문장을 만든다.
  예: "엄청난 재물 기회가 주변에 널려있지만(재성 과다), 이를 끌어낼 식상과 통제할 관성이 부족해 마음이 분주한 상태."
- 일지/월지의 12운성을 결합하여 장점 승화 조언을 1문장으로 작성한다.
  예: "일지가 관대(자존심), 월지가 제왕(에너지)이라 겉으로는 당당해 보이지만..."
- 두 문장을 각각 분리하여 작성할 것.

### 문장 05~07: 격국 + 사회적 페르소나 + 직업 적성
- 격국을 설명하되, 합충으로 인한 변화 포인트를 반드시 반영한다.
  예: "정인격이지만 사신합으로 인해 인성(학문)의 기운이 재성(결과, 현실)으로 변해..."
- 겉으로 보이는 첫인상 vs 실제 내면의 반전을 설명하고, 변화가 가장 크게 와닿았던 연도를 추정한다.
- 아래 4단계 로직으로 직업 적성 1문장을 작성한다:
  STEP 1. 월지 지장간 본기의 십신 → 사회적 직분(격국) 결정
  STEP 2. 합충 반영 후 50점 이상 오행/십성이 있으면 → 해당 오행의 산업에서 해당 십성의 방식으로 수행
  STEP 3. 0점 십성 → 커리어 리스크 예측 및 조언
  STEP 4. 강한 신살(✅)로 업무 환경의 구체적 디테일 추가
  출력: "혹시 특히 [산업분야]에서 [역할]로 [고용/프리랜서/사업] 형태에 관심 있지 않으세요?"
- 세 문장을 각각 분리하여 작성할 것.

### 문장 08~09: 현재 대운 + 인생 테마
- 현재 나이가 속한 대운과 일지/월지 12운성을 결합하여 "지금이 어떤 시기"인지 설명한다.
  예: "인생의 가장 화려한 시기인 제왕과 관대의 에너지를 품고 30대 경진 대운을 지나고 있습니다..."
- 마지막으로 이 사람의 인생 테마를 하나의 감동적인 문장으로 완성한다.
  형식: "${name} 님, 당신의 삶은 [일간이 오행 환경에 처한 모습 + 일지/월지 12운성의 긍정적 힘을 담은 비유적 표현]입니다."
- 두 문장을 각각 분리하여 작성할 것.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 출력 형식 (JSON, 반드시 준수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`json
{
  "facts": [
    { "id": 1, "category": "일간캐릭터", "title": "당신은 이런 사람입니다", "content": "..." },
    { "id": 2, "category": "오행분포", "title": "당신을 둘러싼 에너지", "content": "..." },
    { "id": 3, "category": "십신분포", "title": "에너지의 과부족", "content": "..." },
    { "id": 4, "category": "12운성", "title": "당신의 에너지 상태", "content": "..." },
    { "id": 5, "category": "격국", "title": "사회적 페르소나", "content": "..." },
    { "id": 6, "category": "반전", "title": "겉모습 vs 내면의 반전", "content": "..." },
    { "id": 7, "category": "직업적성", "title": "당신의 천직", "content": "..." },
    { "id": 8, "category": "현재대운", "title": "지금 이 시기는", "content": "..." },
    { "id": 9, "category": "인생테마", "title": "당신의 인생 테마", "content": "..." }
  ]
}
\`\`\`

모든 분석은 위 사주 데이터에 기반하며, 일반론이 아닌 이 사람만의 구체적인 해석이어야 합니다.`
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
      id: f.id || idx + 1,
      category: f.category || 'unknown',
      title: f.title || '',
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
    const { allowed, remaining } = await checkRateLimit(supabase, ip, 100)
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
