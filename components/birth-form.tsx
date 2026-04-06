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
          <FieldLabel htmlFor="name">Your Name</FieldLabel>
          <Input
            id="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-card/50 border-border/50 focus:border-primary"
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>

        {/* Birth Date */}
        <Field>
          <FieldLabel htmlFor="birthDate">Birth Date</FieldLabel>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            className="bg-card/50 border-border/50 focus:border-primary"
            aria-invalid={!!errors.birthDate}
          />
          {errors.birthDate && <FieldError>{errors.birthDate}</FieldError>}
        </Field>

        {/* Birth Country */}
        <Field>
          <FieldLabel>Birth Country</FieldLabel>
          <Select 
            value={formData.birthCountry} 
            onValueChange={(value) => setFormData({ ...formData, birthCountry: value })}
          >
            <SelectTrigger className="w-full bg-card/50 border-border/50 focus:border-primary">
              <SelectValue placeholder="Select your birth country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.birthCountry && <FieldError>{errors.birthCountry}</FieldError>}
        </Field>

        {/* Birth Time (Optional) */}
        <Field>
          <FieldLabel htmlFor="birthTime">
            Birth Time <span className="text-muted-foreground font-normal">(optional)</span>
          </FieldLabel>
          <Input
            id="birthTime"
            type="time"
            value={formData.birthTime}
            onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
            className="bg-card/50 border-border/50 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            For more accurate readings, enter your birth time if known
          </p>
        </Field>

        {/* Gender */}
        <Field>
          <FieldLabel>Gender</FieldLabel>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="female" id="female" />
              <label htmlFor="female" className="text-sm cursor-pointer">Female</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="male" id="male" />
              <label htmlFor="male" className="text-sm cursor-pointer">Male</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="other" id="other" />
              <label htmlFor="other" className="text-sm cursor-pointer">Other</label>
            </div>
          </RadioGroup>
          {errors.gender && <FieldError>{errors.gender}</FieldError>}
        </Field>

        {/* Referral Source */}
        <Field>
          <FieldLabel>How did you find us?</FieldLabel>
          <Select 
            value={formData.referralSource} 
            onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
          >
            <SelectTrigger className="w-full bg-card/50 border-border/50 focus:border-primary">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
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
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 text-lg font-semibold rounded-full glow-pink mt-4"
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
