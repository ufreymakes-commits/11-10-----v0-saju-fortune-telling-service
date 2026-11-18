export interface EmailContact {
  id: string
  email: string
  name: string | null
  first_submission_id: string | null
  marketing_consent: boolean
  unsubscribed_at: string | null
  unsubscribe_token: string
  bounced_at: string | null
  complained_at: string | null
}

export interface EmailSend {
  id: string
  contact_id: string
  template_key: string
  ref_id: string | null
  category: string
  scheduled_at: string
  attempts: number
  status: string
}

export const CONTACT_COLUMNS =
  'id, email, name, first_submission_id, marketing_consent, unsubscribed_at, unsubscribe_token, bounced_at, complained_at'
