'use client'

import { Loader2 } from 'lucide-react'
import { NoticeMeButton } from '@/components/notice-me-button'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthName = (ym?: string | null) => {
  const m = Number(String(ym ?? '').slice(5, 7))
  return m >= 1 && m <= 12 ? MONTHS[m - 1] : ''
}
const shorten = (q: string, n = 70) => (q.length > n ? `${q.slice(0, n).trim()}…` : q)

type Zodiac = { animal: string; exampleBirthYears: number[]; isOwnZodiac?: boolean }
export interface YearSnapshotData {
  year: number
  nickname: string
  previousYear: number
  scores: { love: number; money: number; career: number }
  zodiacs: { lucky: Zodiac[]; caution: Zodiac | null }
  luckyColor: { color: string; element: string } | null
  keywords: string[]
  themeTitle: string
  themeStory: string
  recurringScenes: string[]
  lastYearVsThisYear: string
  questionSpoilers: { questionIndex: number; spoiler: string }[]
  powerMonth: { month: string; why: string; actions: string[] } | null
  bonusMoneyMonth: { month: string; action: string } | null
  relationshipWindow: { months: string[]; meaning: string; signals: string; howToAct: string; whereOrWho: string }
  watchOutNote: string
  dontDo: { month: string; action: string } | null
  luckyColorReason: string
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 text-balance">{title}</h3>
      <div className="space-y-2 text-[15px] leading-relaxed text-foreground text-pretty">{children}</div>
    </div>
  )
}

const zodiacLine = (z: Zodiac) => `${z.animal} (${z.exampleBirthYears.join(', ')})`

export function YearSnapshotPending({ year }: { year: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
      <p className="text-sm text-muted-foreground">The Gumiho is reading your {year}… Your snapshot will appear here in a moment.</p>
    </div>
  )
}

export function YearSnapshot({ data, questions }: { data: YearSnapshotData; questions: string[] }) {
  const rw = data.relationshipWindow
  const loveMonths = (rw?.months ?? []).map(monthName).filter(Boolean)
  return (
    <div className="bg-card border border-primary/30 rounded-xl p-5 space-y-4">
      <div className="text-center">
        <span className="text-xs text-primary font-semibold uppercase tracking-wider">Bonus</span>
        <h2 className="text-xl font-bold text-gradient mt-1 text-balance">
          Your {data.year} Snapshot · Year of the {data.nickname}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Love', icon: '💗', v: data.scores.love },
          { label: 'Money', icon: '💰', v: data.scores.money },
          { label: 'Career', icon: '💼', v: data.scores.career },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/50 py-2">
            <p className="text-xs text-muted-foreground">
              {s.icon} {s.label}
            </p>
            <p className="text-lg font-bold text-foreground">{s.v}</p>
          </div>
        ))}
      </div>

      {data.keywords?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {data.keywords.map((k) => (
            <span key={k} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
              {k}
            </span>
          ))}
        </div>
      )}

      <Block title={`Your ${data.year} theme`}>
        <p className="font-semibold">{data.themeTitle}</p>
        <p>{data.themeStory}</p>
      </Block>

      {data.recurringScenes?.length > 0 && (
        <Block title={`Scenes you'll see again and again in ${data.year}`}>
          <ul className="space-y-2 pl-5 list-disc marker:text-primary">
            {data.recurringScenes.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Block>
      )}

      <Block title={`${data.previousYear} vs. ${data.year}`}>
        <p>{data.lastYearVsThisYear}</p>
      </Block>

      {data.questionSpoilers?.length > 0 && (
        <Block title="Your 3 questions: a positive spoiler 🔮">
          {data.questionSpoilers.map((s) => (
            <div key={s.questionIndex}>
              <p className="text-sm font-semibold text-muted-foreground">“{shorten(questions[s.questionIndex - 1] ?? '')}”</p>
              <p>{s.spoiler}</p>
            </div>
          ))}
        </Block>
      )}

      {data.powerMonth && (
        <Block title={`🔥 Your power month: ${monthName(data.powerMonth.month)}`}>
          <p>{data.powerMonth.why}</p>
          <ul className="space-y-2 pl-5 list-disc marker:text-primary">
            {data.powerMonth.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          {data.bonusMoneyMonth && (
            <p>
              <span className="font-semibold">Bonus money month: {monthName(data.bonusMoneyMonth.month)}.</span> {data.bonusMoneyMonth.action}
            </p>
          )}
        </Block>
      )}

      {rw && (
        <Block title={`💘 Your relationship window${loveMonths.length ? `: ${loveMonths.join(' & ')}` : ''}`}>
          <p>{rw.meaning}</p>
          <p>
            <span className="font-semibold">Signals to read:</span> {rw.signals}
          </p>
          <p>
            <span className="font-semibold">How to act:</span> {rw.howToAct}
          </p>
          <p>{rw.whereOrWho}</p>
          {data.zodiacs?.lucky?.length > 0 && (
            <p className="text-sm text-muted-foreground">Lucky animals: {data.zodiacs.lucky.map(zodiacLine).join(' · ')}</p>
          )}
        </Block>
      )}

      {data.zodiacs?.caution && (
        <Block title={`⚠️ Watch out for: ${zodiacLine(data.zodiacs.caution)}`}>
          <p>{data.watchOutNote}</p>
        </Block>
      )}

      {data.dontDo && (
        <Block title={`🚫 Don't (${monthName(data.dontDo.month)})`}>
          <p>{data.dontDo.action}</p>
        </Block>
      )}

      {data.luckyColor && (
        <Block title={`🎨 Your lucky color: ${data.luckyColor.color}`}>
          <p>{data.luckyColorReason}</p>
        </Block>
      )}

      <div className="border-t border-border pt-4 flex flex-col items-center gap-3 text-center">
        <p className="text-sm font-semibold text-foreground text-balance">
          My 100-Year Golden Luck Timeline + 2027 Monthly Calendar (Coming soon)
        </p>
        <NoticeMeButton
          product="subscription"
          className="inline-block rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        />
      </div>
    </div>
  )
}
