'use client'

import { useRouter } from 'next/navigation'
import type { Submission } from '@/lib/types'

interface PaidReportContentProps {
  submission: Submission
  paidReport: any
}

export function PaidReportContent({ submission, paidReport }: PaidReportContentProps) {
  const router = useRouter()
  const sections: any[] = paidReport?.facts && Array.isArray(paidReport.facts) ? paidReport.facts : []

  return (
    <div className="py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-purple-400/60 mb-4">Full Saju Birth Chart Analysis</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-balance">
            {submission.name}&apos;s Complete 99 Facts
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-400/50" />
            <span className="text-purple-400/60 text-xs">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-400/50" />
          </div>
        </div>

        {/* Five Elements Balance Section */}
        <div className="mb-20 border border-white/10 rounded-3xl p-8 md:p-10 bg-white/[0.03]">
          <div className="text-center mb-8">
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/40 mb-1">Your Five Elements Balance</h2>
            <p className="text-[10px] text-white/25">Based on 8 characters (4 pillars x 2), with weighted scoring on Month Branch. Excludes hidden stems.</p>
          </div>
          
          {/* Element Bars */}
          <div className="space-y-3 mb-10 max-w-sm mx-auto">
            {[
              { key: 'fire', label: 'Fire', color: 'bg-red-400' },
              { key: 'wood', label: 'Wood', color: 'bg-green-400' },
              { key: 'earth', label: 'Earth', color: 'bg-yellow-500' },
              { key: 'metal', label: 'Metal', color: 'bg-slate-300' },
              { key: 'water', label: 'Water', color: 'bg-blue-400' },
            ].map(({ key, label, color }) => {
              const score = (submission.saju_data as any)?.elementBalance?.[key] || 0
              const percentage = Math.min((score / 50) * 100, 100)
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-xs text-white/50 w-10">{label}</span>
                  <div className="flex-1 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                    <div className={`${color} h-full rounded-full`} style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-xs text-white/40 w-6 text-right font-mono">{score}</span>
                </div>
              )
            })}
          </div>

          {/* Yongsin Display */}
          <div className="pt-8 border-t border-white/[0.06] text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Your Lucky Element (Yongsin)</p>
            <p className="text-2xl font-bold text-gradient">
              {(submission.saju_data as any)?.yongsin || (submission.saju_data as any)?.luckyElement || 'Water'}
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-20">
          {sections.map((section: any, idx: number) => {
            const sectionNum = String(section.sectionNumber).padStart(2, '0')
            return (
              <section key={idx} className="scroll-mt-20">
                {/* Section Header */}
                <div className="mb-10">
                  <p className="text-xs uppercase tracking-[0.2em] text-purple-400/70 mb-3 font-medium">
                    Section {sectionNum}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight text-balance">
                    {section.sectionTitle}
                  </h2>
                  <div className="mt-4 h-px bg-gradient-to-r from-purple-500/50 via-pink-500/30 to-transparent" />
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.cards && section.cards.map((card: any, cardIdx: number) => {
                    const cardNum = String(cardIdx + 1).padStart(2, '0')
                    const globalNum = idx * 10 + cardIdx + 1
                    return (
                      <div
                        key={cardIdx}
                        className="group relative bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-purple-500/30 rounded-2xl p-6 transition-all duration-300"
                      >
                        {/* Card number */}
                        <span className="text-[10px] font-mono text-purple-400/50 tracking-widest mb-3 block">
                          #{String(globalNum).padStart(3, '0')}
                        </span>
                        <p className="text-white/75 leading-relaxed text-sm md:text-[15px] group-hover:text-white/90 transition-colors">
                          {card.content}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-24 text-center py-16 border-t border-white/[0.06]">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-400/40" />
            <span className="text-purple-400/40 text-xs">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-400/40" />
          </div>
          <p className="text-white/40 text-sm mb-6">
            Your complete saju analysis is ready to explore and share.
          </p>
          <button
            onClick={() => router.push(`/report/${submission.id}`)}
            className="text-white/30 hover:text-white/50 transition text-sm"
          >
            &larr; Back to Free Report
          </button>
        </div>

        {/* Premium Products Section */}
        <div className="mt-24 border-t border-white/10 pt-24">
          <h2 className="text-3xl font-bold text-white text-center mb-16">Elevate Your Saju Journey</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Signature Saju Elemental Bracelet */}
            <div className="group relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 group-hover:from-black/50 group-hover:to-black/30 transition-all z-10"></div>
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%20186-pVNufT1MZruo4qW2gkf4YAQbNXH31I.png"
                alt="Signature Saju Elemental Bracelet"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center">
                <p className="text-white/60 text-sm mb-2">Your wish is my command</p>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Signature Saju Elemental Bracelet</h3>
                <span className="inline-block bg-gray-700/60 text-white/80 px-4 py-1.5 rounded-full text-xs font-medium">Coming Soon</span>
              </div>
            </div>

            {/* 12-Month Fortune Subscription */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">12-Month Fortune Subscription</h3>
                <p className="text-white/70 mb-6">Monthly saju insights, personalized guidance, and exclusive content delivered to your inbox.</p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-pink-400 mt-1">✓</span>
                    <span className="text-white/80 text-sm">Monthly saju fortune readings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-400 mt-1">✓</span>
                    <span className="text-white/80 text-sm">Personalized elemental guidance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-400 mt-1">✓</span>
                    <span className="text-white/80 text-sm">Exclusive member community access</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <p className="text-white/60 text-sm mb-2">Starting at</p>
                <p className="text-4xl font-bold text-white mb-4">$6.58<span className="text-lg text-white/60">/mo</span></p>
                <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all">
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
