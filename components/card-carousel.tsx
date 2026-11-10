'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { CardActions } from '@/components/tarot-frame'

export interface CarouselItem {
  id: string
  slug: string
  label: string
  shareText: string
  node: React.ReactNode
}

interface CardCarouselProps {
  items: CarouselItem[]
  firstName: string
}

const CARD_WIDTH = 300

export function CardCarousel({ items, firstName }: CardCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const handleScroll = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const center = scroller.scrollLeft + scroller.clientWidth / 2
    let best = 0
    let bestDistance = Infinity
    Array.from(scroller.children).forEach((child, i) => {
      const el = child as HTMLElement
      const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center)
      if (distance < bestDistance) {
        best = i
        bestDistance = distance
      }
    })
    setActive(best)
  }, [])

  const goTo = (index: number) => {
    const scroller = scrollerRef.current
    const target = scroller?.children[Math.max(0, Math.min(items.length - 1, index))] as HTMLElement | undefined
    if (!scroller || !target) return
    scroller.scrollTo({
      left: target.offsetLeft + target.offsetWidth / 2 - scroller.clientWidth / 2,
      behavior: 'smooth',
    })
  }

  return (
    <section aria-roledescription="carousel" aria-label="Your Sajume cards" className="relative mb-6">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingInline: `calc(50% - ${CARD_WIDTH / 2}px)` }}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${item.label} (${i + 1} of ${items.length})`}
            className="shrink-0 snap-center"
            style={{ width: CARD_WIDTH }}
          >
            {item.node}
            <CardActions
              targetId={item.id}
              slug={item.slug}
              firstName={firstName}
              shareText={item.shareText}
              className="mt-3"
            />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous card"
            className="absolute left-2 top-1/3 hidden h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white shadow-md transition-opacity disabled:opacity-30 md:flex"
          >
            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === items.length - 1}
            aria-label="Next card"
            className="absolute right-2 top-1/3 hidden h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white shadow-md transition-opacity disabled:opacity-30 md:flex"
          >
            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="mt-1 flex items-center justify-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${item.label}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${i === active ? 'w-5 bg-[#cdbfff]' : 'w-2 bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
