import { after, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isLookupRateLimited } from '@/lib/lookup-rate-limit'
import { sendReportLinksEmail } from '@/lib/email/report-links'

export const maxDuration = 60

const GENERIC_MESSAGE = 'If we found a report for that email and birth date, we sent the link to your inbox.'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

async function findAndSend(email: string, birthDate: string) {
  const admin = createAdminClient()

  const { data: submissions, error } = await admin
    .from('submissions')
    .select('id, name')
    .ilike('email', escapeLike(email))
    .eq('birth_date', birthDate)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !submissions || submissions.length === 0) return

  const ids = submissions.map((s) => s.id as string)
  const { data: paid } = await admin
    .from('payments')
    .select('submission_id')
    .in('submission_id', ids)
    .eq('status', 'completed')

  const paidIds = new Set((paid ?? []).map((p) => p.submission_id as string))
  const items = submissions
    .filter((s) => paidIds.has(s.id as string))
    .map((s) => ({ submissionId: s.id as string, name: s.name as string | null }))

  if (items.length === 0) return
  await sendReportLinksEmail(email, items)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const birthDate = typeof body.birthDate === 'string' ? body.birthDate.trim() : ''

    if (!EMAIL_RE.test(email) || email.length > 254 || !DATE_RE.test(birthDate)) {
      return NextResponse.json({ error: 'Please enter a valid email and a birth date like 1990-05-21.' }, { status: 400 })
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

    const limited = await isLookupRateLimited(ip, email)

    // Do the lookup after responding so the answer and its timing never reveal whether the email is a customer.
    if (!limited) {
      after(async () => {
        try {
          await findAndSend(email, birthDate)
        } catch (e) {
          console.error('[v0] lookup-report background error:', e instanceof Error ? e.message : 'unknown')
        }
      })
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  } catch (err) {
    console.error('[v0] lookup-report error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  }
}
