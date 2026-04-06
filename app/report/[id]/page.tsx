import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { ReportContent } from '@/components/report-content'
import type { Submission } from '@/lib/types'

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
    title: data ? `${data.name}'s 99 Facts - Sajume` : 'Your Report - Sajume',
    description: 'Your complete 99 facts birth chart report'
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
  
  // Check if submission exists
  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (!submission) {
    notFound()
  }
  
  // Check if payment is completed
  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('submission_id', id)
    .eq('status', 'completed')
    .single()
  
  if (!payment) {
    redirect(`/checkout/${id}`)
  }
  
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10">
        <ReportContent submission={submission as Submission} />
      </div>
    </main>
  )
}
