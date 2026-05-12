import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { CompatibilityPaymentSuccessHandler } from '@/components/compatibility-payment-success-handler'
import { Spinner } from '@/components/ui/spinner'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; PayerID?: string }>
}

export const metadata = {
  title: 'Payment Processing - Sajume Compatibility',
  description: 'Processing your payment...',
}

export default async function CompatibilityCheckoutSuccessPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { token } = await searchParams
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }
  
  const supabase = await createClient()
  
  // Check if submission exists
  const { data: submission } = await supabase
    .from('compatibility_submissions')
    .select('id')
    .eq('id', id)
    .single()
  
  if (!submission) {
    notFound()
  }
  
  return (
    <main className="min-h-screen bg-[#0f0a14] relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <Suspense fallback={
          <div className="text-center">
            <Spinner className="w-8 h-8 mx-auto mb-4" />
            <p className="text-white/70">Processing payment...</p>
          </div>
        }>
          <CompatibilityPaymentSuccessHandler submissionId={id} orderId={token} />
        </Suspense>
      </div>
    </main>
  )
}
