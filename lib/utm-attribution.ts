export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const

export type UtmAttribution = Record<(typeof UTM_KEYS)[number], string | null>

export function cleanUtmValue(value: string | null | undefined): string | null {
  if (!value) return null
  const cleaned = value.trim().slice(0, 200)
  return cleaned || null
}

export function readUtmFromCookieHeader(cookieHeader: string | null): UtmAttribution {
  const cookies = new Map<string, string>()
  for (const part of cookieHeader?.split(';') ?? []) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    const name = part.slice(0, separator).trim()
    const rawValue = part.slice(separator + 1).trim()
    try {
      cookies.set(name, decodeURIComponent(rawValue))
    } catch {
      cookies.set(name, rawValue)
    }
  }

  return Object.fromEntries(UTM_KEYS.map((key) => [key, cleanUtmValue(cookies.get(key))])) as UtmAttribution
}
