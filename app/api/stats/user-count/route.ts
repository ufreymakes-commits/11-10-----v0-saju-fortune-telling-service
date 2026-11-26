import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Reports delivered before BASELINE_AT (owner's figure, also shown across the site) + real submissions since then.
// The number only goes up when a real person submits their birth info.
const BASE_COUNT = 6425
const BASELINE_AT = '2026-11-26T14:00:00Z'

export const revalidate = 30

export async function GET() {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', BASELINE_AT)
    if (error) throw error
    return NextResponse.json({ count: BASE_COUNT + (count ?? 0) })
  } catch (e) {
    console.error('[v0] user-count error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ count: BASE_COUNT })
  }
}
