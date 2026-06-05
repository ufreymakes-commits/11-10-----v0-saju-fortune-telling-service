'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AskGumihoPage() {
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<{
    name: string
    birth_date: string
    birth_time: string | null
    birth_country: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [question1, setQuestion1] = useState('')
  const [question2, setQuestion2] = useState('')
  const [question3, setQuestion3] = useState('')

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Verify submission exists
      const { data: sub, error: subError } = await supabase
        .from('submissions')
        .select('name, birth_date, birth_time, birth_country')
        .eq('id', submissionId)
        .single()

      if (subError || !sub) {
        setError('Submission not found')
        setLoading(false)
        return
      }

      // Verify paid report exists
      const { data: paidReport } = await supabase
        .from('reports')
        .select('id')
        .eq('submission_id', submissionId)
        .eq('section_key', 'paid_full')
        .single()

      if (!paidReport) {
        setError('99 Facts report required to use this feature')
        setLoading(false)
        return
      }

      setSubmission(sub)
      setLoading(false)
    }

    fetchData()
  }, [submissionId])

  const handleSubmit = async () => {
    if (!question1.trim() || !question2.trim() || !question3.trim()) {
      setError('Please fill in all 3 questions')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/gumiho/submit-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          question1: question1.trim(),
          question2: question2.trim(),
          question3: question3.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit questions')
        setSubmitting(false)
        return
      }

      // Redirect to checkout
      router.push(`/ask-gumiho/${submissionId}/checkout?questionId=${data.gumihoQuestionId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !submission) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient mb-2">Ask the Gumiho 1:1</h1>
          <p className="text-sm text-muted-foreground">Your 3 Burning Questions Answered</p>
        </div>

        {/* Verify Info Card */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-2 text-center">Is this your birth info?</p>
          <div className="text-center">
            <p className="font-semibold text-foreground">{submission?.name}</p>
            <p className="text-sm text-muted-foreground">
              {submission?.birth_date}
              {submission?.birth_time && `, ${submission.birth_time}`}
              {submission?.birth_country && `, ${submission.birth_country}`}
            </p>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground text-center">
            Ask the Gumiho 3 Questions
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Question 1</label>
              <Textarea
                placeholder="What would you like to know about your destiny?"
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{question1.length}/500</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Question 2</label>
              <Textarea
                placeholder="Ask about career, relationships, or life path..."
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{question2.length}/500</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Question 3</label>
              <Textarea
                placeholder="What guidance do you seek from the nine-tailed fox?"
                value={question3}
                onChange={(e) => setQuestion3(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{question3.length}/500</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !question1.trim() || !question2.trim() || !question3.trim()}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Ask the Gumiho - $9.99'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          You&apos;ll be redirected to PayPal to complete your purchase
        </p>
      </div>
    </div>
  )
}
