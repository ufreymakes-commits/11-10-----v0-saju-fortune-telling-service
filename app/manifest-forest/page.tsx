'use client'

import { useState, useEffect, useRef } from 'react'

const WISHES = [
  { name: 'Grace', text: '"I hope I\'m finally happy with where I am in life. And maybe 10kg lighter? haha. See you in a year!"' },
  { name: 'Lian', text: '"Please let me pass the bar exam. I\'ve worked so hard for this. Just once, I want to make my parents proud."' },
  { name: 'Rachel', text: '"I hope Joe and I are still together and even happier. Please let this one be \'the one\'."' },
  { name: 'Amanda', text: '"To the future me: Did you finally quit that soul-sucking job? I hope you\'re doing something you actually love now."' },
  { name: 'Sher', text: '"Just want my mom to stay healthy. Everything else I can handle on my own."' },
  { name: 'Vanessa', text: '"Moving to Seoul was my biggest dream. One year from now, I hope I\'m sitting in a cafe in Hongdae, reading this email."' },
]

function FloatingWish({ wish, style }: { wish: typeof WISHES[0]; style: React.CSSProperties }) {
  return (
    <div
      className="absolute pointer-events-none select-none animate-float-up"
      style={style}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg">📧</span>
        <div className="bg-purple-950/60 border border-purple-700/30 rounded-lg px-3 py-2 max-w-[160px] backdrop-blur-sm">
          <p className="text-purple-300/70 text-[10px] font-semibold mb-0.5">{wish.name}</p>
          <p className="text-white/40 text-[9px] leading-relaxed line-clamp-3">{wish.text}</p>
        </div>
      </div>
    </div>
  )
}

export default function ManifestForestPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [wish, setWish] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3
      audioRef.current.play().catch(() => {})
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
    <div className="min-h-screen bg-[#0a0612] text-white relative overflow-x-hidden">
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0px) scale(0.85); }
          10%  { opacity: 1; }
          80%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-320px) scale(0.95); }
        }
        .animate-float-up {
          animation: floatUp 8s ease-in-out infinite;
        }
      `}</style>

      {/* Background audio */}
      <audio ref={audioRef} loop preload="auto">
        <source src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/forest-ambient.mp3" type="audio/mpeg" />
      </audio>

      {/* Header title above image */}
      <div className="relative z-10 pt-8 pb-4 text-center px-4">
        <p className="text-purple-400/70 text-[10px] md:text-xs tracking-[0.3em] uppercase font-medium mb-2">
          ✦ The Gumihos await ✦
        </p>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight text-balance">
          Welcome to the<br />Manifest Forest
        </h1>
      </div>

      {/* Image with floating wishes */}
      <div className="relative w-full max-w-2xl mx-auto px-4">
        <div className="relative overflow-hidden">
          {/* Top fade — blends image into background */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#0a0612] to-transparent z-10 pointer-events-none" />

          {/* The Gumiho image */}
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Gemini_Generated_Image_io9toxio9toxio9t.png-QmBxvKR1SU1yJPGdXNPKt5675k3HSv.jpeg"
            alt="The Gumihos of the Manifest Forest"
            className="w-full h-auto block"
          />

          {/* Bottom fade — blends image into background */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0612] to-transparent z-10 pointer-events-none" />

          {/* Floating wishes — left */}
          <FloatingWish wish={WISHES[0]} style={{ left: '4%', bottom: '10%', animationDelay: '0s', animationDuration: '9s' }} />
          <FloatingWish wish={WISHES[3]} style={{ left: '8%', bottom: '5%', animationDelay: '4s', animationDuration: '11s' }} />

          {/* Floating wishes — center */}
          <FloatingWish wish={WISHES[1]} style={{ left: '50%', transform: 'translateX(-50%)', bottom: '5%', animationDelay: '1.5s', animationDuration: '10s' }} />
          <FloatingWish wish={WISHES[4]} style={{ left: '50%', transform: 'translateX(-50%)', bottom: '0%', animationDelay: '6s', animationDuration: '8.5s' }} />

          {/* Floating wishes — right */}
          <FloatingWish wish={WISHES[2]} style={{ right: '4%', bottom: '10%', animationDelay: '3s', animationDuration: '9.5s' }} />
          <FloatingWish wish={WISHES[5]} style={{ right: '8%', bottom: '5%', animationDelay: '7s', animationDuration: '10.5s' }} />
        </div>
      </div>

      {/* Body text */}
      <div className="relative z-10 max-w-xl mx-auto px-6 pt-6 pb-6 text-center" style={{ lineHeight: 1.6, wordBreak: 'keep-all' }}>
        <div className="space-y-5 text-[13px] md:text-[14px] text-white/70">
          <p>
            We are the Gumihos,<br />
            the mystical guardians of dreams.
          </p>
          <p>
            Leave your deepest wish<br />
            here with us.
          </p>
          <p>
            We&apos;ll keep it safe and<br />
            <strong className="text-white font-bold">deliver it back to your email</strong><br />
            in exactly one year.
          </p>
          <p className="mt-5">
            Who knows?<br />
            By the time you receive this letter,<br />
            your wish might have already<br />
            become reality.
          </p>
          <p className="text-[11px] md:text-[12px] text-white/40 italic">
            P.S. We only collect true wishes, not livers! 😉
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 max-w-xl mx-auto px-6 mb-8">
        <div className="flex-1 h-px bg-purple-900/50" />
        <span className="text-purple-500/50 text-xs tracking-widest">✦</span>
        <div className="flex-1 h-px bg-purple-900/50" />
      </div>

      {/* Form */}
      <div className="relative z-10 max-w-xl mx-auto px-6 pb-24">
        {status === 'success' ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-purple-950/50 border border-purple-800/40">
            <div className="text-4xl mb-4">🦊</div>
            <h2 className="text-xl font-semibold text-purple-300 mb-3">Your wish has been received.</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              The Gumihos will guard it carefully.<br />
              In exactly one year, your wish will find its way back to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-purple-400/80 mb-2 tracking-wide uppercase">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Enter your name"
                className="w-full bg-purple-950/30 border border-purple-800/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-purple-950/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-400/80 mb-2 tracking-wide uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full bg-purple-950/30 border border-purple-800/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-purple-950/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-400/80 mb-2 tracking-wide uppercase">
                Your Deepest Wish
              </label>
              <textarea
                value={wish}
                onChange={e => setWish(e.target.value)}
                required
                rows={5}
                placeholder="Write your wish here... The Gumihos are listening."
                className="w-full bg-purple-950/30 border border-purple-800/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-purple-950/50 transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-400 text-xs">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3.5 rounded-xl bg-purple-800 hover:bg-purple-700 text-white font-semibold text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-600/50"
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
