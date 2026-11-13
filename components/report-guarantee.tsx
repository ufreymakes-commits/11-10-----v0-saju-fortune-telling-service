import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportGuaranteeProps {
  tone?: 'light' | 'dark'
  className?: string
}

const TONES = {
  light: {
    card: 'border-violet-300/80 bg-gradient-to-r from-violet-100 to-pink-100',
    icon: 'bg-white text-violet-600 ring-1 ring-violet-200',
    title: 'text-violet-950',
    body: 'text-violet-900/80',
  },
  dark: {
    card: 'border-violet-300/30 bg-gradient-to-r from-violet-500/15 to-pink-500/15',
    icon: 'bg-violet-400/20 text-violet-200 ring-1 ring-violet-300/30',
    title: 'text-white',
    body: 'text-white/70',
  },
} as const

export function ReportGuarantee({ tone = 'light', className }: ReportGuaranteeProps) {
  const styles = TONES[tone]

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left shadow-sm',
        'animate-in fade-in duration-700 motion-reduce:animate-none',
        styles.card,
        className,
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          styles.icon,
        )}
      >
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className={cn('text-sm font-semibold leading-tight', styles.title)}>Report Guarantee</p>
        <p className={cn('mt-0.5 text-xs leading-relaxed', styles.body)}>
          If your report fails to generate, you get a 100% refund.
        </p>
      </div>
    </div>
  )
}
