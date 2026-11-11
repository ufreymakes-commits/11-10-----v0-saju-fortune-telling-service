'use client'

import { useState } from 'react'
import { DownloadIcon, Share2Icon } from 'lucide-react'
import { downloadBlob, renderCardPng } from '@/lib/card-export'

export const CARD_BUTTON_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60'

export const FOOTER_TEXT = 'Designed by Sajume \u00b7 The Eerie K-Traditional Astrology'

const SITE_NAME = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_CANONICAL_URL || '').hostname.replace(/^www\./, '')
  } catch {
    return 'Sajume'
  }
})()

const STARS: Array<[number, number, number, number]> = [
  [6, 14, 2, 0], [10, 78, 3, 1.2], [18, 90, 2, 0.6], [24, 6, 3, 2.1], [38, 94, 2, 1.7],
  [46, 4, 2, 0.3], [58, 92, 3, 2.4], [64, 8, 2, 1.1], [74, 88, 2, 0.8], [80, 12, 3, 1.9],
  [90, 70, 2, 0.4], [92, 26, 2, 2.2], [14, 40, 2, 1.4], [30, 60, 2, 0.9],
]

function CornerOrnament({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 28 28" className={`absolute h-7 w-7 ${className}`} aria-hidden="true" fill="none">
      <path d="M2 26V8C2 4.700 4.700 2 8 2h18" stroke="#e9c872" strokeWidth="1.400" strokeLinecap="round" />
      <path d="M7 21V10c0-1.700 1.300-3 3-3h11" stroke="#e9c872" strokeOpacity="0.55" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M2 2l3.200 0L2 5.200z" fill="#e9c872" />
      <circle cx="13" cy="2" r="1.200" fill="#e9c872" />
      <circle cx="2" cy="13" r="1.200" fill="#e9c872" />
    </svg>
  )
}

interface TarotFrameProps {
  id: string
  label: string
  background: string
  accent: string
  siteName?: string
  children: React.ReactNode
}

// 세 장의 카드가 공유하는 타로 카드 틀: 2:3 비율, 금색 이중 테두리, 모서리 장식, 별빛, 하단 문구.
export function TarotFrame({ id, label, background, accent, siteName = SITE_NAME, children }: TarotFrameProps) {
  return (
    <section aria-label={label}>
      <div id={id} className="orb-card-frame relative aspect-[2/3] w-full rounded-[22px] p-[3px]">
        <div
          className="relative flex h-full w-full flex-col overflow-hidden rounded-[19px] px-5 pb-3 pt-6"
          style={{
            background,
            boxShadow: 'inset 0 0 0 1px rgba(233, 200, 114, 0.5), inset 0 0 40px rgba(0, 0, 0, 0.35)',
          }}
        >
          {STARS.map(([top, left, size, delay], i) => (
            <span
              key={i}
              className="orb-star absolute rounded-full"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: size,
                height: size,
                animationDelay: `${delay}s`,
                backgroundColor: i % 3 === 0 ? accent : '#f6e6b4',
              }}
              aria-hidden="true"
            />
          ))}

          <CornerOrnament className="left-2 top-2" />
          <CornerOrnament className="right-2 top-2 rotate-90" />
          <CornerOrnament className="bottom-2 right-2 rotate-180" />
          <CornerOrnament className="bottom-2 left-2 -rotate-90" />

          {children}

          <p className="relative mt-2 text-center text-[7.5px] leading-snug tracking-[0.12em] text-[#e9dff7]/65">
            {FOOTER_TEXT}
            <br />
            {siteName}
          </p>
        </div>
      </div>
    </section>
  )
}

export function CardHeading({ title, englishName }: { title: React.ReactNode; englishName: string }) {
  return (
    <div className="relative text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#f1d98a]">{title}</p>
      {englishName && (
        <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.28em] text-[#e9dff7]/75">{englishName}</p>
      )}
    </div>
  )
}

interface CardActionsProps {
  targetId: string
  slug: string
  firstName: string
  shareText: string
  showShare?: boolean
  backgroundColor?: string
  className?: string
}

async function renderPng(targetId: string, backgroundColor: string): Promise<Blob> {
  const node = document.getElementById(targetId)
  if (!node) throw new Error('Card not found')
  return renderCardPng(node, { pixelRatio: 2, backgroundColor })
}

export function CardActions({
  targetId,
  slug,
  firstName,
  shareText,
  showShare = true,
  backgroundColor = '#0f0a28',
  className = '',
}: CardActionsProps) {
  const [busy, setBusy] = useState<'save' | 'share' | null>(null)
  const [message, setMessage] = useState('')

  const safeName = firstName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'you'
  const fileName = `sajume-${slug}-${safeName}.png`

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSave = async () => {
    setBusy('save')
    try {
      downloadBlob(await renderPng(targetId, backgroundColor), fileName)
    } catch {
      flash('Could not save the image. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const handleShare = async () => {
    setBusy('share')
    try {
      const blob = await renderPng(targetId, backgroundColor)
      const file = new File([blob], fileName, { type: 'image/png' })
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText })
      } else {
        downloadBlob(blob, fileName)
        await navigator.clipboard?.writeText(window.location.href).catch(() => undefined)
        flash('Image saved and report link copied.')
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') flash('Could not share. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const buttonClass = CARD_BUTTON_CLASS

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={handleSave} disabled={busy !== null} className={buttonClass}>
          <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {busy === 'save' ? 'Saving...' : 'Save image'}
        </button>
        {showShare && (
          <button type="button" onClick={handleShare} disabled={busy !== null} className={buttonClass}>
            <Share2Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {busy === 'share' ? 'Preparing...' : 'Share'}
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="min-h-4 text-center text-[10px] text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
