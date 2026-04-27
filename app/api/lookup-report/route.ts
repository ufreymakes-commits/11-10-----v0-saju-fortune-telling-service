import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, birthDate, country, birthTime } = await request.json()

    if (!name || !birthDate) {
      return NextResponse.json({ error: 'Name and birth date are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Primary filter: name + birth_date + country (모두 있는 경우)
    // birthTime은 선택적, 최후순위
    let query = supabase
      .from('submissions')
      .select('id, name, birth_date, birth_time, country, paid_report_url, created_at')
      .ilike('name', name.trim())
      .eq('birth_date', birthDate)
      .not('paid_report_url', 'is', null)
      .order('created_at', { ascending: false })

    // 국가가 있으면 최우선 필터로 추가
    if (country) {
      query = query.eq('country', country)
    }

    const { data, error } = await query.limit(5)

    if (error) {
      console.error('[v0] Lookup error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 국가 필터로 찾았으면 바로 반환
    if (data && data.length > 0) {
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
    }

    // 국가 필터로 못 찾으면 국가 없이 name + birth_date만으로 재시도
    if (country) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('submissions')
        .select('id, name, birth_date, birth_time, country, paid_report_url, created_at')
        .ilike('name', name.trim())
        .eq('birth_date', birthDate)
        .not('paid_report_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!fallbackError && fallbackData && fallbackData.length > 0) {
        return NextResponse.json({
          found: true,
          reports: fallbackData.map(s => ({
            submissionId: s.id,
            name: s.name,
            birthDate: s.birth_date,
            paidReportUrl: s.paid_report_url,
            createdAt: s.created_at,
          }))
        })
      }
    }

    return NextResponse.json({ found: false, message: 'No paid report found. Please check your name and birth date.' })
  } catch (err) {
    console.error('[v0] Lookup report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
