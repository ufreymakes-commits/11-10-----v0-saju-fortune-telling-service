import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompatibilityReportContent } from '@/components/compatibility-report-content'
import { CompatibilityReportLoader } from '@/components/compatibility-report-loader'
import { StarsBackground } from '@/components/stars-background'

export default async function CompatibilityReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch submission (including saju data for day master extraction)
  const { data: submission, error: subError } = await supabase
    .from('compatibility_submissions')
    .select(`
      id,
      person_a_name,
      person_b_name,
      person_a_birth_date,
      person_b_birth_date,
      person_a_saju_data,
      person_b_saju_data
    `)
    .eq('id', id)
    .single()

  if (subError || !submission) notFound()

  // Check payment
  const { data: payment } = await supabase
    .from('compatibility_payments')
    .select('status')
    .eq('submission_id', id)
    .eq('status', 'completed')
    .single()

  if (!payment) notFound()

  // Fetch report
  const { data: report } = await supabase
    .from('compatibility_reports')
    .select('facts')
    .eq('submission_id', id)
    .single()

  // If report is not ready yet, show loader (which will trigger generation)
  if (!report?.facts) {
    return (
      <main className="min-h-screen bg-[#0f0a14] relative">
        <StarsBackground />
        <CompatibilityReportLoader submissionId={id} />
      </main>
    )
  }

  const sections = Array.isArray(report.facts) ? report.facts : []

  // Extract day master and relationship type
  const sajuDataA = submission.person_a_saju_data as any || {}
  const sajuDataB = submission.person_b_saju_data as any || {}
  
  const dayMasterA = (sajuDataA.fourPillars?.day?.stem || '') + (sajuDataA.fourPillars?.day?.branch || '')
  const dayMasterB = (sajuDataB.fourPillars?.day?.stem || '') + (sajuDataB.fourPillars?.day?.branch || '')
  
  // Extract relationship type from last section (섹션 7)
  const lastSection = sections[sections.length - 1] || {}
  const relationshipType = lastSection.title || ''

  return (
    <main className="min-h-screen bg-[#0f0a14] relative">
      <StarsBackground />
      <CompatibilityReportContent
        personAName={submission.person_a_name}
        personBName={submission.person_b_name}
        personABirthDate={submission.person_a_birth_date}
        personBBirthDate={submission.person_b_birth_date}
        personADayMaster={dayMasterA}
        personBDayMaster={dayMasterB}
        relationshipType={relationshipType}
        firstSectionTitle={sections[0]?.title || ''}
        sections={sections}
      />
    </main>
  )
}
