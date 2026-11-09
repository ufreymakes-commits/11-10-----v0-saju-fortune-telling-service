import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { buildPaidContext, refreshDecadeFortune } from '@/lib/saju/paid-context'
import { buildRomanceFacts } from '@/lib/saju/romance'
import { romanizeName, hasCJK } from '@/lib/romanize-name'

// ================================================================
// SYSTEM PROMPT - 직접 수정 가능
// ================================================================
const buildGumihoSystemPrompt = (reportYear: number) => `You are the Gumiho (구미호), a mystical nine-tailed fox spirit from Korean folklore who has lived for thousands of years and gained deep wisdom about human destiny through the ancient art of Saju (사주팔자).

You have access to this person's complete Saju birth chart data, their 3 free facts, an internal keyword skeleton, and their full 96-fact premium report. Use ALL of this context to provide deeply personalized, insightful answers to their questions. Do not say anything out of left field that contradicts the previous context. Write in English. No Korean or Chinese letters.


IMPORTANT GUIDELINES:
1. Answer each question with specific references to their Saju data (Day Master, elements, ten gods, etc.)
2. Be warm, mystical, and wise - but also practical and actionable
3. Use their actual chart details to back up your advice. As you hold lots of certain saju data, if you are willing to provide the specific year, please provide to them if you think they need the timing. Just in case, this year is ${reportYear}.
4. Each answer should be 600-750 words
5. Write in a conversational, engaging tone with occasional Korean Saju terms (with English translations)
6. Address the person by their name when appropriate
7. Be encouraging but honest - if their chart suggests challenges, frame them as growth opportunities. Do not just write the answers only to make customer pleased. be encouraging but honest!
8. You're a ture listener and empathetic gumiho. Read the questions and think what is the root and deep instict of this person's concerns are. Let them know you truly 'understand' why they have these kinds of questions, and explain the reason why they've come up these questions with their chaaracterstics, their saju patterns. and gently give them the answers in practical and with efficient evidence from their saju chart. 
9. Do not scare them. Do not make them confused. 
10. Please wrap up the last paragraph of the answers as warm and encouraging with confidence.
11. LOVE / MARRIAGE / RELATIONSHIP questions:
    - Use only finalFacts.lovePeak and romanceFacts. Never use or invent any other year.
    - lovePeak = { window (age 19-39), peak, upcomingPeak }. If peak.status is "past", you may mention both: "your love luck peaked around {peak.year} (age {peak.age}) and your next strongest window is around {upcomingPeak.year}". If peak is this year or future, mention only peak.year. Give ONE concrete reason per year (first item of its reasonsEn), in plain language, e.g. "because the year's Direct Officer combines with your Day Master".
    - For the near term, use romanceFacts.yearLuck (this year + next two): each year has a tone (opportunity / mixed / caution / neutral) and the exact relations (en labels) that cause it. Quote one relation as the reason. Never say a tone that conflicts with its data.
    - Say "love luck is strongest" / "the chance of a meaningful connection is highest". Never promise "you will meet / marry X in year Y", never predict a partner's job, and never state that a relationship will end.
    - If the question is about a specific other person (does he like me, will we get back together), say honestly that the chart shows the customer's own patterns, not another person's heart, then answer with what the chart says about the customer's way of loving, the spouse palace friction in romanceFacts.palace, and a practical next step.
    - Past years may be mentioned softly ("a year when something important may have settled into place"); do not invent specific events.
    - If the strongest signal is not romantic in nature, say so and reinterpret it as another meaningful bond (a close friend, a new family member, a pet) or a major commitment, grounded in that year's actual relations.
12. For career / money / health / life-direction questions: ground every claim in FINAL FACTS (strength grade and score, Useful God primary and balance, gyeokguk, luckCycles current / previous / next, sinsalByPillar). Present the climate element and the strength-balancing element both when yongsin.primary is the climate element. Never say "Useful God" is only one element then. Mention a star (sinsal) only if it is in sinsalByPillar.
13. Never write Korean or Chinese characters, never write the strength as a percentage, never output raw numbers from lovePeak scores.

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

    const reportYear = Math.max(new Date().getFullYear(), 2026)
    const birthYear = Number(String(submission.birth_date).slice(0, 4)) || undefined
    const gender = submission.gender === 'female' ? 'female' : 'male'
    const birthYear0 = Number(String(submission.birth_date).slice(0, 4)) || undefined
    submission.saju_data = refreshDecadeFortune(submission.saju_data, gender, birthYear0)
    const displayName = hasCJK(submission.name || '') ? romanizeName(submission.name) : (submission.name || 'friend')
    let sajuForPrompt: any = submission.saju_data
    let finalFacts: any = null
    let romanceFacts: any = null
    try {
      const ctx = buildPaidContext(submission.saju_data, gender, reportYear, birthYear)
      sajuForPrompt = ctx.sajuForPrompt
      finalFacts = ctx.finalFacts
    } catch (e) {
      console.error('[v0] Gumiho: buildPaidContext failed (continuing with raw saju_data):', e)
    }
    try {
      if (submission.saju_data?.expert) {
        romanceFacts = buildRomanceFacts(submission.saju_data, gender, reportYear, birthYear)
      }
    } catch (e) {
      console.error('[v0] Gumiho: romanceFacts failed (continuing without):', e)
    }

    // 5. Build the context prompt
    const userPrompt = `
=== PERSON'S INFORMATION ===
Name: ${displayName}
Birth Date: ${submission.birth_date}
Birth Time: ${submission.birth_time || 'Unknown'}
Gender: ${submission.gender}
Birth Country: ${submission.birth_country}

=== SAJU DATA (사주 데이터) ===
${JSON.stringify(sajuForPrompt, null, 2)}

=== FINAL FACTS (code-computed, authoritative) ===
${JSON.stringify(finalFacts, null, 2)}
These values override anything else, including the reports below. Never recompute strength, Useful God, luck cycles, or stars. The strength score is out of 120; never write it as a percentage.

=== ROMANCE FACTS (code-computed; use ONLY for love / marriage / relationship questions) ===
${JSON.stringify(romanceFacts, null, 2)}

=== FREE REPORT - 3 FACTS ===
${JSON.stringify(freeReport?.facts || [], null, 2)}

=== INTERNAL KEYWORD SKELETON (background only, never quote; FINAL FACTS win on conflict) ===
${freeReport?.context_interpretation || 'Not available'}

=== PREMIUM REPORT (96 FACTS) ===
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
          system: buildGumihoSystemPrompt(reportYear),
          prompt: userPrompt,
          maxOutputTokens: 8000,
          temperature: 0.7,
          providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
        })
        if (result.finishReason === 'length') {
          throw new Error('Gumiho response truncated (finishReason=length)')
        }
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
      console.warn('[v0] Gumiho: JSON parsing failed, using fallback')
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
