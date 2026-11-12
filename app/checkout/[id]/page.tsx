import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { CheckoutContent } from '@/components/checkout-content'

interface PageProps {
  params: Promise<{ id: string }>
}

import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

export const metadata = {
  title: 'Checkout - Sajume',
  description: 'Complete your purchase to unlock all 99 facts about your birth chart',
  openGraph: { ...sharedOpenGraph, title: 'Checkout - Sajume' },
  twitter: { ...sharedTwitter, title: 'Checkout - Sajume' },
}

export default async function CheckoutPage({ params }: PageProps) {
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
  
  // Check if already paid
  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('submission_id', id)
    .eq('status', 'completed')
    .limit(1)
    .maybeSingle()
  
  if (payment) {
    redirect(`/report/${id}/paid`)
  }
  
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10">
        <CheckoutContent submissionId={id} name={submission.name} />
      </div>
    </main>
  )
}
