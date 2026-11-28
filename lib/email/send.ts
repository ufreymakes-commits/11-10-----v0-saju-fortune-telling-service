import { CRM_FROM, CRM_REPLY_TO } from '@/lib/email/config'
import { unsubscribeApiUrl } from '@/lib/email/templates/layout'

export type SendEmailResult = 'sent' | 'skipped' | 'failed'

export type CrmSendResult =
  | { status: 'sent'; resendId: string | null }
  | { status: 'not-configured' }
  | { status: 'failed'; error: string }

// CRM emails: html + text, reply-to support, and one-click unsubscribe headers on marketing mail.
// The legacy sendEmail below is unchanged and still used by the transactional confirmations.
export async function sendCrmEmail(params: {
  to: string
  subject: string
  html: string
  text: string
  category: string
  unsubscribeToken: string
}): Promise<CrmSendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !process.env.EMAIL_FROM) return { status: 'not-configured' }
  const from = CRM_FROM

  const headers: Record<string, string> =
    params.category === 'marketing'
      ? {
          'List-Unsubscribe': `<${unsubscribeApiUrl(params.unsubscribeToken)}>, <mailto:${CRM_REPLY_TO}?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : {}

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: CRM_REPLY_TO,
        headers,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      const reason = body && typeof body === 'object' ? `${body.name ?? 'error'}: ${body.message ?? ''}` : 'unknown'
      console.error('[v0] crm email send failed', { status: res.status })
      return { status: 'failed', error: `http ${res.status} ${reason}`.slice(0, 300) }
    }
    return { status: 'sent', resendId: typeof body?.id === 'string' ? body.id : null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown'
    console.error('[v0] crm email send error:', message)
    return { status: 'failed', error: message.slice(0, 300) }
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    console.log('[v0] email skipped (not configured)')
    return 'skipped'
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      const reason = body && typeof body === 'object' ? { name: body.name, message: body.message } : null
      const fromDomain = from.match(/@([^>\s]+)/)?.[1] ?? 'unparsed'
      const toDomain = params.to.split('@')[1] ?? 'unknown'
      console.error('[v0] email send failed', { status: res.status, fromDomain, toDomain, resend: reason })
      return 'failed'
    }
    return 'sent'
  } catch (e) {
    console.error('[v0] email send error:', e instanceof Error ? e.message : 'unknown')
    return 'failed'
  }
}
