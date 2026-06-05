'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AskGumihoCheckoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const submissionId = params.id as string
  const questionId = searchParams.get('questionId')

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<{
    question_1: string
    question_2: string
    question_3: string
  } | null>(null)
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  const handleCouponSubmit = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/gumiho/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode.trim(), 
          gumihoQuestionId: questionId,
          submissionId 
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setCouponError(data.error || 'Invalid coupon')
        setCouponLoading(false)
        return
      }
      router.push(data.redirectPath)
    } catch {
      setCouponError('Something went wrong')
      setCouponLoading(false)
    }
  }

  useEffect(() => {
    async function fetchData() {
      if (!questionId) {
        setError('Invalid question ID')
        setLoading(false)
        return
      }

      const supabase = createClient()

      const { data: gumihoQuestion, error: fetchError } = await supabase
        .from('gumiho_questions')
        .select('question_1, question_2, question_3')
        .eq('id', questionId)
        .single()

      if (fetchError || !gumihoQuestion) {
        setError('Questions not found')
        setLoading(false)
        return
      }

      setQuestions(gumihoQuestion)
      setLoading(false)
    }

    fetchData()
  }, [questionId])

  const handlePayPal = async () => {
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch('/api/gumiho/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gumihoQuestionId: questionId,
          submissionId
        })
      })

      const data = await res.json()

      if (!res.ok || !data.approvalUrl) {
        setError(data.error || 'Failed to create payment')
        setProcessing(false)
        return
      }

      // Redirect to PayPal
      window.location.href = data.approvalUrl
    } catch {
      setError('Something went wrong. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !questions) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
        <Link href={`/ask-gumiho/${submissionId}`}>
          <Button>Go Back</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient mb-2">Complete Your Purchase</h1>
          <p className="text-sm text-muted-foreground">Ask the Gumiho 1:1 - $9.99</p>
        </div>

        {/* Questions Review */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Your Questions:</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Question 1:</p>
              <p className="text-sm text-foreground">{questions?.question_1}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Question 2:</p>
              <p className="text-sm text-foreground">{questions?.question_2}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Question 3:</p>
              <p className="text-sm text-foreground">{questions?.question_3}</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}

        {/* PayPal Button */}
        <Button
          onClick={handlePayPal}
          disabled={processing}
          className="w-full h-12 bg-[#0070ba] text-white hover:bg-[#005ea6] font-semibold"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting to PayPal...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.642h6.153c2.042 0 3.474.405 4.256 1.208.784.8 1.035 1.934.748 3.37l-.022.112h.02a3.606 3.606 0 0 1-.004.133l-.015.12-.025.127c-.002.01-.003.02-.006.03l-.012.05-.01.043-.014.054c-.34 1.47-1.162 2.472-2.386 2.98-.006.002-.012.005-.018.008l-.014.006c-.07.03-.143.058-.217.085l-.086.03c-.068.023-.138.044-.209.064l-.078.022c-.082.022-.166.042-.252.06l-.056.012c-.109.023-.222.044-.337.063l-.038.006a6.933 6.933 0 0 1-.467.057l-.052.004c-.103.009-.209.016-.316.021l-.073.003a7.93 7.93 0 0 1-.288.008h-.08l-.152.001h-2.06l-.048.32-1.026 6.499-.035.215H7.076v.001z"/>
              </svg>
              Pay with PayPal - $9.99
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Secure payment powered by PayPal
        </p>

        {/* Use Credit Card Button */}
        <Button 
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.alert("You can use your credit card with 'Pay with a card' in the PayPal window. You do not need a PayPal account :)")
            }
          }}
          className="w-full max-w-xs mx-auto bg-[#FFC439] text-black hover:bg-[#f5b830] h-11 text-sm font-semibold rounded-md shadow-lg mt-3 flex"
        >
          Use Credit Card
        </Button>

        {/* Credit Card Logos */}
        <div className="flex justify-center mt-3">
          <Image
            src="/images/credit-cards.png"
            alt="Visa, Mastercard, American Express"
            width={120}
            height={20}
            className="opacity-60"
          />
        </div>

        {/* Coupon code toggle */}
        <div className="mt-4">
          <button
            onClick={() => setShowCoupon(v => !v)}
            className="w-full text-center text-[11px] text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
          >
            {showCoupon ? 'Hide coupon code' : 'Have a coupon code?'}
          </button>
          {showCoupon && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCouponSubmit()}
                placeholder="Enter coupon code"
                className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                onClick={handleCouponSubmit}
                disabled={couponLoading}
                className="px-4 py-2 bg-primary/20 border border-primary/30 text-foreground text-xs font-medium rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && (
            <p className="mt-1.5 text-center text-[11px] text-red-400">{couponError}</p>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href={`/ask-gumiho/${submissionId}`} className="text-sm text-primary hover:underline">
            Edit my questions (Type the whole again)
          </Link>
        </div>
      </div>
    </div>
  )
}
