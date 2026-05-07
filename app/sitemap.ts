import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://my.sajume.com'
  const lastModified = new Date('2026-05-07T11:41:40+00:00')

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/start`,
      lastModified,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/company`,
      lastModified,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/my-report`,
      lastModified,
      priority: 0.8,
    },
  ]
}
