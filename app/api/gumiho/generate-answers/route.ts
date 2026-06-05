import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

// ================================================================
// SYSTEM PROMPT - 직접 수정 가능
// ================================================================
const GUMIHO_SYSTEM_PROMPT = `You are the Gumiho (구미호), a mystical nine-tailed fox spirit from Korean folklore who has lived for thousands of years and gained deep wisdom about human destiny through the ancient art of Saju (사주팔자).

You have access to this person's complete Saju birth chart data, their 9 free facts, their detailed 1500-character interpretation, and their full 99 Facts premium report. Use ALL of this context to provide deeply personalized, insightful answers to their questions. Write in Korean.


IMPORTANT GUIDELINES:
1. Answer each question with specific references to their Saju data (Day Master, elements, ten gods, etc.)
2. Be warm, mystical, and wise - but also practical and actionable
3. Use their actual chart details to back up your advice
4. Each answer should be 1000-1200 words
5. Write in a conversational, engaging tone with occasional Korean Saju terms (with English translations)
6. Address the person by their name when appropriate
7. Be encouraging but honest - if their chart suggests challenges, frame them as growth opportunities
8. You're a ture listener and empathetic gumiho. Read the questions and think what is the root and deep instict of this person's concerns are. Let them know you truly 'understand' why they have these kinds of questions, and explain the reason why they've come up these questions with their chaaracterstics, their saju patterns. and gently give them the answers in practical and with efficient evidence from their saju chart. 
9. Do not scare them. Do not make them confused. 
10. Please wrap up the last paragraph of the answers as warm and encouraging with confidence.

FORMAT YOUR RESPONSE AS JSON:
{
  "answer_1": "Your detailed answer to question 1...",
  "answer_2": "Your detailed answer to question 2...",
  "answer_3": "Your detailed answer to question 3..."
}
`

export async function POST(request: Request) {
  try {
    const { gumihoQuestionId } = await request.json()

    if (!gumihoQuestionId) {
      return NextResponse.json({ error: 'Missing question ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verify payment is completed
    const { data: payment } = await supabase
      .from('gumiho_payments')
      .select('status, submission_id')
      .eq('gumiho_question_id', gumihoQuestionId)
      .single()

    if (!payment || payment.status !== 'completed') {
      return NextResponse.json({ error: 'Payment required' }, { status: 403 })
    }

    // 2. Get the questions
    const { data: gumihoQuestion, error: questionError } = await supabase
      .from('gumiho_questions')
      .select('*')
      .eq('id', gumihoQuestionId)
      .single()

    if (questionError || !gumihoQuestion) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 })
    }

    // 3. Check if already answered
    if (gumihoQuestion.answer_1 && gumihoQuestion.answer_2 && gumihoQuestion.answer_3) {
      return NextResponse.json({
        success: true,
        answers: {
          answer_1: gumihoQuestion.answer_1,
          answer_2: gumihoQuestion.answer_2,
          answer_3: gumihoQuestion.answer_3
        }
      })
    }

    const submissionId = gumihoQuestion.submission_id

    // 4. Get all context data
    // 4a. Submission data (saju data)
    const { data: submission } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 4b. Free report (9 facts + interpretation)
    const { data: freeReport } = await supabase
      .from('reports')
      .select('facts, context_interpretation')
      .eq('submission_id', submissionId)
      .eq('section_key', 'free')
      .single()

    // 4c. Paid report (99 facts)
    const { data: paidReport } = await supabase
      .from('reports')
      .select('facts')
      .eq('submission_id', submissionId)
      .eq('section_key', 'paid_full')
      .single()

    if (!paidReport) {
      return NextResponse.json({ error: '99 Facts report required' }, { status: 403 })
    }

    // 5. Build the context prompt
    const userPrompt = `
=== PERSON'S INFORMATION ===
Name: ${submission.name}
Birth Date: ${submission.birth_date}
Birth Time: ${submission.birth_time || 'Unknown'}
Gender: ${submission.gender}
Birth Country: ${submission.birth_country}

=== SAJU DATA (사주 데이터) ===
${JSON.stringify(submission.saju_data, null, 2)}

=== FREE REPORT - 9 FACTS ===
${JSON.stringify(freeReport?.facts || [], null, 2)}

=== FREE REPORT - INTERPRETATION (1500 chars) ===
${freeReport?.context_interpretation || 'Not available'}

=== PREMIUM 99 FACTS REPORT ===
${JSON.stringify(paidReport.facts, null, 2)}

=== USER'S 3 QUESTIONS ===
Question 1: ${gumihoQuestion.question_1}
Question 2: ${gumihoQuestion.question_2}
Question 3: ${gumihoQuestion.question_3}

Please provide deeply personalized answers to each of these 3 questions, drawing from ALL the Saju data and reports above.
`

    // 6. Call Gemini with retry logic
    console.log('[v0] Gumiho: Generating answers...')
    const startTime = Date.now()

    let rawResponse = ''
    let lastError: Error | null = null
    const MAX_RETRIES = 3

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[v0] Gumiho: API attempt ${attempt}/${MAX_RETRIES}`)
        const result = await generateText({
          model: 'google/gemini-2.5-flash',
          system: GUMIHO_SYSTEM_PROMPT,
          prompt: userPrompt,
          maxTokens: 4000,
          temperature: 0.7,
        })
        rawResponse = result.text
        console.log(`[v0] Gumiho: API succeeded on attempt ${attempt}`)
        break
      } catch (error) {
        lastError = error as Error
        console.error(`[v0] Gumiho: API attempt ${attempt} failed:`, error)
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    if (!rawResponse && lastError) {
      console.error('[v0] Gumiho: All API attempts failed')
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable. Please try again.',
        details: lastError.message 
      }, { status: 503 })
    }

    const geminiTime = Date.now() - startTime
    console.log(`[v0] Gumiho: Completed in ${geminiTime}ms`)

    // 7. Parse the response
    let answers: { answer_1: string; answer_2: string; answer_3: string }
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = rawResponse.match(/\{[\s\S]*"answer_1"[\s\S]*"answer_2"[\s\S]*"answer_3"[\s\S]*\}/)
      if (jsonMatch) {
        answers = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No valid JSON found')
      }
    } catch {
      // Fallback: split response into 3 parts
      console.log('[v0] Gumiho: JSON parsing failed, using fallback')
      const parts = rawResponse.split(/(?:answer|question)\s*[123][\s:]+/i).filter(p => p.trim())
      answers = {
        answer_1: parts[0] || rawResponse.slice(0, rawResponse.length / 3),
        answer_2: parts[1] || rawResponse.slice(rawResponse.length / 3, 2 * rawResponse.length / 3),
        answer_3: parts[2] || rawResponse.slice(2 * rawResponse.length / 3)
      }
    }

    // 8. Save answers to database
    const { error: updateError } = await supabase
      .from('gumiho_questions')
      .update({
        answer_1: answers.answer_1,
        answer_2: answers.answer_2,
        answer_3: answers.answer_3,
        answered_at: new Date().toISOString()
      })
      .eq('id', gumihoQuestionId)

    if (updateError) {
      console.error('[v0] Gumiho: Failed to save answers:', updateError)
    }

    return NextResponse.json({ success: true, answers })
  } catch (error) {
    console.error('[v0] Gumiho generate answers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
