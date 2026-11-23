'use client'

import { useEffect, useRef, useState } from 'react'

const START_COUNT = 6425
const UPDATE_INTERVAL_MS = 3000
const TYPE_DELAY_MS = 90

function format(value: number) {
  return value.toLocaleString('en-US')
}

export function TypingUserCount() {
  const [count, setCount] = useState(START_COUNT)
  const [shown, setShown] = useState(format(START_COUNT))
  const isFirstRun = useRef(true)

  useEffect(() => {
    const id = setInterval(() => {
      setCount((prev) => prev + 1 + Math.floor(Math.random() * 3))
    }, UPDATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const full = format(count)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
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
      <span
        className="relative inline-block text-lg font-extrabold tabular-nums text-secondary"
        style={{ textShadow: '0 0 10px currentColor' }}
      >
        <span className="sr-only">{format(count)}</span>
        <span aria-hidden="true" className="invisible">
          {format(count)}
        </span>
        <span aria-hidden="true" className="absolute left-0 top-0 whitespace-nowrap">
          {shown}
          <span className="ml-px inline-block h-[0.9em] w-[2px] translate-y-[0.1em] animate-pulse bg-current align-baseline" />
        </span>
      </span>
      <span>users got their reports</span>
    </span>
  )
}
