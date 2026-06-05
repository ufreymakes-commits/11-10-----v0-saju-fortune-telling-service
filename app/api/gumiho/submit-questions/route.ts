import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { submissionId, question1, question2, question3 } = await request.json()

    if (!submissionId || !question1 || !question2 || !question3) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Create gumiho question entry
    const { data: gumihoQuestion, error: insertError } = await supabase
      .from('gumiho_questions')
      .insert({
        submission_id: submissionId,
        question_1: question1,
        question_2: question2,
        question_3: question3
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[v0] Gumiho question insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      gumihoQuestionId: gumihoQuestion.id 
    })
  } catch (error) {
    console.error('[v0] Gumiho submit questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
