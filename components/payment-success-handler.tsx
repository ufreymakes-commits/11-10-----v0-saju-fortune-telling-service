'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ReportProgress, useReportGeneration } from '@/components/report-progress'
import { CheckCircleIcon } from 'lucide-react'

interface PaymentSuccessHandlerProps {
  submissionId: string
  orderId?: string
}

export function PaymentSuccessHandler({ submissionId, orderId }: PaymentSuccessHandlerProps) {
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

        // Step 2: Show generating UI; useReportGeneration starts generation and polls from here
        setStatus('generating')

      } catch (err) {
        // Only payment capture errors reach here
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Payment capture failed')
      }
    }

    captureAndGenerate()
  }, [orderId, submissionId])

  const generation = useReportGeneration(submissionId, status === 'generating')

  if (status === 'processing') {
    return (
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4 animate-float">
          <Image
            src="/images/mascot-main.png"
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

  if (status === 'generating' && generation.status !== 'success') {
    return (
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-secondary" />
        <h2 className="text-2xl font-bold text-gradient mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-8">Now generating your personalized report...</p>
        <ReportProgress
          key={generation.attempt}
          error={generation.error}
          onRetry={generation.retry}
          onCheckAgain={generation.checkNow}
        />
      </div>
    )
  }

  if (status === 'success' || generation.status === 'success') {
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
