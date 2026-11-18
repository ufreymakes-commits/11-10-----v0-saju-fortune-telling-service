import { randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { CONTACT_COLUMNS, type EmailContact } from '@/lib/email/types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_PATTERN = /^[a-f0-9]{32}$/

const newUnsubscribeToken = () => randomBytes(16).toString('hex')

export const normalizeEmail = (value: unknown): string => String(value ?? '').trim().toLowerCase()

export async function upsertContact(params: {
  email: string
  name?: string | null
  submissionId?: string | null
}): Promise<EmailContact | null> {
  try {
    const email = normalizeEmail(params.email)
    if (!EMAIL_PATTERN.test(email)) return null

    const admin = createAdminClient()
    const name = params.name?.trim() || null
    const submissionId = params.submissionId ?? null

    const find = () => admin.from('email_contacts').select(CONTACT_COLUMNS).eq('email', email).maybeSingle()

    let existing = await find()
    if (existing.error) {
      console.error('[v0] crm: contact lookup failed', existing.error.message)
      return null
    }

    if (!existing.data) {
      const inserted = await admin
        .from('email_contacts')
        .insert({
          email,
          name,
          first_submission_id: submissionId,
          unsubscribe_token: newUnsubscribeToken(),
        })
        .select(CONTACT_COLUMNS)
        .single()
      if (!inserted.error) return inserted.data as EmailContact
      if (inserted.error.code !== '23505') {
        console.error('[v0] crm: contact insert failed', inserted.error.code, inserted.error.message)
        return null
      }
      existing = await find()
      if (!existing.data) return null
    }

    const contact = existing.data as EmailContact
    const patch: Record<string, unknown> = {}
    if (!contact.name && name) patch.name = name
    if (!contact.first_submission_id && submissionId) patch.first_submission_id = submissionId
    if (Object.keys(patch).length === 0) return contact

    const updated = await admin
      .from('email_contacts')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', contact.id)
      .select(CONTACT_COLUMNS)
      .single()
    return updated.error ? contact : (updated.data as EmailContact)
  } catch (e) {
    console.error('[v0] crm: upsertContact error:', e instanceof Error ? e.message : 'unknown')
    return null
  }
}

// Marks every still-scheduled row of a contact as skipped. Marketing only unless includeTransactional is set.
export async function skipScheduledSends(contactId: string, reason: string, includeTransactional = false) {
  const admin = createAdminClient()
  let query = admin
    .from('email_sends')
    .update({ status: 'skipped', skip_reason: reason })
    .eq('contact_id', contactId)
    .eq('status', 'scheduled')
  if (!includeTransactional) query = query.eq('category', 'marketing')
  const { error } = await query
  if (error) console.error('[v0] crm: skip scheduled failed', error.message)
}

// Returns true when a contact was found for the token. Idempotent; never throws.
export async function unsubscribeByToken(token: unknown): Promise<boolean> {
  try {
    if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) return false
    const admin = createAdminClient()
    const { data: contact, error } = await admin
      .from('email_contacts')
      .select('id, unsubscribed_at')
      .eq('unsubscribe_token', token)
      .maybeSingle()
    if (error || !contact) return false

    if (!contact.unsubscribed_at) {
      const now = new Date().toISOString()
      await admin
        .from('email_contacts')
        .update({ unsubscribed_at: now, updated_at: now })
        .eq('id', contact.id)
        .is('unsubscribed_at', null)
    }
    await skipScheduledSends(contact.id as string, 'unsubscribed')
    return true
  } catch (e) {
    console.error('[v0] crm: unsubscribe error:', e instanceof Error ? e.message : 'unknown')
    return false
  }
}

// Bounce/complaint from the Resend webhook. Unknown addresses are ignored.
export async function markContactDeliveryProblem(emailValue: unknown, kind: 'bounced' | 'complained') {
  try {
    const email = normalizeEmail(emailValue)
    if (!email) return
    const admin = createAdminClient()
    const { data: contact } = await admin.from('email_contacts').select('id').eq('email', email).maybeSingle()
    if (!contact) return

    const now = new Date().toISOString()
    await admin
      .from('email_contacts')
      .update({ [kind === 'bounced' ? 'bounced_at' : 'complained_at']: now, updated_at: now })
      .eq('id', contact.id)
    await skipScheduledSends(contact.id as string, kind, true)
  } catch (e) {
    console.error('[v0] crm: delivery problem update error:', e instanceof Error ? e.message : 'unknown')
  }
}
