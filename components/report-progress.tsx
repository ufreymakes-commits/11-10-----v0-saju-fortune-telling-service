'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangleIcon } from 'lucide-react'

const STAGES: { from: number; label: string }[] = [
  { from: 0, label: 'Reading your four pillars…' },
  { from: 12, label: 'Mapping your luck cycles…' },
  { from: 28, label: 'Checking your elements and Useful God…' },
  { from: 45, label: 'Writing your 96 cards…' },
  { from: 100, label: 'Adding the final touches…' },
]

const PROGRESS_CAP = 90
const PROGRESS_SECONDS = 100
const LONG_WAIT_SECONDS = 5 * 60
const POLL_INTERVAL_MS = 3000

function progressAt(elapsedSeconds: number) {
  const t = Math.min(elapsedSeconds / PROGRESS_SECONDS, 1)
  return PROGRESS_CAP * (1 - (1 - t) * (1 - t))
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

type GenerationStatus = 'generating' | 'success' | 'error'

/**
 * Triggers paid-report generation once, polls for the saved report every 3s, and redirects when it is ready.
 * Shared by the coupon success page and the PayPal success handler.
 */
export function useReportGeneration(submissionId: string, enabled = true) {
  const router = useRouter()
  const [status, setStatus] = useState<GenerationStatus>('generating')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const startedRef = useRef(false)
  const doneRef = useRef(false)

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setStatus('success')
    setTimeout(() => router.push(`/report/${submissionId}/paid`), 1000)
  }, [router, submissionId])

  const checkNow = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/check-paid-report?submissionId=${submissionId}`, { cache: 'no-store' })
      if (!res.ok) return false
      const data = await res.json()
      if (Array.isArray(data.facts) && data.facts.length > 0) {
        finish()
        return true
      }
    } catch {
      // keep polling
    }
    return false
  }, [submissionId, finish])

  const generate = useCallback(async () => {
    try {
      const res = await fetch('/api/generate-paid-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })

      if (res.ok) {
        // 202 = another request is already generating this report; polling will pick up the result.
        if (res.status !== 202) finish()
        return
      }

      // A gateway/platform timeout (502/504, or any non-JSON body) means the server may still be working.
      if (res.status === 502 || res.status === 504) return
      const data = await res.json().catch(() => null)
      if (data && typeof data.error === 'string') {
        setError(data.error)
        setStatus('error')
      }
    } catch {
      // Network error or dropped connection: the server may still be working, so keep polling.
    }
  }, [submissionId, finish])

  useEffect(() => {
    if (!enabled || !submissionId || startedRef.current) return
    startedRef.current = true
    generate()
  }, [enabled, submissionId, generate])

  useEffect(() => {
    if (!enabled || status !== 'generating') return
    const interval = setInterval(checkNow, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled, status, checkNow])

  const retry = useCallback(() => {
    setError(null)
    setStatus('generating')
    setAttempt((n) => n + 1)
    generate()
  }, [generate])

  return { status, error, attempt, retry, checkNow }
}

interface ReportProgressProps {
  error?: string | null
  onRetry?: () => void
  onCheckAgain?: () => Promise<boolean>
}

export function ReportProgress({ error, onRetry, onCheckAgain }: ReportProgressProps) {
  const [elapsed, setElapsed] = useState(0)
  const [checking, setChecking] = useState(false)
  const [notReady, setNotReady] = useState(false)

  useEffect(() => {
    const startedAt = Date.now()
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [])

  async function handleCheckAgain() {
    if (!onCheckAgain) return
    setChecking(true)
    setNotReady(false)
    const ready = await onCheckAgain()
    setChecking(false)
    if (!ready) setNotReady(true)
  }

  if (error) {
    return (
      <div className="text-center max-w-md px-6" role="alert">
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-4">
          <AlertTriangleIcon className="w-8 h-8 mx-auto mb-3 text-destructive" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-destructive mb-2">We couldn&apos;t finish your report</h2>
          <p className="text-foreground/70 text-sm">{error}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Try again
          </Button>
        )}
      </div>
    )
  }

  const percent = Math.round(progressAt(elapsed))
  const stage = [...STAGES].reverse().find((s) => elapsed >= s.from) ?? STAGES[0]
  const isLong = elapsed >= LONG_WAIT_SECONDS

  return (
    <div className="text-center max-w-md w-full px-6">
      <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
        <Image src="/images/mascot-main.png" alt="Sajume mascot" fill className="object-contain" />
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Report generation progress"
        className="h-2 w-full overflow-hidden rounded-full bg-muted mb-4"
      >
        <div
          className="h-full rounded-full bg-secondary transition-[width] duration-1000 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-2 mb-2" aria-live="polite">
        <Spinner className="w-4 h-4" />
        <h2 className="text-lg font-semibold">{stage.label}</h2>
      </div>
      <p className="text-muted-foreground text-sm tabular-nums mb-1">{formatElapsed(elapsed)}</p>
      <p className="text-muted-foreground text-sm mb-2">Usually about 1–2 minutes. You can keep this tab open.</p>
      <p className="text-muted-foreground/60 text-xs">You&apos;ll be redirected automatically when it&apos;s ready.</p>

      {isLong && (
        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm font-medium mb-3">This is taking longer than usual.</p>
          {onCheckAgain && (
            <Button variant="outline" onClick={handleCheckAgain} disabled={checking}>
              {checking ? 'Checking…' : 'Check again'}
            </Button>
          )}
          {notReady && (
            <p className="text-muted-foreground text-xs mt-3">Not ready yet. We&apos;ll keep checking automatically.</p>
          )}
        </div>
      )}
    </div>
  )
}
