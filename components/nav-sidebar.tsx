'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV_LINKS: { label: string; href: string; sub?: boolean }[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/#products' },
  { label: 'Company', href: '/company' },
  { label: 'Manifest Forest', href: '/manifest-forest', sub: true },
  { label: 'Paid Reports', href: '/my-report' },
]

const LOGO_PAGES = ['/', '/company', '/my-report', '/start']

export function NavSidebar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const showLogo = LOGO_PAGES.includes(pathname)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  const handleProductsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If already on homepage, smooth scroll to #products
    if (pathname === '/') {
      e.preventDefault()
      const el = document.getElementById('products')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      setOpen(false)
    }
  }

  return (
    <>
      {/* Top logo bar - hides on scroll */}
      {showLogo && (
        <div className={`fixed top-0 left-0 right-0 z-50 h-10 bg-white border-b border-black/8 flex items-center justify-center transition-transform duration-300 ${scrolled ? '-translate-y-full' : 'translate-y-0'}`}>
          <Link href="/" aria-label="Sajume home">
            <Image
              src="/images/sajume-logo.png"
              alt="SAJUME"
              width={72}
              height={20}
              className="object-contain"
              priority
              priority
            />
          </Link>
        </div>
      )}

      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="fixed top-3 right-4 z-[60] w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors"
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

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-1/2 max-w-xs bg-[#110d1a] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Navigation menu"
      >
        {/* Header */}
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
            const hasAnchor = link.href.includes('#')
            const hrefPath = link.href.split('#')[0] || '/'
            const isActive = !hasAnchor && (
              hrefPath === '/' ? pathname === '/' : pathname === hrefPath || pathname.startsWith(hrefPath + '/')
            )
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={link.href === '/#products' ? handleProductsClick : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                  link.sub ? 'ml-4 px-3 py-2 text-xs' : 'px-3 py-3'
                } ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : link.sub
                    ? 'text-emerald-400/70 hover:text-emerald-300 hover:bg-white/8'
                    : 'text-white/70 hover:text-white hover:bg-white/8'
                }`}
              >
                {link.sub && <span className="text-emerald-600/60">└</span>}
                {link.label}
              </Link>
            )
          })}

          {/* Report Issue */}
          <a
            href="#tally-open=681NVP&tally-layout=modal&tally-emoji-text=👋&tally-emoji-animation=wave"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-colors mt-2"
          >
            Report Issue
          </a>
        </nav>

        {/* Bottom branding */}
        <div className="px-5 py-5 border-t border-white/10 space-y-2">
          <p className="text-xs text-white/30 text-center">K-Saju · The Next Gen Fortune Telling</p>
          <p className="text-xs text-white/20 text-center">
            Business Inquiry:{' '}
            <a href="mailto:hello@sajume.com" className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2">
              hello@sajume.com
            </a>
          </p>
        </div>
      </aside>
    </>
  )
}
