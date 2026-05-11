'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HeartIcon } from 'lucide-react'

interface CompatibilityReportLoaderProps {
  submissionId: string
}

const LOADING_MESSAGES = [
  'Reading the cosmic energies...',
  'Analyzing your Four Pillars...',
  'Mapping elemental compatibility...',
  'Calculating relationship dynamics...',
  'Uncovering your destiny together...',
  'Preparing your compatibility report...',
]

export function CompatibilityReportLoader({ submissionId }: CompatibilityReportLoaderProps) {
  const router = useRouter()
  const [messageIdx, setMessageIdx] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Rotate loading messages
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isGenerating) return
    setIsGenerating(true)

    const generate = async () => {
      try {
        const response = await fetch('/api/compatibility/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Generation failed. Please contact support.')
          return
        }

        if (data.success) {
          // Reload the page — the server component will now render the report
          router.refresh()
        }
      } catch {
        setError('Something went wrong. Please try refreshing the page.')
      }
    }

    generate()
  }, [submissionId, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="text-xs text-white/40 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-8">
      {/* Animated hearts */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <HeartIcon className="w-10 h-10 text-pink-500 animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-pink-500/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-pink-500/20 animate-ping [animation-delay:0.3s]" />
      </div>

      <div className="space-y-3">
        <h2 className="text-white font-semibold text-xl">
          Your Compatibility is Being Revealed
        </h2>
        <p className="text-pink-400 text-sm min-h-[1.25rem] transition-all duration-500">
          {LOADING_MESSAGES[messageIdx]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full animate-[loading_18s_ease-in-out_forwards]" />
      </div>

      <p className="text-white/30 text-xs">This usually takes 15–30 seconds</p>

      <style>{`
        @keyframes loading {
          0% { width: 0% }
          30% { width: 35% }
          60% { width: 65% }
          85% { width: 88% }
          100% { width: 96% }
        }
      `}</style>
    </div>
  )
}
