// Client-safe home of the product prices. lib/payments/paypal-orders.ts re-exports these,
// so there is still one source of truth. Client components import from here because
// paypal-orders.ts pulls in server-only code (next/headers) that cannot ship to the browser.
export const PRICE_USD = '19.99'
export const COMPAT_PRICE_USD = '19.99'
export const COMPAT_BUYER_PRICE_USD = '15.99'
export const GUMIHO_PRICE_USD = '9.99'
export const GUMIHO_ADDON_PRICE_USD = '7.99'
