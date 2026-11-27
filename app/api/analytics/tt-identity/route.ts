// Returns only SHA-256 hashes (email, external_id) for a submission so the TikTok pixel can match
// checkout and purchase events to the right person. The plain email never leaves the server.
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function GET(request: Request) {
  const sid = new URL(request.url).searchParams.get('sid') || ''
  if (!UUID.test(sid)) return NextResponse.json({}, { status: 400 })
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('submissions').select('email').eq('id', sid).maybeSingle()
    const email = typeof data?.email === 'string' && data.email.includes('@') ? sha256(data.email) : undefined
    return NextResponse.json(
      { email, external_id: sha256(sid) },
      { headers: { 'Cache-Control': 'private, max-age=3600' } },
    )
  } catch {
    return NextResponse.json({ external_id: sha256(sid) })
  }
}
