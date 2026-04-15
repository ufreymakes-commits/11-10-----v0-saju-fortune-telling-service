import { NextResponse } from 'next/server'
import type { ValidatedFact, ValidatedReport } from '@/lib/types'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

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
 * Masterpiece Guide 일치도 검증
 * SAJU_MASTERPIECE_GUIDE의 내용과 생성된 문장이 부합하는가?
 * 
 * 검사 항목:
 * 1. Gen Z 톤 사용: "giving", "lowkey", "main character energy", "no cap", "Red Flag" 등
 * 2. 메커니즘 설명: 왜 이 사주 요소가 이 성질을 만드는가? (abstract 해석 금지)
 * 3. 섹션별 가이드라인 준수: 일간/십신/오행/합충/신살 등 정확히 사용
 * 4. Barnum 필터: 일반적인 표현 제거
 */
function validateMasterpieceAlignment(
  fact: { id: number; title: string; content: string },
  evidenceTypes: string[]
): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 100

  // 1. Gen Z 톤 확인
  const genZTones = ['giving', 'lowkey', 'main character', 'no cap', 'red flag', 
                     'vibe', 'chills', 'energy', 'literally', 'honestly', 'facts']
  const hasGenZTone = genZTones.some(tone => fact.content.toLowerCase().includes(tone))
  
  if (!hasGenZTone && evidenceTypes.length > 0) {
    issues.push('Gen Z tone not prominent')
    score -= 10
  }

  // 2. 구체적인 사주 요소 언급 확인
  const specificElements = ['master', 'god', 'element', 'harmony', 'clash', 'spirit', 'stage', 'fortune']
  const hasSajuElements = specificElements.some(elem => fact.content.toLowerCase().includes(elem))
  
  if (!hasSajuElements && evidenceTypes.length > 0) {
    issues.push('Missing specific Saju elements reference')
    score -= 15
  }

  // 3. 메커니즘/원인 설명 확인 ("because", "이유는", "따라서" 등)
  const mechanismKeywords = ['because', '때문에', '이유로', '따라서', '결과', 'due to', 'as a result']
  const hasMechanism = mechanismKeywords.some(kw => fact.content.toLowerCase().includes(kw))
  
  if (!hasMechanism && evidenceTypes.length >= 2) {
    issues.push('Mechanism/explanation missing - too abstract')
    score -= 20
  }

  // 4. Barnum 키워드 재확인
  const barnumTerms = ['sometimes', 'may', 'can be', 'adaptable', 'both', 'sensitive']
  const hasBarnum = barnumTerms.some(term => fact.content.toLowerCase().includes(term))
  
  if (hasBarnum) {
    issues.push('Barnum effect detected - too generic')
    score -= 25
  }

  // 5. 섹션별 가이드라인 검증
  // Section 1-3: 성격/심리 → day_master, ten_gods 필수
  if (fact.id <= 3 && !evidenceTypes.includes('day_master') && !evidenceTypes.includes('ten_gods')) {
    issues.push('Section 1-3: missing day_master or ten_gods')
    score -= 10
  }

  // Section 4-6: 경력/사회역할 → element, harmony/clash, career 데이터 필수
  if (fact.id >= 4 && fact.id <= 6) {
    const hasCareerEvidence = evidenceTypes.includes('element') || 
                             evidenceTypes.includes('harmony') || 
                             evidenceTypes.includes('clash')
    if (!hasCareerEvidence) {
      issues.push('Section 4-6: missing career-related evidence')
      score -= 10
    }
  }

  // Section 7-9: 운세/미래 → fortune, life_stage 필수
  if (fact.id >= 7) {
    const hasFortuneEvidence = evidenceTypes.includes('fortune') || 
                              evidenceTypes.includes('life_stage')
    if (!hasFortuneEvidence) {
      issues.push('Section 7-9: missing fortune/life_stage evidence')
      score -= 10
    }
  }

  return {
    score: Math.max(0, score),
    issues
  }
}

/**
 * Masterpiece Guide 데이터 활용도 검증
 * 생성된 9개 문장이 SAJU_MASTERPIECE_GUIDE의 어떤 부분을 활용했는가?
 */
function trackMasterpieceUsage(facts: ValidatedFact[]): {
  modulesUsed: string[]
  keyConceptsReferenced: string[]
} {
  const modulesUsed = new Set<string>()
  const keyConceptsReferenced = new Set<string>()

  const contentJoined = facts.map(f => f.content).join(' ')

  // masterpiece.ts의 주요 모듈 추적
  const masterpiececModules = Object.keys(SAJU_MASTERPIECE_GUIDE)
    .filter(key => typeof SAJU_MASTERPIECE_GUIDE[key as keyof typeof SAJU_MASTERPIECE_GUIDE] === 'object')

  masterpiececModules.forEach(module => {
    const moduleContent = JSON.stringify(SAJU_MASTERPIECE_GUIDE[module as keyof typeof SAJU_MASTERPIECE_GUIDE])
    if (contentJoined.toLowerCase().includes(module.replace(/_/g, ' '))) {
      modulesUsed.add(module)
    }
  })

  // 핵심 개념 추적
  const keyPhrases = [
    'gen z',
    'main character',
    'microaction',
    'remedy',
    'life stage',
    'element',
    'noble benefactor',
    'hero journey'
  ]

  keyPhrases.forEach(phrase => {
    if (contentJoined.toLowerCase().includes(phrase)) {
      keyConceptsReferenced.add(phrase)
    }
  })

  return {
    modulesUsed: Array.from(modulesUsed),
    keyConceptsReferenced: Array.from(keyConceptsReferenced)
  }
}
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
      
      // Masterpiece 일치도 검증 추가
      const masterpieceAlignment = validateMasterpieceAlignment(fact, evidenceTypes)

      return {
        id: fact.id,
        title: fact.title,
        content: fact.content,
        evidenceCount: evidenceTypes.length,
        dataDensityScore: Math.round(ddt),
        counterfactualValid: isCounterfactual,
        qualityFlags: [
          ...(!isCounterfactual ? ['Too generic / Barnum effect detected'] : []),
          ...(masterpieceAlignment.issues)
        ],
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

    // Masterpiece 가이드라인 활용도 추적
    const masterpieceUsage = trackMasterpieceUsage(validatedFacts)

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
      masterpieceModulesUsed: masterpieceUsage.modulesUsed,
      keyConceptsReferenced: masterpieceUsage.keyConceptsReferenced,
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
