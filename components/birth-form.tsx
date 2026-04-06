'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface FormErrors {
  name?: string
  birthDate?: string
  birthCountry?: string
  gender?: string
  referralSource?: string
}

export function BirthForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthCountry: '',
    birthTime: '',
    gender: '',
    referralSource: ''
  })

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name'
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
    
    if (!formData.birthCountry) {
      newErrors.birthCountry = 'Please select your birth country'
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
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
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

        {/* Birth Country */}
        <Field>
          <FieldLabel className="text-gray-800 font-medium">Birth Country</FieldLabel>
          <Select 
            value={formData.birthCountry} 
            onValueChange={(value) => setFormData({ ...formData, birthCountry: value })}
          >
            <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
              <SelectValue placeholder="Select your birth country" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[300px]">
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value} className="text-gray-900">
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            Please select your country of birth, and if your country has multiple time zones, choose the city with the time zone most similar to your birth location.
          </p>
          {errors.birthCountry && <FieldError>{errors.birthCountry}</FieldError>}
        </Field>

        {/* Birth Time (Optional) */}
        <Field>
          <FieldLabel htmlFor="birthTime" className="text-gray-800 font-medium">
            Birth Time <span className="text-gray-400 font-normal">(optional)</span>
          </FieldLabel>
          <div className="flex gap-2">
            <Select
              value={formData.birthTime ? formData.birthTime.split(':')[0] : ''}
              onValueChange={(hour) => {
                const currentMinute = formData.birthTime ? formData.birthTime.split(':')[1]?.split(' ')[0] : '00'
                const currentPeriod = formData.birthTime?.includes('PM') ? 'PM' : 'AM'
                setFormData({ ...formData, birthTime: hour ? `${hour}:${currentMinute} ${currentPeriod}` : '' })
              }}
            >
              <SelectTrigger className="w-[100px] bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
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
              <SelectTrigger className="w-[100px] bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[200px]">
                {Array.from({ length: 60 }, (_, i) => {
                  const minute = i.toString().padStart(2, '0')
                  return (
                    <SelectItem key={minute} value={minute} className="text-gray-900">
                      {minute}
                    </SelectItem>
                  )
                })}
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
              <SelectTrigger className="w-[90px] bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="AM" className="text-gray-900">AM</SelectItem>
                <SelectItem value="PM" className="text-gray-900">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            <span className="font-bold">If applicable, use standard time (exclude DST; Daylight Saving Time).</span>{" If you don't know the birth time, just submit as a blank. It's more accurate if you have an exact time though."}
          </p>
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
          className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-lg font-semibold rounded-full shadow-lg shadow-primary/30 mt-4"
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
