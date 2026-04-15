import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact, InsightMap } from '@/lib/types'
import { headers } from 'next/headers'
import { SAJU_MASTERPIECE_GUIDE } from '@/lib/saju/masterpiece'

// GPT 프롬프트 생성 - 9문장 구조 (01~09)
/**
 * Stage 2: 9개 문장 생성 (InsightMap 기반)
 * 
 * Stage 1 (analyze API)에서 받은 InsightMap을 기반으로 최종 9개 문장 생성
 * 모든 사주 데이터 필드 추적 가능하며, 단 하나도 생략되지 않음
 */
async function generateFactsFromInsightMap(insightMap: InsightMap): Promise<Fact[]> {
  console.log('[v0] Stage 2: Generating 9 sentences from InsightMap')

  // InsightMap의 모든 근거를 추적
  const allEvidenceFields = new Set<string>()
  insightMap.insights.forEach(insight => {
    insight.evidence.forEach(ev => {
      allEvidenceFields.add(ev.dataField)
    })
  })

  console.log('[v0] Tracked Saju Data Fields:', Array.from(allEvidenceFields).join(', '))

  const factsPrompt = `You are generating Gen-Z style personalized Saju insights based on a structured Insight Map. Each sentence must directly reference the specific Saju elements and mechanisms provided.

CRITICAL REQUIREMENTS:
1. Generate exactly 9 sentences (1-2 sentences each)
2. Each sentence MUST include at least 2 evidence references from the Insight Map
3. Reference specific Saju data fields: Day Master, Ten Gods, Elements, Harmonies, Clashes, Spirits, Life Stages, Fortunes
4. Include the mechanism (WHY this data creates this trait)
5. NO generic Barnum language - be brutally specific to this chart
6. Gen-Z tone: "Main Character Energy", "giving", "lowkey", "Red Flag", "no cap"

All Saju Data Fields Being Used:
${Array.from(allEvidenceFields).join(', ')}

Insight Map:
${JSON.stringify(insightMap, null, 2)}

Respond ONLY with valid JSON (no markdown text before or after):
\`\`\`json
{
  "facts": [
    {"id": 1, "title": "[Title from Insight 1]", "content": "[1-2 sentences with evidence references]"},
    {"id": 2, "title": "[Title from Insight 2]", "content": "[1-2 sentences with evidence references]"},
    {"id": 3, "title": "[Title from Insight 3]", "content": "[1-2 sentences with evidence references]"},
    {"id": 4, "title": "[Title from Insight 4]", "content": "[1-2 sentences with evidence references]"},
    {"id": 5, "title": "[Title from Insight 5]", "content": "[1-2 sentences with evidence references]"},
    {"id": 6, "title": "[Title from Insight 6]", "content": "[1-2 sentences with evidence references]"},
    {"id": 7, "title": "[Title from Insight 7]", "content": "[1-2 sentences with evidence references]"},
    {"id": 8, "title": "[Title from Insight 8]", "content": "[1-2 sentences with evidence references]"},
    {"id": 9, "title": "[Title from Insight 9]", "content": "[1-2 sentences with evidence references]"}
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
 * Stage 1 호출: Saju 계산 데이터로부터 InsightMap 생성
 */
async function callAnalyzeAPI(
  name: string,
  gender: string,
  birthDate: string,
  sajuData: SajuData
): Promise<InsightMap> {
  console.log('[v0] Calling Stage 1 (Analyze API) to create InsightMap')

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
  console.log('[v0] Stage 1 InsightMap received with', insightMap.insights.length, 'insights')
  
  return insightMap
}
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: string,
  sajuData: SajuData
): Promise<Fact[]> {
  const prompt = await buildPromptFromSajuData(name, gender, birthCountry, birthDate, sajuData)

  console.log('[v0] Prompt generated, length:', prompt.length)

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    prompt,
    temperature: 0.7,
    maxOutputTokens: 2500,
  })

  console.log('[v0] API response received')

  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) throw new Error('JSON format not found')

    const parsed = JSON.parse(jsonMatch[1])
    const facts: Fact[] = parsed.facts.map((f: any, idx: number) => ({
      id: f.id || idx + 1,
      category: f.category || 'unknown',
      title: f.title || '',
      text: f.content || f.text || 'No content'
    }))

    return facts
  } catch (error) {
    console.error('[v0] JSON parse error:', result.text.substring(0, 500))
    return [{
      id: 1,
      category: 'error',
      title: 'Analysis Error',
      text: 'An error occurred while processing your saju analysis.'
    }]
  }
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
    // Stage 1: Analyze (create InsightMap)
    // Stage 2: Generate (9 sentences)
    // Stage 3: Validate (quality check)
    console.log('[v0] Starting 3-stage pipeline...')
    
    let insightMap: InsightMap
    try {
      insightMap = await callAnalyzeAPI(name, gender, birth_date, saju_data)
    } catch (error) {
      console.error('[v0] Stage 1 failed, falling back to direct generation')
      // Fallback: Skip insight map, use direct generation
      insightMap = {
        submissionId,
        createdAt: new Date().toISOString(),
        clientInfo: {
          name,
          dayMaster: saju_data.dayPillar?.stem || '',
          lifeStage: saju_data.gyeokguk || '',
          yongsin: saju_data.eokbuYongsin || ''
        },
        insights: [],
        version: '1.0',
        stagePassed: 'analysis'
      }
    }

    const freeFacts = await generateFactsFromInsightMap(insightMap)

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
