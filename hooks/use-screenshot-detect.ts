'use client'

import { useEffect } from 'react'
import { track } from '@/hooks/use-track'

/**
 * 캡처/스크린샷 감지
 * - macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
 * - Windows: PrintScreen, Win+Shift+S
 * - visibilitychange 기반 추가 감지
 */
export function useScreenshotDetect(page: string) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // macOS screenshot shortcuts
      const isMacScreenshot =
        e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)
      // Windows PrintScreen
      const isWinPrintScreen = e.key === 'PrintScreen'
      // Windows Snipping Tool (Win+Shift+S)
      const isWinSnip = e.metaKey && e.shiftKey && e.key.toLowerCase() === 's'

      if (isMacScreenshot || isWinPrintScreen || isWinSnip) {
        track('screenshot_detected', page)
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [page])
}
