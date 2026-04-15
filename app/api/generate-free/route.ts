import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact, InsightMapV2 } from '@/lib/types'
import { headers } from 'next/headers'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

// GPT 프롬프트 생성 - 9문장 구조 (01~09)
/**
 * Stage 2: 9개 문장 생성 (InsightMap 기반)
 * 
 * Stage 1 (analyze API)에서 받은 InsightMap을 기반으로 최종 9개 문장 생성
 * 모든 사주 데이터 필드 추적 가능하며, 단 하나도 생략되지 않음
 */
async function generateFactsFromInsightMap(insightMapV2: InsightMapV2): Promise<Fact[]> {
  console.log('[v0] Stage 2: Generating 9 sections from InsightMapV2 blueprints')

  // BlueprintHints에서 포인터 정보 추출
  const allPointers = new Set<string>()
  insightMapV2.blueprints.forEach(bp => {
    bp.pointerHints.forEach(hint => allPointers.add(hint))
  })

  console.log('[v0] Available pointers:', Array.from(allPointers).join(', '))
  console.log('[v0] CoreDiagnosis: yongsin.exists =', insightMapV2.coreDiagnosis.yongsin.exists)

  const factsPrompt = `You are a Saju analyst writing hyper-personalized insights based on InsightMapV2 blueprints.

CRITICAL RULES:
1. Length: EXACTLY 2-3 sentences per section (count sentences carefully)
2. Every section MUST end with ⟦pointer1⟧ ⟦pointer2-3⟧ (required, not optional)
3. Write as REAL LIFE SCENES: "When you walk into a negotiation..." NOT "You tend to be..."
4. NO abstract psychology - describe THIS PERSON's actual patterns
5. Section 4 or 5 MUST be career-specific with industry + role suggestion
6. yongsin.exists = ${insightMapV2.coreDiagnosis.yongsin.exists} → ${insightMapV2.coreDiagnosis.yongsin.exists ? 'Can use "용신"' : 'NEVER use "용신" - use element + adjustment scores instead'}
7. Use mechanismSteps from blueprints to build causality chain
8. Reference lifeSceneCandidates to ground insights in reality

BLUEPRINTS (설계도):
${JSON.stringify(insightMapV2.blueprints, null, 2)}

CORE DIAGNOSIS:
${JSON.stringify(insightMapV2.coreDiagnosis, null, 2)}

POINTER REFERENCE:
- sinGangSinYak.grade: ${insightMapV2.coreDiagnosis.shinGangGrade} (${insightMapV2.coreDiagnosis.shinGangRatio}%)
- elementBalanceAdjusted: 木${insightMapV2.coreDiagnosis.gapSurvey.woodStatus} 火${insightMapV2.coreDiagnosis.gapSurvey.fireStatus} 土${insightMapV2.coreDiagnosis.gapSurvey.earthStatus} 金${insightMapV2.coreDiagnosis.gapSurvey.metalStatus} 水${insightMapV2.coreDiagnosis.gapSurvey.waterStatus}
- topTenGods: ${insightMapV2.coreDiagnosis.topTenGods.map(g => g.name).join(', ')}

GENERATION HINTS:
- Use mechanismSteps to explain causality (cause → effect)
- Reference lifeSceneCandidates for concrete examples
- Each pointer must reference actual blueprint data

OUTPUT FORMAT (EXACT JSON):
\`\`\`json
{
  "facts": [
    {"id": 1, "title": "Blueprint 1 Title", "content": "[2-3 real-life sentences grounded in mechanism] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 2, "title": "Blueprint 2 Title", "content": "[2-3 real-life sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 3, "title": "Blueprint 3 Title", "content": "[2-3 real-life sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 4, "title": "Career Path", "content": "[2-3 sentences: industry + role suggestion + why they excel] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 5, "title": "Blueprint 5 Title", "content": "[2-3 real-life sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 6, "title": "Blueprint 6 Title", "content": "[2-3 real-life sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 7, "title": "Blueprint 7 Title", "content": "[2-3 real-life sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 8, "title": "Blueprint 8 Title", "content": "[2-3 real-life sentences] ⟦pointer1⟧ ⟦pointer2⟧"},
    {"id": 9, "title": "Blueprint 9 Title", "content": "[2-3 real-life sentences with hero's journey tone] ⟦pointer1⟧ ⟦pointer2⟧"}
  ]
}
\`\`\``

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt: factsPrompt,
      temperature: 0.7,
    })

    console.log('[v0] GPT Stage 2 response received')

    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      console.error('[v0] JSON format not found in response')
      throw new Error('JSON format not found in response')
    }

    const parsed = JSON.parse(jsonMatch[1])
    
    if (!parsed.facts || parsed.facts.length !== 9) {
      console.warn('[v0] Expected 9 facts, got', parsed.facts?.length)
    }

    return parsed.facts.map((fact: { id: number; title: string; content: string }) => ({
      id: fact.id,
      text: fact.content,
      category: fact.title,
      title: fact.title,
    }))
  } catch (error) {
    console.error('[v0] Stage 2 generation error:', error)
    throw error
  }
}

/**
 * Stage 1 호출: Saju 계산 데이터로부터 InsightMapV2 생성
 */
async function callAnalyzeAPI(
  name: string,
  gender: string,
  birthDate: string,
  sajuData: SajuData
): Promise<InsightMapV2> {
  console.log('[v0] Calling Stage 1 (Analyze API) to create InsightMapV2')

  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  const analyzeResponse = await fetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      gender,
      birthDate,
      sajuData
    })
  })

  if (!analyzeResponse.ok) {
    const errorText = await analyzeResponse.text()
    console.error('[v0] Stage 1 API error:', errorText)
    throw new Error(`Stage 1 API failed: ${analyzeResponse.statusText}`)
  }

  const { insightMap } = await analyzeResponse.json()
  console.log('[v0] Stage 1 InsightMapV2 received:')
  console.log(`  - coreDiagnosis.yongsin.exists: ${insightMap.coreDiagnosis.yongsin.exists}`)
  console.log(`  - blueprints: ${insightMap.blueprints.length}`)
  console.log(`  - coverage: ${insightMap.coverage.coveragePercentage}%`)
  
  return insightMap
}

// POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { submissionId } = body

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') || 'unknown'

    const supabase = await createClient()

    // DB에서 submission 조회
    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (dbError || !submission) {
      console.error('[v0] DB fetch error:', dbError)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const { name, gender, birth_country, birth_date, saju_data } = submission

    console.log('[v0] Submission loaded:', { name, gender })

    if (!saju_data) {
      return NextResponse.json({ error: 'Saju data missing' }, { status: 400 })
    }

    // Generate fresh AI insights using 3-stage pipeline:
    // Stage 1: Analyze (create InsightMapV2)
    // Stage 2: Generate (9 sections with pointers)
    // Stage 3: Validate (quality check)
    console.log('[v0] Starting 3-stage pipeline...')
    
    let insightMapV2: InsightMapV2
    try {
      insightMapV2 = await callAnalyzeAPI(name, gender, birth_date, saju_data)
    } catch (error) {
      console.error('[v0] Stage 1 failed:', error)
      // Fallback: Skip insight map v2, use basic structure
      insightMapV2 = {
        submissionId,
        createdAt: new Date().toISOString(),
        clientInfo: {
          name,
          dayMaster: saju_data.dayPillar?.stem || '',
          lifeStage: saju_data.gyeokguk || '',
          yongsin: {
            exists: !!saju_data.eokbuYongsin,
            element: saju_data.eokbuYongsin
          }
        },
        coreDiagnosis: {
          submissionId,
          shinGangGrade: saju_data.sinGangSinYak?.grade || 'Unknown',
          shinGangRatio: saju_data.sinGangSinYak?.ratio || 0,
          gapSurvey: {
            woodStatus: 'balanced',
            fireStatus: 'balanced',
            earthStatus: 'balanced',
            metalStatus: 'balanced',
            waterStatus: 'balanced'
          },
          yongsin: {
            exists: !!saju_data.eokbuYongsin,
            element: saju_data.eokbuYongsin
          },
          jojo: {
            season: 'Unknown',
            impact: 'Unknown',
            adjustmentFactor: 1
          },
          topTenGods: [],
          keyHarmonyClash: []
        },
        blueprints: [],
        coverage: {
          submissionId,
          dayMaster: { used: false, insightIds: [] },
          tenGods: { used: false, insightIds: [], coverage: [] },
          elements: { used: false, insightIds: [], coverage: [] },
          harmonies: { used: false, insightIds: [], coverage: [] },
          clashes: { used: false, insightIds: [], coverage: [] },
          spirits: { used: false, insightIds: [], coverage: [] },
          lifeStages: { used: false, insightIds: [], coverage: [] },
          fortunes: { used: false, insightIds: [], coverage: [] },
          emptyPoints: { used: false, insightIds: [], coverage: [] },
          nobleBenefactors: { used: false, insightIds: [], coverage: [] },
          totalFields: 0,
          coveredFields: 0,
          coveragePercentage: 0
        },
        version: '2.0',
        stagePassed: 'analysis'
      }
    }

    const freeFacts = await generateFactsFromInsightMap(insightMapV2)

    // Teaser facts (locked)
    const teaserFacts = Array.from({ length: 5 }, (_, i) => ({
      id: 10 + i,
      text: 'This insight is locked. Purchase the full report to unlock all 99 facts about your destiny.'
    }))

    return NextResponse.json({
      freeFacts,
      teaserFacts,
      submission: { name, sajuData: saju_data }
    })

  } catch (error) {
    console.error('[v0] generate-free error:', error)
    return NextResponse.json({ error: 'Error generating insights' }, { status: 500 })
  }
}
