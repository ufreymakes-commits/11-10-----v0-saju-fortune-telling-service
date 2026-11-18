import { CRM_SITE_URL } from '@/lib/email/config'

export const unsubscribePageUrl = (token: string) => `${CRM_SITE_URL}/unsubscribe?t=${token}`
export const unsubscribeApiUrl = (token: string) => `${CRM_SITE_URL}/api/unsubscribe?t=${token}`

const COMPANY_LINE = 'Sajume · 22, Sumyeong-ro 2ga-gil, Gangseo-gu, Seoul 07642, Republic of Korea'
const REASON_LINE = "You're receiving this because you requested a free Saju reading at my.sajume.com."

// Shared footer for every marketing email.
export function marketingFooter(unsubscribeToken: string) {
  const url = unsubscribePageUrl(unsubscribeToken)
  const text = ['', '--', COMPANY_LINE, REASON_LINE, `Unsubscribe: ${url}`].join('\n')
  const html = `<tr><td style="font-size:12px;line-height:1.6;color:#8a869f;border-top:1px solid #ece9f5;padding-top:16px;">
    ${COMPANY_LINE.replace('·', '&middot;')}<br />
    ${REASON_LINE.replace("'", '&#39;')}<br />
    <a href="${url}" style="color:#8a869f;">Unsubscribe</a>
  </td></tr>`
  return { html, text }
}

// Minimal white card around the body rows, matching the existing confirmation emails.
export function wrapEmailHtml(bodyRows: string, footerRow: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f4fb;font-family:Arial,Helvetica,sans-serif;color:#1d1b2e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;">
            ${bodyRows}
            ${footerRow}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
