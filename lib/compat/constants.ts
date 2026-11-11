// 궁합 v2 — 화면(클라이언트)과 서버가 같이 쓰는 상수. 계산 코드를 import 하지 않는다(브라우저 번들에 들어가지 않게).
export type RelationshipType = 'crush' | 'talking' | 'dating' | 'married' | 'ex'
export const RELATIONSHIP_TYPES: readonly RelationshipType[] = ['crush', 'talking', 'dating', 'married', 'ex']
export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  crush: 'A crush',
  talking: "We're talking",
  dating: 'Dating',
  married: 'Married',
  ex: 'My ex',
}
export const CONCERN_MAX = 200

export const SCORE_KEYS = ['attraction', 'stability', 'balance', 'climate'] as const
export type ScoreKey = (typeof SCORE_KEYS)[number]
export const SCORE_LABEL: Record<ScoreKey, { label: string; hint: string }> = {
  attraction: { label: 'Attraction', hint: 'How strongly you pull toward each other' },
  stability: { label: 'Stability', hint: 'How well it holds up day to day' },
  balance: { label: 'Balance', hint: 'How much you supply what the other lacks' },
  climate: { label: 'Climate', hint: 'How your emotional temperatures mix' },
}
export const MATCH_TYPE_LINE: Record<string, string> = {
  'Soulmate Match': 'A strong pull and a steady base',
  'Magnetic Match': 'A strong pull that needs care to stay steady',
  'Steady Match': 'A quiet pull on a steady base',
  'Growth Match': 'A bond that grows when you both put in the work',
}

/** compatibility_reports.score_board 에 저장되는 모양 */
export interface ScoreBoard {
  version: 2
  total: number
  totalLine: string
  matchType: string
  matchTypeLine: string
  relationship: RelationshipType
  relationshipLabel: string
  concern: string
  names: { a: string; b: string }
  subs: { key: ScoreKey; label: string; hint: string; score: number; line: string }[]
}

export function isScoreBoard(x: unknown): x is ScoreBoard {
  return !!x && typeof x === 'object' && (x as any).version === 2 && Array.isArray((x as any).subs)
}
