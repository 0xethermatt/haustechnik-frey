import { ChevronDown, Check } from 'lucide-react'

const mythen = [
  {
    mythos: 'Im Altbau funktioniert keine Wärmepumpe.',
    fakt: 'Entscheidend ist die Vorlauftemperatur. Bis 55 °C arbeiten moderne Geräte effizient – das schaffen die meisten Altbauten, oft nach Tausch einzelner Heizkörper.',
  },
  {
    mythos: 'Ohne Fußbodenheizung lohnt es sich nicht.',
    fakt: 'Die Mehrheit der Wärmepumpen im Bestand läuft mit normalen Heizkörpern. Wir prüfen raumweise, ob alle Heizflächen ausreichen.',
  },
  {
    mythos: 'Bei Minusgraden heizt sie mit teurem Heizstab.',
    fakt: 'Richtig dimensionierte Geräte heizen bis −20 °C mit dem Kältekreis. Der Heizstab springt nur an wenigen Extremtagen kurz an.',
  },
  {
    mythos: 'Wärmepumpen sind laut.',
    fakt: 'Für die Förderung müssen Geräte die Lärmgrenzwerte um mindestens 10 dB unterschreiten. In wenigen Metern Abstand: etwa so laut wie ein Kühlschrank.',
  },
  {
    mythos: 'Die Stromkosten fressen die Ersparnis auf.',
    fakt: 'Mit einer Jahresarbeitszahl von 3–4 und einem Wärmepumpentarif liegen die Kosten pro kWh Wärme meist unter Öl und Gas – rechnen Sie es im Einsparrechner nach.',
  },
]

export default function WPMythen() {
  return (
    <div className="space-y-2">
      {mythen.map((m) => (
        <details key={m.mythos} className="group rounded-2xl border border-brand-purple/10 bg-white overflow-hidden">
          <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-4 sm:px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span className="font-semibold text-brand-purple-deep">
              <span className="text-red-500 mr-1.5">Mythos:</span>
              {m.mythos}
            </span>
            <ChevronDown className="w-5 h-5 text-brand-purple flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="flex gap-2.5 px-4 sm:px-5 pb-4 text-brand-purple-deep/75 leading-relaxed">
            <Check className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" aria-hidden="true" />
            {m.fakt}
          </p>
        </details>
      ))}
    </div>
  )
}
