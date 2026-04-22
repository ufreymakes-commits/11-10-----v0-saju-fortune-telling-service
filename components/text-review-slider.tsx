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
  const pcRow1Ref = useRef<HTMLDivElement>(null)
  const pcRow2Ref = useRef<HTMLDivElement>(null)

  // PC Auto-scroll effect for both rows
  useEffect(() => {
    const scrollSpeed1 = 1 // pixels per frame - Row 1
    const scrollSpeed2 = 0.6 // pixels per frame - Row 2 (slower)
    let animationId: number
    let currentScroll1 = 0
    let currentScroll2 = 0

    const scroll = () => {
      const container1 = pcRow1Ref.current
      const container2 = pcRow2Ref.current
      
      if (container1 && !isPaused) {
        currentScroll1 += scrollSpeed1
        container1.scrollLeft = currentScroll1
        
        const rowWidth1 = container1.scrollWidth / 2
        
        if (currentScroll1 >= rowWidth1) {
          currentScroll1 = 0
          container1.scrollLeft = 0
        }
      }

      if (container2 && !isPaused) {
        currentScroll2 += scrollSpeed2
        container2.scrollLeft = currentScroll2
        
        const rowWidth2 = container2.scrollWidth / 2
        
        if (currentScroll2 >= rowWidth2) {
          currentScroll2 = 0
          container2.scrollLeft = 0
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
            ref={pcRow1Ref}
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
            ref={pcRow2Ref}
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
