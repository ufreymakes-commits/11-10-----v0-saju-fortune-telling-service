'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { GumihoAnswer } from '@/components/gumiho-answer'
import Link from 'next/link'
import { YearSnapshot, YearSnapshotPending, type YearSnapshotData } from '@/components/year-snapshot'
import { focusYearFor } from '@/lib/report-year'

const SNAPSHOT_POLL_MS = 5000
const SNAPSHOT_POLL_LIMIT_MS = 3 * 60 * 1000

interface GumihoData {
  question_1: string
  question_2: string
  question_3: string
  answer_1: string
  answer_2: string
  answer_3: string
  submission: {
    name: string
  }
}

function AnswersContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const submissionId = params.id as string
  const questionId = searchParams.get('questionId')

  const [data, setData] = useState<GumihoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Year Snapshot ($7.99 add-on only). null status = not an add-on order (or older order): render nothing.
  const [snapshot, setSnapshot] = useState<YearSnapshotData | null>(null)
  const [snapshotStatus, setSnapshotStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      if (!questionId) {
        setError('Invalid question ID')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Get questions and answers
      const { data: gumihoQuestion, error: fetchError } = await supabase
        .from('gumiho_questions')
        .select('question_1, question_2, question_3, answer_1, answer_2, answer_3, submission_id')
        .eq('id', questionId)
        .single()

      if (fetchError || !gumihoQuestion) {
        setError('Answers not found')
        setLoading(false)
        return
      }

      // If answers not generated yet, try to generate
      if (!gumihoQuestion.answer_1) {
        try {
          const res = await fetch('/api/gumiho/generate-answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gumihoQuestionId: questionId })
          })

          if (!res.ok) {
            setError('Failed to generate answers. Please try refreshing the page.')
            setLoading(false)
            return
          }

          // 202 means another request is already generating; keep the loading screen and poll the DB.
          const genData = res.status === 202 ? null : await res.json().catch(() => null)
          if (genData?.answers?.answer_1) {
            gumihoQuestion.answer_1 = genData.answers.answer_1
            gumihoQuestion.answer_2 = genData.answers.answer_2
            gumihoQuestion.answer_3 = genData.answers.answer_3
          } else {
            const deadline = Date.now() + 6 * 60 * 1000
            while (!cancelled && Date.now() < deadline && !gumihoQuestion.answer_1) {
              await new Promise((resolve) => setTimeout(resolve, 5000))
              if (cancelled) return
              const { data: row } = await supabase
                .from('gumiho_questions')
                .select('answer_1, answer_2, answer_3')
                .eq('id', questionId)
                .single()
              if (row?.answer_1) {
                gumihoQuestion.answer_1 = row.answer_1
                gumihoQuestion.answer_2 = row.answer_2
                gumihoQuestion.answer_3 = row.answer_3
              }
            }
            if (cancelled) return
            if (!gumihoQuestion.answer_1) {
              setError('Failed to generate answers. Please try refreshing the page.')
              setLoading(false)
              return
            }
          }
        } catch {
          setError('Failed to generate answers')
          setLoading(false)
          return
        }
      }

      // Get submission name
      const { data: submission } = await supabase
        .from('submissions')
        .select('name')
        .eq('id', gumihoQuestion.submission_id)
        .single()

      setData({
        ...gumihoQuestion,
        submission: submission || { name: 'User' }
      })
      setLoading(false)

      // Separate query so a missing column (migration not run yet) never breaks the answers.
      const { data: snap } = await supabase
        .from('gumiho_questions')
        .select('year_snapshot, year_snapshot_status')
        .eq('id', questionId)
        .maybeSingle()
      if (!cancelled && snap) {
        setSnapshot((snap.year_snapshot as YearSnapshotData) ?? null)
        setSnapshotStatus(snap.year_snapshot_status ?? null)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [questionId])

  // Poll while the snapshot is being written (it is generated right after the answers).
  useEffect(() => {
    if (snapshotStatus !== 'generating' || !questionId) return
    const supabase = createClient()
    const started = Date.now()
    const interval = setInterval(async () => {
      if (Date.now() - started > SNAPSHOT_POLL_LIMIT_MS) {
        clearInterval(interval)
        setSnapshotStatus('timeout')
        return
      }
      const { data: snap } = await supabase
        .from('gumiho_questions')
        .select('year_snapshot, year_snapshot_status')
        .eq('id', questionId)
        .maybeSingle()
      if (snap && snap.year_snapshot_status !== 'generating') {
        clearInterval(interval)
        setSnapshot((snap.year_snapshot as YearSnapshotData) ?? null)
        setSnapshotStatus(snap.year_snapshot_status ?? null)
      }
    }, SNAPSHOT_POLL_MS)
    return () => clearInterval(interval)
  }, [snapshotStatus, questionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading your answers...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error || 'Something went wrong'}</p>
        <Link href={`/paid-report/${submissionId}`}>
          <Button>Back to Report</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient mb-2">The Gumiho Has Spoken</h1>
          <p className="text-sm text-muted-foreground">
            {snapshotStatus
              ? `Your 3 Questions Answered + Your ${snapshot?.year ?? focusYearFor()} Snapshot for ${data.submission.name}`
              : `Your 3 Questions Answered for ${data.submission.name}`}
          </p>
          {snapshotStatus && snapshotStatus !== 'failed' && snapshotStatus !== 'timeout' && (
            <a href="#year-snapshot" className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
              Jump to your {snapshot?.year ?? focusYearFor()} Snapshot ↓
            </a>
          )}
        </div>

        {/* Answers */}
        <div className="space-y-6">
          {/* Q&A 1 */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="mb-3">
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Question 1</span>
              <p className="text-foreground font-medium mt-1">{data.question_1}</p>
            </div>
            <div className="border-t border-border pt-3">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gumiho&apos;s Answer</span>
              <GumihoAnswer text={data.answer_1} />
            </div>
          </div>

          {/* Q&A 2 */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="mb-3">
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Question 2</span>
              <p className="text-foreground font-medium mt-1">{data.question_2}</p>
            </div>
            <div className="border-t border-border pt-3">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gumiho&apos;s Answer</span>
              <GumihoAnswer text={data.answer_2} />
            </div>
          </div>

          {/* Q&A 3 */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="mb-3">
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Question 3</span>
              <p className="text-foreground font-medium mt-1">{data.question_3}</p>
            </div>
            <div className="border-t border-border pt-3">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gumiho&apos;s Answer</span>
              <GumihoAnswer text={data.answer_3} />
            </div>
          </div>
        </div>

        {/* Year Snapshot ($7.99 add-on only) */}
        {snapshotStatus === 'done' && snapshot ? (
          <div id="year-snapshot" className="mt-6 scroll-mt-6">
            <YearSnapshot data={snapshot} questions={[data.question_1, data.question_2, data.question_3]} />
          </div>
        ) : snapshotStatus === 'generating' ? (
          <div id="year-snapshot" className="mt-6 scroll-mt-6">
            <YearSnapshotPending year={focusYearFor()} />
          </div>
        ) : null}

        {/* Back to Report Button */}
        <div className="mt-8 text-center">
          <Link href={`/paid-report/${submissionId}`}>
            <Button variant="outline">Back to 99 Facts Report</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AskGumihoAnswersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AnswersContent />
    </Suspense>
  )
}
