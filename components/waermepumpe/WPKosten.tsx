'use client'

import { ArrowRight, BadgeEuro, Check, Gauge, Home, Plug, MapPin } from 'lucide-react'
import { scrollToId } from './WPContext'

// Bewusst ohne Preisliste: Die Kosten sind bei jedem Haus anders
const FAKTOREN = [
  { icon: Gauge, title: 'Heizlast des Hauses', text: 'Größe, Baujahr und Dämmung bestimmen die nötige Leistung.' },
  { icon: Home, title: 'Heizkörper & Heizraum', text: 'Ob Heizflächen passen und wie viel Umbau nötig ist.' },
  { icon: MapPin, title: 'Aufstellort', text: 'Wege nach draußen, Fundament und Schallschutz.' },
  { icon: Plug, title: 'Elektrik', text: 'Zustand von Zählerschrank und Hausanschluss.' },
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
  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-brand-purple-deep text-white p-5 sm:p-6">
        <p className="text-lg sm:text-xl font-serif font-bold leading-snug">
          Jedes Haus ist anders – deshalb gibt es bei uns keinen Pauschalpreis, sondern ein ehrliches Angebot nach dem
          Vor-Ort-Termin.
        </p>
        <p className="text-sm text-white/65 mt-2 leading-relaxed">
          Wie viel davon die KfW übernimmt, können Sie schon jetzt im Förderrechner sehen – bis zu 80 % der
          förderfähigen Kosten.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-brand-purple-deep mb-3">Davon hängt der Preis ab</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {FAKTOREN.map((f) => (
            <div key={f.title} className="flex gap-3 bg-white rounded-2xl p-4 border border-brand-purple/10">
              <f.icon className="w-5 h-5 text-brand-purple flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-brand-purple-deep text-sm">{f.title}</p>
                <p className="text-sm text-brand-purple-deep/60 mt-0.5">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <button
          onClick={() => scrollToId('anfrage')}
          className="inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-6 py-3.5 rounded-full transition-colors"
        >
          Persönliches Angebot anfordern
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => scrollToId('foerderrechner')}
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-brand-warm text-brand-purple-deep font-semibold px-6 py-3.5 rounded-full border border-brand-purple/15 transition-colors"
        >
          <BadgeEuro className="w-4 h-4" aria-hidden="true" />
          Zuschuss berechnen
        </button>
      </div>
    </div>
  )
}
