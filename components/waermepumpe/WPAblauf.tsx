import { ChevronDown, FileText, Camera, Home } from 'lucide-react'

const schritte = [
  { title: 'Online-Check', dauer: '5 Minuten', text: 'Fragen beantworten, auf Wunsch Fotos hochladen.' },
  { title: 'Rückruf & Vor-Ort-Termin', dauer: 'innerhalb weniger Tage', text: 'Wir prüfen Heizraum, Aufstellort und Elektrik – mit Heizlastberechnung.' },
  { title: 'Angebot mit Förderklausel', dauer: '', text: 'Verbindliches Angebot, gültig nur bei Förderzusage – plus Bestätigung zum Antrag (BzA).' },
  { title: 'KfW-Antrag', dauer: 'Fördersatz ab Antrag gesichert', text: 'Sie beantragen in „Meine KfW“, wir haben alles vorbereitet. Nach der Zusage: 36 Monate Zeit.' },
  { title: 'Einbau durch unser Team', dauer: '3–5 Arbeitstage', text: 'Demontage, Montage, Elektro, hydraulischer Abgleich und Inbetriebnahme.' },
  { title: 'Nachweis & Auszahlung', dauer: '', text: 'Wir liefern die Nachweise, die KfW überweist den Zuschuss auf Ihr Konto.' },
]

const unterlagen = [
  { icon: FileText, text: 'Verbrauch der letzten 2–3 Jahre' },
  { icon: Camera, text: 'Foto vom Typenschild der Heizung' },
  { icon: Camera, text: 'Foto vom Zählerschrank (Tür offen)' },
  { icon: Camera, text: 'Foto vom möglichen Aufstellort' },
  { icon: Home, text: 'Grundrisse – falls vorhanden' },
  { icon: FileText, text: 'Für den Einkommensbonus: Steuerbescheide' },
]

export default function WPAblauf() {
  return (
    <div className="space-y-5">
      <ol className="relative space-y-0" role="list">
        {schritte.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 pb-5 last:pb-0">
            {i < schritte.length - 1 && (
              <span className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-brand-purple/15" aria-hidden="true" />
            )}
            <span className="relative w-9 h-9 rounded-full bg-brand-purple text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            <div className="pt-1.5">
              <p className="font-bold text-brand-purple-deep leading-tight">
                {s.title}
                {s.dauer && <span className="ml-2 text-xs font-semibold text-brand-orange-dark">{s.dauer}</span>}
              </p>
              <p className="text-sm text-brand-purple-deep/65 leading-relaxed mt-1">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl bg-white border-2 border-brand-orange/40 p-4">
        <p className="text-sm text-brand-purple-deep/80 leading-relaxed">
          <strong className="text-brand-purple-deep">Wichtig:</strong> Keinen Vertrag ohne Förderklausel unterschreiben
          und nicht vor dem KfW-Antrag mit dem Einbau beginnen – darauf achten wir bei jedem Projekt.
        </p>
      </div>

      <details className="group rounded-2xl border border-brand-purple/10 bg-white overflow-hidden">
        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 font-semibold text-brand-purple-deep [&::-webkit-details-marker]:hidden">
          Checkliste: Das spart Ihnen einen Termin
          <ChevronDown className="w-5 h-5 text-brand-purple flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="grid sm:grid-cols-2 gap-2 px-5 pb-5" role="list">
          {unterlagen.map((u) => (
            <li key={u.text} className="flex gap-2.5 items-start text-sm text-brand-purple-deep/80">
              <u.icon className="w-4 h-4 text-brand-purple flex-shrink-0 mt-0.5" aria-hidden="true" />
              {u.text}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
