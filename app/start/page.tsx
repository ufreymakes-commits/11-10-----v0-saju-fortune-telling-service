import Image from 'next/image'
import Link from 'next/link'
import { StarsBackground } from '@/components/stars-background'
import { BirthForm } from '@/components/birth-form'
import { NoticeMeButton } from '@/components/notice-me-button'
import { StartReviewsSection } from '@/components/start-reviews-section'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

export const metadata = {
  title: 'Enter Your Birth Info - Sajume',
  description: 'Enter your birth information to discover 99 facts about your destiny through Korean Saju astrology.',
  openGraph: { ...sharedOpenGraph, title: 'Enter Your Birth Info - Sajume', url: 'https://my.sajume.com/start' },
  twitter: { ...sharedTwitter, title: 'Enter Your Birth Info - Sajume' },
}



export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#0a0a14] relative overflow-x-hidden pt-10">
      <StarsBackground />

      <div id="top" className="relative z-10 flex flex-col items-center px-4 py-8">
        {/* Characters in V-formation */}
        <div className="relative w-64 md:w-80 h-44 md:h-56 mx-auto mb-0">
          {/* Left outer - Eulmok (green) */}
          <div className="absolute w-14 h-14 z-0 opacity-30" style={{ left: '0%', top: '20%' }}>
            <Image src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/eulmok.png?v=1777872574" alt="Eulmok" width={56} height={56} className="object-contain w-full h-full" priority />
          </div>
          {/* Left inner - Gyesu (purple) */}
          <div className="absolute w-16 h-16 z-0 opacity-40" style={{ left: '15%', top: '30%' }}>
            <Image src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gyesu.png?v=1777872574" alt="Gyesu" width={64} height={64} className="object-contain w-full h-full" priority />
          </div>
          {/* Main mascot - center, floating */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 z-10 animate-float">
            <Image
              src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/9.png?v=1777987978"
              alt="Sajume mascot"
              width={144}
              height={144}
              className="object-contain drop-shadow-2xl w-full h-full"
              priority
            />
          </div>
          {/* Right inner - Gyeonggeum (gray) */}
          <div className="absolute w-16 h-16 z-0 opacity-40" style={{ right: '15%', top: '30%' }}>
            <Image src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/gyeonggeum.png?v=1777872574" alt="Gyeonggeum" width={64} height={64} className="object-contain w-full h-full" priority />
          </div>
          {/* Right outer - Byeonghwa (orange) */}
          <div className="absolute w-14 h-14 z-0 opacity-30" style={{ right: '0%', top: '20%' }}>
            <Image src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/byeonghwa.png?v=1777872574" alt="Byeonghwa" width={56} height={56} className="object-contain w-full h-full" priority />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-gradient text-center -mt-2 mb-3">
          Enter Your Birth Info
        </h1>
        
        {/* Subtitle */}
        <p className="text-white text-center mb-6 text-sm md:text-base font-medium">
          No Sign-up, 9 Free Facts
        </p>

        {/* Form Card */}
        <div className="w-full max-w-md bg-white border border-primary/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <BirthForm />
        </div>

        {/* Info */}
        <p className="mt-6 text-[10px] text-white/60 text-center max-w-sm leading-relaxed">
          Your information is used solely to calculate your birth chart and will not be shared with third parties. By continuing, you agree to our privacy policy and receiving our Saju tips newsletter.
        </p>
      </div>

      <StartReviewsSection />

      {/* Why Sajume Section */}
      <section className="relative z-10 py-12 px-4 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Why Sajume?</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-12">
            No more stress from wrong AI answers.<br />Let sajume&apos;s certified expertise ease your mind.
          </p>

          {/* 2,765+ Reports */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">2,765+</h4>
              <p className="text-2xl font-semibold text-white mb-4">Reports Delivered</p>
              <p className="text-sm md:text-base text-white/60 leading-relaxed">
                The world&apos;s only saju service that analyzes your chart based on exact global local birth time &amp; delivers a full report in English.
              </p>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-xl overflow-hidden border border-purple-500/30 shadow-2xl">
                <img
                  src="https://cdn.shopify.com/s/files/1/0662/7350/9464/files/20260421-1_1.gif?v=1777987705"
                  alt="Sajume Report Preview"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          </div>

          {/* KPEI Certified */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-1">
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src="/images/kpei-cert.png"
                  alt="KPEI Certification"
                  width={600}
                  height={700}
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
            <div className="order-2">
              <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">KPEI Certified</h4>
              <p className="text-2xl font-semibold text-white mb-4">Myungri Psychology Counselors</p>
              <p className="text-sm md:text-base text-white/60 leading-relaxed">
                For a report grounded in structured logic and thoughtful interpretation, our team holds <span className="font-semibold">Level 1 and Level 2</span> certifications.
              </p>
            </div>
          </div>

          {/* No.1 Global Saju */}
          <div className="mb-10 mt-14">
            <h4 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">No.1 Global Saju</h4>
            <p className="text-center text-sm md:text-base text-white/50 mb-8">Feel the difference</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Lifetime Access</h4>
                <p className="text-xs text-white/60">Your report stays accessible forever</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Data-Driven</h4>
                <p className="text-xs text-white/60">1,000+ charts analyzed</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Consistent</h4>
                <p className="text-xs text-white/60">Same data = Same reading</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Story-Driven</h4>
                <p className="text-xs text-white/60">Easy-to-understand insights</p>
              </div>
            </div>

            {/* CTA after No.1 cards */}
            <div className="mt-10 flex justify-center">
              <Link
                href="#top"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold text-base shadow-lg shadow-purple-900/40 hover:from-purple-500 hover:to-fuchsia-500 transition-all hover:scale-105"
              >
                Get 9 Facts For Free
                <span className="text-white/70 font-normal text-sm">(1 min)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Products Section */}
      <section className="relative z-10 py-16 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Our Products</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-8 leading-relaxed">
            From ancient Korea eerie fortune telling<br />to lucky charm bracelets
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 99 Facts */}
            <Link href="#top" className="group md:col-span-1">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all hover:scale-[1.02] h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">99 Facts</h4>
                <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0" style={{ aspectRatio: '800/533' }}>
                  <Image src="/images/99facts.jpg" alt="99 Facts" width={800} height={533} className="w-full h-full object-cover object-center" />
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">Deep dive into your complete birth chart with 99 personalized insights.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300">9 free + 90 premium</span>
                  <span className="text-lg font-bold text-white">$9.99</span>
                </div>
              </div>
            </Link>

            {/* Bracelet */}
            <div className="group md:col-span-1">
              <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-xl p-6 h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">Signature Saju Elemental Bracelet</h4>
                <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0" style={{ aspectRatio: '800/533' }}>
                  <Image src="/images/luck-bracelet.png" alt="Signature Saju Elemental Bracelet" width={800} height={533} className="w-full h-full object-cover object-center" />
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">A signature bracelet designed to fill the missing energies in your personal Saju chart and attract good fortune.</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Image src="/images/shopify-logo.png" alt="Shopify" width={16} height={16} className="object-contain" />
                    <span className="text-[10px] text-amber-300/70">Shop at Sajume Shopify</span>
                  </div>
                  <span className="text-lg font-bold text-white">$38</span>
                </div>
                <a href="https://sajume.com/products/personal-luck-bracelet" target="_blank" rel="noopener noreferrer" className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 hover:border-amber-400/50 transition-all block">Shop Now</a>
              </div>
            </div>

            {/* Relationship Compatibility */}
            <div className="group md:col-span-1">
              <div className="bg-gradient-to-br from-pink-900/40 to-rose-900/40 border border-pink-500/30 rounded-xl p-6 h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">Relationship Compatibility</h4>
                <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </div>
                    <span className="text-xs text-white/40">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">The Art of Saju Compatibility: Are You Meant to Be?</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-pink-300">Discover your match</span>
                  <span className="text-lg font-bold text-white/50">$15</span>
                </div>
                <NoticeMeButton product="compatibility" className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/30 hover:border-pink-400/50 transition-all" />
              </div>
            </div>

            {/* 12 months Saju Reading */}
            <div className="group md:col-span-1">
              <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-6 h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">12 months Saju Reading</h4>
                <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-xs text-white/40">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">Monthly personalized Saju readings delivered to you every month throughout 2026.</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-blue-300">12 monthly readings</span>
                  <span className="text-lg font-bold text-white/50">$79</span>
                </div>
                <NoticeMeButton product="subscription" className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 hover:border-blue-400/50 transition-all" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-[11px] text-white/60">All rights reserved by Sajume.</p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              data-tally-open="681NVP"
              data-tally-layout="modal"
              data-tally-emoji-text="👋"
              data-tally-emoji-animation="wave"
              className="px-4 py-2 bg-white/10 border border-white/30 text-white text-xs font-semibold rounded hover:bg-white/20 hover:border-white/50 transition-all"
            >
              May I help you with the issue?
            </button>
            <p className="text-[11px] text-white/60">Business: hello@sajume.com</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
