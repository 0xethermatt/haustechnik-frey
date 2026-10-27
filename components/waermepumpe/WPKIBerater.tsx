'use client'

import { useState } from 'react'
import { MessageCircle, Sparkles } from 'lucide-react'
import EnergyAdvisorWidget from '@/components/energy-advisor/EnergyAdvisorWidget'
import type { StarterQuestion } from '@/components/energy-advisor/starterQuestions'

const WP_STARTERS: StarterQuestion[] = [
  {
    label: 'Ist mein Haus geeignet?',
    message: 'Ist mein Haus für eine Wärmepumpe geeignet? Was muss ich dafür wissen?',
  },
  {
    label: 'Wie viel Förderung bekomme ich?',
    message: 'Wie viel Förderung bekomme ich aktuell für eine Wärmepumpe, wenn ich meine alte Heizung ersetze?',
  },
  {
    label: 'Was kostet der Strom?',
    message: 'Mit welchen Stromkosten muss ich bei einer Wärmepumpe ungefähr rechnen?',
  },
  {
    label: 'Brauche ich neue Heizkörper?',
    message: 'Brauche ich für eine Wärmepumpe neue Heizkörper oder eine Fußbodenheizung?',
  },
]

export default function WPKIBerater() {
  const [open, setOpen] = useState(false)
  const [initial, setInitial] = useState<string | undefined>()

  const start = (message?: string) => {
    setInitial(message)
    setOpen(true)
  }

  return (
    <section
      id="ki-berater"
      className="scroll-mt-32 py-14 sm:py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #6B2D8B 0%, #4A1D63 100%)' }}
      aria-labelledby="ki-heading"
    >
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 text-brand-orange font-semibold text-sm tracking-widest uppercase mb-3">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            KI-Wärmepumpen-Berater
          </span>
          <h2 id="ki-heading" className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Noch eine Frage? Einfach fragen – rund um die Uhr.
          </h2>
        </div>

        {open ? (
          <EnergyAdvisorWidget
            embedded
            title="Wärmepumpen-Berater"
            welcome="Hallo! Ich beantworte Ihre Fragen rund um die Wärmepumpe – von Eignung über Förderung bis Stromkosten. Was möchten Sie wissen?"
            starters={WP_STARTERS}
            initialMessage={initial}
          />
        ) : (
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-wrap gap-2 mb-4">
              {WP_STARTERS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => start(q.message)}
                  className="text-sm px-4 py-2.5 rounded-full border border-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white transition-colors font-medium"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => start()}
              className="w-full flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold px-5 py-3.5 rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              Eigene Frage stellen
            </button>
          </div>
        )}

        <p className="text-xs text-white/45 text-center mt-4">
          KI-Antworten können Fehler enthalten und sind keine verbindliche Beratung oder Förderzusage. Bitte keine
          sensiblen persönlichen Daten eingeben.
        </p>
      </div>
    </section>
  )
}
