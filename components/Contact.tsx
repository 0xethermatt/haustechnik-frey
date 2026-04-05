'use client'

import { motion } from 'framer-motion'
import { Phone, Smartphone, Mail, MapPin, ArrowRight, Clock } from 'lucide-react'

const contactItems = [
  {
    icon: <Phone className="w-5 h-5" />,
    label: 'Telefon',
    value: '07345 3286',
    href: 'tel:+4973453286',
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/15',
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    label: 'Mobil',
    value: '0172 7309901',
    href: 'tel:+491727309901',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/15',
  },
  {
    icon: <Mail className="w-5 h-5" />,
    label: 'E-Mail',
    value: 'info@haustechnik-frey.de',
    href: 'mailto:info@haustechnik-frey.de',
    color: 'text-brand-teal',
    bg: 'bg-brand-teal/15',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: 'Adresse',
    value: 'Schammenstraße 19, 89129 Langenau',
    href: 'https://maps.google.com/?q=Schammenstraße+19+89129+Langenau',
    color: 'text-brand-green',
    bg: 'bg-brand-green/15',
  },
]

export default function Contact() {
  return (
    <section
      id="kontakt"
      className="py-12 sm:py-16 lg:py-24 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #6B2D8B 0%, #4A1D63 100%)',
      }}
      aria-labelledby="kontakt-heading"
    >
      {/* Glow decorations */}
      <div
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(232, 160, 48, 0.12)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(91, 142, 201, 0.15)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Kontakt aufnehmen
          </span>
          <h2
            id="kontakt-heading"
            className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight"
          >
            Projekt im Kopf?{' '}
            <br className="hidden sm:block" />
            Lassen Sie uns reden.
          </h2>
          <p className="mt-5 text-sm sm:text-lg text-white/65 max-w-xl mx-auto leading-relaxed">
            Ob kleine Reparatur oder großes Bauprojekt — wir beraten Sie kostenlos und unverbindlich.
            Rufen Sie einfach an oder schreiben Sie uns.
          </p>
        </motion.div>

        {/* Contact cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          {contactItems.map((item, i) => (
            <motion.a
              key={item.label}
              href={item.href}
              target={item.label === 'Adresse' ? '_blank' : undefined}
              rel={item.label === 'Adresse' ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 + 0.2 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 rounded-2xl p-5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <div className={`${item.bg} ${item.color} p-3 rounded-xl flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-white/50 text-xs font-medium uppercase tracking-wide mb-0.5">
                  {item.label}
                </div>
                <div className="text-white font-semibold text-sm sm:text-base truncate group-hover:text-brand-orange transition-colors duration-200">
                  {item.value}
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Opening hours note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-white/50 text-sm mb-10"
        >
          <Clock className="w-4 h-4" aria-hidden="true" />
          <span>Mo–Sa erreichbar · Notdienst auch am Sonntag</span>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <a
            href="tel:+4973453286"
            className="group inline-flex items-center justify-center gap-3 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-full transition-all duration-200 hover:shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-purple w-full sm:w-auto"
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
            Jetzt anrufen: 07345 3286
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <p className="text-white/40 text-sm mt-4">
            Kostenlos · Unverbindlich · Persönlich
          </p>
        </motion.div>
      </div>
    </section>
  )
}
