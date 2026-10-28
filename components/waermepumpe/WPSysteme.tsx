import { Wind, Cpu, Home, Check } from 'lucide-react'

// Wir installieren ausschließlich Luft-Wasser-Wärmepumpen – deshalb kein Systemvergleich
const SCHRITTE = [
  {
    icon: Wind,
    title: 'Außenluft liefert die Energie',
    text: 'Die Außeneinheit zieht Umgebungswärme aus der Luft – selbst bei Minusgraden steckt darin genug Energie.',
  },
  {
    icon: Cpu,
    title: 'Der Verdichter hebt die Temperatur',
    text: 'Mit wenig Strom wird die Wärme auf Heiztemperatur gebracht: aus 1 kWh Strom werden 3–4 kWh Wärme.',
  },
  {
    icon: Home,
    title: 'Wärme für Heizung & Warmwasser',
    text: 'Über Ihre Heizkörper oder Fußbodenheizung – und zusätzlich für warmes Wasser im Speicher.',
  },
]

const VORTEILE = [
  'Keine Bohrung, keine Genehmigung',
  'Einbau in 3–5 Arbeitstagen',
  'Zuverlässig bis −20 °C',
  'Ideal mit Photovoltaik',
  'Voll förderfähig (KfW 458)',
  'Leise Geräte mit Schallplanung',
]

export default function WPSysteme() {
  return (
    <div className="space-y-5">
      <p className="text-brand-purple-deep/70 leading-relaxed">
        Wir setzen auf <strong className="text-brand-purple-deep">Luft-Wasser-Wärmepumpen</strong> – die wirtschaftlichste
        Lösung für fast jedes Bestandsgebäude. So funktioniert sie:
      </p>

      <ol className="grid md:grid-cols-3 gap-3" role="list">
        {SCHRITTE.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-white border border-brand-purple/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-brand-purple text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <s.icon className="w-5 h-5 text-brand-orange-dark" aria-hidden="true" />
            </div>
            <h4 className="font-bold text-brand-purple-deep mb-1">{s.title}</h4>
            <p className="text-sm text-brand-purple-deep/65 leading-relaxed">{s.text}</p>
          </li>
        ))}
      </ol>

      <div>
        <p className="text-sm font-semibold text-brand-purple-deep mb-2">Warum Luft-Wasser?</p>
        <ul className="flex flex-wrap gap-2" role="list">
          {VORTEILE.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-xs sm:text-sm text-brand-purple-deep/80 bg-white rounded-full px-3 py-1.5 border border-brand-purple/10">
              <Check className="w-4 h-4 text-brand-green flex-shrink-0" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-brand-purple-deep/70 leading-relaxed bg-white rounded-2xl border border-brand-purple/10 p-4">
        <strong className="text-brand-purple-deep">Jahresarbeitszahl (JAZ):</strong> So viel Wärme entsteht pro kWh Strom
        übers Jahr. Für die Förderung braucht es mindestens 3,0 – das stellen wir mit Heizlastberechnung, hydraulischem
        Abgleich und optimaler Heizkurve sicher.
      </p>
    </div>
  )
}
