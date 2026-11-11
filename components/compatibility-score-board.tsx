// 궁합 v2 점수판 (리포트 상단). 숫자는 코드가 계산한 값, 문장은 모델이 쓴 한 줄.
import type { ScoreBoard } from '@/lib/compat/constants'

export function CompatibilityScoreBoard({ board }: { board: ScoreBoard }) {
  return (
    <section className="w-full rounded-2xl border border-pink-500/20 bg-gradient-to-b from-pink-950/40 to-white/[0.02] p-5 text-left space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">{board.relationshipLabel}</span>
        <span className="rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[11px] font-semibold text-pink-300">{board.matchType}</span>
      </div>

      <div className="flex items-end gap-4">
        <div className="shrink-0">
          <span className="text-5xl font-bold leading-none text-pink-400 tabular-nums">{board.total}</span>
          <span className="ml-1 text-sm text-white/40">/100</span>
        </div>
        <p className="pb-1 text-sm leading-snug text-white/80">{board.totalLine || board.matchTypeLine}</p>
      </div>
      {board.totalLine && board.matchTypeLine && <p className="-mt-3 text-xs text-white/45">{board.matchType}: {board.matchTypeLine}</p>}

      <div className="space-y-4">
        {board.subs.map((s) => (
          <div key={s.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-white">{s.label}</span>
              <span className="text-sm font-semibold text-pink-300 tabular-nums">{s.score}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-400" style={{ width: `${Math.max(3, Math.min(100, s.score))}%` }} />
            </div>
            <p className="text-[11px] text-white/40">{s.hint}</p>
            {s.line && <p className="text-xs leading-relaxed text-white/75">{s.line}</p>}
          </div>
        ))}
      </div>

      {board.concern && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="mb-1 text-[11px] text-white/45">Your question</p>
          <p className="text-sm italic text-white/85">&ldquo;{board.concern}&rdquo;</p>
          <p className="mt-1 text-[11px] text-white/40">Answered in sections 1 and 4, and again further down.</p>
        </div>
      )}
    </section>
  )
}
