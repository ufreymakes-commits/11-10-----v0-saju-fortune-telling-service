import Link from 'next/link'
import Image from 'next/image'
import { StarsBackground } from '@/components/stars-background'
import { Marquee } from '@/components/marquee'
import { ReviewSlider } from '@/components/review-slider'

// 페이지별 리뷰 배열 (각 배열 = 1페이지)
const REVIEW_PAGES = [
  // Page 1 - 3개 리뷰
  [
    { id: 1, src: "/images/reviews/review-01.png", alt: "Page 1, Review 1" },
    { id: 2, src: "/images/reviews/review-02.png", alt: "Page 1, Review 2" },
    { id: 3, src: "/images/reviews/review-03.png", alt: "Page 1, Review 3" },
  ],
  // Page 2 - 4개 리뷰
  [
    { id: 4, src: "/images/reviews/review-04.png", alt: "Page 2, Review 1" },
    { id: 5, src: "/images/reviews/review-05.png", alt: "Page 2, Review 2" },
    { id: 6, src: "/images/reviews/review-06.png", alt: "Page 2, Review 3" },
    { id: 7, src: "/images/reviews/review-07.png", alt: "Page 2, Review 4" },
  ],
  // Page 3 - 4개 리뷰
  [
    { id: 8, src: "/images/reviews/review-08.png", alt: "Page 3, Review 1" },
    { id: 9, src: "/images/reviews/review-09.png", alt: "Page 3, Review 2" },
    { id: 10, src: "/images/reviews/review-10.png", alt: "Page 3, Review 3" },
    { id: 11, src: "/images/reviews/review-11.png", alt: "Page 3, Review 4" },
  ],
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a14] relative overflow-x-hidden">
      {/* Marquee Banner */}
      <Marquee />
      
      <StarsBackground />
      
      {/* Header Logo */}
      <header className="relative z-10 pt-6 pb-4">
        <div className="flex justify-center">
          <div className="border border-white/30 rounded-full px-5 py-1.5 text-white/80 text-xs tracking-wider">
            Sajume
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center px-4 pt-8 pb-16">
        {/* Sparkle decorations */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2" aria-hidden="true">
          <svg width="50" height="50" viewBox="0 0 80 80" fill="none" className="text-white/60">
            <path d="M40 0L42 38L80 40L42 42L40 80L38 42L0 40L38 38L40 0Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-6 left-[calc(50%-40px)]" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-white/40">
            <path d="M10 0L10.5 9.5L20 10L10.5 10.5L10 20L9.5 10.5L0 10L9.5 9.5L10 0Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-8 left-[calc(50%+35px)]" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/50">
            <path d="M12 0L12.6 11.4L24 12L12.6 12.6L12 24L11.4 12.6L0 12L11.4 11.4L12 0Z" fill="currentColor" />
          </svg>
        </div>
        
        {/* Main content */}
        <div className="text-center max-w-md mx-auto mt-12">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-1">
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">99 Facts</span>
          </h1>
          <h2 className="text-base md:text-xl lg:text-2xl text-white/80 mb-4">
            of your birth chart
          </h2>
          
          <div className="inline-block bg-purple-600/80 text-white px-4 py-1 rounded-sm text-xs mb-8">
            {"K-astrology 'Saju' based"}
          </div>
          
          {/* Mascot */}
          <div className="relative w-44 h-44 mx-auto mb-6 animate-float">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
              alt="Sajume mascot - a cute pink nine-tailed fox holding a crystal ball"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          
          <p className="text-sm text-white/60 mb-6 max-w-sm mx-auto leading-relaxed">
            Discover the secrets hidden in your birth chart through ancient Korean Saju astrology.
          </p>
          
          <Link 
            href="/start"
            className="inline-flex items-center gap-2 bg-pink-400 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-pink-500 transition-all hover:scale-105 shadow-lg shadow-pink-500/30"
          >
            Discover Your Destiny
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          
          <p className="mt-4 text-xs text-white/40">
            9 facts free | Full report $9.99
          </p>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-center text-lg md:text-xl font-semibold text-white/90 mb-2">100% Genuine Reviews</h3>
          <div className="flex items-center justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
            <span className="text-sm text-white/60 ml-2">26+ reviews</span>
          </div>
          <p className="text-center text-xs text-white/40 mb-6">
            If these reviews are found to be manipulated or fake, we will stop selling this service.
          </p>
          <ReviewSlider pages={REVIEW_PAGES} />
        </div>
      </section>

      {/* Products Section */}
      <section className="relative z-10 py-8 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-lg font-semibold text-white/90 mb-4">Our Readings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 99 Facts Product */}
            <Link href="/start" className="group">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-5 hover:border-purple-400/50 transition-all hover:scale-[1.02]">
                <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e]">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99facts.png-GQUor5lDB3UZjqnzWfMmGM6jWNHITE.jpeg"
                    alt="99 Facts of your birth chart"
                    fill
                    className="object-cover"
                  />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">99 Facts</h4>
                <p className="text-xs text-white/60 mb-3">Deep dive into your complete birth chart with 99 personalized insights.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300">9 free + 90 premium</span>
                  <span className="text-sm font-bold text-white">$9.99</span>
                </div>
              </div>
            </Link>

            {/* Core Basics Product */}
            <div className="group cursor-not-allowed">
              <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-5 opacity-70">
                <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/40">Coming Soon</span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Core Basics Saju Reading</h4>
                <p className="text-xs text-white/60 mb-3">Essential Saju analysis covering your core personality and life path.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-300">10 core insights</span>
                  <span className="text-sm font-bold text-white/50">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/10">
        <div className="text-center">
          <div className="border border-white/30 rounded-full px-5 py-1.5 text-white/60 text-xs tracking-wider inline-block">
            Sajume
          </div>
          <p className="mt-3 text-xs text-white/30">Ancient wisdom, modern insights</p>
        </div>
      </footer>
    </main>
  )
}
