'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import type { Submission, Fact, SajuData } from '@/lib/types'
import { CheckCircleIcon, SparklesIcon, BriefcaseIcon, HeartIcon, CompassIcon, LinkIcon, CheckIcon } from 'lucide-react'
import { getDayMasterCharacter } from '@/lib/day-master-characters'

interface ReportContentProps {
  submission: Submission
  // Pre-loaded from server — if all 4 sections present, no API calls needed
  cachedSections?: Record<string, Fact[]>
}

interface SectionData {
  key: string
  title: string
  description: string
  icon: React.ReactNode
  facts: Fact[]
  status: 'pending' | 'loading' | 'complete'
}

const SECTION_CONFIG = [
  { key: 'personality', title: 'Your Inner Self', description: 'Deep insights into your personality, strengths, and hidden traits', icon: <SparklesIcon className="w-4 h-4" /> },
  { key: 'career', title: 'Career & Wealth', description: 'Your destined path to success and financial prosperity', icon: <BriefcaseIcon className="w-4 h-4" /> },
  { key: 'love', title: 'Love & Relationships', description: 'Understanding your heart and romantic destiny', icon: <HeartIcon className="w-4 h-4" /> },
  { key: 'future', title: 'Future & Destiny', description: 'What the cosmos has written for your journey ahead', icon: <CompassIcon className="w-4 h-4" /> }
]

// Korean stem → Hanja stem mapping (for display)
const KOREAN_TO_HANJA_STEM: Record<string, string> = {
  '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
  '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸',
}

// Hanja stem → Korean stem mapping (fallback if DB stores hanja)
const HANJA_TO_KOREAN_STEM: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
}

// Day master one-liner quotes
const DAY_MASTER_QUOTE: Record<string, string> = {
  '갑': 'Just goes for it. The path? I\'ll make one.',
  '을': 'Plant me anywhere. I\'ll bloom.',
  '병': 'The vibe shifts the moment I walk in.',
  '정': 'You\'ll open up before you even realize it.',
  '무': 'Lean on me. I\'m not going anywhere.',
  '기': 'Somehow everything just gets taken care of.',
  '경': 'Blunt? Sure. But also always right.',
  '신': 'It\'s not overthinking. It\'s called having standards.',
  '임': 'Goes wherever life takes them. And it\'s always interesting.',
  '계': 'Already knew how you felt before you said a word.',
}

// Stem pronunciations
const STEM_PRONUNCIATION: Record<string, string> = {
  '甲': 'Gap', '乙': 'Eul', '丙': 'Byeong', '丁': 'Jeong', '戊': 'Mu',
  '己': 'Gi', '庚': 'Gyeong', '辛': 'Sin', '壬': 'Im', '癸': 'Gye'
}

// Branch pronunciations  
const BRANCH_PRONUNCIATION: Record<string, string> = {
  '子': 'Ja', '丑': 'Chuk', '寅': 'In', '卯': 'Myo', '辰': 'Jin', '巳': 'Sa',
  '午': 'O', '未': 'Mi', '申': 'Sin', '酉': 'Yu', '戌': 'Sul', '亥': 'Hae'
}

export function ReportContent({ submission, cachedSections = {} }: ReportContentProps) {
  // If we have server-side cached data for a section, mark it complete immediately
  const [sections, setSections] = useState<SectionData[]>(
    SECTION_CONFIG.map(config => {
      const cached = cachedSections[config.key]
      return {
        ...config,
        facts: cached ?? [],
        status: cached ? 'complete' : 'pending'
      }
    })
  )

  // Find first section that still needs generation; -1 means all done
  const firstPending = SECTION_CONFIG.findIndex(c => !cachedSections[c.key])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(firstPending === -1 ? SECTION_CONFIG.length : firstPending)

  const initialTotal = SECTION_CONFIG.reduce((acc, c) => acc + (cachedSections[c.key]?.length ?? 0), 0)
  const [totalFacts, setTotalFacts] = useState(initialTotal)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const sajuData = submission.saju_data as SajuData
  
  // Get day master stem - can be Korean (갑) or Hanja (己)
  const rawStem = sajuData.dayPillar?.stem || '갑'
  // Normalize to Korean (if hanja, convert; if already korean, use as-is)
  const dayMasterKorean = HANJA_TO_KOREAN_STEM[rawStem] || rawStem
  const dayMasterHanja = KOREAN_TO_HANJA_STEM[dayMasterKorean] || rawStem
  const character = getDayMasterCharacter(dayMasterKorean)
  const quote = DAY_MASTER_QUOTE[dayMasterKorean] || ''
  
  // Daewoon is an array of objects with startAge, endAge, fullName, etc.
  const daewoon = Array.isArray(sajuData.daewoon) ? sajuData.daewoon : []

  const generateSection = useCallback(async (sectionIndex: number) => {
    const section = SECTION_CONFIG[sectionIndex]
    
    setSections(prev => prev.map((s, i) => 
      i === sectionIndex ? { ...s, status: 'loading' } : s
    ))
    
    try {
      const response = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          sectionKey: section.key
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate section')
      }
      
      const { facts } = await response.json()
      
      setSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, facts, status: 'complete' } : s
      ))
      
      setTotalFacts(prev => prev + facts.length)
      
      if (sectionIndex < SECTION_CONFIG.length - 1) {
        setCurrentSectionIndex(sectionIndex + 1)
      }
    } catch (error) {
      console.error('[v0] Section generation error:', error)
      setSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, status: 'complete' } : s
      ))
    }
  }, [submission.id])

  useEffect(() => {
    if (currentSectionIndex < SECTION_CONFIG.length) {
      const section = sections[currentSectionIndex]
      if (section.status === 'pending') {
        generateSection(currentSectionIndex)
      }
    }
  }, [currentSectionIndex, sections, generateSection])

  const completedSections = sections.filter(s => s.status === 'complete').length
  const progress = (completedSections / sections.length) * 100

  // Pillars displayed left to right: Hour (leftmost), Day, Month, Year (rightmost)
  // This matches traditional vertical layout read right-to-left: Year -> Month -> Day -> Hour
  const pillars = [
    { label: 'Hour', labelKr: '시주', pillar: sajuData.hourPillar },
    { label: 'Day', labelKr: '일주', pillar: sajuData.dayPillar },
    { label: 'Month', labelKr: '월주', pillar: sajuData.monthPillar },
    { label: 'Year', labelKr: '연주', pillar: sajuData.yearPillar },
  ]

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-block mb-4">
          <div className="border border-primary/50 rounded-full px-5 py-1.5 text-primary text-xs tracking-wider">
            Sajume
          </div>
        </Link>
        
        <div className="relative w-20 h-20 mx-auto mb-3">
          <Image
            src="/images/characters-collection.png"
            alt="Sajume characters"
            fill
            className="object-contain"
          />
        </div>
        
        <h1 className="text-xl font-semibold mb-1">
          <span className="text-gradient">{submission.name}&apos;s 99 Facts</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Your complete Saju birth chart report
        </p>
      </div>

      {/* Four Pillars Card */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-lg shadow-primary/5">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">Your Four Pillars</h2>
        
        {/* Pillars Grid - Left to Right: Hour, Day, Month, Year */}
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          {pillars.map(({ label, labelKr, pillar }) => (
            <div key={label} className="bg-background/50 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
              <p className="text-[10px] text-muted-foreground/70">{labelKr}</p>
              {pillar ? (
                <div className="mt-2">
                  <p className="text-lg font-bold text-foreground">{pillar.stem}</p>
                  <p className="text-[10px] text-muted-foreground">{STEM_PRONUNCIATION[pillar.stem] || ''}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{pillar.branch}</p>
                  <p className="text-[10px] text-muted-foreground">{BRANCH_PRONUNCIATION[pillar.branch] || ''}</p>
                </div>
              ) : (
                <p className="text-xs text-foreground/40 mt-2">-</p>
              )}
            </div>
          ))}
        </div>

        {/* Day Master Type */}
        <div className="border-t border-border/30 pt-4">
          <p className="text-[10px] text-muted-foreground mb-3 text-center uppercase tracking-wider">Your Day Master (일간)</p>
          <div className="flex flex-col items-center">
            {/* Character Image */}
            <div className="relative w-28 h-28 mb-3">
              <Image
                src={character?.imagePath || '/images/characters-collection.png'}
                alt={`${dayMasterKorean} character`}
                fill
                className="object-contain drop-shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/characters-collection.png'
                }}
              />
            </div>
            {/* Name */}
            <p className={`text-lg font-bold mb-0.5 ${character?.color || 'text-foreground'}`}>
              {dayMasterHanja} {dayMasterKorean}{character?.element || ''}
            </p>
            {/* Theme Title */}
            <p className="text-sm font-semibold text-foreground/90 mb-1">{character?.themeTitle || 'Day Master'}</p>
            {/* Theme Description */}
            <p className="text-xs text-muted-foreground/80 mb-2">{character?.themeDescription || ''}</p>
            {/* Keywords */}
            {character?.keywords && character.keywords.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {character.keywords.map((kw, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/70">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
            {/* One-liner quote */}
            {quote && (
              <p className="text-xs text-muted-foreground italic text-center px-4">
                &ldquo;{quote}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Major Fortune Periods (대운) */}
      {daewoon.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-lg shadow-primary/5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">Major Fortune Periods (대운)</h2>
          <div className="flex flex-col gap-1.5">
            {daewoon.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background/50">
                <span className="text-[10px] text-muted-foreground w-20 flex-shrink-0">
                  {d.startAge}세 ~ {d.endAge}세
                </span>
                <span className="text-sm font-bold text-foreground tracking-wider">
                  {d.fullName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {completedSections < sections.length && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Generating your report...</span>
            <span className="text-xs text-muted-foreground">{totalFacts} facts</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={section.key} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Section Header */}
            <div className="bg-muted border-b border-border px-4 py-3 flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${section.status === 'complete' ? 'bg-secondary/20 text-secondary' : 'bg-muted/20 text-muted-foreground'}`}>
                {section.status === 'complete' ? <CheckCircleIcon className="w-4 h-4" /> : section.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {section.title}
                  {section.status === 'loading' && <Spinner className="w-3 h-3" />}
                </h3>
                <p className="text-[10px] text-muted-foreground">{section.description}</p>
              </div>
              {section.status === 'complete' && (
                <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                  {section.facts.length} facts
                </span>
              )}
            </div>
            
            {/* Section Content */}
            {section.status === 'loading' && (
              <div className="p-6 text-center">
                <Spinner className="w-5 h-5 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Analyzing your {section.key} insights...
                </p>
              </div>
            )}
            
            {section.status === 'complete' && section.facts.length > 0 && (
              <div className="p-4">
                <div className="space-y-2">
                  {section.facts.map((fact, factIndex) => (
                    <div 
                      key={fact.id}
                      className="flex gap-2 p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                    >
                      <span className="text-primary font-bold text-xs w-5 flex-shrink-0">
                        {sectionIndex * 25 + factIndex + 1}
                      </span>
                      <p className="text-foreground/90 text-xs leading-relaxed">{fact.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {section.status === 'pending' && (
              <div className="p-6 text-center">
                <p className="text-xs text-muted-foreground">Waiting...</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {completedSections === sections.length && (
        <div className="mt-6 text-center bg-card border border-primary/40 rounded-xl p-5 shadow-lg shadow-primary/10">
          <div className="relative w-16 h-16 mx-auto mb-3">
            <Image
              src="/images/characters-collection.png"
              alt="Sajume characters"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-base font-semibold text-gradient mb-1">Your Report is Complete!</h3>
          <p className="text-xs text-foreground/70 mb-2">
            Thank you for exploring your destiny with Sajume, {submission.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Total: {totalFacts} personalized facts about your birth chart
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-[10px] text-muted-foreground">
          This report is generated based on Korean Saju (Four Pillars) astrology.
          <br />
          For entertainment purposes only.
        </p>
        <p className="mt-4 text-[10px] text-muted-foreground/70">
          All rights reserved by Sajume.
        </p>
        <p className="text-[10px] text-muted-foreground/50">
          Payment issues / Operation inquiries: hello@sajume.com
        </p>
      </div>

      {/* Fixed Share Button - bottom right */}
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
            <span>URL 공유하기</span>
          </>
        )}
      </button>
    </div>
  )
}
