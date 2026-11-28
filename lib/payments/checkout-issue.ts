'use client'

// Records why a checkout did not finish (for our own analysis only). Never blocks or changes the payment flow.
export type CheckoutIssueStage =
  | 'cancel_return' // came back from PayPal to the checkout page without paying
  | 'success_return_unpaid' // came back to the success page but PayPal had not approved the order
  | 'capture_error' // PayPal approved but our capture call reported an error
  | 'action_required' // PayPal asked for an extra card check (e.g. 3-D Secure)
  | 'create_error' // could not open PayPal at all
  | 'retry_banner_copy' // used "Copy link" on the retry banner
  | 'retry_banner_help' // used "Request help" on the retry banner
  | 'inapp_copy' // used "Copy payment link" in the card popup inside TikTok

export function checkoutBrowser(): string {
  try {
    const ua = navigator.userAgent || ''
    if (/musical_ly|TikTok|Bytedance|trill/i.test(ua)) return 'tiktok-inapp'
    if (/Instagram/i.test(ua)) return 'instagram-inapp'
    if (/FBAN|FBAV/i.test(ua)) return 'facebook-inapp'
    if (/CriOS|Chrome/i.test(ua)) return 'chrome'
    if (/Safari/i.test(ua)) return 'safari'
    return 'other'
  } catch {
    return 'other'
  }
}

export const isTikTokInApp = () => checkoutBrowser() === 'tiktok-inapp'

export function trackCheckoutIssue(
  stage: CheckoutIssueStage,
  data: { submissionId?: string; orderId?: string | null; orderStatus?: string | null; error?: string | null } = {},
) {
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_type: 'checkout_issue',
        page: typeof window !== 'undefined' ? window.location.pathname : null,
        metadata: {
          stage,
          submissionId: data.submissionId ?? null,
          orderId: data.orderId ?? null,
          orderStatus: data.orderStatus ?? null,
          error: data.error ? String(data.error).slice(0, 200) : null,
          browser: checkoutBrowser(),
        },
      }),
    }).catch(() => {})
  } catch {
    // logging must never break checkout
  }
}

// Remembers that this buyer already tried to pay for this report in this browser tab.
const attemptKey = (submissionId: string) => `checkout_attempt_${submissionId}`

export function markCheckoutAttempt(submissionId: string) {
  try {
    sessionStorage.setItem(attemptKey(submissionId), String(Date.now()))
  } catch {}
}

export function hadCheckoutAttempt(submissionId: string): boolean {
  try {
    return Boolean(sessionStorage.getItem(attemptKey(submissionId)))
  } catch {
    return false
  }
}

/** Copies text; returns false if the browser blocks it (some in-app browsers do). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {}
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'absolute'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
