import { Check, ChevronDown, Info } from 'lucide-react'
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
  'Vor-Ort-Termin & Heizlastberechnung',
  'Angebot mit Förderklausel',
  'Bestätigung zum Antrag (BzA)',
  'Hydraulischer Abgleich',
  'Einweisung & Heizkurven-Optimierung',
  'Nachweise für die Auszahlung',
]

export default function WPKosten() {
  const summeVon = POSITIONEN.filter((p) => !p.optional).reduce((s, p) => s + p.von, 0)
  const summeBis = POSITIONEN.filter((p) => !p.optional).reduce((s, p) => s + p.bis, 0)

  const beispielInvest = 32000
  const beispiele = [
    {
      title: 'Öl, Einkommen über 50.000 €',
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
    <div className="space-y-5">
      <div className="rounded-3xl bg-brand-purple-deep text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">Luft-Wasser-WP im Einfamilienhaus</p>
          <p className="text-2xl sm:text-3xl font-serif font-bold mt-1">
            {formatEuro(summeVon)} – {formatEuro(summeBis)}
          </p>
        </div>
        <p className="text-sm text-white/60">vor Förderung, inkl. Einbau &amp; MwSt.</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-brand-purple-deep mb-3">
          Was Sie nach Förderung zahlen (Beispiel: {formatEuro(beispielInvest)} Investition)
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {beispiele.map((b) => (
            <div key={b.title} className="bg-white rounded-2xl p-4 border border-brand-purple/10">
              <p className="text-sm font-semibold text-brand-purple-deep mb-2">{b.title}</p>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-brand-purple-deep/50">Zuschuss {b.r.satzSelbstgenutzt} %</p>
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

      <details className="group rounded-2xl border border-brand-purple/10 bg-white overflow-hidden">
        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 font-semibold text-brand-purple-deep [&::-webkit-details-marker]:hidden">
          Einzelpositionen anzeigen
          <ChevronDown className="w-5 h-5 text-brand-purple transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <table className="w-full text-sm">
          <caption className="sr-only">Kostenpositionen einer Luft-Wasser-Wärmepumpe</caption>
          <tbody className="divide-y divide-brand-purple/10 border-t border-brand-purple/10">
            {POSITIONEN.map((p) => (
              <tr key={p.label} className={p.optional ? 'text-brand-purple-deep/55' : 'text-brand-purple-deep'}>
                <td className="px-5 py-3">{p.label}</td>
                <td className="px-5 py-3 text-right whitespace-nowrap font-semibold">
                  {formatEuro(p.von)} – {formatEuro(p.bis)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <div>
        <p className="text-sm font-semibold text-brand-purple-deep mb-2">Bei uns immer inklusive</p>
        <ul className="flex flex-wrap gap-2" role="list">
          {INKLUSIVE.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-xs sm:text-sm text-brand-purple-deep/80 bg-white rounded-full px-3 py-1.5 border border-brand-purple/10">
              <Check className="w-4 h-4 text-brand-green flex-shrink-0" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <p className="flex gap-2 text-xs text-brand-purple-deep/50">
        <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        Richtwerte. Der tatsächliche Preis hängt von Heizlast, Gerät, Aufstellort und Elektrik ab – Ihr
        verbindliches Angebot erhalten Sie nach dem Vor-Ort-Termin.
      </p>
    </div>
  )
}
