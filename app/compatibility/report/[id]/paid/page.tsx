import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { CompatibilityReportContent } from '@/components/compatibility-report-content'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('compatibility_submissions')
    .select('person_a_name, person_b_name')
    .eq('id', id)
    .single()
  
  const title = data ? `${data.person_a_name} & ${data.person_b_name} - Saju Compatibility` : 'Compatibility Report - Sajume'
  return {
    title,
    description: 'Your complete Saju compatibility analysis report',
    openGraph: { ...sharedOpenGraph, title },
    twitter: { ...sharedTwitter, title },
  }
}

export default async function CompatibilityPaidReportPage({ params }: PageProps) {
  const { id } = await params
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }
  
  const supabase = await createClient()
  
  // Fetch submission, payment, and report data in parallel
  // section_key='compatibility_full' is the only valid paid report
  const [submissionResult, paymentResult, reportResult] = await Promise.all([
    supabase
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
      .single(),
    supabase
      .from('compatibility_payments')
      .select('*')
      .eq('submission_id', id)
      .eq('status', 'completed')
      .single(),
    supabase
      .from('compatibility_reports')
      .select('*')
      .eq('submission_id', id)
      .eq('section_key', 'compatibility_full')
      .single()
  ])
  
  if (!submissionResult.data) {
    notFound()
  }
  
  // Payment must be completed to view paid report
  if (!paymentResult.data) {
    redirect(`/compatibility/checkout/${id}`)
  }
  
  // report will be null if not generated yet - client component will handle generation
  const report = reportResult.data
  const submission = submissionResult.data
  
  // Extract day master and relationship type
  const sajuDataA = submission.person_a_saju_data as any || {}
  const sajuDataB = submission.person_b_saju_data as any || {}
  
  const dayMasterA = (sajuDataA.fourPillars?.day?.stem || '') + (sajuDataA.fourPillars?.day?.branch || '')
  const dayMasterB = (sajuDataB.fourPillars?.day?.stem || '') + (sajuDataB.fourPillars?.day?.branch || '')
  
  // Extract relationship type from last section (섹션 7)
  const sections = Array.isArray(report?.facts) ? report.facts : []
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
