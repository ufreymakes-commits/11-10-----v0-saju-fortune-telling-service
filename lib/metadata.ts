export const OG_IMAGE = {
  url: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Thenextgenpng-haDUszHNXdaOgdcbh4xKKBXTU1PJl5.png',
  width: 1200,
  height: 630,
  alt: 'K-Saju - The Next Gen Fortune Telling',
}

export const sharedOpenGraph = {
  images: [OG_IMAGE],
  siteName: 'Sajume',
  locale: 'en_US',
  type: 'website' as const,
}

export const sharedTwitter = {
  card: 'summary_large_image' as const,
  images: [OG_IMAGE.url],
}
