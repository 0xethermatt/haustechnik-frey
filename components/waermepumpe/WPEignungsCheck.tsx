'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, AlertCircle, RotateCcw, Lightbulb } from 'lucide-react'
import { scrollToId, useWP, type EignungsErgebnis } from './WPContext'

interface Answer {
  label: string
  points: number
  tip?: string
  set?: Partial<EignungsErgebnis>
}

interface Question {
  id: string
  question: string
  help: string
  answers: Answer[]
}

const QUESTIONS: Question[] = [
  {
    id: 'daemmung',
    question: 'Wie ist der energetische Zustand Ihres Hauses?',
    help: 'Baujahr und durchgeführte Sanierungen bestimmen, wie viel Wärme Ihr Haus braucht.',
    answers: [
      { label: 'Neubau / ab 2010', points: 3 },
      { label: 'Älter, aber teilweise saniert (Fenster, Dach …)', points: 2 },
      { label: 'Älter und weitgehend unsaniert', points: 1, tip: 'Mit einer raumweisen Heizlastberechnung prüfen wir, ob einzelne Maßnahmen (z. B. Heizkörpertausch) sinnvoll sind.' },
    ],
  },
  {
    id: 'verteilung',
    question: 'Wie wird bei Ihnen die Wärme verteilt?',
    help: 'Große Heizflächen ermöglichen niedrige Vorlauftemperaturen – das macht die Wärmepumpe effizient.',
    answers: [
      { label: 'Fußbodenheizung', points: 3, set: { waermeverteilung: 'fbh' } },
      { label: 'Fußbodenheizung + Heizkörper', points: 2.5, set: { waermeverteilung: 'gemischt' } },
      { label: 'Heizkörper', points: 2, set: { waermeverteilung: 'heizkoerper' }, tip: 'Heizkörper sind kein Problem – oft reicht es, 1–3 zu kleine Heizkörper zu tauschen.' },
    ],
  },
  {
    id: 'vorlauf',
    question: 'Wird Ihr Haus im Winter auch mit max. 55 °C Vorlauftemperatur warm?',
    help: 'Tipp: Am Heizungsregler die Vorlauftemperatur an kalten Tagen ablesen oder testweise absenken.',
    answers: [
      { label: 'Ja, problemlos', points: 3, set: { vorlauf: 'bis45' } },
      { label: 'Weiß ich nicht', points: 2, set: { vorlauf: 'unbekannt' }, tip: 'Kein Problem – das messen wir beim Vor-Ort-Termin.' },
      { label: 'Nein, wir brauchen mehr', points: 1, set: { vorlauf: 'ueber55' }, tip: 'Hohe Vorlauftemperaturen lassen sich oft schon mit hydraulischem Abgleich und einzelnen größeren Heizkörpern senken.' },
    ],
  },
  {
    id: 'platz',
    question: 'Gibt es draußen Platz für die Außeneinheit?',
    help: 'Die Außeneinheit ist etwa so groß wie eine Kühl-Gefrier-Kombination und braucht einen festen Untergrund.',
    answers: [
      { label: 'Ja, mit mehr als 3 m Abstand zum Nachbarn', points: 3, set: { nachbarabstand: 'gross' } },
      { label: 'Ja, aber eher eng', points: 2, set: { nachbarabstand: 'klein' }, tip: 'Bei engen Verhältnissen planen wir den Aufstellort mit Schallberechnung – moderne Geräte sind sehr leise.' },
      { label: 'Unklar', points: 2, set: { nachbarabstand: 'unklar' } },
    ],
  },
]

const MAX = QUESTIONS.length * 3

function bewertung(score: number): { label: string; text: string; tone: 'green' | 'orange' } {
  const pct = score / MAX
  if (pct >= 0.8)
    return {
      label: 'Sehr gut geeignet',
      text: 'Ihr Haus bringt ideale Voraussetzungen mit. Eine Wärmepumpe wird hier sehr effizient arbeiten.',
      tone: 'green',
    }
  if (pct >= 0.6)
    return {
      label: 'Gut geeignet',
      text: 'Ihr Haus ist gut geeignet. Mit einer sauberen Planung arbeitet die Wärmepumpe wirtschaftlich.',
      tone: 'green',
    }
  return {
    label: 'Geeignet mit Planung',
    text: 'Eine Wärmepumpe ist möglich – wichtig ist eine sorgfältige Heizlastberechnung. Genau das übernehmen wir für Sie.',
    tone: 'orange',
  }
}

export default function WPEignungsCheck() {
  const { setEignung } = useWP()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])

  const done = step >= QUESTIONS.length
  const score = answers.reduce((s, a) => s + a.points, 0)
  const result = bewertung(score)
  const tips = answers.map((a) => a.tip).filter(Boolean) as string[]

  const choose = (a: Answer) => {
    const next = [...answers.slice(0, step), a]
    setAnswers(next)
    setStep(step + 1)
    if (next.length === QUESTIONS.length) {
      const total = next.reduce((s, x) => s + x.points, 0)
      setEignung({
        label: bewertung(total).label,
        score: Math.round((total / MAX) * 100),
        ...Object.assign({}, ...next.map((x) => x.set ?? {})),
      })
    }
  }

  const reset = () => {
    setStep(0)
    setAnswers([])
  }

  const q = QUESTIONS[Math.min(step, QUESTIONS.length - 1)]

  return (
    <section id="eignung" className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-brand-cream" aria-labelledby="eignung-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-start">
        <div>
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Eignungs-Check
          </span>
          <h2 id="eignung-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight mb-5">
            Passt eine Wärmepumpe zu meinem Haus?
          </h2>
          <p className="text-base sm:text-lg text-brand-purple-deep/70 leading-relaxed mb-6">
            Die kurze Antwort: in den allermeisten Fällen ja – auch im Altbau und mit Heizkörpern.
            Vier Fragen, 30 Sekunden, und Sie wissen, wo Sie stehen.
          </p>
          <ul className="space-y-3" role="list">
            {[
              'Feldtests (u. a. Fraunhofer ISE) zeigen: Wärmepumpen arbeiten auch im Bestand effizient',
              'Heizkörper reichen meist aus – Fußbodenheizung ist kein Muss',
              'Entscheidend ist die Vorlauftemperatur, nicht das Baujahr',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-brand-purple-deep/80">
                <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-3xl shadow-card border border-brand-purple/5 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-brand-purple/10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-purple-deep/50">
              {done ? 'Ihr Ergebnis' : `Frage ${step + 1} von ${QUESTIONS.length}`}
            </span>
            {step > 0 && (
              <button onClick={reset} className="text-xs text-brand-purple-deep/50 hover:text-brand-purple flex items-center gap-1">
                <RotateCcw className="w-3 h-3" aria-hidden="true" /> Neu starten
              </button>
            )}
          </div>
          <div className="h-1 bg-brand-warm">
            <motion.div
              className="h-full bg-brand-orange"
              animate={{ width: `${(Math.min(step, QUESTIONS.length) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6 sm:p-8 min-h-[340px]">
            <AnimatePresence mode="wait">
              {!done ? (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-brand-purple-deep mb-2">{q.question}</h3>
                  <p className="text-sm text-brand-purple-deep/55 mb-6">{q.help}</p>
                  <div className="flex flex-col gap-3">
                    {q.answers.map((a) => (
                      <button
                        key={a.label}
                        onClick={() => choose(a)}
                        className="group flex items-center justify-between gap-3 text-left px-5 py-4 rounded-2xl border-2 border-brand-purple/10 hover:border-brand-orange hover:bg-brand-orange/5 transition-all font-semibold text-brand-purple-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                      >
                        {a.label}
                        <ArrowRight className="w-4 h-4 text-brand-purple-deep/30 group-hover:text-brand-orange flex-shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${
                        result.tone === 'green' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-orange/15 text-brand-orange-dark'
                      }`}
                    >
                      {Math.round((score / MAX) * 100)}%
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-purple-deep/50">Eignung</p>
                      <p className="text-2xl font-serif font-bold text-brand-purple-deep">{result.label}</p>
                    </div>
                  </div>
                  <p className="text-brand-purple-deep/75 leading-relaxed mb-5">{result.text}</p>

                  {tips.length > 0 && (
                    <div className="bg-brand-warm rounded-2xl p-4 mb-6 space-y-2">
                      {tips.map((t) => (
                        <p key={t} className="flex gap-2 text-sm text-brand-purple-deep/75">
                          <Lightbulb className="w-4 h-4 text-brand-orange-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
                          {t}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => scrollToId('foerderrechner')}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold px-5 py-3.5 rounded-full transition-colors"
                    >
                      Weiter: Förderung berechnen
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => scrollToId('anfrage')}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold px-5 py-3.5 rounded-full transition-colors"
                    >
                      Kostenlos prüfen lassen
                    </button>
                  </div>
                  {result.tone === 'orange' && (
                    <p className="flex gap-2 text-xs text-brand-purple-deep/50 mt-4">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      Der Schnell-Check ersetzt keine Heizlastberechnung – diese erstellen wir beim Vor-Ort-Termin.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
