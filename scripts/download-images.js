import fs from 'fs'
import path from 'path'
import https from 'https'

const OUTPUT_DIR = '/vercel/share/v0-project/public/images'

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const IMAGES = [
  // mascot main
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png', file: 'mascot-main.png' },
  // side characters
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/eulmok-311z2CoqsXicrNLz220oq3Nb7q1aRl.png', file: 'eulmok.png' },
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gyesu-8YTx4VfcXnNEPPK54QUH0AbfH7oLO3.png', file: 'gyesu.png' },
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gyeonggeum-C2Pu1PvGYI22q3evrb6Ynel484URPj.png', file: 'gyeonggeum.png' },
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/byeonghwa-nwRyjkGV7yuO4EC9wCYlt8Chx6jhyC.png', file: 'byeonghwa.png' },
  // logo
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8C%E1%85%A6%E1%84%86%E1%85%A9%E1%86%A8%E1%84%8B%E1%85%B3%E1%86%AF%20%E1%84%8B%E1%85%B5%E1%86%B8%E1%84%85%E1%85%A7%E1%86%A8%E1%84%92%E1%85%A2%E1%84%8C%E1%85%AE%E1%84%89%E1%85%A6%E1%84%8B%E1%85%AD.-rHCZrL3MSmA5XIQcuz0W5A0tHTyxAR.png', file: 'shopify-logo.png' },
  // KPEI cert
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%20181-cfTMJ2cXy3zGAdmW4sf31fboZo7apa.png', file: 'kpei-cert.png' },
  // report preview
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99facts.png-GQUor5lDB3UZjqnzWfMmGM6jWNHITE.jpeg', file: '99facts.jpeg' },
  // layout.tsx OG images  
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SAJUME_OG-lEqQBlvNUSOtXcfPZOoSVJz4YaaCvA.png', file: 'og-image.png' },
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SAJUME_OG-lEqQBlvNUSOtXcfPZOoSVJz4YaaCvA.png', file: 'twitter-image.png' },
  // checkout + payment success
  { url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png', file: 'mascot-checkout.png' },
]

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`[skip] ${path.basename(dest)} already exists`)
      return resolve()
    }
    const file = fs.createWriteStream(dest)
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close()
        fs.unlinkSync(dest)
        download(res.headers.location, dest).then(resolve).catch(reject)
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); console.log(`[ok] ${path.basename(dest)}`) ; resolve() })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

for (const img of IMAGES) {
  const dest = path.join(OUTPUT_DIR, img.file)
  try {
    await download(img.url, dest)
  } catch (e) {
    console.error(`[error] ${img.file}: ${e.message}`)
  }
}
console.log('Done.')
