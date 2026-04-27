'use client'

import { track } from '@/hooks/use-track'

interface NoticeMeButtonProps {
  product: 'bracelet' | 'compatibility' | 'subscription'
  className?: string
}

export function NoticeMeButton({ product, className }: NoticeMeButtonProps) {
  return (
    <a
      href="#tally-open=81JRrr&tally-layout=modal&tally-emoji-text=👋&tally-emoji-animation=wave"
      onClick={() => track('notice_me_click', '/', { product })}
      className={className}
    >
      Notice me
    </a>
  )
}
