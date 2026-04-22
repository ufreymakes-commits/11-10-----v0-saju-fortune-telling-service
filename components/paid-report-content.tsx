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
      </div>
    </div>
  )
}
