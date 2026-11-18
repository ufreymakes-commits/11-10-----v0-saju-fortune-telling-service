import { CRM_SITE_URL } from '@/lib/email/config'

// Personal-letter layout (no boxes, buttons or banners) so mail lands in the Gmail primary tab.
// Table markup only; every template produces both an html and a text version.

export const COMPANY_LINE = 'Sajume \u00b7 22, Sumyeong-ro 2ga-gil, Gangseo-gu, Seoul 07642, Republic of Korea'
export const MARKETING_REASON_LINE = "You're receiving this because you requested a free Saju reading at my.sajume.com."
const SIGNATURE = '\u2014 Yuri, founder of Sajume'
const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

export function unsubscribePageUrl(token: string): string {
  return `${CRM_SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}`
}

export function unsubscribeApiUrl(token: string): string {
  return `${CRM_SITE_URL}/api/unsubscribe?t=${encodeURIComponent(token)}`
}

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function withUtm(url: string, templateKey: string): string {
  const parsed = new URL(url)
  parsed.searchParams.set('utm_source', 'email')
  parsed.searchParams.set('utm_medium', 'crm')
  parsed.searchParams.set('utm_campaign', templateKey)
  return parsed.toString()
}

export interface Piece {
  html: string
  text: string
}

const BODY_CELL = `padding:0 0 16px 0;font-size:16px;line-height:1.6;color:#222222;`
const LINK_STYLE = 'color:#1155cc;text-decoration:underline;'

const row = (inner: string, extraStyle = ''): string => `<tr><td style="${BODY_CELL}${extraStyle}">${inner}</td></tr>`

export const paragraph = (text: string): Piece => ({
  html: row(esc(text).replace(/\n/g, '<br />')),
  text,
})

export const strongParagraph = (text: string): Piece => ({
  html: row(`<strong>${esc(text)}</strong>`, 'padding-bottom:4px;'),
  text,
})

export const bulletList = (items: string[]): Piece => ({
  html: row(items.map((item) => `\u2022&nbsp;${esc(item)}`).join('<br />')),
  text: items.map((item) => `\u2022 ${item}`).join('\n'),
})

export const imageBlock = (src: string, alt: string): Piece => ({
  html: `<tr><td style="padding:0 0 16px 0;"><img src="${esc(src)}" width="560" alt="${esc(alt)}" style="display:block;width:100%;max-width:560px;height:auto;border:0;" /></td></tr>`,
  text: '',
})

// Sentence with exactly one hyperlinked phrase. In the text version the URL follows the sentence.
export function linkSentence(opts: {
  before: string
  label: string
  after: string
  url: string
  templateKey: string
}): Piece {
  const href = withUtm(opts.url, opts.templateKey)
  return {
    html: row(
      `${esc(opts.before)}<a href="${esc(href)}" style="${LINK_STYLE}">${esc(opts.label)}</a>${esc(opts.after)}`,
    ),
    text: `${opts.before}${opts.label}${opts.after.replace(/\.$/, '')}: ${href}`,
  }
}

// Two links in one paragraph is not needed; a sentence plus a trailing P.S. link are separate pieces.

export function renderLetter(opts: {
  templateKey: string
  pieces: Piece[]
  // null = transactional mail: address and privacy link only, no unsubscribe link.
  unsubscribeToken: string | null
}): { html: string; text: string } {
  const privacyUrl = withUtm(`${CRM_SITE_URL}/privacy`, opts.templateKey)
  const unsubscribeUrl = opts.unsubscribeToken ? withUtm(unsubscribePageUrl(opts.unsubscribeToken), opts.templateKey) : null

  const footerLink = (href: string, label: string) =>
    `<a href="${esc(href)}" style="color:#888888;text-decoration:underline;">${label}</a>`

  const footerHtml = [
    `<tr><td style="padding:24px 0 0 0;font-size:12px;line-height:1.5;color:#888888;">`,
    `${esc(COMPANY_LINE)}<br />`,
    opts.unsubscribeToken ? `${esc(MARKETING_REASON_LINE)}<br />` : '',
    footerLink(privacyUrl, 'Privacy Policy'),
    unsubscribeUrl ? ` &middot; ${footerLink(unsubscribeUrl, 'Unsubscribe')}` : '',
    `</td></tr>`,
  ].join('')

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
<tr><td align="left" style="padding:24px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;font-family:${FONT_STACK};color:#222222;">
<tr><td style="padding:0 0 24px 0;font-size:14px;font-weight:bold;letter-spacing:2px;color:#5b4a8b;">SAJUME</td></tr>
${opts.pieces.map((piece) => piece.html).join('\n')}
${row(esc(SIGNATURE), 'padding-bottom:0;')}
${footerHtml}
</table>
</td></tr>
</table>
</body>
</html>`

  const textFooter = [
    COMPANY_LINE,
    opts.unsubscribeToken ? MARKETING_REASON_LINE : null,
    `Privacy Policy: ${privacyUrl}`,
    unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n')

  const text = [
    'SAJUME',
    ...opts.pieces.map((piece) => piece.text).filter(Boolean),
    SIGNATURE,
    textFooter,
  ].join('\n\n')

  return { html, text }
}
