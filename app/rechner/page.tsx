import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Heizungsrechner from '@/components/Heizungsrechner'
import EinsparRechner from '@/components/EinsparRechner'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Kostenlose Heizungsrechner | Haustechnik Frey Langenau',
  description:
    'Berechnen Sie Ihre Heizungskosten, BEG-Förderung und die Ersparnis beim Wechsel zur Wärmepumpe — kostenlos und unverbindlich.',
  alternates: {
    canonical: 'https://haustechnik-frey.de/rechner',
  },
}

export default function RechnerPage() {
  return (
    <main>
      <Navigation />
      <div className="pt-24 bg-brand-purple-deep">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Kostenlos & unverbindlich
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
            Heizungsrechner
          </h1>
          <p className="mt-4 text-white/65 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed">
            Zwei Rechner — Investitionskosten mit Förderung und monatliche Ersparnis beim
            Wechsel zur Wärmepumpe.
          </p>
        </div>
      </div>
      <Heizungsrechner />
      <EinsparRechner />
      <Footer />
    </main>
  )
}
