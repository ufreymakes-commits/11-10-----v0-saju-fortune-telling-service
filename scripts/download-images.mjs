import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public/images')
mkdirSync(publicDir, { recursive: true })

const images = [
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SAJUME-KJvcikx26EMhwGAmVSbg5BI7E2wvxQ.png',
    file: 'sajume-logo.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eulmok-311z2CoqsXicrNLz220oq3Nb7q1aRl.png',
    file: 'eulmok.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gyesu-8YTx4VfcXnNEPPK54QUH0AbfH7oLO3.png',
    file: 'gyesu.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png',
    file: 'mascot.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gyeonggeum-C2Pu1PvGYI22q3evrb6Ynel484URPj.png',
    file: 'gyeonggeum.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/byeonghwa-nwRyjkGV7yuO4EC9wCYlt8Chx6jhyC.png',
    file: 'byeonghwa.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%20181-cfTMJ2cXy3zGAdmW4sf31fboZo7apa.png',
    file: 'kpei-cert.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99facts.png-GQUor5lDB3UZjqnzWfMmGM6jWNHITE.jpeg',
    file: '99facts.jpeg'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8C%E1%85%A6%E1%84%86%E1%85%A9%E1%86%A8%E1%84%8B%E1%85%B3%E1%86%AF%20%E1%84%8B%E1%85%B5%E1%86%B8%E1%84%85%E1%85%A7%E1%86%A8%E1%84%92%E1%85%A2%E1%84%8C%E1%85%AE%E1%84%89%E1%85%A6%E1%84%8B%E1%85%AD.-rHCZrL3MSmA5XIQcuz0W5A0tHTyxAR.png',
    file: 'shopify-logo.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%20186-4UxuQefWCJ3ecnuEVZjkIyjL94QZBh.png',
    file: 'bracelet-card.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Thenextgenpng-haDUszHNXdaOgdcbh4xKKBXTU1PJl5.png',
    file: 'og-image.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Thenextgenpng-MFmWPjDoalrvlPgKoNVgfNdDRvW9z1.png',
    file: 'company-logo.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/founder%20image-Y6vZ39gBOBm3lnx1sWQHGHfVa0syux.png',
    file: 'founder.png'
  },
  {
    url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/certification%20image-v8v85tTjTRrn7KWIxIT6LZqcmhoEdy.png',
    file: 'certification.png'
  },
]

let success = 0
let failed = 0

for (const { url, file } of images) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = await res.arrayBuffer()
    writeFileSync(join(publicDir, file), Buffer.from(buf))
    console.log(`[v0] Downloaded: ${file}`)
    success++
  } catch (e) {
    console.log(`[v0] FAILED: ${file} — ${e.message}`)
    failed++
  }
}

console.log(`\n[v0] Done: ${success} success, ${failed} failed`)
