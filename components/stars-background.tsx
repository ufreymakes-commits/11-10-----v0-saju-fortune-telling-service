'use client'

import { useEffect, useRef } from 'react'

export function StarsBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    const starCount = 100
    
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
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  )
}
