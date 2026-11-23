'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ttPage } from '@/lib/analytics/tiktok'

// The base snippet in app/layout.tsx already reported the first page. App Router navigations
// do not reload the document, so every later path change has to report itself.
export function TikTokPageView() {
  const pathname = usePathname()
  const lastPath = useRef(pathname)

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    ttPage()
  }, [pathname])

  return null
}
