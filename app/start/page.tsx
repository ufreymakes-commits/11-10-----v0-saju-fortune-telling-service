import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { StarsBackground } from '@/components/stars-background'
import { BirthForm } from '@/components/birth-form'
import { NewYear2027ProductCard } from '@/components/new-year-2027-product-card'
import { StartReviewsSection } from '@/components/start-reviews-section'
import { AskGumihoProductCard } from '@/components/ask-gumiho-product-card'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'
import { Marquee } from '@/components/marquee'
import { DataBasedTrust } from '@/components/data-based-trust'
import { CharacterSlider } from '@/components/character-slider'

export const metadata = {
  title: 'Enter Your Birth Info - Sajume',
  description: 'Enter your birth information to discover 99 facts about your destiny through Korean Saju astrology.',
  openGraph: { ...sharedOpenGraph, title: 'Enter Your Birth Info - Sajume', url: 'https://my.sajume.com/start' },
  twitter: { ...sharedTwitter, title: 'Enter Your Birth Info - Sajume' },
}



export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#0a0a14] relative overflow-x-hidden pt-10">
      <Marquee />
      <StarsBackground />

      <div id="top" className="relative z-10 flex flex-col items-center px-4 py-8">
        {/* Character slider */}
        <div className="w-full max-w-md mb-6">
          <CharacterSlider fixed />
        </div>

        {/* Title */}
        <h1 className="flex flex-col items-center gap-1.5 text-center mb-4 whitespace-nowrap">
          <span className="text-silver-sweep block font-bold leading-tight text-[clamp(26px,8.6vw,30px)]">Enter your birth info</span>
          <span className="block font-normal leading-snug text-[#C8CCD4] text-[clamp(11px,3.7vw,16px)]">and get 99 valuable facts from your birth chart</span>
        </h1>

        {/* Checks */}
        <ul className="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[15px] text-[#C8CCD4] cursor-default select-none">
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            <Check aria-hidden="true" className="size-4 text-[#E8C46B]" strokeWidth={3} />
            No sign-up
          </li>
          <li className="flex items-center gap-1.5 whitespace-nowrap">
            <Check aria-hidden="true" className="size-4 text-[#E8C46B]" strokeWidth={3} />
            First 3 facts free
          </li>
        </ul>

        {/* Form Card */}
        <div className="w-full max-w-md bg-white border border-primary/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <BirthForm />
        </div>

        {/* Info */}
        <p className="mt-6 text-[10px] text-white/60 text-center max-w-sm leading-relaxed">
          Your information is used to calculate your birth chart and is not shared with third parties. By continuing, you agree to our <Link href="/privacy" className="underline underline-offset-2 hover:text-white">Privacy Policy</Link> and to receive your reading by email, plus occasional Saju tips and offers. Unsubscribe anytime.
        </p>
      </div>

      <StartReviewsSection />

      {/* Our Products Section */}
      <section className="relative z-10 py-16 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Our Products</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-8 leading-relaxed">
            From ancient Korea eerie fortune telling<br />to lucky charm bracelets
          </p>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {/* 99 Facts */}
            <Link href="#top" className="group">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-3 hover:border-purple-400/50 transition-all h-full flex flex-col">
                <h4 className="text-sm font-semibold text-white mb-2">99 Facts</h4>
                <div className="relative w-full mb-3 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0 aspect-square">
                  <Image src="/media/thumb-99facts.webp" alt="99 Facts of your birth chart" width={800} height={800} sizes="(min-width: 768px) 300px, 45vw" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-white/70 mb-3 flex-grow leading-relaxed">Deep dive into your complete birth chart with 99 personalized insights.</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[11px] text-purple-300">99 facts</span>
                  <span className="text-base font-bold text-white">$19.99</span>
                </div>
              </div>
            </Link>

            {/* Relationship Compatibility */}
            <div className="group">
              <div className="bg-gradient-to-br from-pink-900/40 to-rose-900/40 border border-pink-500/30 rounded-xl p-3 h-full flex flex-col">
                <h4 className="text-sm font-semibold text-white mb-2">Relationship Compatibility</h4>
                <div className="relative w-full mb-3 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0 aspect-square">
                  <Image src="/media/thumb-compatibility.webp" alt="Relationship Compatibility" width={800} height={800} sizes="(min-width: 768px) 300px, 45vw" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-white/70 mb-3 flex-grow leading-relaxed">The Art of Saju Compatibility: Are You Meant to Be?</p>
                <div className="flex items-center justify-between mb-2 mt-auto">
                  <span className="text-[11px] text-pink-300">Discover your match</span>
                  <span className="text-base font-bold text-white">$19.99</span>
                </div>
                <Link
                  href="/compatibility"
                  className="w-full text-center py-1.5 px-2 rounded-lg text-xs font-medium bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/30 hover:border-pink-400/50 transition-all block"
                >
                  Now Available
                </Link>
              </div>
            </div>

            {/* Bracelet */}
            <div className="group">
              <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-xl p-3 h-full flex flex-col">
                <h4 className="text-sm font-semibold text-white mb-2">Your Personal Lucky Element Bracelet</h4>
                <div className="relative w-full mb-3 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0" style={{ aspectRatio: '796/531' }}>
                  <Image src="/images/saju-bracelet-new.png" alt="Signature Saju Elemental Bracelet" width={796} height={531} sizes="(min-width: 768px) 300px, 45vw" className="w-full h-full object-cover object-center" />
                </div>
                <p className="text-xs text-white/70 mb-3 flex-grow leading-relaxed">A signature bracelet designed to fill the missing energies in your personal Saju chart and attract good fortune.</p>
                <div className="flex items-center justify-between mb-2 mt-auto gap-2">
                  <div className="flex items-center gap-1">
                    <Image src="/images/shopify-logo.png" alt="Shopify" width={14} height={14} className="object-contain" />
                    <span className="text-[10px] text-amber-300/70 leading-tight">Sajume Shopify</span>
                  </div>
                  <span className="text-base font-bold text-white">$38</span>
                </div>
                <a href="https://sajume.com/products/personal-luck-bracelet" target="_blank" rel="noopener noreferrer" className="w-full text-center py-1.5 px-2 rounded-lg text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 hover:border-amber-400/50 transition-all block">Shop Now</a>
              </div>
            </div>

            {/* Ask the Gumiho 1:1 */}
            <AskGumihoProductCard compact />

            {/* 2027 New Year Monthly */}
            <NewYear2027ProductCard compact />
          </div>
        </div>
      </section>

      {/* Ancient Eastern Wisdom Section */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-2">
            Ancient Eastern wisdom,
          </h2>
          <p className="text-sm md:text-base text-white/60 mb-4">
            meets data to read the flow of destiny.
          </p>
          <p className="text-sm text-purple-400 mb-8">
            #CareerPath #LovePattern #2026AnnualLuck
          </p>
          <div className="max-w-sm mx-auto rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl">
            <Image
              src="/images/saju-preview.png"
              alt="Saju Report Preview"
              width={480}
              height={868}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Why Sajume Section */}
      <section className="relative z-10 py-12 px-4 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Why Sajume?</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-12">
            No more stress from wrong AI answers.<br />Let sajume&apos;s certified expertise ease your mind.
          </p>

          {/* 6,425+ Reports */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">6,425+</h4>
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

          <DataBasedTrust />

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
                  Get Your First 3 Facts
                  <span className="text-white/70 font-normal text-sm">(1 min)</span>
              </Link>
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
