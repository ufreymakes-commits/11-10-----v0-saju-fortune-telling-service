import { NextResponse } from 'next/server'
import type { ValidatedFact, ValidatedReport } from '@/lib/types'

/**
 * Stage 3: 검증 API (Validation Pipeline)
 * 
 * 목표:
 * 1. DDT (Data Density Test): 천간/십신/오행/합충 중 2개 이상 포함?
 * 2. Counterfactual Test: 다른 월지/용신도 이 주장이 성립하나?
 * 3. 품질 필터: Barnum 효과 제거
 * 
 * 입력: 9개 생성된 문장 + InsightMap (근거)
 * 출력: ValidatedReport (검증 통과한 9개 문장 + 메타데이터)
 */

interface ValidationRequest {
  submissionId: string
  facts: Array<{
    id: number
    title: string
    content: string
    insightId?: number
  }>
  insightMap: {
    insights: Array<{
      id: number
      evidence: Array<{ type: string; value: string; dataField: string }>
      thesis: string
    }>
  }
}

/**
 * DDT (Data Density Test)
 * 사주 데이터가 충분히 포함되었는가?
 * - 천간(Day Master): 1점
 * - 십신(Ten Gods): 1점
 * - 오행(Element): 1점
 * - 합충(Harmony/Clash): 1점
 * - 기타(Spirit, Life Stage, Fortune): 0.5점
 * 
 * 기준: 2점 이상이면 통과 (2개 이상의 다른 사주 요소 포함)
 */
function calculateDataDensityScore(evidenceTypes: string[]): number {
  const typeScores: Record<string, number> = {
    'day_master': 1,
    'ten_gods': 1,
    'element': 1,
    'harmony': 1,
    'clash': 1,
    'spirit': 0.5,
    'life_stage': 0.5,
    'fortune': 0.5,
    'empty_point': 0.5,
    'noble_benefactor': 0.5,
    'other': 0.25,
  }

  let totalScore = 0
  const uniqueTypes = new Set<string>()

  for (const type of evidenceTypes) {
    uniqueTypes.add(type)
    totalScore += typeScores[type] || 0
  }

  // 정규화: 0-100 범위로 변환
  const normalizedScore = Math.min((totalScore / 3) * 100, 100)
  
  return normalizedScore
}

/**
 * 반사실 테스트 (Counterfactual Test)
 * 이 주장이 "특정 월지/용신"에만 해당하나, 아니면 일반적인가?
 * 
 * 고유성 점수:
 * - 특정 일간: 높음 (고유)
 * - 특정 십신 조합: 높음 (고유)
 * - 일반적인 오행 특성: 낮음 (Barnum)
 */
function isCounterfactualValid(thesis: string, evidenceTypes: string[]): boolean {
  // Barnum 효과 키워드 (너무 일반적인 표현)
  const barnum_keywords = [
    'sometimes', 'may have', 'tend to', 'can be',
    'good at both', 'like balance', 'sensitive', 'caring',
    'sometimes outgoing', 'sometimes quiet', 'adaptable',
  ]

  // 반복 확인
  const hasBarnumKeywords = barnum_keywords.some(kw => thesis.toLowerCase().includes(kw))
  
  // 고유성 확인: 일간(day_master) 또는 십신(ten_gods) 또는 특정 합충(harmony/clash) 포함?
  const hasUniqueEvidence = evidenceTypes.includes('day_master') ||
                           evidenceTypes.includes('ten_gods') ||
                           (evidenceTypes.includes('harmony') && evidenceTypes.length >= 2) ||
                           (evidenceTypes.includes('clash') && evidenceTypes.length >= 2)

  // 통과 조건: Barnum 없고, 고유 근거 있음
  return !hasBarnumKeywords && hasUniqueEvidence
}

export async function POST(request: Request) {
  try {
    const body: ValidationRequest = await request.json()

    const { submissionId, facts, insightMap } = body

    if (!facts || facts.length !== 9) {
      return NextResponse.json(
        { error: '정확히 9개의 문장이 필요합니다' },
        { status: 400 }
      )
    }

    // 검증된 9개 문장 생성
    const validatedFacts: ValidatedFact[] = facts.map((fact, index) => {
      const relatedInsight = insightMap.insights.find(i => i.id === fact.insightId || i.id === index + 1)
      const evidenceTypes = relatedInsight?.evidence.map(e => e.type) || []
      const dataFields = relatedInsight?.evidence.map(e => e.dataField) || []

      const ddt = calculateDataDensityScore(evidenceTypes)
      const isCounterfactual = isCounterfactualValid(fact.content, evidenceTypes)

      return {
        id: fact.id,
        title: fact.title,
        content: fact.content,
        evidenceCount: evidenceTypes.length,
        dataDensityScore: Math.round(ddt),
        counterfactualValid: isCounterfactual,
        qualityFlags: !isCounterfactual ? ['Too generic / Barnum effect detected'] : [],
        trackedEvidence: dataFields,
      }
    })

    // 전체 통계
    const totalDataDensityScore = Math.round(
      validatedFacts.reduce((sum, f) => sum + f.dataDensityScore, 0) / 9
    )

    const allCounterfactualValid = validatedFacts.every(f => f.counterfactualValid)

    const passedQualityGate = totalDataDensityScore >= 60 && allCounterfactualValid

    // 사용된 모든 사주 필드명 추출 (중복 제거)
    const uniqueDataFields = Array.from(
      new Set(validatedFacts.flatMap(f => f.trackedEvidence))
    )

    const report: ValidatedReport = {
      submissionId,
      facts: validatedFacts,
      totalDataDensityScore,
      allCounterfactualValid,
      passedQualityGate,
      totalEvidenceUsed: validatedFacts.reduce((sum, f) => sum + f.evidenceCount, 0),
      uniqueDataFields,
      createdAt: new Date().toISOString(),
      stagePassed: 'validation',
    }

    console.log('[v0] Validation Report:', {
      submissionId,
      totalDDT: report.totalDataDensityScore,
      counterfactualValid: report.allCounterfactualValid,
      passedQualityGate: report.passedQualityGate,
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('[v0] Validation error:', error)
    return NextResponse.json(
      { error: '검증 중 오류 발생' },
      { status: 500 }
    )
  }
}
