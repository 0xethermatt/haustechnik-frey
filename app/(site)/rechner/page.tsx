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
      <div className="h-24 bg-[#3B1560]" />
      <Heizungsrechner />
      <EinsparRechner />
      <Footer />
    </main>
  )
}
