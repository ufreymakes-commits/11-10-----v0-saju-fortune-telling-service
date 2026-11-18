import { randomUUID, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { upsertContact } from '@/lib/email/contacts'
import { runEmailDispatch } from '@/lib/email/dispatch'
import { enqueue } from '@/lib/email/queue'

const DEFAULT_TEST_EMAIL = 'ufrey.makes@gmail.com'

function isAdmin(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD
  const provided = request.headers.get('x-admin-password')
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const email = typeof body?.email === 'string' && body.email.trim() ? body.email : DEFAULT_TEST_EMAIL

  const contact = await upsertContact({ email })
  if (!contact) return NextResponse.json({ error: 'Invalid email or contact error' }, { status: 400 })

  // A fresh ref_id per call so repeated tests are not removed by the dedupe index.
  const queued = await enqueue(contact.id, 'TEST', randomUUID(), new Date(), 'marketing')
  if (!queued) return NextResponse.json({ error: 'Could not queue test email' }, { status: 500 })

  const dispatched = request.nextUrl.searchParams.get('dispatch') === '1' ? await runEmailDispatch() : null
  return NextResponse.json({ ok: true, queued, dispatched })
}
