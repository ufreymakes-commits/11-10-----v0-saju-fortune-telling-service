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
          const errorText = await response.text()
          const errorMsg = response.status === 429 
            ? 'Daily limit reached. Please try again tomorrow.' 
            : `Error: ${response.status} - ${errorText}`
          throw new Error(errorMsg)
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
          <div className="relative w-20 h-20 mx-auto mb-4 animate-float">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
              alt="Sajume mascot"
              fill
              className="object-contain"
            />
          </div>
          <Spinner className="w-5 h-5 mx-auto mb-2" />
          <p className="text-sm text-foreground/70">Reading the stars for you...</p>
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

  // Pillars displayed right to left: Year (rightmost) -> Month -> Day -> Hour (leftmost)
  const pillars = [
    { label: 'Hour', labelKr: '시주', pillar: submission.sajuData.hourPillar },
    { label: 'Day', labelKr: '일주', pillar: submission.sajuData.dayPillar },
    { label: 'Month', labelKr: '월주', pillar: submission.sajuData.monthPillar },
    { label: 'Year', labelKr: '연주', pillar: submission.sajuData.yearPillar },
  ] // Already in left-to-right display order (Hour, Day, Month, Year)

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
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
        
        <h1 className="text-lg font-semibold mb-1">
          <span className="text-gradient">{submission.name}</span>, here are your first insights
        </h1>
        <p className="text-xs text-muted-foreground">
          Based on your Saju birth chart
        </p>
      </div>

      {/* Four Pillars Card */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-lg shadow-primary/5">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 text-center">Your Four Pillars</h2>
        
        {/* Pillars Grid - displayed left to right: Hour, Day, Month, Year */}
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

      {/* DEBUG: GPT에 전송되는 데이터 표시 (개발용) */}
      <div className="bg-slate-900 text-green-400 border border-green-500/30 rounded-xl p-4 mb-6 text-xs font-mono overflow-x-auto">
        <h3 className="text-yellow-400 font-bold mb-3 text-sm">[DEBUG] GPT에 전송되는 데이터</h3>
        
        <div className="space-y-2">
          <div><span className="text-cyan-400">이름:</span> {submission.name}</div>
          <div><span className="text-cyan-400">일간:</span> {submission.sajuData.dayMaster} ({submission.sajuData.dayMasterKorean || '-'})</div>
          
          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">사주 8글자:</span>
            <div className="ml-2">
              <div>연주: {submission.sajuData.yearPillar?.fullName || `${submission.sajuData.yearPillar?.stem}${submission.sajuData.yearPillar?.branch}`} ({submission.sajuData.yearPillar?.fullNameKorean || '-'})</div>
              <div>월주: {submission.sajuData.monthPillar?.fullName || `${submission.sajuData.monthPillar?.stem}${submission.sajuData.monthPillar?.branch}`} ({submission.sajuData.monthPillar?.fullNameKorean || '-'})</div>
              <div>일주: {submission.sajuData.dayPillar?.fullName || `${submission.sajuData.dayPillar?.stem}${submission.sajuData.dayPillar?.branch}`} ({submission.sajuData.dayPillar?.fullNameKorean || '-'})</div>
              <div>시주: {submission.sajuData.hourPillar?.fullName || `${submission.sajuData.hourPillar?.stem || '-'}${submission.sajuData.hourPillar?.branch || '-'}`} ({submission.sajuData.hourPillar?.fullNameKorean || '-'})</div>
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">오행 (기본 점수 - 합충 미반영):</span>
            <div className="ml-2">
              {submission.sajuData.elementBalanceKorean ? (
                <div>목{submission.sajuData.elementBalanceKorean.목}점 / 화{submission.sajuData.elementBalanceKorean.화}점 / 토{submission.sajuData.elementBalanceKorean.토}점 / 금{submission.sajuData.elementBalanceKorean.금}점 / 수{submission.sajuData.elementBalanceKorean.수}점</div>
              ) : (
                <div>Wood:{submission.sajuData.elementBalance?.wood} / Fire:{submission.sajuData.elementBalance?.fire} / Earth:{submission.sajuData.elementBalance?.earth} / Metal:{submission.sajuData.elementBalance?.metal} / Water:{submission.sajuData.elementBalance?.water}</div>
              )}
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">오행 (합충 반영 점수):</span>
            <div className="ml-2">
              {submission.sajuData.elementBalanceAdjustedKorean ? (
                <div className="text-lime-400">목{submission.sajuData.elementBalanceAdjustedKorean.목}점 / 화{submission.sajuData.elementBalanceAdjustedKorean.화}점 / 토{submission.sajuData.elementBalanceAdjustedKorean.토}점 / 금{submission.sajuData.elementBalanceAdjustedKorean.금}점 / 수{submission.sajuData.elementBalanceAdjustedKorean.수}점</div>
              ) : <span className="text-red-400">미계산</span>}
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">합충 조정 내역:</span>
            <div className="ml-2 text-[10px] text-orange-300">
              {submission.sajuData.hapChungAdjustments?.length ? (
                submission.sajuData.hapChungAdjustments.map((adj, i) => (
                  <div key={i}>{adj}</div>
                ))
              ) : <span className="text-gray-500">합충 조정 없음</span>}
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">12운성:</span>
            <div className="ml-2">
              {submission.sajuData.twelveStars?.map((ts, i) => (
                <span key={i}>{ts.position}{ts.branch}:{ts.star} {i < (submission.sajuData.twelveStars?.length || 0) - 1 ? '/ ' : ''}</span>
              )) || <span className="text-red-400">미계산</span>}
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">십신:</span>
            <div className="ml-2">
              <div>보유: {submission.sajuData.tenGods?.present?.join(', ') || <span className="text-red-400">미계산</span>}</div>
              <div>부재: {submission.sajuData.tenGods?.missing?.join(', ') || <span className="text-red-400">미계산</span>}</div>
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">관계식:</span>
            <div className="ml-2">
              <div>천간합: {submission.sajuData.cheongganHap?.length ? submission.sajuData.cheongganHap.join(', ') : '없음'}</div>
              <div>지지육합: {submission.sajuData.jijiYughap?.length ? submission.sajuData.jijiYughap.join(', ') : '없음'}</div>
              <div>지지삼합: {submission.sajuData.jijiSamhap?.length ? submission.sajuData.jijiSamhap.join(', ') : '없음'}</div>
              <div>지지방합: {submission.sajuData.jijiBanghap?.length ? submission.sajuData.jijiBanghap.join(', ') : '없음'}</div>
              <div>천간충: {submission.sajuData.cheongganChung?.length ? submission.sajuData.cheongganChung.join(', ') : '없음'}</div>
              <div>지지충: {submission.sajuData.jijiChung?.length ? submission.sajuData.jijiChung.join(', ') : '없음'}</div>
              <div>형: {submission.sajuData.hyeong?.length ? submission.sajuData.hyeong.join(', ') : '없음'}</div>
              <div>파: {submission.sajuData.pa?.length ? submission.sajuData.pa.join(', ') : '없음'}</div>
              <div>해: {submission.sajuData.hae?.length ? submission.sajuData.hae.join(', ') : '없음'}</div>
              <div>원진: {submission.sajuData.wonjin?.length ? submission.sajuData.wonjin.join(', ') : '없음'}</div>
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">길성:</span>
            <div className="ml-2">
              <div>천을귀인: {submission.sajuData.gilseong?.cheonul?.join(', ') || '없음'}</div>
              <div>태극귀인: {submission.sajuData.gilseong?.taegeuk?.join(', ') || '없음'}</div>
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">공망:</span> {submission.sajuData.gongmang?.join('·') || <span className="text-red-400">미계산</span>}
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">신강/신약:</span> {submission.sajuData.sinGangSinYak ? `${submission.sajuData.sinGangSinYak.grade} (${submission.sajuData.sinGangSinYak.ratio}%)` : <span className="text-red-400">미계산</span>}
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">용신:</span>
            <div className="ml-2">
              <div>억부용신: {submission.sajuData.eokbuYongsin || <span className="text-red-400">미계산</span>}</div>
              <div>조후용신: {submission.sajuData.johuYongsin || <span className="text-red-400">미계산</span>}</div>
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">격국:</span> {submission.sajuData.gyeokguk || <span className="text-red-400">미계산</span>}
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">신살:</span> {submission.sajuData.spirits?.length ? submission.sajuData.spirits.join(', ') : <span className="text-red-400">미계산</span>}
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">대운:</span>
            <div className="ml-2">
              {submission.sajuData.daewoon?.slice(0, 5).map((d, i) => (
                <div key={i}>{d.startAge}세~{d.endAge}세: {d.fullName || `${d.stem}${d.branch}`}</div>
              )) || <span className="text-red-400">미계산</span>}
            </div>
          </div>

          <div className="border-t border-green-500/20 pt-2 mt-2">
            <span className="text-yellow-400">2026년 운세:</span>
            <div className="ml-2">
              {submission.sajuData.yeonwoon?.find(y => y.year === 2026) ? (
                <div>{submission.sajuData.yeonwoon.find(y => y.year === 2026)?.fullName || `${submission.sajuData.yeonwoon.find(y => y.year === 2026)?.stem}${submission.sajuData.yeonwoon.find(y => y.year === 2026)?.branch}`}</div>
              ) : <span className="text-red-400">미계산</span>}
            </div>
          </div>
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

      {/* Teaser Facts (Masked) */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="text-foreground/50">Hidden Insights</span>
          <LockIcon className="w-3 h-3 text-muted-foreground" />
        </h2>
        
        <div className="space-y-2">
          {teaserFacts.map((fact, index) => (
            <div 
              key={fact.id}
              className="relative bg-muted border border-border rounded-lg p-3 overflow-hidden"
            >
              <div className="flex gap-2">
                <span className="text-muted-foreground font-bold text-sm">{10 + index}</span>
                <p className="text-foreground/30 text-xs leading-relaxed blur-[6px] select-none">
                  {fact.text}
                </p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <LockIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
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
        <p className="text-xs text-foreground/70 mb-3">
          Discover deep insights about your personality, career path, love life, and future destiny
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-muted-foreground line-through text-xs">$19.99</span>
          <span className="text-xl font-bold text-secondary">$9.99</span>
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
          If you have no PayPal, Credit card payment is also available.<br />
          No PayPal account needed — select &quot;Pay with a Card&quot; in the PayPal window.
        </p>
      </div>
      
      {/* Social Proof */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground mb-1">Trusted by thousands</p>
        <div className="flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">4.9/5 from 2,000+ reviews</p>
      </div>
    </div>
  )
}
