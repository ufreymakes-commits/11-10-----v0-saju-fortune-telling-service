import sharp from 'sharp'
import { readdir, unlink } from 'fs/promises'
import { join, extname, basename } from 'path'

const IMAGES_DIR = '/vercel/share/v0-project/public/images'
const QUALITY = 85

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const sub = await getFiles(fullPath)
      files.push(...sub)
    } else {
      files.push(fullPath)
    }
  }
  return files
}

async function convert() {
  const files = await getFiles(IMAGES_DIR)
  const targets = files.filter(f => {
    const ext = extname(f).toLowerCase()
    // skip og images (social media needs PNG/JPG), skip shopify logo (tiny)
    const name = basename(f)
    if (name.startsWith('og-')) return false
    return ext === '.png' || ext === '.jpg' || ext === '.jpeg'
  })

  console.log(`[v0] Converting ${targets.length} images to WebP...`)

  let converted = 0
  let failed = 0

  for (const file of targets) {
    const ext = extname(file)
    const webpPath = file.replace(ext, '.webp')
    try {
      await sharp(file)
        .webp({ quality: QUALITY, effort: 4 })
        .toFile(webpPath)
      // remove original after successful conversion
      await unlink(file)
      const sizeBefore = (await import('fs')).statSync(webpPath)
      console.log(`[v0] ✓ ${basename(file)} → ${basename(webpPath)} (${Math.round(sizeBefore.size / 1024)}KB)`)
      converted++
    } catch (err) {
      console.log(`[v0] ✗ Failed: ${basename(file)} — ${err.message}`)
      failed++
    }
  }

  console.log(`\n[v0] Done. Converted: ${converted}, Failed: ${failed}`)
}

convert()
