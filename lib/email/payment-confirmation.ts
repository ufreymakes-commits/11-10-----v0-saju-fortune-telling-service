import { createAdminClient } from '@/lib/supabase/server'
import { getPublicSiteUrl } from '@/lib/payments/base-url'
import { hasCJK, romanizeName } from '@/lib/romanize-name'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function greetingName(rawName: string | null | undefined): string {
  const name = (rawName ?? '').trim()
  if (!name) return 'there'
  if (hasCJK(name)) return romanizeName(name) || 'there'
  return name.split(/\s+/)[0]
}

export function buildConfirmationEmail(params: { name: string; reportUrl: string; refundUrl: string; supportEmail?: string }) {
  const firstName = escapeHtml(params.name)
  const support = params.supportEmail ? escapeHtml(params.supportEmail) : null

  const subject = 'Your Sajume report is ready to open'

  const text = [
    `Hi ${params.name},`,
    '',
    'Your payment is confirmed. Thank you.',
    '',
    `Open your report: ${params.reportUrl}`,
    '',
    'If your report is still being written, open the link and it will finish. It usually takes 2 to 3 minutes.',
    '',
    support ? `Need help? Write to us at ${params.supportEmail}.` : 'Need help? Just reply to this email.',
    '',
    `Refund policy: ${params.refundUrl}`,
  ].join('\n')

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f4fb;font-family:Arial,Helvetica,sans-serif;color:#1d1b2e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;">
            <tr><td style="font-size:20px;font-weight:bold;padding-bottom:12px;">Hi ${firstName},</td></tr>
            <tr><td style="font-size:16px;line-height:1.6;padding-bottom:20px;">Your payment is confirmed. Thank you.</td></tr>
            <tr>
              <td style="padding-bottom:20px;">
                <a href="${params.reportUrl}" style="display:inline-block;background:#5b3fd1;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;">Open my report</a>
              </td>
            </tr>
            <tr><td style="font-size:14px;line-height:1.6;color:#4a4760;padding-bottom:20px;">If your report is still being written, open the link and it will finish. It usually takes 2 to 3 minutes.</td></tr>
            <tr><td style="font-size:14px;line-height:1.6;color:#4a4760;padding-bottom:24px;">${support ? `Need help? Write to us at <a href="mailto:${support}" style="color:#5b3fd1;">${support}</a>.` : 'Need help? Just reply to this email.'}</td></tr>
            <tr><td style="font-size:12px;line-height:1.6;color:#8a869f;border-top:1px solid #ece9f5;padding-top:16px;">Sajume &middot; <a href="${params.refundUrl}" style="color:#8a869f;">Refund policy</a></td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}

/**
 * Sends the confirmation email at most once per payment. The claim
 * (confirmation_email_sent_at) is taken atomically before sending.
 */
export async function sendPaymentConfirmationEmail(paymentId: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.log('[v0] email skipped (not configured)')
    return
  }

  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('id, submission_id')
    .eq('id', paymentId)
    .maybeSingle()
  if (!payment) return

  const { data: submission } = await admin
    .from('submissions')
    .select('name, email')
    .eq('id', payment.submission_id)
    .maybeSingle()

  const to = submission?.email?.trim()
  if (!to) {
    console.log(`[v0] email skipped (no address) payment=${paymentId}`)
    return
  }

  const { data: claimed, error: claimError } = await admin
    .from('payments')
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq('id', paymentId)
    .is('confirmation_email_sent_at', null)
    .select('id')

  if (claimError) {
    console.error('[v0] email claim failed:', claimError.message)
    return
  }
  if (!claimed || claimed.length === 0) return

  const site = getPublicSiteUrl()
  const email = buildConfirmationEmail({
    name: greetingName(submission?.name),
    reportUrl: `${site}/report/${payment.submission_id}/paid`,
    refundUrl: `${site}/policies/refund-dispute-policy`,
    supportEmail: process.env.SUPPORT_EMAIL,
  })

  const result = await sendEmail({ to, ...email })
  if (result === 'failed') {
    await admin.from('payments').update({ confirmation_email_sent_at: null }).eq('id', paymentId)
  }
}
