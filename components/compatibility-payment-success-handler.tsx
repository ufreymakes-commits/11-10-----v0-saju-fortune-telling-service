'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon, HeartIcon } from 'lucide-react'

interface CompatibilityPaymentSuccessHandlerProps {
  submissionId: string
  orderId?: string
}

export function CompatibilityPaymentSuccessHandler({ submissionId, orderId }: CompatibilityPaymentSuccessHandlerProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function captureAndGenerate() {
      if (!orderId) {
        setStatus('error')
        setError('Missing payment information')
        return
      }

      try {
        const captureResponse = await fetch('/api/compatibility/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })

        const captureData = await captureResponse.json()

        if (!captureResponse.ok || !captureData.success) {
          throw new Error(captureData.error || 'Payment capture failed')
        }

        setStatus('success')

        // The route answers 202 right away and generates in the background.
        // The report page loader polls for the result, so a failure here is not fatal.
        try {
          await fetch('/api/compatibility/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId }),
          })
        } catch (genErr) {
          console.error('[v0] compat generate kick-off failed (loader will retry):', genErr)
        }

        router.push(`/compatibility/report/${submissionId}/paid`)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Payment capture failed')
      }
    }

    captureAndGenerate()
  }, [orderId, submissionId, router])

  if (status === 'processing') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center animate-pulse">
          <HeartIcon className="w-8 h-8 text-pink-400" />
        </div>
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Processing your payment...</h2>
        <p className="text-white/60">Please wait while we confirm your order</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-pink-400" />
        <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
        <p className="text-white/70 mb-4">Thank you for your purchase</p>
        <p className="text-sm text-white/50">Taking you to your compatibility report...</p>
      </div>
    )
  }

  return (
    <div className="text-center max-w-md">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-4">
        <h2 className="text-xl font-semibold text-red-400 mb-2">Payment Capture Failed</h2>
        <p className="text-white/70 text-sm mb-2">{error}</p>
        <p className="text-white/50 text-xs">If you were charged, please contact support.</p>
      </div>
      <Link href={`/compatibility/checkout/${submissionId}`}>
        <Button className="bg-pink-500 text-white hover:bg-pink-600">
          Try Again
        </Button>
      </Link>
    </div>
  )
}
