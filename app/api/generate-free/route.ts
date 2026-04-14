import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import type { SajuData, Fact } from '@/lib/types'
import { headers } from 'next/headers'
import { promises as fs } from 'fs'
import path from 'path'

// 사주 분석 가이드라인 파일 읽기
async function getAnalysisGuidelines(): Promise<string> {
  try {
    // public 폴더에서 파일 읽기 (Vercel 배포 환경 호환)
    const filePath = path.join(process.cwd(), 'public', 'analysis-guidelines.md')
    const content = await fs.readFile(filePath, 'utf-8')
    console.log('[v0] 가이드라인 파일 로드 성공, 길이:', content.length)
    return content
  } catch (error) {
    console.error('[v0] 가이드라인 파일 로드 실패:', error)
    return ''
  }
}

// Rate Limit 체크 (IP당 하루 N회)
async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ip: string,
  maxRequests: number = 10
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0]

  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('ip_address', ip)
    .eq('request_date', today)
    .single()

  if (!rateLimit) {
    await supabase.from('rate_limits').insert({
      ip_address: ip,
      request_date: today,
      request_count: 1
    })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (rateLimit.request_count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  await supabase
    .from('rate_limits')
    .update({ request_count: rateLimit.request_count + 1 })
    .eq('ip_address', ip)
    .eq('request_date', today)

  return { allowed: true, remaining: maxRequests - rateLimit.request_count - 1 }
}

// GPT 프롬프트 생성 - 9문장 구조 (01~09)
async function buildPromptFromSajuData(
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: string,
  sajuData: SajuData
): Promise<string> {
  const birthYear = new Date(birthDate).getFullYear()
  const age = 2026 - birthYear

  // 사주 분석 가이드라인 MD 파일 읽기
  const guidelinesContent = await getAnalysisGuidelines()

  // 12운성
  const twelveStarsStr = sajuData.twelveStars
    ? sajuData.twelveStars.map(ts => `${ts.position}(${ts.branch}): ${ts.star}`).join(' / ')
    : '계산 안됨'

  // 길성
  const gilseongStr = sajuData.gilseong
    ? [
      ...sajuData.gilseong.cheonul.map(g => `천을귀인: ${g}`),
      ...sajuData.gilseong.taegeuk.map(g => `태극귀인: ${g}`)
    ].join(' / ') || '해당 없음'
    : '해당 없음'

  // 현재 대운 (나이 기준)
  const currentDaeyun = sajuData.daewoon?.find(d => age >= d.startAge && age < d.endAge)
  const daeyunStr = sajuData.daewoon
    ? sajuData.daewoon.slice(0, 4).map(d => `${d.startAge}~${d.endAge}세: ${d.fullName || d.stem + d.branch}`).join(' / ')
    : '계산 안됨'

  // 연운 (2026)
  const yeonwoon2026 = sajuData.yeonwoon?.find(y => y.year === 2026)
  const yeonwoon2026Str = yeonwoon2026
    ? (yeonwoon2026.fullName || yeonwoon2026.stem + yeonwoon2026.branch)
    : '병오'

  // 오행 기본 점수
  const elementBasic = sajuData.elementBalanceKorean
    ? `목: ${sajuData.elementBalanceKorean.목}점 / 화: ${sajuData.elementBalanceKorean.화}점 / 토: ${sajuData.elementBalanceKorean.토}점 / 금: ${sajuData.elementBalanceKorean.금}점 / 수: ${sajuData.elementBalanceKorean.수}점 (총 120점)`
    : '미계산'

  // 오행 합충 반영 점수
  const elementAdjusted = sajuData.elementBalanceAdjustedKorean
    ? `목: ${sajuData.elementBalanceAdjustedKorean.목}점 / 화: ${sajuData.elementBalanceAdjustedKorean.화}점 / 토: ${sajuData.elementBalanceAdjustedKorean.토}점 / 금: ${sajuData.elementBalanceAdjustedKorean.금}점 / 수: ${sajuData.elementBalanceAdjustedKorean.수}점`
    : '미계산'

  // 오행 개수 (지장간 포함)
  const elementCount = sajuData.elementCount
    ? `목: ${sajuData.elementCount.목}개 / 화: ${sajuData.elementCount.화}개 / 토: ${sajuData.elementCount.토}개 / 금: ${sajuData.elementCount.금}개 / 수: ${sajuData.elementCount.수}개`
    : '미계산'

  // 합충 조정 내역
  const hapChungStr = sajuData.hapChungAdjustments?.length
    ? sajuData.hapChungAdjustments.join('\n    ')
    : '합충 없음'

  // 신살 상세
  const sinsalStr = sajuData.sinsalDetails?.length
    ? sajuData.sinsalDetails.map(s =>
      `${s.name}: ${s.count}/${s.totalPillars} (${s.percentage}%)${s.isStrong ? ' ✅강함' : ''} - ${s.positions.join(', ')}`
    ).join(' / ')
    : (sajuData.spirits?.join(', ') || '해당 없음')

  // 사주 8글자
  const yearP = sajuData.yearPillar.fullName || sajuData.yearPillar.stem + sajuData.yearPillar.branch
  const monthP = sajuData.monthPillar.fullName || sajuData.monthPillar.stem + sajuData.monthPillar.branch
  const dayP = sajuData.dayPillar.fullName || sajuData.dayPillar.stem + sajuData.dayPillar.branch
  const hourP = sajuData.hourPillar
    ? (sajuData.hourPillar.fullName || sajuData.hourPillar.stem + sajuData.hourPillar.branch)
    : '미상'

  return `You are a highly educated, wise, and warm American Gen-Z marketer who has thoroughly read the analysis-guidelines1.md file and fully understands Saju (Korean fortune-telling) analysis. You must generate an analysis consisting of nine sections, strictly adhering to the 9 Rules for the "Modern Mystic" Format writing style and the 9-Step Sectional Frame Prompt Instructions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 사주 분석 가이드라인 (필독!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${guidelinesContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 클라이언트 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이름: ${name} | 성별: ${gender} | 나이: ${age}세
사주: ${yearP} - ${monthP} - ${dayP} - ${hourP}
일간: ${sajuData.dayPillar?.stem || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 분석 데이터 (GPT는 이 데이터를 기반으로 분석)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 핵심 정보
- 일간(Day Master): ${sajuData.dayPillar?.stem || ''} (${sajuData.dayMasterKorean || ''})
- 신강/신약: ${sajuData.sinGangSinYak?.grade || '미정'} (${sajuData.sinGangSinYak?.ratio || 0}%)
- 격국: ${sajuData.gyeokguk || '미정'}
- 용신(억부): ${sajuData.eokbuYongsin || '미정'}
- 용신(조후): ${sajuData.johuYongsin || '미정'}

### 오행 분포
- 기본 점수 (120점 기준): ${elementBasic}
- 오행 개수 (지장간 포함): ${elementCount}
- 합충 반영 후: ${elementAdjusted}
- 합충 조정 내역:
    ${hapChungStr}

### 십신 (十神)
- 보유: ${sajuData.tenGods?.present.join(', ') || '없음'}
- 부재: ${sajuData.tenGods?.missing.join(', ') || '없음'}

### 12운성
${twelveStarsStr}

### 관계식
- 천간합: ${sajuData.cheongganHap?.length ? sajuData.cheongganHap.join(' / ') : '없음'}
- 지지육합: ${sajuData.jijiYughap?.length ? sajuData.jijiYughap.join(' / ') : '없음'}
- 지지삼합: ${sajuData.jijiSamhap?.length ? sajuData.jijiSamhap.join(' / ') : '없음'}
- 지지방합: ${sajuData.jijiBanghap?.length ? sajuData.jijiBanghap.join(' / ') : '없음'}
- 천간충: ${sajuData.cheongganChung?.length ? sajuData.cheongganChung.join(' / ') : '없���'}
- 지지충: ${sajuData.jijiChung?.length ? sajuData.jijiChung.join(' / ') : '없음'}
- 형: ${sajuData.hyung?.length ? sajuData.hyung.join(' / ') : '없음'}
- 파: ${sajuData.pa?.length ? sajuData.pa.join(' / ') : '없음'}
- 해: ${sajuData.hae?.length ? sajuData.hae.join(' / ') : '없음'}
- 원진: ${sajuData.wonjin?.length ? sajuData.wonjin.join(' / ') : '없음'}

### 신살 (상세)
${sinsalStr}
- 활용 가이드: ${sajuData.sinsalCombinedGuide || '해당 없음'}

### 길성
${gilseongStr}

### 공망
${sajuData.gongmang?.join('·') || '없음'}

### 대운
${daeyunStr}
- 현재 대운: ${currentDaeyun ? currentDaeyun.startAge + '~' + currentDaeyun.endAge + '세 ' + (currentDaeyun.fullName || currentDaeyun.stem + currentDaeyun.branch) : '계산 안됨'}

### 2026년 운세
- 간지: ${yeonwoon2026Str}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 9개 문장 작성 지침
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
반드시 JSON 형식으로 응답하세요:

\`\`\`json
{
  "facts": [
    {
      "id": 1,
      "title": "[Main Character Title]",
      "content": "[SAJU_ALGORITHM]의 '일간 Gen Z 텍스트'로 제목을 뽑고, 오행 분포 점수(120점 만점)를 반영한 '자연 풍경' 비유를 통해 사용자의 상황과 바이브를 딱 한 문장으로 정의하세요. (필수: Main Character Title, Vibe Check, Nature-to-Life Metaphor)"
    },
    {
      "id": 2,
      "title": "[The Inner Twist]",
      "content": "겉모습과 내면의 간극을 모순이 아닌 '입체적인 매력'으로 서술하세요. 수(水) 과다의 딥다크한 생각이나 화(火)/재성 과다의 용암 같은 욕망 등 감정적 리얼리티를 짚어주어 내담자가 '이게 바로 나'라고 느끼게 만드세요. (필수: Hidden Shadow, Low-key/High-key 표현)"
    },
    {
      "id": 3,
      "title": "[Hidden Stat Analysis]",
      "content": "가장 높은/낮은 십성 점수를 게임 스탯처럼 분석하며 내담자의 '치트키급 재능'을 강조하세요. 십이운성 기운을 빌려 현재 에너지가 전성기(제왕/관대)인지 리뉴얼 시즌(사/묘)인지 전략적으로 분석하세요. (필수: Secret Lore(Technical Saju), Stat 메타포)"
    },
    {
      "id": 4,
      "title": "[God-Tier Micro-Habit]",
      "content": "부족한 기운을 채우기 ���해 [SAJU_ALGORITHM]의 [실행 지침]을 활용한 아주 구체적이고 사소한 루틴을 제안하세요. 뻔한 위로가 아닌, 삶을 긍정적으로 바꿀 수 있는 즉각적인 '작은 승리'를 처방해야 합니다. (필수: Micro-Action Practicality)"
    },
    {
      "id": 5,
      "title": "[Social Persona DNA]",
      "content": "월지 격국을 통해 세상이 부여한 '사회적 면허증'을 설명하세요. 합/충으로 인한 변화를 '나만 몰랐던 필살기'로 해석하여 내담자가 자신의 사회적 역할을 자랑스럽게 느끼도록 만드세요. (필수: 현대적 직업 언어 변환 - 예: 정인격→전문 지식 라이선서)"
    },
    {
      "id": 6,
      "title": "[Career Industry Match]",
      "content": "[SAJU_ALGORITHM]의 [TABLE B: 현대적 산업 분야]를 참조하여 내담자가 본능적으로 끌릴 산업군과 업무 형태를 제안하세요. 내담자가 '소름 돋네, 내가 지금 관심 있는 분야인데!'라고 느낄 만큼 구체적인 카테고리를 찍어주어야 합니다. (필수: 'By any chance...' 구문 사용)"
    },
    {
      "id": 7,
      "title": "[Reality Check]",
      "content": "결핍된 기운(0점)이나 과다 에너지가 일으킬 실수를 blunt한 친구처럼 경고하되, 반드시 '이것만 보완하면 무적'이라는 뉘앙스를 유지하세요. 리스크를 '실패'가 아닌 '성공을 위한 마지막 퍼즐'로 프레이밍하세요. (필수: Reality Check, Red Flag 단어)"
    },
    {
      "id": 8,
      "title": "[God-Mode Update]",
      "content": "대운과 2026년 병오(丙午)년 세운을 결합해 지금이 어떤 '시즌'인지 정의하세요. 힘든 시기는 '레벨업을 위한 하드코어 퀘스트', 좋은 시기는 '갓모드 버프'로 설명하며 행동 강령을 제시하세요. (필수: God-Mode Activated, Season Update 용어)"
    },
    {
      "id": 9,
      "title": "[The Hero's Journey]",
      "content": "일간의 본질과 최고의 긍정 에너지(귀인/용신)를 묶어 삶을 '위대한 여정'으로 승화시키세요. '당신은 이미 충분히 훌륭하다'는 메시지와 함께 스스로를 사랑하게 만드는 소울풀한 문장으로 마무리하세요. (필수: Hero's Journey Outro, 감동적인 finale)"
    }
  ]
}
\`\`\`

## 9 Rules for the "Modern Mystic" Format & 9-Step Sectional Frame Prompt Instructions

1. **Main Character Energy**: 매 섹션마다 영화나 트렌딩 TikTok 주제처럼 들리는 타이틀 사용. 자연 원소(Water, Earth, Fire)와 라이프스타일 바이브를 결합한 메타포 사용.
2. **Vibe Check**: 차가운 분석 대신 사용자의 오라나 현재 감정을 1문장 훅으로 표현. "You give off major calm vibes on the outside, but your inner world is literal boiling lava." 스타일.
3. **Gen Z Dialect**: 섹션당 1-2개 슬래프 삽입 (Vibe, Low-key, High-key, Main Character Energy, Red Flag, It is what it is).
4. **Nature-to-Life Metaphor**: 사주의 기술적 요소(목/화/수 등)를 실생활 시나리오와 즉시 연결.
5. **Secret Lore**: 기술 용어(식상, 원진살 등)를 비디오 게임 스탯처럼 취급하면서 권위성 유지.
6. **Reality Check**: "Let's be real", "Honestly", "Fact check" 같은 직설적인 친구의 톤 사용.
7. **Micro-Action**: 애매한 인생 목표 대신 즉시 실행 가능한 구체적 루틴 제안 (예: 30분 '방해금지' 루틴).
8. **Hidden Shadow**: 모든 섹션에 "겉 vs 속"의 역전 또는 반전 포함. 사용자가 "이거 어떻게 알았냐?!"라고 느끼게 함.
9. **Hero's Journey Outro**: 마지막 섹션은 반드시 사용자가 자신의 "운명"을 컨트롤할 수 있다고 느끼게 하는 하이노트로 끝맺음.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Section-by-Section Directive

**Section 01. Character Vibe Check (Day Pillar Metaphor)**
- Pull Day Pillar Gen Z text, metaphorize user's situation as natural landscape reflecting Five Elements scores to define character in exactly one sentence.
- Must Include: Main Character Title, Vibe Check, Nature-to-Life Metaphor.

**Section 02. Inner Reversal (Psychological Conflict)**
- Explain outward-vs-inner gap as three-dimensional charm, not contradiction. Pinpoint emotional reality (deep-sea thinking if Water excess, lava-like desire if Fire/Wealth excess).
- Must Include: Hidden Shadow style, Low-key/High-key phrasing.

**Section 03. Energy Stat Analysis (10 Gods Lore)**
- Describe highest/lowest 10 Gods scores like video game stats. Use 12 Un-seong (Life Stages) to assess if current energy is in prime (Imperial/Cap) or restructuring phase (Death/Grave).
- Must Include: Secret Lore terminology, Stat metaphors.

**Section 04. Micro-Action for God-Tier Life (Remedy)**
- Provide highly specific, actionable behavioral guidelines to fill missing energies. Suggest a small win that immediately turns life positive.
- Must Include: Micro-Action Practicality (specific time routines, item usage).

**Section 05. Social Persona (Gyeok-guk DNA)**
- Explain Social License granted by Month Branch (Gyeok-guk). Interpret Clash/Harmony changes as hidden ultimate move.
- Must Include: Modern career translation of Gyeok-guk (e.g., Proper Resource → Professional Knowledge Licenser).

**Section 06. Career Industry Layer (Elemental Matching)**
- Reference modern industries. Suggest categories so specific client reacts: "Chills... that's exactly what I've been interested in!"
- Must Include: "By any chance, aren't you interested in this (Industry) as (Role)?" phrasing.

**Section 07. Reality Check (Deficiency Risk)**
- Warn about potential mistakes from deficient (0 pts) or excessive energies like a blunt friend. Frame as last puzzle piece for success, not labels.
- Must Include: Reality Check interjection, Red Flag terminology.

**Section 08. Current Fortune Update (Dae-un Vibe)**
- Combine 10-year Great Fortune (Dae-un) and Yearly Fortune (Se-un) to identify current season. Frame hard times as hardcore quests, good times as God-Mode buffs.
- Must Include: God-Mode Activated, Season Update terminology.

**Section 09. Hero's Journey (Life Theme)**
- Bind Day Pillar essence with strongest positive energy (Noble Benefactor/Yong-sin) to elevate life into Great Journey. End with soul-stirring sentence.
- Must Include: Hero's Journey Outro style, emotional/inspiring finale.\`
}

// AI를 통한 9개 팩트 생성
async function generateFactsFromAI(
  name: string,
  gender: string,
  birthCountry: string,
  birthDate: string,
  sajuData: SajuData
): Promise<Fact[]> {
  const prompt = await buildPromptFromSajuData(name, gender, birthCountry, birthDate, sajuData)

  console.log('[v0] GPT 프롬프트 생성 완료')
  console.log('[v0] 프롬프트 길이:', prompt.length)
  console.log('[v0] API 호출 시작...')

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    prompt,
    temperature: 0.7,
    maxOutputTokens: 2500,
  })

  console.log('[v0] GPT 응답 수신 완료')

  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없음')

    const parsed = JSON.parse(jsonMatch[1])
    const facts: Fact[] = parsed.facts.map((f: any, idx: number) => ({
      id: f.id || idx + 1,
      category: f.category || 'unknown',
      title: f.title || '',
      text: f.content || f.text || '내용 없음'
    }))

    return facts
  } catch {
    console.error('[v0] JSON 파싱 실패:', result.text.substring(0, 500))
    return [{
      id: 1,
      category: 'error',
      title: '분석 오류',
      text: '사주 분석 결과를 처리하는 중 오류가 발생했습니다.'
    }]
  }
}

// POST 핸들러
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { submissionId } = body

    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headersList.get('x-real-ip') || 'unknown'

    const supabase = await createClient()

    // Rate Limit 체크 - 개발 중 비활성화 (배포 시 아래 주석 ���제)
    // const { allowed, remaining } = await checkRateLimit(supabase, ip, 100)
    // if (!allowed) {
    //   return NextResponse.json({ error: '하루 10회 ��한입니다.' }, { status: 429 })
    // }

    // DB에서 submission 조회
    const { data: submission, error: dbError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (dbError || !submission) {
      console.error('[v0] DB fetch error:', dbError)
      return NextResponse.json({ error: '제출 데이터를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { name, gender, birth_country, birth_date, saju_data } = submission

    console.log('[v0] Submission 조회 성공:', { name, gender, birth_country })
    console.log('[v0] saju_data 키:', Object.keys(saju_data || {}))

    if (!saju_data) {
      return NextResponse.json({ error: '사주 데이터가 없습니다.' }, { status: 400 })
    }

    // 매번 새로 AI 생성 (캐시 없음)
    console.log('[v0] AI 생성 시작...')
    const freeFacts = await generateFactsFromAI(name, gender, birth_country, birth_date, saju_data)

    // 티저 팩트 (locked)
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
    return NextResponse.json({ error: '팩트 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
