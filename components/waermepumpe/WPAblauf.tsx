import { ClipboardList, Phone, Home, FileSignature, BadgeEuro, Wrench, CheckCircle2, FileText, Camera } from 'lucide-react'

const schritte = [
  {
    icon: ClipboardList,
    title: 'Online-Check',
    dauer: '5 Minuten',
    text: 'Sie beantworten ein paar Fragen und laden auf Wunsch Fotos hoch. Damit haben wir alles für eine erste Einschätzung.',
  },
  {
    icon: Phone,
    title: 'Rückruf & Vor-Ort-Termin',
    dauer: 'innerhalb weniger Tage',
    text: 'Wir melden uns, klären offene Fragen und schauen uns Heizraum, Aufstellort und Elektrik an. Mit raumweiser Heizlastberechnung.',
  },
  {
    icon: FileSignature,
    title: 'Angebot mit Förderklausel',
    dauer: '',
    text: 'Sie erhalten ein verbindliches Angebot. Der Vertrag gilt nur bei Förderzusage – plus unsere Bestätigung zum Antrag (BzA).',
  },
  {
    icon: BadgeEuro,
    title: 'KfW-Antrag',
    dauer: 'Zusage meist in wenigen Wochen',
    text: 'Sie stellen den Antrag in „Meine KfW“ – wir haben alle Daten vorbereitet. Ab Antrag ist Ihr Fördersatz gesichert, nach der Zusage haben Sie 36 Monate Zeit für die Umsetzung.',
  },
  {
    icon: Wrench,
    title: 'Einbau durch unser Team',
    dauer: '3–5 Arbeitstage',
    text: 'Demontage der Altanlage, Montage, Elektroanschluss, hydraulischer Abgleich und Inbetriebnahme – alles aus einer Hand.',
  },
  {
    icon: CheckCircle2,
    title: 'Nachweis & Auszahlung',
    dauer: '',
    text: 'Wir liefern Rechnung und Fachunternehmererklärung für die KfW. Der Zuschuss wird direkt auf Ihr Konto überwiesen.',
  },
]

const unterlagen = [
  { icon: FileText, text: 'Verbrauch der letzten 2–3 Jahre (Heizkostenabrechnung, Öl-Lieferscheine)' },
  { icon: Camera, text: 'Foto vom Typenschild der aktuellen Heizung' },
  { icon: Camera, text: 'Foto vom Zählerschrank (Tür offen)' },
  { icon: Camera, text: 'Foto vom möglichen Aufstellort der Außeneinheit' },
  { icon: Home, text: 'Grundrisse oder Baupläne – falls vorhanden' },
  { icon: FileText, text: 'Für den Einkommensbonus: Steuerbescheide der letzten Jahre' },
]

export default function WPAblauf() {
  return (
    <section id="ablauf" className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-brand-warm" aria-labelledby="ablauf-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
            So läuft es ab
          </span>
          <h2 id="ablauf-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight mb-4">
            In 6 Schritten zur geförderten Wärmepumpe
          </h2>
          <p className="text-base sm:text-lg text-brand-purple-deep/70">
            Vom ersten Klick bis zur warmen Stube in der Regel 2–4 Monate – und Sie wissen bei jedem Schritt, was passiert.
          </p>
        </div>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" role="list">
          {schritte.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 sm:block bg-white rounded-3xl p-4 sm:p-6 border border-brand-purple/5 shadow-card">
              <div className="flex items-center gap-3 sm:mb-4 self-start">
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-purple text-white font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <s.icon className="hidden sm:block w-6 h-6 text-brand-orange-dark" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-brand-purple-deep">{s.title}</h3>
                {s.dauer && <p className="text-xs font-semibold text-brand-orange-dark mt-0.5 sm:mt-1">{s.dauer}</p>}
                <p className="text-sm text-brand-purple-deep/65 leading-relaxed mt-1.5 sm:mt-2">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-3xl bg-white border-2 border-brand-orange/40 p-5 sm:p-6">
          <p className="font-bold text-brand-purple-deep mb-1">Wichtig für Ihre Förderung</p>
          <p className="text-sm sm:text-base text-brand-purple-deep/70 leading-relaxed">
            Unterschreiben Sie keinen Vertrag ohne Förderklausel und lassen Sie nicht mit dem Einbau beginnen, bevor der
            KfW-Antrag gestellt ist. Wir achten bei jedem Projekt darauf – damit Ihr Zuschuss sicher ist.
          </p>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-serif font-bold text-brand-purple-deep mb-2">Checkliste: Das spart Ihnen einen Termin</h3>
          <p className="text-brand-purple-deep/60 mb-5">Je mehr wir vorab wissen, desto schneller und genauer wird Ihr Angebot.</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list">
            {unterlagen.map((u) => (
              <li key={u.text} className="flex gap-3 items-start bg-white rounded-2xl px-4 py-3 border border-brand-purple/5">
                <u.icon className="w-5 h-5 text-brand-purple flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm text-brand-purple-deep/80">{u.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
