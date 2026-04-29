'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircleIcon } from 'lucide-react'

export default function CouponSuccessPage() {
  const router = useRouter()
  const params = useParams()
  const submissionId = params.id as string
  const [status, setStatus] = useState<'generating' | 'success'>('generating')

  // Step 1: Trigger generation from client (same as PayPal's payment-success-handler)
  useEffect(() => {
    if (!submissionId) return

    fetch('/api/generate-paid-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    }).catch(() => {
      // silently ignore — polling will catch completion
    })
  }, [submissionId])

  // Step 2: Poll DB every 5 seconds — same as payment-success-handler
  useEffect(() => {
    if (!submissionId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-paid-report?submissionId=${submissionId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.facts && Array.isArray(data.facts) && data.facts.length > 0) {
            clearInterval(interval)
            setStatus('success')
            setTimeout(() => router.push(`/report/${submissionId}/paid`), 1000)
          }
        }
      } catch {
        // keep polling
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [submissionId, router])

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-secondary" />
          <h2 className="text-2xl font-bold text-gradient mb-2">Report Ready!</h2>
          <p className="text-sm text-muted-foreground">Redirecting to your full report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
          <Image
            src="/images/mascot-main.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        <Spinner className="w-8 h-8 mx-auto mb-6" />
        <h2 className="text-xl font-semibold mb-2">Generating your full report...</h2>
        <p className="text-muted-foreground text-sm mb-2">It usually takes less than 2–3 minutes.</p>
        <p className="text-muted-foreground/60 text-xs">Please don&apos;t close this page. You&apos;ll be redirected automatically when ready.</p>
      </div>
    </div>
  )
}
