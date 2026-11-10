'use client'

import { useState } from 'react'
import { getDayMasterCharacter } from '@/lib/day-master-characters'
import { ELEMENT_EN } from '@/lib/day-master-quotes'
import { cdnImage } from '@/lib/cdn-image'
import { CardHeading, TarotFrame } from '@/components/tarot-frame'

export const DAY_MASTER_CARD_ID = 'day-master-card'
const FALLBACK_IMAGE = '/images/characters-collection.png'

interface DayMasterTarotCardProps {
  dayMasterKorean: string
  displayName: string
  quote: string
}

export function DayMasterTarotCard({ dayMasterKorean, displayName, quote }: DayMasterTarotCardProps) {
  const character = getDayMasterCharacter(dayMasterKorean)
  const [imageSrc, setImageSrc] = useState(character?.imagePath ? cdnImage(character.imagePath, 480) : FALLBACK_IMAGE)
  const accent = '#f08aa8'
  const element = character ? ELEMENT_EN[character.element] || character.element : ''

  return (
    <TarotFrame
      id={DAY_MASTER_CARD_ID}
      label={`Your Day Master: ${character?.themeTitle ?? ''}`}
      accent={accent}
      background="linear-gradient(160deg, #5c2049 0%, #3c1552 55%, #1f1038 100%)"
    >
      <CardHeading title={`Your Day Master \u00b7 ${character?.stemHanja ?? ''}`} englishName={displayName} />

      <div className="relative flex min-h-0 flex-1 items-center justify-center py-1">
        <div
          className="orb-halo absolute aspect-square h-[96%] rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}55 0%, ${accent}22 45%, transparent 70%)` }}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={`${character?.themeTitle ?? 'Day Master'} Gumiho`}
          crossOrigin="anonymous"
          onError={() => setImageSrc(FALLBACK_IMAGE)}
          className="relative h-full w-full object-contain"
          style={{ filter: `drop-shadow(0 6px 18px ${accent}77)` }}
        />
      </div>

      <div className="relative text-center">
        <h3 className="font-serif text-lg font-semibold leading-tight tracking-[0.06em] text-[#fbf1d2]">
          {character?.themeTitle}
        </h3>
        <p className="mt-0.5 font-serif text-2xl leading-none text-[#f1d98a]">
          {character?.stemHanja}
          <span className="ml-2 align-middle font-sans text-[11px] uppercase tracking-[0.2em] text-[#e9dff7]/85">
            {element}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {(character?.keywords ?? []).slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-[#fbf1d2]"
              style={{ borderColor: `${accent}99`, backgroundColor: 'rgba(15, 10, 40, 0.5)' }}
            >
              #{keyword}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-2 max-w-[94%] text-[11px] leading-snug text-[#e9dff7]/85 text-pretty">
          {character?.themeDescription}
        </p>
        {quote && (
          <p className="mx-auto mt-1.5 max-w-[92%] font-serif text-[11px] italic leading-snug text-[#f1d98a]/90 text-pretty">
            &ldquo;{quote}&rdquo;
          </p>
        )}
      </div>
    </TarotFrame>
  )
}
