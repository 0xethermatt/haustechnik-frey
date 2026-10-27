import Link from 'next/link'
import { ArrowRight, BadgeEuro, Calculator } from 'lucide-react'

const rechner = [
  {
    href: '/waermepumpe#foerderrechner',
    icon: BadgeEuro,
    title: 'Förderrechner Wärmepumpe',
    text: 'Ihr KfW-Zuschuss inkl. aller Boni – in einer Minute.',
    color: 'bg-brand-green/15 text-brand-green',
  },
  {
    href: '/rechner',
    icon: Calculator,
    title: 'Heizungs- & Einsparrechner',
    text: 'Kosten, Förderung und Ersparnis aller Heizsysteme im Vergleich.',
    color: 'bg-brand-orange/15 text-brand-orange-dark',
  },
]

export default function RechnerTeaser() {
  return (
    <section className="py-10 sm:py-14 bg-white" aria-labelledby="rechner-teaser-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="rechner-teaser-heading" className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep text-center mb-6">
          Kostenlose Rechner
        </h2>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          {rechner.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group flex items-center gap-4 rounded-2xl border border-brand-purple/10 bg-brand-cream hover:shadow-card-hover p-4 sm:p-5 transition-shadow"
            >
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${r.color}`}>
                <r.icon className="w-6 h-6" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-brand-purple-deep">{r.title}</span>
                <span className="block text-sm text-brand-purple-deep/60 mt-0.5">{r.text}</span>
              </span>
              <ArrowRight className="w-5 h-5 text-brand-purple flex-shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
