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

    // Paid submissions — PayPal only (exclude coupon users)
    const { data: couponSubmissionIds } = await supabase
      .from('payments')
      .select('submission_id')
      .eq('status', 'completed')
      .like('paypal_order_id', 'COUPON-%')

    const couponIds = (couponSubmissionIds || []).map((r: { submission_id: string }) => r.submission_id).filter(Boolean) as string[]

    const { data: allPaidRows } = await supabase
      .from('submissions')
      .select('id')
      .not('paid_report_url', 'is', null)

    const paidSubmissions = (allPaidRows || []).filter(
      (r: { id: string }) => !couponIdSet.has(r.id)
    ).length

    // Payments — PayPal only (exclude coupon)
    const { count: totalPayments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .not('paypal_order_id', 'like', 'COUPON-%')

    // Coupon usage count
    const { count: couponUsageCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .like('paypal_order_id', 'COUPON-%')

    // Monthly paid report counts (last 12 months) — exclude coupon
    const { data: monthlyAllRaw } = await supabase
      .from('submissions')
      .select('id, created_at')
      .not('paid_report_url', 'is', null)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    const monthlyRaw = (monthlyAllRaw || []).filter(
      (r: { id: string; created_at: string }) => !couponIdSet.has(r.id)
    )

    const monthlyPaidCounts: Record<string, number> = {}
    for (const row of monthlyRaw || []) {
      const month = (row.created_at as string).slice(0, 7)
      monthlyPaidCounts[month] = (monthlyPaidCounts[month] || 0) + 1
    }

    // Payer country breakdown — exclude coupon
    const { data: payerCountryRows } = await supabase
      .from('payments')
      .select('payer_country')
      .eq('status', 'completed')
      .not('payer_country', 'is', null)
      .not('paypal_order_id', 'like', 'COUPON-%')

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

    // Daily submissions (last 30 days) — free + paid (paid excludes coupon)
    const { data: dailySubmissions } = await supabase
      .from('submissions')
      .select('id, created_at, paid_report_url')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())

    const couponIdSet = new Set(couponIds)
    const dailySubmissionCounts: Record<string, number> = {}
    const dailyPaidCounts: Record<string, number> = {}
    for (const s of dailySubmissions || []) {
      const day = (s.created_at as string).slice(0, 10)
      dailySubmissionCounts[day] = (dailySubmissionCounts[day] || 0) + 1
      if (s.paid_report_url && s.id && !couponIdSet.has(s.id)) {
        dailyPaidCounts[day] = (dailyPaidCounts[day] || 0) + 1
      }
    }

    return NextResponse.json({
      counts,
      daily,
      totalSubmissions,
      paidSubmissions,
      totalPayments,
      couponUsageCount,
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
