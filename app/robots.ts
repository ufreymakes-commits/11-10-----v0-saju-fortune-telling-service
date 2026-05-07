import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/checkout/', '/report/'],
    },
    sitemap: 'https://my.sajume.com/sitemap.xml',
  }
}
