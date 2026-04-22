import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { Fact } from '@/lib/types'

/**
 * 유료 레포트 생성 API (90개 사실)
 * 
 * 흐름:
 * 1. submissionId로 DB 조회 (사주데이터 + 무료 9개 사실 + 1500자 해설)
 * 2. 모든 context를 Gemini에 주입
 * 3. 90개 사실 생성 (중복 없음, 일관성 유지)
 * 4. DB에 저장 (is_free: false)
 */

// ===== 유료 레포트 프롬프트 (사용자가 이 부분을 수정) =====
const PAID_REPORT_SYSTEM_PROMPT = `You are an expert Korean Saju (四柱) analyst creating a premium paid report.

CRITICAL CONTEXT INJECTION:
The user has already received 9 FREE facts. You must now generate 90 ADDITIONAL facts.

RULES:
1. "Ensure Absolute Continuity" - The 90 new facts must be a seamless expansion of the initial 9 facts. There must be ZERO logical conflict or contradiction.

2. "Deep-Dive, Don't Repeat" - Do NOT repeat information from the first 9 facts. Instead, use them as 'Anchors' and dive deeper into the specific 'Why' and 'How' based on the 4 pillars. Think of the free report as the 'Trailer' and this paid report as the 'Full Deep-Dive Movie'.

3. "Narrative Alignment" - Maintain the same 'Life Persona' established in the first 9 facts. Use the initial analysis as the 'Source of Truth' to ensure the user feels like they are reading a single, cohesive story of their life.

4. "Conflict Prevention" - Before generating each fact, cross-check against the free 9 facts. If a new insight feels like it contradicts a previous one, pivot the perspective to explain the internal complexity of the Saju (e.g., 'While you show [Fact A] outwardly, your inner self struggles with [Fact B]').

TONE AND STYLE (mandatory):
- Write in natural, modern English like Gen-Z (lowkey, main character energy, no cap)
- Warm, grounded, emotionally intelligent (like a wise friend)
- Avoid heavy jargon - explain technical terms in plain English
- Use "may," "tends to," "can," "often" - avoid absolute statements
- Do NOT claim medical, legal, or guaranteed predictive outcomes
- Do NOT use fear-based language

OUTPUT FORMAT:
Generate exactly 90 facts organized into these 9 themes (10 facts each):
1. Core Personality (deeper than free version)
2. Hidden Shadows & Inner Conflicts
3. Career & Professional Destiny
4. Wealth & Financial Patterns
5. Love & Romantic Relationships
6. Family & Interpersonal Dynamics
7. Health & Energy Patterns
8. Life Cycles & Timing
9. Spiritual Growth & Life Purpose

Each fact must follow this JSON structure:
{
  "title": "Short catchy title (5-8 words)",
  "content": "Detailed explanation (80-150 words)",
  "theme": "one of the 9 themes above"
}

Return ONLY a valid JSON array of 90 fact objects. No markdown, no explanations outside the JSON.`

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. 결제 확인
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment required' }, { status: 403 })
    }

    // 2. 기존 유료 레포트 확인 (이미 생성된 경우 바로 반환)
    const { data: existingPaidReport } = await supabase
      .from('reports')
      .select('facts')
      .eq('submission_id', submissionId)
      .eq('is_free', false)
      .single()

    if (existingPaidReport?.facts) {
      console.log('[v0] Paid report already exists, returning cached version')
      return NextResponse.json({ 
        facts: existingPaidReport.facts,
        cached: true 
      })
    }

    // 3. submission 데이터 조회 (사주 데이터)
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 4. 무료 레포트 조회 (9개 사실 + 1500자 해설)
    const { data: freeReport, error: freeReportError } = await supabase
      .from('reports')
      .select('facts, context_interpretation')
      .eq('submission_id', submissionId)
      .eq('is_free', true)
      .single()

    if (freeReportError || !freeReport) {
      return NextResponse.json({ error: 'Free report not found. Please generate free report first.' }, { status: 404 })
    }

    const freeFacts = freeReport.facts as Fact[]
    const contextInterpretation = freeReport.context_interpretation || ''

    console.log(`[v0] Generating 90 paid facts for ${submission.name}`)

    // 5. Gemini에 전체 context 주입
    const userPrompt = `
=== CUSTOMER SAJU DATA ===
Name: ${submission.name}
Gender: ${submission.gender}
Birth Date: ${submission.birth_date}
Birth Country: ${submission.birth_country}

Four Pillars (四柱):
${JSON.stringify(submission.saju_data, null, 2)}

=== 1500-CHARACTER INTERPRETATION (from Stage 1) ===
${contextInterpretation}

=== FREE 9 FACTS ALREADY PROVIDED (DO NOT REPEAT) ===
${JSON.stringify(freeFacts, null, 2)}

=== YOUR TASK ===
Based on all the context above, generate 90 NEW facts that:
1. Expand deeply on the themes introduced in the 9 free facts
2. Never contradict or repeat the free facts
3. Maintain narrative consistency with the established "Life Persona"
4. Cover all 9 premium themes (10 facts each)

Generate the 90 facts now as a JSON array.`

    // 6. Gemini API 호출
    const { text: rawResponse } = await generateText({
      model: 'google/gemini-2.5-flash-preview-05-20',
      system: PAID_REPORT_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 16000,
      temperature: 0.7,
    })

    // 7. JSON 파싱
    let paidFacts: Fact[] = []
    try {
      // JSON 블록 추출 (```json ... ``` 형태일 수 있음)
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        paidFacts = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('[v0] Failed to parse Gemini response:', parseError)
      console.error('[v0] Raw response:', rawResponse.substring(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // 8. DB에 저장
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        submission_id: submissionId,
        payment_id: payment.id,
        section_key: 'paid_full',
        facts: paidFacts,
        is_free: false,
      })

    if (insertError) {
      console.error('[v0] Failed to save paid report:', insertError)
      // 저장 실패해도 응답은 반환 (사용자 경험 우선)
    }

    console.log(`[v0] Successfully generated ${paidFacts.length} paid facts for ${submission.name}`)

    return NextResponse.json({
      facts: paidFacts,
      cached: false,
    })

  } catch (error) {
    console.error('[v0] Generate paid report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
