'use client'

import Image from 'next/image'

export function AskGumihoProductCard() {
  return (
    <div className="group md:col-span-1">
      <div className="bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 border border-fuchsia-500/30 rounded-xl p-6 h-full flex flex-col">
        <h4 className="text-base md:text-lg font-semibold text-white mb-3">Ask the Gumiho 1:1</h4>
        <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-[#1a1a2e] flex-shrink-0" style={{ aspectRatio: '800/533' }}>
          <Image
            src="/images/ask-gumiho.png"
            alt="Ask the Gumiho 1:1"
            width={800}
            height={533}
            className="w-full h-full object-cover object-center"
          />
        </div>
        <p className="text-sm text-white/70 mb-3 flex-grow">Your 3 Burning Questions Answered - Personalized guidance from the nine-tailed fox.</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-fuchsia-300">99 Facts customers only</span>
          <span className="text-lg font-bold text-white">$9.99</span>
        </div>
        <button
          onClick={() => alert('This product is exclusively available to customers who have purchased the 99 Facts Report. Please purchase the 99 Facts Report first.')}
          className="w-full text-center py-2 px-4 rounded-lg text-sm font-medium bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/30 hover:border-fuchsia-400/50 transition-all"
        >
          Ask Now
        </button>
      </div>
    </div>
  )
}
