import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { normalizeEmail, upsertContact } from '@/lib/email/contacts'
import { enqueue } from '@/lib/email/queue'
import { sendCrmEmail } from '@/lib/email/send'
import { renderCrmTemplate } from '@/lib/email/templates'

const PRODUCT_KEY = '2027_monthly_career_love'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

// Per-instance memory limiter: good enough to stop casual spamming, not a hard guarantee.
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key)
  }
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Please try again in a few minutes.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const email = normalizeEmail(body?.email)
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: signup, error } = await admin
    .from('waitlist_signups')
    .insert({ email, product_key: PRODUCT_KEY, source: 'home_card' })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: true, alreadyOnList: true })
    console.error('[v0] waitlist: insert failed', error.code, error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  try {
    const contact = await upsertContact({ email })
    if (contact) {
      const signupId = signup.id as string
      await enqueue(contact.id, 'W1', signupId, new Date(), 'transactional')

      const rendered = renderCrmTemplate(
        'W1',
        { firstName: 'there', submissionId: '', offerExpiresAt: null, hasGumiho: false },
        null,
      )
      const result = await sendCrmEmail({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        category: 'transactional',
        unsubscribeToken: contact.unsubscribe_token,
      })
      if (result.status === 'sent') {
        await admin
          .from('email_sends')
          .update({ status: 'sent', sent_at: new Date().toISOString(), resend_id: result.resendId })
          .eq('contact_id', contact.id)
          .eq('template_key', 'W1')
          .eq('ref_id', signupId)
        console.log('[v0] email sent: W1 status=ok')
      }
      // On failure the queued row stays scheduled and the cron retries it.
    }
  } catch (e) {
    console.error('[v0] waitlist: confirmation email error:', e instanceof Error ? e.message : 'unknown')
  }

  return NextResponse.json({ ok: true, alreadyOnList: false })
}
