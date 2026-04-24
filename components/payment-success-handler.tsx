'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon } from 'lucide-react'

interface PaymentSuccessHandlerProps {
  submissionId: string
  orderId?: string
}

export function PaymentSuccessHandler({ submissionId, orderId }: PaymentSuccessHandlerProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'generating' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function captureAndGenerate() {
      if (!orderId) {
        setStatus('error')
        setError('Missing payment information')
        return
      }

      try {
        // Step 1: Capture payment
        const captureResponse = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        })

        const captureData = await captureResponse.json()

        if (!captureResponse.ok || !captureData.success) {
          throw new Error(captureData.error || 'Payment capture failed')
        }

        // Step 2: Show generating UI
        setStatus('generating')

        // Step 3: Fire generate API - if it times out (500) that's OK, we poll DB below
        fetch('/api/generate-paid-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId })
        }).then(async (res) => {
          if (res.ok) {
            // Generation completed within timeout - redirect immediately
            setStatus('success')
            setTimeout(() => router.push(`/report/${submissionId}/paid`), 1000)
          }
          // If not ok (e.g. 500 timeout), polling below will catch the DB write
        }).catch(() => {
          // Network error - polling below will handle it
        })

      } catch (err) {
        // Only payment capture errors reach here
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Payment capture failed')
      }
    }

    captureAndGenerate()
  }, [orderId, submissionId, router])

  // Poll DB every 5 seconds while generating - catches cases where Gemini
  // completes but the API timed out before returning the response
  useEffect(() => {
    if (status !== 'generating') return

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
  }, [status, submissionId, router])

  if (status === 'processing') {
    return (
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4 animate-float">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Processing your payment...</h2>
        <p className="text-muted-foreground">Please wait while we confirm your order</p>
      </div>
    )
  }

  if (status === 'generating') {
    return (
      <div className="text-center max-w-md">
        <CheckCircleIcon className="w-12 h-12 mx-auto mb-6 text-secondary" />
        <h2 className="text-2xl font-bold text-gradient mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-8">Now generating your personalized 99 facts...</p>
        <div className="relative w-32 h-32 mx-auto mb-8 animate-float">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        <Spinner className="w-8 h-8 mx-auto mb-6" />
        <p className="text-muted-foreground text-sm mb-2">It usually takes less than 2-3 minutes.</p>
        <p className="text-muted-foreground/60 text-xs">Please don&apos;t close this page. You&apos;ll be redirected automatically when ready.</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-secondary" />
        <h2 className="text-2xl font-bold text-gradient mb-2">Payment Successful!</h2>
        <p className="text-foreground/70 mb-4">Thank you for your purchase</p>
        <p className="text-sm text-muted-foreground">Redirecting to your full report...</p>
      </div>
    )
  }

  return (
    <div className="text-center max-w-md">
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Payment Capture Failed</h2>
        <p className="text-foreground/70 text-sm mb-2">{error}</p>
        <p className="text-foreground/50 text-xs">If you were charged, please contact support. Your payment may still be processing.</p>
      </div>
      <Link href={`/checkout/${submissionId}`}>
        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          Try Again
        </Button>
      </Link>
    </div>
  )
}
