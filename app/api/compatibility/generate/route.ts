import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

// ================================================================
// STAGE 1: Build complete allSajuData (99 facts와 동일하게)
// ================================================================
function buildAllSajuData(
  personAName: string,
  personBName: string,
  sajuDataA: Record<string, unknown>,
  sajuDataB: Record<string, unknown>
) {
  const formatSajuData = (name: string, saju: Record<string, unknown>) => {
    // 99 facts의 allSajuData 구조와 동일하게 구성
    return {
      name,
      // 기본 정보
      birthDate: saju.birthDate || '',
      
      // 4주 (천간/지지)
      fourPillars: saju.fourPillars || {},
      
      // 일간 (중요)
      dayMaster: (saju.dayPillar as any)?.stem || '',
      dayMasterKorean: saju.dayMasterKorean || '',
      
      // 격국
      lifeStage: saju.gyeokguk || '',
      
      // 신강/신약
      energyGrade: (saju.sinGangSinYak as any)?.grade || '',
      energyRatio: (saju.sinGangSinYak as any)?.ratio || 0,
      
      // 오행 개수
      elementCountBasic: saju.elementCountBasic || {},
      elementCountWithHidden: saju.elementCount || {},
      
      // 오행 점수
      elementScore: saju.elementBalanceKorean || {},
      dominantElement: saju.dominantElement || '',
      
      // 십신
      tenGodsPresent: (saju.tenGods as any)?.present || [],
      tenGodsMissing: (saju.tenGods as any)?.missing || [],
      tenGodsCounts: saju.tenGodsCounts || {},
      tenGodsByPosition: (saju.tenGods as any)?.byPosition || {},
      
      // 12운성
      twelveStars: saju.twelveStars || [],
      
      // 관계식
      harmonies: {
        cheongganHap: saju.cheongganHap || [],
        jijiYughap: saju.jijiYughap || [],
        jijiSamhap: saju.jijiSamhap || [],
        jijiBanghap: saju.jijiBanghap || []
      },
      
      clashes: {
        cheongganChung: saju.cheongganChung || [],
        jijiChung: saju.jijiChung || []
      },
      
      hyeong: saju.hyeong || [],
      pa: saju.pa || [],
      hae: saju.hae || [],
      wonjin: saju.wonjin || [],
      
      // 길성
      gilseong: saju.gilseong || {},
      
      // 공망
      gongmang: saju.gongmang || [],
      
      // 신살
      spirits: saju.spirits || [],
      sinsalDetails: saju.sinsalDetails || [],
      sinsalSummary: saju.sinsalSummary || '',
      sinsalCombinedGuide: saju.sinsalCombinedGuide || '',
      
      // 12신살
      twelveSinsalByYearBranch: saju.twelveSinsalByYearBranch || {},
      twelveSinsalByDayBranch: saju.twelveSinsalByDayBranch || {},
      
      // 용신
      yongsin: saju.yongsin || { eokbu: 'None', johu: 'None', exists: false },
      
      // 대운
      daewoon: saju.daewoon || [],
      
      // 연운
      yeonwoon: saju.yeonwoon || { current2026: 'N/A', allYears: [] },
      
      // 합충 정보
      hapChungSummary: saju.hapChungSummary || '',
      hapChungAdjustmentDetails: saju.hapChungAdjustmentDetails || []
    }
  }

  return {
    personA: formatSajuData(personAName, sajuDataA),
    personB: formatSajuData(personBName, sajuDataB)
  }
}

// ================================================================
// Gemini helper - AI SDK 사용 (generate-gemini와 동일)
// ================================================================
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const result = await generateText({
    model: 'google/gemini-2-flash',
    system: systemPrompt,
    prompt: userPrompt,
    temperature: options?.temperature ?? 0,
    maxTokens: options?.maxTokens ?? 3000
  })
  return result.text
}

// ================================================================
// Main route
// ================================================================
export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    if (!submissionId) return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })

    const supabase = await createClient()

    // 1. Check payment is completed
    const { data: payment, error: paymentError } = await supabase
      .from('compatibility_payments')
      .select('status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 403 })
    }

    // 2. Check if report already exists
    const { data: existingReport } = await supabase
      .from('compatibility_reports')
      .select('id, facts')
      .eq('submission_id', submissionId)
      .single()

    if (existingReport?.facts) {
      return NextResponse.json({ success: true, reportId: existingReport.id })
    }

    // 3. Fetch submission data
    const { data: submission, error: subError } = await supabase
      .from('compatibility_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 4. Stage 1: Build context interpretation (~2500 chars)
    const allSajuData = buildAllSajuData(
      submission.person_a_name,
      submission.person_b_name,
      submission.person_a_saju_data || {},
      submission.person_b_saju_data || {}
    )

    console.log('[v0] Compatibility: ===== COMPLETE SAJU DATA FOR STAGE 1 & 2 =====')
    console.log('[v0] Compatibility:', JSON.stringify(allSajuData, null, 2))
    console.log('[v0] Compatibility: ====================================================')

    const stage1SystemPrompt = `여기에 입력하세요 (Stage 1 System Prompt - Saju Compatibility Interpretation Context)`

    const stage1UserPrompt = `여기에 입력하세요 (Stage 1 User Prompt)

Compatibility Chart Data (Complete Saju Information):
${JSON.stringify(allSajuData, null, 2)}`

    const contextInterpretation = await callGemini(stage1SystemPrompt, stage1UserPrompt, {
      temperature: 0,
      maxTokens: 3000
    })

    // Save stage 1 result
    const { data: reportRow, error: insertError } = await supabase
      .from('compatibility_reports')
      .insert({
        submission_id: submissionId,
        section_key: 'compatibility_full',
        context_interpretation: contextInterpretation,
        is_paid: true,
      })
      .select('id')
      .single()

    if (insertError || !reportRow) {
      console.error('[v0] Compatibility report insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save report context' }, { status: 500 })
    }

    // 5. Stage 2: Generate structured report sections from Stage 1 context
    const stage2SystemPrompt = `여기에 입력하세요 (Stage 2 System Prompt - Compatibility Report Writer)`

    const stage2UserPrompt = `여기에 입력하세요 (Stage 2 User Prompt - use the interpretation below to write structured sections)

Names: ${submission.person_a_name} & ${submission.person_b_name}

Stage 1 Context:
${contextInterpretation}

Return a JSON array of sections with this structure:
[
  {
    "title": "Section Title",
    "content": "Section content here...",
    "score": 85
  }
]`

    const stage2Raw = await callGemini(stage2SystemPrompt, stage2UserPrompt, {
      temperature: 0,
      maxTokens: 8000
    })

    console.log('[v0] Compatibility: Stage 2 raw response length:', stage2Raw.length)

    // === JSON 파싱 (generate-gemini의 정확한 로직 동일 적용) ===
    let stage2JsonMatch = stage2Raw.match(/```json\n([\s\S]*?)\n```/)
    
    if (!stage2JsonMatch) {
      stage2JsonMatch = stage2Raw.match(/```json([\s\S]*?)```/)
    }
    
    if (!stage2JsonMatch) {
      const directJsonMatch = stage2Raw.match(/(\[[\s\S]*\])/)
      if (directJsonMatch) {
        stage2JsonMatch = [null, directJsonMatch[1]]
      }
    }
    
    if (!stage2JsonMatch) {
      console.error('[v0] Compatibility: Stage 2 raw response:', stage2Raw)
      return NextResponse.json({ error: 'Failed to parse Stage 2 response' }, { status: 500 })
    }

    let facts: unknown[] = []
    try {
      facts = JSON.parse(stage2JsonMatch[1])
      if (!Array.isArray(facts)) {
        facts = [facts] // 단일 객체면 배열로 감싸기
      }
    } catch (parseErr) {
      console.error('[v0] Compatibility: JSON parse error:', parseErr, 'Raw:', stage2JsonMatch[1])
      facts = [{ title: 'Compatibility Report', content: stage2Raw, score: null }]
    }

    console.log(`[v0] Compatibility: Generated ${facts.length} facts from Stage 2`)

    // Save stage 2 result
    await supabase
      .from('compatibility_reports')
      .update({ facts })
      .eq('id', reportRow.id)

    return NextResponse.json({ success: true, reportId: reportRow.id })
  } catch (error) {
    console.error('[v0] Generate compatibility error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
