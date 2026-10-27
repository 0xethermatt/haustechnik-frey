import { MessageCircle, Phone, Clock, Sparkles } from 'lucide-react'
import EnergyAdvisorWidget from '@/components/energy-advisor/EnergyAdvisorWidget'
import type { StarterQuestion } from '@/components/energy-advisor/starterQuestions'

const WP_STARTERS: StarterQuestion[] = [
  {
    label: 'Ist mein Haus für eine Wärmepumpe geeignet?',
    message: 'Ist mein Haus für eine Wärmepumpe geeignet? Was muss ich dafür wissen?',
  },
  {
    label: 'Wie viel Förderung bekomme ich?',
    message: 'Wie viel Förderung bekomme ich aktuell für eine Wärmepumpe, wenn ich meine alte Heizung ersetze?',
  },
  {
    label: 'Was kostet der Strom für eine Wärmepumpe?',
    message: 'Mit welchen Stromkosten muss ich bei einer Wärmepumpe ungefähr rechnen?',
  },
  {
    label: 'Brauche ich neue Heizkörper?',
    message: 'Brauche ich für eine Wärmepumpe neue Heizkörper oder eine Fußbodenheizung?',
  },
]

export default function WPKIBerater() {
  return (
    <section
      id="ki-berater"
      className="scroll-mt-32 py-16 sm:py-20 lg:py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #6B2D8B 0%, #4A1D63 100%)' }}
      aria-labelledby="ki-heading"
    >
      <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            KI-Wärmepumpen-Berater
          </span>
          <h2 id="ki-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-5">
            Ihre Frage ist nicht dabei? Einfach fragen.
          </h2>
          <p className="text-base sm:text-lg text-white/70 leading-relaxed mb-6">
            Unser digitaler Berater kennt die aktuellen Förderregeln, typische Kosten und die
            Technik – und beantwortet Ihre Fragen rund um die Uhr. Für ein verbindliches Angebot
            übernimmt dann unser Team.
          </p>
          <ul className="space-y-3 text-white/75" role="list">
            <li className="flex gap-3"><Clock className="w-5 h-5 text-brand-orange flex-shrink-0" aria-hidden="true" />24/7 verfügbar – auch am Wochenende</li>
            <li className="flex gap-3"><MessageCircle className="w-5 h-5 text-brand-orange flex-shrink-0" aria-hidden="true" />Verständliche Antworten ohne Fachchinesisch</li>
            <li className="flex gap-3"><Phone className="w-5 h-5 text-brand-orange flex-shrink-0" aria-hidden="true" />Persönlich erreichbar: 07345 3286</li>
          </ul>
          <p className="text-xs text-white/40 mt-6">
            KI-generierte Antworten können Fehler enthalten und sind keine verbindliche Beratung oder Förderzusage.
            Bitte keine sensiblen persönlichen Daten eingeben.
          </p>
        </div>

        <EnergyAdvisorWidget
          embedded
          title="Wärmepumpen-Berater"
          welcome="Hallo! Ich beantworte Ihre Fragen rund um die Wärmepumpe – von Eignung über Förderung bis Stromkosten. Was möchten Sie wissen?"
          starters={WP_STARTERS}
        />
      </div>
    </section>
  )
}
