import { Check, Info } from 'lucide-react'
import { berechneFoerderung, formatEuro } from '@/lib/waermepumpe/foerderung'

// Richtwerte für ein typisches Einfamilienhaus im Bestand (brutto, inkl. Montage)
const POSITIONEN = [
  { label: 'Wärmepumpe inkl. Warmwasser- und Pufferspeicher', von: 14000, bis: 22000 },
  { label: 'Montage, Hydraulik & Inbetriebnahme', von: 5000, bis: 8000 },
  { label: 'Demontage & Entsorgung Altanlage / Öltank', von: 1000, bis: 3000 },
  { label: 'Elektroanschluss, Zählerplatz, Smart-Meter-Vorbereitung', von: 1500, bis: 4000 },
  { label: 'Fundament, Kondensatablauf, Leitungen nach außen', von: 1000, bis: 2000 },
  { label: 'Optional: Heizkörpertausch (je Heizkörper)', von: 600, bis: 1500, optional: true },
]

const INKLUSIVE = [
  'Vor-Ort-Termin & raumweise Heizlastberechnung',
  'Angebot mit Förderklausel',
  'Bestätigung zum Antrag (BzA) für die KfW',
  'Hydraulischer Abgleich',
  'Einweisung & Optimierung der Heizkurve',
  'Nachweise für die Auszahlung des Zuschusses',
]

export default function WPKosten() {
  const summeVon = POSITIONEN.filter((p) => !p.optional).reduce((s, p) => s + p.von, 0)
  const summeBis = POSITIONEN.filter((p) => !p.optional).reduce((s, p) => s + p.bis, 0)

  const beispielInvest = 32000
  const beispiele = [
    {
      title: 'Ölheizung, Einkommen über 50.000 €',
      r: berechneFoerderung({ investition: beispielInvest, wohneinheiten: 1, selbstnutzer: true, altanlage: 'oel', einkommen: 'ueber60', kindImHaushalt: false }),
    },
    {
      title: 'Gas (20+ Jahre), zvE 35.000 €',
      r: berechneFoerderung({ investition: beispielInvest, wohneinheiten: 1, selbstnutzer: true, altanlage: 'gas-alt', einkommen: 'bis40', kindImHaushalt: false }),
    },
    {
      title: 'Öl, zvE 38.000 € + Kind',
      r: berechneFoerderung({ investition: beispielInvest, wohneinheiten: 1, selbstnutzer: true, altanlage: 'oel', einkommen: 'bis40', kindImHaushalt: true }),
    },
  ]

  return (
    <section id="kosten" className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-white" aria-labelledby="kosten-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10 sm:mb-12">
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Transparente Kosten
          </span>
          <h2 id="kosten-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight mb-4">
            Was kostet eine Wärmepumpe wirklich?
          </h2>
          <p className="text-base sm:text-lg text-brand-purple-deep/70 leading-relaxed">
            Keine Lockangebote, keine versteckten Positionen. So setzen sich die Kosten für eine
            Luft-Wasser-Wärmepumpe in einem typischen Einfamilienhaus zusammen.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="rounded-3xl border border-brand-purple/10 overflow-hidden">
            <table className="w-full text-sm sm:text-base">
              <caption className="sr-only">Kostenpositionen einer Luft-Wasser-Wärmepumpe</caption>
              <thead className="bg-brand-warm text-left">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold text-brand-purple-deep/70">Position</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-brand-purple-deep/70 text-right whitespace-nowrap">Richtwert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-purple/10">
                {POSITIONEN.map((p) => (
                  <tr key={p.label} className={p.optional ? 'text-brand-purple-deep/55' : 'text-brand-purple-deep'}>
                    <td className="px-5 py-3">{p.label}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap font-semibold">
                      {formatEuro(p.von)} – {formatEuro(p.bis)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-brand-purple-deep text-white">
                  <td className="px-5 py-4 font-bold">Gesamt vor Förderung</td>
                  <td className="px-5 py-4 text-right font-bold whitespace-nowrap">
                    {formatEuro(summeVon)} – {formatEuro(summeBis)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded-3xl bg-brand-cream border border-brand-purple/10 p-6">
            <h3 className="text-lg font-bold text-brand-purple-deep mb-1">Rechenbeispiele nach Förderung</h3>
            <p className="text-sm text-brand-purple-deep/55 mb-5">Investition {formatEuro(beispielInvest)}, selbst bewohntes Einfamilienhaus</p>
            <div className="space-y-3">
              {beispiele.map((b) => (
                <div key={b.title} className="bg-white rounded-2xl p-4 border border-brand-purple/5">
                  <p className="text-sm font-semibold text-brand-purple-deep mb-2">{b.title}</p>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-brand-purple-deep/50">Zuschuss ({b.r.satzSelbstgenutzt} %)</p>
                      <p className="font-bold text-brand-green">− {formatEuro(b.r.zuschuss)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-brand-purple-deep/50">Eigenanteil</p>
                      <p className="text-xl font-serif font-bold text-brand-purple-deep">{formatEuro(b.r.eigenanteil)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <h3 className="text-lg font-bold text-brand-purple-deep mb-3">Bei uns immer inklusive</h3>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2" role="list">
              {INKLUSIVE.map((t) => (
                <li key={t} className="flex gap-2 text-brand-purple-deep/75 text-sm sm:text-base">
                  <Check className="w-5 h-5 text-brand-green flex-shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="flex gap-2 text-xs text-brand-purple-deep/50 max-w-sm">
            <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Richtwerte inkl. MwSt. Der tatsächliche Preis hängt von Heizlast, Gerät, Aufstellort und
            Elektrik ab. Ihr verbindliches Angebot erhalten Sie nach dem Vor-Ort-Termin.
          </p>
        </div>
      </div>
    </section>
  )
}
