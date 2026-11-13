'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ReportGuarantee } from '@/components/report-guarantee'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { CitySearch } from '@/components/city-search'
import { CompatibilityRelationshipFields } from '@/components/compatibility-relationship-fields'
import type { RelationshipType } from '@/lib/compat/constants'
import { inferTimezone } from '@/lib/city-search'
import type { City } from '@/lib/city-search'
import { HeartIcon } from 'lucide-react'

interface PersonFormData {
  name: string
  birthDate: string
  birthHour: string
  birthMinute: string
  birthPeriod: string
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
  borderColor,
}: {
  label: string
  data: PersonFormData
  errors: PersonFormErrors
  selectedCity: City | null
  onDataChange: (field: keyof PersonFormData, value: string) => void
  onCityChange: (city: City | null) => void
  accentColor: string
  borderColor: string
}) {
  return (
    <div className="space-y-4">
      <h3 className={`text-sm font-semibold uppercase tracking-widest ${accentColor}`}>{label}</h3>

      {/* Full Name */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">Full Name</FieldLabel>
        <Input
          type="text"
          placeholder="Enter full name"
          value={data.name}
          onChange={(e) => onDataChange('name', e.target.value)}
          className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:${borderColor}`}
        />
        {errors.name && <FieldError>{errors.name}</FieldError>}
      </Field>

      {/* Date of Birth — YYYY-MM-DD (same as birth-form.tsx) */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">Date of Birth</FieldLabel>
        <Input
          type="text"
          placeholder="YYYY-MM-DD"
          value={data.birthDate}
          onChange={(e) => {
            let value = e.target.value.replace(/[^0-9-]/g, '')
            if (value.length === 4 && !value.includes('-')) value = value + '-'
            else if (value.length === 7 && value.charAt(4) === '-' && value.indexOf('-', 5) === -1) value = value + '-'
            if (value.length <= 10) onDataChange('birthDate', value)
          }}
          className={`bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:${borderColor}`}
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
            onCityChange(city)
            if (city) onDataChange('birthCountry', city.country)
          }}
          placeholder="Search for birth city..."
          className="[&_input]:bg-white [&_input]:border-gray-300 [&_input]:text-gray-900 [&_input]:placeholder:text-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">Search by city name (e.g., Seoul, New York)</p>
        {errors.birthCountry && <FieldError>{errors.birthCountry}</FieldError>}
      </Field>

      {/* Birth Time — Hour / Min / AM/PM dropdowns */}
      <Field>
        <FieldLabel className="text-gray-800 font-medium">
          Birth Time <span className="text-gray-400 font-normal">(optional)</span>
        </FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {/* Hour */}
          <Select value={data.birthHour} onValueChange={(v) => onDataChange('birthHour', v)}>
            <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-gray-400">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                <SelectItem key={h} value={h} className="text-gray-900">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Minute */}
          <Select value={data.birthMinute} onValueChange={(v) => onDataChange('birthMinute', v)}>
            <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-gray-400">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[40vh] overflow-y-auto" position="popper" sideOffset={4}>
              <div className="py-1">
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                  <SelectItem key={m} value={m} className="text-gray-900 py-2.5 touch-manipulation">{m}</SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>

          {/* AM/PM */}
          <Select value={data.birthPeriod} onValueChange={(v) => onDataChange('birthPeriod', v)}>
            <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-gray-400">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="AM" className="text-gray-900">AM</SelectItem>
              <SelectItem value="PM" className="text-gray-900">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

function buildBirthTime(hour: string, minute: string, period: string): string | null {
  if (!hour || !minute || !period) return null
  return `${hour}:${minute} ${period}`
}

const emptyPerson = (): PersonFormData => ({
  name: '', birthDate: '',
  birthHour: '', birthMinute: '', birthPeriod: '',
  birthCountry: '', gender: ''
})

export function CompatibilityForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({ personA: {}, personB: {} })

  const [personA, setPersonA] = useState<PersonFormData>(emptyPerson())
  const [personB, setPersonB] = useState<PersonFormData>(emptyPerson())
  const [cityA, setCityA] = useState<City | null>(null)
  const [cityB, setCityB] = useState<City | null>(null)
  const [relationshipType, setRelationshipType] = useState<RelationshipType | ''>('')
  const [concern, setConcern] = useState('')
  const [relationshipError, setRelationshipError] = useState<string | undefined>()

  const validatePerson = (data: PersonFormData, city: City | null): PersonFormErrors => {
    const errs: PersonFormErrors = {}
    if (!data.name.trim()) errs.name = 'Please enter a name'
    if (!data.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)) errs.birthDate = 'Please enter date in YYYY-MM-DD format'
    if (!city) errs.birthCountry = 'Please select a birth city'
    if (!data.gender) errs.gender = 'Please select a gender'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errA = validatePerson(personA, cityA)
    const errB = validatePerson(personB, cityB)
    setErrors({ personA: errA, personB: errB })

    const relError = relationshipType ? undefined : 'Please choose what you two are right now.'
    setRelationshipError(relError)

    if (relError || Object.keys(errA).length > 0 || Object.keys(errB).length > 0) return

    setIsLoading(true)

    try {
      const timezoneA = cityA ? (cityA.timezone || inferTimezone(cityA.country, cityA.lon)) : null
      const timezoneB = cityB ? (cityB.timezone || inferTimezone(cityB.country, cityB.lon)) : null

      const birthDateA = personA.birthDate || null
      const birthDateB = personB.birthDate || null
      const birthTimeA = buildBirthTime(personA.birthHour, personA.birthMinute, personA.birthPeriod)
      const birthTimeB = buildBirthTime(personB.birthHour, personB.birthMinute, personB.birthPeriod)

      const response = await fetch('/api/compatibility/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personAName: personA.name,
          personABirthDate: birthDateA,
          personABirthTime: birthTimeA,
          personABirthCountry: cityA?.country || personA.birthCountry,
          personABirthCity: cityA?.name || null,
          personATimezone: timezoneA,
          personALongitude: cityA?.lon || null,
          personALatitude: cityA?.lat || null,
          personAGender: personA.gender,
          personBName: personB.name,
          personBBirthDate: birthDateB,
          personBBirthTime: birthTimeB,
          personBBirthCountry: cityB?.country || personB.birthCountry,
          personBBirthCity: cityB?.name || null,
          personBTimezone: timezoneB,
          personBLongitude: cityB?.lon || null,
          personBLatitude: cityB?.lat || null,
          personBGender: personB.gender,
          relationshipType,
          concern: concern.trim(),
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
      {/* Relationship type + concern */}
      <div className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm">
        <CompatibilityRelationshipFields
          relationshipType={relationshipType}
          concern={concern}
          onRelationshipChange={(v) => {
            setRelationshipType(v)
            setRelationshipError(undefined)
          }}
          onConcernChange={setConcern}
          error={relationshipError}
        />
      </div>

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
          borderColor="border-pink-400"
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
          borderColor="border-rose-400"
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
          'See Your Compatibility — $19.99'
        )}
      </Button>

      <ReportGuarantee tone="dark" />

      <p className="text-center text-xs text-gray-400">
        Secure payment via PayPal · Instant report delivery
      </p>
    </form>
  )
}
