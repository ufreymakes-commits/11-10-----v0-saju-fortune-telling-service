import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { ReportContent } from '@/components/report-content'
import type { Submission, Fact } from '@/lib/types'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('submissions')
    .select('name')
    .eq('id', id)
    .single()
  
  const title = data ? `${data.name}'s 99 Facts - Sajume` : 'Your Report - Sajume'
  return {
    title,
    description: 'Your complete 99 facts birth chart report',
    openGraph: { ...sharedOpenGraph, title },
    twitter: { ...sharedTwitter, title },
  }
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }
  
  const supabase = await createClient()
  
  // Fetch submission, payment, and all cached report sections (both free and paid) in parallel
  const [submissionResult, paymentResult, reportsResult] = await Promise.all([
    supabase.from('submissions').select('*').eq('id', id).single(),
    supabase.from('payments').select('status').eq('submission_id', id).eq('status', 'completed').single(),
    supabase.from('reports').select('section_key, facts, is_free').eq('submission_id', id)
  ])
  
  if (!submissionResult.data) {
    notFound()
  }
  
  // Check if this is a paid report request (URL = /report/[id] and payment exists)
  const hasPaidAccess = !!paymentResult.data
  
  // Build pre-loaded facts map — if all 4 sections exist, render immediately without API calls
  const cachedSections: Record<string, Fact[]> = {}
  if (reportsResult.data) {
    for (const row of reportsResult.data) {
      if (row.section_key && Array.isArray(row.facts)) {
        // For free reports: load free sections (is_free = true)
        // For paid reports: load paid sections (is_free = false)
        if (hasPaidAccess && !row.is_free) {
          cachedSections[row.section_key] = row.facts as Fact[]
        } else if (!hasPaidAccess && row.is_free) {
          cachedSections[row.section_key] = row.facts as Fact[]
        }
      }
    }
  }
  
  // If no payment and has no free cached sections, redirect to free report
  if (!hasPaidAccess && Object.keys(cachedSections).length === 0) {
    // User can view the page but will need to generate on client
  }
  
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10">
        <ReportContent 
          submission={submissionResult.data as Submission}
          cachedSections={cachedSections}
        />
      </div>
    </main>
  )
}
