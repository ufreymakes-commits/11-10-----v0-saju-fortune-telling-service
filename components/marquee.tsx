'use client'

export function Marquee() {
  return (
    <div 
      className="w-full overflow-hidden bg-white text-black text-sm border-b border-black/10 relative z-20"
      role="region" 
      aria-label="Site announcement"
    >
      <div className="flex whitespace-nowrap">
        <div className="flex animate-marquee">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center px-7 py-3">
              <span className="font-bold tracking-wide">
                SJPJ &middot; Global local time &amp; English Report
              </span>
            </div>
          ))}
        </div>
        <div className="flex animate-marquee" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center px-7 py-3">
              <span className="font-bold tracking-wide">
                SJPJ &middot; Global local time &amp; English Report
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
