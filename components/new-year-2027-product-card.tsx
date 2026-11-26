import Image from 'next/image'
import { NoticeMeButton } from '@/components/notice-me-button'

const TITLE = 'My 100-Year Golden Luck Timeline + 2027 Monthly Calendar (Coming soon)'
const DESCRIPTION = 'Your 10-year luck cycles from birth to age 100, plus a month-by-month 2027 calendar for love, money and energy.'
const IMAGE_ALT = 'My 100-Year Golden Luck Timeline and 2027 Monthly Calendar'

export function NewYear2027ProductCard({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="group">
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-3 h-full flex flex-col">
          <h4 className="text-sm font-semibold text-white mb-2">{TITLE}</h4>
          <div className="relative w-full mb-3 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0 aspect-square">
            <Image src="/media/thumb-2027.webp" alt={IMAGE_ALT} width={800} height={800} sizes="(min-width: 768px) 300px, 45vw" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-white/70 mb-3 flex-grow leading-relaxed">{DESCRIPTION}</p>
          <div className="flex items-center justify-between mb-2 mt-auto gap-2">
            <span className="text-[11px] text-blue-300">Life map + 12-month calendar</span>
            <span className="text-base font-bold text-white/50">$19.99</span>
          </div>
          <NoticeMeButton product="subscription" className="w-full text-center py-1.5 px-2 rounded-lg text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 hover:border-blue-400/50 transition-all block" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-white mb-3">{TITLE}</h4>
        <div className="relative w-full mb-3 rounded-lg overflow-hidden bg-[#1a1a2e]" style={{ aspectRatio: '1/1' }}>
          <Image
            src="/media/thumb-2027.webp"
            sizes="(min-width: 768px) 384px, 100vw"
            alt={IMAGE_ALT}
            fill
            className="object-cover"
          />
        </div>
        <p className="text-xs text-white/60 mb-3">{DESCRIPTION}</p>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-blue-300">Life map + 12-month calendar</span>
            <span className="text-sm font-bold text-white/50">$19.99</span>
          </div>
          <NoticeMeButton
            product="subscription"
            className="shrink-0 text-center py-2 px-4 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-400 text-white border border-blue-400 transition-all"
          />
        </div>
      </div>
    </div>
  )
}
