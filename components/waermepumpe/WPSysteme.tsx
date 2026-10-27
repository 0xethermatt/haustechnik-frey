import { Wind, Mountain, Waves, Check } from 'lucide-react'

const systeme = [
  {
    icon: Wind,
    title: 'Luft-Wasser-Wärmepumpe',
    badge: 'Am häufigsten',
    badgeColor: 'bg-brand-green text-white',
    text: 'Nutzt die Außenluft als Wärmequelle. Keine Bohrung, schnelle Installation und die beste Wahl für die meisten Bestandsgebäude.',
    facts: [
      ['Investition', '€€'],
      ['Jahresarbeitszahl', 'ca. 3,0 – 4,0'],
      ['Platzbedarf', 'Außeneinheit ca. 1 m²'],
      ['Genehmigung', 'in der Regel nicht nötig'],
    ],
  },
  {
    icon: Mountain,
    title: 'Sole-Wasser (Erdwärme)',
    badge: 'Höchste Effizienz',
    badgeColor: 'bg-brand-blue text-white',
    text: 'Holt die Wärme über Erdsonden oder Flächenkollektoren aus dem Boden. Sehr effizient und lautlos, benötigt aber Bohrung und Grundstück.',
    facts: [
      ['Investition', '€€€'],
      ['Jahresarbeitszahl', 'ca. 4,0 – 5,0'],
      ['Platzbedarf', 'Bohrfläche im Garten'],
      ['Genehmigung', 'wasserrechtlich erforderlich'],
    ],
  },
  {
    icon: Waves,
    title: 'Wasser-Wasser (Grundwasser)',
    badge: 'Speziallösung',
    badgeColor: 'bg-brand-purple text-white',
    text: 'Nutzt Grundwasser über Förder- und Schluckbrunnen. Top-Effizienz, aber nur bei passender Wasserqualität und Genehmigung möglich.',
    facts: [
      ['Investition', '€€€'],
      ['Jahresarbeitszahl', 'ca. 4,5 – 5,5'],
      ['Platzbedarf', 'zwei Brunnen'],
      ['Genehmigung', 'wasserrechtlich erforderlich'],
    ],
  },
]

export default function WPSysteme() {
  return (
    <section id="systeme" className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-brand-cream" aria-labelledby="systeme-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-end mb-10 sm:mb-12">
          <div>
            <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
              Technik verständlich
            </span>
            <h2 id="systeme-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight">
              Welche Wärmepumpe passt zu Ihnen?
            </h2>
          </div>
          <p className="text-base sm:text-lg text-brand-purple-deep/70 leading-relaxed">
            Alle Wärmepumpen arbeiten nach dem Kühlschrank-Prinzip – nur umgekehrt: Sie entziehen der Umwelt
            Wärme und heben sie mit wenig Strom auf Heiztemperatur. Der Unterschied liegt in der Wärmequelle.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {systeme.map((s, i) => (
            <article
              key={s.title}
              className={`rounded-3xl bg-white border border-brand-purple/10 overflow-hidden flex flex-col ${i === 0 ? 'ring-2 ring-brand-green/40' : ''}`}
            >
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
                    <s.icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.badgeColor}`}>{s.badge}</span>
                </div>
                <h3 className="text-xl font-bold text-brand-purple-deep mb-2">{s.title}</h3>
                <p className="text-sm text-brand-purple-deep/65 leading-relaxed mb-5">{s.text}</p>
                <dl className="mt-auto divide-y divide-brand-purple/10 text-sm">
                  {s.facts.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2">
                      <dt className="text-brand-purple-deep/55">{k}</dt>
                      <dd className="font-semibold text-brand-purple-deep text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-brand-purple-deep text-white p-6 sm:p-8 grid md:grid-cols-[auto_1fr] gap-5 items-center">
          <div className="text-4xl sm:text-5xl font-serif font-bold text-brand-orange">JAZ</div>
          <div>
            <p className="font-bold text-lg mb-1">Die wichtigste Kennzahl: Jahresarbeitszahl</p>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
              Sie gibt an, wie viel Wärme pro kWh Strom übers Jahr entsteht. Für die Förderung ist eine JAZ von
              mindestens 3,0 nötig. Wir legen Ihre Anlage so aus, dass sie das sicher erreicht – mit
              Heizlastberechnung, hydraulischem Abgleich und optimal eingestellter Heizkurve.
            </p>
          </div>
        </div>

        <ul className="mt-6 grid sm:grid-cols-3 gap-3" role="list">
          {['Raumweise Heizlastberechnung', 'Hydraulischer Abgleich inklusive', 'Schallplanung für den Aufstellort'].map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm font-semibold text-brand-purple-deep/80 bg-white rounded-2xl px-4 py-3 border border-brand-purple/10">
              <Check className="w-4 h-4 text-brand-green" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
