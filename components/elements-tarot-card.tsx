'use client'

import { ELEMENT_EN } from '@/lib/day-master-quotes'
import { CardHeading, TarotFrame } from '@/components/tarot-frame'

export const ELEMENTS_CARD_ID = 'elements-card'

const ELEMENTS: Array<{ key: string; label: string; color: string; x: number; y: number }> = [
  { key: 'wood', label: 'Wood', color: '#6fd39a', x: 50, y: 14 },
  { key: 'fire', label: 'Fire', color: '#f27a62', x: 86, y: 40 },
  { key: 'earth', label: 'Earth', color: '#d9a84e', x: 72, y: 82 },
  { key: 'metal', label: 'Metal', color: '#dfe6f2', x: 28, y: 82 },
  { key: 'water', label: 'Water', color: '#5b8cf0', x: 14, y: 40 },
]

interface ElementsTarotCardProps {
  counts: Record<string, number>
  luckyElement: string
  displayName: string
}

export function ElementsTarotCard({ counts, luckyElement, displayName }: ElementsTarotCardProps) {
  const lucky = ELEMENT_EN[luckyElement] || ELEMENT_EN[luckyElement?.toLowerCase?.()] || luckyElement || 'Water'
  const accent = '#5fd3d0'
  const polygon = ELEMENTS.map((e) => `${e.x},${e.y}`).join(' ')

  return (
    <TarotFrame
      id={ELEMENTS_CARD_ID}
      label="Your Five Elements"
      accent={accent}
      background="linear-gradient(160deg, #0c4150 0%, #0d2d4d 55%, #0a1633 100%)"
    >
      <CardHeading title="Your Five Elements" englishName={displayName} />

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="relative aspect-square h-full max-h-[96%]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true" fill="none">
            <polygon points={polygon} stroke="#e9c872" strokeOpacity="0.4" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
            <circle cx="50" cy="52" r="7" stroke={accent} strokeOpacity="0.5" strokeWidth="0.4" />
            <circle cx="50" cy="52" r="3" fill={accent} fillOpacity="0.5" />
          </svg>

          {ELEMENTS.map((el) => {
            const count = Number(counts?.[el.key]) || 0
            const present = count > 0
            const isLucky = lucky.toLowerCase() === el.key
            return (
              <div
                key={el.key}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: `${el.x}%`, top: `${el.y}%` }}
              >
                <div
                  role="img"
                  aria-label={`${el.label}: ${count}`}
                  className="flex h-12 w-12 items-center justify-center rounded-full font-serif text-lg font-semibold"
                  style={
                    present
                      ? {
                          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${el.color} 38%, ${el.color}99 100%)`,
                          boxShadow: `0 0 18px ${el.color}aa${isLucky ? ', 0 0 0 2px #e9c872' : ''}`,
                          color: '#0a1633',
                        }
                      : {
                          border: `1.5px dashed ${el.color}66`,
                          backgroundColor: 'rgba(10, 22, 51, 0.5)',
                          color: `${el.color}66`,
                          boxShadow: isLucky ? '0 0 0 2px #e9c87288' : undefined,
                        }
                  }
                >
                  {count}
                </div>
                <span
                  className="text-[9px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: present ? '#fbf1d2' : '#e9dff7aa' }}
                >
                  {el.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative text-center">
        <p className="text-[10px] tracking-wider text-[#e9dff7]/80">Based on 8 characters</p>
        <div className="mx-auto my-2 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-px w-10 bg-[#e9c872]/50" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[#e9c872]" />
          <span className="h-px w-10 bg-[#e9c872]/50" />
        </div>
        <span
          className="inline-block rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide text-[#fbf1d2]"
          style={{ borderColor: `${accent}aa`, backgroundColor: 'rgba(10, 22, 51, 0.6)' }}
        >
          Your Lucky Element: {lucky}
        </span>
      </div>
    </TarotFrame>
  )
}
