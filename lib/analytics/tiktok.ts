// Client-only TikTok pixel helpers. Every function is safe to call when window.ttq
// does not exist (ad blockers, server rendering): none of them throw or block the UI.

export type TikTokEvent = 'CompleteRegistration' | 'ViewContent' | 'InitiateCheckout' | 'CompletePayment'

interface TikTokQueue {
  track?: (event: string, params?: Record<string, unknown>, options?: Record<string, unknown>) => void
  identify?: (params: Record<string, unknown>) => void
  page?: () => void
}

function getTtq(): TikTokQueue | null {
  if (typeof window === 'undefined') return null
  const ttq = (window as unknown as { ttq?: TikTokQueue }).ttq
  return ttq ?? null
}

// Pages that must never report to TikTok.
export function isTikTokExcludedPath(pathname: string): boolean {
  return /^\/(admin|api\/test-|test-saju|letter-test)/.test(pathname)
}

function onExcludedPage(): boolean {
  return typeof window !== 'undefined' && isTikTokExcludedPath(window.location.pathname)
}

export function ttTrack(event: TikTokEvent, params: Record<string, unknown>, eventId: string): void {
  try {
    const ttq = getTtq()
    if (!ttq?.track || onExcludedPage()) return
    ttq.track(event, params, { event_id: eventId })
    console.log(`[v0] tt: ${event} ${eventId}`)
  } catch {
    // tracking must never break the page
  }
}

export function ttPage(): void {
  try {
    const ttq = getTtq()
    if (!ttq?.page || onExcludedPage()) return
    ttq.page()
  } catch {
    // tracking must never break the page
  }
}

// Only the SHA-256 hex of the trimmed, lowercased email leaves the page; the plain email is never sent or logged.
export async function ttIdentifyEmail(email: string): Promise<void> {
  try {
    const ttq = getTtq()
    if (!ttq?.identify || onExcludedPage()) return
    if (typeof crypto === 'undefined' || !crypto.subtle) return
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
    const hash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
    ttq.identify({ email: hash })
    try {
      window.localStorage.setItem('tt_email_sha256', hash)
    } catch {
      // storage can be unavailable
    }
  } catch {
    // tracking must never break the page
  }
}

// Deterministic on purpose: a server-side Events API can send the same id later and TikTok de-duplicates.
export function eventIdFor(submissionId: string, event: string): string {
  return `${event}:${submissionId}`
}

// Runs once per browser. If localStorage is unavailable it runs anyway: a missed event is worse than a repeated one.
export function fireOnce(key: string, run: () => void): void {
  try {
    const storageKey = `tt_once_${key}`
    if (window.localStorage.getItem(storageKey)) return
    window.localStorage.setItem(storageKey, '1')
  } catch {
    // fall through and run
  }
  try {
    run()
  } catch {
    // tracking must never break the page
  }
}

// Advanced matching for later pages (checkout, purchase). The TikTok in-app browser, Safari and the
// PayPal return can each be a fresh session, so we ask the server for the hashed email of this
// submission and identify before any event fires. Same events and event ids as before: this only
// adds match keys, it does not change what is optimised.
const identified = new Set<string>()

export async function ttIdentifySubmission(submissionId: string): Promise<void> {
  try {
    if (!submissionId || identified.has(submissionId)) return
    const ttq = getTtq()
    if (!ttq?.identify || onExcludedPage()) return
    identified.add(submissionId)
    const res = await fetch(`/api/analytics/tt-identity?sid=${encodeURIComponent(submissionId)}`)
    if (!res.ok) return
    const data = (await res.json()) as { email?: string; external_id?: string }
    const params: Record<string, string> = {}
    if (data.email && /^[0-9a-f]{64}$/.test(data.email)) params.email = data.email
    if (data.external_id && /^[0-9a-f]{64}$/.test(data.external_id)) params.external_id = data.external_id
    if (Object.keys(params).length) ttq.identify(params)
  } catch {
    // tracking must never break the page
  }
}
