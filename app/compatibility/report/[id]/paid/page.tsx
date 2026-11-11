import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { StarsBackground } from '@/components/stars-background'
import { CompatibilityReportContent } from '@/components/compatibility-report-content'
import { CompatibilityReportLoader } from '@/components/compatibility-report-loader'
import { isScoreBoard } from '@/lib/compat/constants'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

// 궁합 점수 계산 함수 (데이터 기반 - 일관된 결과)
function calculateCompatibilityScore(sajuA: Record<string, unknown>, sajuB: Record<string, unknown>): number {
  let score = 50

  const dayMasterA = (sajuA.dayMaster as string) || ''
  const dayMasterB = (sajuB.dayMaster as string) || ''
  
  // 일간합 체크 (+15점)
  const ilganHapPairs = [['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']]
  if (ilganHapPairs.some(([a, b]) => (dayMasterA === a && dayMasterB === b) || (dayMasterA === b && dayMasterB === a))) {
    score += 15
  }

  // 일지 육합 체크 (+12점)
  const dayBranchA = (sajuA.dayPillar as any)?.branch || ''
  const dayBranchB = (sajuB.dayPillar as any)?.branch || ''
  const yukHapPairs = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]
  if (yukHapPairs.some(([a, b]) => (dayBranchA === a && dayBranchB === b) || (dayBranchA === b && dayBranchB === a))) {
    score += 12
  }

  // 일지 삼합 체크 (+8점)
  const samhapGroups = [['寅', '午', '戌'], ['申', '子', '辰'], ['巳', '酉', '丑'], ['亥', '卯', '未']]
  if (samhapGroups.some(group => group.includes(dayBranchA) && group.includes(dayBranchB))) {
    score += 8
  }

  // 일지충 체크 (-10점)
  const chungPairs = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]
  if (chungPairs.some(([a, b]) => (dayBranchA === a && dayBranchB === b) || (dayBranchA === b && dayBranchB === a))) {
    score -= 10
  }

  // 원진 체크 (-8점)
  const wonjinPairs = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']]
  if (wonjinPairs.some(([a, b]) => (dayBranchA === a && dayBranchB === b) || (dayBranchA === b && dayBranchB === a))) {
    score -= 8
  }

  // 오행 상생 체크 (+5점)
  const dominantA = (sajuA.dominantElement as string) || ''
  const dominantB = (sajuB.dominantElement as string) || ''
  const sangsaeng = [['목', '화'], ['화', '토'], ['토', '금'], ['금', '수'], ['수', '목']]
  if (sangsaeng.some(([a, b]) => (dominantA === a && dominantB === b) || (dominantA === b && dominantB === a))) {
    score += 5
  }

  // 신강/신약 보완 체크 (+5점)
  const gradeA = (sajuA.sinGangSinYak as any)?.grade || ''
  const gradeB = (sajuB.sinGangSinYak as any)?.grade || ''
  if ((gradeA === '신강' && gradeB === '신약') || (gradeA === '신약' && gradeB === '신강')) {
    score += 5
  }

  return Math.max(40, Math.min(95, score))
}

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()
  
  const { data } = await supabase
    .from('compatibility_submissions')
    .select('person_a_name, person_b_name')
    .eq('id', id)
    .single()
  
  const title = data ? `${data.person_a_name} & ${data.person_b_name} - Saju Compatibility` : 'Compatibility Report - Sajume'
  return {
    title,
    description: 'Your complete Saju compatibility analysis report',
    openGraph: { ...sharedOpenGraph, title },
    twitter: { ...sharedTwitter, title },
  }
}

export default async function CompatibilityPaidReportPage({ params }: PageProps) {
  const { id } = await params
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    notFound()
  }
  
  const supabase = createAdminClient()
  
  // Fetch submission, payment, and report data in parallel
  // section_key='compatibility_full' is the only valid paid report
  const [submissionResult, paymentResult, reportResult] = await Promise.all([
    supabase
      .from('compatibility_submissions')
      .select(`
        id,
        person_a_name,
        person_b_name,
        person_a_birth_date,
        person_b_birth_date,
        person_a_saju_data,
        person_b_saju_data
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('compatibility_payments')
      .select('*')
      .eq('submission_id', id)
      .eq('status', 'completed')
      .maybeSingle(),
    supabase
      .from('compatibility_reports')
      .select('facts, score_board')
      .eq('submission_id', id)
      .eq('section_key', 'compatibility_full')
      .maybeSingle()
  ])
  
  if (!submissionResult.data) {
    notFound()
  }
  
  // Payment must be completed to view paid report
  if (!paymentResult.data) {
    redirect(`/compatibility/checkout/${id}`)
  }
  
  // report will be null if not generated yet - client component will handle generation
  const report = reportResult.data
  const submission = submissionResult.data
  
  // Extract day master and relationship type
  const sajuDataA = submission.person_a_saju_data as any || {}
  const sajuDataB = submission.person_b_saju_data as any || {}
  
  // Convert Hanja day master to English
  const hanjaToEnglish: Record<string, string> = {
    '甲': 'Yang Wood', '乙': 'Yin Wood',
    '丙': 'Yang Fire', '丁': 'Yin Fire',
    '戊': 'Yang Earth', '己': 'Yin Earth',
    '庚': 'Yang Metal', '辛': 'Yin Metal',
    '壬': 'Yang Water', '癸': 'Yin Water'
  }
  const dayMasterHanjaA = sajuDataA.dayMaster || ''
  const dayMasterHanjaB = sajuDataB.dayMaster || ''
  const dayMasterA = hanjaToEnglish[dayMasterHanjaA] || dayMasterHanjaA || ''
  const dayMasterB = hanjaToEnglish[dayMasterHanjaB] || dayMasterHanjaB || ''
  
  const sections = Array.isArray(report?.facts) ? report.facts : []

  // Not generated yet (or still generating): the loader starts/polls generation and refreshes when done
  if (sections.length === 0) {
    return (
      <main className="min-h-screen bg-[#0f0a14] relative">
        <StarsBackground />
        <CompatibilityReportLoader submissionId={id} />
      </main>
    )
  }

  // v2 reports carry a score board; v1 reports keep the old derived score
  const scoreBoard = isScoreBoard(report?.score_board) ? report.score_board : null
  const relationshipType = scoreBoard ? '' : sections[sections.length - 1]?.title || ''
  const compatibilityScore = scoreBoard ? null : calculateCompatibilityScore(sajuDataA, sajuDataB)

  return (
    <main className="min-h-screen bg-[#0f0a14] relative">
      <StarsBackground />
        <CompatibilityReportContent
          personAName={submission.person_a_name}
          personBName={submission.person_b_name}
          personABirthDate={submission.person_a_birth_date}
          personBBirthDate={submission.person_b_birth_date}
          personADayMaster={dayMasterA}
          personBDayMaster={dayMasterB}
          relationshipType={relationshipType}
          firstSectionTitle={sections[0]?.title || ''}
          sections={sections}
          submissionId={id}
          compatibilityScore={compatibilityScore}
          scoreBoard={scoreBoard}
        />
    </main>
  )
}
