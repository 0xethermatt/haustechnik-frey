'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Heart, Star, MapPin, Shield } from 'lucide-react'

const values = [
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Persönlich',
    description: 'Sie haben immer einen direkten Ansprechpartner — Andreas Frey selbst.',
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/15',
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: 'Erfahren',
    description: 'Über 30 Jahre handwerkliche Erfahrung und kontinuierliche Weiterbildung.',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/15',
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    title: 'Regional',
    description: 'Verwurzelt in Langenau — kurze Wege, schnelle Reaktionszeiten.',
    color: 'text-brand-green',
    bg: 'bg-brand-green/15',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Zuverlässig',
    description: 'Termin ist Termin. Preis ist Preis. Ohne versteckte Kosten.',
    color: 'text-brand-teal',
    bg: 'bg-brand-teal/15',
  },
]

export default function About() {
  return (
    <section
      id="ueber-uns"
      className="py-12 sm:py-16 lg:py-24 bg-brand-purple-deep relative overflow-hidden"
      aria-labelledby="ueber-uns-heading"
    >
      {/* Decorative blur blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-8"
          >
            <div>
              <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
                Über uns
              </span>
              <h2
                id="ueber-uns-heading"
                className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight"
              >
                Handwerk mit{' '}
                <span className="text-brand-orange">Leidenschaft</span>{' '}
                und Herz
              </h2>
            </div>

            <div className="flex flex-col gap-4 text-white/70 leading-relaxed text-sm sm:text-[1.05rem]">
              <p>
                Andreas Frey ist seit{' '}
                <span className="text-brand-orange font-semibold">über 30 Jahren selbständig</span>{' '}
                und hat seinen Betrieb aus eigener Kraft aufgebaut. Was klein anfing, ist heute ein{' '}
                <span className="text-brand-orange font-semibold">geschätzter Meisterbetrieb</span>{' '}
                für Heizung, Sanitär, Lüftung und Solar in Langenau und Umgebung.
              </p>
              <p>
                Die Philosophie dahinter ist einfach: Ehrliche Beratung, saubere Ausführung und
                ein{' '}
                <span className="text-brand-orange font-semibold">verlässliches Wort</span>. Kein
                Call-Center, keine langen Wartezeiten — Sie sprechen direkt mit dem Chef.
              </p>
              <p>
                Als{' '}
                <span className="text-brand-orange font-semibold">Meisterbetrieb</span>{' '}
                garantieren wir höchste Qualitätsstandards und bilden auch selbst aus — weil gutes
                Handwerk Tradition und Zukunft braucht.
              </p>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-2 gap-4">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors duration-200"
                >
                  <div className={`${value.bg} ${value.color} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
                    {value.icon}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{value.title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Images */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex relative justify-center items-center h-[540px]"
          >
            {/* Image 1 — larger, slightly left */}
            <motion.div
              whileHover={{ scale: 1.03, rotate: '0deg' }}
              transition={{ duration: 0.3 }}
              className="absolute w-72 h-80 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 z-20"
              style={{ transform: 'translate(-40px, -30px) rotate(-3deg)' }}
            >
              <Image
                src="/images/heizraum-2.jpg"
                alt="Heizraum — Haustechnik Andreas Frey Langenau"
                fill
                className="object-cover"
                sizes="288px"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/40 to-transparent" />
            </motion.div>

            {/* Image 2 — smaller, right */}
            <motion.div
              whileHover={{ scale: 1.03, rotate: '0deg' }}
              transition={{ duration: 0.3 }}
              className="absolute w-56 h-64 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 z-10"
              style={{ transform: 'translate(80px, 60px) rotate(4deg)' }}
            >
              <Image
                src="/images/bad-2.jpg"
                alt="Badsanierung — Meisterbetrieb Haustechnik Frey Langenau"
                fill
                className="object-cover"
                sizes="224px"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/40 to-transparent" />
            </motion.div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-12 left-4 z-30 bg-brand-orange rounded-2xl px-5 py-4 shadow-orange-glow"
            >
              <div className="text-white/80 text-xs font-medium">Meisterbetrieb</div>
              <div className="text-white font-serif font-bold text-lg mt-0.5">Seit 1994</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
