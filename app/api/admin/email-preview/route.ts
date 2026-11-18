import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { upsertContact } from '@/lib/email/contacts'
import { DISPATCH_SEND_GAP_MS } from '@/lib/email/config'
import { sendCrmEmail } from '@/lib/email/send'
import { renderCrmTemplate } from '@/lib/email/templates'
import { CRM_TEMPLATE_KEYS, type CrmTemplateKey } from '@/lib/email/templates/compose'
import { firstNameOf, type TemplateData } from '@/lib/email/templates/data'

const DEFAULT_PREVIEW_EMAIL = 'ufrey.makes@gmail.com'
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isAdmin(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD
  const provided = request.headers.get('x-admin-password')
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Most recent real submission, falling back to sample data when the database has none.
async function loadPreviewData(): Promise<TemplateData> {
  const fallback: TemplateData = {
    firstName: 'there',
    submissionId: '00000000-0000-0000-0000-000000000000',
    offerExpiresAt: new Date(Date.now() + 3 * 3_600_000).toISOString(),
    hasGumiho: false,
  }
  try {
    const { data } = await createAdminClient()
      .from('submissions')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) return fallback
    return { ...fallback, firstName: firstNameOf(data.name as string | null), submissionId: data.id as string }
  } catch {
    return fallback
  }
}

// Preview sends bypass unsubscribe/skip rules and the daily cap, and are not recorded in email_sends.
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const key = typeof body?.key === 'string' ? body.key.toUpperCase() : ''
  const email = typeof body?.email === 'string' && body.email.trim() ? body.email.trim() : DEFAULT_PREVIEW_EMAIL

  const keys: CrmTemplateKey[] =
    key === 'ALL'
      ? [...CRM_TEMPLATE_KEYS]
      : (CRM_TEMPLATE_KEYS as readonly string[]).includes(key)
        ? [key as CrmTemplateKey]
        : []
  if (keys.length === 0) {
    return NextResponse.json({ error: `key must be one of ${CRM_TEMPLATE_KEYS.join(', ')} or ALL` }, { status: 400 })
  }

  const contact = await upsertContact({ email })
  if (!contact) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const data = await loadPreviewData()
  const results: Array<{ key: string; status: string; error?: string }> = []

  for (const [index, templateKey] of keys.entries()) {
    if (index > 0) await sleep(DISPATCH_SEND_GAP_MS)
    const rendered = renderCrmTemplate(templateKey, data, contact.unsubscribe_token)
    const result = await sendCrmEmail({
      to: contact.email,
      subject: `[PREVIEW] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
      category: rendered.category,
      unsubscribeToken: contact.unsubscribe_token,
    })
    results.push(
      result.status === 'failed'
        ? { key: templateKey, status: 'failed', error: result.error }
        : { key: templateKey, status: result.status },
    )
  }

  return NextResponse.json({ ok: results.every((r) => r.status === 'sent'), sent_to: contact.email, results })
}
