import { createAdminClient } from '@/lib/supabase/server'
import { getPublicSiteUrl } from '@/lib/payments/base-url'
import { escapeHtml, greetingName } from '@/lib/email/payment-confirmation'
import { isEmailConfigured, sendEmail } from '@/lib/email/send'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function buildCompatConfirmationEmail(params: {
  name: string
  reportUrl: string
  refundUrl: string
  supportEmail?: string
}) {
  const firstName = escapeHtml(params.name)
  const support = params.supportEmail ? escapeHtml(params.supportEmail) : null

  const subject = 'Your Sajume compatibility report is ready to open'

  const text = [
    `Hi ${params.name},`,
    '',
    'Your payment is confirmed. Thank you.',
    '',
    `Open my compatibility report: ${params.reportUrl}`,
    '',
    'If your report is still being written, open the link and it will finish. It usually takes a couple of minutes.',
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
                <a href="${params.reportUrl}" style="display:inline-block;background:#5b3fd1;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;">Open my compatibility report</a>
              </td>
            </tr>
            <tr><td style="font-size:14px;line-height:1.6;color:#4a4760;padding-bottom:20px;">If your report is still being written, open the link and it will finish. It usually takes a couple of minutes.</td></tr>
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
 * Email of the 99 Facts buyer for a report, only if that report has a completed payment.
 * Used for coupon-paid compat orders, where PayPal gives us no payer address.
 */
export async function findPaidReportEmail(reportId: string): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data: paid } = await admin
      .from('payments')
      .select('id')
      .eq('submission_id', reportId)
      .eq('status', 'completed')
      .limit(1)
    if (!paid || paid.length === 0) return null

    const { data: submission } = await admin.from('submissions').select('email').eq('id', reportId).maybeSingle()
    return submission?.email?.trim() || null
  } catch (e) {
    console.error('[v0] compat email lookup failed:', e instanceof Error ? e.message : 'unknown')
    return null
  }
}

/**
 * Sends the compat confirmation email at most once per payment and returns true only if it was actually sent.
 * The claim (compatibility_payments.confirmation_email_sent_at) is taken atomically before sending, and
 * released if the send fails. Never throws: a failed email must not affect payment or report generation.
 */
export async function sendCompatConfirmationEmail(params: {
  paymentId: string
  submissionId: string
  to: string | null | undefined
}): Promise<boolean> {
  try {
    if (!isEmailConfigured()) {
      console.log('[v0] compat email skipped (not configured)')
      return false
    }

    const to = params.to?.trim()
    if (!to || !EMAIL_PATTERN.test(to)) {
      console.log(`[v0] compat email skipped (no address) payment=${params.paymentId}`)
      return false
    }

    const admin = createAdminClient()

    const { data: claimed, error: claimError } = await admin
      .from('compatibility_payments')
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq('id', params.paymentId)
      .is('confirmation_email_sent_at', null)
      .select('id')

    if (claimError) {
      console.error('[v0] compat email claim failed:', claimError.message)
      return false
    }
    if (!claimed || claimed.length === 0) return false

    const { data: submission } = await admin
      .from('compatibility_submissions')
      .select('person_a_name')
      .eq('id', params.submissionId)
      .maybeSingle()

    const site = getPublicSiteUrl()
    const email = buildCompatConfirmationEmail({
      name: greetingName(submission?.person_a_name),
      reportUrl: `${site}/compatibility/report/${params.submissionId}/paid`,
      refundUrl: `${site}/policies/refund-dispute-policy`,
      supportEmail: process.env.SUPPORT_EMAIL,
    })

    const result = await sendEmail({ to, ...email })
    if (result !== 'sent') {
      await admin
        .from('compatibility_payments')
        .update({ confirmation_email_sent_at: null })
        .eq('id', params.paymentId)
      return false
    }
    return true
  } catch (e) {
    console.error('[v0] compat email error:', e instanceof Error ? e.message : 'unknown')
    return false
  }
}

/** True only if the confirmation email for this payment was actually sent. Returns false if the column is not migrated yet. */
export async function wasCompatConfirmationEmailSent(paymentId: string): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient()
      .from('compatibility_payments')
      .select('confirmation_email_sent_at')
      .eq('id', paymentId)
      .maybeSingle()
    if (error) return false
    return Boolean(data?.confirmation_email_sent_at)
  } catch {
    return false
  }
}
