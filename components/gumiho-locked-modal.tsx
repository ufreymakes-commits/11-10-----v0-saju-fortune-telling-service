'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// In-page notice (instead of a browser alert) for the Gumiho card before the 99 Facts purchase.
export function GumihoLockedModal({
  open,
  onClose,
  ctaHref,
  ctaLabel = 'Unlock my 99 Facts',
}: {
  open: boolean
  onClose: () => void
  ctaHref?: string
  ctaLabel?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gumiho-locked-title"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 id="gumiho-locked-title" className="mb-3 text-lg font-bold text-foreground">
          For 99 Facts customers 🦊
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-foreground/80">
          The Gumiho answers your 3 questions using your full 99 Facts reading, so it opens after you get your report.
          You can also add it at checkout for a lower price.
        </p>
        <div className="flex flex-col gap-2">
          {ctaHref && (
            <Link href={ctaHref}>
              <Button className="h-11 w-full text-sm font-semibold">{ctaLabel}</Button>
            </Link>
          )}
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            {ctaHref ? 'Close' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  )
}
