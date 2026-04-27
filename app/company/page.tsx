import Image from 'next/image'
import Link from 'next/link'
import { StarsBackground } from '@/components/stars-background'
import { sharedOpenGraph, sharedTwitter } from '@/lib/metadata'

export const metadata = {
  title: 'Company - Sajume',
  description: 'Bridging 5,000 years of wisdom with modern technology. Learn about Sajume and our founder.',
  openGraph: { ...sharedOpenGraph, title: 'Company - Sajume' },
  twitter: { ...sharedTwitter, title: 'Company - Sajume' },
}

const coreValues = [
  {
    num: '01',
    title: 'A Lifetime Guidebook from a Single Purchase',
    desc: 'Traditional consultations often fade from memory as time passes. Sajume is not a one-time service; it is a comprehensive 20–30 page report that you can return to whenever life feels heavy or a major decision lies ahead. Own a book that tells the story of your life, forever.',
  },
  {
    num: '02',
    title: '2,600+ Data-Driven Insights',
    desc: "Don't rely on the subjective mood or condition of a single practitioner. Sajume provides precise, consistent analysis through a vast database of clinical cases and our proprietary logic system. Over 99 specific facts are derived exclusively for your unique chart.",
  },
  {
    num: '03',
    title: 'Consistent Results You Can Trust',
    desc: 'Confused by different fortune tellers saying different things? Sajume uses a Fixed Logic System to provide a solid foundation for your life that remains consistent no matter when or where you check it. Only reliable data can serve as a true map for your future.',
  },
  {
    num: '04',
    title: 'Concrete, Story-Driven Interpretation',
    desc: 'We don\'t just tell you "who you are." We explain "why you were born with these tendencies and what kind of cosmic flow you are currently navigating." Through logical storytelling that connects your past and present, you will come to understand and embrace yourself more deeply.',
  },
]

export default function CompanyPage() {
  return (
    <main className="min-h-screen bg-mystical relative overflow-hidden pt-14">
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
            The Next Generation of Fortune Telling: Sajume
          </h1>
          <div className="relative w-full aspect-[1200/630] rounded-2xl overflow-hidden mb-10">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Thenextgenpng-MFmWPjDoalrvlPgKoNVgfNdDRvW9z1.png"
              alt="K-Saju - The Next Gen Fortune Telling"
              fill
              className="object-cover"
            />
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            Bridging 5,000 Years of Wisdom with Modern Technology — A Clear Guide to Your Life&apos;s Blueprint
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Saju is far more than mere superstition. It is a sophisticated system of statistics and humanities that analyzes the cosmic energies embedded in the &ldquo;Four Pillars&rdquo; (Year, Month, Day, and Hour) of your birth.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            For too long, Saju has felt inaccessible due to the subjective interpretations or vague language of individual practitioners. Sajume has reimagined this ancient wisdom by combining it with modern algorithms, allowing anyone to understand their life&apos;s blueprint with clarity and objectivity.
          </p>
        </div>

        {/* Founder's Story */}
        <div className="mb-16 border-t border-border pt-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-6">Founder&apos;s Story &amp; Expertise</p>

          {/* Images */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/founder%20image-Y6vZ39gBOBm3lnx1sWQHGHfVa0syux.png"
                alt="Sajume founder"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/certification%20image-v8v85tTjTRrn7KWIxIT6LZqcmhoEdy.png"
                alt="Saju analyst certification - Level 1 and Level 2"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mb-10 tracking-wide">
            KPEI Certified Myungri Psychology Counselors
          </p>

          <div className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Hi, I&apos;m the creator of Sajume — a Korean woman based in Seoul. I majored in English and have traveled to many countries, making friends from all around the world.
            </p>
            <p>
              One thing I noticed through these friendships is that no matter where we&apos;re from, we all carry deep questions about our lives, our relationships, and who we really are. In Korea, we have a long-standing tradition called Saju — a personalized life reading based on your birth date, time, and place. It&apos;s incredibly common; if you ask any Korean in their 20s or 30s, &ldquo;Have you ever had your saju read?&rdquo; they&apos;ll almost always say, &ldquo;Of course!&rdquo;
            </p>
            <p>
              I created Sajume to share this unique and meaningful tradition with people outside of Korea. More than just a reading, I hope it brings you a sense of clarity about your life path, and deeper understanding and compassion for yourself — in love, in career, and in your personal journey. Reviewed by experienced saju analysts, the system I built blends traditional wisdom with intuitive insight.
            </p>
            <p>
              And this is just the beginning — we&apos;re also preparing to launch meaningful items like lucky bracelets and energy-infused jewelry to support you on your path.
            </p>
            <p className="text-foreground/80 font-medium">
              Thank you so much for being here. I truly hope Sajume becomes a gentle guide and heartfelt comfort in your journey through life.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16 border-t border-border pt-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-2">Why Sajume?</p>
          <h2 className="text-2xl font-bold text-foreground mb-10">Our 4 Core Values</h2>
          <div className="space-y-8">
            {coreValues.map(item => (
              <div key={item.num} className="flex gap-5">
                <div className="shrink-0">
                  <span className="text-3xl font-bold text-primary/20 font-mono">{item.num}</span>
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <div className="border-t border-border pt-14 text-center">
          <p className="text-foreground/70 leading-relaxed mb-3">
            Sajume does not decide your destiny.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-10">
            Instead, we draw the most precise map in the world so that you can decide your destiny for yourself.<br />
            Discover your cosmic blueprint at Sajume today.
          </p>
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
