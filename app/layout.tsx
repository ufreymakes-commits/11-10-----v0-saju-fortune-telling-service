import type { Metadata, Viewport } from 'next'
import { Poppins, Geist_Mono, Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NavSidebar } from '@/components/nav-sidebar'
import './globals.css'

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
})

const montserrat = Montserrat({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat'
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
    images: [
      {
        url: 'https://my.sajume.com/images/og-nextgen.png',
        width: 1200,
        height: 630,
        alt: 'K-Saju - The Next Gen Fortune Telling',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sajume - 99 Facts Your Birth Chart Speaks to You',
    description: 'Discover the secrets of your destiny through Korean Saju astrology.',
    images: ['https://my.sajume.com/images/og-nextgen.png'],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta property="og:image" content="https://my.sajume.com/images/og-nextgen.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content="https://my.sajume.com/images/og-nextgen.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:url" content="https://my.sajume.com" />
        <script async src="https://tally.so/widgets/embed.js"></script>
      </head>
      <body className={`${poppins.variable} ${montserrat.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <NavSidebar />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
