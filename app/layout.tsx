import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Playfair_Display, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant'
})

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair'
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

export const metadata: Metadata = {
  title: 'Sajume - 99 Facts Your Birth Chart Speaks to You',
  description: 'Discover the secrets of your destiny through Korean Saju astrology. Get 99 personalized facts about your personality, career, love, and future based on your birth chart.',
  keywords: ['saju', 'korean astrology', 'birth chart', 'fortune telling', 'K-astrology', 'destiny', 'horoscope'],
  openGraph: {
    title: 'Sajume - 99 Facts Your Birth Chart Speaks to You',
    description: 'Discover the secrets of your destiny through Korean Saju astrology.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Sajume',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sajume - 99 Facts Your Birth Chart Speaks to You',
    description: 'Discover the secrets of your destiny through Korean Saju astrology.',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1025',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${cormorant.variable} ${playfair.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
