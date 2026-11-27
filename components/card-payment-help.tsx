'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'

const BOX_TONES = {
  light: {
    card: 'border-sky-300/80 bg-gradient-to-r from-sky-100 to-indigo-100',
    icon: 'bg-white text-sky-600 ring-1 ring-sky-200',
    title: 'text-slate-950',
    body: 'text-slate-800/80',
  },
  dark: {
    card: 'border-sky-300/30 bg-gradient-to-r from-sky-500/15 to-indigo-500/15',
    icon: 'bg-sky-400/20 text-sky-200 ring-1 ring-sky-300/30',
    title: 'text-white',
    body: 'text-white/70',
  },
} as const

/** Same box style as ReportGuarantee: card icon, bold title, short help text. */
export function NoPayPalAccountNote({ className = '', tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  const t = BOX_TONES[tone]
  return (
    <div className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left shadow-sm ${t.card} ${className}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.icon}`}>
        <CreditCard className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-semibold leading-tight ${t.title}`}>No PayPal account needed. Pay with any card.</p>
        <p className={`mt-0.5 text-xs leading-relaxed ${t.body}`}>
          Choose &apos;Pay with a card&apos; in the PayPal window. If it fails several times, open this page in Safari or
          Chrome (outside the TikTok app) and try again.
        </p>
      </div>
    </div>
  )
}

/** In-page popup shown when the buyer taps "Use Credit Card" (replaces the old browser alert). */
export function CardHelpModal({ open, onClose, checkoutHref }: { open: boolean; onClose: () => void; checkoutHref?: string }) {
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
          {checkoutHref ? (
            <Link href={checkoutHref}>
              <Button className="h-11 w-full bg-[#FFC439] text-sm font-semibold text-black hover:bg-[#f5b830]">
                Continue to payment
              </Button>
            </Link>
          ) : (
            <Button onClick={onClose} className="h-11 w-full bg-[#FFC439] text-sm font-semibold text-black hover:bg-[#f5b830]">
              Got it
            </Button>
          )}
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
