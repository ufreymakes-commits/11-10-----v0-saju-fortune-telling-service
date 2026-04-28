'use client'

import { useState } from 'react'

const REVIEWS = [
  { id: 0,  text: "I started with the free 9 facts first because I was skeptical and was surprised by how accurate the information I got back was, it was almost scary. I ended up getting the 99 facts and everything I been through and am currently going through was mentioned and it gave me a lot of clarity. Thank you so much for this! I've been lost trying to figure out a lot of things and this helped a lot.", name: "Jasmine S.", flag: "🇺🇸", date: "Apr 25, 2026" },
  { id: 1,  text: "I loved my reading and it was accurate about my life and what there is to come", name: "Frida Coello", flag: "🇲🇽", date: "Apr 23, 2026" },
  { id: 2,  text: "I received the free 9 Facts First, due to worry that this was going to be a bit like a scam. Once I read through the 9 facts, I was intrigued and purchased the 99 Report. I'm glad I did. There's so much in here and I felt called out, lol. I really was shocked at how accurately it read me. A few of the facts are accurate to even now, and I can clearly look back at the past when the facts mentioned specific years. It's uncanny and I'm impressed!", name: "Emily W", flag: "🇺🇸", date: "Apr 15, 2026" },
  { id: 3,  text: "I really enjoyed reading this Saju packet. The fact-based format made it feel engaging, personal, and easy to connect with. I began highlighting the points that felt accurate, but quickly realized I had highlighted almost every page. I would highly recommend this for anyone curious about self-discovery or looking for clarity and encouragement about their life path.", name: "Hannah", flag: "🇺🇸", date: "Apr 10, 2026" },
  { id: 4,  text: "This was great insight. I definitely felt some feeling were validated.", name: "Jessica", flag: "🇺🇸", date: "Mar 31, 2026" },
  { id: 5,  text: "When I started reading the 99 Facts, most of them were unbelievably true to me. It's good to know what my past has been based on the charts and what the current and future look like. I was so surprised by the reading. Thank you for a meaningful reading.", name: "Tao Mon Lae", flag: "🇲🇲", date: "Mar 31, 2026" },
  { id: 6,  text: "The report was absolutely spot on. I will definitely book a forecasting reading asap cause the 99 report was very accurate so now I am curious about what it holds for my future. Thank you! Wonderful self discovery tool.", name: "Simona", flag: "🇮🇹", date: "Mar 31, 2026" },
  { id: 7,  text: "The report felt really accurate and had lots of interesting insights. I would highly recommend this to anyone curious about it.", name: "Charlotte", flag: "🇬🇧", date: "Mar 31, 2026" },
  { id: 8,  text: "Amazing report!! Good for giving a few things and getting some insights into yourself and into the future. Would highly recommend for anyone interested in SJPJ", name: "Charlotte", flag: "🇬🇧", date: "Mar 31, 2026" },
  { id: 9,  text: "It was scary accurate on so many things. But now it makes me really think about my future much more now because it was truly hit on a few things I have been thinking about for months now. I can't wait to see what the future will bring me and see how the results will compare to the report.", name: "Meng", flag: "🌏", date: "Mar 30, 2026" },
  { id: 10, text: "All past things were predicted on point like exact year and what happened. Future prediction are reasonable too except my career. But still, thank you so much", name: "Pranjali Patil", flag: "🇮🇳", date: "Mar 30, 2026" },
  { id: 11, text: "it really resonates with me and it helps to give me a sense of direction. it also acts as a reassurance for me when i start overthinking and feeling overwhelmed", name: "Sim Yun Rou", flag: "🇸🇬", date: "Mar 29, 2026" },
  { id: 12, text: "I think it really resonates with me and it helps to give me a sense of direction and also acts a bit as a reassurance for me", name: "Sim Yun Rou", flag: "🇸🇬", date: "Mar 29, 2026" },
  { id: 13, text: "I tried the sample 9 facts before purchasing the full report and that alone blew my mind. It's made me curious to try the full in depth report because of how scarily accurate it was. I think it's good for helping you see things about yourself that you may not have noticed before", name: "Alyssa", flag: "🇺🇸", date: "Mar 27, 2026" },
  { id: 14, text: "Like others have said, it is scarily accurate. It also gave me some clarity and confirmation that I am where I'm supposed to be right now. There's also some great advice that I'll definitely follow and see where it takes me. So glad I signed up for this!", name: "Hannah", flag: "🇺🇸", date: "Mar 20, 2026" },
  { id: 15, text: "The report came quickly and was surprisingly accurate. It covered internal emotional struggles that have been recurring throughout my life. It also gave insight into some career confusion and even suggested relocation areas I was already considering. Overall it was a fun and enjoyable read.", name: "JazzaRay", flag: "🇺🇸", date: "Mar 18, 2026" },
  { id: 16, text: "I did this on a whim and received the full report within 30 min. It was eerily accurate, just as advertised. I've been to multiple different fortune tellers and not one of them has given me actual timelines. Sajume was able to accurately pinpoint the year which key events had happened in my past. Sajume also listed out which upcoming years will be important too. If you're on the fence, I definitely recommend getting a report.", name: "Yvonne", flag: "🇺🇸", date: "Mar 18, 2026" },
  { id: 17, text: "It's crazy how accurate the facts are. Just with the first 9 facts, I got goosebumps with the accuracy!!", name: "Yin May Thinn", flag: "🇲🇲", date: "Mar 18, 2026" },
  { id: 18, text: "Wow almost every single point of the 99 facts was spot on. Will be purchasing more reports in the future.", name: "Nicko", flag: "🌏", date: "Mar 20, 2026" },
  { id: 19, text: "The reports brought up a lot that I pushed aside. Made me more introspective of how I want to move forward.", name: "Esther", flag: "🌍", date: "Mar 20, 2026" },
  { id: 20, text: "Great report!", name: "Nom", flag: "🌏", date: "Mar 20, 2026" },
  { id: 21, text: "This is scarily true. I was shocked because the timelines actually matched what happened in my life before. This is amazing, best impulsive buying I had in years.", name: "Nhi Tran", flag: "🇻🇳", date: "Mar 5, 2026" },
  { id: 22, text: "I love it!!! This is eeriely true, and I was shocked reading the report", name: "Nhi", flag: "🇻🇳", date: "Mar 5, 2026" },
  { id: 23, text: "The 99 Facts report was concise and exactly what I needed. I would highly recommend it.", name: "Simon", flag: "🇺🇸", date: "Mar 4, 2026" },
  { id: 24, text: "The 99 facts premium version is the real deal - I got it at the discounted price, but I wouldn't mind purchasing it again at its original price if I knew I would be getting such detailed information of my saju!", name: "Natalie", flag: "🇸🇬", date: "Mar 4, 2026" },
  { id: 25, text: "I loved it! It's very precise.", name: "Cecilia Mamani", flag: "🇨🇱", date: "Mar 3, 2026" },
  { id: 26, text: "so accurate!", name: "anannya", flag: "🌏", date: "Feb 15, 2026" },
  { id: 27, text: "wow so accurate", name: "anannya", flag: "🌏", date: "Feb 15, 2026" },
]

const INITIAL_VISIBLE = 10

function ReviewCard({ review }: { review: typeof REVIEWS[0] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{review.flag}</span>
          <div>
            <p className="text-sm font-semibold text-white/90">{review.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          ))}
        </div>
      </div>
      <p className="text-sm text-white/70 leading-relaxed">{review.text}</p>
      <p className="text-[11px] text-white/30 mt-2">{review.date}</p>
    </div>
  )
}

export function StartReviewsSection() {
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? REVIEWS : REVIEWS.slice(0, INITIAL_VISIBLE)

  return (
    <section className="relative z-10 py-16 px-4">
      <div className="max-w-lg mx-auto">
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
        <p className="text-center text-base font-bold text-white/80 mb-2">+2,765 reports sent</p>
        <p className="text-center text-xs text-white/35 mb-1 leading-relaxed">
          If these reviews are found to be manipulated or fake,<br />we will stop selling this service.
        </p>
        <p className="text-center text-xs md:text-sm font-bold text-yellow-300 mb-8">
          #Shocked #Eerie #Encouraged
        </p>

        {/* Review cards — first 10 always visible */}
        <div className="flex flex-col gap-3">
          {visible.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>

        {/* Toggle button */}
        {!expanded && REVIEWS.length > INITIAL_VISIBLE && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-6 w-full py-3 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white/90 hover:border-white/30 transition-all"
          >
            Swipe to see 29+ reviews
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="mt-6 w-full py-3 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white/90 hover:border-white/30 transition-all"
          >
            Show less
          </button>
        )}
      </div>
    </section>
  )
}
