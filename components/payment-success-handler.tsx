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
    async function capturePaymentAndGenerateReport() {
      if (!orderId) {
        setStatus('error')
        setError('Missing payment information')
        return
      }

      try {
        // Step 1: Capture payment
        const response = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Payment capture failed')
        }

        // Step 2: Generate paid report (this takes up to 2 minutes)
        setStatus('generating')
        
        const reportResponse = await fetch('/api/generate-paid-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId })
        })

        const reportData = await reportResponse.json()

        if (!reportResponse.ok) {
          console.error('Report generation failed:', reportData)
          // Still redirect even if generation fails - they can retry on the page
        }

        setStatus('success')
        
        // Redirect to paid report page
        setTimeout(() => {
          router.push(`/report/${submissionId}/paid`)
        }, 1500)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Payment failed')
      }
    }

    capturePaymentAndGenerateReport()
  }, [orderId, submissionId, router])

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
        <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-secondary" />
        <h2 className="text-xl font-bold text-gradient mb-2">Payment Successful!</h2>
        <div className="relative w-24 h-24 mx-auto my-6 animate-float">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Generating Your 99 Facts...</h3>
        <p className="text-muted-foreground mb-4">Our AI is analyzing your complete birth chart</p>
        <p className="text-sm text-muted-foreground/70">This takes less than 2 minutes. Please don&apos;t close this page.</p>
        <div className="mt-6 bg-white/5 rounded-lg p-4">
          <p className="text-muted-foreground/60 text-xs">Your personalized 99 facts report covers personality, career, relationships, health, and destiny insights based on Korean Saju astrology.</p>
        </div>
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
        <h2 className="text-xl font-semibold text-destructive mb-2">Payment Failed</h2>
        <p className="text-foreground/70">{error}</p>
      </div>
      <Link href={`/checkout/${submissionId}`}>
        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          Try Again
        </Button>
      </Link>
    </div>
  )
}
