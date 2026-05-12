'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Flame, Droplets, Wind, Sun, Wrench, Sparkles, Check, ArrowRight } from 'lucide-react'

interface Service {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgLight: string
  borderColor: string
  tagColor: string
  image: string
  imageAlt: string
  description: string
  items: string[]
  subPageHref?: string
}

const services: Service[] = [
  {
    id: 'heizung',
    title: 'Heizung',
    icon: <Flame className="w-6 h-6" />,
    color: 'text-brand-orange',
    bgLight: 'bg-brand-orange/10',
    borderColor: 'hover:border-brand-orange',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/pellets-2.jpg',
    imageAlt: 'Heizungsanlage — Haustechnik Frey Langenau',
    description:
      'Von der modernen Wärmepumpe bis zur Pelletheizung — wir planen, installieren und warten Ihre Heizungsanlage fachgerecht.',
    items: [
      'Pelletheizungen',
      'Wärmepumpen',
      'Gasheizungen',
      'Fußbodenheizung',
      'Wartung & Reparatur',
    ],
    subPageHref: '/leistungen/heizung',
  },
  {
    id: 'sanitaer',
    title: 'Sanitär',
    icon: <Droplets className="w-6 h-6" />,
    color: 'text-brand-blue',
    bgLight: 'bg-brand-blue/10',
    borderColor: 'hover:border-brand-blue',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-5.jpeg',
    imageAlt: 'Modernes Badezimmer — Badsanierung Langenau',
    description:
      'Vom Traumbad bis zur barrierefreien Nasszelle — wir gestalten Ihr Bad so wie Sie es sich vorstellen.',
    items: [
      'Badsanierung',
      'Barrierefreie Bäder',
      'Wasserhygiene',
      'Rohrinstallation',
      'Armaturen & Keramik',
    ],
    subPageHref: '/leistungen/sanitaer',
  },
  {
    id: 'lueftung',
    title: 'Lüftung',
    icon: <Wind className="w-6 h-6" />,
    color: 'text-brand-teal',
    bgLight: 'bg-brand-teal/10',
    borderColor: 'hover:border-brand-teal',
    tagColor: 'bg-brand-teal text-white',
    image: '/images/lueftung-1.jpeg',
    imageAlt: 'Lüftungsanlage — Haustechnik Frey Langenau',
    description:
      'Frische Luft und niedrige Heizkosten durch moderne Wohnraumlüftung mit Wärmerückgewinnung.',
    items: [
      'Wohnraumlüftung',
      'Lüftungsanlagen',
      'Wärmerückgewinnung',
      'Energieoptimierung',
      'Wartung',
    ],
  },
  {
    id: 'solar',
    title: 'Solar',
    icon: <Sun className="w-6 h-6" />,
    color: 'text-brand-green',
    bgLight: 'bg-brand-green/10',
    borderColor: 'hover:border-brand-green',
    tagColor: 'bg-brand-green text-white',
    image: '/images/solar-2.jpg',
    imageAlt: 'Solarthermie auf Hausdach — Haustechnik Frey Langenau',
    description:
      'Nutzen Sie die Sonnenenergie für Warmwasser und Heizungsunterstützung — kostenlos und klimaneutral.',
    items: [
      'Solarthermie',
      'Warmwasser-Solar',
      'Heizungsunterstützung',
      'Beratung & Planung',
      'Wartung',
    ],
  },
  {
    id: 'kundendienst',
    title: 'Kundendienst',
    icon: <Wrench className="w-6 h-6" />,
    color: 'text-brand-purple',
    bgLight: 'bg-brand-purple/10',
    borderColor: 'hover:border-brand-purple',
    tagColor: 'bg-brand-purple text-white',
    image: '/images/kundendienst-1.jpeg',
    imageAlt: 'Haustechnik Frey — Kundendienst Langenau',
    description:
      'Schnelle Hilfe wenn es darauf ankommt — 24/6 erreichbar für Notfälle und planbare Wartungen.',
    items: [
      'Notdienst',
      'Wartungsverträge',
      'Reparaturen',
      'Beratung',
      'Ersatzteile',
    ],
  },
  {
    id: 'ki-badplaner',
    title: 'KI-Badplaner',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-brand-purple-deep',
    bgLight: 'bg-brand-purple-deep/10',
    borderColor: 'hover:border-brand-purple-deep',
    tagColor: 'bg-gradient-to-r from-brand-purple to-brand-purple-deep text-white',
    image: '/images/bad-3.jpg',
    imageAlt: 'KI-Badplaner — Haustechnik Frey Langenau',
    description:
      'Gestalten Sie Ihr Traumbad mit KI-Unterstützung: Stil wählen, Beschreibung eingeben, Visualisierung erhalten — in Sekunden.',
    items: [
      'KI-Badvisualisierung',
      'Stilauswahl (modern, warm, dunkel)',
      'Sofortige Ergebnisse',
      'Kostenlos & unverbindlich',
      'Direkt anfragen',
    ],
    subPageHref: 'https://bad.haustechnik-frey.de',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function Services() {
  return (
    <section
      id="leistungen"
      className="py-12 sm:py-16 lg:py-24 bg-brand-warm"
      aria-labelledby="leistungen-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Was wir für Sie tun
          </span>
          <h2
            id="leistungen-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep leading-tight"
          >
            Unsere Leistungen
          </h2>
          <p className="mt-5 text-sm sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Als Meisterbetrieb bieten wir das gesamte Spektrum der Haustechnik — von der Planung
            bis zur Wartung, alles aus einer Hand.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service, i) => (
            <motion.article
              key={service.id}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`group bg-white rounded-3xl overflow-hidden shadow-card transition-all duration-300 border-2 border-transparent ${service.borderColor} hover:shadow-card-hover flex flex-col ${
                i === 3 ? 'sm:col-start-1 lg:col-start-auto' : ''
              } ${i >= 3 && services.length === 5 ? 'lg:col-span-1' : ''}`}
              aria-label={`Leistung: ${service.title}`}
            >
              {/* Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/50 to-transparent"
                  aria-hidden="true"
                />
                {/* Tag */}
                <span
                  className={`absolute top-4 left-4 ${service.tagColor} text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}
                >
                  {service.title}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5 sm:p-6 gap-4">
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div className={`${service.bgLight} ${service.color} p-2.5 rounded-xl`}>
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brand-purple-deep">
                    {service.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>

                {/* Services List */}
                <ul className="flex flex-col gap-1.5 mt-auto" role="list">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className={`w-4 h-4 flex-shrink-0 ${service.color}`} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Sub-page link */}
                {service.subPageHref && (
                  <Link
                    href={service.subPageHref}
                    target={service.subPageHref.startsWith('https') ? '_blank' : undefined}
                    rel={service.subPageHref.startsWith('https') ? 'noopener noreferrer' : undefined}
                    className={`text-sm font-semibold ${service.color} flex items-center gap-1 hover:gap-2 transition-all mt-2`}
                  >
                    Mehr erfahren
                    <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 mb-4">
            Nicht sicher welche Lösung die richtige für Sie ist?
          </p>
          <button
            onClick={() =>
              document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 hover:shadow-purple-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple w-full sm:w-auto"
          >
            Kostenlos beraten lassen
          </button>
        </motion.div>
      </div>
    </section>
  )
}
