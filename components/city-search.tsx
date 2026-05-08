'use client'

import { useState, useRef, useEffect } from 'react'
import { searchCities, formatCityName, type City } from '@/lib/city-search'

interface CitySearchProps {
  value: City | null
  onChange: (city: City | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CitySearch({
  value,
  onChange,
  placeholder = 'Search for your birth city...',
  disabled = false,
  className = ''
}: CitySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Search when query changes
  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchCities(query, 8)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
      setHighlightedIndex(0)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (results[highlightedIndex]) {
          selectCity(results[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const selectCity = (city: City) => {
    onChange(city)
    setQuery(formatCityName(city))
    setIsOpen(false)
    setResults([])
  }

  const clearSelection = () => {
    onChange(null)
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value ? formatCityName(value) : query}
          onChange={(e) => {
            if (value) {
              // If there's a selected value, clear it when typing
              onChange(null)
            }
            setQuery(e.target.value)
          }}
          onFocus={() => {
            if (query.length >= 2 && results.length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
        />
        
        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Clear selection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        
        {/* Search icon */}
        {!value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-[#1a1625] border border-white/10 rounded-lg shadow-xl overflow-hidden"
        >
          {results.map((city, index) => (
            <button
              key={`${city.name}-${city.country}-${city.lat}-${city.lon}`}
              type="button"
              onClick={() => selectCity(city)}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors ${
                index === highlightedIndex
                  ? 'bg-purple-600/30 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="font-medium">{city.name}</span>
              <span className="text-white/40 ml-1">{city.country}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1625] border border-white/10 rounded-lg shadow-xl p-3 text-center text-white/40 text-sm">
          No cities found for &quot;{query}&quot;
        </div>
      )}
    </div>
  )
}
