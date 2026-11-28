'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Copy, CreditCard, LifeBuoy } from 'lucide-react'
import { copyText, isTikTokInApp, trackCheckoutIssue } from '@/lib/payments/checkout-issue'

export const SAJUME_HELP_FORM_URL = 'https://tally.so/r/681NVP'

function absoluteUrl(href?: string): string {
  if (typeof window === 'undefined') return href ?? ''
  if (!href) return window.location.href
  return new URL(href, window.location.origin).toString()
}

/** Copy button with a visible fallback: if copying is blocked, the link is shown so it can be long-pressed. */
function CopyLinkButton({
  url,
  label,
  className,
  onCopied,
}: {
  url: string
  label: string
  className: string
  onCopied?: () => void
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={async () => {
          const ok = await copyText(url)
          setState(ok ? 'copied' : 'failed')
          onCopied?.()
        }}
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
        {state === 'copied' ? 'Link copied' : label}
      </button>
      {state === 'failed' && (
        <p className="mt-1.5 break-all text-[11px] leading-snug select-all">{url}</p>
      )}
    </>
  )
}

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
  const [inTikTok, setInTikTok] = useState(false)
  useEffect(() => setInTikTok(isTikTokInApp()), [])

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
        {inTikTok && (
          <div className="mb-4 rounded-xl border border-amber-400 bg-amber-50 p-3 text-amber-900">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              You&apos;re inside TikTok
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              Card payments often fail in the TikTok browser. For the smoothest payment,{' '}
              <span className="font-bold">open this page in Safari or Chrome</span>.
            </p>
            <CopyLinkButton
              url={absoluteUrl(checkoutHref)}
              label="Copy payment link"
              onCopied={() => trackCheckoutIssue('inapp_copy')}
              className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-amber-400 bg-white text-sm font-semibold text-amber-900"
            />
            <p className="mt-1.5 text-center text-[11px] text-amber-800">Then paste it into Safari or Chrome</p>
          </div>
        )}
        <ul className="mb-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/80">
          <li className="font-bold text-foreground underline underline-offset-2">
            In the PayPal window, choose &apos;Pay with a card&apos;.
          </li>
          <li>You do not need a PayPal account.</li>
          {!inTikTok && (
            <li>
              If it fails several times, please <span className="font-bold">open this page in Safari or Chrome</span>{' '}
              (outside the TikTok app) and try again.
            </li>
          )}
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

/** Shown on checkout after a payment attempt that did not finish. */
export function PaymentRetryBanner({ submissionId }: { submissionId: string }) {
  return (
    <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3.5 text-left text-red-900">
      <p className="text-sm font-semibold">Payment didn&apos;t go through?</p>
      <p className="mt-1 text-xs leading-relaxed">
        No money was taken. Try a different card, or{' '}
        <span className="font-bold">open this page in Safari or Chrome</span>.
      </p>
      <div className="mt-2.5 flex gap-2">
        <div className="flex-1">
          <CopyLinkButton
            url={absoluteUrl()}
            label="Copy link"
            onCopied={() => trackCheckoutIssue('retry_banner_copy', { submissionId })}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white text-xs font-semibold text-red-900"
          />
        </div>
        <a
          href={SAJUME_HELP_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCheckoutIssue('retry_banner_help', { submissionId })}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white text-xs font-semibold text-red-900"
        >
          <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          Request help to Sajume
        </a>
      </div>
    </div>
  )
}
