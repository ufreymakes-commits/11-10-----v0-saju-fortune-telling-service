'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StarsBackground } from '@/components/stars-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'

export default function MyReportPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])
    setSearched(false)

    try {
      const res = await fetch('/api/lookup-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthDate, birthTime: birthTime || undefined, country: country || undefined }),
      })
      const data = await res.json()

      setSearched(true)

      if (!res.ok || !data.found) {
        setError(data.message || 'No paid report found. Please check your information and try again.')
        return
      }

      if (data.reports.length === 1) {
        // 하나면 바로 이동
        router.push(data.reports[0].paidReportUrl)
      } else {
        setResults(data.reports)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />

      <div className="relative z-10 flex flex-col items-center px-4 py-12">
        {/* Logo */}
        <Link href="/" className="mb-10">
          <div className="border border-primary/50 rounded-full px-6 py-2 text-primary text-sm tracking-wider hover:border-primary transition-colors">
            Sajume
          </div>
        </Link>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Find Your Report</h1>
            <p className="text-muted-foreground text-sm">
              Enter the same information you used when you first got your reading.
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Minji Kim"
                required
              />
            </Field>

            <Field>
              <FieldLabel>Date of Birth</FieldLabel>
              <Input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel>Time of Birth <span className="text-muted-foreground/60 text-xs">(optional)</span></FieldLabel>
              <Input
                type="time"
                value={birthTime}
                onChange={e => setBirthTime(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Country <span className="text-muted-foreground/60 text-xs">(optional)</span></FieldLabel>
              <Input
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g. South Korea"
              />
            </Field>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
              {loading ? 'Searching...' : 'Find My Report'}
            </Button>
          </form>

          {/* Multiple results */}
          {results.length > 1 && (
            <div className="mt-6 space-y-3">
              <p className="text-muted-foreground text-sm text-center">Multiple reports found. Select yours:</p>
              {results.map((r, i) => (
                <Link key={i} href={r.paidReportUrl}>
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <p className="text-foreground font-medium">{r.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {r.birthDate} &mdash; Generated {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="text-center text-muted-foreground/50 text-xs mt-6">
            Only reports that have been paid for and generated will appear here.
          </p>
        </div>
      </div>
    </main>
  )
}
