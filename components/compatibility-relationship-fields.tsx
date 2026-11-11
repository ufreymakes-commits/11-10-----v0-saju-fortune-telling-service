'use client'

// 궁합 폼 맨 위: 관계 유형(필수) + 고민(선택, 200자)
import { CONCERN_MAX, RELATIONSHIP_LABEL, RELATIONSHIP_TYPES, type RelationshipType } from '@/lib/compat/constants'

const PLACEHOLDER: Record<RelationshipType, string> = {
  crush: 'e.g. Do they feel anything for me? Should I make a move?',
  talking: "e.g. We've been talking for a month. Is this going anywhere?",
  dating: "e.g. Marriage has come up, but neither of us feels sure yet.",
  married: 'e.g. We argue more than we used to. How do we feel like a team again?',
  ex: 'e.g. Should I try again, or let go?',
}

export function CompatibilityRelationshipFields({
  relationshipType,
  concern,
  onRelationshipChange,
  onConcernChange,
  error,
}: {
  relationshipType: RelationshipType | ''
  concern: string
  onRelationshipChange: (v: RelationshipType) => void
  onConcernChange: (v: string) => void
  error?: string
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-gray-800 font-medium text-sm">What are you two right now?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Relationship type">
          {RELATIONSHIP_TYPES.map((t) => {
            const on = relationshipType === t
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onRelationshipChange(t)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  on ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-300 bg-white text-gray-700 hover:border-pink-300'
                }`}
              >
                {RELATIONSHIP_LABEL[t]}
              </button>
            )
          })}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="compat-concern" className="text-gray-800 font-medium text-sm block">
          What&apos;s on your mind about this relationship? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="compat-concern"
          rows={3}
          maxLength={CONCERN_MAX}
          value={concern}
          onChange={(e) => onConcernChange(e.target.value.slice(0, CONCERN_MAX))}
          placeholder={relationshipType ? PLACEHOLDER[relationshipType] : 'Pick a relationship type first, then tell us what you want to know.'}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pink-400 focus:outline-none"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Your report will answer this directly.</span>
          <span>{concern.length}/{CONCERN_MAX}</span>
        </div>
      </div>
    </div>
  )
}
