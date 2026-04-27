'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StarsBackground } from '@/components/stars-background'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { COUNTRIES } from '@/lib/types'

export default function MyReportPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState({ hour: '', minute: '', period: '' })
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])

  const birthTimeString = birthTime.hour && birthTime.minute && birthTime.period
    ? `${birthTime.hour}:${birthTime.minute} ${birthTime.period}`
    : ''

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const res = await fetch('/api/lookup-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          birthDate,
          country: country || undefined,
          birthTime: birthTimeString || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.found) {
        setError(data.message || 'No paid report found. Please check your information and try again.')
        return
      }

      if (data.reports.length === 1) {
        const url = data.reports[0].paidReportUrl
        // paid_report_url이 절대 URL(https://...)로 저장돼 있으므로 pathname만 추출
        try {
          const pathname = new URL(url).pathname
          router.push(pathname)
        } catch {
          // 이미 상대경로인 경우
          router.push(url)
        }
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
            <p className="text-muted-foreground text-sm">
              Enter the same information you used when you first got your reading.
            </p>
          </div>

          <form onSubmit={handleSearch} className="bg-white border border-primary/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <FieldGroup className="gap-5">

              {/* Name */}
              <Field>
                <FieldLabel htmlFor="name" className="text-gray-800 font-medium">Your Name</FieldLabel>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jenny Kim"
                  required
                  className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-purple-300"
                />
              </Field>

              {/* Birth Date - YYYY-MM-DD same as BirthForm */}
              <Field>
                <FieldLabel htmlFor="birthDate" className="text-gray-800 font-medium">Birth Date</FieldLabel>
                <Input
                  id="birthDate"
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={birthDate}
                  onChange={e => {
                    let value = e.target.value.replace(/[^0-9-]/g, '')
                    if (value.length === 4 && !value.includes('-')) value = value + '-'
                    else if (value.length === 7 && value.charAt(4) === '-' && value.indexOf('-', 5) === -1) value = value + '-'
                    if (value.length <= 10) setBirthDate(value)
                  }}
                  required
                  className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-purple-300"
                />
              </Field>

              {/* Birth Country - same dropdown as BirthForm */}
              <Field>
                <FieldLabel className="text-gray-800 font-medium">Birth Country</FieldLabel>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                    <SelectValue placeholder="Select your birth country" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-white max-h-[40vh] overflow-y-auto"
                    position="popper"
                    sideOffset={4}
                    onPointerDownOutside={e => {
                      const target = e.target as HTMLElement
                      if (target.closest('[data-radix-select-viewport]')) e.preventDefault()
                    }}
                    onOpenAutoFocus={e => e.preventDefault()}
                  >
                    <div className="py-1">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.value} value={c.value} className="text-gray-900 py-3 cursor-pointer touch-manipulation">
                          {c.label}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </Field>

              {/* Birth Time - Hour / Minute / AM PM same as BirthForm */}
              <Field>
                <FieldLabel className="text-gray-800 font-medium">
                  Birth Time <span className="text-gray-400 font-normal">(optional)</span>
                </FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={birthTime.hour} onValueChange={v => setBirthTime(t => ({ ...t, hour: v }))}>
                    <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {Array.from({ length: 12 }, (_, i) => {
                        const h = (i + 1).toString().padStart(2, '0')
                        return <SelectItem key={h} value={h} className="text-gray-900">{h}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                  <Select value={birthTime.minute} onValueChange={v => setBirthTime(t => ({ ...t, minute: v }))}>
                    <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[40vh] overflow-y-auto" position="popper" sideOffset={4} onOpenAutoFocus={e => e.preventDefault()}>
                      <div className="py-1">
                        {Array.from({ length: 60 }, (_, i) => {
                          const m = i.toString().padStart(2, '0')
                          return <SelectItem key={m} value={m} className="text-gray-900 py-2.5 touch-manipulation">{m}</SelectItem>
                        })}
                      </div>
                    </SelectContent>
                  </Select>
                  <Select value={birthTime.period} onValueChange={v => setBirthTime(t => ({ ...t, period: v }))}>
                    <SelectTrigger className="w-full bg-white border-gray-300 focus:border-primary text-gray-900 data-[placeholder]:text-purple-300">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="AM" className="text-gray-900">AM</SelectItem>
                      <SelectItem value="PM" className="text-gray-900">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Birth time is optional and not used as a primary filter.</p>
              </Field>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-base font-semibold rounded-full shadow-lg shadow-primary/30 mt-2 disabled:opacity-50"
              >
                {loading ? <><Spinner className="mr-2" />Searching...</> : 'Find My Report'}
              </Button>
            </FieldGroup>
          </form>

          {/* Multiple results */}
          {results.length > 1 && (
            <div className="mt-6 space-y-3">
              <p className="text-muted-foreground text-sm text-center">Multiple reports found. Select yours:</p>
              {results.map((r, i) => {
              let href = r.paidReportUrl
              try { href = new URL(r.paidReportUrl).pathname } catch { /* 상대경로 그대로 */ }
              return (
                <Link key={i} href={href}>
                  <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer">
                    <p className="text-foreground font-medium">{r.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {r.birthDate} &mdash; Generated {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  </Link>
              )
            })}
            </div>
          )}

          <p className="text-center text-muted-foreground/50 text-xs mt-6">
            Only paid and generated reports will appear here.
          </p>
        </div>
      </div>
    </main>
  )
}
