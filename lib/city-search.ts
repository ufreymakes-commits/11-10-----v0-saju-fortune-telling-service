import citiesData from './data/cities.json'

export interface City {
  name: string
  country: string
  admin1?: string // State/Province (optional)
  lat: number
  lon: number
  timezone?: string // Optional - may not be present in all datasets
}

// Raw city data format from JSON (compressed field names)
interface RawCity {
  n: string   // name
  c: string   // country
  a1?: string // admin1 (state/province) - optional
  at: number  // latitude
  on: number  // longitude
  tz?: string  // timezone (IANA) - optional
}

// Transform raw data to City interface
const cities: City[] = (citiesData as RawCity[]).map(c => ({
  name: c.n,
  country: c.c,
  admin1: c.a1,
  lat: c.at,
  lon: c.on,
  timezone: c.tz // Will be undefined if not present
}))

/**
 * Search cities by name (case-insensitive, partial match)
 * Returns top 10 results sorted by relevance
 */
export function searchCities(query: string, limit: number = 10): City[] {
  if (!query || query.length < 2) return []
  
  const normalizedQuery = query.toLowerCase().trim()
  
  // Filter cities that match the query
  const matches = cities.filter(city => 
    city.name.toLowerCase().includes(normalizedQuery) ||
    city.country.toLowerCase().includes(normalizedQuery)
  )
  
  // Sort by relevance: exact start match first, then alphabetically
  matches.sort((a, b) => {
    const aStartsWithQuery = a.name.toLowerCase().startsWith(normalizedQuery)
    const bStartsWithQuery = b.name.toLowerCase().startsWith(normalizedQuery)
    
    if (aStartsWithQuery && !bStartsWithQuery) return -1
    if (!aStartsWithQuery && bStartsWithQuery) return 1
    
    return a.name.localeCompare(b.name)
  })
  
  return matches.slice(0, limit)
}

/**
 * Get a city by exact name and country match
 */
export function getCityByNameAndCountry(name: string, country: string): City | undefined {
  return cities.find(city => 
    city.name.toLowerCase() === name.toLowerCase() &&
    city.country.toLowerCase() === country.toLowerCase()
  )
}

/**
 * Get all available countries (unique list)
 */
export function getAvailableCountries(): string[] {
  const countries = new Set(cities.map(c => c.country))
  return Array.from(countries).sort()
}

/**
 * Format city display name
 * For US/CA, shows "City, State, Country" format
 * For other countries, shows "City, Country" format
 */
export function formatCityName(city: City): string {
  if (city.admin1 && (city.country === 'US' || city.country === 'CA')) {
    return `${city.name}, ${city.admin1}, ${city.country}`
  }
  return `${city.name}, ${city.country}`
}

/**
 * Infer IANA timezone from country code and longitude
 * 
 * Used when cities.json does not include timezone data.
 * Maps country + longitude range to the most likely IANA timezone.
 */
export function inferTimezone(country: string, longitude: number): string {
  switch (country) {
    case 'US':
      if (longitude >= -67.5) return 'America/New_York'         // Eastern
      if (longitude >= -82.5) return 'America/New_York'         // Eastern
      if (longitude >= -97.5) return 'America/Chicago'          // Central
      if (longitude >= -112.5) return 'America/Denver'          // Mountain
      if (longitude >= -127.5) return 'America/Los_Angeles'     // Pacific
      if (longitude >= -141) return 'America/Anchorage'         // Alaska
      return 'Pacific/Honolulu'                                  // Hawaii
    case 'CA':
      if (longitude >= -82.5) return 'America/Toronto'
      if (longitude >= -97.5) return 'America/Winnipeg'
      if (longitude >= -112.5) return 'America/Edmonton'
      return 'America/Vancouver'
    case 'AU':
      if (longitude >= 150) return 'Australia/Sydney'
      if (longitude >= 138) return 'Australia/Adelaide'
      if (longitude >= 129) return 'Australia/Darwin'
      return 'Australia/Perth'
    case 'BR':
      if (longitude >= -34) return 'America/Recife'
      if (longitude >= -44) return 'America/Sao_Paulo'
      return 'America/Manaus'
    case 'RU':
      if (longitude >= 135) return 'Asia/Vladivostok'
      if (longitude >= 120) return 'Asia/Irkutsk'
      if (longitude >= 105) return 'Asia/Krasnoyarsk'
      if (longitude >= 82) return 'Asia/Novosibirsk'
      if (longitude >= 60) return 'Asia/Yekaterinburg'
      return 'Europe/Moscow'
    case 'CN': return 'Asia/Shanghai'
    case 'KR': return 'Asia/Seoul'
    case 'JP': return 'Asia/Tokyo'
    case 'IN': return 'Asia/Kolkata'
    case 'GB': return 'Europe/London'
    case 'DE': return 'Europe/Berlin'
    case 'FR': return 'Europe/Paris'
    case 'ES': return 'Europe/Madrid'
    case 'IT': return 'Europe/Rome'
    case 'NL': return 'Europe/Amsterdam'
    case 'MX': return longitude >= -90 ? 'America/Mexico_City' : 'America/Tijuana'
    case 'AR': return 'America/Argentina/Buenos_Aires'
    case 'SG': return 'Asia/Singapore'
    case 'TH': return 'Asia/Bangkok'
    case 'VN': return 'Asia/Ho_Chi_Minh'
    case 'PH': return 'Asia/Manila'
    case 'MY': return 'Asia/Kuala_Lumpur'
    case 'ID': return longitude >= 115 ? 'Asia/Makassar' : 'Asia/Jakarta'
    case 'NZ': return 'Pacific/Auckland'
    case 'ZA': return 'Africa/Johannesburg'
    case 'NG': return 'Africa/Lagos'
    case 'EG': return 'Africa/Cairo'
    case 'TR': return 'Europe/Istanbul'
    case 'SA': return 'Asia/Riyadh'
    case 'AE': return 'Asia/Dubai'
    case 'PK': return 'Asia/Karachi'
    case 'BD': return 'Asia/Dhaka'
    case 'PL': return 'Europe/Warsaw'
    case 'UA': return 'Europe/Kiev'
    case 'SE': return 'Europe/Stockholm'
    case 'NO': return 'Europe/Oslo'
    case 'DK': return 'Europe/Copenhagen'
    case 'FI': return 'Europe/Helsinki'
    case 'CH': return 'Europe/Zurich'
    case 'AT': return 'Europe/Vienna'
    case 'BE': return 'Europe/Brussels'
    case 'PT': return 'Europe/Lisbon'
    case 'GR': return 'Europe/Athens'
    case 'RO': return 'Europe/Bucharest'
    case 'HU': return 'Europe/Budapest'
    case 'CZ': return 'Europe/Prague'
    case 'HK': return 'Asia/Hong_Kong'
    case 'TW': return 'Asia/Taipei'
    default: {
      // 경도 기반 UTC 오프셋 추정 (최후 수단)
      const offset = Math.round(longitude / 15)
      if (offset === 0) return 'Europe/London'
      if (offset > 0) return `Etc/GMT-${offset}`
      return `Etc/GMT+${Math.abs(offset)}`
    }
  }
}
