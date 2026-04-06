import Image from 'next/image'
import Link from 'next/link'
import { StarsBackground } from '@/components/stars-background'
import { BirthForm } from '@/components/birth-form'

export const metadata = {
  title: 'Enter Your Birth Info - Sajume',
  description: 'Enter your birth information to discover 99 facts about your destiny through Korean Saju astrology.'
}

export default function StartPage() {
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />
      
      <div className="relative z-10 flex flex-col items-center px-4 py-8">
        {/* Header */}
        <Link href="/" className="mb-6">
          <div className="border border-foreground/50 rounded-full px-6 py-2 text-foreground/80 text-sm tracking-wider hover:border-foreground transition-colors">
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
        <h1 className="text-3xl md:text-4xl font-bold text-gradient text-center mb-2">
          Enter Your Birth Info
        </h1>
        <p className="text-foreground/70 text-center mb-8 max-w-md">
          Share your birth details to unlock the secrets hidden in your Saju chart
        </p>
        
        {/* Form Card */}
        <div className="w-full max-w-md bg-card/30 backdrop-blur-sm border border-border/30 rounded-2xl p-6 md:p-8">
          <BirthForm />
        </div>
        
        {/* Info */}
        <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
          Your information is used solely to calculate your birth chart and will not be shared with third parties.
        </p>
      </div>
    </main>
  )
}
