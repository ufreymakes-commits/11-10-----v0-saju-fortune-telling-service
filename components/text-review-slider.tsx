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

  // Auto-scroll effect for PC
  useEffect(() => {
    const container = scrollRef.current
    if (!container || isPaused) return

    const scrollSpeed = 0.5 // pixels per frame
    let animationId: number

    const scroll = () => {
      if (container && !isPaused) {
        container.scrollLeft += scrollSpeed
        
        // Reset to start when reached end
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0
        }
      }
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationId)
  }, [isPaused])

  // Split reviews into rows for PC (2 rows)
  const midPoint = Math.ceil(reviews.length / 2)
  const row1 = reviews.slice(0, midPoint)
  const row2 = reviews.slice(midPoint)

  const ReviewCard = ({ review }: { review: Review }) => (
    <div className="flex-shrink-0 w-[300px] md:w-[350px] bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
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
      {/* Mobile: Single scrollable row */}
      <div className="md:hidden overflow-x-auto scrollbar-hide pb-4">
        <div className="flex gap-3 px-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>

      {/* PC: Two rows with auto-scroll */}
      <div 
        className="hidden md:block"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div 
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className="space-y-3 pb-4">
            {/* Row 1 */}
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {[...row1, ...row1].map((review, idx) => (
                <ReviewCard key={`r1-${review.id}-${idx}`} review={review} />
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {[...row2, ...row2].map((review, idx) => (
                <ReviewCard key={`r2-${review.id}-${idx}`} review={review} />
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
