import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submissionId')

  if (!submissionId) {
    return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: report } = await supabase
    .from('compatibility_reports')
    .select('facts')
    .eq('submission_id', submissionId)
    .eq('section_key', 'compatibility_full')
    .single()

  if (!report || !report.facts) {
    return NextResponse.json({ facts: null })
  }

  return NextResponse.json({ facts: report.facts })
}
