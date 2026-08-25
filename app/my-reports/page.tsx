import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

export const metadata: Metadata = {
  title: 'My Reports | Sajume',
  description: 'View all your paid Saju reading reports.',
  openGraph: { ...sharedOpenGraph, title: 'My Reports | Sajume' },
  twitter: { ...sharedTwitter, title: 'My Reports | Sajume' },
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  completed_at: string | null
  created_at: string
  submission_id: string
  submissions: {
    id: string
    name: string
    birth_date: string
    gender: string
    created_at: string
  } | null
}

export default async function MyReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/my-reports')
  }

  // Fetch completed payments linked to this user, with submission data
  const { data: payments, error } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      currency,
      status,
      completed_at,
      created_at,
      submission_id,
      submissions (
        id,
        name,
        birth_date,
        gender,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  const reportList = (payments ?? []) as Payment[]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="px-5 pt-14 pb-6 border-b border-white/10">
        <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1 mb-4">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        <h1 className="text-xl font-bold text-white">My Reports</h1>
        <p className="text-sm text-white/50 mt-1">{user.email}</p>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4 text-sm text-destructive">
            Failed to load reports. Please try again.
          </div>
        )}

        {reportList.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white/70 mb-2">No reports yet</h2>
            <p className="text-sm text-white/40 mb-6 max-w-xs leading-relaxed">
              Reports purchased with this account will appear here. If you paid without signing in, link your payment below.
            </p>
            <Link
              href="/start"
              className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Get a Reading
            </Link>
          </div>
        ) : (
          /* Report cards */
          <div className="space-y-3">
            <p className="text-xs text-white/40 mb-4">{reportList.length} report{reportList.length !== 1 ? 's' : ''} found</p>
            {reportList.map((payment) => {
              const sub = payment.submissions
              const date = new Date(payment.completed_at ?? payment.created_at)
              const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
              const price = `$${Number(payment.amount).toFixed(2)}`

              return (
                <Link
                  key={payment.id}
                  href={`/report/${payment.submission_id}/paid`}
                  className="group block bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {sub?.name ?? 'Saju Reading'}
                        </h3>
                        <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Paid
                        </span>
                      </div>
                      {sub?.birth_date && (
                        <p className="text-xs text-white/50">
                          Born: {new Date(sub.birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                      <p className="text-xs text-white/35 mt-1">{formattedDate}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-white/80">{price}</span>
                      <svg className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/50 leading-relaxed">
            <span className="text-white/70 font-medium">Paid but not seeing your report?</span>
            {' '}Reports are linked to your account at the time of purchase. If you paid before signing in, please contact us and we will manually link it.
          </p>
        </div>
      </div>
    </div>
  )
}
