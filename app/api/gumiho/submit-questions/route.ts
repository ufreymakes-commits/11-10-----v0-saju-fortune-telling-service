import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getGumihoEntitlementState } from '@/lib/payments/gumiho-entitlement'
import { isRelationship, isSituation } from '@/lib/saju/year-snapshot'

const MAX_QUESTION_LENGTH = 300

const stripControlChars = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()

export async function POST(request: Request) {
  try {
    const { submissionId, question1, question2, question3, currentSituation, relationshipStatus } = await request.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rawQuestions = [question1, question2, question3]
    const questions: string[] = []
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = typeof rawQuestions[i] === 'string' ? stripControlChars(rawQuestions[i]) : ''
      if (!q) {
        return NextResponse.json({ error: `Question ${i + 1} cannot be empty.` }, { status: 400 })
      }
      if (q.length > MAX_QUESTION_LENGTH) {
        return NextResponse.json(
          { error: `Question ${i + 1} is too long (${q.length} characters). Please keep each question under ${MAX_QUESTION_LENGTH} characters.` },
          { status: 400 },
        )
      }
      questions.push(q)
    }

    const supabase = await createClient()

    // Verify submission exists and has paid report
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('id, name')
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify user has purchased 99 Facts report
    const { data: paidReport } = await supabase
      .from('reports')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('section_key', 'paid_full')
      .single()

    if (!paidReport) {
      return NextResponse.json({ error: '99 Facts report required' }, { status: 403 })
    }

    // Bundled entitlement: fill the pre-paid placeholder instead of creating a new (unpaid) row.
    const entitlement = await getGumihoEntitlementState(submissionId)
    if (entitlement.refunded) {
      return NextResponse.json(
        { error: 'The Gumiho add-on for this order was refunded, so new questions cannot be submitted.', code: 'gumiho_refunded' },
        { status: 403 },
      )
    }
    const entitlementId = entitlement.unusedQuestionId
    if (entitlementId) {
      const admin = createAdminClient()
      const { data: filled, error: fillError } = await admin
        .from('gumiho_questions')
        .update({ question_1: questions[0], question_2: questions[1], question_3: questions[2] })
        .eq('id', entitlementId)
        .eq('submission_id', submissionId)
        .eq('question_1', '')
        .select('id')

      if (fillError) {
        console.error('[v0] Gumiho bundled question update error:', fillError)
        return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
      }
      if (filled && filled.length > 0) {
        // Add-on only: situation + relationship status for the Year Snapshot. Best effort, never blocks the questions.
        if (isSituation(currentSituation) && isRelationship(relationshipStatus)) {
          const { error: extraError } = await admin
            .from('gumiho_questions')
            .update({ current_situation: currentSituation, relationship_status: relationshipStatus, year_snapshot_status: 'generating' })
            .eq('id', entitlementId)
          if (extraError) console.error('[v0] Gumiho add-on profile save error:', extraError.message)
        }
        return NextResponse.json({ success: true, gumihoQuestionId: entitlementId, bundled: true })
      }
    }

    // Create gumiho question entry
    const { data: gumihoQuestion, error: insertError } = await supabase
      .from('gumiho_questions')
      .insert({
        submission_id: submissionId,
        question_1: questions[0],
        question_2: questions[1],
        question_3: questions[2],
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[v0] Gumiho question insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      gumihoQuestionId: gumihoQuestion.id,
    })
  } catch (error) {
    console.error('[v0] Gumiho submit questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
