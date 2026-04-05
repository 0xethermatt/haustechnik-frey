'use client'

import { motion } from 'framer-motion'
import { Phone, Clock, Shield, Star, CheckCircle, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Basis',
    price: '149 € / Jahr',
    icon: <Shield className="w-6 h-6" />,
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/15',
    border: 'border-brand-blue/30',
    highlight: false,
    items: [
      'Jährliche Inspektion',
      'Bevorzugte Terminplanung',
      '10 % Rabatt auf Ersatzteile',
    ],
  },
  {
    name: 'Komfort',
    price: '249 € / Jahr',
    icon: <Star className="w-6 h-6" />,
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/15',
    border: 'border-brand-orange/50',
    highlight: true,
    items: [
      'Alles aus Basis',
      '2x Inspektion pro Jahr',
      '24 h Reaktionszeit',
      '15 % Rabatt auf Ersatzteile',
    ],
  },
  {
    name: 'Premium',
    price: '399 € / Jahr',
    icon: <Zap className="w-6 h-6" />,
    color: 'text-brand-green',
    bg: 'bg-brand-green/15',
    border: 'border-brand-green/30',
    highlight: false,
    items: [
      'Alles aus Komfort',
      'Unbegrenzte Einsätze',
      '4 h Reaktionszeit',
      '20 % Rabatt auf Ersatzteile',
      'Persönlicher Ansprechpartner',
    ],
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

export default function Notdienst() {
  return (
    <section
      id="notdienst"
      className="py-24 sm:py-32 bg-brand-purple-deep relative overflow-hidden"
      aria-labelledby="notdienst-heading"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Top: Hero callout ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-brand-orange/20 border border-brand-orange/40 text-brand-orange font-semibold text-sm px-5 py-2 rounded-full mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            Immer erreichbar
          </motion.div>

          {/* Headline */}
          <h2
            id="notdienst-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6"
          >
            24/6 Notdienst
          </h2>

          {/* Phone badge */}
          <motion.a
            href="tel:0734522661"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-3 bg-white/10 border border-white/20 text-white font-bold text-2xl sm:text-3xl px-8 py-4 rounded-2xl mb-8 hover:bg-white/15 transition-colors duration-200"
            aria-label="Notdienst anrufen: 07345 / 22661"
          >
            <Phone className="w-7 h-7 text-brand-orange flex-shrink-0" aria-hidden="true" />
            07345 / 22661
          </motion.a>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            Heizungsausfall? Rohrbruch?{' '}
            <span className="text-brand-orange font-semibold">Wir sind für Sie da.</span>
          </p>

          {/* CTA */}
          <motion.a
            href="tel:0734522661"
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(232, 160, 48, 0.45)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-lg px-10 py-4 rounded-full transition-colors duration-200 shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-purple-deep"
            aria-label="Jetzt Notdienst anrufen"
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
            Jetzt anrufen
          </motion.a>

          {/* Reassurance row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-orange" />
              Montag – Samstag erreichbar
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-brand-orange" />
              Schnelle Reaktionszeiten
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-brand-orange" />
              Meisterbetrieb seit 1994
            </span>
          </div>
        </motion.div>

        {/* ── Bottom: Wartungsverträge ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Vorsorge lohnt sich
          </span>
          <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
            Wartungsverträge
          </h3>
          <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
            Schützen Sie Ihre Heizungsanlage mit einem unserer Wartungsverträge und profitieren
            Sie von bevorzugten Reaktionszeiten und attraktiven Rabatten.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`relative flex flex-col rounded-3xl border-2 ${plan.border} p-8 transition-all duration-300 ${
                plan.highlight
                  ? 'bg-white/10 shadow-orange-glow'
                  : 'bg-white/5 hover:bg-white/8'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-orange text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  Beliebteste Wahl
                </div>
              )}

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`${plan.bg} ${plan.color} w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  {plan.icon}
                </div>
                <h4 className="text-xl font-serif font-bold text-white">{plan.name}</h4>
              </div>

              {/* Price */}
              <div className={`text-3xl font-serif font-bold mb-6 ${plan.color}`}>
                {plan.price}
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 mb-8 flex-1" role="list">
                {plan.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.color}`} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href="tel:0734522661"
                className={`block text-center font-semibold text-sm py-3 px-6 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                  plan.highlight
                    ? 'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-orange-glow hover:shadow-none'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
                aria-label={`${plan.name}-Paket anfragen`}
              >
                Paket anfragen
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
