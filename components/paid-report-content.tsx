'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Submission } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'

interface PaidReportContentProps {
  submission: Submission
  paidReport: any
}

export function PaidReportContent({ submission, paidReport }: PaidReportContentProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [sections, setSections] = useState<any[]>([])

  useEffect(() => {
    // If report data exists, parse and display it
    if (paidReport?.facts && Array.isArray(paidReport.facts)) {
      setSections(paidReport.facts)
    } else if (!paidReport?.facts) {
      // Trigger paid report generation if not exists
      generatePaidReport()
    }
  }, [paidReport])

  async function generatePaidReport() {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-paid-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate paid report')
      }

      const data = await response.json()
      
      // Handle both array format and object format with facts property
      const facts = Array.isArray(data) ? data : (data.facts || [])
      setSections(facts)
      
      console.log('[v0] Paid report generated successfully:', facts.length, 'sections')
    } catch (error) {
      console.error('[v0] Error generating paid report:', error)
      // Show error in UI instead of failing silently
      setSections([{
        sectionNumber: '0',
        sectionTitle: 'Error Loading Report',
        cards: [{
          content: `There was an error generating your report. Please refresh the page or contact support if the problem persists.`
        }]
      }])
    } finally {
      setIsGenerating(false)
    }
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" />
          <p className="text-white/60 text-lg">Generating your complete saju analysis...</p>
          <p className="text-white/40 text-sm mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {submission.name}'s Complete 99 Facts
          </h1>
          <p className="text-white/60 text-lg">Your Full Saju Birth Chart Analysis</p>
        </div>

        {/* Five Elements Balance Section */}
        <div className="mb-16 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-8">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 text-center">Your Five Elements Balance</h2>
          <p className="text-[10px] text-muted-foreground/60 text-center mb-6">Based on 8 characters (4 pillars x 2), with weighted scoring on Month Branch. Excludes hidden stems.</p>
          
          {/* Element Bars */}
          <div className="space-y-4 mb-8">
            {['fire', 'wood', 'earth', 'metal', 'water'].map((element) => {
              const score = submission.saju_data?.elementBalance?.[element] || 0
              const percentage = (score / 50) * 100
              const color = {
                fire: 'bg-red-500',
                wood: 'bg-green-500',
                earth: 'bg-yellow-600',
                metal: 'bg-gray-400',
                water: 'bg-blue-500'
              }[element]
              
              return (
                <div key={element} className="flex items-center gap-4">
                  <span className="text-xs font-medium text-white/70 w-12 capitalize">{element}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className={`${color} h-full transition-all`} style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-xs text-white/70 w-8 text-right">{score}</span>
                </div>
              )
            })}
          </div>

          {/* Yongsin Display */}
          <div className="pt-6 border-t border-white/10 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Lucky Element (Yongsin)</p>
            <p className="text-lg font-bold text-gradient">
              {(['Water','Fire','Wood','Metal','Earth'].includes(submission.saju_data?.yongsin) ? submission.saju_data.yongsin : null)
                || (['Water','Fire','Wood','Metal','Earth'].includes(submission.saju_data?.luckyElement) ? submission.saju_data.luckyElement : null)
                || (() => { const eb = submission.saju_data?.elementBalance || {}; const els = ['Water','Fire','Wood','Metal','Earth']; return els.reduce((min,el) => (eb[el.toLowerCase()]||0) < (eb[min.toLowerCase()]||0) ? el : min, els[0]) })()}
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section: any, idx: number) => (
            <section key={idx} className="scroll-mt-20">
              {/* Section Title */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {section.sectionNumber}. {section.sectionTitle}
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-400 to-pink-400"></div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.cards && section.cards.map((card: any, cardIdx: number) => (
                  <div
                    key={cardIdx}
                    className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/40 transition-all"
                  >
                    <p className="text-white/80 leading-relaxed text-sm md:text-base">
                      {card.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center py-12 border-t border-white/10">
          <p className="text-white/60 mb-6">
            Your complete saju analysis is ready to explore and share.
          </p>
          <button
            onClick={() => router.push(`/report/${submission.id}`)}
            className="text-white/40 hover:text-white/60 transition text-sm underline"
          >
            Back to Free Report
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
