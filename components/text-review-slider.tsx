'use client'

import { useState, useEffect, useRef } from 'react'

interface Review {
  id: number
  text: string
  name: string
  country: string
  flag: string
  date: string
}

interface TextReviewSliderProps {
  reviews: Review[]
}

export function TextReviewSlider({ reviews }: TextReviewSliderProps) {
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)

  // PC Auto-scroll effect
  useEffect(() => {
    const container = scrollRef.current
    if (!container || isPaused) return

    const scrollSpeed = 1 // pixels per frame
    let animationId: number
    let currentScroll = 0

    const scroll = () => {
      if (container && !isPaused) {
        currentScroll += scrollSpeed
        container.scrollLeft = currentScroll
        
        // Get the width of one full row set (original + duplicate)
        const rowWidth = container.scrollWidth / 2
        
        // Reset when reached halfway (after first duplicate)
        if (currentScroll >= rowWidth) {
          currentScroll = 0
          container.scrollLeft = 0
        }
      }
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused])

  // Reorder reviews for mobile 2-row layout
  // Row 1: 1-13 (Emily to Nom)
  // Row 2: 8 (Meng) to end, then 2-7 (Hannah to Simona)
  const mobileRow1 = reviews.slice(0, 13) // Emily W to Nom
  const mobileRow2 = [
    ...reviews.slice(7, 8),  // Meng (id: 8)
    ...reviews.slice(8)      // Rest from Pranjali to end
  ]

  const ReviewCard = ({ review }: { review: Review }) => (
    <div className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[350px] bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl">{review.flag}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{review.name}</p>
          <p className="text-xs text-white/40">
            {review.country ? `${review.country} · ` : ''}{review.date}
          </p>
        </div>
      </div>
      <p className="text-xs text-white/70 leading-relaxed line-clamp-4">
        {review.text}
      </p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Mobile: 2 rows with swipe */}
      <div className="md:hidden space-y-3 pb-4">
        {/* Row 1 */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-2" style={{ width: 'max-content' }}>
            {[...mobileRow1, ...mobileRow1].map((review, idx) => (
              <ReviewCard key={`mobile-r1-${review.id}-${idx}`} review={review} />
            ))}
          </div>
        </div>
        {/* Row 2 */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-2" style={{ width: 'max-content' }}>
            {[...mobileRow2, ...mobileRow2].map((review, idx) => (
              <ReviewCard key={`mobile-r2-${review.id}-${idx}`} review={review} />
            ))}
          </div>
        </div>
      </div>

      {/* PC: Auto-scroll rows */}
      <div 
        className="hidden md:block"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="space-y-3 pb-4">
          {/* Row 1 - PC */}
          <div 
            ref={scrollRef}
            className="overflow-x-hidden"
          >
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {[...reviews.slice(0, 13), ...reviews.slice(0, 13)].map((review, idx) => (
                <ReviewCard key={`pc-r1-${review.id}-${idx}`} review={review} />
              ))}
            </div>
          </div>
          
          {/* Row 2 - PC */}
          <div 
            ref={mobileScrollRef}
            className="overflow-x-hidden"
          >
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {[...mobileRow2, ...mobileRow2].map((review, idx) => (
                <ReviewCard key={`pc-r2-${review.id}-${idx}`} review={review} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll hint for mobile */}
      <p className="text-center text-xs text-white/30 md:hidden">
        Swipe to see more reviews
      </p>
    </div>
  )
}
