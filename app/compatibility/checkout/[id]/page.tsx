import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompatibilityCheckoutContent } from '@/components/compatibility-checkout-content'
import { StarsBackground } from '@/components/stars-background'

export default async function CompatibilityCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: submission, error } = await supabase
    .from('compatibility_submissions')
    .select('id, person_a_name, person_b_name')
    .eq('id', id)
    .single()

  if (error || !submission) notFound()

  return (
    <main className="min-h-screen bg-[#0f0a14] relative overflow-x-hidden pt-10 pb-20">
      <StarsBackground />

      <div className="relative z-10 max-w-md mx-auto px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium px-3 py-1.5 rounded-full">
            Almost there
          </div>
          <h1 className="text-2xl font-bold text-white">Complete Your Order</h1>
          <p className="text-white/50 text-sm">One-time payment · Instant delivery</p>
        </div>

        <CompatibilityCheckoutContent
          submissionId={submission.id}
          personAName={submission.person_a_name}
          personBName={submission.person_b_name}
        />
      </div>
    </main>
  )
}
