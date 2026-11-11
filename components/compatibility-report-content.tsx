'use client'

import { useState } from 'react'
import Image from 'next/image'
import { track } from '@/hooks/use-track'
import { HeartIcon, ChevronDownIcon, DownloadIcon, LinkIcon, CheckIcon } from 'lucide-react'
import { CompatibilityReportLoader } from './compatibility-report-loader'
import { CompatibilityScoreBoard } from './compatibility-score-board'
import type { ScoreBoard } from '@/lib/compat/constants'
import { getDayMasterCharacter } from '@/lib/day-master-characters'

// English to Korean day master mapping for character lookup
const ENGLISH_TO_KOREAN: Record<string, string> = {
  'Yang Wood': '갑', 'Yin Wood': '을',
  'Yang Fire': '병', 'Yin Fire': '정',
  'Yang Earth': '무', 'Yin Earth': '기',
  'Yang Metal': '경', 'Yin Metal': '신',
  'Yang Water': '임', 'Yin Water': '계',
}

interface Section {
  key?: string
  title: string
  content: string
  score?: number | null
}

const KEEP_SECTION_KEY = 'keep'

function Paragraphs({ text, className }: { text: string; className: string }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return (
    <div className="space-y-3">
      {parts.map((p, i) => (
        <p key={i} className={className}>{p}</p>
      ))}
    </div>
  )
}

interface CompatibilityReportContentProps {
  personAName: string
  personBName: string
  personABirthDate: string
  personBBirthDate: string
  personADayMaster: string
  personBDayMaster: string
  relationshipType: string
  firstSectionTitle: string
  sections: Section[]
  submissionId?: string
  compatibilityScore?: number | null
  scoreBoard?: ScoreBoard | null
}

export function CompatibilityReportContent({
  personAName,
  personBName,
  personABirthDate,
  personBBirthDate,
  personADayMaster,
  personBDayMaster,
  relationshipType,
  firstSectionTitle,
  sections,
  submissionId,
  compatibilityScore,
  scoreBoard,
}: CompatibilityReportContentProps) {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true })
  const [copied, setCopied] = useState(false)

  // All hooks are above this point; the loader branch below is a plain early return.
  if (!sections || sections.length === 0) {
    if (!submissionId) {
      return <div className="text-white text-center py-20">Error: No submission ID provided</div>
    }
    return <CompatibilityReportLoader submissionId={submissionId} />
  }

  const isV2 = !!scoreBoard
  const accordionSections = sections.filter((s) => s.key !== KEEP_SECTION_KEY)
  const keepSection = sections.find((s) => s.key === KEEP_SECTION_KEY)

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      track('share_compatibility_report', '/compatibility-report')
    }
  }

  const handleDownloadPDF = () => {
    if (typeof window !== 'undefined') {
      const allOpen: Record<number, boolean> = {}
      accordionSections.forEach((_, idx) => { allOpen[idx] = true })
      setOpenSections(allOpen)
      track('download_pdf_compatibility_report', '/compatibility-report')
      setTimeout(() => { window.print() }, 300)
    }
  }



  return (
    <div className="min-h-screen bg-[#0f0a14] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-pink-950/40 to-transparent pt-12 pb-8 px-4">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium px-3 py-1.5 rounded-full">
            Saju Compatibility Report
          </div>

          {/* Unified Character Box: Name, Birth Date, Character, Heart in center */}
          {(personADayMaster || personBDayMaster) && (() => {
            const koreanA = ENGLISH_TO_KOREAN[personADayMaster] || ''
            const koreanB = ENGLISH_TO_KOREAN[personBDayMaster] || ''
            const characterA = getDayMasterCharacter(koreanA)
            const characterB = getDayMasterCharacter(koreanB)
            
            return (
              <div className="bg-gradient-to-r from-pink-900/20 to-rose-900/20 border border-pink-500/20 rounded-xl p-5">
                <div className="flex items-center justify-center gap-4">
                  {/* Person A */}
                  <div className="text-center flex-1">
                    <div className="text-sm font-bold text-white mb-0.5">{personAName}</div>
                    <div className="text-[10px] text-white/40 mb-2">{personABirthDate}</div>
                    {characterA && (
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <Image
                          src={characterA.imagePath}
                          alt={`${personADayMaster} character`}
                          fill
                          className="object-contain drop-shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/characters-collection.png'
                          }}
                        />
                      </div>
                    )}
                    <div className={`text-xs font-semibold ${characterA?.color || 'text-pink-300'}`}>
                      {personADayMaster}
                    </div>
                  </div>
                  
                  {/* Heart */}
                  <HeartIcon className="w-6 h-6 text-pink-400 flex-shrink-0" />
                  
                  {/* Person B */}
                  <div className="text-center flex-1">
                    <div className="text-sm font-bold text-white mb-0.5">{personBName}</div>
                    <div className="text-[10px] text-white/40 mb-2">{personBBirthDate}</div>
                    {characterB && (
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <Image
                          src={characterB.imagePath}
                          alt={`${personBDayMaster} character`}
                          fill
                          className="object-contain drop-shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/characters-collection.png'
                          }}
                        />
                      </div>
                    )}
                    <div className={`text-xs font-semibold ${characterB?.color || 'text-pink-300'}`}>
                      {personBDayMaster}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* v2: score board replaces the old score box and theme box */}
          {isV2 && scoreBoard && <CompatibilityScoreBoard board={scoreBoard} />}

          {/* Compatibility Score (v1 reports) */}
          {!isV2 && compatibilityScore !== null && compatibilityScore !== undefined && (
            <div className="inline-flex flex-col items-center gap-1 bg-pink-500/10 border border-pink-500/20 rounded-2xl px-8 py-4">
              <span className="text-4xl font-bold text-pink-400">{compatibilityScore}</span>
              <span className="text-white/50 text-xs">Chemistry Score</span>
            </div>
          )}

          {/* First section title + Relationship type */}
          {!isV2 && (firstSectionTitle || relationshipType) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
              {firstSectionTitle && (
                <div>
                  <div className="text-[10px] text-white/40 mb-1">Compatibility Theme</div>
                  <div className="text-sm font-semibold text-white">{firstSectionTitle}</div>
                </div>
              )}
              {relationshipType && (
                <div>
                  <div className="text-[10px] text-white/40 mb-1">Relationship Type</div>
                  <div className="text-sm font-semibold text-pink-300">{relationshipType}</div>
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      {/* Hint text with bouncing arrow */}
      <div className="max-w-lg mx-auto px-4 mb-4">
        <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
          <span>Tap the arrow to reveal the content</span>
          <ChevronDownIcon className="w-4 h-4 animate-bounce" />
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-lg mx-auto px-4 space-y-3">
        {accordionSections.map((section, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-purple-200/30 bg-gradient-to-br from-white/95 to-purple-50/90 overflow-hidden shadow-sm"
          >
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-purple-500 font-mono text-xs font-semibold">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-purple-900 font-semibold text-sm">{section.title}</span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-purple-400 transition-transform flex-shrink-0 ${
                  openSections[idx] ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections[idx] && (
              <div className="px-5 pb-5">
                <div className="h-px bg-purple-200/50 mb-4" />
                {section.key ? (
                  <Paragraphs text={section.content} className="text-purple-900/80 text-sm leading-relaxed" />
                ) : (
                  <p className="text-purple-900/80 text-sm leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {keepSection && (
          <figure className="rounded-2xl border border-pink-400/40 bg-gradient-to-br from-pink-500/15 to-rose-500/10 p-6 text-center">
            <figcaption className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-pink-300">
              {keepSection.title}
            </figcaption>
            <blockquote className="space-y-3">
              <Paragraphs text={keepSection.content} className="text-base leading-relaxed text-white/90 italic" />
            </blockquote>
          </figure>
        )}
      </div>

      {/* Store Products */}
      <div className="max-w-lg mx-auto px-4 mt-8">
        <h3 className="text-sm font-semibold text-white mb-4 text-center">More from Sajume</h3>
        <div className="space-y-4">

          {/* Signature Saju Elemental Bracelet */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: '796/531' }}>
              <Image
                src="/images/saju-bracelet-new.png"
                alt="Signature Saju Elemental Bracelet"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h4 className="text-sm font-semibold text-white mb-1">Signature Saju Elemental Bracelet</h4>
              <p className="text-xs text-white/60 mb-3">A bracelet designed to fill the missing energies in your Saju chart.</p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Image
                    src="/images/shopify-logo.png"
                    alt="Shopify"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                  <span className="text-[10px] text-white/50">Shop at Sajume Shopify</span>
                </div>
                <span className="text-sm font-bold text-white">$38</span>
              </div>
              <a
                href="https://sajume.com/products/personal-luck-bracelet"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 text-xs font-semibold border border-white/20 rounded-lg hover:bg-white/5 transition-colors text-white text-center block"
              >
                Shop Now
              </a>
            </div>
          </div>

          {/* 12-Month Fortune Subscription */}
          <div className="bg-white/[0.03] border border-blue-500/30 rounded-xl overflow-hidden">
            <div className="relative w-full h-32">
              <Image
                src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/30.png?v=1778484201"
                alt="12-Month Fortune Subscription"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">Coming Soon</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">12-Month Fortune Subscription</h4>
              <p className="text-xs text-white/60 mb-3">Monthly personalized fortune readings based on your Saju chart.</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-blue-400">Delivered monthly</span>
                <span className="text-sm font-bold text-white">$6.58/mo</span>
              </div>
              <button
                className="w-full py-1.5 text-xs font-semibold border border-white/20 rounded-lg hover:bg-white/5 transition-colors text-white/70"
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 mt-8 text-center pb-32">
        <p className="text-[10px] text-white/40">
          This report is generated based on Korean Saju (Four Pillars) astrology.
          <br />
          For entertainment purposes only.
        </p>
        <p className="mt-4 text-[10px] text-white/30">All rights reserved by Sajume.</p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className="text-[10px] text-white/20">Business: hello@sajume.com</p>
        </div>
      </div>

      {/* Fixed Download PDF Button */}
      <button
        onClick={handleDownloadPDF}
        className="fixed bottom-[4.5rem] right-5 z-50 flex items-center gap-2 bg-[#1a1025] border border-white/20 text-white text-xs px-4 py-2.5 rounded-full shadow-lg hover:border-pink-500/40 hover:bg-pink-500/5 transition-all print:hidden"
      >
        <DownloadIcon className="w-3.5 h-3.5 text-white/50" />
        <span>Download PDF</span>
      </button>

      {/* Fixed Share Button */}
      <button
        onClick={handleCopyLink}
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2 bg-[#1a1025] border border-pink-500/40 text-white text-xs px-4 py-2.5 rounded-full shadow-lg shadow-pink-900/20 hover:border-pink-500/70 hover:bg-pink-500/10 transition-all print:hidden"
      >
        {copied ? (
          <>
            <CheckIcon className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-pink-400">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Share</span>
          </>
        )}
      </button>
    </div>
  )
}
