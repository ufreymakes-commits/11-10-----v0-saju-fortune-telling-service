import { useId } from 'react'

interface TailIconProps {
  hex: string
  className?: string
}

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

export function TailIcon({ hex, className }: TailIconProps) {
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
