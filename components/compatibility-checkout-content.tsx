'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ShieldCheckIcon, HeartIcon, CheckIcon } from 'lucide-react'

interface CompatibilityCheckoutContentProps {
  submissionId: string
  personAName: string
  personBName: string
}

export function CompatibilityCheckoutContent({
  submissionId,
  personAName,
  personBName,
}: CompatibilityCheckoutContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle PayPal return after approval
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setIsLoading(true)
      handlePayPalCallback(token)
    }
  }, [searchParams])

  const handlePayPalCallback = async (token: string) => {
    try {
      const response = await fetch('/api/compatibility/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: token })
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Payment capture failed')
      router.push(`/compatibility/report/${data.submissionId}/paid`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment verification failed')
      setIsLoading(false)
    }
  }

  const handlePayPalCheckout = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/compatibility/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })
      const data = await response.json()
      if (!response.ok || !data.approvalUrl) throw new Error(data.error || 'Failed to create order')
      window.location.href = data.approvalUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner className="w-8 h-8 text-pink-400" />
        <p className="text-white/60 text-sm">Processing your payment...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Couple preview card */}
      <div className="bg-white/5 border border-pink-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-white font-semibold">{personAName}</span>
          <HeartIcon className="w-4 h-4 text-pink-400 flex-shrink-0" />
          <span className="text-white font-semibold">{personBName}</span>
        </div>
        <p className="text-center text-white/50 text-sm">Your compatibility report is ready to generate</p>
      </div>

      {/* What you get */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
        <h3 className="text-white font-semibold text-sm">What&apos;s included</h3>
        {[
          'Full Saju chart analysis for both partners',
          'Elemental compatibility score',
          'Relationship dynamics & communication style',
          'Career & financial compatibility',
          'Long-term compatibility forecast',
          'Personalized advice for your pairing',
        ].map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <CheckIcon className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
            <span className="text-white/70 text-sm">{item}</span>
          </div>
        ))}
      </div>

      {/* Price & CTA */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <span className="text-white/60 text-sm">Compatibility Report</span>
          <span className="text-white font-bold text-xl">$19.99</span>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <Button
          onClick={handlePayPalCheckout}
          disabled={isLoading}
          className="w-full h-14 text-base font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 rounded-xl shadow-md shadow-pink-900/30"
        >
          Pay with PayPal
        </Button>

        <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          <span>Secured by PayPal · 256-bit encryption</span>
        </div>
      </div>
    </div>
  )
}
