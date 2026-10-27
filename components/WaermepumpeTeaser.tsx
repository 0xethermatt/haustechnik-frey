import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeEuro, CheckCircle2, Clock } from 'lucide-react'
import { UMSETZUNGSFRIST_MONATE, formatDatum, getNaechstePeriode, getPeriode } from '@/lib/waermepumpe/foerderung'

export default function WaermepumpeTeaser() {
  const periode = getPeriode()
  const naechste = getNaechstePeriode()

  return (
    <section className="pt-8 pb-12 sm:py-16 lg:py-20 bg-brand-cream" aria-labelledby="wp-teaser-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-purple-deep grid lg:grid-cols-[1.2fr_1fr]">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" aria-hidden="true" />

          <div className="relative p-6 sm:p-10 lg:p-14">
            {naechste && periode.klimaBonus > 0 && (
              <span className="inline-flex items-center gap-2 sm:whitespace-nowrap bg-brand-orange/20 text-brand-orange text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full mb-5">
                <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                Klimabonus {periode.klimaBonus} %<span className="hidden sm:inline"> – sinkt am {formatDatum(naechste.ab)} auf {naechste.klimaBonus} %</span>
                <span className="sm:hidden">· ab {formatDatum(naechste.ab).slice(0, 6)}{formatDatum(naechste.ab).slice(8)}: {naechste.klimaBonus} %</span>
              </span>
            )}
            <h2 id="wp-teaser-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-4">
              Wärmepumpe? <span className="block text-brand-orange">Bis zu 80&nbsp;% gefördert.</span>
            </h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-6 max-w-xl">
              Jetzt beantragen und die höhere Förderung sichern – danach haben Sie{' '}
              <strong className="text-white">{UMSETZUNGSFRIST_MONATE} Monate Zeit</strong> für den Einbau. Eignung,
              Förderung und Kosten prüfen Sie in 5 Minuten.
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-8" role="list">
              {['Auch im Altbau & mit Heizkörpern', 'KfW-Antrag: wir bereiten alles vor', 'Einbau in 3–5 Tagen', 'Planung, Einbau & Wartung vom Meister'].map((t) => (
                <li key={t} className="flex gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/waermepumpe"
                className="group inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-7 py-4 rounded-full transition-colors shadow-orange-glow"
              >
                Zur Wärmepumpen-Seite
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/waermepumpe#foerderrechner"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-4 rounded-full border border-white/20 transition-colors"
              >
                <BadgeEuro className="w-5 h-5" aria-hidden="true" />
                Förderung berechnen
              </Link>
            </div>
          </div>

          <div className="relative h-48 sm:h-64 lg:h-auto lg:min-h-full">
            <Image
              src="/images/waermepumpe-2.jpg"
              alt="Wärmepumpe Außeneinheit – Haustechnik Frey"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-brand-purple-deep via-brand-purple-deep/20 to-transparent" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  )
}
