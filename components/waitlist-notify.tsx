'use client'

import { useState, type FormEvent } from 'react'
import { track } from '@/hooks/use-track'

type Status = 'idle' | 'loading' | 'joined' | 'already' | 'error'

export function WaitlistNotify() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'loading') return
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setMessage(typeof data?.error === 'string' ? data.error : 'Something went wrong. Please try again.')
        return
      }
      setStatus(data.alreadyOnList ? 'already' : 'joined')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'joined' || status === 'already') {
    return (
      <p role="status" className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-center text-sm text-blue-200">
        {status === 'already' ? "You're already on the list." : "You're on the list. We'll email you once it launches."}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          track('notice_me_click', '/', { product: 'subscription' })
        }}
        className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 hover:border-blue-400/50 transition-all"
      >
        Notify me
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2" noValidate>
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-blue-500/30 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/70 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'loading' || email.trim() === ''}
        className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-blue-500/30 hover:bg-blue-500/40 text-blue-100 border border-blue-500/40 transition-all disabled:opacity-50"
      >
        {status === 'loading' ? 'Joining...' : 'Notify me'}
      </button>
      {status === 'error' && (
        <p role="alert" className="text-xs text-red-300">
          {message}
        </p>
      )}
    </form>
  )
}
