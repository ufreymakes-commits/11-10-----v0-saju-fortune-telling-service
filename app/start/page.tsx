import Image from 'next/image'
import Link from 'next/link'
import { StarsBackground } from '@/components/stars-background'
import { BirthForm } from '@/components/birth-form'

import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

export const metadata = {
  title: 'Enter Your Birth Info - Sajume',
  description: 'Enter your birth information to discover 99 facts about your destiny through Korean Saju astrology.',
  openGraph: { ...sharedOpenGraph, title: 'Enter Your Birth Info - Sajume' },
  twitter: { ...sharedTwitter, title: 'Enter Your Birth Info - Sajume' },
}

export default function StartPage() {
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 flex flex-col items-center px-4 py-8">
        {/* Header */}
        <Link href="/" className="mb-6">
          <div className="border border-primary/50 rounded-full px-6 py-2 text-primary text-sm tracking-wider hover:border-primary transition-colors">
            Sajume
          </div>
        </Link>
        
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
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/70">
            All rights reserved by Sajume.
          </p>
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
            <p className="text-[10px] text-muted-foreground/50">
              Business: hello@sajume.com
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
