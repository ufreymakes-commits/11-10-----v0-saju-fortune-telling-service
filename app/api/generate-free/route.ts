import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

/**
 * Single-Shot Generation: 
 * 모든 프롬프트를 한 번에 발사
 * System: 마스터피스 가이드 + 역할 정의 (고정)
 * User: 고객 사주 데이터 + 최종 요청 (변수)
 */

export async function POST(request: Request) {
  try {
    const { name, gender, birth_country, birth_date, saju_data } = await request.json()

    if (!saju_data) {
      return NextResponse.json({ error: 'Missing saju_data' }, { status: 400 })
    }

    console.log(`[v0] Generating 9 facts for ${name}`)

    // ===== SYSTEM PROMPT (고정: 마스터피스 가이드 + 역할 정의) =====
    const systemPrompt = `You are a hyper-specialized Saju(사주) analyst trained on the following masterpiece guide. Your role is to generate exactly 9 personalized insights that are:
- SPECIFIC to THIS PERSON's unique birth chart (not generic)
- GROUNDED in actual life scenarios (not abstract psychology)
- FALSIFIABLE (would NOT apply to different birth data)
- POINTERS REQUIRED (each sentence ends with ⟦dataPointer⟧)

MASTERPIECE GUIDE (당신의 모든 분석의 근거):
${JSON.stringify(SAJU_MASTERPIECE_GUIDE, null, 2)}

CORE RULES:
1. Length: 2-3 sentences EXACTLY per section
2. Tone: Gen-Z (giving, lowkey, main character energy, no cap) + informative
3. Format: Each section ends with ⟦pointer1⟧ ⟦pointer2⟧
4. Real life: "When you..." NOT "You tend to..."
5. Section 4 or 5 MUST be career-specific (industry + role)
6. Yongsin handling: If no yongsin exists, NEVER use "용신" - use element scores/status instead
7. Domains: Personality (1-3) → Career/Lifestyle (4-6) → Fortune/Destiny (7-9)`

    // ===== USER PROMPT (변수: 고객 데이터 + 요청) =====
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
      
      // 대운 (처음 3개)
      daewoon: saju_data.daewoon?.slice(0, 3).map(d => ({
        startAge: d.startAge,
        endAge: d.endAge,
        ganzi: `${d.stem}${d.branch}`,
        fullName: d.fullName
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

    console.log('[v0] ===== FINAL COMPLETE CUSTOMER DATA SENT TO GPT =====')
    console.log('[v0]', JSON.stringify(allSajuData, null, 2))
    console.log('[v0] =====================================================')

    const userPrompt = `Generate EXACTLY 9 personalized Saju insights for this person:

CLIENT DATA (모든 사주 계산값 포함):
${JSON.stringify(allSajuData, null, 2)}

REQUIREMENTS:
- 정확히 9개 섹션 (id: 1-9)
- 각 섹션: 2-3문장
- 마지막 문장 끝에 포인터 필수: ⟦데이터필드⟧ ⟦데이터필드⟧
- Section 4 또는 5는 커리어 (산업+직무 제안)
- Section 7-9는 운세/미래 (hero's journey 톤)
- Yongsin.exists=${allSajuData.yongsin.exists} → ${allSajuData.yongsin.exists ? '용신 단어 허용' : '용신 단어 금지! 대신 오행 점수/상태로 표현'}
- 십신 개수 활용: ${tenGodsFormatted}

CRITICAL RULE:
계산된 모든 사주 데이터는 당신의 분석 근거입니다. 
- elementAdjusted의 점수 차이
- tenGodsCounts의 편향성 (특정 십신 과다/부재)
- 합충이 오행에 미치는 영향
- 신살의 위치와 강도
- 대운의 오행이 현재와 만날 때의 상충/조화
위 모든 것을 분석에 정확히 반영하세요.

OUTPUT FORMAT (ONLY JSON):
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
\`\`\``

    console.log('[v0] Calling GPT with System/User separation')

    // generateText with System prompt
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8,
      maxTokens: 3000
    })

    console.log('[v0] GPT response received, parsing...')

    // JSON 파싱
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      console.error('[v0] JSON not found in response')
      throw new Error('JSON format not found')
    }

    const parsed = JSON.parse(jsonMatch[1])
    const facts: Fact[] = parsed.facts.map((f: any) => ({
      id: f.id,
      text: f.content,
      category: f.title,
      title: f.title
    }))

    console.log(`[v0] Generated ${facts.length} facts`)

    // 응답 준비
    const teaser_facts = facts.map(fact => ({
      title: fact.title,
      teaser: fact.text.split('⟦')[0].substring(0, 100) + '...'
    }))

    return NextResponse.json({
      status: 'success',
      facts,
      teaser_facts,
      message: 'Birth chart analysis complete'
    })
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
