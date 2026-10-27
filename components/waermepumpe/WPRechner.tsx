'use client'

import { useState } from 'react'
import { BadgeEuro, TrendingDown } from 'lucide-react'
import WPFoerderrechner from './WPFoerderrechner'
import EinsparRechner from '@/components/EinsparRechner'
import { FOERDER_STAND } from '@/lib/waermepumpe/foerderung'

const TABS = [
  { id: 'foerderung', label: 'Zuschuss', icon: BadgeEuro },
  { id: 'ersparnis', label: 'Ersparnis', icon: TrendingDown },
] as const

type Tab = (typeof TABS)[number]['id']

export default function WPRechner() {
  const [tab, setTab] = useState<Tab>('foerderung')

  return (
    <section
      id="foerderrechner"
      className="scroll-mt-32 py-14 sm:py-20 lg:py-24 bg-[#3B1560] relative overflow-clip"
      aria-labelledby="rechner-heading"
    >
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-3">
            Rechner · KfW 458, Stand {FOERDER_STAND}
          </span>
          <h2 id="rechner-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            Was bringt Ihnen die Wärmepumpe?
          </h2>
        </div>

        <div role="tablist" aria-label="Rechner wählen" className="mx-auto mb-8 grid grid-cols-2 gap-1 p-1 rounded-full bg-white/10 max-w-md">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`rechner-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                tab === t.id ? 'bg-white text-brand-purple-deep' : 'text-white/70 hover:text-white'
              }`}
            >
              <t.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Beide bleiben gemountet, damit Eingaben beim Wechseln erhalten bleiben */}
        <div id="rechner-foerderung" role="tabpanel" hidden={tab !== 'foerderung'}>
          <WPFoerderrechner />
        </div>
        <div id="rechner-ersparnis" role="tabpanel" hidden={tab !== 'ersparnis'} className="max-w-4xl mx-auto">
          <EinsparRechner embedded />
        </div>
      </div>
    </section>
  )
}
