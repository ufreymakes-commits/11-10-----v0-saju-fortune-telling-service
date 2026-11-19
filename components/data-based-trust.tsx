import Image from 'next/image'

export function DataBasedTrust() {
  return (
    <section aria-labelledby="data-based-heading" className="relative z-10 px-4 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="data-based-heading"
          className="text-balance text-2xl font-semibold text-white/90 md:text-3xl"
        >
          Data-based, not guru-based
        </h2>

        <div className="relative mx-auto mt-10 w-full max-w-md text-left">
          <div className="relative bg-[#f6ecd6] shadow-[0_10px_30px_-8px_rgba(60,30,90,0.45)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-3 border border-[#b8934a]/40"
            />

            <div className="relative px-6 pb-8 pt-6 sm:px-8">
              <div className="mb-5 flex items-center gap-4">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border border-[#c9a24d] bg-[#fbf4e4] shadow-md">
                  <Image
                    src="/media/founder-yuri.webp"
                    alt="Yuri, founder of Sajume"
                    width={72}
                    height={72}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-pretty text-base font-semibold leading-snug text-[#3d2a1e]">
                  Hi, I&apos;m Yuri, the founder of Sajume.
                </p>
              </div>

              <div className="flex flex-col gap-5 text-pretty text-[15px] leading-[1.75] text-[#3d2a1e]">
                <p>
                  When I turned 30, I still couldn&apos;t tell which career I&apos;d truly shine in. In love, I
                  went on plenty of dates, yet I was confused about who actually made me feel safe and at
                  peace.
                </p>
                <p>Then I found Saju, and it helped me understand myself in a way nothing else had.</p>
                <p>
                  I built Sajume with one sincere hope: that people around the world asking the same
                  questions, not just my friends in Korea, could find a guide for their own journey of
                  self-discovery.
                </p>
                <p>
                  If you&apos;re feeling pressure, confusion, or stuck about where your life is going, I hope
                  Sajume helps you understand yourself a little better.
                </p>
                <p>
                  Instead of relying on a single guru, I wanted to build a guide to your destiny from precise
                  algorithms, patterns, and data. I&apos;m a KPEI Certified Myungri Psychology Counselor, and I
                  keep refining the accuracy with insights from more than 6,000 reports.
                </p>
              </div>

              <p className="mt-8 text-right text-sm font-medium text-[#3d2a1e]/80">
                &mdash; Yuri, Founder of Sajume
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
