import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, birthDate, birthTime, country } = await request.json()

    if (!name || !birthDate) {
      return NextResponse.json({ error: 'Name and birth date are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // name + birth_date로 submissions 검색
    let query = supabase
      .from('submissions')
      .select('id, name, birth_date, birth_time, country, paid_report_url, created_at')
      .ilike('name', name.trim())
      .eq('birth_date', birthDate)
      .not('paid_report_url', 'is', null)
      .order('created_at', { ascending: false })

    // 선택적 필터
    if (birthTime) {
      query = query.eq('birth_time', birthTime)
    }
    if (country) {
      query = query.eq('country', country)
    }

    const { data, error } = await query.limit(5)

    if (error) {
      console.error('[v0] Lookup error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ found: false, message: 'No paid report found for this information.' })
    }

    return NextResponse.json({
      found: true,
      reports: data.map(s => ({
        submissionId: s.id,
        name: s.name,
        birthDate: s.birth_date,
        paidReportUrl: s.paid_report_url,
        createdAt: s.created_at,
      }))
    })
  } catch (err) {
    console.error('[v0] Lookup report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
