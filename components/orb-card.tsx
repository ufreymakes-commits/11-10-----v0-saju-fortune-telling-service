'use client'

import { useState } from 'react'
import type { OrbInfo } from '@/lib/saju/orb'
import { CardHeading, TarotFrame } from '@/components/tarot-frame'
import { cdnImage } from '@/lib/cdn-image'

const ORB_SOURCES: Record<string, string> = {
  gap: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gap.png?v=1794291992',
  eul: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/eul.png?v=1794291991',
  byeong: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/byeong.png?v=1794291992',
  jeong: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/jeong.png?v=1794291992',
  mu: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/mu.png?v=1794291992',
  gi: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gi.png?v=1794291992',
  gyeong: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gyeong.png?v=1794291992',
  sin: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/sin.png?v=1794291992',
  im: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/im.png?v=1794291992',
  gye: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gye.png?v=1794291992',
}

export const ORB_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(ORB_SOURCES).map(([key, url]) => [key, cdnImage(url, 480)]),
)

const ORB_NUMERALS: Record<string, string> = {
  gap: 'I', eul: 'II', byeong: 'III', jeong: 'IV', mu: 'V',
  gi: 'VI', gyeong: 'VII', sin: 'VIII', im: 'IX', gye: 'X',
}

// 오행별 강조색. 전체 톤은 보라+금색을 유지하고 후광과 별빛에만 살짝 입힌다.
const ELEMENT_ACCENTS: Record<string, string> = {
  Wood: '#6fd39a',
  Fire: '#f27a62',
  Earth: '#d9a84e',
  Metal: '#dfe6f2',
  Water: '#5b8cf0',
}

export const ORB_CARD_ID = 'orb-card'

function RingMark() {
  return (
    <svg viewBox="0 0 200 200" className="orb-ring-spin absolute inset-0 h-full w-full" aria-hidden="true" fill="none">
      <circle cx="100" cy="100" r="96" stroke="#e9c872" strokeOpacity="0.5" strokeWidth="0.8" strokeDasharray="1 5" />
      <circle cx="100" cy="100" r="88" stroke="#e9c872" strokeOpacity="0.35" strokeWidth="0.6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="100"
          y1="4"
          x2="100"
          y2={i % 3 === 0 ? 14 : 9}
          stroke="#e9c872"
          strokeOpacity="0.7"
          strokeWidth="1"
          transform={`rotate(${i * 30} 100 100)`}
        />
      ))}
    </svg>
  )
}

function buildBadges(rarity: OrbInfo['rarity']): string[] {
  const badges = [`1 in ${rarity.dayPillarOneIn} Day Pillar`]
  if (rarity.elementPattern) {
    badges.push(
      /^a very rare/.test(rarity.elementPattern.text)
        ? 'Very rare element mix'
        : `1 in ${rarity.elementPattern.oneIn.toLocaleString('en-US')} Element Mix`,
    )
  }
  return badges.slice(0, 2)
}

interface OrbCardProps {
  orb: OrbInfo
  displayName: string
}

export function OrbCard({ orb, displayName }: OrbCardProps) {
  const [imageFailed, setImageFailed] = useState(false)

  const accent = ELEMENT_ACCENTS[orb.element] ?? '#e9c872'
  const imageUrl = ORB_IMAGES[orb.imageKey]
  const numeral = ORB_NUMERALS[orb.imageKey] ?? 'I'
  const badges = buildBadges(orb.rarity)

  return (
    <TarotFrame
      id={ORB_CARD_ID}
      label={`Your Orb: ${orb.name}`}
      accent={accent}
      background="linear-gradient(160deg, #2b1556 0%, #1b1041 55%, #0f1738 100%)"
    >
      <CardHeading
        title={
          <>
            The Orb <span className="mx-1 text-[#e9c872]/60">&middot;</span> {numeral}
          </>
        }
        englishName={displayName}
      />

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div
          className="orb-halo absolute aspect-square h-[92%] rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}55 0%, ${accent}22 45%, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative aspect-square h-[88%] max-h-full">
          <RingMark />
          <div className="absolute inset-[14%] flex items-center justify-center">
            {imageUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={orb.name}
                crossOrigin="anonymous"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-contain"
                style={{ filter: `drop-shadow(0 6px 18px ${accent}88)` }}
              />
            ) : (
              <div
                role="img"
                aria-label={orb.name}
                className="h-[78%] w-[78%] rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${accent} 35%, ${accent}33 70%, transparent 100%)`,
                  boxShadow: `0 0 36px ${accent}99`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="relative text-center">
        <h3 className="font-serif text-lg font-semibold leading-tight tracking-[0.08em] text-[#fbf1d2] text-balance">
          {orb.name}
        </h3>
        <p className="mt-1 text-[11px] tracking-wider text-[#e9dff7]/85">{orb.subtitle}</p>
        <div className="mx-auto my-2 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-px w-10 bg-[#e9c872]/50" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[#e9c872]" />
          <span className="h-px w-10 bg-[#e9c872]/50" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {badges.map((text) => (
            <span
              key={text}
              className="rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide text-[#fbf1d2]"
              style={{ borderColor: `${accent}99`, backgroundColor: 'rgba(15, 10, 40, 0.55)' }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </TarotFrame>
  )
}
