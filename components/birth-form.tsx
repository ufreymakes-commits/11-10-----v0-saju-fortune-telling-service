'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/hooks/use-track'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { COUNTRIES, REFERRAL_SOURCES } from '@/lib/types'
import { CitySearch } from '@/components/city-search'
import type { City } from '@/lib/city-search'
import { inferTimezone } from '@/lib/city-search'
import { isValidEmail } from '@/lib/validation'

interface FormErrors {
  name?: string
  email?: string
  birthDate?: string
  birthCountry?: string
  gender?: string
  referralSource?: string
  dailyLimit?: string
}

// Helper function to check daily limit (2 free reports per day)
const DAILY_LIMIT = 2
const STORAGE_KEY = 'sajume_daily_reports'

function getDailyReportCount(): { count: number; date: string } {
  if (typeof window === 'undefined') return { count: 0, date: '' }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return { count: 0, date: '' }
  
  try {
    const data = JSON.parse(stored)
    const today = new Date().toISOString().split('T')[0]
    
    // Reset count if it's a new day
    if (data.date !== today) {
      return { count: 0, date: today }
    }
    
    return data
  } catch {
    return { count: 0, date: '' }
  }
}

function incrementDailyReportCount(): void {
  if (typeof window === 'undefined') return
  
  const today = new Date().toISOString().split('T')[0]
  const current = getDailyReportCount()
  
  const newCount = current.date === today ? current.count + 1 : 1
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    count: newCount,
    date: today
  }))
}

export function BirthForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    birthCountry: '',
    birthTime: '',
    gender: '',
    referralSource: '',
    yajasi: 'apply'
  })
  
  // New: City selection for precise timezone/longitude
  const [selectedCity, setSelectedCity] = useState<City | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g. name@example.com)'
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = 'Please enter your birth date'
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.birthDate)) {
      newErrors.birthDate = 'Please enter date in YYYY-MM-DD format'
    } else {
      // Validate actual date
      const [year, month, day] = formData.birthDate.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        newErrors.birthDate = 'Please enter a valid date'
      }
    }
    
    if (!selectedCity) {
      newErrors.birthCountry = 'Please select your birth city'
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender'
    }
    
    if (!formData.referralSource) {
      newErrors.referralSource = 'Please tell us how you found us'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    track('form_submit', '/start', { country: formData.country })
    
    try {
      // Prepare submission data with city information
      // Resolve timezone: use city's timezone if present, otherwise infer from country+longitude
      const resolvedTimezone = selectedCity
        ? (selectedCity.timezone || inferTimezone(selectedCity.country, selectedCity.lon))
        : null

      const submitData = {
        ...formData,
        birthCountry: selectedCity?.country || formData.birthCountry,
        birthCity: selectedCity?.name || null,
        timezone: resolvedTimezone,
        longitude: selectedCity?.lon || null,
        latitude: selectedCity?.lat || null
      }
      
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit')
      }
      
      const { submissionId } = await response.json()
      router.push(`/preview/${submissionId}`)
    } catch {
      setErrors({ name: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-md mx-auto">
      <FieldGroup className="gap-5">
        {/* Name */}
        <Field>
          <FieldLabel htmlFor="name" className="text-gray-800 font-medium">Your Name</FieldLabel>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-purple-300"
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email" className="text-gray-800 font-medium">Email Address</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-purple-300"
            aria-invalid={!!errors.email}
          />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </Field>

        {/* Birth Date */}
        <Field>
          <FieldLabel htmlFor="birthDate" className="text-gray-800 font-medium">Birth Date</FieldLabel>
          <Input
            id="birthDate"
            type="text"
            placeholder="YYYY-MM-DD"
            value={formData.birthDate}
            onChange={(e) => {
              let value = e.target.value.replace(/[^0-9-]/g, '')
              // Auto-format: add dashes after year and month
              if (value.length === 4 && !value.includes('-')) {
                value = value + '-'
              } else if (value.length === 7 && value.charAt(4) === '-' && value.indexOf('-', 5) === -1) {
                value = value + '-'
              }
              // Limit to 10 characters (YYYY-MM-DD)
              if (value.length <= 10) {
                setFormData({ ...formData, birthDate: value })
              }
            }}
            className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-purple-300"
            aria-invalid={!!errors.birthDate}
          />
          {errors.birthDate && <FieldError>{errors.birthDate}</FieldError>}
        </Field>

        {/* Birth City */}
        <Field>
          <FieldLabel className="text-gray-800 font-medium">Birth City</FieldLabel>
          <CitySearch
            value={selectedCity}
            onChange={(city) => {
              setSelectedCity(city)
              if (city) {
                setFormData({ ...formData, birthCountry: city.country })
              }
            }}
            placeholder="Search for your birth city..."
            className="[&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_input]:placeholder:text-purple-300"
          />
          <p className="text-xs text-gray-600 mt-1.5">
            Search by city name (e.g., Seoul, New York, London)
          </p>
          {errors.birthCountry && <FieldError>{errors.birthCountry}</FieldError>}
        </Field>

        {/* Birth Time (Optional) */}
        <Field>
          <FieldLabel htmlFor="birthTime" className="text-gray-800 font-medium">
            Birth Time <span className="text-gray-400 font-normal">(optional)</span>
          </FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            <Select
              value={formData.birthTime ? formData.birthTime.split(':')[0] : ''}
              onValueChange={(hour) => {
                const currentMinute = formData.birthTime ? formData.birthTime.split(':')[1]?.split(' ')[0] : '00'
                const currentPeriod = formData.birthTime?.includes('PM') ? 'PM' : 'AM'
                setFormData({ ...formData, birthTime: hour ? `${hour}:${currentMinute} ${currentPeriod}` : '' })
              }}
            >
              <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = (i + 1).toString().padStart(2, '0')
                  return (
                    <SelectItem key={hour} value={hour} className="text-gray-900">
                      {hour}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select
              value={formData.birthTime ? formData.birthTime.split(':')[1]?.split(' ')[0] : ''}
              onValueChange={(minute) => {
                const currentHour = formData.birthTime ? formData.birthTime.split(':')[0] : '12'
                const currentPeriod = formData.birthTime?.includes('PM') ? 'PM' : 'AM'
                setFormData({ ...formData, birthTime: `${currentHour}:${minute} ${currentPeriod}` })
              }}
            >
              <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent 
                className="bg-white max-h-[40vh] overflow-y-auto"
                position="popper"
                sideOffset={4}
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('[data-radix-select-viewport]')) {
                    e.preventDefault()
                  }
                }}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="py-1">
                  {Array.from({ length: 60 }, (_, i) => {
                    const minute = i.toString().padStart(2, '0')
                    return (
                      <SelectItem key={minute} value={minute} className="text-gray-900 py-2.5 touch-manipulation">
                        {minute}
                      </SelectItem>
                    )
                  })}
                </div>
              </SelectContent>
            </Select>
            <Select
              value={formData.birthTime?.includes('PM') ? 'PM' : formData.birthTime?.includes('AM') ? 'AM' : ''}
              onValueChange={(period) => {
                const currentHour = formData.birthTime ? formData.birthTime.split(':')[0] : '12'
                const currentMinute = formData.birthTime ? formData.birthTime.split(':')[1]?.split(' ')[0] : '00'
                setFormData({ ...formData, birthTime: `${currentHour}:${currentMinute} ${period}` })
              }}
            >
              <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="AM" className="text-gray-900">AM</SelectItem>
                <SelectItem value="PM" className="text-gray-900">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            <span className="font-bold">Sajume automatically calculates Daylight Saving Time.</span>{" And if you don't know the birth time, just submit as a blank. It's more accurate if you have an exact time though."}
          </p>

          {/* 야자시 질문: 시계 시각이 11 PM 대일 때만 표시 */}
          {(() => {
            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(formData.birthDate || '')
            const isLateNight = !!formData.birthTime?.startsWith('11:') && formData.birthTime.includes('PM')
            if (!m || !isLateNight) return null
            const d0 = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
            const d1 = new Date(d0.getTime() + 86400000)
            const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
            return (
              <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50/60 p-3">
                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                  You were born between 11 PM and midnight. Traditions differ on when the day changes.
                </p>
                <RadioGroup
                  value={formData.yajasi}
                  onValueChange={(value) => setFormData({ ...formData, yajasi: value })}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="apply" id="yajasi-apply" />
                    <label htmlFor="yajasi-apply" className="text-sm cursor-pointer text-gray-800">
                      Count as {fmt(d0)} (the same night)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="none" id="yajasi-none" />
                    <label htmlFor="yajasi-none" className="text-sm cursor-pointer text-gray-800">
                      Count as {fmt(d1)} (the day changes at 11 PM)
                    </label>
                  </div>
                </RadioGroup>
              </div>
            )
          })()}
        </Field>

        {/* Gender */}
        <Field>
          <FieldLabel className="text-gray-800 font-medium">Gender</FieldLabel>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="female" id="female" />
              <label htmlFor="female" className="text-sm cursor-pointer text-gray-800">Female</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="male" id="male" />
              <label htmlFor="male" className="text-sm cursor-pointer text-gray-800">Male</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="other" id="other" />
              <label htmlFor="other" className="text-sm cursor-pointer text-gray-800">Other</label>
            </div>
          </RadioGroup>
          {errors.gender && <FieldError>{errors.gender}</FieldError>}
        </Field>

        {/* Referral Source */}
        <Field>
          <FieldLabel className="text-gray-800 font-medium">How did you find us?</FieldLabel>
          <Select 
            value={formData.referralSource} 
            onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
          >
            <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {REFERRAL_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value} className="text-gray-900">
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.referralSource && <FieldError>{errors.referralSource}</FieldError>}
        </Field>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-lg font-semibold rounded-full shadow-lg shadow-primary/30 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Calculating your chart...
            </>
          ) : (
            'Reveal My Destiny'
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}
