import Link from 'next/link'
import Image from 'next/image'
import { StarsBackground } from '@/components/stars-background'
import { Marquee } from '@/components/marquee'
import { TextReviewSlider } from '@/components/text-review-slider'

// 텍스트 기반 리뷰 데이터 (preview-content와 동일)
const TEXT_REVIEWS = [
  { id: 1, text: "I received the free 9 Facts First, due to worry that this was going to be a bit like a scam. Once I read through the 9 facts, I was intrigued and purchased the 99 Report. I'm glad I did. There's so much in here and I felt called out, lol. I really was shocked at how accurately it read me.", name: "Emily W", country: "NY", flag: "🇺🇸", date: "Apr 16, 2026" },
  { id: 2, text: "I really enjoyed reading this Saju packet. The fact-based format made it feel engaging, personal, and easy to connect with. I began highlighting the points that felt accurate, but quickly realized I had highlighted almost every page.", name: "Hannah", country: "LA", flag: "🇺🇸", date: "Apr 10, 2026" },
  { id: 3, text: "This was great insight. I definitely felt some feeling were validated.", name: "Jessica", country: "Chicago", flag: "🇺🇸", date: "Apr 1, 2026" },
  { id: 4, text: "When I started reading the 99 Facts, most of them were unbelievably true to me. It's good to know what my past has been based on the charts and what the current and future look like.", name: "Tao Mon Lae", country: "", flag: "🇲🇲", date: "Apr 1, 2026" },
  { id: 5, text: "Amazing report!! Good for giving a few things and getting some insights into yourself and into the future. Would highly recommend for anyone interested in SJPJ", name: "Charlotte", country: "", flag: "🇬🇧", date: "Mar 31, 2026" },
  { id: 6, text: "The report felt really accurate and had lots of interesting insights. I would highly recommend this to anyone curious about it.", name: "Charlotte", country: "", flag: "🇬🇧", date: "Mar 31, 2026" },
  { id: 7, text: "The report was absolutely spot on. I will definitely book a forecasting reading asap cause the 99 report was very accurate so now I am curious about what it holds for my future.", name: "Simona", country: "", flag: "🇮🇹", date: "Mar 31, 2026" },
  { id: 8, text: "It was scary accurate on so many things. But now it makes me really think about my future much more now because it was truly hit on a few things I have been thinking about for months.", name: "Meng", country: "Chicago", flag: "🇺🇸", date: "Mar 31, 2026" },
  { id: 9, text: "All past things were predicted on point like exact year and what happened. Future prediction are reasonable too except my career. But still, thank you so much", name: "Pranjali Patil", country: "", flag: "🇮🇳", date: "Mar 31, 2026" },
  { id: 10, text: "it really resonates with me and it helps to give me a sense of direction. it also acts as a reassurance for me when i start overthinking and feeling overwhelmed", name: "Sim Yun Rou", country: "", flag: "🇸🇬", date: "Mar 30, 2026" },
  { id: 11, text: "I tried the sample 9 facts before purchasing the full report and that alone blew my mind. It's made me curious to try the full in depth report because of how scarily accurate it was.", name: "Alyssa", country: "LA", flag: "🇺🇸", date: "Mar 27, 2026" },
  { id: 12, text: "Like others have said, it is scarily accurate. It also gave me some clarity and confirmation that I am where I'm supposed to be right now. There's also some great advice that I'll definitely follow.", name: "Hannah", country: "LA", flag: "🇺🇸", date: "Mar 21, 2026" },
  { id: 13, text: "Great report!", name: "Nom", country: "", flag: "🇻🇳", date: "Mar 20, 2026" },
  { id: 14, text: "The reports brought up a lot that I pushed aside. Made me more introspective of how I want to move forward.", name: "Esther", country: "NY", flag: "🇺🇸", date: "Mar 20, 2026" },
  { id: 15, text: "Wow almost every single point of the 99 facts was spot on. Will be purchasing more reports in the future.", name: "Nicko", country: "", flag: "🇮🇷", date: "Mar 20, 2026" },
  { id: 16, text: "It's crazy how accurate the facts are. Just with the first 9 facts, I got goosebumps with the accuracy!!", name: "Yin May Thinn", country: "", flag: "🇲🇲", date: "Mar 18, 2026" },
  { id: 17, text: "I did this on a whim and received the full report within 30 min. It was eerily accurate, just as advertised. I've been to multiple different fortune tellers and not one of them has given me actual timelines.", name: "Yvonne", country: "LA", flag: "🇺🇸", date: "Mar 18, 2026" },
  { id: 18, text: "The report came quickly and was surprisingly accurate. It covered internal emotional struggles that have been recurring throughout my life.", name: "JazzaRay", country: "NY", flag: "🇺🇸", date: "Mar 18, 2026" },
  { id: 19, text: "I love it!!! This is eeriely true, and I was shocked reading the report", name: "Nhi", country: "", flag: "🇻🇳", date: "Mar 6, 2026" },
  { id: 20, text: "This is scarily true. I was shocked because the timelines actually matched what happened in my life before. This is amazing, best impulsive buying I had in years.", name: "Nhi Tran", country: "", flag: "🇻🇳", date: "Mar 6, 2026" },
  { id: 21, text: "The 99 Facts report was concise and exactly what I needed. I would highly recommend it.", name: "Simon", country: "LA", flag: "🇺🇸", date: "Mar 4, 2026" },
  { id: 22, text: "The 99 facts premium version is the real deal - I got it at the discounted price, but I wouldn't mind purchasing it again at its original price.", name: "Natalie", country: "", flag: "🇸🇬", date: "Mar 4, 2026" },
  { id: 23, text: "I loved it! It's very precise.", name: "Cecilia Mamani", country: "", flag: "🇨🇱", date: "Mar 4, 2026" },
  { id: 24, text: "wow so accurate", name: "anannya", country: "", flag: "🇮🇳", date: "Feb 16, 2026" },
  { id: 25, text: "so accurate!", name: "anannya", country: "", flag: "🇮🇳", date: "Feb 16, 2026" },
  { id: 26, text: "This was extremely helpful and insightful. If you're going to purchase a detailed reading, I highly recommend choosing the Premium option. It really helped me understand myself better.", name: "Anonymous", country: "", flag: "🇺🇸", date: "Jan 31, 2026" },
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
          
          <div className="inline-block bg-purple-600/80 text-white px-4 py-1 rounded-sm text-xs md:text-sm mb-8">
            {"K-Saju: The Next Gen Fortune Telling"}
          </div>
          
          {/* Mascot with V-formation background characters */}
          <div className="relative w-72 h-52 md:w-80 md:h-60 mx-auto mb-6">
            {/* Background characters - Left side (far to close) */}
            <div className="absolute left-0 top-4 md:top-6 w-12 h-12 md:w-14 md:h-14 opacity-20">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/singeum-KgmDCqcBvR8APXhwb5m5GXfMfY0Hw2.png" alt="Singeum" fill className="object-contain" />
            </div>
            <div className="absolute left-8 md:left-10 top-10 md:top-12 w-14 h-14 md:w-16 md:h-16 opacity-30">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gyesu-9Sit6yryy2XFeyDddE5QQu6AwopXY1.png" alt="Gyesu" fill className="object-contain" />
            </div>
            <div className="absolute left-16 md:left-20 top-16 md:top-20 w-16 h-16 md:w-20 md:h-20 opacity-40">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gabmok-bkPkfmlicV7xsuBn9ZSdEYzkjRYxon.png" alt="Gabmok" fill className="object-contain" />
            </div>
            
            {/* Background characters - Right side (far to close) */}
            <div className="absolute right-0 top-4 md:top-6 w-12 h-12 md:w-14 md:h-14 opacity-20">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/muto-EykGx1vMIHPJWNwdVHLOIvigykkhkg.png" alt="Muto" fill className="object-contain" />
            </div>
            <div className="absolute right-8 md:right-10 top-10 md:top-12 w-14 h-14 md:w-16 md:h-16 opacity-30">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imsu-3qFTUgKapaaAtc0RJrJb0KyoFDpgd5.png" alt="Imsu" fill className="object-contain" />
            </div>
            <div className="absolute right-16 md:right-20 top-16 md:top-20 w-16 h-16 md:w-20 md:h-20 opacity-40">
              <Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jeonghwa-vkeepvUQw7mtyztMYpGrZfM890lT9h.png" alt="Jeonghwa" fill className="object-contain" />
            </div>
            
            {/* Main mascot - center front */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-44 h-44 md:w-48 md:h-48 animate-float z-10">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
                alt="Sajume mascot - a cute pink nine-tailed fox holding a crystal ball"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
          
          <p className="text-sm md:text-base text-white/60 mb-6 max-w-sm mx-auto leading-relaxed">
            Discover the secrets hidden in your birth chart through ancient Korean Saju astrology.
          </p>
          
          <Link 
            href="/start"
            className="inline-flex items-center gap-2 bg-pink-400 text-white px-6 py-2.5 rounded-full text-sm md:text-base font-semibold hover:bg-pink-500 transition-all hover:scale-105 shadow-lg shadow-pink-500/30"
          >
            Get 9 Facts For Free (1 min)
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          
          <p className="mt-4 text-xs md:text-sm text-white/40">
            9 facts free | Full report $9.99
          </p>
        </div>
      </section>

      {/* Reviews Section - Text Based */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-2xl md:text-3xl font-semibold text-white/90 mb-2">100% Genuine Reviews</h3>
          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
            ))}
            <span className="text-sm text-white/60 ml-2">26+ reviews</span>
          </div>
          <p className="text-center text-sm text-white/50 mb-3 font-semibold">
            If these reviews are found to be manipulated or fake, we will stop selling this service.
          </p>
          <p className="text-center text-xs md:text-sm font-bold text-yellow-300 mb-6">
            #Shocked #Eerie #Encouraged
          </p>
          <TextReviewSlider reviews={TEXT_REVIEWS} />
        </div>
      </section>

      {/* Products Section */}
      <section className="relative z-10 py-16 px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Our Products</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-8 leading-relaxed">
            From ancient Korea eerie fortune telling<br/>to lucky charm bracelets
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 99 Facts Product - First row, full width on PC too */}
            <Link href="/start" className="group md:col-span-1">
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all hover:scale-[1.02] h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">99 Facts</h4>
                <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center flex-shrink-0" style={{ aspectRatio: '800/533' }}>
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/99facts.png-GQUor5lDB3UZjqnzWfMmGM6jWNHITE.jpeg"
                    alt="99 Facts of your birth chart"
                    width={800}
                    height={533}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">Deep dive into your complete birth chart with 99 personalized insights.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300">9 free + 90 premium</span>
                  <span className="text-lg font-bold text-white">$9.99</span>
                </div>
              </div>
            </Link>

            {/* Signature Saju Elemental Bracelet - Second row left on PC */}
            <div className="group cursor-not-allowed md:col-span-1">
              <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-xl p-6 opacity-70 h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">Signature Saju Elemental Bracelet</h4>
                <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center flex-shrink-0" style={{ aspectRatio: '800/533' }}>
                  <Image
                    src="/images/luck-bracelet.png"
                    alt="Signature Saju Elemental Bracelet"
                    width={800}
                    height={533}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">A signature bracelet designed to fill the missing energies in your personal Saju chart and attract good fortune.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-300">Personalized to your Saju</span>
                  <span className="text-lg font-bold text-white/50">$38</span>
                </div>
              </div>
            </div>

            {/* Relationship Compatibility - Second row middle on PC */}
            <div className="group cursor-not-allowed md:col-span-1">
              <div className="bg-gradient-to-br from-pink-900/40 to-rose-900/40 border border-pink-500/30 rounded-xl p-6 opacity-70 h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">Relationship Compatibility</h4>
                <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/40">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">The Art of Saju Compatibility: Are You Meant to Be?</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-pink-300">Discover your match</span>
                  <span className="text-lg font-bold text-white/50">$15</span>
                </div>
              </div>
            </div>

            {/* 12 months Saju Reading - Second row right on PC */}
            <div className="group cursor-not-allowed md:col-span-1">
              <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-6 opacity-70 h-full flex flex-col">
                <h4 className="text-base md:text-lg font-semibold text-white mb-3">12 months Saju Reading</h4>
                <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/40">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 mb-3 flex-grow">Monthly personalized Saju readings delivered to you every month throughout 2026.</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-300">12 monthly readings</span>
                  <span className="text-lg font-bold text-white/50">$79</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sajume Section */}
      <section className="relative z-10 py-16 px-4 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-center text-3xl md:text-4xl font-semibold text-white/90 mb-2">Why Sajume?</h3>
          <p className="text-center text-sm md:text-base text-white/50 mb-12">
            No more stress from wrong AI answers.<br/>Let sajume's certified expertise ease your mind.
          </p>
          
          {/* First Row: 2,765+ Reports Delivered */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">2,765+</h4>
              <p className="text-2xl md:text-2xl font-semibold text-white mb-4">Reports Delivered</p>
              <p className="text-sm md:text-base text-white/60 leading-relaxed">
                The world's only saju service that analyzes your chart based on exact global local birth time & delivers a full report in English.
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

          {/* Second Row: KPEI Certification - Image on left, text on right (mirrored from above) */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-1">
              <div className="relative w-full max-w-md mx-auto">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Frame%20181-cfTMJ2cXy3zGAdmW4sf31fboZo7apa.png"
                  alt="KPEI Certification - Level 1 and Level 2 Myungri Psychology Counselor certificates"
                  width={600}
                  height={700}
                  className="w-full h-auto rounded-xl"
                />
              </div>
            </div>
            <div className="order-2">
              <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-3">KPEI Certified</h4>
              <p className="text-2xl md:text-2xl font-semibold text-white mb-4">Myungri Psychology Counselors</p>
              <p className="text-sm md:text-base text-white/60 leading-relaxed">
                For a report grounded in structured logic and thoughtful interpretation, our team holds <span className="font-semibold">Level 1 and Level 2</span> certifications.
              </p>
            </div>
          </div>

          {/* Feature grid with white icons */}
          <div className="mb-10">
            <h4 className="text-center text-2xl md:text-3xl font-semibold text-white/80 mb-6">No.1 Global Saju,<br className="md:hidden" /> Feel the difference</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Lifetime Access */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Lifetime Access</h4>
                <p className="text-xs text-white/60">Your report stays accessible forever</p>
              </div>
              
              {/* Data-Driven Insights */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Data-Driven</h4>
                <p className="text-xs text-white/60">1,000+ charts analyzed</p>
              </div>
              
              {/* Consistent Results */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Consistent</h4>
                <p className="text-xs text-white/60">Same data = Same reading</p>
              </div>
              
              {/* Story-Driven */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 rounded-xl p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">Story-Driven</h4>
                <p className="text-xs text-white/60">Easy-to-understand insights</p>
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
          <p className="mt-3 text-xs text-white/30">All rights reserved by Sajume.</p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <button 
              data-tally-open="681NVP" 
              data-tally-layout="modal" 
              data-tally-emoji-text="👋" 
              data-tally-emoji-animation="wave"
              className="px-4 py-2 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded hover:bg-white/20 hover:border-white/40 transition-all"
            >
              May I help you with the issue?
            </button>
            <p className="text-xs text-white/30">Business: hello@sajume.com</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
