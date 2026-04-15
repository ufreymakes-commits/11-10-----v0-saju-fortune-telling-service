import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'
import type { SajuData, InsightMapV2, CoreDiagnosisPack, InsightBlueprint, CoverageMap } from '@/lib/types'
import { z } from 'zod'

/**
 * Stage 1: Analysis API (v2)
 * Input: saju_data
 * Output: InsightMapV2 (CoreDiagnosisPack + 9 InsightBlueprints + CoverageMap)
 * 
 * This stage generates:
 * 1. CoreDiagnosisPack: 신강/격/용신 핵심 3지표
 * 2. InsightBlueprint[9]: 각 인사이트의 설계도 (본문이 아니라 청사진)
 * 3. CoverageMap: 모든 사주 필드 감시 (audit 목적)
 * 
 * 핵심: 본문 강제가 아니라 audit으로 모든 데이터 포함 확인
 */

const MechanismStepSchema = z.object({
  step: z.number(),
  cause: z.string(),
  effect: z.string(),
  dataPointer: z.string(),
  generationHint: z.string()
})

const LifeSceneCandidateSchema = z.object({
  domain: z.enum(['career', 'relationship', 'mobility', 'finance', 'social', 'health']),
  scenario: z.string(),
  expectedBehavior: z.string(),
  counterfactualBreaker: z.string().optional()
})

const EvidenceSchema = z.object({
  type: z.string(),
  value: z.string(),
  dataField: z.string()
})

const InsightBlueprintSchema = z.object({
  id: z.number(),
  domain: z.enum(['personality', 'career', 'relationship', 'fortune', 'lifestyle']),
  thesis: z.string(),
  mechanismSteps: z.array(MechanismStepSchema).min(2).max(4),
  lifeSceneCandidates: z.array(LifeSceneCandidateSchema).min(1).max(2),
  mustUseEvidence: z.array(EvidenceSchema).min(2).max(3),
  counterfactualKey: z.string(),
  pointerHints: z.array(z.string()).min(2).max(4),
  yongsinNote: z.string().optional()
})

const CoreDiagnosisPackSchema = z.object({
  submissionId: z.string(),
  shinGangGrade: z.string(),
  shinGangRatio: z.number(),
  gapSurvey: z.object({
    woodStatus: z.enum(['excess', 'balanced', 'deficient']),
    fireStatus: z.enum(['excess', 'balanced', 'deficient']),
    earthStatus: z.enum(['excess', 'balanced', 'deficient']),
    metalStatus: z.enum(['excess', 'balanced', 'deficient']),
    waterStatus: z.enum(['excess', 'balanced', 'deficient'])
  }),
  yongsin: z.object({
    exists: z.boolean(),
    element: z.string().optional(),
    rationale: z.string().optional(),
    alternatives: z.array(z.string()).optional()
  }),
  jojo: z.object({
    season: z.string(),
    impact: z.string(),
    adjustmentFactor: z.number()
  }),
  topTenGods: z.array(z.object({
    name: z.string(),
    strength: z.enum(['strong', 'moderate', 'weak']),
    role: z.string()
  })).min(1),
  keyHarmonyClash: z.array(z.object({
    type: z.enum(['harmony', 'clash']),
    pillars: z.string(),
    implication: z.string()
  }))
})

const CoverageMapSchema = z.object({
  submissionId: z.string(),
  dayMaster: z.object({ used: z.boolean(), insightIds: z.array(z.number()) }),
  tenGods: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  elements: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  harmonies: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  clashes: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  spirits: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  lifeStages: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  fortunes: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  emptyPoints: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  nobleBenefactors: z.object({ used: z.boolean(), insightIds: z.array(z.number()), coverage: z.array(z.string()) }),
  totalFields: z.number(),
  coveredFields: z.number(),
  coveragePercentage: z.number()
})

const InsightMapV2Schema = z.object({
  submissionId: z.string(),
  createdAt: z.string(),
  clientInfo: z.object({
    name: z.string(),
    dayMaster: z.string(),
    lifeStage: z.string(),
    yongsin: z.object({
      exists: z.boolean(),
      element: z.string().optional()
    })
  }),
  coreDiagnosis: CoreDiagnosisPackSchema,
  blueprints: z.array(InsightBlueprintSchema).length(9),
  coverage: CoverageMapSchema,
  version: z.literal('2.0'),
  stagePassed: z.literal('analysis')
})

export async function POST(request: Request) {
  try {
    const { name, gender, birthDate, sajuData, submissionId } = await request.json()

    if (!sajuData || !submissionId) {
      return NextResponse.json(
        { error: 'Missing required fields: sajuData, submissionId' },
        { status: 400 }
      )
    }

    const masterpieceGuideStr = JSON.stringify(SAJU_MASTERPIECE_GUIDE, null, 2)

    const allSajuFields = {
      dayMaster: sajuData.dayPillar?.stem || '',
      dayPillarFull: sajuData.dayPillar?.fullName || '',
      lifeStage: sajuData.gyeokguk || '',
      yongsin: sajuData.eokbuYongsin || '',
      shinGang: sajuData.sinGangSinYak?.grade || '',
      shinGangRatio: sajuData.sinGangSinYak?.ratio || 0,
      elementBasic: sajuData.elementBalance ? JSON.stringify(sajuData.elementBalance) : '',
      elementAdjusted: sajuData.elementBalanceAdjusted ? JSON.stringify(sajuData.elementBalanceAdjusted) : '',
      tenGodsPresent: sajuData.tenGods?.present.join(', ') || '',
      tenGodsMissing: sajuData.tenGods?.missing.join(', ') || '',
      twelveStars: sajuData.twelveStars?.map(s => `${s.position}:${s.star}`).join(', ') || '',
      harmonies: [sajuData.cheongganHap, sajuData.jijiYughap, sajuData.jijiSamhap, sajuData.jijiBanghap].filter(Boolean).flat().join(', '),
      clashes: [sajuData.cheongganChung, sajuData.jijiChung].filter(Boolean).flat().join(', '),
      spirits: sajuData.spirits?.join(', ') || '',
      gongmang: sajuData.gongmang?.join(', ') || '',
      daewoon: sajuData.daewoon?.map(d => `${d.startAge}-${d.endAge}:${d.fullName}`).slice(0, 3).join(', ') || '',
      yeonwoon2026: sajuData.yeonwoon?.find(y => y.year === 2026)?.fullName || ''
    }

    const analysisPrompt = `You are a Saju expert performing STAGE 1: Analysis (v2).

CRITICAL: You MUST generate EXACTLY 9 InsightBlueprints. No more, no less.

TASK: Generate InsightMapV2 with 3 components:
1. CoreDiagnosisPack: 신강/격/용신 핵심 진단 (3개 지표)
2. InsightBlueprint[9]: EXACTLY 9개 인사이트 설계도 (본문 아님, 청사진)
   - ID 1-3: Personality (character, inner self, energy)
   - ID 4-6: Career & Lifestyle (action, social, career)
   - ID 7-9: Fortune & Destiny (reality check, season, hero's journey)
3. CoverageMap: 모든 사주 필드 감시 (audit용)

KEY RULES:
1. blueprints 배열의 길이는 반드시 9 (JSON에 id: 1~9인 항목 정확히 9개)
2. CoreDiagnosisPack의 yongsin.exists는 정확히 판단 (false면 Stage 2에서 용신 단어 금지)
3. InsightBlueprint는 "thesis + mechanismSteps(2-4개) + lifeSceneCandidates(1-2개) + mustUseEvidence(2-3개)"로 구성
4. lifeSceneCandidates는 반드시 현실 장면 (직업/관계/이동 등)
5. CoverageMap에서 모든 saju 필드 포함도 확인

SAJU DATA:
${JSON.stringify(allSajuFields, null, 2)}

GUIDE:
${masterpieceGuideStr.substring(0, 5000)}...

VALIDATION:
- blueprints.length === 9 (MUST be exactly 9)
- All blueprint.id values from 1 to 9
- No duplicates in blueprint IDs`

    const { object: insightMapV2 } = await generateObject({
      model: 'openai/gpt-4o-mini',
      schema: InsightMapV2Schema,
      prompt: analysisPrompt,
      system: 'You are a Saju analysis expert. Generate InsightMapV2 with CoreDiagnosisPack, 9 Blueprints, and CoverageMap. Respond ONLY with valid JSON.'
    })

    console.log(`[v0] Stage 1 Analysis complete:`)
    console.log(`  - CoreDiagnosis: yongsin.exists = ${insightMapV2.coreDiagnosis.yongsin.exists}`)
    console.log(`  - 9 Blueprints generated`)
    console.log(`  - Coverage: ${insightMapV2.coverage.coveragePercentage}% (${insightMapV2.coverage.coveredFields}/${insightMapV2.coverage.totalFields} fields)`)

    return NextResponse.json({ insightMap: insightMapV2 })
  } catch (error) {
    console.error('[v0] Analysis API error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] Error details:', errorMsg)
    
    return NextResponse.json(
      { error: 'Failed to analyze saju data', details: errorMsg },
      { status: 500 }
    )
  }
}
