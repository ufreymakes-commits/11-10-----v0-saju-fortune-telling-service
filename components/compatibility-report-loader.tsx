'use client'

// 궁합 리포트 생성 대기 화면. 생성 요청은 1번만 보내고(202 = 시작/진행 중), 상태는 3초마다 폴링한다.
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HeartIcon } from 'lucide-react'

const LOADING_MESSAGES = [
  'Reading both charts...',
  'Matching your day pillars...',
  'Checking where your elements meet...',
  'Looking at your timing together...',
  'Writing your answer...',
  'Putting your report together...',
]

export function CompatibilityReportLoader({ submissionId }: { submissionId: string }) {
  const router = useRouter()
  const started = useRef(false)
  const startedAt = useRef(Date.now())
  const [msg, setMsg] = useState(0)
  const [state, setState] = useState<'waiting' | 'failed' | 'slow'>('waiting')
  const [kick, setKick] = useState(0)

  useEffect(() => {
    const i = setInterval(() => setMsg((m) => (m + 1) % LOADING_MESSAGES.length), 2800)
    return () => clearInterval(i)
  }, [])

  // 생성 시작 (한 번만; "Try again" 을 누르면 다시)
  useEffect(() => {
    if (started.current && kick === 0) return
    started.current = true
    startedAt.current = Date.now()
    setState('waiting')
    fetch('/api/compatibility/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    }).catch(() => { /* 폴링이 처리 */ })
  }, [submissionId, kick])

  // 상태 폴링
  useEffect(() => {
    const i = setInterval(async () => {
      try {
        const res = await fetch(`/api/compatibility/check-report?submissionId=${submissionId}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.state === 'done') { clearInterval(i); router.refresh(); return }
        if (data.state === 'failed') setState('failed')
        else if (Date.now() - startedAt.current > 4 * 60_000) setState('slow')
      } catch { /* 계속 폴링 */ }
    }, 3000)
    return () => clearInterval(i)
  }, [submissionId, router, kick])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <HeartIcon className="w-10 h-10 text-pink-500 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-pink-500/30 animate-ping" />
      </div>

      <div className="space-y-3 max-w-sm">
        <h2 className="text-white font-semibold text-xl">Your Compatibility is Being Revealed</h2>
        {state === 'waiting' && <p className="text-pink-400 text-sm min-h-[1.25rem]">{LOADING_MESSAGES[msg]}</p>}
        {state !== 'waiting' && (
          <p className="text-white/70 text-sm">
            Your payment went through. We&apos;re still preparing your report. You can safely close this page; we will keep trying, and it will be here when you come back.
          </p>
        )}
      </div>

      {state === 'waiting' ? (
        <>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full animate-[compatload_100s_ease-out_forwards]" />
          </div>
          <p className="text-white/30 text-xs">This usually takes about a minute and a half</p>
        </>
      ) : (
        <button onClick={() => setKick((k) => k + 1)} className="rounded-full border border-pink-500/40 px-4 py-2 text-sm text-pink-300 hover:bg-pink-500/10">
          Try again
        </button>
      )}

      <style>{`@keyframes compatload { 0% { width: 0% } 40% { width: 45% } 75% { width: 75% } 100% { width: 94% } }`}</style>
    </div>
  )
}
