'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/#products' },
  { label: 'Company', href: '/#company' },
  { label: 'Paid Reports', href: '/my-reports' },
]

const handleReportIssue = () => {
  // Tally popup 트리거
  const element = document.querySelector('[data-tally-open="681NVP"]') as any
  if (element) {
    element.click()
  }
}

export function NavSidebar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    setOpen(false)
  }

  return (
    <>
      {/* Hamburger button — fixed top-right */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed top-4 right-4 z-50 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
      >
        <span className="block w-5 h-0.5 bg-white/90 rounded-full" />
        <span className="block w-5 h-0.5 bg-white/90 rounded-full" />
        <span className="block w-5 h-0.5 bg-white/90 rounded-full" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel — slides in from right, 50% width */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-1/2 max-w-xs bg-[#110d1a] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <span className="text-sm font-semibold text-white/80 tracking-wide">Menu</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-5 py-6 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href.split('#')[0]) && link.href !== '/'
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-white/70 hover:text-white hover:bg-white/8'
                }`}
              >
                {link.label}
                {link.label === 'Paid Reports' && !user && (
                  <span className="ml-auto text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded">
                    Login required
                  </span>
                )}
              </Link>
            )
          })}
          
          {/* Report Issue Button */}
          <button
            onClick={() => {
              const btn = document.querySelector('[data-tally-open="681NVP"]') as any
              if (btn) btn.click()
              setOpen(false)
            }}
            className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-colors mt-2"
          >
            Report Issue
          </button>
        </nav>

        {/* Auth section at bottom */}
        <div className="px-5 py-5 border-t border-white/10">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary uppercase flex-shrink-0">
                  {user.email?.[0] ?? 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">{user.email}</p>
                  <p className="text-[10px] text-white/40">Signed in</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-xs text-white/50 hover:text-white/80 transition-colors text-left px-3 py-2 rounded-lg hover:bg-white/8"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/auth/login"
                className="block w-full text-center text-sm font-medium bg-primary text-primary-foreground py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="block w-full text-center text-sm text-white/60 hover:text-white/90 transition-colors py-2"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
