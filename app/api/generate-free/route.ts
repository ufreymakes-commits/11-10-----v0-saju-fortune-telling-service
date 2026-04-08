import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import type { CompleteAnalysis } from '@/lib/saju/complete-analysis'
import { buildCompleteAnalysis } from '@/lib/saju/complete-analysis'
import { headers } from 'next/headers'

// Rate Limit 체크 (IP당 하루 N회, 기본값 3)
async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ip: string,
  maxRequests: number = 3
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

// AI 프롬프트 생성 (완전 분석 데이터 포함)
function buildPrompt(analysis: CompleteAnalysis): string {
  const { 
    name, gender, birthCountry, age,
    fourPillars, twelveStars, tenGods, cheongganHap, jijiYughap, jijiSamhap, jijiBanghap,
    cheongganChung, jijiChung, gongmang, hyeong, pa, hae, wonjin, gilseong,
    sinGangSinYak, eokbuYongsin, johuYongsin, gyeokguk, sinsalsa, daeyun, annual2026
  } = analysis

  const twelveStarsStr = twelveStars
    .map(ts => `${ts.position}${ts.branch}:${ts.star}`)
    .join(' / ')

  const gilseongStr = [
    ...gilseong.cheonul.map(g => `천을귀인:${g}`),
    ...gilseong.taegeuk.map(g => `태극귀인:${g}`)
  ].join(' / ')

  const daeyunStr = daeyun
    .slice(0, 3)
    .map(d => `${d.period}세: ${d.saju}`)
    .join(' / ')

  return `당신은 30년 이상의 경력을 가진 사주 명리학 석사입니다. 당신의 해석은 정확하고 세밀하며, 사람들이 "정말 내 인생을 읽은 것 같다"고 놀라워합니다.

## 클라이언트 정보
- 이름: ${name}
- 성별: ${gender}
- 출생국: ${birthCountry}
- 2026년 기준 나이: ${age}세

## 사주 8글자
- 년주: ${fourPillars.yearPillar?.fullName || 'N/A'}
- 월주: ${fourPillars.monthPillar?.fullName || 'N/A'}
- 일주: ${fourPillars.dayPillar?.fullName || 'N/A'}
- 시주: ${fourPillars.hourPillar?.fullName || 'N/A'}

## 핵심 분석 데이터

### 기본 요소
- 일간 (Day Master): ${fourPillars.dayMaster}
- 12운성: ${twelveStarsStr}
- 신강/신약: ${sinGangSinYak.grade} (${sinGangSinYak.ratio}%)
- 격국: ${gyeokguk}

### 십신 (十神)
- 보유 십신: ${tenGods.present.join(', ')}
- 부재 십신: ${tenGods.absent.join(', ')}

### 관계식 (關係式)
- 천간합: ${cheongganHap.length > 0 ? cheongganHap.join(' / ') : '없음'}
- 지지육합: ${jijiYughap.length > 0 ? jijiYughap.join(' / ') : '없음'}
- 지지삼합: ${jijiSamhap.length > 0 ? jijiSamhap.join(' / ') : '없음'}
- 지지방합: ${jijiBanghap.length > 0 ? jijiBanghap.join(' / ') : '없음'}
- 천간충: ${cheongganChung.length > 0 ? cheongganChung.join(' / ') : '없음'}
- 지지충: ${jijiChung.length > 0 ? jijiChung.join(' / ') : '없음'}
- 형: ${hyeong.length > 0 ? hyeong.join(' / ') : '없음'}
- 파: ${pa.length > 0 ? pa.join(' / ') : '없음'}
- 해: ${hae.length > 0 ? hae.join(' / ') : '없음'}
- 원진: ${wonjin.length > 0 ? wonjin.join(' / ') : '없음'}

### 길성 (吉星)
${gilseongStr.length > 0 ? gilseongStr : '해당 없음'}

### 신살 (神殺)
${sinsalsa.length > 0 ? sinsalsa.join(' / ') : '해당 없음'}

### 공망 (空亡)
${gongmang.join('·')}

### 용신 (用神)
- 억부용신: ${eokbuYongsin}
- 조후용신: ${johuYongsin}

### 대운 (大運)
${daeyunStr}

### 2026년 운세
- 기간: ${annual2026.startDate} ~ ${annual2026.endDate}
- 간지: ${annual2026.saju}
- Day Master: ${annual2026.dayMaster}

## 작업 지시사항

위의 사주 정보를 종합적으로 분석하여 **정확히 9개의 놀라운 사실**을 생성해주세요. 각 팩트는:
1. 그 사람의 실제 특성을 반영하고
2. 깊이있고 정확해 보여야 하며
3. "와, 이거 정말 내 얘기다!"라고 느끼게 만들어야 합니다.

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
    },
    ...
  ]
}
\`\`\`

모든 분석은 한국 사주 명리학 전통에 기반하며, 이 사람의 구체적인 데이터를 반영해야 합니다.`
}

// AI를 통한 9개 팩트 생성
async function generateFactsFromAI(analysis: CompleteAnalysis): Promise<Fact[]> {
  const prompt = buildPrompt(analysis)

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    prompt,
    temperature: 0.7,
    maxOutputTokens: 2000,
  })

  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없음')

    const parsed = JSON.parse(jsonMatch[1])
    const facts: Fact[] = parsed.facts.map((f: any, idx: number) => ({
      id: String(idx + 1),
      category: f.category || 'unknown',
      title: f.title || '제목 없음',
      content: f.content || '내용 없음'
    }))

    return facts
  } catch (error) {
    console.error('[v0] AI parsing error:', error)
    return getFallbackFacts(analysis)
  }
}

// 폴백: 템플릿 기반 팩트 생성
function getFallbackFacts(analysis: CompleteAnalysis): Fact[] {
  const { name, fourPillars, sinGangSinYak, tenGods } = analysis
  
  return [
    {
      id: '1',
      category: '성격',
      title: `${name}, 당신은 ${fourPillars.dayMaster} 일간입니다`,
      content: `당신의 본질은 ${sinGangSinYak.grade}(${sinGangSinYak.ratio}%)로, 독립적이고 주체적인 성향을 가지고 있습니다.`
    },
    {
      id: '2',
      category: '성격',
      title: '보유한 십신으로 본 당신의 강점',
      content: `당신은 ${tenGods.present.join(', ')}의 십신을 가지고 있어, 이들 특성에 뛰어나 있습니다.`
    },
    {
      id: '3',
      category: '직업',
      title: '적성 직업',
      content: '당신의 십신과 격국을 고려할 때, 창의적이고 리더십이 필요한 직무에 적합합니다.'
    },
    {
      id: '4',
      category: '직업',
      title: '경력 발전 시기',
      content: '30~40대에 당신의 운이 가장 좋아질 가능성이 높으며, 이 시기에 중요한 결정을 하는 것이 좋습니다.'
    },
    {
      id: '5',
      category: '연애',
      title: '연애 성향',
      content: '당신은 깊은 감정을 가진 사람으로, 진정한 이해와 감정 교감을 중요시합니다.'
    },
    {
      id: '6',
      category: '연애',
      title: '이상적인 파트너',
      content: '당신과 오행이 조화를 이루는 사람, 특히 당신을 충분히 이해하고 지지해주는 사람과 좋은 관계를 만들 수 있습니다.'
    },
    {
      id: '7',
      category: '인간관계',
      title: '대인관계 스타일',
      content: '당신은 신중하고 분석적인 성향으로, 신뢰할 수 있는 소수의 깊은 관계를 선호합니다.'
    },
    {
      id: '8',
      category: '인생',
      title: '인생의 중요한 전환점',
      content: '당신의 대운에서 중요한 변화가 일어날 시기들이 있으며, 이들 시기에 준비된 결정이 인생을 바꿀 수 있습니다.'
    },
    {
      id: '9',
      category: '2026년 운세',
      title: '2026년 당신의 운세',
      content: '2026년 병오년은 창의성과 주도성이 강조되는 해입니다. 이 시기에 시작한 일들은 좋은 결과를 얻을 가능성이 높습니다.'
    }
  ]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, gender, birthCountry, birthDate, sajuData } = body

    // IP 추출
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 
               headersList.get('x-real-ip') || 
               'unknown'

    const supabase = await createClient()

    // Rate Limit 체크 (임시로 10회로 증가)
    const { allowed, remaining } = await checkRateLimit(supabase, ip, 10)
    if (!allowed) {
      return NextResponse.json(
        { error: '하루 10회 제한입니다. 내일 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // 완전한 분석 데이터 생성
    const analysis = buildCompleteAnalysis(
      name,
      gender,
      birthCountry,
      new Date(birthDate),
      sajuData
    )

    // 캐시 키 생성
    const sajuKey = `${sajuData.yearPillar?.fullName}_${sajuData.monthPillar?.fullName}_${sajuData.dayPillar?.fullName}_${sajuData.hourPillar?.fullName || 'none'}`

    // 캐시 확인
    const cachedFacts = await getCachedFacts(supabase, sajuKey)
    let facts: Fact[]

    if (cachedFacts) {
      facts = cachedFacts
    } else {
      // AI로 새로운 팩트 생성
      facts = await generateFactsFromAI(analysis)
      
      // 캐시에 저장
      await cacheFacts(supabase, sajuKey, facts)
    }

    return NextResponse.json(
      {
        facts,
        remaining,
        analysis
      },
      {
        headers: {
          'X-Remaining-Requests': remaining.toString()
        }
      }
    )
  } catch (error) {
    console.error('[v0] generate-free error:', error)
    return NextResponse.json(
      { error: '팩트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
