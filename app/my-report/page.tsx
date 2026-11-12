'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StarsBackground } from '@/components/stars-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default function MyReportPage() {
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentMessage, setSentMessage] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSentMessage(null)

    if (!DATE_RE.test(birthDate)) {
      setError('Please enter your birth date like 1990-05-21.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/lookup-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, birthDate }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSentMessage(data.message || 'If we found a report for that email and birth date, we sent the link to your inbox.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden pt-10">
      <StarsBackground />

      <div className="relative z-10 flex flex-col items-center px-4 py-12">
        <Link href="/" className="mb-10">
          <div className="border border-primary/50 rounded-full px-6 py-2 text-primary text-sm tracking-wider hover:border-primary transition-colors">
            Sajume
          </div>
        </Link>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Find Your Report</h1>
            <p className="text-muted-foreground text-sm text-pretty">
              Enter the email you used at checkout and your birth date. We will email you the link to your report.
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-white border border-primary/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="email" className="text-gray-800 font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-purple-300"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="birthDate" className="text-gray-800 font-medium">Birth Date</FieldLabel>
                <Input
                  id="birthDate"
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY-MM-DD"
                  value={birthDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9-]/g, '')
                    if (value.length === 4 && !value.includes('-')) value = value + '-'
                    else if (value.length === 7 && value.charAt(4) === '-' && value.indexOf('-', 5) === -1) value = value + '-'
                    if (value.length <= 10) setBirthDate(value)
                  }}
                  required
                  className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-purple-300"
                />
              </Field>

              {error && (
                <div role="alert" className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {sentMessage && (
                <div role="status" className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-gray-800 text-sm">{sentMessage}</p>
                  <p className="text-gray-500 text-xs mt-1">It can take a minute to arrive. Please also check your spam folder.</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base font-semibold rounded-full shadow-lg shadow-primary/30 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2" />
                    Sending...
                  </>
                ) : (
                  'Email Me My Report Link'
                )}
              </Button>
            </FieldGroup>
          </form>

          <p className="text-center text-muted-foreground/70 text-xs mt-6">
            Only paid reports will be sent. Need help? Visit our{' '}
            <Link href="/policies/customer-service" className="underline">
              customer service page
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
