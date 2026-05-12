'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react'

const heroImages = [
  {
    src: '/images/bad-2.jpg',
    alt: 'Badsanierung Langenau — Haustechnik Frey',
    rotate: '2deg',
    zIndex: 'z-30',
  },
  {
    src: '/images/heizraum-1.jpg',
    alt: 'Heizungsanlage Langenau — Haustechnik Frey',
    rotate: '-3deg',
    zIndex: 'z-20',
  },
  {
    src: '/images/solar-3.jpg',
    alt: 'Solarthermie Langenau — Haustechnik Frey',
    rotate: '1deg',
    zIndex: 'z-10',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function Hero() {
  const scrollToLeistungen = () => {
    document.getElementById('leistungen')?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToKontakt = () => {
    document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex items-start overflow-hidden"
      aria-label="Hero — Haustechnik Andreas Frey"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/heizraum-2.jpg"
          alt="Heizraum — Haustechnik Andreas Frey Langenau"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      {/* Lila Gradient Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(135deg, rgba(45,17,64,0.96) 0%, rgba(107,45,139,0.85) 60%, rgba(74,29,99,0.80) 100%)',
        }}
      />

      {/* Decorative circles */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-orange/5 blur-3xl z-10 pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-brand-blue/8 blur-3xl z-10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16 sm:pt-40 sm:pb-24 lg:pt-48 lg:pb-32 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-full">
                <ShieldCheck className="w-4 h-4 text-brand-orange flex-shrink-0" aria-hidden="true" />
                <span>Seit über 30 Jahren selbständig · Meisterbetrieb</span>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white leading-[1.1] text-balance"
            >
              Ihr Partner für{' '}
              <span className="text-brand-orange">Wärme</span>{' '}
              und{' '}
              <span className="text-brand-blue">Wasser</span>{' '}
              in Langenau & Umgebung
            </motion.h1>

            {/* Subline */}
            <motion.p
              variants={itemVariants}
              className="text-sm sm:text-lg text-white/75 leading-relaxed max-w-xl"
            >
              Heizung, Sanitär, Lüftung und Solar aus einer Hand — persönlich, zuverlässig und
              regional. Faire Preise, pünktliche Ausführung, saubere Arbeit.
            </motion.p>

            {/* Services Tags */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
              {[
                { label: 'Heizung', color: 'bg-brand-orange/20 text-brand-orange border-brand-orange/30' },
                { label: 'Sanitär', color: 'bg-brand-blue/20 text-brand-blue border-brand-blue/30' },
                { label: 'Lüftung', color: 'bg-brand-teal/20 text-brand-teal border-brand-teal/30' },
                { label: 'Solar', color: 'bg-brand-green/20 text-brand-green border-brand-green/30' },
                { label: 'Kundendienst', color: 'bg-white/20 text-white border-white/40' },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${tag.color}`}
                >
                  {tag.label}
                </span>
              ))}
              <Link
                href="https://bad.haustechnik-frey.de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50 transition-colors duration-200"
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                KI-Badplaner
              </Link>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <button
                onClick={scrollToKontakt}
                className="group flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-7 py-4 rounded-full transition-all duration-200 hover:shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 w-full sm:w-auto"
              >
                Projekt besprechen
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <button
                onClick={scrollToLeistungen}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold px-7 py-4 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white w-full sm:w-auto"
              >
                Unsere Leistungen
              </button>
            </motion.div>

          </motion.div>

          {/* Right: Image stack */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="hidden lg:flex relative justify-center items-center h-[480px]"
          >
            {heroImages.map((img, i) => (
              <motion.div
                key={img.src}
                initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: img.rotate,
                  x: i === 0 ? 40 : i === 1 ? -20 : 0,
                  y: i === 0 ? -60 : i === 1 ? 20 : 60,
                }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
                whileHover={{ scale: 1.05, rotate: '0deg', zIndex: 40 }}
                className={`absolute w-56 h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 ${img.zIndex} cursor-pointer`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="224px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/40 to-transparent" />
              </motion.div>
            ))}

            {/* Floating label */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="absolute bottom-4 right-4 z-40 bg-white rounded-2xl shadow-card px-4 py-3"
            >
              <div className="text-xs text-gray-500 font-medium">Aktuelle Projekte</div>
              <div className="text-sm font-bold text-brand-purple-deep mt-0.5">Langenau & Umgebung</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
