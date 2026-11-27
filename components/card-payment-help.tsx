'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/** Big, clear line under the PayPal buttons. */
export function NoPayPalAccountNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-base font-bold text-foreground ${className}`}>
      No PayPal account needed. Pay with any card. 💳
    </p>
  )
}

/** In-page popup shown when the buyer taps "Use Credit Card" (replaces the old browser alert). */
export function CardHelpModal({ open, onClose, checkoutHref }: { open: boolean; onClose: () => void; checkoutHref: string }) {
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
      aria-labelledby="card-help-title"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 id="card-help-title" className="mb-3 text-lg font-bold text-foreground">
          Paying with a card 💳
        </h3>
        <ul className="mb-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/80">
          <li>
            In the PayPal window, choose <span className="font-semibold">&apos;Pay with a card&apos;</span>.
          </li>
          <li>You do not need a PayPal account.</li>
          <li>
            If it fails several times, please open this page in <span className="font-semibold">Safari or Chrome</span>{' '}
            (outside the TikTok app) and try again.
          </li>
        </ul>
        <div className="flex flex-col gap-2">
          <Link href={checkoutHref}>
            <Button className="h-11 w-full bg-[#FFC439] text-sm font-semibold text-black hover:bg-[#f5b830]">
              Continue to payment
            </Button>
          </Link>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
