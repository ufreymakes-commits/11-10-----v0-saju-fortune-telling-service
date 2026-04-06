import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { PreviewContent } from '@/components/preview-content'
import { Spinner } from '@/components/ui/spinner'

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
  
  return {
    title: data ? `${data.name}'s Birth Chart Preview - Sajume` : 'Preview - Sajume',
    description: 'Discover what your birth chart reveals about your destiny'
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
  
  // Check if submission exists
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, name')
    .eq('id', id)
    .single()
  
  if (!submission) {
    notFound()
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
          <PreviewContent submissionId={id} />
        </Suspense>
      </div>
    </main>
  )
}
