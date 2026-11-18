// Events created before this moment never enter the CRM queue (no retroactive sends to existing customers).
export const CRM_START_AT = '2026-11-18T07:15:00.000Z'

export const CRM_SITE_URL = 'https://my.sajume.com'
export const CRM_REPLY_TO = 'hello@sajume.com'

export const DISPATCH_BATCH_SIZE = 20
export const DISPATCH_SEND_GAP_MS = 350
export const SENDING_CLAIM_TIMEOUT_MS = 15 * 60_000
export const MAX_SEND_ATTEMPTS = 3
export const BACKFILL_WINDOW_DAYS = 14
export const BACKFILL_MAX_PER_RUN = 50

export function getDailyMarketingCap(): number {
  const parsed = Number(process.env.EMAIL_DAILY_CAP)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 50
}

const HOUR = 3_600_000

// How late a scheduled email may still go out before it is skipped as 'stale'.
export const STALE_AFTER_MS: Record<string, number> = {
  B1: 6 * HOUR,
  B2: 12 * HOUR,
  C2: 12 * HOUR,
  A2: 48 * HOUR,
  A3: 48 * HOUR,
  C3: 48 * HOUR,
  C4: 48 * HOUR,
  TEST: 24 * HOUR,
}
export const DEFAULT_STALE_AFTER_MS = 24 * HOUR

export const isAfterCrmStart = (iso: string | null | undefined): boolean => {
  if (!iso) return false
  const time = new Date(iso).getTime()
  return Number.isFinite(time) && time >= new Date(CRM_START_AT).getTime()
}
