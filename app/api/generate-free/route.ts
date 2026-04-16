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
    const allSajuData = {
      name,
      gender,
      birthDate: birth_date,
      dayMaster: saju_data.dayPillar?.stem || '',
      dayMasterKorean: saju_data.dayMasterKorean || '',
      lifeStage: saju_data.gyeokguk || '',
      energyGrade: saju_data.sinGangSinYak?.grade || '',
      energyRatio: saju_data.sinGangSinYak?.ratio || 0,
      elementBasic: saju_data.elementBalanceKorean || {},
      elementAdjusted: saju_data.elementBalanceAdjustedKorean || {},
      elementCount: saju_data.elementCount || {},
      tenGodsPresent: saju_data.tenGods?.present || [],
      tenGodsMissing: saju_data.tenGods?.missing || [],
      twelveStars: saju_data.twelveStars?.map(s => `${s.position}:${s.star}`).join(', ') || '',
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
      spirits: saju_data.spirits || [],
      gongmang: saju_data.gongmang || [],
      yongsin: {
        value: saju_data.eokbuYongsin || 'None',
        exists: !!saju_data.eokbuYongsin
      },
      daewoon: saju_data.daewoon?.slice(0, 3).map(d => `${d.startAge}-${d.endAge}: ${d.fullName}`).join(', ') || '',
      yeonwoon2026: saju_data.yeonwoon?.find(y => y.year === 2026)?.fullName || ''
    }

    const userPrompt = `Generate EXACTLY 9 personalized Saju insights for this person:

CLIENT DATA:
${JSON.stringify(allSajuData, null, 2)}

REQUIREMENTS:
- 정확히 9개 섹션 (id: 1-9)
- 각 섹션: 2-3문장
- 마지막 문장 끝에 포인터 필수: ⟦데이터필드⟧ ⟦데이터필드⟧
- Section 4 또는 5는 커리어 (산업+직무 제안)
- Section 7-9는 운세/미래 (hero's journey 톤)
- Yongsin.exists=${allSajuData.yongsin.exists} → ${allSajuData.yongsin.exists ? '용신 단어 허용' : '용신 단어 금지! 대신 오행 점수/상태로 표현'}

POINTER REFERENCE:
- sinGangSinYak.grade: ${allSajuData.energyGrade} (${allSajuData.energyRatio}%)
- elementBalanceAdjusted: 木${Object.keys(allSajuData.elementAdjusted).length ? '있음' : '없음'}
- tenGods.present: ${allSajuData.tenGodsPresent.join(', ')}
- yongsin.exists: ${allSajuData.yongsin.exists}

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
