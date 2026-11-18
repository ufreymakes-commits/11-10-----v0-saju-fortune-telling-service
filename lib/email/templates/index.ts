import { marketingFooter, wrapEmailHtml } from '@/lib/email/templates/layout'
import type { EmailContact, EmailSend } from '@/lib/email/types'

export interface TemplateContext {
  contact: EmailContact
  send: EmailSend
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export type TemplateRenderer = (ctx: TemplateContext) => Promise<RenderedEmail>

const renderTest: TemplateRenderer = async ({ contact }) => {
  const footer = marketingFooter(contact.unsubscribe_token)
  const body = 'This is a test email from the Sajume CRM queue. If you can read this, delivery works.'

  return {
    subject: 'Sajume email test',
    text: [body, footer.text].join('\n'),
    html: wrapEmailHtml(
      `<tr><td style="font-size:16px;line-height:1.6;padding-bottom:20px;">${body}</td></tr>`,
      footer.html,
    ),
  }
}

// The dispatcher only touches rows whose template_key is registered here; later phases add A2 to C4.
export const emailTemplates: Record<string, TemplateRenderer> = {
  TEST: renderTest,
}

export const registeredTemplateKeys = () => Object.keys(emailTemplates)
