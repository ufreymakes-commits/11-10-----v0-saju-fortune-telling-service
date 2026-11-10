const NAME_OVERRIDES: Record<string, string> = {
  HK: 'Hong Kong',
  MO: 'Macao',
  TW: 'Taiwan',
  PS: 'Palestine',
}

let displayNames: Intl.DisplayNames | null = null

function getDisplayNames(): Intl.DisplayNames | null {
  if (displayNames) return displayNames
  try {
    displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
  } catch {
    displayNames = null
  }
  return displayNames
}

/**
 * Converts an ISO country code ("KR", "US", or legacy "AU-PER") to its English
 * full name ("South Korea", "United States"). Values that are not codes are
 * returned unchanged, so already-converted names pass through safely.
 */
export function getCountryFullName(value: string): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return trimmed

  const code = trimmed.split('-')[0].toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return trimmed

  if (NAME_OVERRIDES[code]) return NAME_OVERRIDES[code]

  try {
    const name = getDisplayNames()?.of(code)
    if (name && name !== code) return name
  } catch {
    // fall through to the raw value
  }
  return trimmed
}
