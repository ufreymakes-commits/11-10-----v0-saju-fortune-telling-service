# 오행 개수 계산 변경사항 종합 검토

## ✅ 변경 사항 검증 체크리스트

### 1. 함수 로직 (core-calculator.ts)
- [x] `countElementsBasic()` - 천간/지지만 카운트 (지장간 제외)
  - 4개 주기 처리 (연년/월월/일일 + 선택적 시시)
  - STEM_TO_ELEMENT, BRANCH_TO_ELEMENT 매핑 사용
  - 지장간 완전히 제외

- [x] `countElementsWithHiddenStems()` - 지장간 포함 카운트
  - 천간 + 지지 + 지장간(HIDDEN_STEMS)을 모두 카운트
  - 4개 주기 처리
  - 지장간은 배열 순회로 모두 카운트

### 2. 반환 데이터 (saju-calculator.ts)
- [x] import 추가: `countElementsBasic` 
- [x] 계산 로직 추가: `const elementCountBasic = countElementsBasic(fp)`
- [x] 반환값에 포함:
  ```
  elementCountBasic: { 목/화/토/금/수 }
  elementCount: { 목/화/토/금/수 }
  elementBalance: 수치론 120점
  elementBalanceKorean: 한글 표시
  dominantElement: 가장 높은 오행
  ```
- [x] 제거:
  - `elementBalanceAdjusted` (합충 반영 점수)
  - `elementBalanceAdjustedKorean`
  - `hapChungAdjustments`
  - `hapChungSummary`

### 3. 타입 정의 (types.ts - SajuData)
- [x] `elementCountBasic?: { 목/화/토/금/수 }` 추가
- [x] `elementCount?: { 목/화/토/금/수 }` (기존 유지)
- [x] `elementBalance` (기존)
- [x] `elementBalanceKorean` (기존)
- [x] `dominantElement` (기존)
- [x] 제거된 필드:
  - `elementBalanceAdjusted`
  - `elementBalanceAdjustedKorean`
  - `hapChungAdjustments`
  - `hapChungSummary`

### 4. 화면 표시 (preview-content.tsx)
- [x] "오행 개수 (지장간 미포함)" - `elementCountBasic` 표시
- [x] "오행 개수 (지장간 포함)" - `elementCount` 표시
- [x] "오행 점수 (수치론 120점)" - `elementBalanceKorean` 표시
- [x] 삭제된 섹션:
  - "오행 (합충 반영 점수)"
  - "합충 조정 내역"

### 5. Gemini 전송 데이터 (generate-gemini/route.ts)
- [x] `elementCountBasic` 포함
- [x] `elementCountWithHidden` (= elementCount) 포함
- [x] `elementScore` (= elementBalanceKorean) 포함
- [x] `dominantElement` 포함
- [x] 제거된 필드:
  - `elementAdjusted`
  - `hapChungAdjustmentDetails`

### 6. Free 버전 (generate-free/route.ts)
- [x] Gemini와 동일하게 수정

## 🧪 테스트 케이스 시뮬레이션

### 테스트 1: 병자/계사/기미/임신
```
천간: 병(화) 계(수) 기(토) 임(수)
지지: 자(수) 사(화) 미(토) 신(금)
지장간: 자(수-계) 사(화-병,정/토-무) 미(토-기,화-정/목-을) 신(금-경/수-임)

기본 개수: 목0 화2 토1 금1 수3
지장간포함: 목1 화5 토2 금2 수4
```

### 테스트 2: 시간 없는 경우
```
기본 개수: 위 - 임신 = 목0 화2 토1 금1 수2
지장간포함: 위 - 임신 지장간 = 목1 화4 토2 금1 수3
```

### 테스트 3: 편중된 경우 (갑인/을묘/경신/신유)
```
천간: 갑(목) 을(목) 경(금) 신(금)
지지: 인(목) 묘(목) 신(금) 유(금)
기본 개수: 목4 화0 토0 금4 수0
```

## 🎯 결론
- ✅ 함수 로직 정확함
- ✅ 데이터 흐름 일관성 확인
- ✅ 화면/API 데이터 동기화 완료
- ✅ 합충 관련 필드 완전히 제거
- ✅ 타입 정의 완료
- ⚠️ 실제 런타임 테스트 필요 (STEM_TO_ELEMENT, BRANCH_TO_ELEMENT 상수 확인)
