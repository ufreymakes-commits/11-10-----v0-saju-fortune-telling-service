import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { PreviewContent } from '@/components/preview-content'
import { Spinner } from '@/components/ui/spinner'
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
  
  const title = data ? `${data.name}'s Birth Chart Preview - Sajume` : 'Preview - Sajume'
  return {
    title,
    description: 'Discover what your birth chart reveals about your destiny',
    openGraph: { ...sharedOpenGraph, title },
    twitter: { ...sharedTwitter, title },
  }
}

export default async function PreviewPage({ params }: PageProps) {
  const { id } = await params
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }
  
  const supabase = await createClient()
  
  // Check if submission exists and fetch cached free reports
  const [submissionResult, reportsResult] = await Promise.all([
    supabase.from('submissions').select('*').eq('id', id).single(),
    supabase.from('reports').select('section_key, facts, context_interpretation').eq('submission_id', id).eq('is_free', true)
  ])
  
  if (!submissionResult.data) {
    notFound()
  }
  
  const submission = submissionResult.data
  
  // Build cached data if available (for shared links)
  let cachedPreviewData = null
  if (reportsResult.data && reportsResult.data.length > 0) {
    // Combine all cached free facts
    const allFacts: any[] = []
    for (const row of reportsResult.data) {
      if (Array.isArray(row.facts)) {
        allFacts.push(...row.facts)
      }
    }
    
    if (allFacts.length > 0) {
      // Build the preview data from cache
      cachedPreviewData = {
        freeFacts: allFacts,
        teaserFacts: [],
        submission: {
          name: submission.name,
          birthDate: submission.birth_date ?? null,
          birthTime: submission.birth_time ?? null,
          birthCity: submission.birth_city ?? null,
          birthCountry: submission.birth_country ?? null,
          sajuData: submission.saju_data || {}
        }
      }
    }
  }
  
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Spinner className="w-8 h-8 mx-auto mb-4" />
              <p className="text-foreground/70">Reading your birth chart...</p>
            </div>
          </div>
        }>
          <PreviewContent submissionId={id} cachedData={cachedPreviewData} />
        </Suspense>
      </div>
    </main>
  )
}
