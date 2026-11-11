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
        {/* TikTok Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
                var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
                ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                ttq.load('D85I0ERC77UDFECN32MG');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${montserrat.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <NavSidebar />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
