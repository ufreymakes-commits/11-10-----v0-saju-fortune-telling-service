'use client'

import { useId, useState } from 'react'
import { cdnImage } from '@/lib/cdn-image'

interface TailIconProps {
  n: number
  hex: string
  className?: string
}

const TAIL_SOURCES: Record<number, string> = {
  1: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/red.png?v=1794297606',
  2: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/orange.png?v=1794297606',
  3: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/yellow.png?v=1794297607',
  4: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/green.png?v=1794297606',
  5: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/blue.png?v=1794297606',
  6: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/indigo.png?v=1794297606',
  7: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/violet.png?v=1794297606',
  8: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/white.png?v=1794297607',
  9: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/black.png?v=1794297606',
}

// 32px로 보여주므로 3배(96px)만 요청한다.
export const TAIL_IMAGES: Record<number, string> = Object.fromEntries(
  Object.entries(TAIL_SOURCES).map(([n, url]) => [Number(n), cdnImage(url, 96)]),
)

const WHITE_TAIL = 8
const BLACK_TAIL = 9

// 좁은 뿌리(왼쪽 아래)에서 풍성한 끝(오른쪽 위)으로 휘어 올라가는 여우 꼬리 윤곽.
// 끝에는 작은 털 갈래 세 개를 두었다.
const OUTLINE =
  'M7 44C3 37 4 28 10 20C13 15 17 8 25 4C31 1 37 1 41 3L39 6L44 8L42 11L46 14C47 23 42 32 34 38C27 43 17 47 7 44Z'

const STRANDS = [
  'M11 41C11 33 17 27 21 21C25 15 28 11 34 7',
  'M17 43C21 37 27 34 32 28C36 23 39 20 42 14',
  'M8 34C10 28 14 25 17 20C19 16 21 13 25 9',
]

const SPARKLES: Array<{ x: number; y: number; scale: number; delay: number }> = [
  { x: 5, y: 9, scale: 1, delay: 0 },
  { x: 44, y: 33, scale: 0.8, delay: 0.9 },
  { x: 40, y: 44, scale: 0.6, delay: 1.7 },
]

const SPARKLE_PATH = 'M0 -3 L0.9 -0.9 L3 0 L0.9 0.9 L0 3 L-0.9 0.9 L-3 0 L-0.9 -0.9Z'

const SPECIAL_COLORS: Record<string, { stroke: string; sparkle: string }> = {
  '#f8fafc': { stroke: '#b4a3e8', sparkle: '#d9ccff' },
  '#1f2937': { stroke: '#cbd5e1', sparkle: '#e2e8f0' },
}

function getImageShadow(n: number, hex: string) {
  if (n === WHITE_TAIL) {
    return 'drop-shadow(0 0 3px rgba(168, 139, 250, 0.65)) drop-shadow(0 1px 2px rgba(139, 92, 246, 0.35))'
  }
  if (n === BLACK_TAIL) {
    return 'drop-shadow(0 0 0.6px rgba(203, 213, 225, 0.95)) drop-shadow(0 0 0.6px rgba(203, 213, 225, 0.8)) drop-shadow(0 0 2px rgba(226, 232, 240, 0.55))'
  }
  return `drop-shadow(0 0 3px ${hex})`
}

function SparkleOverlay({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      fill="none"
      style={{ overflow: 'visible' }}
    >
      {SPARKLES.map((s) => (
        <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}>
          <path d={SPARKLE_PATH} fill={color} className="tail-sparkle" style={{ animationDelay: `${s.delay}s` }} />
        </g>
      ))}
    </svg>
  )
}

function TailSvg({ hex, className }: { hex: string; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const special = SPECIAL_COLORS[hex.toLowerCase()]
  const tint = `color-mix(in srgb, ${hex} 55%, white)`
  const stroke = special?.stroke ?? `color-mix(in srgb, ${hex} 70%, black)`
  const sparkle = special?.sparkle ?? `color-mix(in srgb, ${hex} 45%, white)`
  const strand = special?.stroke ?? tint

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      fill="none"
      style={{ filter: `drop-shadow(0 0 3px ${hex})`, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`tail-body-${uid}`} x1="0.1" y1="1" x2="0.9" y2="0">
          <stop offset="0" style={{ stopColor: hex }} />
          <stop offset="1" style={{ stopColor: tint }} />
        </linearGradient>
        <radialGradient id={`tail-tip-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="1" />
          <stop offset="0.6" stopColor="#fff6dc" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`tail-clip-${uid}`}>
          <path d={OUTLINE} />
        </clipPath>
      </defs>

      <path d={OUTLINE} fill={`url(#tail-body-${uid})`} stroke={stroke} strokeWidth="1" strokeLinejoin="round" />

      <g clipPath={`url(#tail-clip-${uid})`}>
        <circle cx="37" cy="10" r="11" fill={`url(#tail-tip-${uid})`} />
        {STRANDS.map((d) => (
          <path key={d} d={d} stroke={strand} strokeOpacity="0.75" strokeWidth="1" strokeLinecap="round" />
        ))}
      </g>

      {SPARKLES.map((s) => (
        <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}>
          <path d={SPARKLE_PATH} fill={sparkle} className="tail-sparkle" style={{ animationDelay: `${s.delay}s` }} />
        </g>
      ))}
    </svg>
  )
}

export function TailIcon({ n, hex, className }: TailIconProps) {
  const src = TAIL_IMAGES[n]
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return <TailSvg hex={hex} className={className} />
  }

  const sparkleColor = SPECIAL_COLORS[hex.toLowerCase()]?.sparkle ?? `color-mix(in srgb, ${hex} 45%, white)`

  return (
    <span className={`relative inline-block shrink-0 ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        loading="eager"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className="h-8 w-8 object-contain"
        style={{ filter: getImageShadow(n, hex) }}
      />
      <SparkleOverlay color={sparkleColor} />
    </span>
  )
}
