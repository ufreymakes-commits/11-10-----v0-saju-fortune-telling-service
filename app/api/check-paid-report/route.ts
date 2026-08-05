import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submissionId')

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports')
    .select('facts, hidden_cards')
    .eq('submission_id', submissionId)
    .eq('section_key', 'paid_full')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data?.facts) {
    // Not ready yet
    return NextResponse.json({ ready: false }, { status: 200 })
  }

  return NextResponse.json({ ready: true, facts: data.facts, hiddenCards: data.hidden_cards || [] })
}
