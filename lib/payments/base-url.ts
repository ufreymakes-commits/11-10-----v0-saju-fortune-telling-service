function normalize(url: string): string {
  const withProtocol = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
  return withProtocol.replace(/\/$/, '')
}

/** Server-side base URL (used for report_url and server-to-server calls). */
export function getServerBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return normalize(process.env.NEXT_PUBLIC_BASE_URL)
  if (process.env.VERCEL_URL) return normalize(process.env.VERCEL_URL)
  return 'http://localhost:3000'
}

/** Public URL used inside emails sent to customers. */
export function getPublicSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_CANONICAL_URL) return normalize(process.env.NEXT_PUBLIC_CANONICAL_URL)
  return getServerBaseUrl()
}

export function paidReportUrl(submissionId: string, base: string = getServerBaseUrl()): string {
  return `${base}/report/${submissionId}/paid`
}
