import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Stored for our own logs only; it never changes the limit. */
export function countryOf(request: Request): string | null {
  const country = request.headers.get('x-vercel-ip-country')?.trim().toUpperCase()
  return country || null
}

/** The raw IP is never stored or logged. */
export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || process.env.CRON_SECRET || ''
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/** Same limit for every country. 0 turns the limit off. */
export function dailyLimit(): number {
  const parsed = Number(process.env.FREE_LIMIT_DEFAULT ?? 5)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 5
}

export type LimitResult = { allowed: true } | { allowed: false; limit: number }

/**
 * Counts one NEW free report for this IP today.
 * Fails open: any database or RPC problem allows the request so our own bug never blocks a customer.
 */
export async function checkAndCount(request: Request): Promise<LimitResult> {
  const limit = dailyLimit()
  const country = countryOf(request)
  const countryLabel = country ?? 'unknown'

  if (limit === 0) {
    console.log(`[v0] free limit: country=${countryLabel} limit=off allowed=true`)
    return { allowed: true }
  }

  const ip = clientIp(request)
  if (ip === 'unknown') {
    // Without an IP every visitor would share one bucket and block each other.
    console.warn('[v0] free limit: no client IP found, skipping count')
    return { allowed: true }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('bump_free_report_limit', {
      p_ip_hash: hashIp(ip),
      p_country: country,
      p_limit: limit,
    })

    if (error) {
      console.error('[v0] free limit: rpc failed, allowing:', error.message)
      return { allowed: true }
    }

    const allowed = data !== -1
    console.log(`[v0] free limit: country=${countryLabel} limit=${limit} allowed=${allowed}`)
    return allowed ? { allowed: true } : { allowed: false, limit }
  } catch (err) {
    console.error('[v0] free limit: unexpected error, allowing:', err instanceof Error ? err.message : err)
    return { allowed: true }
  }
}
