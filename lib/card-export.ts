export interface RenderCardOptions {
  backgroundColor: string
  pixelRatio?: number
  /** Wait for web fonts and every <img> inside the node before capturing. */
  waitForAssets?: boolean
  /** Capture once and throw the result away; the second capture is the one returned. */
  warmup?: boolean
}

// 첫 캡처가 비어 나오는 iOS(및 iPadOS)와 데스크톱 Safari를 구분한다.
export function needsWarmupCapture(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isDesktopSafari = /^((?!chrome|chromium|android|crios|fxios).)*safari/i.test(ua)
  return isIos || isDesktopSafari
}

async function waitForCardAssets(node: HTMLElement) {
  if (typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready
  const images = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const finish = () => {
            img.removeEventListener('load', finish)
            img.removeEventListener('error', finish)
            clearTimeout(timer)
            if (typeof img.decode === 'function') img.decode().then(() => resolve(), () => resolve())
            else resolve()
          }
          const timer = setTimeout(finish, 5000)
          if (img.complete && img.naturalWidth > 0) finish()
          else {
            img.addEventListener('load', finish)
            img.addEventListener('error', finish)
          }
        }),
    ),
  )
}

export async function renderCardPng(node: HTMLElement, options: RenderCardOptions): Promise<Blob> {
  const { backgroundColor, pixelRatio = 2, waitForAssets = false, warmup = false } = options
  if (waitForAssets) await waitForCardAssets(node)
  const { toBlob } = await import('html-to-image')
  const captureOptions = { pixelRatio, cacheBust: true, backgroundColor }
  if (warmup) await toBlob(node, captureOptions).catch(() => null)
  const blob = await toBlob(node, captureOptions)
  if (!blob) throw new Error('Could not render image')
  return blob
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
