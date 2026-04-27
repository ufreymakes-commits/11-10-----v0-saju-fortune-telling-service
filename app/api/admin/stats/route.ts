import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sajume-admin-2026'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-admin-password')
  if (auth !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Count each event type
    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type, created_at')

    const counts: Record<string, number> = {}
    const daily: Record<string, Record<string, number>> = {}

    for (const ev of events || []) {
      counts[ev.event_type] = (counts[ev.event_type] || 0) + 1
      const day = ev.created_at.slice(0, 10)
      if (!daily[day]) daily[day] = {}
      daily[day][ev.event_type] = (daily[day][ev.event_type] || 0) + 1
    }

    // Submissions from DB
    const { count: totalSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })

    // Paid submissions
    const { count: paidSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .not('paid_report_url', 'is', null)

    // Payments
    const { count: totalPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Monthly paid report counts (last 12 months)
    const { data: monthlyRaw } = await supabase
      .from('submissions')
      .select('created_at')
      .not('paid_report_url', 'is', null)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    const monthlyPaidCounts: Record<string, number> = {}
    for (const row of monthlyRaw || []) {
      const month = (row.created_at as string).slice(0, 7)
      monthlyPaidCounts[month] = (monthlyPaidCounts[month] || 0) + 1
    }

    // Payer country breakdown
    const { data: payerCountryRows } = await supabase
      .from('payments')
      .select('payer_country')
      .eq('status', 'completed')
      .not('payer_country', 'is', null)

    const payerCountryCounts: Record<string, number> = {}
    for (const row of payerCountryRows || []) {
      const code = row.payer_country as string
      payerCountryCounts[code] = (payerCountryCounts[code] || 0) + 1
    }

    // Notice me per-product breakdown
    const { data: noticeMeEvents } = await supabase
      .from('analytics_events')
      .select('metadata')
      .eq('event_type', 'notice_me_click')

    const noticeMeByProduct: Record<string, number> = {}
    for (const ev of noticeMeEvents || []) {
      const product = (ev.metadata as { product?: string })?.product || 'unknown'
      noticeMeByProduct[product] = (noticeMeByProduct[product] || 0) + 1
    }

    // Recent submissions — include birth_date for display
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select('id, name, country, birth_date, created_at, paid_report_url')
      .order('created_at', { ascending: false })
      .limit(20)

    // Daily submissions (last 14 days) — free + paid
    const { data: dailySubmissions } = await supabase
      .from('submissions')
      .select('created_at, paid_report_url')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())

    const dailySubmissionCounts: Record<string, number> = {}
    const dailyPaidCounts: Record<string, number> = {}
    for (const s of dailySubmissions || []) {
      const day = (s.created_at as string).slice(0, 10)
      dailySubmissionCounts[day] = (dailySubmissionCounts[day] || 0) + 1
      if (s.paid_report_url) {
        dailyPaidCounts[day] = (dailyPaidCounts[day] || 0) + 1
      }
    }

    return NextResponse.json({
      counts,
      daily,
      totalSubmissions,
      paidSubmissions,
      totalPayments,
      recentSubmissions,
      dailySubmissionCounts,
      dailyPaidCounts,
      noticeMeByProduct,
      monthlyPaidCounts,
      payerCountryCounts,
    })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
