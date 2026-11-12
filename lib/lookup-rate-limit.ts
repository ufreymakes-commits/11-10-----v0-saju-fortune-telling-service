import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

function hashValue(value: string): string {
  const salt = process.env.RATE_LIMIT_SALT || process.env.CRON_SECRET || ''
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 16)
}

function hourBucket(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}`
}

/**
 * Counts one hit for `key` in the current hour and tells whether the caller is over `limit`.
 * Only a salted hash of the value is stored in rate_limits, never the raw IP or email.
 * On unexpected database errors it fails open so customers are never locked out by our own fault.
 */
async function hit(prefix: 'lookup-ip' | 'lookup-email', value: string, limit: number): Promise<boolean> {
  const admin = createAdminClient()
  const key = `${prefix}:${hashValue(value)}:${hourBucket()}`
  const today = new Date().toISOString().slice(0, 10)

  const { data: existing, error } = await admin
    .from('rate_limits')
    .select('id, request_count')
    .eq('ip_address', key)
    .eq('request_date', today)
    .maybeSingle()

  if (error) {
    console.error('[v0] lookup rate limit read failed:', error.message)
    return false
  }

  if (existing) {
    if ((existing.request_count ?? 0) >= limit) return true
    await admin
      .from('rate_limits')
      .update({ request_count: (existing.request_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    return false
  }

  const { error: insertError } = await admin
    .from('rate_limits')
    .insert({ ip_address: key, request_date: today, request_count: 1 })

  if (insertError && insertError.code !== '23505') {
    console.error('[v0] lookup rate limit insert failed:', insertError.message)
  }
  return false
}

export async function isLookupRateLimited(ip: string, email: string): Promise<boolean> {
  const [ipLimited, emailLimited] = await Promise.all([
    hit('lookup-ip', ip, 5),
    hit('lookup-email', email.toLowerCase(), 3),
  ])
  return ipLimited || emailLimited
}
