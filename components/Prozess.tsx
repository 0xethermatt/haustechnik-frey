'use client'

import { motion } from 'framer-motion'
import { MessageCircle, ClipboardList, Wrench, CheckCircle2 } from 'lucide-react'

interface Step {
  number: string
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  color: string
  bg: string
  border: string
  numBg: string
}

const steps: Step[] = [
  {
    number: '01',
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Erstberatung',
    subtitle: 'Kostenlos & unverbindlich',
    description:
      'Sie schildern uns Ihr Anliegen — telefonisch, per E-Mail oder vor Ort. Wir hören zu, klären Fragen und zeigen erste Möglichkeiten auf.',
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/10',
    border: 'border-brand-orange/25',
    numBg: 'bg-brand-orange text-white',
  },
  {
    number: '02',
    icon: <ClipboardList className="w-6 h-6" />,
    title: 'Planung & Angebot',
    subtitle: 'Transparent & nachvollziehbar',
    description:
      'Wir planen die optimale Lösung für Ihre Situation und erstellen ein detailliertes, faires Angebot — ohne versteckte Kosten.',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/10',
    border: 'border-brand-blue/25',
    numBg: 'bg-brand-blue text-white',
  },
  {
    number: '03',
    icon: <Wrench className="w-6 h-6" />,
    title: 'Installation',
    subtitle: 'Fachgerecht & sauber',
    description:
      'Unser erfahrenes Team führt alle Arbeiten professionell und termingerecht aus. Wir arbeiten sauber und hinterlassen keine Baustelle.',
    color: 'text-brand-purple',
    bg: 'bg-brand-purple/10',
    border: 'border-brand-purple/25',
    numBg: 'bg-brand-purple text-white',
  },
  {
    number: '04',
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: 'Übergabe & Service',
    subtitle: 'Langfristig an Ihrer Seite',
    description:
      'Nach der Abnahme erklären wir Ihnen alles in Ruhe. Für Wartung, Fragen und Notfälle bleiben wir dauerhaft Ihr Ansprechpartner.',
    color: 'text-brand-green',
    bg: 'bg-brand-green/10',
    border: 'border-brand-green/25',
    numBg: 'bg-brand-green text-white',
  },
]

export default function Prozess() {
  return (
    <section
      id="prozess"
      className="py-12 sm:py-16 lg:py-24 bg-brand-warm overflow-hidden"
      aria-labelledby="prozess-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            So arbeiten wir
          </span>
          <h2
            id="prozess-heading"
            className="text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-brand-purple-deep"
          >
            Ihr Weg zur perfekten Lösung
          </h2>
          <p className="mt-5 text-sm sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Von der ersten Idee bis zur fertigen Anlage — strukturiert, ehrlich und zuverlässig.
            So hat es bei über 500 Projekten funktioniert.
          </p>
        </motion.div>

        {/* Steps — desktop horizontal, mobile vertical */}
        <div className="relative">
          {/* Horizontal connector line (desktop only) */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-px z-0">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.0, delay: 0.3, ease: 'easeOut' }}
              className="w-full h-full origin-left"
              style={{
                background:
                  'repeating-linear-gradient(to right, #D1D5DB 0px, #D1D5DB 8px, transparent 8px, transparent 16px)',
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col items-center lg:items-center text-left lg:text-center"
              >
                {/* Number badge + icon stack */}
                <div className="flex lg:flex-col items-center gap-4 lg:gap-3 mb-5 w-full lg:w-auto">
                  {/* Vertical line for mobile/tablet */}
                  <div className="hidden sm:flex lg:hidden flex-col items-center self-stretch">
                    {i < steps.length - 1 && (
                      <div className="flex-1 w-px bg-gray-200 mt-2 ml-[22px]" />
                    )}
                  </div>

                  {/* Number circle */}
                  <div
                    className={`w-11 h-11 rounded-2xl ${step.numBg} flex items-center justify-center font-serif font-bold text-base flex-shrink-0 shadow-md`}
                  >
                    {step.number}
                  </div>

                  {/* Icon below number (desktop) / beside number (mobile) */}
                  <div
                    className={`${step.bg} ${step.color} p-3 rounded-2xl border ${step.border} hidden lg:flex items-center justify-center`}
                  >
                    {step.icon}
                  </div>
                  <div className={`${step.bg} ${step.color} p-2.5 rounded-xl border ${step.border} lg:hidden`}>
                    {step.icon}
                  </div>
                </div>

                {/* Card */}
                <div
                  className={`bg-white rounded-3xl border-2 ${step.border} shadow-card hover:shadow-card-hover transition-all duration-300 p-6 w-full`}
                >
                  <h3 className="font-serif font-bold text-brand-purple-deep text-xl mb-1">
                    {step.title}
                  </h3>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${step.color} mb-3`}>
                    {step.subtitle}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-14"
        >
          <p className="text-gray-400 text-sm mb-4">
            Bereit für Schritt 1? Es kostet Sie nichts.
          </p>
          <button
            onClick={() =>
              document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-8 py-4 rounded-full transition-all duration-200 hover:shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange w-full sm:w-auto"
          >
            Erstberatung vereinbaren
          </button>
        </motion.div>
      </div>
    </section>
  )
}
