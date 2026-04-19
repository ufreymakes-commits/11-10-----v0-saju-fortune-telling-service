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
  itemsPerPage?: number
  autoPlayInterval?: number
}

export function ReviewSlider({ 
  reviews, 
  itemsPerPage = 10,
  autoPlayInterval = 6000 
}: ReviewSliderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  
  // 10개씩 페이지로 나누기
  const totalPages = Math.ceil(reviews.length / itemsPerPage)
  const pages = Array.from({ length: totalPages }, (_, pageIndex) => 
    reviews.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
  )
  
  const nextPage = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }, [totalPages])
  
  const prevPage = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }, [totalPages])
  
  // Auto-play (6초마다 자동 넘김)
  useEffect(() => {
    if (totalPages <= 1) return
    const interval = setInterval(nextPage, autoPlayInterval)
    return () => clearInterval(interval)
  }, [totalPages, nextPage, autoPlayInterval])
  
  return (
    <div className="relative">
      {/* Slider container */}
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((pageReviews, pageIndex) => (
            <div 
              key={pageIndex}
              className="w-full flex-shrink-0"
            >
              {/* 10개씩 2열 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pageReviews.map((review) => (
                  <div 
                    key={review.id} 
                    className="bg-white rounded-xl overflow-hidden shadow-lg"
                  >
                    <Image
                      src={review.src}
                      alt={review.alt}
                      width={600}
                      height={150}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation - 페이지가 2개 이상일 때만 표시 */}
      {totalPages > 1 && (
        <>
          {/* 좌우 화살표 */}
          <button
            onClick={prevPage}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 transition-all hover:scale-110"
            aria-label="Previous reviews"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextPage}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-gray-700 transition-all hover:scale-110"
            aria-label="Next reviews"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* 페이지 인디케이터 (점) */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`transition-all duration-300 ${
                  index === currentPage 
                    ? 'w-8 h-2.5 bg-pink-400 rounded-full' 
                    : 'w-2.5 h-2.5 bg-white/40 rounded-full hover:bg-white/60'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
          
          {/* 페이지 카운터 */}
          <p className="text-center text-sm text-white/60 mt-3">
            Page {currentPage + 1} of {totalPages}
          </p>
        </>
      )}
    </div>
  )
}
