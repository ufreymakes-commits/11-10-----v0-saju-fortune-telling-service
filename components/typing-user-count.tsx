'use client'

import { useEffect, useRef, useState } from 'react'

// Real count: /api/stats/user-count (base + real submissions). It changes only when someone actually submits.
const FALLBACK_COUNT = 6425
const POLL_MS = 20000
const TYPE_DELAY_MS = 120

function format(value: number) {
  return value.toLocaleString('en-US')
}

export function TypingUserCount() {
  const [count, setCount] = useState(FALLBACK_COUNT)
  const [shown, setShown] = useState(format(FALLBACK_COUNT))
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/stats/user-count', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && typeof data?.count === 'number') {
          if (!loaded.current) {
            // First load: show the real number right away, no typing effect.
            loaded.current = true
            setShown(format(data.count))
          }
          setCount((prev) => (data.count > prev || prev === FALLBACK_COUNT ? data.count : prev))
        }
      } catch {
        // keep the current number
      }
    }
    load()
    const id = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Type the new number only when the real count goes up.
  const prevCount = useRef(count)
  useEffect(() => {
    if (count <= prevCount.current) {
      prevCount.current = count
      setShown(format(count))
      return
    }
    prevCount.current = count
    const full = format(count)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(full)
      return
    }
    let index = 0
    setShown('')
    const id = setInterval(() => {
      index += 1
      setShown(full.slice(0, index))
      if (index >= full.length) clearInterval(id)
    }, TYPE_DELAY_MS)
    return () => clearInterval(id)
  }, [count])

  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="relative inline-block text-lg font-extrabold tabular-nums text-primary">
        <span className="sr-only">{format(count)}</span>
        <span aria-hidden="true" className="invisible">
          {format(count)}
        </span>
        <span aria-hidden="true" className="absolute left-0 top-0 whitespace-nowrap">
          {shown}
        </span>
      </span>
      <span className="text-foreground/80">users got their reports</span>
    </span>
  )
}
