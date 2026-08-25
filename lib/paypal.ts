const SANDBOX_API_URL = 'https://api-m.sandbox.paypal.com'
const LIVE_API_URL = 'https://api-m.paypal.com'

/**
 * Resolves PayPal credentials and API base URL.
 *
 * Honors PAYPAL_MODE ('sandbox' | 'live'), but is resilient to a common
 * misconfiguration: if the configured mode's credential pair is missing/empty
 * while the other mode's pair is fully populated, it falls back to whichever
 * pair actually exists. This keeps checkout working when, for example,
 * PAYPAL_MODE='live' but only sandbox credentials have been provided.
 */
export function getPayPalConfig() {
  const liveId = process.env.PAYPAL_CLIENT_ID
  const liveSecret = process.env.PAYPAL_CLIENT_SECRET
  const sandboxId = process.env.paypalclientidSandbox
  const sandboxSecret = process.env.paypalsecretkeySandbox

  const hasLive = Boolean(liveId && liveSecret)
  const hasSandbox = Boolean(sandboxId && sandboxSecret)

  // Preferred mode from env (default to live when unset).
  let useSandbox = process.env.PAYPAL_MODE === 'sandbox'

  // Fall back to the populated credential pair if the preferred one is empty.
  if (useSandbox && !hasSandbox && hasLive) {
    console.warn('[v0] PAYPAL_MODE=sandbox but sandbox credentials missing; falling back to live credentials')
    useSandbox = false
  } else if (!useSandbox && !hasLive && hasSandbox) {
    console.warn('[v0] PAYPAL_MODE=live but live credentials missing; falling back to sandbox credentials')
    useSandbox = true
  }

  const clientId = useSandbox ? sandboxId : liveId
  const clientSecret = useSandbox ? sandboxSecret : liveSecret
  const apiUrl = useSandbox ? SANDBOX_API_URL : LIVE_API_URL

  return { clientId, clientSecret, apiUrl, isSandbox: useSandbox }
}
