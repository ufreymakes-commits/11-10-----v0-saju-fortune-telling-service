import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCountryFullName } from '@/lib/country-name'

export async function POST(request: Request) {
  try {
    const { name, birthDate, country, birthTime } = await request.json()

    if (!name || !birthDate) {
      return NextResponse.json({ error: 'Name and birth date are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1차 시도: 이름 부분 일치 + 생년월일 검색 (이름 중 첫 단어만으로도 검색 가능)
    const nameTrimmed = name.trim()
    const firstName = nameTrimmed.split(' ')[0] // "Yuri Park" → "Yuri"
    const { data, error } = await supabase
      .from('submissions')
      .select('id, name, birth_date, paid_report_url, created_at')
      .ilike('name', `%${firstName}%`)
      .eq('birth_date', birthDate)
      .not('paid_report_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[v0] Lookup error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

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

    // 2차 시도: 이름 + 생년월일 + 국가까지 포함
    if (country) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('submissions')
        .select('id, name, birth_date, paid_report_url, created_at')
        .ilike('name', `%${firstName}%`)
        .eq('birth_date', birthDate)
        .in('birth_country', [country, getCountryFullName(country)])
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
