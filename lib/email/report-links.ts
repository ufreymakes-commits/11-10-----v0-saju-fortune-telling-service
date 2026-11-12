import { getPublicSiteUrl } from '@/lib/payments/base-url'
import { escapeHtml } from '@/lib/email/payment-confirmation'
import { sendEmail } from '@/lib/email/send'

export interface ReportLinkItem {
  submissionId: string
  name: string | null
}

export async function sendReportLinksEmail(to: string, items: ReportLinkItem[]) {
  const site = getPublicSiteUrl()
  const links = items.map((item) => ({
    label: item.name?.trim() || 'Your report',
    url: `${site}/report/${item.submissionId}/paid`,
  }))

  const subject = 'Your Sajume report link'
  const text = [
    'Here is the link to your Sajume report:',
    '',
    ...links.map((l) => `${l.label}: ${l.url}`),
    '',
    'If you did not ask for this email, you can ignore it.',
  ].join('\n')

  const listHtml = links
    .map(
      (l) =>
        `<li style="margin-bottom:10px;"><a href="${l.url}" style="color:#5b3fd1;font-weight:bold;">${escapeHtml(l.label)}</a></li>`,
    )
    .join('')

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px 16px;background:#f6f4fb;font-family:Arial,Helvetica,sans-serif;color:#1d1b2e;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Here is the link to your Sajume report:</p>
      <ul style="padding-left:20px;margin:0 0 20px;">${listHtml}</ul>
      <p style="font-size:13px;line-height:1.6;color:#8a869f;margin:0;">If you did not ask for this email, you can ignore it.</p>
    </div>
  </body>
</html>`

  return sendEmail({ to, subject, html, text })
}
