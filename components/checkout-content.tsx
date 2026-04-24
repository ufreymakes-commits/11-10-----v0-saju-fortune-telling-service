'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { CheckIcon, ShieldCheckIcon } from 'lucide-react'

interface CheckoutContentProps {
  submissionId: string
  name: string
}

export function CheckoutContent({ submissionId, name }: CheckoutContentProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paypalUrl, setPaypalUrl] = useState<string | null>(null)

  // Handle PayPal callback - called after user approves payment
  const handlePayPalCallback = async (token: string) => {
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: token })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Payment capture failed')
      }

      // Redirect to paid report page
      router.push(`/report/${data.submissionId}/paid`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment verification failed')
      setIsLoading(false)
    }
  }

  const handlePayPalCheckout = async () => {
    setIsLoading(true)
    setError(null)
    setPaypalUrl(null)
    
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      })
      
      const data = await response.json()
      
      console.log('[v0] PayPal create-order response:', data)
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create payment order')
      }
      
      if (!data.id) {
        throw new Error('No order ID received from PayPal')
      }
      
      // Store orderId in session for callback
      sessionStorage.setItem('paypal_order_id', data.id)
      
      // Redirect to PayPal
      if (data.approvalUrl) {
        console.log('[v0] Redirecting to PayPal:', data.approvalUrl)
        window.location.href = data.approvalUrl
      } else {
        throw new Error('No approval URL received from PayPal')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong'
      console.error('[v0] PayPal checkout error:', errorMsg, err)
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  // Check for PayPal callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    
    if (token) {
      handlePayPalCallback(token)
    }
  }, [])

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-6">
          <div className="border border-primary/50 rounded-full px-6 py-2 text-primary text-sm tracking-wider">
            Sajume
          </div>
        </Link>
        
        <div className="relative w-24 h-24 mx-auto mb-4 animate-float">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-2">
          Unlock Your Full Report
        </h1>
        <p className="text-foreground/70">
          {name}, your complete 99 facts await
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6 shadow-lg shadow-primary/5">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-4">Order Summary</h2>
        
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99facts.png-GQUor5lDB3UZjqnzWfMmGM6jWNHITE.jpeg"
              alt="99 Facts"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">99 Facts Birth Chart Report</h3>
            <p className="text-sm text-muted-foreground">Personalized Saju analysis</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground line-through text-sm">$19.99</p>
            <p className="text-lg font-bold text-secondary">$9.99</p>
          </div>
        </div>
        
        <div className="border-t border-border/30 pt-4 flex justify-between items-center">
          <span className="font-medium">Total</span>
          <span className="text-xl font-bold text-gradient">$9.99 USD</span>
        </div>
      </div>

      {/* What's Included */}
      <div className="bg-muted border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">What&apos;s Included</h2>
        <ul className="space-y-2">
          {[
            '99 personalized facts about your destiny',
            'Deep personality analysis',
            'Career and wealth insights',
            'Love and relationship guidance',
            'Future predictions',
            'Instant digital delivery'
          ].map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-secondary flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* PayPal Manual Link (shown if redirect is blocked) */}
      {paypalUrl && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-foreground mb-2">If the redirect didn&apos;t work, click the button below:</p>
          <a 
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#0070ba] hover:bg-[#003087] text-white px-6 py-2 rounded-lg font-semibold text-sm"
          >
            Open PayPal in New Tab
          </a>
        </div>
      )}

      {/* PayPal Button */}
      <Button
        onClick={handlePayPalCheckout}
        disabled={isLoading}
        className="w-full bg-[#0070ba] hover:bg-[#003087] text-white h-14 text-lg font-semibold rounded-lg flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <>
            <Spinner className="w-5 h-5" />
            Connecting to PayPal...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
            </svg>
            Pay with PayPal
          </>
        )}
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <ShieldCheckIcon className="w-4 h-4" />
        <span>Secure payment powered by PayPal</span>
      </div>

      {/* Back Link */}
      <div className="text-center mt-6">
        <Link 
          href={`/preview/${submissionId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to preview
        </Link>
      </div>

      {/* Dev Mode: Skip Payment */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 pt-6 border-t border-dashed border-gray-300">
          <p className="text-xs text-gray-400 text-center mb-2">Developer Mode</p>
          <Link href={`/report/${submissionId}`}>
            <Button
              variant="outline"
              className="w-full border-gray-300 text-gray-500 hover:bg-gray-100"
            >
              Skip Payment (Dev Only)
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
