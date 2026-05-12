'use client'

import { useState } from 'react'
import Image from 'next/image'
import { track } from '@/hooks/use-track'
import { HeartIcon, ChevronDownIcon, DownloadIcon, LinkIcon, CheckIcon } from 'lucide-react'
import { CompatibilityReportLoader } from './compatibility-report-loader'

interface Section {
  title: string
  content: string
  score?: number | null
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
}: CompatibilityReportContentProps) {
  // If no sections (report not generated yet), show loader
  if (!sections || sections.length === 0) {
    if (!submissionId) {
      return <div className="text-white text-center py-20">Error: No submission ID provided</div>
    }
    return <CompatibilityReportLoader submissionId={submissionId} />
  }
  
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true })
  const [copied, setCopied] = useState(false)

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
      sections.forEach((_, idx) => { allOpen[idx] = true })
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

          {/* Day Master Characters (천간) — Top banner */}
          {(personADayMaster || personBDayMaster) && (
            <div className="bg-gradient-to-r from-pink-900/20 to-rose-900/20 border border-pink-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Person A</div>
                  <div className="text-lg font-bold text-pink-300">{personADayMaster}</div>
                  <div className="text-[10px] text-white/30 mt-1">Day Master</div>
                </div>
                <HeartIcon className="w-4 h-4 text-pink-400" />
                <div className="text-center">
                  <div className="text-xs text-white/40 mb-1">Person B</div>
                  <div className="text-lg font-bold text-pink-300">{personBDayMaster}</div>
                  <div className="text-[10px] text-white/30 mt-1">Day Master</div>
                </div>
              </div>
            </div>
          )}

          {/* Main heading with names and date */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <span className="text-white font-bold text-lg">{personAName}</span>
              <HeartIcon className="w-5 h-5 text-pink-400 flex-shrink-0" />
              <span className="text-white font-bold text-lg">{personBName}</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
              <span>{personABirthDate}</span>
              <span>·</span>
              <span>{personBBirthDate}</span>
            </div>
          </div>

          {/* First section title + Relationship type */}
          {(firstSectionTitle || relationshipType) && (
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

      {/* Sections */}
      <div className="max-w-lg mx-auto px-4 space-y-3">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden"
          >
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="text-white font-semibold text-sm">{section.title}</span>
              <ChevronDownIcon
                className={`w-4 h-4 text-white/40 transition-transform flex-shrink-0 ${
                  openSections[idx] ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections[idx] && (
              <div className="px-5 pb-5">
                <div className="h-px bg-white/5 mb-4" />
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Store Products */}
      <div className="max-w-lg mx-auto px-4 mt-8">
        <h3 className="text-sm font-semibold text-white mb-4 text-center">More from Sajume</h3>
        <div className="space-y-4">

          {/* Signature Saju Elemental Bracelet */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <div className="relative w-full h-48">
              <Image
                src="/images/luck-bracelet.png"
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
