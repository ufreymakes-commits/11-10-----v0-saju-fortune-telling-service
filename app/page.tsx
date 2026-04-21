import Link from 'next/link'
import Image from 'next/image'
import { StarsBackground } from '@/components/stars-background'
import { Marquee } from '@/components/marquee'
import { ReviewSlider } from '@/components/review-slider'

// 페이지별 리뷰 배열 (각 배열 = 1페이지, PC에서 3열 그리드)
const REVIEW_PAGES = [
  // Page 1 - 6개 리뷰
  [
    { id: 1, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.19.09-Bp9SmuaiNYajTuXobSEGXJhsATmyY9.png", alt: "Review - I received the free 9 Facts First" },
    { id: 2, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.20.14-w4XR1fNZh51jSOB0267UDC8fdAs2h3.png", alt: "Review - I really enjoyed reading this Saju packet" },
    { id: 3, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.20.25-JjxUJS5nYLVIBNnQznFGJm6dcwwl4p.png", alt: "Review - This was great insight" },
    { id: 4, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.20.35-AX0uK54stwTlXs6aT2c7xEueV82gDb.png", alt: "Review - When I started reading the 99 Facts" },
    { id: 5, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.20.44-Ez4OEJdwT3nDZQjJ6GiNWxATkkC7cK.png", alt: "Review - Amazing report" },
    { id: 6, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.20.56-ZFGgGGhXd8sxuCEuw130bhMU07w4B6.png", alt: "Review - The report felt really accurate" },
  ],
  // Page 2 - 6개 리뷰
  [
    { id: 7, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.21.05-eiKTTKuAi6R9bqA121ir7k436ar9YE.png", alt: "Review - The report was absolutely spot on" },
    { id: 8, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.21.14-3g4bTyZzt9wBvSYBGhTrbRO9ezzMQc.png", alt: "Review - It was scary accurate" },
    { id: 9, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.21.22-uz2GGWMd97ZBSpq2hJRplOBSh7DD1v.png", alt: "Review - All past things were predicted on point" },
    { id: 10, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.21.29-lg7pMCb0yB14OXYtDTuwhLW3iUrjGp.png", alt: "Review - It really resonates with me" },
    { id: 11, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.21.40-8Ps6Wkx1V4pf8acHoQUSPTV9WqyteF.png", alt: "Review - I think it really resonates with me" },
    { id: 12, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.21.56-dvaLIE1vlN3hNlgNIrIOPjtxVzP5m2.png", alt: "Review - I tried the sample 9 facts" },
  ],
  // Page 3 - 2개 리뷰
  [
    { id: 13, src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA%202026-04-19%20%E1%84%8B%E1%85%A9%E1%84%92%E1%85%AE%204.22.08-W5qujJPu9grX781jp1Rje0X93ZARwA.png", alt: "Review - Like others have said, it is scarily accurate" },
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
          <h3 className="text-center text-lg font-semibold text-white/90 mb-4">Our Products</h3>
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

            {/* Personal Luck Bracelet */}
            <div className="group cursor-not-allowed">
              <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-xl p-5 opacity-70">
                <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 0v18M3 12h18" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/40">Coming Soon</span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Personal Luck Bracelet</h4>
                <p className="text-xs text-white/60 mb-3">A handcrafted bracelet designed to fill the missing energies in your personal Saju chart and attract good fortune.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-300">Personalized to your Saju</span>
                  <span className="text-sm font-bold text-white/50">$49.99</span>
                </div>
              </div>
            </div>

            {/* 2026 Monthly Saju Reading */}
            <div className="group cursor-not-allowed">
              <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-5 opacity-70">
                <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/40">Coming Soon</span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">2026 Monthly Saju Reading (12 times)</h4>
                <p className="text-xs text-white/60 mb-3">Monthly personalized Saju readings delivered to you every month throughout 2026.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-300">12 monthly readings</span>
                  <span className="text-sm font-bold text-white/50">$79</span>
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
