import Link from 'next/link'
import Image from 'next/image'
import { StarsBackground } from '@/components/stars-background'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />
      
      {/* Floating date decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 select-none" aria-hidden="true">
        <span className="absolute top-[10%] left-[5%] text-sm text-foreground/30 rotate-[-5deg]">1997.07.21.10pm</span>
        <span className="absolute top-[15%] right-[8%] text-sm text-foreground/30 rotate-[3deg]">2010.08.15.1pm</span>
        <span className="absolute top-[40%] left-[3%] text-sm text-foreground/30 rotate-[-8deg]">2001.03.30.8am</span>
        <span className="absolute bottom-[30%] right-[5%] text-sm text-foreground/30 rotate-[5deg]">2003.06.04.7am</span>
        <span className="absolute bottom-[15%] left-[10%] text-sm text-foreground/30 rotate-[-3deg]">1999.12.27.9pm</span>
        <span className="absolute top-[60%] right-[12%] text-sm text-foreground/30 rotate-[8deg]">2008.11.03.2am</span>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Sparkle decorations */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2" aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="text-foreground/80">
            <path d="M40 0L42 38L80 40L42 42L40 80L38 42L0 40L38 38L40 0Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-[18%] left-[calc(50%-60px)]" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-foreground/60">
            <path d="M10 0L10.5 9.5L20 10L10.5 10.5L10 20L9.5 10.5L0 10L9.5 9.5L10 0Z" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute top-[20%] left-[calc(50%+50px)]" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground/60">
            <path d="M12 0L12.6 11.4L24 12L12.6 12.6L12 24L11.4 12.6L0 12L11.4 11.4L12 0Z" fill="currentColor" />
          </svg>
        </div>
        
        {/* Main content */}
        <div className="text-center max-w-3xl mx-auto mt-24">
          <h1 className="text-6xl md:text-8xl font-bold mb-2">
            <span className="text-gradient">99 Facts</span>
          </h1>
          <h2 className="text-3xl md:text-4xl text-foreground/90 mb-6">
            of your birth chart
          </h2>
          
          <div className="inline-block bg-primary/80 text-primary-foreground px-6 py-2 rounded-sm text-lg mb-12">
            {"K-astrology 'Saju' based"}
          </div>
          
          {/* Mascot */}
          <div className="relative w-64 h-64 mx-auto mb-8 animate-float">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E1%84%8B%E1%85%B2%E1%84%85%E1%85%B5%E1%84%82%E1%85%B5%E1%86%B7%20%E1%84%8F%E1%85%A2%E1%84%85%E1%85%B5%E1%86%A8%E1%84%90%E1%85%A5_%E1%84%81%E1%85%A9%E1%84%85%E1%85%B59%E1%84%80%E1%85%A2_%E1%84%90%E1%85%AE%E1%84%86%E1%85%A7%E1%86%BC-4J7Wg4ZplPdldQ6mWiiyFy5QQ4WpGT.png"
              alt="Sajume mascot - a cute pink nine-tailed fox holding a crystal ball"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          
          <p className="text-xl text-foreground/70 mb-8 max-w-xl mx-auto leading-relaxed">
            Discover the secrets hidden in your birth chart through ancient Korean Saju astrology. 
            Uncover 99 personalized facts about your destiny.
          </p>
          
          <Link 
            href="/start"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-full text-xl font-semibold hover:bg-secondary/90 transition-all hover:scale-105 glow-pink"
          >
            Discover Your Destiny
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="ml-1">
              <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          
          <p className="mt-6 text-sm text-muted-foreground">
            9 facts free • Full report $9.99
          </p>
        </div>
        
        {/* Logo */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="border border-foreground/50 rounded-full px-6 py-2 text-foreground/80 text-sm tracking-wider">
            Sajume
          </div>
        </div>
      </div>
    </main>
  )
}
