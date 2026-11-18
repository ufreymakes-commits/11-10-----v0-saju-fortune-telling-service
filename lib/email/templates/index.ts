import { composeEmail, CRM_TEMPLATE_KEYS, type CrmTemplateKey } from '@/lib/email/templates/compose'
import { loadTemplateData, type TemplateData } from '@/lib/email/templates/data'
import { paragraph, renderLetter } from '@/lib/email/templates/layout'
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

export function renderCrmTemplate(
  key: CrmTemplateKey,
  data: TemplateData,
  unsubscribeToken: string | null,
): RenderedEmail & { category: 'marketing' | 'transactional' } {
  const composed = composeEmail(key, data)
  const { html, text } = renderLetter({
    templateKey: key,
    pieces: composed.pieces,
    unsubscribeToken: composed.category === 'marketing' ? unsubscribeToken : null,
  })
  return { subject: composed.subject, html, text, category: composed.category }
}

const WAITLIST_DATA: TemplateData = { firstName: 'there', submissionId: '', offerExpiresAt: null, hasGumiho: false }

const renderCrm =
  (key: CrmTemplateKey): TemplateRenderer =>
  async ({ contact, send }) => {
    // W1 has no submission behind it; every other template needs its report data.
    const data = key === 'W1' ? WAITLIST_DATA : await loadTemplateData(key, send.ref_id)
    const { subject, html, text } = renderCrmTemplate(key, data, contact.unsubscribe_token)
    return { subject, html, text }
  }

const renderTest: TemplateRenderer = async ({ contact }) => {
  const { html, text } = renderLetter({
    templateKey: 'TEST',
    pieces: [paragraph('This is a test email from the Sajume CRM queue. If you can read this, delivery works.')],
    unsubscribeToken: contact.unsubscribe_token,
  })
  return { subject: 'Sajume email test', html, text }
}

// The dispatcher only touches rows whose template_key is registered here.
export const emailTemplates: Record<string, TemplateRenderer> = {
  TEST: renderTest,
  ...Object.fromEntries(CRM_TEMPLATE_KEYS.map((key) => [key, renderCrm(key)])),
}

export const registeredTemplateKeys = () => Object.keys(emailTemplates)
