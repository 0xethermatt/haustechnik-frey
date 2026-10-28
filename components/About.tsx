'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Heart, Star, MapPin, Shield, Quote } from 'lucide-react'

const values = [
  {
    icon: Heart,
    title: 'Persönlich',
    description: 'Ein festes Team, das Sie kennt – vom Büro bis zur Baustelle.',
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/15',
  },
  {
    icon: Star,
    title: 'Erfahren',
    description: 'Über 30 Jahre Handwerk und laufende Weiterbildung.',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/15',
  },
  {
    icon: MapPin,
    title: 'Regional',
    description: 'Verwurzelt in Langenau – kurze Wege, schnelle Hilfe.',
    color: 'text-brand-green',
    bg: 'bg-brand-green/15',
  },
  {
    icon: Shield,
    title: 'Zuverlässig',
    description: 'Termin ist Termin. Preis ist Preis. Keine versteckten Kosten.',
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
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-purple/20 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-6"
          >
            <div>
              <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
                Über uns
              </span>
              <h2
                id="ueber-uns-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight"
              >
                Handwerk mit <span className="text-brand-orange">Leidenschaft</span> und Herz
              </h2>
            </div>

            <div className="flex flex-col gap-4 text-white/70 leading-relaxed sm:text-[1.05rem]">
              <p>
                Andreas Frey ist seit <span className="text-white font-semibold">über 30 Jahren selbständig</span> und
                hat seinen Betrieb aus eigener Kraft aufgebaut – heute ein geschätzter Meisterbetrieb für Heizung,
                Sanitär, Lüftung und Solar in Langenau und Umgebung.
              </p>
              <p>
                Kein Call-Center, keine langen Wartezeiten: Unser Büro nimmt sich Zeit für Ihr Anliegen und koordiniert alles bis zum Termin. Und weil gutes Handwerk
                Zukunft braucht, bilden wir auch selbst aus.
              </p>
            </div>

            <figure className="relative rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6">
              <Quote className="absolute -top-3 left-5 w-7 h-7 text-brand-orange bg-brand-purple-deep px-1" aria-hidden="true" />
              <blockquote className="text-white text-lg sm:text-xl font-serif leading-snug">
                „Ehrliche Beratung, saubere Arbeit und ein Wort, auf das man sich verlassen kann.“
              </blockquote>
              <figcaption className="mt-3 text-sm text-white/55">Andreas Frey · Inhaber &amp; SHK-Meister</figcaption>
            </figure>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative pb-[9%]"
          >
            <div className="relative aspect-[3/2] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
              <Image
                src="/images/team/firmenwagen.jpg"
                alt="Firmenwagen von Haustechnik Frey – Wärmepumpen und moderne Heiztechnik aus Langenau"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
                loading="lazy"
              />
            </div>
            {/* Projektfoto überlappt bewusst die Mobilnummer auf dem Wagen – Anrufe sollen ins Büro gehen */}
            <div className="absolute bottom-0 left-[22%] w-[44%] aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border-4 border-brand-purple-deep z-10">
              <Image
                src="/images/referenz-weishaupt/03-technikraum-hell.jpg"
                alt="Von Haustechnik Frey installierte Weishaupt-Wärmepumpe im Technikraum"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 44vw, 270px"
                loading="lazy"
              />
            </div>
            <div className="absolute top-3 left-3 lg:top-4 lg:left-4 z-20 bg-brand-orange rounded-2xl px-3.5 py-2.5 lg:px-5 lg:py-3.5 shadow-orange-glow">
              <div className="text-white/80 text-[11px] lg:text-xs font-medium">Meisterbetrieb</div>
              <div className="text-white font-serif font-bold text-sm lg:text-lg mt-0.5">Seit 1994</div>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 lg:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
            >
              <div className={`${value.bg} ${value.color} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <value.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-sm">{value.title}</h3>
                <p className="text-white/55 text-xs leading-relaxed mt-0.5">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
