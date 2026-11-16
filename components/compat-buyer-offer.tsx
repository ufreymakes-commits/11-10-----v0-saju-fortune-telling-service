'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { XIcon } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface BuyerOfferInfo {
  expiresAt: string
  priceUsd: string
}

const REGULAR_PRICE = '19.99'
const SCROLL_TRIGGER = 0.6
const HOUR_MS = 60 * 60 * 1000

interface OfferStatus {
  eligible: boolean
  expiresAt: string | null
  offsetMs: number
}

// Reads the server's answer and its clock, so the countdown follows server time rather than the viewer's device clock.
async function fetchOfferStatus(url: string): Promise<OfferStatus> {
  const requestedAt = Date.now()
  const res = await fetch(url, { cache: 'no-store' })
  const receivedAt = Date.now()
  if (!res.ok) throw new Error('offer status unavailable')
  const body = await res.json()
  const serverNow = typeof body.serverNow === 'string' ? new Date(body.serverNow).getTime() : Number.NaN
  return {
    eligible: Boolean(body.eligible),
    expiresAt: typeof body.expiresAt === 'string' ? body.expiresAt : null,
    offsetMs: Number.isFinite(serverNow) ? serverNow - (requestedAt + receivedAt) / 2 : 0,
  }
}

function formatExpiry(expiresAt: string) {
  return new Date(expiresAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
}

// The server enforces expiry on every price check; this only mirrors it in the UI.
// remainingMs stays null until mount so nothing time-dependent renders on the server.
function useBuyerOfferClock(offer: BuyerOfferInfo, reportId: string) {
  const { data } = useSWR(`/api/offers/compat-buyer?reportId=${reportId}`, fetchOfferStatus, {
    shouldRetryOnError: false,
    dedupingInterval: 30_000,
  })
  const offsetMs = data?.offsetMs ?? 0
  const expiresAt = data?.eligible && data.expiresAt ? data.expiresAt : offer.expiresAt
  const endedOnServer = data ? !data.eligible : false
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    const expiresMs = new Date(expiresAt).getTime()
    const tick = () => {
      const remaining = expiresMs - (Date.now() + offsetMs)
      setRemainingMs(remaining)
      if (remaining <= 0) clearInterval(timer)
    }
    const timer = setInterval(tick, 1000)
    tick()
    return () => clearInterval(timer)
  }, [expiresAt, offsetMs])

  const active = remainingMs !== null && remainingMs > 0 && !endedOnServer
  return {
    active,
    remainingMs: remainingMs ?? 0,
    expiryLabel: active ? formatExpiry(expiresAt) : '',
  }
}

type Clock = ReturnType<typeof useBuyerOfferClock>

const SPARKLES = [
  { className: '-top-2 left-6 h-3.5 w-3.5', delay: '0s' },
  { className: 'top-14 -right-1.5 h-2.5 w-2.5', delay: '0.8s' },
  { className: 'top-1/2 -left-2 h-2.5 w-2.5', delay: '1.5s' },
  { className: '-bottom-2 right-10 h-3.5 w-3.5', delay: '0.4s' },
]

function OfferTicket({
  offer,
  reportId,
  clock,
  headingId,
  headingAs: Heading = 'h3',
  sparkles = false,
  large = false,
  topSlot,
}: {
  offer: BuyerOfferInfo
  reportId: string
  clock: Clock
  headingId?: string
  headingAs?: 'h3' | 'p'
  sparkles?: boolean
  large?: boolean
  topSlot?: React.ReactNode
}) {
  const lastHour = clock.remainingMs < HOUR_MS

  return (
    <div className="ticket-shadow relative">
      {sparkles &&
        SPARKLES.map((s) => (
          <span
            key={s.className}
            aria-hidden="true"
            className={cn('ticket-sparkle', s.className)}
            style={{ animationDelay: s.delay }}
          />
        ))}

      <div className={cn('ticket-top relative px-5 text-center sm:px-8', large ? 'pt-9 pb-8' : 'pt-7 pb-7')}>
        {topSlot}
        <Heading
          id={headingId}
          className="font-montserrat text-balance text-2xl font-extrabold leading-tight text-white sm:text-3xl"
        >
          Are you meant to be?
        </Heading>
        <p className="mx-auto mt-2 max-w-xs text-pretty text-sm leading-relaxed text-white/85">
          Your crush, partner, favorite idol, even your ex.
        </p>

        <div className="mt-5 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
          <span className="ticket-price whitespace-nowrap font-montserrat text-6xl font-extrabold leading-none sm:text-7xl">
            <span className="sr-only">Buyer-only price </span>${offer.priceUsd}
          </span>
          <span className="whitespace-nowrap text-lg font-medium text-white/65 line-through decoration-white/65">
            <span className="sr-only">Regular price </span>${REGULAR_PRICE}
          </span>
        </div>

        <p className="mt-3 inline-block rounded-full bg-[#ff4fa3] px-3.5 py-1 text-sm font-bold leading-5 text-[#1d0733]">
          {'\u2212$4 right away'}
        </p>

        <div className="mt-4">
          <p
            className={cn(
              'text-base tabular-nums',
              lastHour ? 'font-extrabold text-[#ff7ac0]' : 'font-semibold text-white',
            )}
          >
            {lastHour ? 'Last hour' : 'Ends in'} <span role="timer">{formatCountdown(clock.remainingMs)}</span>
          </p>
          <p className="mt-0.5 text-xs text-white/75">Offer ends {clock.expiryLabel}</p>
        </div>
      </div>

      <div className="ticket-bottom relative px-5 pb-5 pt-6 sm:px-8">
        <Link
          href={`/compatibility?offer=${reportId}`}
          className="ticket-cta block w-full rounded-xl px-4 py-3.5 text-center text-base font-extrabold leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Check our match {'\u2014'} ${offer.priceUsd}
        </Link>
      </div>
    </div>
  )
}

export function CompatBuyerOfferCard({ offer, reportId }: { offer: BuyerOfferInfo; reportId: string }) {
  const clock = useBuyerOfferClock(offer, reportId)
  if (!clock.active) return null

  return (
    <section aria-labelledby="buyer-offer-heading" className="mx-auto mt-8 w-full max-w-md">
      <OfferTicket offer={offer} reportId={reportId} clock={clock} headingId="buyer-offer-heading" />
    </section>
  )
}

export function CompatBuyerOfferPopup({ offer, reportId }: { offer: BuyerOfferInfo; reportId: string }) {
  const clock = useBuyerOfferClock(offer, reportId)
  const [open, setOpen] = useState(false)
  const shownRef = useRef(false)
  const storageKey = `compat_buyer_offer_popup_${reportId}`

  useEffect(() => {
    if (!clock.active) return

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
  }, [clock.active, storageKey])

  if (!clock.active) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none motion-reduce:animate-none motion-reduce:duration-0 sm:max-w-md"
      >
        <DialogTitle className="sr-only">Buyer-only Saju Compatibility offer</DialogTitle>
        <DialogDescription className="sr-only">
          Saju Compatibility for ${offer.priceUsd} instead of ${REGULAR_PRICE}, for a limited time.
        </DialogDescription>

        <div aria-hidden="true" className="ticket-glow pointer-events-none absolute -inset-10 -z-10" />

        <div className="ticket-pop">
          <OfferTicket
            offer={offer}
            reportId={reportId}
            clock={clock}
            headingAs="p"
            sparkles
            large
            topSlot={
              <DialogClose className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white">
                <XIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </DialogClose>
            }
          />
          <DialogClose className="mx-auto mt-4 block rounded-md px-3 py-2 text-sm text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-white">
            Maybe later
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
