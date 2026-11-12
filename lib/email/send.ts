export type SendEmailResult = 'sent' | 'skipped' | 'failed'

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
      console.error('[v0] email send failed: http', res.status)
      return 'failed'
    }
    return 'sent'
  } catch (e) {
    console.error('[v0] email send error:', e instanceof Error ? e.message : 'unknown')
    return 'failed'
  }
}
