'use client'

import { cn } from '@/lib/utils'

const DEFAULT_MESSAGES = ['SJPJ \u00b7 Global local time & English Report']

interface MarqueeProps {
  messages?: string[]
  className?: string
  durationSeconds?: number
}

export function Marquee({ messages = DEFAULT_MESSAGES, className, durationSeconds }: MarqueeProps) {
  const items = Array.from({ length: 4 }, () => messages).flat()
  const style = durationSeconds ? { animationDuration: `${durationSeconds}s` } : undefined

  return (
    <div
      className={cn(
        'w-full overflow-hidden bg-white text-black text-sm border-b border-black/10 relative z-20',
        className,
      )}
      role="region"
      aria-label="Site announcement"
    >
      <div className="flex whitespace-nowrap">
        <div className="flex animate-marquee" style={style}>
          {items.map((message, i) => (
            <div key={i} className="flex items-center px-7 py-3">
              <span className="font-bold tracking-wide">{message}</span>
            </div>
          ))}
        </div>
        <div className="flex animate-marquee" style={style} aria-hidden="true">
          {items.map((message, i) => (
            <div key={i} className="flex items-center px-7 py-3">
              <span className="font-bold tracking-wide">{message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
