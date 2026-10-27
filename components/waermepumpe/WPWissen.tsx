'use client'

import { useEffect, useState } from 'react'

export interface WissenTab {
  id: string
  label: string
  content: React.ReactNode
}

export default function WPWissen({ tabs }: { tabs: WissenTab[] }) {
  const [active, setActive] = useState(tabs[0].id)

  // Deep-Links wie /waermepumpe#kosten öffnen den passenden Reiter
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1)
      if (tabs.some((t) => t.id === id)) {
        setActive(id)
        document.getElementById('wissen')?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [tabs])

  return (
    <section id="wissen" className="scroll-mt-32 py-14 sm:py-20 bg-brand-warm" aria-labelledby="wissen-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-3">
            Gut zu wissen
          </span>
          <h2 id="wissen-heading" className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep">
            Kosten, Ablauf &amp; Technik
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Themen"
          className="flex gap-1 p-1 rounded-full bg-white border border-brand-purple/10 mb-6 sm:mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:w-fit sm:mx-auto"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              aria-controls={`wissen-${t.id}`}
              onClick={() => setActive(t.id)}
              className={`flex-1 sm:flex-none whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                active === t.id ? 'bg-brand-purple text-white' : 'text-brand-purple-deep/70 hover:bg-brand-purple/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tabs.map((t) => (
          <div key={t.id} id={`wissen-${t.id}`} role="tabpanel" hidden={active !== t.id}>
            {t.content}
          </div>
        ))}
      </div>
    </section>
  )
}
