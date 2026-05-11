import type { Metadata } from 'next'
import { CompatibilityForm } from '@/components/compatibility-form'
import { StarsBackground } from '@/components/stars-background'

export const metadata: Metadata = {
  title: 'Saju Compatibility | Sajume',
  description: 'Discover your cosmic compatibility through the ancient wisdom of Korean Saju.',
}

export default function CompatibilityPage() {
  return (
    <main className="min-h-screen bg-[#0f0a14] relative overflow-x-hidden pt-10 pb-20">
      <StarsBackground />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium px-3 py-1.5 rounded-full">
            Saju Compatibility Report
          </div>
          <h1 className="text-3xl font-bold text-white">
            Are You Meant to Be?
          </h1>
          <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
            Enter both birth charts and discover your cosmic compatibility through Korean Saju.
          </p>
          <p className="text-xs text-pink-400 font-medium">No Sign-up · Instant Report</p>
        </div>

        {/* Form */}
        <CompatibilityForm />
      </div>
    </main>
  )
}
