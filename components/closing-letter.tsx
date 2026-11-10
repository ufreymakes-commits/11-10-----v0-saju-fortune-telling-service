'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { Fraunces } from 'next/font/google'
import { getDayMasterCharacter } from '@/lib/day-master-characters'
import { cdnImage } from '@/lib/cdn-image'
import { stripGumihoSignature } from '@/lib/letter-signature'

const letterFont = Fraunces({ subsets: ['latin'], style: ['italic'], display: 'swap' })

const FALLBACK_IMAGE = '/images/characters-collection.png'

interface ClosingLetterProps {
  text: string
  dayMasterKorean: string
}

export function ClosingLetter({ text, dayMasterKorean }: ClosingLetterProps) {
  const uid = useId().replace(/:/g, '')
  const character = getDayMasterCharacter(dayMasterKorean)
  const [imageSrc, setImageSrc] = useState(character?.imagePath ? cdnImage(character.imagePath, 480) : FALLBACK_IMAGE)
  const body = stripGumihoSignature(text)

  return (
    <div id="closing-letter" className="relative mx-auto w-full max-w-md pt-6">
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <filter id={`deckle-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" />
          </filter>
        </defs>
      </svg>

      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#f6ecd6] shadow-[0_10px_30px_-8px_rgba(60,30,90,0.45)]"
          style={{ filter: `url(#deckle-${uid})` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 border border-[#b8934a]/40"
        />

        <div className="absolute -left-3 -top-6 z-10 h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-[#c9a24d] bg-[#fbf4e4] shadow-md">
          <Image
            src={imageSrc}
            alt={`${character?.themeTitle || 'Day Master'} Gumiho`}
            fill
            sizes="72px"
            className="object-contain p-0.5"
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />
        </div>

        <div className="relative px-7 pb-8 pt-14 sm:px-9">
          <p
            className={`${letterFont.className} whitespace-pre-line text-pretty text-center text-[17px] leading-[1.8] text-[#3d2a1e]`}
          >
            {body}
          </p>

          <div className="mt-8 flex items-end justify-between gap-4">
            <p className={`${letterFont.className} text-base text-[#3d2a1e]/80`}>&mdash; Your Gumiho</p>
            <Seal uid={uid} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Seal({ uid }: { uid: string }) {
  return (
    <svg
      viewBox="0 0 128 80"
      className="h-[70px] w-28 shrink-0 -rotate-6"
      role="img"
      aria-label="Sajume seal"
    >
      <defs>
        <filter id={`seal-edge-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" />
        </filter>
        <filter id={`seal-ink-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.2" />
        </filter>
      </defs>

      <g filter={`url(#seal-edge-${uid})`}>
        <rect x="5" y="5" width="118" height="70" rx="14" fill="#b4232c" opacity="0.94" />
        <rect x="10" y="10" width="108" height="60" rx="10" fill="none" stroke="#f6ecd6" strokeWidth="1.4" opacity="0.75" />
      </g>

      <g filter={`url(#seal-ink-${uid})`} fill="#f6ecd6">
        <text
          x="64"
          y="48"
          textAnchor="middle"
          fontSize="21"
          fontWeight="700"
          letterSpacing="2.2"
          fontFamily="Georgia, 'Times New Roman', serif"
        >
          SAJUME
        </text>
        <path d="M20 22 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" />
        <path d="M108 58 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2z" />
        <path d="M88 33 C83 20 96 11 109 15 C102 17 99 24 100 33 Z" opacity="0.9" />
      </g>
    </svg>
  )
}
