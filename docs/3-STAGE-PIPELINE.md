/**
 * ═══════════════════════════════════════════════════════════════
 * SAJU 3-STAGE PIPELINE INTEGRATION FLOW
 * ═══════════════════════════════════════════════════════════════
 * 
 * 목표: 모든 사주 데이터를 보존하면서 분석 → 생성 → 검증 3단계 구분
 * 
 * ═══════════════════════════════════════════════════════════════
 * STAGE 1: ANALYZE (분석)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Route: POST /api/analyze
 * 
 * 입력:
 * {
 *   saju_data: SajuData (계산된 사주 데이터)
 *   name: string
 *   gender: string
 *   birth_date: string
 * }
 * 
 * 처리:
 * 1. GPT에게 사주 데이터 전송 + SAJU_MASTERPIECE_GUIDE 전송
 * 2. 각 핵심 특성별로 "근거" + "해석" 구조화
 * 3. 9개의 InsightClaim 생성 (각각이 최종 9문장의 기반)
 * 
 * 출력: InsightMap
 * {
 *   insights: [
 *     {
 *       id: 1,
 *       domain: 'personality',
 *       thesis: "You are a natural communicator with hidden leadership",
 *       evidence: [
 *         { type: 'day_master', value: '甲', dataField: 'dayPillar.stem' },
 *         { type: 'ten_gods', value: '食神', dataField: 'tenGods.present[0]' }
 *       ],
 *       mechanism: { ... },
 *       strategy: "daily 30-min no-disturb routine",
 *       validationScore: 0.85
 *     },
 *     ... (2-9)
 *   ]
 * }
 * 
 * ✓ 모든 사주 데이터 필드 추적 가능
 * ✓ 근거-주장 연결 명시
 * ✓ 검증 가능한 구조
 * 
 * ═══════════════════════════════════════════════════════════════
 * STAGE 2: GENERATE (생성)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Route: POST /api/generate-free
 * 
 * 입력: InsightMap (Stage 1에서 생성된)
 * 
 * 처리:
 * 1. 각 InsightClaim을 "1-2문장의 Gen-Z 톤"으로 변환
 * 2. 근거(evidence) 최소 2개 포함 강제
 * 3. SAJU_MASTERPIECE_GUIDE 참고하여 톤 유지
 * 
 * 출력: 9 Sentences
 * {
 *   facts: [
 *     {
 *       id: 1,
 *       title: "Character Vibe Check",
 *       content: "You're giving main character energy with that 甲 day master—natural born leader vibes...",
 *       source_evidence: ['dayPillar.stem', 'tenGods.present[0]']
 *     },
 *     ... (2-9)
 *   ]
 * }
 * 
 * ✓ 9개 문장이 모두 Stage 1 근거로 추적 가능
 * ✓ Barnum 효과 방지 (특정 사주 요소 명시)
 * 
 * ═══════════════════════════════════════════════════════════════
 * STAGE 3: VALIDATE (검증)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Route: POST /api/validate
 * 
 * 입력: 9 Sentences + InsightMap
 * 
 * 검증 기준:
 * 
 * 1. DDT (Data Density Test)
 *    - 각 문장에 포함된 사주 데이터 타입 개수 확인
 *    - 천간: 1점, 십신: 1점, 오행: 1점, 합충: 1점, 기타: 0.5점
 *    - 기준: 2점 이상 (2개 이상의 다른 사주 요소)
 * 
 * 2. Counterfactual Test
 *    - 이 주장이 "이 월지/용신"에만 해당하는가?
 *    - Barnum 키워드 필터링
 *    - 고유성 점수 계산
 * 
 * 3. Quality Gate
 *    - 평균 DDT >= 60점
 *    - 모든 문장이 Counterfactual 통과
 * 
 * 출력: ValidatedReport
 * {
 *   facts: [
 *     {
 *       id: 1,
 *       content: "...",
 *       dataDensityScore: 85,
 *       counterfactualValid: true,
 *       trackedEvidence: ['dayPillar.stem', 'tenGods.present[0]']
 *     },
 *     ... (2-9)
 *   ],
 *   totalDataDensityScore: 82,
 *   allCounterfactualValid: true,
 *   passedQualityGate: true,
 *   totalEvidenceUsed: 24,
 *   uniqueDataFields: [
 *     'dayPillar.stem',
 *     'tenGods.present',
 *     'elementBalance',
 *     'cheongganHap',
 *     'jijiChung',
 *     ... (모든 사주 필드)
 *   ]
 * }
 * 
 * ✓ 모든 사주 데이터가 검증 통과한 9문장에 포함됨
 * ✓ 추적 불가능한 근거 없음
 * ✓ 질 낮은 Barnum 문장 자동 필터링
 * 
 * ═══════════════════════════════════════════════════════════════
 * FLOW DIAGRAM
 * ═══════════════════════════════════════════════════════════════
 * 
 * [Client Submit Saju Data]
 *            ↓
 * [Saju Calculation (server)]
 * - Day Master, Ten Gods, Elements, Harmonies, Clashes, etc.
 * - elementBalance, sinsalDetails, daewoon, yeonwoon...
 *            ↓
 * [Stage 1: POST /api/analyze]
 * - GPT + SAJU_MASTERPIECE_GUIDE
 * - 근거별로 구조화
 * - Output: InsightMap (9개 InsightClaim)
 *            ↓
 * [Stage 2: POST /api/generate-free]
 * - InsightMap 받아서
 * - 각 InsightClaim → 1-2 문장 변환
 * - Output: 9 Sentences
 *            ↓
 * [Stage 3: POST /api/validate]
 * - DDT + Counterfactual 검증
 * - 품질 게이트 통과 확인
 * - Output: ValidatedReport (검증 통과 + 메타데이터)
 *            ↓
 * [Return to Client]
 * - 9 검증된 문장
 * - 각 문장의 근거 명시
 * - 품질 점수
 * - 사용된 모든 사주 필드 목록
 * 
 * ═══════════════════════════════════════════════════════════════
 * KEY GUARANTEES
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✓ 데이터 보존: 모든 사주 계산 데이터가 추적 가능
 * ✓ 근거 명시: 각 문장이 어떤 사주 요소로부터 나왔는가
 * ✓ 검증 가능: DDT + Counterfactual로 자동 품질 관리
 * ✓ 투명성: ValidatedReport에서 사용된 모든 필드 목록 제공
 * ✓ 반복성: 동일 사주 데이터 → 동일 분석 결과
 * 
 * ═══════════════════════════════════════════════════════════════
 * INTEGRATION CHECKLIST
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Step 1: types.ts에 InsightMap, ValidatedReport 타입 추가
 * ✅ Step 2: /api/analyze 생성 (Stage 1)
 * ✅ Step 3: /api/validate 생성 (Stage 3)
 * ⏳ Step 4: /api/generate-free 개수정 (Stage 2) - 다음 단계
 * ⏳ Step 5: 클라이언트 플로우 연결 (UI에서 3단계 호출)
 * ⏳ Step 6: 통합 테스트
 * 
 * ═══════════════════════════════════════════════════════════════
 */
