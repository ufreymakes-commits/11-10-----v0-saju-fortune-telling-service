import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

// ================================================================
// STAGE 1: Build complete allSajuData (99 facts와 동일하게)
// ================================================================
function buildAllSajuData(
  personAName: string,
  personBName: string,
  sajuDataA: Record<string, unknown>,
  sajuDataB: Record<string, unknown>
) {
  const formatSajuData = (name: string, saju: Record<string, unknown>) => {
    // 99 facts의 allSajuData 구조와 동일하게 구성
    return {
      name,
      // 기본 정보
      birthDate: saju.birthDate || '',
      
      // 4주 (천간/지지)
      fourPillars: saju.fourPillars || {},
      
      // 일간 (중요)
      dayMaster: (saju.dayPillar as any)?.stem || '',
      dayMasterKorean: saju.dayMasterKorean || '',
      
      // 격국
      lifeStage: saju.gyeokguk || '',
      
      // 신강/신약
      energyGrade: (saju.sinGangSinYak as any)?.grade || '',
      energyRatio: (saju.sinGangSinYak as any)?.ratio || 0,
      
      // 오행 개수
      elementCountBasic: saju.elementCountBasic || {},
      elementCountWithHidden: saju.elementCount || {},
      
      // 오행 점수
      elementScore: saju.elementBalanceKorean || {},
      dominantElement: saju.dominantElement || '',
      
      // 십신
      tenGodsPresent: (saju.tenGods as any)?.present || [],
      tenGodsMissing: (saju.tenGods as any)?.missing || [],
      tenGodsCounts: saju.tenGodsCounts || {},
      tenGodsByPosition: (saju.tenGods as any)?.byPosition || {},
      
      // 12운성
      twelveStars: saju.twelveStars || [],
      
      // 관계식
      harmonies: {
        cheongganHap: saju.cheongganHap || [],
        jijiYughap: saju.jijiYughap || [],
        jijiSamhap: saju.jijiSamhap || [],
        jijiBanghap: saju.jijiBanghap || []
      },
      
      clashes: {
        cheongganChung: saju.cheongganChung || [],
        jijiChung: saju.jijiChung || []
      },
      
      hyeong: saju.hyeong || [],
      pa: saju.pa || [],
      hae: saju.hae || [],
      wonjin: saju.wonjin || [],
      
      // 길성
      gilseong: saju.gilseong || {},
      
      // 공망
      gongmang: saju.gongmang || [],
      
      // 신살
      spirits: saju.spirits || [],
      sinsalDetails: saju.sinsalDetails || [],
      sinsalSummary: saju.sinsalSummary || '',
      sinsalCombinedGuide: saju.sinsalCombinedGuide || '',
      
      // 12신살
      twelveSinsalByYearBranch: saju.twelveSinsalByYearBranch || {},
      twelveSinsalByDayBranch: saju.twelveSinsalByDayBranch || {},
      
      // 용신
      yongsin: saju.yongsin || { eokbu: 'None', johu: 'None', exists: false },
      
      // 대운
      daewoon: saju.daewoon || [],
      
      // 연운
      yeonwoon: saju.yeonwoon || { current2026: 'N/A', allYears: [] },
      
      // 합충 정보
      hapChungSummary: saju.hapChungSummary || '',
      hapChungAdjustmentDetails: saju.hapChungAdjustmentDetails || []
    }
  }

  return {
    personA: formatSajuData(personAName, sajuDataA),
    personB: formatSajuData(personBName, sajuDataB)
  }
}

// ================================================================
// Gemini helper - AI SDK 사용 (generate-gemini와 동일)
// ================================================================
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const result = await generateText({
    model: 'google/gemini-2-flash',
    system: systemPrompt,
    prompt: userPrompt,
    temperature: options?.temperature ?? 0,
    maxTokens: options?.maxTokens ?? 3000
  })
  return result.text
}

// ================================================================
// Main route
// ================================================================
export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json()
    if (!submissionId) return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })

    const supabase = await createClient()

    // 1. Check payment is completed
    const { data: payment, error: paymentError } = await supabase
      .from('compatibility_payments')
      .select('status')
      .eq('submission_id', submissionId)
      .eq('status', 'completed')
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 403 })
    }

    // 2. Check if report already exists
    const { data: existingReport } = await supabase
      .from('compatibility_reports')
      .select('id, facts')
      .eq('submission_id', submissionId)
      .single()

    if (existingReport?.facts) {
      return NextResponse.json({ success: true, reportId: existingReport.id })
    }

    // 3. Fetch submission data
    const { data: submission, error: subError } = await supabase
      .from('compatibility_submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // 4. Stage 1: Build context interpretation (~2500 chars)
    const allSajuData = buildAllSajuData(
      submission.person_a_name,
      submission.person_b_name,
      submission.person_a_saju_data || {},
      submission.person_b_saju_data || {}
    )

    console.log('[v0] Compatibility: ===== COMPLETE SAJU DATA FOR STAGE 1 & 2 =====')
    console.log('[v0] Compatibility:', JSON.stringify(allSajuData, null, 2))
    console.log('[v0] Compatibility: ====================================================')

    const stage1SystemPrompt = `👑 [최종 Prompt Instruction: 궁합 실전 해석 - 심화 업데이트본]
1. 데이터 전처리 (오행 궁합 및 십성 치환)
오행 구족 확인: Person A와 B의 elementBalanceWithHiddenStems를 합산하여 5가지 오행(목, 화, 토, 금, 수)이 모두 갖춰지는지(최소 4개 이상) 확인한다.

시너지 궁합 (결핍 보완): A에게 부족한 오행(10점 미만 또는 0점)을 B가 풍부하게 가지고 있다면, 이를 '운의 균형이 맞춰지는 시너지 궁합'으로 정의한다.

보완 오행의 십성 해석: B가 채워주는 오행이 A의 tenGods(십성) 중 무엇에 해당하는지 도출하여 관계의 성격을 규명한다. (비겁: 주체성, 식상: 표현력, 재성: 경제관념, 관성: 안정감, 인성: 심리적 수용)

2. 구조적 매칭 (겉궁합 및 속궁합 정밀 검출)
겉궁합 (일간 천간합 및 배합 분석): A와 B의 일간(Day Master) 조합을 표의 기준에 따라 분석한다.

대길(大吉) - 정배합(정) & 편배합(편): 천간합이 성립하는 최고의 조합이다.

정배합(음양의 조화): 남갑+여기, 남병+여신, 남무+여계, 남경+여을, 남임+여정. (안정적이고 이상적인 결합)

편배합(강한 인력): 남을+여경, 남정+여임, 남기+여갑, 남신+여병, 남계+여무. (다이나믹하고 강렬한 끌림)

대흉(大凶) - 상극(극) 조합: 서로의 에너지를 심하게 억눌러 갈등이 깊은 조합이다.

조합: 남을+여신, 남병+여임, 남정+여계, 남무+여갑, 남기+여을, 남경+여병, 남신+여정, 남임+여무, 남계+여기.

해석: "성격 차이가 극명하며 서로에게 상처를 주기 쉬운 조합"으로 분류하고 주의를 당부한다.

해석 가이드: "대길 조합은 첫눈에 반하거나 대화가 막힘없이 통하는 사이"이나, 운이 나쁠 때는 소유욕과 집착으로 변할 수 있음을 경고한다.

속궁합 (일지 육합 및 삼합): 일지는 '배우자궁'을 의미하며, 육합(자축, 인해 등)과 삼합(인오술 등)을 통해 정서적 깊이와 에너지의 시너지를 확인한다.

3. 힐러 로직 (상호 구원 및 충돌 방어 체계)
상호 보완성 점수: B의 dominantElement(월지 중심)가 A의 취약 오행을 보완하면서 동시에 A의 yongsin(용신)인지 확인하여 점수화한다.

띠 궁합 (지지 충): 띠끼리 충(자오충, 묘유충 등)이 발생할 경우, "강렬한 스파크는 있으나 현실적인 부딪힘이 잦을 수 있음"을 경고한다.

복제 인간 리스크: 동일한 일주(예: 둘 다 庚申)일 경우, 운의 흐름이 같아 동반 하락할 위험을 고지하고 '다름의 미학'을 강조한다.

4. 성격 동기화 (가치관 및 일상 실전 팁)
도화로운 육합 실전 가이드:

자축/오미: 비슷함에 끌림. 천천히 스며들 것.

인해: 금사빠 조합. 기브앤테이크 필수.

묘술: 다름에 끌림. 상호 영역 존중 필수.

진유: 일상 침범 주의. 전략적 거리두기 권장.

사신: 능력에 매료됨. 공동의 목표 설정 필수.

가치관 분석: 월지(사회적 면모)와 일지(개인적 면모) 간의 형/충/파/해를 통해 가치관 일치도를 판별한다.

5. 운명의 파동 (대운 동기화)
운의 동기화율: 향후 30년 대운을 비교하여 한 명의 하락기를 다른 한 명이 보완할 수 있는지 퍼센트(%)로 제시한다.

6. 종합 결론 및 현실 개운법
궁합 정의: [소울메이트형 / 상호보완형 / 노력필요형 / 카르마형] 중 하나로 정의한다.

현실 점검: "사주 궁합이 대길(大吉)이어도 배려가 없으면 무용지물이며, 대흉(大凶)이어도 서로의 다름을 인정하면 극복 가능하다"는 도화로운식 현실 조언을 덧붙인다.

맞춤 개운 솔루션: 상대의 풍부한 오행을 활용해 내 삶의 어떤 영역(공부/재물/정서 등)을 확장할 수 있는지 구체적인 액션 플랜을 제시한다.

7. 필수 : 이 둘의 관계가 이 4가지 중 어떤 유형인지 [소울메이트형 / 상호보완형 / 노력필요형 / 카르마형] 중 최종 타입을 확정하고 명확하게 작성합니다.
`

    const stage1UserPrompt = `두 사람의 사주 데이터를 확인한 후 아래 3500 글자의 해설지를 작성하라. 3번부터는 [최종 Prompt Instruction: 궁합 실전 해석 - 심화 업데이트본] 을 참고해서 작성하라.

    1. 두 사람의 사주 데이터를 보며 기본적인 사주의 특징과 성향 이해
    2. 두 사람의 구체적인 사주 분석 (사주팔자, 일간, 월지, 격국, 오행, 십신, 신살, 신강/신약 등 종체적인 두 사람의 개개인 사주 해석)
    3. 데이터 전처리 (오행 궁합 및 십성 치환)
    4. 구조적 매칭 (겉궁합 및 속궁합 정밀 검출)
    5. 힐러 로직 (상호 구원 및 충돌 방어 체계)
    6. 성격 동기화 (가치관 및 일상 실전 팁)
    7. 운명의 파동 (대운 동기화) 참고; 1990-2030 Ganji: 庚午,辛未,壬申,癸酉,甲戌,乙亥,丙子,丁丑,戊寅,己卯,庚辰,辛巳,壬午,癸未,甲申,乙酉,丙戌,丁亥,戊子,己丑,庚寅,辛卯,壬辰,癸巳,甲午,乙未,丙申,丁酉,戊戌,己亥,庚子,辛丑,壬寅,癸卯,甲辰,乙巳,丙午,丁未,戊申,己酉,庚戌
    8. 종합 결론 및 현실 개운법

Compatibility Chart Data (Complete Saju Information):
${JSON.stringify(allSajuData, null, 2)}`

    const contextInterpretation = await callGemini(stage1SystemPrompt, stage1UserPrompt, {
      temperature: 0,
      maxTokens: 3000
    })

    // Save stage 1 result
    const { data: reportRow, error: insertError } = await supabase
      .from('compatibility_reports')
      .insert({
        submission_id: submissionId,
        section_key: 'compatibility_full',
        context_interpretation: contextInterpretation,
        is_paid: true,
      })
      .select('id')
      .single()

    if (insertError || !reportRow) {
      console.error('[v0] Compatibility report insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save report context' }, { status: 500 })
    }

    // 5. Stage 2: Generate structured report sections from Stage 1 context
    const stage2SystemPrompt = `2명의 고객 사주 데이터를 각각 확인하고, 1단계에서 작성한 3500자 해설지를 확인하라. 너는 최고의 현대 사주 명리학 전문 사주 해설가이다. 문장을 쓸 때, 늘 임팩트있고 구체적으로 지침하려 하며, 두루뭉실보다는 눈에 보이는 현상, 들리는 말의 현상 등, 고객들이 직접 일상생활에서 마주하는 일들을 기반으로 해설을 하는 경향이 있다. 20-30대 젊은 고객들이 이해할 수 있도록 따끔하고 정확하고 친절하면서도, 읽는 사람이 너무 무섭거나 부정적으로 생각하지 않도록 긍정적인 방향의 개운법이나 더 나아질 수 있또록 위안과 위로 감동을 주는 것을 목표로 한다. `

    const stage2UserPrompt = `두 사람을 위한 사주 궁합 레포트를 만들어라. 각각 7개의 섹션으로 이루어진 주제에 따라 문장들을 작성해라. 1개의 섹션에는 2,000자 정도의 길이의 영어 문장들이 들어간다. 미국인 Gen-z 해설가가 말하는 것 처럼, 너무 가볍지 않은 선에서 gen-z 용어도 가끔 섞어서 넣어준다. (no cap, vibe, aura, for real 등)
    
    섹션 1. [풍경의 탄생] 두 사람이 그리는 한 폭의 수묵화
제목 예시: "매마른 대지를 적시는 봄비 같은 인연", "비옥한 땅 위에 우뚝 선 웅장한 소나무"

내용 지침:

형상화: 두 사람의 dayMaster(일간)를 자연물에 비유하여 만남의 첫인상을 시각적으로 묘사합니다. (예: 甲목과 癸수가 만났을 때의 생명력 등)

만남의 의미: Person A의 부족한 기운을 B가 어떻게 채워주는지, 혹은 비슷한 기운이 만나 어떤 폭발력을 내는지 그 존재론적 의미를 서술합니다.

내면의 욕구: tenGodsCounts와 energyGrade를 분석하여 두 사람이 인생에서 공통적으로 지향하는 가치나 개인적 욕구를 비교합니다.

하모니 시뮬레이션: 두 사람이 만났을 때 흐르는 특유의 분위기를 대화체로 표현합니다.

예: "A님은 주로 '너 덕분에 그냥 심리적으로 든든해'라고 말하고, B님은 '내가 항상 더 실속있게 먼저 잘 챙겨줄게'라는 말을 자주 주고받을 흐름이네요."

섹션 2. [공명의 깊이] 겉과 속, 우리가 연결되는 방식
제목 예시: "첫눈에 반하는 끌림과 시간이 흐를수록 깊어지는 진심"

내용 지침:

겉궁합 (정신적 안정): 일간합(갑기, 을경 등) 여부를 분석하여 첫인상과 심리적 편안함을 리딩합니다. (정배합/편배합 디테일 활용)

주의사항 고지: 일간합이 있을 경우, 운이 나쁠 때 발생할 수 있는 '집착' 리스크를 부드럽게 경고합니다.

속궁합 (현실적 밀도): 일지 육합/삼합을 통해 정서적 깊이를 분석합니다. dayPillar.branch 간의 결합력을 바탕으로 보이지 않는 유대감을 설명합니다.

섹션 3. [관계의 주도권] "누가 누구를 더 필요로 하는가"
제목: "이 연애의 에너지 흐름, 누가 핸들을 잡고 있나?"

내용 지침:

에너지 분석: energyGrade와 tenGods를 분석하여 두 사람 사이의 갑을 관계(혹은 동등함)를 분석합니다.

포인트: "당신이 이 관계의 힐러입니다. 상대는 당신에게 정서적으로 의존하며 에너지를 얻어가지만, 당신은 가끔 고갈을 느낄 수 있어요." (여성 고객이 가장 공감하고 위로받는 대목)

섹션 4. [갈등의 도화선] "우리가 반복해서 부딪히는 진짜 이유"
제목: "주의! 두 사람의 불협화음이 시작되는 지점"

내용 지침:

현실적 시나리오: clashes(충), wonjin(원진), hyeong(형) 데이터를 기반으로 두 사람이 실제로 싸우게 될 상황을 제시합니다. 왜 싸우게 되는지, 어떤 말을 하거나 어떤 행동을 취하면서 싸움을 주고 받고 있을지 구체적으로 상상해서 예측합니다.

포인트: "상대는 논리적으로 따지는 스타일(관성 발달)인데 당신은 감정이 우선(인성 발달)이라 대화가 겉돌 수 있습니다. 이럴 땐 '옳고 그름'을 따지지 말고 이렇게 말하세요." (구체적인 화법 가이드 포함) 둘이 같이 하면 좋을 활동이나, 데이트를 추천하고 구체적인 이유와 근거를 제시하세요.

섹션 5. [속궁합과 시너지] "밤의 하모니와 현실적인 경제 공동체"
제목: "둘만의 은밀한 케미스트리, 그리고 재물운의 결합"

내용 지침:

밤의 하모니: jijiYughap(속궁합)을 결합합니다. 육합(인해합, 사신합 등)의 특징을 활용한 잠자리 성향을 언급합니다. 너무 무례하지 않게 적당한 수위로 이야기합니다.

재물운 시너지: tenGodsCounts(재성/관성)를 결합하여 두 사람이 만났을 때 재물운이 증폭되는지(A의 결핍 오행을 B가 채워주는지) 분석합니다.구체적으로 둘이 결혼하게 되었을 때, 가장 좋은 자산 관리법이나 자산 증폭법에 대해서 현대적인 이야기로 풀어서 설명해봅니다.

섹션 6. [타이밍의 마법] "이 관계의 정점과 결혼의 문턱"
제목: "함께할 수 있는 유효기간, 그리고 결혼의 기회"

내용 지침:

시기 지정: daewoon과 yeonwoon(2026~2027)을 매칭하여 이 둘의 과거나 미래 10년 내로 결혼운이 들어오는 시기를 연도로 명확히 집어줍니다. 이별수가 있는 연도가 있으면 단순하게 '헤어진다' 라기 보다는, 서로 마음이 돌아설 수 있는 시기가 있으니 되도록이면 조심하고 어떻게 해결하라는 지침으로 부드럽게 설명ㅎ바니다.

포인트: "2026년 하반기에는 두 사람 모두 문서운(결혼/계약)이 들어옵니다. 만약 이때를 놓치면 2028년에 큰 위기가 올 수 있으니 서두르는 게 좋습니다."

섹션 7. [운명의 파동과 최종 솔루션] "함께 걷는 30년, 그리고 우리의 정의"
제목: "서로의 삶에 선물이 되는 인연, 그 이상의 가치"

내용 지침:

운명의 파동: 향후 30년의 daewoon 흐름을 분석하여 두 사람의 상승장과 하락장이 어떻게 교차하는지 보여줍니다. "운의 동기화율 85%"와 같은 수치로 시각적 효과를 줍니다.

관계 정의: [소울메이트형 / 상호보완형 / 노력필요형 / 카르마형] 중 최종 타입을 확정합니다.

현실 점검 및 처방: "사주 궁합보다 중요한 것은 배려"임을 강조하는 도화로운식 따뜻한 조언과 함께, 상대의 에너지를 통해 A의 삶에서 어떤 영역(재물, 명예, 공부 등)이 확장되는지 구체적인 개운(開運) 액션 플랜을 제시하며 마무리합니다.
    )

Names: ${submission.person_a_name} & ${submission.person_b_name}

Stage 1 Context:
${contextInterpretation}

Return a JSON array of sections with this structure:
[
  {
    "title": "Section Title",
    "content": "Section content here...",
    "score": 85
  }
]`

    const stage2Raw = await callGemini(stage2SystemPrompt, stage2UserPrompt, {
      temperature: 0,
      maxTokens: 8000
    })

    console.log('[v0] Compatibility: Stage 2 raw response length:', stage2Raw.length)

    // === JSON 파싱 (generate-gemini의 정확한 로직 동일 적용) ===
    let stage2JsonMatch = stage2Raw.match(/```json\n([\s\S]*?)\n```/)
    
    if (!stage2JsonMatch) {
      stage2JsonMatch = stage2Raw.match(/```json([\s\S]*?)```/)
    }
    
    if (!stage2JsonMatch) {
      const directJsonMatch = stage2Raw.match(/(\[[\s\S]*\])/)
      if (directJsonMatch) {
        stage2JsonMatch = [null, directJsonMatch[1]]
      }
    }
    
    if (!stage2JsonMatch) {
      console.error('[v0] Compatibility: Stage 2 raw response:', stage2Raw)
      return NextResponse.json({ error: 'Failed to parse Stage 2 response' }, { status: 500 })
    }

    let facts: unknown[] = []
    try {
      facts = JSON.parse(stage2JsonMatch[1])
      if (!Array.isArray(facts)) {
        facts = [facts] // 단일 객체면 배열로 감싸기
      }
    } catch (parseErr) {
      console.error('[v0] Compatibility: JSON parse error:', parseErr, 'Raw:', stage2JsonMatch[1])
      facts = [{ title: 'Compatibility Report', content: stage2Raw, score: null }]
    }

    console.log(`[v0] Compatibility: Generated ${facts.length} facts from Stage 2`)

    // Save stage 2 result
    await supabase
      .from('compatibility_reports')
      .update({ facts })
      .eq('id', reportRow.id)

    return NextResponse.json({ success: true, reportId: reportRow.id })
  } catch (error) {
    console.error('[v0] Generate compatibility error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
