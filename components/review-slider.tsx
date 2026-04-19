'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Review {
  id: number
  src: string
  alt: string
}

interface ReviewSliderProps {
  reviews: Review[]
  initialVisibleCount?: number
  autoPlayInterval?: number
}

export function ReviewSlider({ 
  reviews, 
  initialVisibleCount = 10,
  autoPlayInterval = 4000 
}: ReviewSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // 처음 10개는 그리드로 표시, 나머지는 슬라이더
  const gridReviews = reviews.slice(0, initialVisibleCount)
  const sliderReviews = reviews.slice(initialVisibleCount)
  const hasSlider = sliderReviews.length > 0
  
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % sliderReviews.length)
  }, [sliderReviews.length])
  
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + sliderReviews.length) % sliderReviews.length)
  }, [sliderReviews.length])
  
  // Auto-play
  useEffect(() => {
    if (!hasSlider) return
    const interval = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(interval)
  }, [hasSlider, nextSlide, autoPlayInterval])
  
  return (
    <div className="space-y-6">
      {/* Grid of first 10 reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gridReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
              ))}
            </div>
            <div className="relative w-full">
              <Image
                src={review.src}
                alt={review.alt}
                width={500}
                height={120}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Slider for remaining reviews */}
      {hasSlider && (
        <div className="mt-8">
          {/* Dots indicator with "more reviews" label */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-white/50">More reviews</span>
            <div className="flex gap-1.5">
              {sliderReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-pink-400 w-4' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Slider container */}
          <div className="relative overflow-hidden rounded-xl">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {sliderReviews.map((review) => (
                <div 
                  key={review.id} 
                  className="w-full flex-shrink-0 px-2"
                >
                  <div className="bg-white rounded-xl p-3 shadow-lg max-w-md mx-auto">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                        </svg>
                      ))}
                    </div>
                    <div className="relative w-full">
                      <Image
                        src={review.src}
                        alt={review.alt}
                        width={500}
                        height={120}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
              aria-label="Previous review"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
              aria-label="Next review"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Slide counter */}
          <p className="text-center text-xs text-white/40 mt-3">
            {currentSlide + 1} / {sliderReviews.length} more reviews
          </p>
        </div>
      )}
    </div>
  )
}
