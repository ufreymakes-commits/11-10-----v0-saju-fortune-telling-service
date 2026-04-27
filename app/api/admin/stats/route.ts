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

    // Recent submissions
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select('id, name, country, created_at, paid_report_url')
      .order('created_at', { ascending: false })
      .limit(10)

    // Daily submissions (last 14 days)
    const { data: dailySubmissions } = await supabase
      .from('submissions')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())

    const dailySubmissionCounts: Record<string, number> = {}
    for (const s of dailySubmissions || []) {
      const day = s.created_at.slice(0, 10)
      dailySubmissionCounts[day] = (dailySubmissionCounts[day] || 0) + 1
    }

    return NextResponse.json({
      counts,
      daily,
      totalSubmissions,
      paidSubmissions,
      totalPayments,
      recentSubmissions,
      dailySubmissionCounts,
      noticeMeByProduct,
    })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
