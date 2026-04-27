import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_type, page, metadata, session_id } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type required' }, { status: 400 })
    }

    await supabase.from('analytics_events').insert({
      event_type,
      page: page || null,
      metadata: metadata || {},
      session_id: session_id || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
