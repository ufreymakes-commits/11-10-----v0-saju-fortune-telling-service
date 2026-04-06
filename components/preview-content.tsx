'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { Fact, SajuData } from '@/lib/types'
import { LockIcon } from 'lucide-react'

interface PreviewContentProps {
  submissionId: string
}

interface PreviewData {
  freeFacts: Fact[]
  teaserFacts: Fact[]
  submission: {
    name: string
    sajuData: SajuData
  }
}

export function PreviewContent({ submissionId }: PreviewContentProps) {
  const [data, setData] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await fetch('/api/generate-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId })
        })
        
        if (!response.ok) {
          throw new Error('Failed to generate preview')
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError('Failed to load your birth chart. Please try again.')
        console.error('[v0] Preview fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPreview()
  }, [submissionId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4 animate-float">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
              alt="Sajume mascot"
              fill
              className="object-contain"
            />
          </div>
          <Spinner className="w-6 h-6 mx-auto mb-3" />
          <p className="text-foreground/70">Reading the stars for you...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Something went wrong'}</p>
          <Link href="/start">
            <Button variant="outline">Try Again</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { freeFacts, teaserFacts, submission } = data

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-6">
          <div className="border border-foreground/50 rounded-full px-6 py-2 text-foreground/80 text-sm tracking-wider">
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
        
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          <span className="text-gradient">{submission.name}</span>, here are your first insights
        </h1>
        <p className="text-muted-foreground">
          Based on your Saju birth chart ({submission.sajuData.dayMaster} Day Master)
        </p>
      </div>

      {/* Saju Summary Card */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-5 mb-8">
        <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Your Four Pillars</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Year</p>
            <p className="text-sm font-medium">{submission.sajuData.yearPillar.stem}</p>
            <p className="text-xs text-foreground/70">{submission.sajuData.yearPillar.branch}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Month</p>
            <p className="text-sm font-medium">{submission.sajuData.monthPillar.stem}</p>
            <p className="text-xs text-foreground/70">{submission.sajuData.monthPillar.branch}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Day</p>
            <p className="text-sm font-medium">{submission.sajuData.dayPillar.stem}</p>
            <p className="text-xs text-foreground/70">{submission.sajuData.dayPillar.branch}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hour</p>
            {submission.sajuData.hourPillar ? (
              <>
                <p className="text-sm font-medium">{submission.sajuData.hourPillar.stem}</p>
                <p className="text-xs text-foreground/70">{submission.sajuData.hourPillar.branch}</p>
              </>
            ) : (
              <p className="text-xs text-foreground/50">Unknown</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-3 justify-center text-xs">
          <span className="bg-primary/20 text-primary px-2 py-1 rounded">{submission.sajuData.personalityType}</span>
          <span className="bg-accent/20 text-accent px-2 py-1 rounded">{submission.sajuData.dominantElement} Dominant</span>
          <span className="bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">Lucky: {submission.sajuData.luckyElement}</span>
        </div>
      </div>

      {/* Free Facts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-gradient">9 Free Insights</span>
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">FREE</span>
        </h2>
        
        <div className="space-y-3">
          {freeFacts.map((fact, index) => (
            <div 
              key={fact.id}
              className="bg-card/30 backdrop-blur-sm border border-border/20 rounded-lg p-4 transition-all hover:border-primary/30"
            >
              <div className="flex gap-3">
                <span className="text-primary font-bold text-lg">{index + 1}</span>
                <p className="text-foreground/90 leading-relaxed">{fact.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teaser Facts (Masked) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-foreground/50">Hidden Insights</span>
          <LockIcon className="w-4 h-4 text-muted-foreground" />
        </h2>
        
        <div className="space-y-3">
          {teaserFacts.map((fact, index) => (
            <div 
              key={fact.id}
              className="relative bg-card/20 backdrop-blur-sm border border-border/10 rounded-lg p-4 overflow-hidden"
            >
              <div className="flex gap-3">
                <span className="text-muted-foreground font-bold text-lg">{10 + index}</span>
                <p className="text-foreground/30 leading-relaxed blur-[6px] select-none">
                  {fact.text}
                </p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <LockIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 text-center glow-purple">
        <div className="relative w-16 h-16 mx-auto mb-4 animate-float">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        
        <h3 className="text-xl font-bold text-gradient mb-2">
          Unlock All 99 Facts
        </h3>
        <p className="text-foreground/70 mb-4 text-sm">
          Discover deep insights about your personality, career path, love life, and future destiny
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-muted-foreground line-through text-sm">$19.99</span>
          <span className="text-2xl font-bold text-secondary">$9.99</span>
        </div>
        
        <Link href={`/checkout/${submissionId}`}>
          <Button className="w-full max-w-xs bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 text-lg font-semibold rounded-full glow-pink">
            Unlock Full Report
          </Button>
        </Link>
        
        <p className="mt-3 text-xs text-muted-foreground">
          Secure payment via PayPal
        </p>
      </div>
      
      {/* Social Proof */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Trusted by thousands</p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">4.9/5 from 2,000+ reviews</p>
      </div>
    </div>
  )
}
