'use client'

import { useEffect, useRef, useState } from 'react'

// Real count: /api/stats/user-count (base + real submissions). It changes only when someone actually submits.
const FALLBACK_COUNT = 6425
const POLL_MS = 20000
const TYPE_DELAY_MS = 120
const RETYPE_EVERY_MS = 6000 // re-types the same real number so the line feels alive

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

  // Typing animation of the current real number: right away when it changes, then again every few seconds.
  // The number itself only changes when the real count goes up.
  useEffect(() => {
    const full = format(count)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(full)
      return
    }
    let typer: ReturnType<typeof setInterval> | null = null
    const type = () => {
      if (typer) clearInterval(typer)
      let index = 0
      setShown('')
      typer = setInterval(() => {
        index += 1
        setShown(full.slice(0, index))
        if (index >= full.length && typer) clearInterval(typer)
      }, TYPE_DELAY_MS)
    }
    const loop = setInterval(type, RETYPE_EVERY_MS)
    return () => {
      clearInterval(loop)
      if (typer) clearInterval(typer)
    }
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
          <span className="ml-px inline-block h-[0.9em] w-[2px] translate-y-[0.1em] animate-pulse bg-current align-baseline" />
        </span>
      </span>
      <span className="text-foreground/80">users got their reports</span>
    </span>
  )
}
