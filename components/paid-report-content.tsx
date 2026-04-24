'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, LinkIcon, CheckIcon } from 'lucide-react'
import type { Submission, SajuData } from '@/lib/types'

interface PaidReportContentProps {
  submission: Submission
  paidReport: any
}

export function PaidReportContent({ submission, paidReport }: PaidReportContentProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const sections: any[] = paidReport?.facts && Array.isArray(paidReport.facts) ? paidReport.facts : []
  const sajuData = (submission.saju_data || {}) as SajuData

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const elementColors: Record<string, string> = {
    Wood: 'bg-green-500',
    Fire: 'bg-red-500',
    Earth: 'bg-yellow-600',
    Metal: 'bg-gray-400',
    Water: 'bg-blue-500'
  }
  const maxScore = 120

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-xs text-muted-foreground">
          {submission.name}&apos;s Full 99 Facts Report
        </p>
      </div>

      {/* Five Elements Balance — same card style as free report */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-lg shadow-primary/5">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 text-center">Your Five Elements Balance</h2>
        <p className="text-[10px] text-muted-foreground/60 text-center mb-3">Based on 8 characters (4 pillars x 2), with weighted scoring on Month Branch. Excludes hidden stems.</p>
        <div className="space-y-2">
          {Object.entries(sajuData.elementBalance || {}).map(([element, score]) => {
            const percentage = (Number(score) / maxScore) * 100
            return (
              <div key={element} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-12 flex-shrink-0">{element}</span>
                <div className="flex-1 h-4 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${elementColors[element] || 'bg-primary'} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{score}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border/30 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Lucky Element (Yongsin)</p>
          <p className="text-lg font-bold text-gradient">
            {(sajuData as any)?.yongsin || (sajuData as any)?.luckyElement || 'Water'}
          </p>
        </div>
      </div>

      {/* Sections — same card style as free report */}
      <div className="space-y-6">
        {sections.map((section: any, sectionIndex: number) => (
          <div key={sectionIndex} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Section Header */}
            <div className="bg-muted border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/20 text-secondary">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{section.sectionTitle}</h3>
              </div>
              <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                {section.cards?.length || 0} facts
              </span>
            </div>

            {/* Cards */}
            <div className="p-4">
              <div className="space-y-2">
                {section.cards && section.cards.map((card: any, cardIdx: number) => {
                  const globalNum = sectionIndex * 10 + cardIdx + 1
                  return (
                    <div
                      key={cardIdx}
                      className="flex gap-2 p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                    >
                      <span className="text-primary font-bold text-xs w-5 flex-shrink-0">
                        {globalNum}
                      </span>
                      <p className="text-foreground/90 text-xs leading-relaxed">{card.content}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Store Products — same style as free report */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-foreground mb-4 text-center">More from Sajume</h3>
        <div className="space-y-4">
          {/* Signature Saju Elemental Bracelet — with image */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="relative w-full h-48">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%20186-4UxuQefWCJ3ecnuEVZjkIyjL94QZBh.png"
                alt="Signature Saju Elemental Bracelet"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">Coming Soon</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Signature Saju Elemental Bracelet</h4>
              <p className="text-xs text-muted-foreground mb-2">A bracelet designed to fill the missing energies in your Saju chart.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400">Personalized to your Saju</span>
                <span className="text-sm font-bold text-foreground/60">$38</span>
              </div>
            </div>
          </div>

          {/* Saju Compatibility */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm opacity-80">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full border border-pink-500/30">Coming Soon</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Saju Compatibility</h4>
            <p className="text-xs text-muted-foreground mb-2">Deep dive into your relationship dynamics and love compatibility.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-pink-400">Compare two birth charts</span>
              <span className="text-sm font-bold text-foreground/60">$12</span>
            </div>
          </div>

          {/* 12-Month Fortune Subscription */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm opacity-80">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">Coming Soon</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">12-Month Fortune Subscription</h4>
            <p className="text-xs text-muted-foreground mb-2">Monthly personalized fortune readings based on your Saju chart.</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400">Delivered monthly</span>
              <span className="text-sm font-bold text-foreground/60">$3.99/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — same as free report */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-muted-foreground">
          This report is generated based on Korean Saju (Four Pillars) astrology.
          <br />
          For entertainment purposes only.
        </p>
        <p className="mt-4 text-[10px] text-muted-foreground/70">
          All rights reserved by Sajume.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            onClick={() => router.push(`/report/${submission.id}`)}
            className="px-4 py-2 bg-primary/10 border border-primary/30 text-foreground text-xs font-semibold rounded hover:bg-primary/20 transition-all"
          >
            Back to Free Report
          </button>
          <p className="text-[10px] text-muted-foreground/50">
            Business: hello@sajume.com
          </p>
        </div>
      </div>

      {/* Fixed Share Button — same as free report */}
      <button
        onClick={handleCopyLink}
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2 bg-card border border-primary/40 text-foreground text-xs px-4 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:border-primary/70 hover:bg-primary/10 transition-all"
      >
        {copied ? (
          <>
            <CheckIcon className="w-3.5 h-3.5 text-secondary" />
            <span className="text-secondary">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5 text-primary" />
            <span>Share</span>
          </>
        )}
      </button>
    </div>
  )
}
