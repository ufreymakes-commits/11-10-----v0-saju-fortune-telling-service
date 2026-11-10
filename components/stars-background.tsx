'use client'

import { useEffect, useRef } from 'react'

interface StarsBackgroundProps {
  // Lighter variant: fewer stars (even fewer on mobile) and no twinkle for prefers-reduced-motion.
  lite?: boolean
}

export function StarsBackground({ lite = false }: StarsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const starCount = lite ? (isMobile ? 35 : 60) : 100
    
    // Clear existing stars
    container.innerHTML = ''
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      star.style.animationDelay = `${Math.random() * 3}s`
      star.style.opacity = `${0.3 + Math.random() * 0.7}`
      
      // Some bigger stars
      if (Math.random() > 0.9) {
        star.style.width = '3px'
        star.style.height = '3px'
      }
      
      container.appendChild(star)
    }
  }, [lite])

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0${lite ? ' stars-lite' : ''}`}
      aria-hidden="true"
    />
  )
}
