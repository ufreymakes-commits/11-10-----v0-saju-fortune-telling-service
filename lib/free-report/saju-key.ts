import type { SajuData } from '@/lib/types'

export const NAME_PLACEHOLDER = '{{NAME}}'

type Pillar = { stem?: string; branch?: string } | null | undefined

function pillarText(pillar: Pillar): string | null {
  if (!pillar?.stem || !pillar?.branch) return null
  return `${pillar.stem}${pillar.branch}`
}

/**
 * Stable cache key for a free report: year|month|day|hour pillars, gender, birth date.
 * Returns null when any of the first three pillars is missing, which means "skip the cache".
 */
export function buildSajuKey({
  sajuData,
  gender,
  birthDate,
}: {
  sajuData: SajuData
  gender: string
  birthDate: string
}): string | null {
  const year = pillarText(sajuData?.yearPillar)
  const month = pillarText(sajuData?.monthPillar)
  const day = pillarText(sajuData?.dayPillar)
  if (!year || !month || !day || !birthDate) return null

  const hour = pillarText(sajuData?.hourPillar) ?? 'NOHOUR'
  const genderKey = String(gender).trim().toLowerCase() === 'female' ? 'female' : 'male'
  const dateKey = String(birthDate).slice(0, 10)

  return [year, month, day, hour, genderKey, dateKey].join('|')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function nameVariants(name: string): string[] {
  const full = name.trim().replace(/\s+/g, ' ')
  if (!full) return []
  const variants = new Set<string>([full])
  const firstWord = full.split(' ')[0]
  if (firstWord.length >= 2) variants.add(firstWord)
  return Array.from(variants).sort((a, b) => b.length - a.length)
}

function buildNameRegex(name: string): RegExp | null {
  const variants = nameVariants(name)
  if (variants.length === 0) return null
  const alternation = variants.map((v) => escapeRegExp(v).replace(/ /g, '\\s+')).join('|')
  // Unicode-aware "word boundary" so names like "Mia" never match inside "Miami".
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternation})(?![\\p{L}\\p{N}])`, 'giu')
}

function mapStrings<T>(value: T, transform: (text: string) => string): T {
  if (typeof value === 'string') return transform(value) as unknown as T
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, transform)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = mapStrings(item, transform)
    }
    return out as T
  }
  return value
}

/** Replaces the customer's name (and the first word of a multi-word name) with {{NAME}}. */
export function maskName<T>(value: T, name: string): T {
  const regex = buildNameRegex(name)
  if (!regex) return value
  return mapStrings(value, (text) => text.replace(regex, NAME_PLACEHOLDER))
}

/** Reverse of maskName: puts the given name back wherever {{NAME}} appears. */
export function fillName<T>(value: T, name: string): T {
  const safeName = name.trim()
  return mapStrings(value, (text) => text.split(NAME_PLACEHOLDER).join(safeName))
}
