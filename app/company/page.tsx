import Link from 'next/link'
import { StarsBackground } from '@/components/stars-background'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

export const metadata = {
  title: 'Company - Sajume',
  description: 'Learn about Sajume, the next generation Korean Saju fortune telling service.',
  openGraph: { ...sharedOpenGraph, title: 'Company - Sajume' },
  twitter: { ...sharedTwitter, title: 'Company - Sajume' },
}

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden">
      <StarsBackground />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16">
        {/* Logo */}
        <div className="mb-16">
          <Link href="/">
            <div className="inline-block border border-primary/50 rounded-full px-6 py-2 text-primary text-sm tracking-wider hover:border-primary transition-colors">
              Sajume
            </div>
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-4">About</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance mb-6">
            The Next Generation of Fortune Telling
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Sajume brings over 5,000 years of Korean Saju astrology into the modern world — combining ancient wisdom with AI to reveal the truths written in your birth chart.
          </p>
        </div>

        {/* What is Saju */}
        <div className="mb-12 border-t border-border pt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">What is Saju?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Saju (사주) literally means "four pillars" — the year, month, day, and hour of your birth. Each pillar contains a heavenly stem and an earthly branch, forming a unique cosmic blueprint that governs your personality, relationships, career, and destiny.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            For millennia, Saju masters in Korea have used this system to guide kings, generals, and ordinary people alike. Sajume makes this wisdom accessible to anyone, anywhere.
          </p>
        </div>

        {/* Why Sajume */}
        <div className="mb-12 border-t border-border pt-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Why Sajume</h2>
          <div className="space-y-6">
            {[
              {
                title: 'Rooted in tradition',
                desc: 'Our interpretations are based on classical Saju principles used by Korean fortune tellers for generations — not simplified pop astrology.'
              },
              {
                title: 'Powered by AI',
                desc: 'We use the latest AI models to synthesize your unique four pillars into deeply personal, nuanced insights — 99 facts written just for you.'
              },
              {
                title: 'No fluff, just facts',
                desc: 'Every insight is specific to your birth chart. No generic horoscopes. No vague predictions. Just the truth your chart reveals.'
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-foreground font-medium mb-1">{item.title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-border pt-12 text-center">
          <p className="text-muted-foreground mb-6">Ready to discover what your birth chart says about you?</p>
          <Link href="/start">
            <button className="bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-medium hover:bg-secondary/90 transition-colors">
              Get Your 99 Facts
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}
