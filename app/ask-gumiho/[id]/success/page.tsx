'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'

function SuccessContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const submissionId = params.id as string
  const questionId = searchParams.get('questionId')
  const token = searchParams.get('token') // PayPal order ID

  const [status, setStatus] = useState<'capturing' | 'generating' | 'success' | 'error'>('capturing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function processPayment() {
      if (!token || !questionId) {
        setError('Invalid payment session')
        setStatus('error')
        return
      }

      try {
        // 1. Capture the PayPal payment
        setStatus('capturing')
        const captureRes = await fetch('/api/gumiho/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: token,
            gumihoQuestionId: questionId
          })
        })

        const captureData = await captureRes.json()

        if (!captureRes.ok) {
          setError(captureData.error || 'Payment failed')
          setStatus('error')
          return
        }

        // 2. Generate answers - fire and forget (polling will catch completion)
        setStatus('generating')
        fetch('/api/gumiho/generate-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gumihoQuestionId: questionId
          })
        }).then(async (res) => {
          if (res.ok) {
            // Generation completed within timeout - redirect immediately
            setStatus('success')
            setTimeout(() => {
              router.push(`/ask-gumiho/${submissionId}/answers?questionId=${questionId}`)
            }, 1500)
          }
          // If not ok (e.g. 500 timeout), polling below will catch the DB write
        }).catch(() => {
          // Network error - polling below will handle it
        })

      } catch {
        setError('Something went wrong. Please contact support.')
        setStatus('error')
      }
    }

    processPayment()
  }, [token, questionId, submissionId, router])

  // Poll DB every 5 seconds while generating - catches cases where Gemini
  // completes but the API timed out before returning the response
  useEffect(() => {
    if (status !== 'generating') return

    const supabase = createClient()
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('gumiho_questions')
          .select('answer_1, answer_2, answer_3')
          .eq('id', questionId)
          .single()

        if (data?.answer_1 && data?.answer_2 && data?.answer_3) {
          clearInterval(interval)
          setStatus('success')
          setTimeout(() => {
            router.push(`/ask-gumiho/${submissionId}/answers?questionId=${questionId}`)
          }, 1500)
        }
      } catch {
        // keep polling
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [status, questionId, submissionId, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === 'capturing' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Processing Payment...</h1>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your payment</p>
          </>
        )}

        {status === 'generating' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">The Gumiho is Answering...</h1>
            <p className="text-sm text-muted-foreground">Consulting the ancient wisdom of Saju for your personalized answers</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Answers Ready!</h1>
            <p className="text-sm text-muted-foreground">Redirecting you to your personalized answers...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Something Went Wrong</h1>
            <p className="text-sm text-destructive mb-4">{error}</p>
            <p className="text-xs text-muted-foreground">
              If you were charged, please contact support with your question ID: {questionId}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AskGumihoSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
