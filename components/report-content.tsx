'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import type { Submission, Fact, SajuData } from '@/lib/types'
import { CheckCircleIcon, SparklesIcon, BriefcaseIcon, HeartIcon, CompassIcon } from 'lucide-react'

interface ReportContentProps {
  submission: Submission
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

// Day Master (일간) emoji mapping
const DAY_MASTER_INFO: Record<string, { korean: string, emoji: string, element: string }> = {
  '甲': { korean: '갑목', emoji: '🌲', element: 'Wood' },
  '乙': { korean: '을목', emoji: '🌿', element: 'Wood' },
  '丙': { korean: '병화', emoji: '☀️', element: 'Fire' },
  '丁': { korean: '정화', emoji: '🕯️', element: 'Fire' },
  '戊': { korean: '무토', emoji: '⛰️', element: 'Earth' },
  '己': { korean: '기토', emoji: '🌾', element: 'Earth' },
  '庚': { korean: '경금', emoji: '⚔️', element: 'Metal' },
  '辛': { korean: '신금', emoji: '💎', element: 'Metal' },
  '壬': { korean: '임수', emoji: '🌊', element: 'Water' },
  '癸': { korean: '계수', emoji: '💧', element: 'Water' },
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

export function ReportContent({ submission }: ReportContentProps) {
  const [sections, setSections] = useState<SectionData[]>(
    SECTION_CONFIG.map(config => ({
      ...config,
      facts: [],
      status: 'pending'
    }))
  )
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [totalFacts, setTotalFacts] = useState(0)
  
  const sajuData = submission.saju_data as SajuData
  const dayMasterChar = sajuData.dayPillar?.stem || '甲'
  const dayMasterInfo = DAY_MASTER_INFO[dayMasterChar] || DAY_MASTER_INFO['甲']

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

  // Pillars in order: Hour, Day, Month, Year (right to left in traditional display, but we show left to right)
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
        
        <div className="relative w-16 h-16 mx-auto mb-3">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
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
        
        {/* Pillars Grid - Right to Left: Year, Month, Day, Hour */}
        <div className="grid grid-cols-4 gap-2 text-center mb-4">
          {pillars.reverse().map(({ label, labelKr, pillar }) => (
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
        <div className="border-t border-border/30 pt-4 text-center">
          <p className="text-[10px] text-muted-foreground mb-2">Your Day Master (일간)</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{dayMasterInfo.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{dayMasterChar} {dayMasterInfo.element}</p>
              <p className="text-xs text-muted-foreground">{dayMasterInfo.korean}</p>
            </div>
          </div>
        </div>
      </div>

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
          <div className="relative w-12 h-12 mx-auto mb-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
              alt="Sajume mascot"
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
      </div>
    </div>
  )
}
