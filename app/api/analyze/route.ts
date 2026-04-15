import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'
import type { SajuData, InsightMap, InsightClaim } from '@/lib/types'
import { z } from 'zod'

/**
 * Stage 1: Analysis API
 * Input: saju_data
 * Output: InsightMap (9 insights with full evidence tracking)
 * 
 * This stage generates structured insights with complete saju data traceability.
 * Each insight includes: thesis, evidence (≥2), mechanism, event window, risk, strategy
 * 
 * CRITICAL: No saju data fields are omitted or deleted.
 * All evidence references back to original data field names.
 */

const EvidenceSchema = z.object({
  type: z.enum(['day_master', 'ten_gods', 'element', 'harmony', 'clash', 'spirit', 'life_stage', 'fortune', 'empty_point', 'noble_benefactor', 'other']),
  value: z.string().describe('Specific saju element value'),
  dataField: z.string().describe('Original data field name (for traceability)'),
  explanation: z.string()
})

const MechanismSchema = z.object({
  principle: z.string(),
  sajuRule: z.string(),
  psychologicalImpact: z.string()
})

const InsightClaimSchema = z.object({
  id: z.number(),
  domain: z.enum(['personality', 'career', 'relationship', 'fortune', 'lifestyle']),
  thesis: z.string().describe('Core insight claim'),
  evidence: z.array(EvidenceSchema).min(2).max(5).describe('At least 2 saju data points'),
  mechanism: MechanismSchema,
  eventWindow: z.object({
    type: z.enum(['current', 'next_10_years', 'next_3_years', '2026', 'lifetime']),
    description: z.string()
  }).optional(),
  risk: z.string().optional(),
  strategy: z.string().describe('Actionable micro-habit or strategy'),
  validationScore: z.number().min(0).max(1).optional(),
  isCounterfactualValid: z.boolean().optional()
})

const InsightMapSchema = z.object({
  submissionId: z.string(),
  createdAt: z.string(),
  clientInfo: z.object({
    name: z.string(),
    dayMaster: z.string(),
    lifeStage: z.string(),
    yongsin: z.string()
  }),
  insights: z.array(InsightClaimSchema).length(9),
  version: z.literal('1.0'),
  stagePassed: z.literal('analysis')
})

export async function POST(request: Request) {
  try {
    const { name, sajuData, submissionId } = await request.json()

    if (!sajuData || !submissionId) {
      return NextResponse.json(
        { error: 'Missing required fields: sajuData, submissionId' },
        { status: 400 }
      )
    }

    // 모든 사주 데이터를 정렬된 형식으로 준비 (근거 추적용)
    const allSajuFields = {
      dayMaster: sajuData.dayPillar?.stem || '',
      dayMasterKorean: sajuData.dayMasterKorean || '',
      dayPillar: `${sajuData.dayPillar?.fullName || ''}`,
      lifeStage: sajuData.gyeokguk || '',
      yongsin: sajuData.eokbuYongsin || '',
      energyLevel: sajuData.sinGangSinYak?.grade || '',
      elementBasic: sajuData.elementBalance ? Object.entries(sajuData.elementBalance).map(([k, v]) => `${k}:${v}`).join(', ') : '',
      elementAdjusted: sajuData.elementBalanceAdjusted ? Object.entries(sajuData.elementBalanceAdjusted).map(([k, v]) => `${k}:${v}`).join(', ') : '',
      tenGodsPresent: sajuData.tenGods?.present.join(', ') || 'None',
      tenGodsMissing: sajuData.tenGods?.missing.join(', ') || 'None',
      twelveStars: sajuData.twelveStars?.map(s => `${s.position}:${s.star}`).join(', ') || '',
      cheongganHap: sajuData.cheongganHap?.join(', ') || 'None',
      jijiYughap: sajuData.jijiYughap?.join(', ') || 'None',
      jijiSamhap: sajuData.jijiSamhap?.join(', ') || 'None',
      jijiBanghap: sajuData.jijiBanghap?.join(', ') || 'None',
      cheongganChung: sajuData.cheongganChung?.join(', ') || 'None',
      jijiChung: sajuData.jijiChung?.join(', ') || 'None',
      hyung: sajuData.hyeong?.join(', ') || 'None',
      pa: sajuData.pa?.join(', ') || 'None',
      hae: sajuData.hae?.join(', ') || 'None',
      wonjin: sajuData.wonjin?.join(', ') || 'None',
      gongmang: sajuData.gongmang?.join(', ') || 'None',
      spirits: sajuData.spirits?.join(', ') || '',
      gilseong: sajuData.gilseong ? `cheonul:${sajuData.gilseong.cheonul?.join(',')} taegeuk:${sajuData.gilseong.taegeuk?.join(',')}` : '',
      daewoon: sajuData.daewoon?.map(d => `${d.startAge}-${d.endAge}:${d.fullName}`).join(', ') || '',
      yeonwoon: sajuData.yeonwoon?.map(y => `${y.year}:${y.fullName}`).join(', ') || ''
    }

    const masterpieceGuideStr = JSON.stringify(SAJU_MASTERPIECE_GUIDE, null, 2)

    const analysisPrompt = `You are a Korean fortune-telling (Saju) expert performing STAGE 1: ANALYSIS.

Your task: Generate exactly 9 InsightClaims based on the provided saju data.
Each claim must have MINIMUM 2 DIFFERENT saju data points as evidence.

CRITICAL RULES:
1. PRESERVE ALL SAJU DATA - Every field listed below must be referenced at least once across all 9 claims
2. Each evidence must reference actual dataField names (shown below)
3. Include mechanism (WHY this saju element creates this trait)
4. Every insight must be FALSIFIABLE (would NOT apply to someone with different month branch/yongsin)
5. Use SAJU_MASTERPIECE_GUIDE for interpretation framework

AVAILABLE SAJU DATA (ALL must be used):
${JSON.stringify(allSajuFields, null, 2)}

SAJU_MASTERPIECE_GUIDE REFERENCE:
${masterpieceGuideStr}

GENERATE 9 INSIGHTS with this domain distribution:
- Insight 1-3: personality (character vibe, inner reversal, energy stat)
- Insight 4-6: career + lifestyle (micro-action, social persona, career match)
- Insight 7-9: fortune + destiny (reality check, fortune update, hero's journey)

EXAMPLE EVIDENCE STRUCTURE:
{
  "type": "day_master",
  "value": "甲 (Wood Day Master)",
  "dataField": "dayPillar",
  "explanation": "Wood element 35 points, excess compared to earth"
}

Return VALID JSON matching InsightMapSchema.`

    // GPT-4o로 Structured Output 생성
    const { object: insightMap } = await generateObject({
      model: 'openai/gpt-4o-mini',
      schema: InsightMapSchema,
      prompt: analysisPrompt,
      system: `You are a Saju analysis expert. Respond ONLY with valid JSON matching the schema.
All evidence dataFields must match the provided saju field names.
No data fields should be left unused.`
    })

    console.log(`[v0] Analysis complete: ${insightMap.insights.length} insights generated`)
    console.log(`[v0] Saju fields used: ${new Set(insightMap.insights.flatMap(i => i.evidence.map(e => e.dataField))).size} unique fields`)

    return NextResponse.json(insightMap)
  } catch (error) {
    console.error('[v0] Analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze saju data', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
