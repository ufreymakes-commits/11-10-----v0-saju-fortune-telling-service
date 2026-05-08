import citiesData from './data/cities.json'

export interface City {
  name: string
  country: string
  lat: number
  lon: number
  timezone?: string // Optional - may not be present in all datasets
}

// Raw city data format from JSON (compressed field names)
interface RawCity {
  n: string   // name
  c: string   // country
  at: number  // latitude
  on: number  // longitude
  tz?: string  // timezone (IANA) - optional
}

// Transform raw data to City interface
const cities: City[] = (citiesData as RawCity[]).map(c => ({
  name: c.n,
  country: c.c,
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
 */
export function formatCityName(city: City): string {
  return `${city.name}, ${city.country}`
}
