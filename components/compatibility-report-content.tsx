'use client'

import { useState } from 'react'
import { track } from '@/hooks/use-track'
import { HeartIcon, ChevronDownIcon, DownloadIcon, LinkIcon, CheckIcon } from 'lucide-react'

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
}: CompatibilityReportContentProps) {
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

  // Overall score (average of all section scores)
  const scoredSections = sections.filter((s) => s.score != null)
  const overallScore = scoredSections.length > 0
    ? Math.round(scoredSections.reduce((acc, s) => acc + (s.score ?? 0), 0) / scoredSections.length)
    : null

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

          {/* Overall score */}
          {overallScore !== null && (
            <div className="inline-flex flex-col items-center gap-1 bg-pink-500/10 border border-pink-500/20 rounded-2xl px-8 py-4">
              <span className="text-4xl font-bold text-pink-400">{overallScore}</span>
              <span className="text-white/50 text-xs">Overall Compatibility Score</span>
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
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold text-sm">{section.title}</span>
                {section.score != null && (
                  <span className="text-xs font-medium text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                    {section.score}%
                  </span>
                )}
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-white/40 transition-transform flex-shrink-0 ${
                  openSections[idx] ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openSections[idx] && (
              <div className="px-5 pb-5">
                <div className="h-px bg-white/5 mb-4" />
                {section.score != null && (
                  <div className="mb-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all"
                        style={{ width: `${section.score}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            )}
          </div>
        ))}
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
