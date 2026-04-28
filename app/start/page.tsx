import Image from 'next/image'
import Link from 'next/link'
import { StarsBackground } from '@/components/stars-background'
import { BirthForm } from '@/components/birth-form'
import { TextReviewSlider } from '@/components/text-review-slider'
import { NoticeMeButton } from '@/components/notice-me-button'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

export const metadata = {
  title: 'Enter Your Birth Info - Sajume',
  description: 'Enter your birth information to discover 99 facts about your destiny through Korean Saju astrology.',
  openGraph: { ...sharedOpenGraph, title: 'Enter Your Birth Info - Sajume' },
  twitter: { ...sharedTwitter, title: 'Enter Your Birth Info - Sajume' },
}

const TEXT_REVIEWS = [
  { id: 0,  text: "I started with the free 9 facts first because I was skeptical and was surprised by how accurate the information I got back was, it was almost scary. I ended up getting the 99 facts and everything I been through and am currently going through was mentioned and it gave me a lot of clarity.", name: "Jasmine S.", country: "NY, US", flag: "🇺🇸", date: "Apr 25, 2026" },
  { id: 1,  text: "I received the free 9 Facts First, due to worry that this was going to be a bit like a scam. Once I read through the 9 facts, I was intrigued and purchased the 99 Report. I'm glad I did. There's so much in here and I felt called out, lol.", name: "Emily W", country: "NY, US", flag: "🇺🇸", date: "Apr 16, 2026" },
  { id: 2,  text: "I really enjoyed reading this Saju packet. The fact-based format made it feel engaging, personal, and easy to connect with. I began highlighting the points that felt accurate, but quickly realized I had highlighted almost every page.", name: "Hannah", country: "LA, US", flag: "🇺🇸", date: "Apr 10, 2026" },
  { id: 3,  text: "This was great insight. I definitely felt some feeling were validated.", name: "Jessica", country: "Chicago, US", flag: "🇺🇸", date: "Apr 1, 2026" },
  { id: 4,  text: "When I started reading the 99 Facts, most of them were unbelievably true to me. It's good to know what my past has been based on the charts and what the current and future look like.", name: "Tao Mon Lae", country: "Myanmar", flag: "🇲🇲", date: "Apr 1, 2026" },
  { id: 5,  text: "The report was absolutely spot on. I will definitely book a forecasting reading asap cause the 99 report was very accurate so now I am curious about what it holds for my future.", name: "Simona", country: "Italy", flag: "🇮🇹", date: "Mar 31, 2026" },
  { id: 6,  text: "Amazing report!! Good for giving a few things and getting some insights into yourself and into the future. Would highly recommend for anyone interested in SJPJ", name: "Charlotte", country: "UK", flag: "🇬🇧", date: "Mar 31, 2026" },
  { id: 7,  text: "The report came quickly and was surprisingly accurate. It covered internal emotional struggles that have been recurring throughout my life.", name: "JazzaRay", country: "NY, US", flag: "🇺🇸", date: "Mar 18, 2026" },
  { id: 8,  text: "I love it!!! This is eeriely true, and I was shocked reading the report", name: "Nhi", country: "Vietnam", flag: "🇻🇳", date: "Mar 6, 2026" },
  { id: 9,  text: "The 99 Facts report was concise and exactly what I needed. I would highly recommend it.", name: "Simon", country: "LA, US", flag: "🇺🇸", date: "Mar 4, 2026" },
  { id: 10, text: "The 99 facts premium version is the real deal - I got it at the discounted price, but I wouldn't mind purchasing it again at its original price.", name: "Natalie", country: "Singapore", flag: "🇸🇬", date: "Mar 4, 2026" },
  { id: 11, text: "I loved it! It's very precise.", name: "Cecilia Mamani", country: "Chile", flag: "🇨🇱", date: "Mar 4, 2026" },
  { id: 12, text: "I tried the sample 9 facts before purchasing the full report and that alone blew my mind. It's made me curious to try the full in depth report because of how scarily accurate it was.", name: "Alyssa", country: "LA, US", flag: "🇺🇸", date: "Mar 27, 2026" },
  { id: 13, text: "Like others have said, it is scarily accurate. It also gave me some clarity and confirmation that I am where I'm supposed to be right now.", name: "Hannah", country: "LA, US", flag: "🇺🇸", date: "Mar 21, 2026" },
]

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#0a0a14] relative overflow-x-hidden pt-10">
      <StarsBackground />
      
      <div className="relative z-10 flex flex-col items-center px-4 py-8">
        {/* Mascot */}
        <div className="relative w-32 h-32 mb-4 animate-float">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
            alt="Sajume mascot"
            fill
            className="object-contain"
          />
        </div>
        
        {/* Title */}
        <h1 className="text-xl font-semibold text-gradient text-center mb-1">
          Enter Your Birth Info
        </h1>
        <p className="text-sm text-foreground/70 text-center mb-6 max-w-md">
          Share your birth details to unlock the secrets hidden in your Saju chart
        </p>
        
        {/* Form Card */}
        <div className="w-full max-w-md bg-white border border-primary/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <BirthForm />
        </div>
        
        {/* Info */}
        <p className="mt-6 text-[10px] text-muted-foreground/70 text-center max-w-sm leading-relaxed">
          Your information is used solely to calculate your birth chart and will not be shared with third parties. By continuing, you agree to our privacy policy and receiving our Saju tips newsletter. Secure &amp; Easy unsubscribe anytime.
        </p>
      </div>

      {/* Reviews Section */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-2xl md:text-3xl font-semibold text-white/90 mb-2">100% Genuine Reviews</h3>
          <div className="flex items-center justify-center gap-1 mb-1">
            <svg className="w-4 h-4 text-green-400 fill-current mr-1" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
          </div>
          <p className="text-center text-base font-bold text-white/80 mb-3">+2,765 reports sent</p>
          <p className="text-center text-sm text-white/50 mb-3 font-semibold">
            If these reviews are found to be manipulated or fake, we will stop selling this service.
          </p>
          <p className="text-center text-xs md:text-sm font-bold text-yellow-300 mb-6">
            #Shocked #Eerie #Encouraged
          </p>
          <TextReviewSlider reviews={TEXT_REVIEWS} />
        </div>
      </section>

      {/* Why Sajume Section */}
      <section className="relative z-10 py-12 px-4 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Why Sajume?</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-12">
            No more stress from wrong AI answers.<br/>Let sajume&apos;s certified expertise ease your mind.
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
                <div style={{ padding: '109.67% 0 0 0', position: 'relative' }}>
                  <iframe
                    src="https://player.vimeo.com/video/1185152795?badge=0&autopause=0&player_id=0&app_id=58479&loop=1&background=1&muted=1"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    title="Sajume Report Preview"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPEI Certified */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-1">
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%20181-cfTMJ2cXy3zGAdmW4sf31fboZo7apa.png"
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
          </div>
        </div>
      </section>

      {/* Our Products Section */}
      <section className="relative z-10 py-16 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Our Products</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-8 leading-relaxed">
            From ancient Korea eerie fortune telling<br/>to lucky charm bracelets
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 99 Facts */}
            <Link href="/start" className="group md:col-span-1">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all hover:scale-[1.02] h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">99 Facts</h4>
                <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0" style={{ aspectRatio: '800/533' }}>
                  <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99facts.png-GQUor5lDB3UZjqnzWfMmGM6jWNHITE.jpeg" alt="99 Facts" width={800} height={533} className="w-full h-full object-cover object-center" />
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
                    <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8C%E1%85%A6%E1%84%86%E1%85%A9%E1%86%A8%E1%84%8B%E1%85%B3%E1%86%AF%20%E1%84%8B%E1%85%B5%E1%86%B8%E1%84%85%E1%85%A7%E1%86%A8%E1%84%92%E1%85%A2%E1%84%8C%E1%85%AE%E1%84%89%E1%85%A6%E1%84%8B%E1%85%AD.-rHCZrL3MSmA5XIQcuz0W5A0tHTyxAR.png" alt="Shopify" width={16} height={16} className="object-contain" />
                    <span className="text-[10px] text-amber-300/70">Shop at Sajume Shopify</span>
                  </div>
                  <span className="text-lg font-bold text-white">$38</span>
                </div>
                <NoticeMeButton product="bracelet" className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 hover:border-amber-400/50 transition-all" />
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
          <p className="text-[10px] text-white/30">All rights reserved by Sajume.</p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              data-tally-open="681NVP"
              data-tally-layout="modal"
              data-tally-emoji-text="👋"
              data-tally-emoji-animation="wave"
              className="px-4 py-2 bg-primary/20 border border-primary/40 text-foreground text-xs font-semibold rounded hover:bg-primary/30 hover:border-primary/60 transition-all"
            >
              May I help you with the issue?
            </button>
            <p className="text-[10px] text-white/30">Business: hello@sajume.com</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
