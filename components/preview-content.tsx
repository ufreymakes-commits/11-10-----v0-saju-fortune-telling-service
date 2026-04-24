'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { DayMasterCard } from '@/components/day-master-card'
import type { Fact, SajuData } from '@/lib/types'
import { LockIcon, Share2Icon } from 'lucide-react'

// Preview page reviews data with names and countries - sorted by most recent first
const PREVIEW_REVIEWS = [
  { id: 1, text: "I received the free 9 Facts First, due to worry that this was going to be a bit like a scam. Once I read through the 9 facts, I was intrigued and purchased the 99 Report. I'm glad I did. There's so much in here and I felt called out, lol. I really was shocked at how accurately it read me. A few of the facts are accurate to even now, and I can clearly look back at the past when the facts mentioned specific years. It's uncanny and I'm impressed!", name: "Emily W", country: "NY", flag: "🇺🇸", date: "Apr 16, 01:01 AM" },
  { id: 2, text: "I really enjoyed reading this Saju packet. The fact-based format made it feel engaging, personal, and easy to connect with. I began highlighting the points that felt accurate, but quickly realized I had highlighted almost every page. I would highly recommend this for anyone curious about self-discovery or looking for clarity and encouragement about their life path.", name: "Hannah", country: "LA", flag: "🇺🇸", date: "Apr 10, 02:26 PM" },
  { id: 3, text: "This was great insight. I definitely felt some feeling were validated.", name: "Jessica", country: "Chicago", flag: "🇺🇸", date: "Apr 1, 08:52 AM" },
  { id: 4, text: "When I started reading the 99 Facts, most of them were unbelievably true to me. It's good to know what my past has been based on the charts and what the current and future look like. I was so surprised by the reading. Thank you for a meaningful reading.", name: "Tao Mon Lae", country: "", flag: "🇲🇲", date: "Apr 1, 03:23 AM" },
  { id: 5, text: "Amazing report!! Good for giving a few things and getting some insights into yourself and into the future. Would highly recommend for anyone interested in SJPJ", name: "Charlotte", country: "", flag: "🇬🇧", date: "Mar 31, 08:43 PM" },
  { id: 6, text: "The report felt really accurate and had lots of interesting insights. I would highly recommend this to anyone curious about it.", name: "Charlotte", country: "", flag: "🇬🇧", date: "Mar 31, 08:37 PM" },
  { id: 7, text: "The report was absolutely spot on. I will definitely book a forecasting reading asap cause the 99 report was very accurate so now I am curious about what it holds for my future. Thank you! Wonderful self discovery tool.", name: "Simona", country: "", flag: "🇮🇹", date: "Mar 31, 07:58 PM" },
  { id: 8, text: "It was scary accurate on so many things. But now it makes me really think about my future much more now because it was truly hit on a few things I have been thinking about for months now. I can't wait to see what the future will bring me and see how the results will compare to the report.", name: "Meng", country: "Chicago", flag: "🇺🇸", date: "Mar 31, 08:02 AM" },
  { id: 9, text: "All past things were predicted on point like exact year and what happened. Future prediction are reasonable too except my career. But still, thank you so much", name: "Pranjali Patil", country: "", flag: "🇮🇳", date: "Mar 31, 05:15 AM" },
  { id: 10, text: "it really resonates with me and it helps to give me a sense of direction. it also acts as a reassurance for me when i start overthinking and feeling overwhelmed", name: "Sim Yun Rou", country: "", flag: "🇸🇬", date: "Mar 30, 12:06 AM" },
  { id: 11, text: "I think it really resonates with me and it helps to give me a sense of direction and also acts a bit as a reassurance for me", name: "Sim Yun Rou", country: "", flag: "🇸🇬", date: "Mar 30, 12:03 AM" },
  { id: 12, text: "I tried the sample 9 facts before purchasing the full report and that alone blew my mind. It's made me curious to try the full in depth report because of how scarily accurate it was. I think it's good for helping you see things about yourself that you may not have noticed before", name: "Alyssa", country: "LA", flag: "🇺🇸", date: "Mar 27, 02:35 PM" },
  { id: 13, text: "Like others have said, it is scarily accurate. It also gave me some clarity and confirmation that I am where I'm supposed to be right now. There's also some great advice that I'll definitely follow and see where it takes me. So glad I signed up for this!", name: "Hannah", country: "LA", flag: "🇺🇸", date: "Mar 21, 06:03 AM" },
  { id: 14, text: "Great report!", name: "Nom", country: "", flag: "🇻🇳", date: "Mar 20, 05:39 PM" },
  { id: 15, text: "The reports brought up a lot that I pushed aside. Made me more introspective of how I want to move forward.", name: "Esther", country: "NY", flag: "🇺🇸", date: "Mar 20, 02:07 PM" },
  { id: 16, text: "Wow almost every single point of the 99 facts was spot on. Will be purchasing more reports in the future.", name: "Nicko", country: "", flag: "🇮🇷", date: "Mar 20, 01:06 PM" },
  { id: 17, text: "It's crazy how accurate the facts are. Just with the first 9 facts, I got goosebumps with the accuracy!!", name: "Yin May Thinn", country: "", flag: "🇲🇲", date: "Mar 18, 11:01 PM" },
  { id: 18, text: "I did this on a whim and received the full report within 30 min. It was eerily accurate, just as advertised. I've been to multiple different fortune tellers and not one of them has given me actual timelines. Sajume was able to accurately pinpoint the year which key events had happened in my past. How!! Sajume also listed out which upcoming years will be important too. If you're on the fence, I definitely recommend getting a report.", name: "Yvonne", country: "LA", flag: "🇺🇸", date: "Mar 18, 10:26 PM" },
  { id: 19, text: "The report came quickly and was surprisingly accurate. It covered internal emotional struggles that have been recurring throughout my life. It also gave insight into some career confusion and even suggested relocation areas I was already considering. Overall it was a fun and enjoyable read.", name: "JazzaRay", country: "NY", flag: "🇺🇸", date: "Mar 18, 12:48 PM" },
  { id: 20, text: "I love it!!! This is eeriely true, and I was shocked reading the report", name: "Nhi", country: "", flag: "🇻🇳", date: "Mar 6, 04:45 AM" },
  { id: 21, text: "This is scarily true. I was shocked because the timelines actually matched what happened in my life before. This is amazing, best impulsive buying I had in years.", name: "Nhi Tran", country: "", flag: "🇻🇳", date: "Mar 6, 04:33 AM" },
  { id: 22, text: "The 99 Facts report was concise and exactly what I needed. I would highly recommend it.", name: "Simon", country: "LA", flag: "🇺🇸", date: "Mar 4, 10:47 PM" },
  { id: 23, text: "The 99 facts premium version is the real deal - I got it at the discounted price, but I wouldn't mind purchasing it again at its original price if I knew I would be getting such detailed information of my saju!", name: "Natalie", country: "", flag: "🇸🇬", date: "Mar 4, 10:34 PM" },
  { id: 24, text: "I loved it! I'ts very precise.", name: "Cecilia Mamani", country: "", flag: "🇨🇱", date: "Mar 4, 03:48 AM" },
  { id: 25, text: "wow so accurate", name: "anannya", country: "", flag: "🇮🇳", date: "Feb 16, 01:40 AM" },
  { id: 26, text: "so accurate!", name: "anannya", country: "", flag: "🇮🇳", date: "Feb 16, 01:36 AM" },
]

interface PreviewContentProps {
  submissionId: string
}

interface PreviewData {
  freeFacts: Fact[]
  teaserFacts: Fact[]
  submission: {
    name: string
    birthDate?: string
    birthTime?: string | null
    gender?: string
    calendar?: string
    sajuData: SajuData
  }
  allSajuDataSentToGemini?: Record<string, unknown>
}

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

interface PreviewContentPropsWithCache {
  submissionId: string
  cachedData?: PreviewData | null
}

export function PreviewContent({ submissionId, cachedData }: PreviewContentPropsWithCache) {
  const [data, setData] = useState<PreviewData | null>(cachedData || null)
  const [isLoading, setIsLoading] = useState(!cachedData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we have cached data, skip API call
    if (cachedData) {
      setData(cachedData)
      setIsLoading(false)
      return
    }
    
    async function fetchPreview() {
      try {
        const response = await fetch('/api/generate-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('[v0] generate-gemini failed:', response.status, errorText)
          throw new Error(`Error: ${response.status} - ${errorText}`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        console.error('[v0] Preview fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPreview()
  }, [submissionId, cachedData])

  // Character slider data for loading screen
  const characters = [
    { name: 'The Pioneer', image: '/images/characters/gabmok.png' },
    { name: 'The Adapter', image: '/images/characters/eulmok.png' },
    { name: 'The Energizer', image: '/images/characters/byeonghwa.png' },
    { name: 'The Empath', image: '/images/characters/jeonghwa.png' },
    { name: 'The Anchor', image: '/images/characters/muto.png' },
    { name: 'The Nurturer', image: '/images/characters/gito.png' },
    { name: 'The Straight Shooter', image: '/images/characters/gyeonggeum.png' },
    { name: 'The Perfectionist', image: '/images/characters/singeum.png' },
    { name: 'The Explorer', image: '/images/characters/imsu.png' },
    { name: 'The Intuitive', image: '/images/characters/gyesu.png' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen overflow-hidden">
        <div className="text-center max-w-sm px-6">
          {/* Character Slider - 2 rows auto-sliding */}
          <div className="mb-6 overflow-hidden">
            {/* Row 1 - slides right */}
            <div className="flex animate-slide-right mb-2">
              {[...characters, ...characters].map((char, i) => (
                <div key={`r1-${i}`} className="flex-shrink-0 w-20 mx-1 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-1">
                    <Image src={char.image} alt={char.name} fill className="object-contain" />
                  </div>
                  <p className="text-[9px] text-foreground/70 truncate">{char.name}</p>
                </div>
              ))}
            </div>
            {/* Row 2 - slides left */}
            <div className="flex animate-slide-left">
              {[...characters.slice(5), ...characters.slice(0, 5), ...characters.slice(5), ...characters.slice(0, 5)].map((char, i) => (
                <div key={`r2-${i}`} className="flex-shrink-0 w-20 mx-1 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-1">
                    <Image src={char.image} alt={char.name} fill className="object-contain" />
                  </div>
                  <p className="text-[9px] text-foreground/70 truncate">{char.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Your Main Character is stepping in...
          </h2>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Spinner className="w-5 h-5" />
          </div>
          <p className="text-sm text-foreground/70 mb-6">
            Don&apos;t close the window!<br />
            We&apos;ll be done in less than 2 mins.
          </p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">{error || 'Something went wrong'}</p>
          <Link href="/start">
            <Button variant="outline" size="sm">Try Again</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { freeFacts, teaserFacts, submission } = data
  const dayMasterChar = submission.sajuData.dayPillar?.stem || '甲'
  const dayMasterInfo = DAY_MASTER_INFO[dayMasterChar] || DAY_MASTER_INFO['甲']

  // Pillars displayed left to right: Hour, Day, Month, Year
  const pillars = [
    { label: 'Hour', labelKr: '시주', pillar: submission.sajuData.hourPillar },
    { label: 'Day', labelKr: '일주', pillar: submission.sajuData.dayPillar },
    { label: 'Month', labelKr: '월주', pillar: submission.sajuData.monthPillar },
    { label: 'Year', labelKr: '연주', pillar: submission.sajuData.yearPillar },
  ]

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      {/* Four Pillars Card */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-lg shadow-primary/5">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">
          <span className="text-gradient font-semibold">{submission.name}&apos;s</span> Four Pillars
        </h2>
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

        {/* Day Master */}
        <div className="border-t border-border/30 pt-4">
          <p className="text-[10px] text-muted-foreground mb-3 text-center">Your Day Master (일간)</p>
          <DayMasterCard 
            dayMaster={submission.sajuData.dayMaster || '기'} 
            dayMasterKorean={submission.sajuData.dayMasterKorean}
          />
        </div>
      </div>

      {/* Free Facts */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="text-gradient">9 Free Insights</span>
          <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded">FREE</span>
        </h2>
        
        <div className="space-y-2">
          {freeFacts.map((fact, index) => (
            <div 
              key={fact.id}
              className="bg-card border border-border rounded-lg p-3 transition-all hover:border-primary/50 shadow-sm"
            >
              <div className="flex gap-2">
                <span className="text-primary font-bold text-sm">{index + 1}</span>
                <p className="text-foreground/90 text-xs leading-relaxed">{fact.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teaser Facts 10, 11, 12 with blur */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="text-foreground/50">Hidden Insights</span>
          <LockIcon className="w-3 h-3 text-muted-foreground" />
        </h2>
        
        <div className="space-y-2">
          {/* Fact 10 */}
          <div className="relative bg-muted border border-border rounded-lg p-3 overflow-hidden">
            <div className="flex gap-2">
              <span className="text-muted-foreground font-bold text-sm">10</span>
              <p className="text-foreground/90 text-xs leading-relaxed">
                {submission.name}, The main theme of your 2026 is <span className="blur-[5px] select-none bg-primary/20 px-2">hidden content</span>. Congratulations! But be careful of <span className="blur-[5px] select-none bg-primary/20 px-2">something</span>, as <span className="blur-[5px] select-none bg-primary/20 px-2">reason here</span> doesn&apos;t fit well with your lifestyle.
              </p>
            </div>
          </div>
          
          {/* Fact 11 */}
          <div className="relative bg-muted border border-border rounded-lg p-3 overflow-hidden">
            <div className="flex gap-2">
              <span className="text-muted-foreground font-bold text-sm">11</span>
              <p className="text-foreground/90 text-xs leading-relaxed">
                The period from 20<span className="blur-[5px] select-none bg-primary/20 px-1">xx</span> to 20<span className="blur-[5px] select-none bg-primary/20 px-1">xx</span> is the best time to meet your spouse. Your spouse will probably be in charge of <span className="blur-[5px] select-none bg-primary/20 px-2">role here</span> and work as a <span className="blur-[5px] select-none bg-primary/20 px-2">job title</span>.
              </p>
            </div>
          </div>
          
          {/* Fact 12 */}
          <div className="relative bg-muted border border-border rounded-lg p-3 overflow-hidden">
            <div className="flex gap-2">
              <span className="text-muted-foreground font-bold text-sm">12</span>
              <p className="text-foreground/90 text-xs leading-relaxed">
                Hey, {submission.name}! Are you actually ready to be rich? How about looking at it from this angle?
              </p>
            </div>
          </div>
          
          {/* ...99 facts indicator */}
          <div className="text-center py-3">
            <span className="text-muted-foreground text-sm tracking-widest">. . . 99 facts</span>
          </div>
        </div>
      </div>

      {/* CTA intro text - outside the card */}
      <div className="text-center mb-4">
        <p className="text-sm text-foreground/80 leading-relaxed">
          Shall we dive into the details?<br />
          Check out <span className="font-bold">how to supercharge your luck<br />in just one minute</span> with the full report below.
        </p>
      </div>

      {/* CTA Section */}
      <div className="bg-card border border-primary/40 rounded-2xl p-5 text-center shadow-lg shadow-primary/10">
        <div className="relative w-12 h-12 mx-auto mb-3 animate-float">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        
        <h3 className="text-lg font-semibold text-gradient mb-0">
          Unlock All 99 Facts
        </h3>
        <p className="text-sm font-medium text-foreground/80 mb-2">
          Full Report
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-muted-foreground line-through text-xs">$19.99</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">$9.99</span>
        </div>
        
        <Link href={`/checkout/${submissionId}`}>
          <Button className="w-full max-w-xs bg-[#0070ba] text-white hover:bg-[#005ea6] h-11 text-sm font-semibold rounded-md shadow-lg">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.773.773 0 0 1 .763-.642h6.153c2.042 0 3.474.405 4.256 1.208.784.8 1.035 1.934.748 3.37l-.022.112h.02a3.606 3.606 0 0 1-.004.133l-.015.12-.025.127c-.002.01-.003.02-.006.03l-.012.05-.01.043-.014.054c-.34 1.47-1.162 2.472-2.386 2.98-.006.002-.012.005-.018.008l-.014.006c-.07.03-.143.058-.217.085l-.086.03c-.068.023-.138.044-.209.064l-.078.022c-.082.022-.166.042-.252.06l-.056.012c-.109.023-.222.044-.337.063l-.038.006a6.933 6.933 0 0 1-.467.057l-.052.004c-.103.009-.209.016-.316.021l-.073.003a7.93 7.93 0 0 1-.288.008h-.08l-.152.001h-2.06l-.048.32-1.026 6.499-.035.215H7.076v.001z"/>
            </svg>
            Pay with PayPal
          </Button>
        </Link>
        
        <p className="mt-3 text-[11px] text-foreground/60 leading-relaxed">
          <span className="font-semibold">Can I use credit card? I have no Paypal</span><br/>
          : Yes, it's available. select <span className="font-bold underline">&apos;Pay with a card&apos;</span> in the Paypal window.
        </p>
      </div>
      
      {/* Social Proof */}
      <div className="mt-6 text-center">
        <div className="flex justify-center gap-0.5 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">2,875 users got their reports</p>
        <p className="text-[10px] text-muted-foreground">4.9/5 from 100% genuine reviews</p>
      </div>

      {/* Reviews Section Header */}
      <div className="mt-8 text-center mb-4">
        <p className="text-base font-semibold text-foreground">If these reviews are fake,</p>
        <p className="text-base font-semibold text-foreground">we will stop running our service 😎</p>
      </div>

      {/* Reviews Section - PC: 3 columns, Mobile: slider */}
      <div>
        <div className="hidden md:grid md:grid-cols-3 gap-3">
          {PREVIEW_REVIEWS.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-lg p-3">
              {/* 5 Yellow Stars */}
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed mb-2">{review.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-foreground/70 font-medium">{review.name} {review.flag}</span>
                <span className="text-[10px] text-muted-foreground">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="md:hidden overflow-x-auto pb-2">
          <div className="flex gap-3 w-max">
            {PREVIEW_REVIEWS.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-lg p-3 w-72 flex-shrink-0">
                {/* 5 Yellow Stars */}
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed mb-2">{review.text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-foreground/70 font-medium">{review.name} {review.flag}</span>
                  <span className="text-[10px] text-muted-foreground">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Luck Bracelet Card */}
      <div className="mt-8">
        <p className="text-lg font-semibold text-foreground mb-2 text-center">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">&quot;Your wish is my command&quot;</span>
        </p>
        <p className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">
          Did you know that among Fire, Water, Wood, Metal, and Earth,<br className="hidden md:inline" />
          <span className="md:inline"> the closer you stay to <span className="font-semibold text-foreground">{submission.sajuData?.yongsin || 'your lucky element'}</span>, the luckier you become?</span>
        </p>
        <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-xl p-5">
          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
            <Image
              src="/images/luck-bracelet.png"
              alt="Signature Saju Elemental Bracelet"
              width={400}
              height={300}
              className="object-cover object-center"
            />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Signature Saju Elemental Bracelet</h4>
          <p className="text-xs text-white/60 mb-3">A signature bracelet designed to fill the missing energies in your personal Saju chart and attract good fortune.</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300">Personalized to your Saju</span>
            <span className="text-sm font-bold text-white/50">$38</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-border text-center">
        <p className="text-[10px] text-muted-foreground/70">
          All rights reserved by Sajume.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <button 
            data-tally-open="681NVP" 
            data-tally-layout="modal" 
            data-tally-emoji-text="👋" 
            data-tally-emoji-animation="wave"
            className="px-4 py-2 bg-primary/20 border border-primary/40 text-foreground text-xs font-semibold rounded hover:bg-primary/30 hover:border-primary/60 transition-all"
          >
            Can I help you with the issue?
          </button>
          <p className="text-[10px] text-muted-foreground/50">
            Business: hello@sajume.com
          </p>
        </div>
      </div>

      {/* Share Button - Fixed bottom right */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(window.location.href)
          alert('Link copied to clipboard!')
        }}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Share this page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
    </div>
  )
}
