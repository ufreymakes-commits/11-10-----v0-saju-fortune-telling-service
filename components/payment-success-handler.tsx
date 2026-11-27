'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { ReportProgress, useReportGeneration } from '@/components/report-progress'
import { CheckCircleIcon } from 'lucide-react'
import { PRICE_USD } from '@/lib/payments/prices'
import { eventIdFor, fireOnce, ttTrack, ttIdentifySubmission } from '@/lib/analytics/tiktok'

interface PaymentSuccessHandlerProps {
  submissionId: string
  orderId?: string
}

type Phase = 'processing' | 'confirming' | 'generating' | 'timeout' | 'error' | 'not_approved'
type PaymentState = 'completed' | 'pending' | 'failed' | 'none'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 3 * 60 * 1000

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// The page polls and can be reloaded, so the once-per-browser guard keeps purchases from being counted twice.
function trackPaymentCompleted(submissionId: string) {
  fireOnce(`pay:${submissionId}`, () =>
    ttTrack(
      'CompletePayment',
      {
        contents: [{ content_id: '99-facts', content_type: 'product', content_name: '99 Facts Report' }],
        value: Number(PRICE_USD),
        currency: 'USD',
      },
      eventIdFor(submissionId, 'CompletePayment'),
    ),
  )
}

export function PaymentSuccessHandler({ submissionId, orderId }: PaymentSuccessHandlerProps) {
  useEffect(() => {
    void ttIdentifySubmission(submissionId)
  }, [submissionId])
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('processing')
  const [error, setError] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  async function fetchPaymentState(): Promise<PaymentState> {
    try {
      const res = await fetch(`/api/paypal/payment-status?submissionId=${encodeURIComponent(submissionId)}`, { cache: 'no-store' })
      const data = await res.json()
      return (data.state as PaymentState) ?? 'pending'
    } catch {
      return 'pending'
    }
  }

  useEffect(() => {
    cancelledRef.current = false

    async function pollUntilSettled() {
      setPhase('confirming')
      const startedAt = Date.now()
      while (!cancelledRef.current && Date.now() - startedAt < POLL_TIMEOUT_MS) {
        const state = await fetchPaymentState()
        if (cancelledRef.current) return
        if (state === 'completed') {
          trackPaymentCompleted(submissionId)
          setPhase('generating')
          return
        }
        if (state === 'failed' || state === 'none') {
          setError('We could not confirm this payment.')
          setPhase('error')
          return
        }
        await wait(POLL_INTERVAL_MS)
      }
      if (!cancelledRef.current) setPhase('timeout')
    }

    async function run() {
      if (!orderId) {
        const state = await fetchPaymentState()
        if (cancelledRef.current) return
        if (state === 'completed') setPhase('generating')
        else if (state === 'pending') await pollUntilSettled()
        else {
          setError('Missing payment information')
          setPhase('error')
        }
        return
      }

      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })

        if (cancelledRef.current) return

        if (res.status === 202) {
          await pollUntilSettled()
          return
        }

        const data = await res.json().catch(() => ({}))
        if (data.state === 'action_required' && typeof data.url === 'string' && data.url.startsWith('https://')) {
          // Finish the card verification at PayPal; PayPal sends the buyer back here afterwards.
          window.location.href = data.url
          return
        }
        if (res.status === 409 || data.state === 'not_approved') {
          setPhase('not_approved')
          return
        }
        if (res.ok && data.success) {
          trackPaymentCompleted(submissionId)
          setPhase('generating')
          return
        }

        setError(data.error || 'We could not confirm this payment.')
        setPhase('error')
      } catch {
        // Network trouble does not mean the payment failed: keep checking quietly.
        if (!cancelledRef.current) await pollUntilSettled()
      }
    }

    run()
    return () => {
      cancelledRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, submissionId])

  const generation = useReportGeneration(submissionId, phase === 'generating')

  async function handleTryAgain() {
    const state = await fetchPaymentState()
    router.push(state === 'completed' ? `/report/${submissionId}/paid` : `/checkout/${submissionId}`)
  }

  if (phase === 'processing' || phase === 'confirming') {
    return (
      <div className="text-center max-w-md">
        <div className="relative w-24 h-24 mx-auto mb-4 animate-float">
          <Image src="/images/mascot-main.png" alt="Sajume mascot" fill className="object-contain" />
        </div>
        <Spinner className="w-8 h-8 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {phase === 'processing' ? 'Processing your payment...' : 'Confirming your payment...'}
        </h2>
        <p className="text-muted-foreground">
          {phase === 'processing'
            ? 'Please wait while we confirm your order'
            : 'PayPal is still confirming your payment. This can take a minute, please keep this page open.'}
        </p>
      </div>
    )
  }

  if (phase === 'generating' && generation.status !== 'success') {
    return (
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-secondary" />
        <h2 className="text-2xl font-bold text-gradient mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-8">Now generating your personalized report...</p>
        <ReportProgress
  key={generation.attempt}
  emailSent={generation.emailSent}
  error={generation.error}
          onRetry={generation.retry}
          onCheckAgain={generation.checkNow}
        />
      </div>
    )
  }

  if (generation.status === 'success') {
    return (
      <div className="text-center">
        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-secondary" />
        <h2 className="text-2xl font-bold text-gradient mb-2">Payment Successful!</h2>
        <p className="text-foreground/70 mb-4">Thank you for your purchase</p>
        <p className="text-sm text-muted-foreground">Redirecting to your full report...</p>
      </div>
    )
  }

  if (phase === 'not_approved') {
    return (
      <div className="text-center max-w-md">
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">Your payment didn&apos;t go through</h2>
          <p className="text-foreground/70 text-sm mb-3">
            PayPal did not complete this payment, so <span className="font-semibold">you have not been charged</span>.
          </p>
          <ul className="text-left text-sm text-foreground/70 space-y-1 list-disc pl-5">
            <li>Try again and choose &quot;Pay with Debit or Credit Card&quot;, or log in to PayPal.</li>
            <li>If you opened this from TikTok or Instagram, open the page in Safari or Chrome and try again.</li>
            <li>If your card asks for a verification code, keep the page open until it finishes.</li>
          </ul>
        </div>
        <Button
          onClick={() => router.push(`/checkout/${submissionId}`)}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Try Again
        </Button>
        <p className="text-foreground/50 text-xs mt-3">
          Still stuck? Reach us on the{' '}
          <Link href="/policies/customer-service" className="underline">
            customer service page
          </Link>
          .
        </p>
      </div>
    )
  }

  if (phase === 'timeout') {
    return (
      <div className="text-center max-w-md">
        <div className="bg-card border border-border rounded-xl p-6 mb-4">
          <h2 className="text-xl font-semibold mb-2">Your payment is still being confirmed</h2>
          <p className="text-foreground/70 text-sm mb-2">
            Nothing is lost. As soon as PayPal confirms, we will email you a link to your report, and you can also find it
            any time on the Find My Report page.
          </p>
          <p className="text-foreground/50 text-xs">
            Need help? Visit our{' '}
            <Link href="/policies/customer-service" className="underline">
              customer service page
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleTryAgain} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Check again
          </Button>
          <Link href="/my-report" className="text-sm text-muted-foreground hover:text-foreground">
            Find my report
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center max-w-md">
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">We could not confirm your payment</h2>
        <p className="text-foreground/70 text-sm mb-2">{error}</p>
        <p className="text-foreground/50 text-xs">
          If you were charged, you will get an email with your report link once PayPal confirms. You can also reach us on the{' '}
          <Link href="/policies/customer-service" className="underline">
            customer service page
          </Link>
          .
        </p>
      </div>
      <Button onClick={handleTryAgain} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
        Try Again
      </Button>
    </div>
  )
}
