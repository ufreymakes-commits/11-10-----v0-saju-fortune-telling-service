'use client'

import { useSyncExternalStore } from 'react'
import Image from 'next/image'
import { Spinner } from '@/components/ui/spinner'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

export function LoadingVideoScreen({ message }: { message: string }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="flex min-h-dvh w-full justify-center overflow-hidden bg-[#0a0a14]">
      <div className="relative h-dvh min-h-[560px] w-full md:max-w-[480px]">
        {reducedMotion ? (
          <Image
            src="/media/loading-gumiho-poster.webp"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 480px, 100vw"
            className="object-cover"
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/media/loading-gumiho.mp4"
            poster="/media/loading-gumiho-poster.webp"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/75 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 px-6 pb-10 text-center text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]">
          <h2 role="status" aria-live="polite" className="mb-3 text-balance text-lg font-semibold">
            {message}
          </h2>
          <div className="mb-4 flex items-center justify-center">
            <Spinner className="size-5 text-white" />
          </div>
          <p className="mx-auto max-w-xs text-pretty text-sm leading-relaxed text-white/80">
            Please don&apos;t close the window or resubmit unless a &apos;Load Failed&apos; message appears.
            <br />
            We&apos;ll be finished in less than 2 mins.
          </p>
        </div>
      </div>
    </div>
  )
}
