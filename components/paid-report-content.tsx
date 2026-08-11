'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircleIcon, LinkIcon, CheckIcon, ChevronDownIcon, DownloadIcon } from 'lucide-react'
import type { Submission, SajuData } from '@/lib/types'
import { getDayMasterCharacter } from '@/lib/day-master-characters'
import { track } from '@/hooks/use-track'
import { useScreenshotDetect } from '@/hooks/use-screenshot-detect'

interface PaidReportContentProps {
  submission: Submission
  paidReport: any
}

const HANJA_TO_KOREAN_STEM: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
}
const KOREAN_TO_HANJA_STEM: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}
const DAY_MASTER_QUOTE: Record<string, string> = {
  '갑': "Just goes for it. The path? I'll make one.",
  '을': 'Plant me anywhere. I\'ll bloom.',
  '병': 'The vibe shifts the moment I walk in.',
  '정': "You'll open up before you even realize it.",
  '무': "Lean on me. I'm not going anywhere.",
  '기': 'Somehow everything just gets taken care of.',
  '경': "Blunt? Sure. But also always right.",
  '신': "It's not overthinking. It's called having standards.",
  '임': "Goes wherever life takes them. And it's always interesting.",
  '계': 'Already knew how you felt before you said a word.',
}

const elementColors: Record<string, string> = {
  Wood: 'bg-green-500',
  Fire: 'bg-red-500',
  Earth: 'bg-yellow-600',
  Metal: 'bg-gray-400',
  Water: 'bg-blue-500',
}
const maxScore = 120

export function PaidReportContent({ submission, paidReport: initialPaidReport }: PaidReportContentProps) {
  const [copied, setCopied] = useState(false)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({})
  const [paidReport, setPaidReport] = useState<any>(initialPaidReport)
  const [vipCards, setVipCards] = useState<any[]>(initialPaidReport?.hidden_cards || [])
  const [isGenerating, setIsGenerating] = useState(!initialPaidReport)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useScreenshotDetect('/paid-report')

  const submissionId = (submission as any).id as string
  const sections: any[] = paidReport?.facts && Array.isArray(paidReport.facts) ? paidReport.facts : []

  // Auto-generate paid report if not yet available, or on retry
  useEffect(() => {
    if (initialPaidReport && retryCount === 0) return
    if (!isGenerating) return
    async function generate() {
      setGenerateError(null)
      try {
        const res = await fetch('/api/generate-paid-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        setPaidReport({ facts: data.facts, hidden_cards: data.vipCards })
        setVipCards(data.vipCards || [])
      } catch (e: any) {
        setGenerateError(e.message || 'Failed to generate report')
      } finally {
        setIsGenerating(false)
      }
    }
    generate()
  }, [submissionId, retryCount, isGenerating, initialPaidReport])
  const sajuData = (submission.saju_data || {}) as SajuData

  const rawStem = sajuData?.dayPillar?.stem || '갑'
  const dayMasterKorean = HANJA_TO_KOREAN_STEM[rawStem] || rawStem
  const dayMasterHanja = KOREAN_TO_HANJA_STEM[dayMasterKorean] || rawStem
  const character = getDayMasterCharacter(dayMasterKorean)
  const quote = DAY_MASTER_QUOTE[dayMasterKorean] || ''

  useEffect(() => {
    track('view_paid_report', '/paid-report')
  }, [])

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      track('share_paid_report', '/paid-report')
    }
  }

  const handleDownloadPDF = () => {
    if (typeof window !== 'undefined') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        alert('PDF downloads are currently only supported on desktop. Please share the link to download it from your PC.')
        return
      }
      
      // Desktop only: Expand all sections before printing
      const allOpen: Record<number, boolean> = {}
      sections.forEach((_: any, idx: number) => { allOpen[idx] = true })
      setOpenSections(allOpen)
      track('download_pdf_paid_report', '/paid-report')
      
      setTimeout(() => {
        window.print()
      }, 300)
    }
  }

  const handleNoticeMeClick = (product: string) => {
    track('notice_me_click', '/paid-report', { product })
  }

  const toggleSection = (idx: number) => {
    setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto pdf-content">

      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-xs text-muted-foreground">
          {submission.name}&apos;s Sajume Full 99 Facts Report
        </p>
      </div>

      {/* Five Elements Balance */}
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

      {/* Day Master Card — horizontal layout */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-lg shadow-primary/5">
        <p className="text-[10px] text-muted-foreground mb-3 text-center uppercase tracking-wider">Your Day Master (일간)</p>
        <div className="flex gap-4 items-center">
          {/* Left: image + name */}
          <div className="flex flex-col items-center flex-shrink-0 w-24">
            <div className="relative w-20 h-20 mb-2">
              <Image
                src={character?.imagePath || '/images/characters-collection.png'}
                alt={`${dayMasterKorean} character`}
                fill
                className="object-contain drop-shadow-lg"
                priority
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/characters-collection.png' }}
              />
            </div>
            <p className={`text-sm font-bold text-center leading-tight ${character?.color || 'text-foreground'}`}>
              {dayMasterHanja} {dayMasterKorean}
            </p>
            <p className="text-[10px] text-muted-foreground text-center">{character?.element || ''}</p>
          </div>

          {/* Right: keywords, description, quote */}
          <div className="flex-1 min-w-0">
            {/* Keywords */}
            {character?.keywords && character.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {character.keywords.map((kw: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-primary/15 rounded-full text-primary font-medium">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
            {/* Theme title + description */}
            <p className="text-xs font-semibold text-foreground/90 mb-1">{character?.themeTitle || 'Day Master'}</p>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-2">{character?.themeDescription || ''}</p>
            {/* Quote */}
            {quote && (
              <p className="text-[10px] text-muted-foreground italic">
                &ldquo;{quote}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Arrow hint */}
      <p className="text-center text-[11px] text-muted-foreground/60 mb-2">Tap the arrow below to open each section of your report</p>

      {/* Generating state */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground text-center">Generating your 99 facts report...<br /><span className="text-xs text-muted-foreground/60">This may take up to 3 minutes. Please keep this page open.</span></p>
        </div>
      )}

      {/* Error state */}
      {generateError && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <p className="text-sm text-destructive text-center">Report generation failed: {generateError}</p>
          <button
            onClick={() => { setGenerateError(null); setIsGenerating(true); setRetryCount(c => c + 1); }}
            className="text-xs px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Sections with toggle */}
      <div className="space-y-4">
        {sections.map((section: any, sectionIndex: number) => {
          const isOpen = !!openSections[sectionIndex]
          return (
            <div key={sectionIndex} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {/* Section Header */}
              <div className="bg-muted border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-secondary/20 text-secondary">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{section.sectionTitle}</h3>
                </div>
                {/* Animated toggle chevron */}
                <button
                  onClick={() => toggleSection(sectionIndex)}
                  aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                  className="p-1.5 rounded-lg hover:bg-background/50 transition-colors"
                >
                  <ChevronDownIcon
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} animate-bounce`}
                  />
                </button>
              </div>

              {/* Cards — shown when open */}
              {isOpen && (
                <div className="p-4">
                  <div className="space-y-2">
                    {section.cards && section.cards.map((card: any, cardIdx: number) => {
                      const globalNum = sectionIndex * 10 + cardIdx + 1
                      return (
                        <div
                          key={cardIdx}
                          className="flex gap-2 p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                        >
                          <span className="text-primary font-bold text-xs w-5 flex-shrink-0">{globalNum}</span>
                          <p className="text-foreground/90 text-xs leading-relaxed">{card.content}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 6 VIP Master Cards */}
      {vipCards.length > 0 && (
        <div className="mt-8">
          <div className="text-center mb-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">VIP Master Cards</p>
            <h3 className="text-sm font-semibold text-foreground mt-1">6 Last Things I Want to Tell You..</h3>
          </div>
          <div className="space-y-4">
            {vipCards.map((card: any, idx: number) => (
              <div key={idx} className="bg-card border border-primary/30 rounded-xl p-4 shadow-lg shadow-primary/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-primary/70 mb-0.5">{card.theme}</p>
                    <p className="text-xs font-semibold text-foreground mb-2">{card.title}</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{card.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Products */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-foreground mb-4 text-center">More from Sajume</h3>
        <div className="space-y-4">

          {/* Ask the Gumiho 1:1 */}
          <Link href={`/ask-gumiho/${submissionId}`}>
            <div className="bg-card border border-primary/30 rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
              <div className="relative w-full" style={{ aspectRatio: '796/531' }}>
                <Image
                  src="/images/ask-gumiho.png"
                  alt="Ask the Gumiho 1:1"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-semibold text-foreground mb-1">Ask the Gumiho 1:1</h4>
                <p className="text-xs text-muted-foreground mb-3">Your 3 Burning Questions Answered - Personalized guidance from the nine-tailed fox based on your complete Saju profile.</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-primary">Personalized AI Reading</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">$19.99</span>
                    <span className="text-sm font-bold text-foreground">$9.99</span>
                  </div>
                </div>
                <span className="w-full py-2 text-xs font-semibold bg-primary hover:bg-primary/90 rounded-lg transition-colors text-primary-foreground text-center block">
                  Ask Now (3 mins)
                </span>
              </div>
            </div>
          </Link>

          {/* Signature Saju Elemental Bracelet */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="relative w-full" style={{ aspectRatio: '796/531' }}>
              <Image
                src="/images/saju-bracelet-new.png"
                alt="Signature Saju Elemental Bracelet"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">Your Personal Lucky Element Bracelet</h4>
              <p className="text-xs text-muted-foreground mb-3">A bracelet designed to fill the missing energies in your Saju chart.</p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Image
                    src="/images/shopify-logo.png"
                    alt="Shopify"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                  <span className="text-[10px] text-muted-foreground">Shop at Sajume Shopify</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground line-through">$50</span>
                  <span className="text-sm font-bold text-foreground">$38</span>
                </div>
              </div>
              <a
                href="https://sajume.com/products/personal-luck-bracelet"
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: '#95BF47' }}
                className="w-full py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 text-white text-center block"
              >
                Shop Now
              </a>
            </div>
          </div>

          {/* Saju Compatibility */}
          <div className="bg-card border border-pink-500/30 rounded-xl overflow-hidden shadow-sm">
            <div className="relative w-full" style={{ aspectRatio: '796/531' }}>
              <Image
                src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/29.png?v=1778483455"
                alt="Relationship Compatibility"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">Saju Compatibility</h4>
              <p className="text-xs text-muted-foreground mb-3">Deep dive into your relationship dynamics and love compatibility.</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-pink-400">Compare two birth charts</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground line-through">$39.99</span>
                  <span className="text-sm font-bold text-foreground">$19.99</span>
                </div>
              </div>
              <a
                href="/compatibility"
                className="w-full py-2 text-xs font-semibold bg-pink-500 hover:bg-pink-400 rounded-lg transition-colors text-white text-center block"
              >
                Shop Now (3 mins)
              </a>
            </div>
          </div>

          {/* 12-Month Fortune Subscription */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm opacity-80">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">Coming Soon</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-1">12-Month Fortune Subscription</h4>
            <p className="text-xs text-muted-foreground mb-3">Monthly personalized fortune readings based on your Saju chart.</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-blue-400">Delivered monthly</span>
              <span className="text-sm font-bold text-foreground">$6.58/mo</span>
            </div>
            <button
              data-tally-open="81JRrr"
              data-tally-layout="modal"
              data-tally-emoji-text="👋"
              data-tally-emoji-animation="wave"
              onClick={() => handleNoticeMeClick('subscription')}
              className="w-full py-2 text-xs font-semibold bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors text-white"
            >
              Notice me
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-muted-foreground">
          This report is generated based on Korean Saju (Four Pillars) astrology.
          <br />
          For entertainment purposes only.
        </p>
        <p className="mt-4 text-[10px] text-muted-foreground/70">All rights reserved by Sajume.</p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-[10px] text-muted-foreground/50">Business: hello@sajume.com</p>
        </div>
      </div>

      {/* Fixed Download PDF Button */}
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-24 md:bottom-[4.5rem] right-4 md:right-5 z-50 flex items-center gap-2 bg-card border border-border text-foreground text-xs px-3 md:px-4 py-2 md:py-2.5 rounded-full shadow-lg hover:border-primary/40 hover:bg-primary/5 transition-all print:hidden"
      >
        <DownloadIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Download PDF</span>
      </button>

      {/* Fixed Share Button */}
      <button
        onClick={handleCopyLink}
        className="fixed bottom-12 md:bottom-6 right-4 md:right-5 z-50 flex items-center gap-2 bg-card border border-primary/40 text-foreground text-xs px-3 md:px-4 py-2 md:py-2.5 rounded-full shadow-lg shadow-primary/20 hover:border-primary/70 hover:bg-primary/10 transition-all print:hidden"
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
