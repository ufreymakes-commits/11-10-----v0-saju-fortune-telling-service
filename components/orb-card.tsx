'use client'

import { useRef, useState } from 'react'
import type { OrbInfo } from '@/lib/saju/orb'

const ORB_IMAGES: Record<string, string> = {
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

const STARS: Array<[number, number, number, number]> = [
  [6, 14, 2, 0], [10, 78, 3, 1.2], [18, 90, 2, 0.6], [24, 6, 3, 2.1], [38, 94, 2, 1.7],
  [46, 4, 2, 0.3], [58, 92, 3, 2.4], [64, 8, 2, 1.1], [74, 88, 2, 0.8], [80, 12, 3, 1.9],
  [90, 70, 2, 0.4], [92, 26, 2, 2.2], [14, 40, 2, 1.4], [30, 60, 2, 0.9],
]

function CornerOrnament({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 28 28" className={`absolute h-7 w-7 ${className}`} aria-hidden="true" fill="none">
      <path d="M2 26V8C2 4.700 4.700 2 8 2h18" stroke="#e9c872" strokeWidth="1.400" strokeLinecap="round" />
      <path d="M7 21V10c0-1.700 1.300-3 3-3h11" stroke="#e9c872" strokeOpacity="0.55" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M2 2l3.200 0L2 5.200z" fill="#e9c872" />
      <circle cx="13" cy="2" r="1.200" fill="#e9c872" />
      <circle cx="2" cy="13" r="1.200" fill="#e9c872" />
    </svg>
  )
}

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

export function OrbCard({ orb }: { orb: OrbInfo }) {
  const tiltRef = useRef<HTMLDivElement>(null)
  const [imageFailed, setImageFailed] = useState(false)

  const accent = ELEMENT_ACCENTS[orb.element] ?? '#e9c872'
  const imageUrl = ORB_IMAGES[orb.imageKey]
  const numeral = ORB_NUMERALS[orb.imageKey] ?? 'I'
  const badges = buildBadges(orb.rarity)

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transition = 'transform 80ms ease-out'
    el.style.transform = `rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`
  }

  const resetTilt = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.transition = 'transform 400ms ease-out'
    el.style.transform = 'rotateX(0deg) rotateY(0deg)'
  }

  return (
    <section aria-label={`Your Orb: ${orb.name}`} className="mb-6 flex justify-center" style={{ perspective: '900px' }}>
      <div
        ref={tiltRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onPointerCancel={resetTilt}
        className="w-full max-w-[340px]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 나중에 이미지 저장 기능을 붙일 수 있도록 카드 전체를 하나의 div로 감싼다. */}
        <div id="orb-card" className="orb-card-frame relative aspect-[2/3] w-full rounded-[22px] p-[3px]">
          <div
            className="relative flex h-full w-full flex-col overflow-hidden rounded-[19px] px-5 pb-5 pt-6"
            style={{
              background: 'linear-gradient(160deg, #2b1556 0%, #1b1041 55%, #0f1738 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(233, 200, 114, 0.5), inset 0 0 40px rgba(0, 0, 0, 0.35)',
            }}
          >
            {STARS.map(([top, left, size, delay], i) => (
              <span
                key={i}
                className="orb-star absolute rounded-full"
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  width: size,
                  height: size,
                  animationDelay: `${delay}s`,
                  backgroundColor: i % 3 === 0 ? accent : '#f6e6b4',
                }}
                aria-hidden="true"
              />
            ))}

            <CornerOrnament className="left-2 top-2" />
            <CornerOrnament className="right-2 top-2 rotate-90" />
            <CornerOrnament className="bottom-2 right-2 rotate-180" />
            <CornerOrnament className="bottom-2 left-2 -rotate-90" />

            <p className="relative text-center text-[10px] font-medium uppercase tracking-[0.35em] text-[#f1d98a]">
              The Orb <span className="mx-1 text-[#e9c872]/60">&middot;</span> {numeral}
            </p>

            <div className="relative flex flex-1 items-center justify-center">
              <div
                className="orb-halo absolute aspect-square w-[88%] rounded-full"
                style={{ background: `radial-gradient(circle, ${accent}55 0%, ${accent}22 45%, transparent 70%)` }}
                aria-hidden="true"
              />
              <div className="relative aspect-square w-[82%]">
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
              <h3 className="font-serif text-xl font-semibold leading-tight tracking-[0.08em] text-[#fbf1d2] text-balance">
                {orb.name}
              </h3>
              <p className="mt-1.5 text-[11px] tracking-wider text-[#e9dff7]/85">{orb.subtitle}</p>
              <div className="mx-auto my-3 flex items-center justify-center gap-2" aria-hidden="true">
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
          </div>
        </div>
      </div>
    </section>
  )
}
