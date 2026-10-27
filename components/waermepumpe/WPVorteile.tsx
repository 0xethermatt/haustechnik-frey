import { BadgeEuro, Leaf, Snowflake, ShieldCheck, TrendingDown, Home } from 'lucide-react'
import { formatEuro, getPeriode } from '@/lib/waermepumpe/foerderung'

const vorteile = () => [
  {
    icon: TrendingDown,
    title: 'Niedrigere Heizkosten',
    text: 'Aus 1 kWh Strom werden 3–4 kWh Wärme.',
    color: 'text-brand-green bg-brand-green/10',
  },
  {
    icon: BadgeEuro,
    title: 'Bis zu 80 % Zuschuss',
    text: `Bis zu ${formatEuro(getPeriode().kostenErsteWE * 0.8)} von der KfW.`,
    color: 'text-brand-orange-dark bg-brand-orange/10',
  },
  {
    icon: ShieldCheck,
    title: 'Unabhängig von Öl & Gas',
    text: 'Kein steigender CO₂-Preis mehr.',
    color: 'text-brand-blue bg-brand-blue/10',
  },
  {
    icon: Leaf,
    title: 'GEG-sicher',
    text: 'Erfüllt die 65-%-Vorgabe vollständig.',
    color: 'text-brand-teal bg-brand-teal/10',
  },
  {
    icon: Snowflake,
    title: 'Im Sommer kühlen',
    text: 'Sanfte Kühlung über die Heizflächen.',
    color: 'text-brand-blue bg-brand-blue/10',
  },
  {
    icon: Home,
    title: 'Mehr Immobilienwert',
    text: 'Bessere Effizienzklasse fürs Haus.',
    color: 'text-brand-purple bg-brand-purple/10',
  },
]

export default function WPVorteile() {
  return (
    <section id="vorteile" className="scroll-mt-32 py-12 sm:py-16 bg-white" aria-labelledby="vorteile-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="vorteile-heading" className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep mb-6 sm:mb-8 text-center">
          Warum eine Wärmepumpe?
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {vorteile().map((v) => (
            <div key={v.title} className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-brand-purple/10 bg-brand-cream p-4">
              <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${v.color}`}>
                <v.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-brand-purple-deep leading-tight">{v.title}</h3>
                <p className="text-xs sm:text-sm text-brand-purple-deep/60 leading-snug mt-1">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
