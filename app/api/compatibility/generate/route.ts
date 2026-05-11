import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

// ================================================================
// STAGE 1: Build saju context string (2500 chars) from raw saju data
// ================================================================
function buildSajuContext(
  personAName: string,
  personBName: string,
  sajuDataA: Record<string, unknown>,
  sajuDataB: Record<string, unknown>
): string {
  const formatPillar = (p: { stem?: string; branch?: string; element?: string } | undefined) =>
    p ? `${p.stem || ''}${p.branch || ''} (${p.element || ''})` : 'unknown'

  const formatPerson = (name: string, data: Record<string, unknown>) => {
    const pillars = data.fourPillars as {
      year?: { stem?: string; branch?: string; element?: string }
      month?: { stem?: string; branch?: string; element?: string }
      day?: { stem?: string; branch?: string; element?: string }
      hour?: { stem?: string; branch?: string; element?: string }
    } | undefined
    const elements = data.elementBalance as Record<string, number> | undefined
    const dayMaster = data.dayMaster as { element?: string; yinYang?: string } | undefined

    return `
[${name}]
Four Pillars:
  Year: ${formatPillar(pillars?.year)}
  Month: ${formatPillar(pillars?.month)}
  Day: ${formatPillar(pillars?.day)}
  Hour: ${formatPillar(pillars?.hour)}
Day Master: ${dayMaster?.element || 'unknown'} (${dayMaster?.yinYang || 'unknown'})
Element Balance: ${elements ? Object.entries(elements).map(([k, v]) => `${k}: ${v}`).join(', ') : 'unknown'}
`.trim()
  }

  return `
SAJU COMPATIBILITY DATA
=======================
${formatPerson(personAName, sajuDataA)}

${formatPerson(personBName, sajuDataB)}

Combined Analysis Notes:
- Compare day masters for compatibility
- Analyze element balance between both charts
- Note any complementary or conflicting elements
- Assess the harmony of the four pillars
`.trim()
}

// ================================================================
// Gemini helper - AI SDK 사용 (generate-gemini와 동일)
// ================================================================
async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const result = await generateText({
    model: 'google/gemini-3-flash',
    system: systemPrompt,
    prompt: userPrompt,
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
    const sajuContext = buildSajuContext(
      submission.person_a_name,
      submission.person_b_name,
      submission.person_a_saju_data || {},
      submission.person_b_saju_data || {}
    )

    const stage1SystemPrompt = `여기에 입력하세요 (Stage 1 System Prompt - Saju Compatibility Interpretation Context)`

    const stage1UserPrompt = `여기에 입력하세요 (Stage 1 User Prompt - provide the saju context below and ask for interpretation)

${sajuContext}`

    const contextInterpretation = await callGemini(stage1SystemPrompt, stage1UserPrompt)

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

    const stage2Raw = await callGemini(stage2SystemPrompt, stage2UserPrompt)

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
