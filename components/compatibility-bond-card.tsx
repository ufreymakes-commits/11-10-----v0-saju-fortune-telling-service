'use client'

import { useRef, useState } from 'react'
import { DownloadIcon, HeartIcon, Share2Icon } from 'lucide-react'
import type { ScoreBoard } from '@/lib/compat/constants'
import { downloadBlob, needsWarmupCapture, renderCardPng } from '@/lib/card-export'
import { ENGLISH_TO_KOREAN, getDayMasterCharacter } from '@/lib/day-master-characters'
import { CARD_BUTTON_CLASS, CardHeading, TarotFrame } from './tarot-frame'

const BOND_BACKGROUND = 'linear-gradient(160deg, #5c2049 0%, #3c1552 55%, #1f1038 100%)'
const EXPORT_BACKGROUND = '#1a0d3a'
const FALLBACK_IMAGE = '/images/characters-collection.png'
const SITE_NAME = 'my.sajume.com'
const EXPORT_WIDTH = 360
const EXPORT_HEIGHT = 640

// 내보내기 이미지는 같은 출처 파일이어야 비어 보이지 않는다. 캐릭터 파일명은 /public/images에 그대로 있다.
function localCharacterImage(imagePath?: string): string {
  const file = imagePath?.split('?')[0].split('/').pop()
  return file ? `/images/${file}` : FALLBACK_IMAGE
}

function displayDate(value: string): string {
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value)
  return match ? match[0] : value
}

function fileSlug(name: string, fallback: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '') || fallback
}

// 내보내기 배경용 별: 값이 고정되어 있어 화면마다 같은 이미지가 나온다.
const EXPORT_STARS = Array.from({ length: 36 }, (_, i) => {
  const seed = (i + 1) * 9301 + 49297
  const x = (seed * 233280) % 100
  const y = ((seed * 7) % 233280) % 100
  return { x, y, size: i % 5 === 0 ? 3 : 2, pink: i % 3 === 0 }
})

interface PersonSlotProps {
  name: string
  birthDate: string
  dayMaster: string
}

function PersonSlot({ name, birthDate, dayMaster }: PersonSlotProps) {
  const character = getDayMasterCharacter(ENGLISH_TO_KOREAN[dayMaster] ?? dayMaster)
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <img
        src={localCharacterImage(character?.imagePath)}
        alt={character ? `${name}: ${dayMaster}` : ''}
        width={72}
        height={72}
        className="h-[72px] w-[72px] object-contain"
      />
      <p className="mt-1 w-full truncate text-[13px] font-semibold leading-tight text-white">{name}</p>
      <p className="text-[9px] leading-tight text-[#e9dff7]/70">{displayDate(birthDate)}</p>
      <p className={`mt-0.5 text-[10px] font-medium leading-tight ${character?.color ?? 'text-[#f1d98a]'}`}>
        {dayMaster}
      </p>
    </div>
  )
}

interface BondFaceProps extends Omit<CompatibilityBondCardProps, 'board'> {
  id: string
  board: ScoreBoard
}

function BondFace({ id, board, personABirthDate, personBBirthDate, personADayMaster, personBDayMaster }: BondFaceProps) {
  const bars = board.subs.slice(0, 4)
  return (
    <TarotFrame id={id} label="The Bond compatibility card" background={BOND_BACKGROUND} accent="#f08aa8" siteName={SITE_NAME}>
      <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-1.5 text-center">
        <div>
          <CardHeading title="The Bond" englishName="" />
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e9c872]">{board.matchType}</p>
        </div>

        <div className="flex items-start gap-1">
          <PersonSlot name={board.names.a} birthDate={personABirthDate} dayMaster={personADayMaster} />
          <div className="flex h-[72px] w-6 shrink-0 items-center justify-center">
            <HeartIcon className="h-5 w-5 fill-pink-400 text-pink-400" aria-hidden="true" />
          </div>
          <PersonSlot name={board.names.b} birthDate={personBBirthDate} dayMaster={personBDayMaster} />
        </div>

        <p
          className="text-[40px] font-bold leading-none text-pink-300"
          style={{ textShadow: '0 0 18px rgba(240, 138, 168, 0.65), 0 0 6px rgba(233, 200, 114, 0.5)' }}
        >
          {board.total}
          <span className="ml-0.5 text-[13px] font-medium text-[#f1d98a]">/100</span>
        </p>

        <p className="line-clamp-2 text-[11px] leading-snug text-[#e9dff7]/85">{board.totalLine}</p>

        <ul className="flex flex-col gap-1.5">
          {bars.map((sub) => (
            <li key={sub.key}>
              <div className="flex items-baseline justify-between text-[9px] leading-tight text-[#e9dff7]/85">
                <span>{sub.label}</span>
                <span className="font-semibold text-[#f1d98a]">{sub.score}</span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, sub.score))}%`,
                    background: 'linear-gradient(90deg, #ec4899, #fb7185)',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </TarotFrame>
  )
}

interface CompatibilityBondCardProps {
  board: ScoreBoard
  personABirthDate: string
  personBBirthDate: string
  personADayMaster: string
  personBDayMaster: string
}

export function CompatibilityBondCard(props: CompatibilityBondCardProps) {
  const { board } = props
  const exportRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'save' | 'share' | null>(null)
  const [message, setMessage] = useState('')

  const fileName = `sajume-bond-${fileSlug(board.names.a, 'you')}-${fileSlug(board.names.b, 'partner')}.png`

  async function buildPng(): Promise<Blob> {
    const node = exportRef.current
    if (!node) throw new Error('Card not found')
    return renderCardPng(node, {
      backgroundColor: EXPORT_BACKGROUND,
      pixelRatio: 3,
      waitForAssets: true,
      warmup: needsWarmupCapture(),
    })
  }

  async function handleSave() {
    setBusy('save')
    setMessage('')
    try {
      downloadBlob(await buildPng(), fileName)
    } catch {
      setMessage('Could not create the image. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function handleShare() {
    setBusy('share')
    setMessage('')
    try {
      const blob = await buildPng()
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${board.names.a} & ${board.names.b} on Sajume` })
      } else {
        downloadBlob(blob, fileName)
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') setMessage('Could not create the image. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[360px] print:hidden">
      <BondFace id="bond-card" {...props} />

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={handleSave} disabled={busy !== null} className={CARD_BUTTON_CLASS}>
          <DownloadIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {busy === 'save' ? 'Saving...' : 'Save image'}
        </button>
        <button type="button" onClick={handleShare} disabled={busy !== null} className={CARD_BUTTON_CLASS}>
          <Share2Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {busy === 'share' ? 'Preparing...' : 'Share'}
        </button>
      </div>
      <p role="status" className="mt-2 min-h-4 text-center text-xs text-muted-foreground">
        {message}
      </p>

      <div aria-hidden="true" className="pointer-events-none fixed top-0" style={{ left: -10000 }}>
        <div
          ref={exportRef}
          className="bond-export relative flex items-center justify-center overflow-hidden"
          style={{
            width: EXPORT_WIDTH,
            height: EXPORT_HEIGHT,
            background: 'linear-gradient(160deg, #2a1248 0%, #1a0d3a 55%, #0f0a28 100%)',
          }}
        >
          {EXPORT_STARS.map((star, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                backgroundColor: star.pink ? '#f08aa8' : '#f6e6b4',
                opacity: 0.55,
              }}
            />
          ))}
          <div className="relative" style={{ width: 300 }}>
            <BondFace id="bond-card-export" {...props} />
          </div>
        </div>
      </div>
    </div>
  )
}
