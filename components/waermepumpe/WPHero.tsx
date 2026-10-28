'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calculator, CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { scrollToId } from './WPContext'
import {
  UMSETZUNGSFRIST_MONATE,
  formatEuro,
  getNaechstePeriode,
  getPeriode,
  letzterTagVor,
  tageBis,
} from '@/lib/waermepumpe/foerderung'

const trust = [
  'Meisterbetrieb seit 1994',
  'KfW-Antrag: wir bereiten alles vor',
  'Planung, Einbau & Wartung aus einer Hand',
]


export default function WPHero() {
  const periode = getPeriode()
  const naechste = getNaechstePeriode()
  const [tage, setTage] = useState<number | null>(null)

  const kpis = [
    { value: 'bis 80 %', label: 'Förderung' },
    { value: formatEuro(periode.kostenErsteWE * 0.8), label: 'max. Zuschuss' },
    { value: '3–5 Tage', label: 'Einbauzeit' },
    { value: 'seit 1994', label: 'Meisterbetrieb' },
  ]

  useEffect(() => {
    if (naechste) setTage(tageBis(naechste.ab))
  }, [naechste])

  return (
    <section
      id="wp-hero"
      className="relative bg-brand-purple-deep overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24"
      aria-labelledby="wp-hero-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple-deep via-brand-purple/50 to-brand-purple-deep" aria-hidden="true" />
      <div className="absolute -top-20 right-0 w-[32rem] h-[32rem] rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 -left-20 w-96 h-96 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/50 mb-8">
          <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/leistungen/heizung" className="hover:text-white/80 transition-colors">Heizung</Link>
          <span aria-hidden="true">/</span>
          <span className="text-white/90" aria-current="page">Wärmepumpe</span>
        </nav>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="inline-flex items-center gap-2 bg-brand-green/15 text-brand-green text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full mb-5">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span className="sm:hidden">Meisterbetrieb · Langenau &amp; Ulm</span>
              <span className="hidden sm:inline">Luft-Wasser-Wärmepumpen vom Meisterbetrieb · Langenau, Ulm &amp; Umgebung</span>
            </span>
            <h1
              id="wp-hero-heading"
              className="text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 text-balance"
            >
              Ihre Wärmepumpe —{' '}
              <span className="text-brand-orange">bis zu 80&nbsp;% gefördert.</span>{' '}
              Alles aus einer Hand.
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/70 leading-relaxed mb-8 max-w-2xl">
              Wir planen, installieren und warten Ihre Wärmepumpe – und begleiten Sie durch den
              KfW-Förderantrag. Finden Sie in 5 Minuten heraus, ob Ihr Haus geeignet ist und wie
              viel Zuschuss Ihnen zusteht.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3">
              <button
                onClick={() => scrollToId('anfrage')}
                className="group inline-flex items-center justify-center gap-2 whitespace-nowrap bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-7 py-4 rounded-full transition-all duration-200 shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-purple-deep"
              >
                Wärmepumpen-Check starten
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
              <button
                onClick={() => scrollToId('foerderrechner')}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-4 rounded-full border border-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Calculator className="w-5 h-5" aria-hidden="true" />
                Förderung berechnen
              </button>
            </div>
            <p className="text-xs sm:text-sm text-white/55 mb-6 sm:mb-8 text-center sm:text-left">
              Kostenlos · unverbindlich · in 3–5 Minuten erledigt
            </p>

            {/* Handy: Dringlichkeit schon im ersten Bildschirm zeigen */}
            {naechste && periode.klimaBonus > 0 && (
              <p className="lg:hidden flex items-center gap-2 text-sm text-white bg-brand-orange/20 border border-brand-orange/30 rounded-2xl px-4 py-3 mb-6">
                <Clock className="w-4 h-4 text-brand-orange flex-shrink-0" aria-hidden="true" />
                <span>
                  Klimabonus <strong>{periode.klimaBonus} %</strong> nur noch bis {letzterTagVor(naechste.ab)}
                  {tage !== null && <> ({tage} Tage)</>} – danach {naechste.klimaBonus} %.
                </span>
              </p>
            )}

            <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2" role="list">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              <Image
                src="/images/waermepumpe-3.jpg"
                alt="Luft-Wasser-Wärmepumpe im Garten eines Einfamilienhauses"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/70 via-transparent to-transparent" aria-hidden="true" />
            </div>

            {naechste && periode.klimaBonus > 0 && (
              <div className="hidden lg:flex absolute -bottom-6 left-6 max-w-sm bg-white rounded-2xl shadow-card-hover p-4 gap-3 items-start">
                <div className="bg-brand-orange/15 text-brand-orange-dark p-2.5 rounded-xl flex-shrink-0">
                  <Clock className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-orange-dark">
                    Förder-Countdown
                  </p>
                  <p className="text-sm text-brand-purple-deep leading-snug mt-0.5">
                    Klimabonus <strong>{periode.klimaBonus} %</strong> nur noch bis{' '}
                    <strong>{letzterTagVor(naechste.ab)}</strong>
                    {tage !== null && <> – noch <strong>{tage} Tage</strong></>}. Danach{' '}
                    {naechste.klimaBonus} %.
                  </p>
                  <p className="text-xs text-brand-purple-deep/60 leading-snug mt-1">
                    Jetzt beantragen, Satz sichern – und {UMSETZUNGSFRIST_MONATE} Monate Zeit für den Einbau.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-10 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white/10 border border-white/10 rounded-2xl px-4 py-4 sm:py-5 text-center">
              <div className="text-xl sm:text-3xl font-serif font-bold text-white">{k.value}</div>
              <div className="text-xs sm:text-sm text-white/55 mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
