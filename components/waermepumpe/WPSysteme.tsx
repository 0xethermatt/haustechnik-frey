import { Wind, Mountain, Waves } from 'lucide-react'

const systeme = [
  {
    icon: Wind,
    title: 'Luft-Wasser',
    badge: 'Am häufigsten',
    badgeColor: 'bg-brand-green text-white',
    text: 'Nutzt die Außenluft. Keine Bohrung, schneller Einbau – die beste Wahl für die meisten Bestandsgebäude.',
    facts: [
      ['Investition', '€€'],
      ['Jahresarbeitszahl', '3,0 – 4,0'],
      ['Genehmigung', 'meist nicht nötig'],
    ],
  },
  {
    icon: Mountain,
    title: 'Sole-Wasser (Erdwärme)',
    badge: 'Höchste Effizienz',
    badgeColor: 'bg-brand-blue text-white',
    text: 'Holt die Wärme über Erdsonden aus dem Boden. Sehr effizient und lautlos, braucht Bohrung und Grundstück.',
    facts: [
      ['Investition', '€€€'],
      ['Jahresarbeitszahl', '4,0 – 5,0'],
      ['Genehmigung', 'erforderlich'],
    ],
  },
  {
    icon: Waves,
    title: 'Wasser-Wasser',
    badge: 'Speziallösung',
    badgeColor: 'bg-brand-purple text-white',
    text: 'Nutzt Grundwasser über zwei Brunnen. Top-Effizienz, nur bei passender Wasserqualität möglich.',
    facts: [
      ['Investition', '€€€'],
      ['Jahresarbeitszahl', '4,5 – 5,5'],
      ['Genehmigung', 'erforderlich'],
    ],
  },
]

export default function WPSysteme() {
  return (
    <div className="space-y-5">
      <p className="text-brand-purple-deep/70 leading-relaxed">
        Alle Wärmepumpen arbeiten wie ein umgekehrter Kühlschrank: Sie entziehen der Umwelt Wärme und heben sie mit
        wenig Strom auf Heiztemperatur. Der Unterschied liegt in der Wärmequelle.
      </p>
      <div className="grid md:grid-cols-3 gap-3">
        {systeme.map((s, i) => (
          <article key={s.title} className={`rounded-2xl bg-white border p-5 ${i === 0 ? 'border-brand-green/50 ring-1 ring-brand-green/30' : 'border-brand-purple/10'}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <s.icon className="w-5 h-5 text-brand-purple" aria-hidden="true" />
                <h4 className="font-bold text-brand-purple-deep">{s.title}</h4>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.badgeColor}`}>{s.badge}</span>
            </div>
            <p className="text-sm text-brand-purple-deep/65 leading-relaxed mb-3">{s.text}</p>
            <dl className="text-sm divide-y divide-brand-purple/10">
              {s.facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-1.5">
                  <dt className="text-brand-purple-deep/55">{k}</dt>
                  <dd className="font-semibold text-brand-purple-deep text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <p className="text-sm text-brand-purple-deep/70 leading-relaxed bg-white rounded-2xl border border-brand-purple/10 p-4">
        <strong className="text-brand-purple-deep">Jahresarbeitszahl (JAZ):</strong> So viel Wärme entsteht pro kWh Strom
        übers Jahr. Für die Förderung braucht es mindestens 3,0 – das stellen wir mit Heizlastberechnung, hydraulischem
        Abgleich und optimaler Heizkurve sicher.
      </p>
    </div>
  )
}
