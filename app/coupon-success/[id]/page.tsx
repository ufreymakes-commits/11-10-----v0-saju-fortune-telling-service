'use client'

import { useParams } from 'next/navigation'
import { ReportProgress, useReportGeneration } from '@/components/report-progress'
import { CheckCircleIcon } from 'lucide-react'

export default function CouponSuccessPage() {
  const params = useParams()
  const submissionId = params.id as string
  const { status, error, attempt, retry, checkNow } = useReportGeneration(submissionId)

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-secondary" />
          <h2 className="text-2xl font-bold text-gradient mb-2">Report Ready!</h2>
          <p className="text-sm text-muted-foreground">Redirecting to your full report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <ReportProgress key={attempt} error={error} onRetry={retry} onCheckAgain={checkNow} />
    </div>
  )
}
