'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import type { Submission, Fact, SajuData, REPORT_SECTIONS } from '@/lib/types'
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
  { key: 'personality', title: 'Your Inner Self', description: 'Deep insights into your personality, strengths, and hidden traits', icon: <SparklesIcon className="w-5 h-5" /> },
  { key: 'career', title: 'Career & Wealth', description: 'Your destined path to success and financial prosperity', icon: <BriefcaseIcon className="w-5 h-5" /> },
  { key: 'love', title: 'Love & Relationships', description: 'Understanding your heart and romantic destiny', icon: <HeartIcon className="w-5 h-5" /> },
  { key: 'future', title: 'Future & Destiny', description: 'What the cosmos has written for your journey ahead', icon: <CompassIcon className="w-5 h-5" /> }
]

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

  const generateSection = useCallback(async (sectionIndex: number) => {
    const section = SECTION_CONFIG[sectionIndex]
    
    // Update status to loading
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
      
      // Update section with facts
      setSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, facts, status: 'complete' } : s
      ))
      
      setTotalFacts(prev => prev + facts.length)
      
      // Move to next section
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
    // Start generating sections sequentially
    if (currentSectionIndex < SECTION_CONFIG.length) {
      const section = sections[currentSectionIndex]
      if (section.status === 'pending') {
        generateSection(currentSectionIndex)
      }
    }
  }, [currentSectionIndex, sections, generateSection])

  const completedSections = sections.filter(s => s.status === 'complete').length
  const progress = (completedSections / sections.length) * 100

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-6">
          <div className="border border-primary/50 rounded-full px-6 py-2 text-primary text-sm tracking-wider">
            Sajume
          </div>
        </Link>
        
        <div className="relative w-20 h-20 mx-auto mb-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="text-gradient">{submission.name}&apos;s 99 Facts</span>
        </h1>
        <p className="text-muted-foreground">
          Your complete Saju birth chart report
        </p>
      </div>

      {/* Saju Summary Card */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8 shadow-lg shadow-primary/5">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Your Four Pillars</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Year</p>
            <p className="text-sm font-medium">{sajuData.yearPillar.stem}</p>
            <p className="text-xs text-foreground/70">{sajuData.yearPillar.branch}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Month</p>
            <p className="text-sm font-medium">{sajuData.monthPillar.stem}</p>
            <p className="text-xs text-foreground/70">{sajuData.monthPillar.branch}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Day</p>
            <p className="text-sm font-medium">{sajuData.dayPillar.stem}</p>
            <p className="text-xs text-foreground/70">{sajuData.dayPillar.branch}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hour</p>
            {sajuData.hourPillar ? (
              <>
                <p className="text-sm font-medium">{sajuData.hourPillar.stem}</p>
                <p className="text-xs text-foreground/70">{sajuData.hourPillar.branch}</p>
              </>
            ) : (
              <p className="text-xs text-foreground/50">Unknown</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-3 justify-center text-xs">
          <span className="bg-primary/20 text-primary px-2 py-1 rounded">{sajuData.personalityType}</span>
          <span className="bg-accent/20 text-accent px-2 py-1 rounded">{sajuData.dominantElement} Dominant</span>
          <span className="bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">Lucky: {sajuData.luckyElement}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {completedSections < sections.length && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Generating your report...</span>
            <span className="text-sm text-muted-foreground">{totalFacts} facts</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, sectionIndex) => (
          <div key={section.key} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {/* Section Header */}
            <div className="bg-muted border-b border-border px-5 py-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${section.status === 'complete' ? 'bg-secondary/20 text-secondary' : 'bg-muted/20 text-muted-foreground'}`}>
                {section.status === 'complete' ? <CheckCircleIcon className="w-5 h-5" /> : section.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  {section.title}
                  {section.status === 'loading' && <Spinner className="w-4 h-4" />}
                </h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
              {section.status === 'complete' && (
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                  {section.facts.length} facts
                </span>
              )}
            </div>
            
            {/* Section Content */}
            {section.status === 'loading' && (
              <div className="p-8 text-center">
                <Spinner className="w-6 h-6 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Analyzing your {section.key} insights...
                </p>
              </div>
            )}
            
            {section.status === 'complete' && section.facts.length > 0 && (
              <div className="p-5">
                <div className="space-y-3">
                  {section.facts.map((fact, factIndex) => (
                    <div 
                      key={fact.id}
                      className="flex gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                    >
                      <span className="text-primary font-bold text-sm w-6 flex-shrink-0">
                        {sectionIndex * 25 + factIndex + 1}
                      </span>
                      <p className="text-foreground/90 text-sm leading-relaxed">{fact.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {section.status === 'pending' && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Waiting...</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {completedSections === sections.length && (
        <div className="mt-8 text-center bg-card border border-primary/40 rounded-xl p-6 shadow-lg shadow-primary/10">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
              alt="Sajume mascot"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-xl font-bold text-gradient mb-2">Your Report is Complete!</h3>
          <p className="text-foreground/70 mb-4">
            Thank you for exploring your destiny with Sajume, {submission.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Total: {totalFacts} personalized facts about your birth chart
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          This report is generated based on Korean Saju (Four Pillars) astrology.
          <br />
          For entertainment purposes only.
        </p>
      </div>
    </div>
  )
}
