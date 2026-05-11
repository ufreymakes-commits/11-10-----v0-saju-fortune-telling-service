'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { CitySearch } from '@/components/city-search'
import { inferTimezone } from '@/lib/city-search'
import type { City } from '@/lib/city-search'
import { HeartIcon } from 'lucide-react'

interface PersonFormData {
  name: string
  birthDate: string
  birthTime: string
  birthCountry: string
  gender: string
}

interface PersonFormErrors {
  name?: string
  birthDate?: string
  birthCountry?: string
  gender?: string
}

interface FormErrors {
  personA: PersonFormErrors
  personB: PersonFormErrors
}

function PersonForm({
  label,
  data,
  errors,
  selectedCity,
  onDataChange,
  onCityChange,
  accentColor,
}: {
  label: string
  data: PersonFormData
  errors: PersonFormErrors
  selectedCity: City | null
  onDataChange: (field: keyof PersonFormData, value: string) => void
  onCityChange: (city: City | null) => void
  accentColor: string
}) {
  return (
    <div className="space-y-4">
      <h3 className={`text-sm font-semibold uppercase tracking-widest ${accentColor}`}>{label}</h3>

      {/* Name */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">Full Name</FieldLabel>
        <Input
          type="text"
          placeholder="Enter full name"
          value={data.name}
          onChange={(e) => onDataChange('name', e.target.value)}
          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-pink-400"
        />
        {errors.name && <FieldError>{errors.name}</FieldError>}
      </Field>

      {/* Birth Date */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">Date of Birth</FieldLabel>
        <Input
          type="date"
          value={data.birthDate}
          onChange={(e) => onDataChange('birthDate', e.target.value)}
          className="bg-white border-gray-300 text-gray-900 focus:border-pink-400"
        />
        {errors.birthDate && <FieldError>{errors.birthDate}</FieldError>}
      </Field>

      {/* Birth City */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">Birth City</FieldLabel>
        <CitySearch
          value={selectedCity}
          onChange={(city) => {
            onCityChange(city)
            if (city) onDataChange('birthCountry', city.country)
          }}
          placeholder="Search for birth city..."
          className="[&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_input]:placeholder:text-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">Search by city name (e.g., Seoul, New York)</p>
        {errors.birthCountry && <FieldError>{errors.birthCountry}</FieldError>}
      </Field>

      {/* Birth Time */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">
          Birth Time <span className="text-gray-400 font-normal">(optional)</span>
        </FieldLabel>
        <Input
          type="time"
          value={data.birthTime}
          onChange={(e) => onDataChange('birthTime', e.target.value)}
          className="bg-white border-gray-300 text-gray-900 focus:border-pink-400"
        />
      </Field>

      {/* Gender */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">Gender</FieldLabel>
        <RadioGroup
          value={data.gender}
          onValueChange={(val) => onDataChange('gender', val)}
          className="flex gap-4 mt-1"
        >
          {['male', 'female'].map((g) => (
            <label
              key={g}
              className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border transition-all text-sm font-medium ${
                data.gender === g
                  ? 'border-pink-400 bg-pink-50 text-pink-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-pink-300'
              }`}
            >
              <RadioGroupItem value={g} className="sr-only" />
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </label>
          ))}
        </RadioGroup>
        {errors.gender && <FieldError>{errors.gender}</FieldError>}
      </Field>
    </div>
  )
}

export function CompatibilityForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({ personA: {}, personB: {} })

  const [personA, setPersonA] = useState<PersonFormData>({
    name: '', birthDate: '', birthTime: '', birthCountry: '', gender: ''
  })
  const [personB, setPersonB] = useState<PersonFormData>({
    name: '', birthDate: '', birthTime: '', birthCountry: '', gender: ''
  })
  const [cityA, setCityA] = useState<City | null>(null)
  const [cityB, setCityB] = useState<City | null>(null)

  const validatePerson = (data: PersonFormData, city: City | null): PersonFormErrors => {
    const errs: PersonFormErrors = {}
    if (!data.name.trim()) errs.name = 'Please enter a name'
    if (!data.birthDate) errs.birthDate = 'Please enter a birth date'
    if (!city) errs.birthCountry = 'Please select a birth city'
    if (!data.gender) errs.gender = 'Please select a gender'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errA = validatePerson(personA, cityA)
    const errB = validatePerson(personB, cityB)
    setErrors({ personA: errA, personB: errB })

    if (Object.keys(errA).length > 0 || Object.keys(errB).length > 0) return

    setIsLoading(true)

    try {
      const timezoneA = cityA ? (cityA.timezone || inferTimezone(cityA.country, cityA.lon)) : null
      const timezoneB = cityB ? (cityB.timezone || inferTimezone(cityB.country, cityB.lon)) : null

      const response = await fetch('/api/compatibility/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personAName: personA.name,
          personABirthDate: personA.birthDate,
          personABirthTime: personA.birthTime || null,
          personABirthCountry: cityA?.country || personA.birthCountry,
          personABirthCity: cityA?.name || null,
          personATimezone: timezoneA,
          personALongitude: cityA?.lon || null,
          personALatitude: cityA?.lat || null,
          personAGender: personA.gender,
          personBName: personB.name,
          personBBirthDate: personB.birthDate,
          personBBirthTime: personB.birthTime || null,
          personBBirthCountry: cityB?.country || personB.birthCountry,
          personBBirthCity: cityB?.name || null,
          personBTimezone: timezoneB,
          personBLongitude: cityB?.lon || null,
          personBLatitude: cityB?.lat || null,
          personBGender: personB.gender,
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Submission failed')

      router.push(`/compatibility/checkout/${data.submissionId}`)
    } catch (err) {
      console.error('[v0] Compatibility form submit error:', err)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Person A */}
      <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
        <PersonForm
          label="Your Information"
          data={personA}
          errors={errors.personA}
          selectedCity={cityA}
          onDataChange={(field, value) => setPersonA(prev => ({ ...prev, [field]: value }))}
          onCityChange={setCityA}
          accentColor="text-pink-500"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200 to-pink-300" />
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 border border-pink-200">
          <HeartIcon className="w-5 h-5 text-pink-500" />
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-pink-200 to-pink-300" />
      </div>

      {/* Person B */}
      <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm">
        <PersonForm
          label="Their Information"
          data={personB}
          errors={errors.personB}
          selectedCity={cityB}
          onDataChange={(field, value) => setPersonB(prev => ({ ...prev, [field]: value }))}
          onCityChange={setCityB}
          accentColor="text-rose-500"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 text-base font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 rounded-xl shadow-md shadow-pink-200"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            Processing...
          </span>
        ) : (
          'See Your Compatibility — $14.99'
        )}
      </Button>

      <p className="text-center text-xs text-gray-400">
        Secure payment via PayPal · Instant report delivery
      </p>
    </form>
  )
}
