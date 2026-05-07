'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function ManifestForestPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [wish, setWish] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.35
      audioRef.current.play().catch(() => {
        // autoplay blocked by browser — user interaction needed
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/manifest-wish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, wish }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setStatus('success')
      setName('')
      setEmail('')
      setWish('')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#07100a] text-white relative overflow-x-hidden">
      {/* Background audio */}
      <audio ref={audioRef} loop preload="auto">
        <source src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/forest-ambient.mp3" type="audio/mpeg" />
      </audio>

      {/* Hero image */}
      <div className="relative w-full h-[55vh] min-h-[320px] max-h-[500px]">
        <Image
          src="/images/manifest-forest.jpg"
          alt="Manifest Forest"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#07100a]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#07100a] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-xl mx-auto px-6 pb-24 -mt-8">
        {/* Title */}
        <div className="text-center mb-10">
          <p className="text-emerald-400/70 text-xs tracking-[0.25em] uppercase mb-3 font-medium">✦ The Gumihos await ✦</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 leading-tight">
            Welcome to the<br />Manifest Forest
          </h1>
          <div className="space-y-4 text-[15px] leading-relaxed text-white/75 text-left">
            <p>
              We are the Gumihos, the mystical guardians of dreams.<br />
              Leave your deepest wish here with us.<br />
              We&apos;ll keep it safe and deliver it back to your email in exactly one year.
            </p>
            <p>
              Who knows?<br />
              By the time you receive this letter,<br />
              your wish might have already become reality.
            </p>
            <p className="text-[13px] text-white/40 italic">
              P.S. We only collect true wishes, not livers! 😉
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-emerald-900/60" />
          <span className="text-emerald-500/50 text-xs tracking-widest">✦</span>
          <div className="flex-1 h-px bg-emerald-900/60" />
        </div>

        {/* Form */}
        {status === 'success' ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-emerald-950/50 border border-emerald-800/40">
            <div className="text-4xl mb-4">🦊</div>
            <h2 className="text-xl font-semibold text-emerald-300 mb-3">Your wish has been received.</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              The Gumihos will guard it carefully.<br />
              In exactly one year, your wish will find its way back to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-emerald-400/80 mb-2 tracking-wide uppercase">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Enter your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-600/60 focus:bg-white/8 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-400/80 mb-2 tracking-wide uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-600/60 focus:bg-white/8 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-emerald-400/80 mb-2 tracking-wide uppercase">
                Your Deepest Wish
              </label>
              <textarea
                value={wish}
                onChange={e => setWish(e.target.value)}
                required
                rows={5}
                placeholder="Write your wish here... The Gumihos are listening."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-600/60 focus:bg-white/8 transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-400 text-xs">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-700/50"
            >
              {status === 'loading' ? 'Whispering to the forest...' : '🦊 Leave My Wish'}
            </button>

            <p className="text-center text-xs text-white/25">
              We&apos;ll send your wish back to you in exactly one year.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
