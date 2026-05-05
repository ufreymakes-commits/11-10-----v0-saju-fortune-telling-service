export const OG_IMAGE = {
  url: 'https://cdn.shopify.com/s/files/1/0662/7350/9464/files/Thenextgenpng.png?v=1777455763',
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
