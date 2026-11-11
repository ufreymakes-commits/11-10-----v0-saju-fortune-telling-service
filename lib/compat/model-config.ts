// 궁합 v2 — 모델 설정. ★ v0: 아래 TODO 두 곳을 app/api/generate-paid-report 의 2단계 파이프라인이 지금 쓰는 값과 "똑같이" 채운다.
import type { CompatModelConfig } from './pipeline'

export function getCompatModelConfig(): CompatModelConfig {
  // app/api/generate-paid-report 의 STAGE_MODEL 과 같은 값
  const model = 'google/gemini-3.8-flash'

  // generate-paid-report 의 generateStage / 카드 호출과 같은 형식: google.thinkingConfig.thinkingLevel
  const thinkingMedium: any = { google: { thinkingConfig: { thinkingLevel: 'medium' } } }
  const thinkingLow: any = { google: { thinkingConfig: { thinkingLevel: 'low' } } }

  // 섹션은 AI Studio 테스트와 같은 medium 이 기본. 느리면 Vercel 환경변수 COMPAT_SECTIONS_THINKING=low.
  const sectionsLow = process.env.COMPAT_SECTIONS_THINKING === 'low'
  return {
    model,
    notesProviderOptions: thinkingMedium,
    sectionsProviderOptions: sectionsLow ? thinkingLow : thinkingMedium,
    notesTimeoutMs: 90_000,
    groupTimeoutMs: 150_000,
  }
}
