'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { HeartIcon } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface BuyerOfferInfo {
  expiresAt: string
  priceUsd: string
}

const REGULAR_PRICE = '19.99'
const OFFER_COPY = 'Check your match with your crush, partner, favorite idol, even your ex.'
const SCROLL_TRIGGER = 0.6

function formatExpiry(expiresAt: string) {
  return new Date(expiresAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// The server decides eligibility; this only hides the UI once the real expiry time has passed in this tab.
function useOfferActive(expiresAt: string) {
  const [state, setState] = useState<{ active: boolean; label: string } | null>(null)

  useEffect(() => {
    const expiresMs = new Date(expiresAt).getTime()
    const update = () => setState({ active: Date.now() < expiresMs, label: formatExpiry(expiresAt) })
    update()
    const remaining = expiresMs - Date.now()
    if (remaining <= 0) return
    const timer = setTimeout(update, Math.min(remaining + 250, 2_147_000_000))
    return () => clearTimeout(timer)
  }, [expiresAt])

  return state
}

function OfferBody({ label }: { label: string }) {
  return (
    <>
      <p className="text-sm text-foreground">
        <span className="font-bold">Buyer-only: ${'15.99'}</span>{' '}
        <span className="text-muted-foreground">(regular ${REGULAR_PRICE})</span>
      </p>
      <p className="text-xs text-muted-foreground">{OFFER_COPY}</p>
      <p className="text-xs font-medium text-pink-400">Offer ends {label}</p>
    </>
  )
}

export function CompatBuyerOfferCard({ offer, reportId }: { offer: BuyerOfferInfo; reportId: string }) {
  const state = useOfferActive(offer.expiresAt)
  if (!state?.active) return null

  return (
    <section aria-labelledby="buyer-offer-heading" className="mt-8 rounded-xl border border-pink-500/30 bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <HeartIcon className="h-4 w-4 text-pink-400" aria-hidden="true" />
        <h3 id="buyer-offer-heading" className="text-sm font-semibold text-foreground">
          Saju Compatibility, for report buyers
        </h3>
      </div>
      <div className="space-y-1.5">
        <OfferBody label={state.label} />
      </div>
      <Link
        href={`/compatibility?offer=${reportId}`}
        className="mt-4 block w-full rounded-lg bg-pink-500 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-pink-400"
      >
        Check a match
      </Link>
    </section>
  )
}

export function CompatBuyerOfferPopup({ offer, reportId }: { offer: BuyerOfferInfo; reportId: string }) {
  const state = useOfferActive(offer.expiresAt)
  const [open, setOpen] = useState(false)
  const shownRef = useRef(false)
  const storageKey = `compat_buyer_offer_popup_${reportId}`

  useEffect(() => {
    if (!state?.active) return

    try {
      if (localStorage.getItem(storageKey)) shownRef.current = true
    } catch {
      // Storage blocked: fall back to once per page load.
    }
    if (shownRef.current) return

    const onScroll = () => {
      if (shownRef.current) return
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      if (window.scrollY / scrollable < SCROLL_TRIGGER) return
      shownRef.current = true
      try {
        localStorage.setItem(storageKey, '1')
      } catch {
        // Ignore: shownRef still keeps it to one showing per page load.
      }
      setOpen(true)
      window.removeEventListener('scroll', onScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [state?.active, storageKey])

  if (!state?.active) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Saju Compatibility, for report buyers</DialogTitle>
          <DialogDescription className="sr-only">Buyer-only price on the Saju Compatibility report.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <OfferBody label={state.label} />
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <Link
            href={`/compatibility?offer=${reportId}`}
            className="block w-full rounded-lg bg-pink-500 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-pink-400"
          >
            Check a match
          </Link>
          <DialogClose className="w-full rounded-lg py-2 text-center text-xs text-muted-foreground transition-colors hover:text-foreground">
            Maybe later
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
