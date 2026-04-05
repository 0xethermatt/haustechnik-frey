import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Heizung Langenau — Wärmepumpe, Pellet & Gas | Haustechnik Frey',
  description:
    'Heizungsinstallation & -modernisierung in Langenau. Wärmepumpe, Pelletheizung, Gasheizung, Fußbodenheizung — mit BEG-Förderung bis 70%. Meisterbetrieb seit 1994.',
  keywords: [
    'Heizung Langenau',
    'Wärmepumpe Langenau',
    'Pelletheizung Langenau',
    'Heizung modernisieren Langenau',
    'BEG Förderung Langenau',
    'Gasheizung Langenau',
    'Fußbodenheizung Langenau',
    'Heizungsbauer Langenau',
  ],
  openGraph: {
    title: 'Heizung Langenau — Wärmepumpe, Pellet & Gas | Haustechnik Frey',
    description:
      'Heizungsinstallation in Langenau. Wärmepumpe, Pellet, Gas — mit BEG-Förderung bis 70%.',
    url: 'https://haustechnik-frey.de/leistungen/heizung',
  },
  alternates: { canonical: 'https://haustechnik-frey.de/leistungen/heizung' },
}

const heizungJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Heizungsinstallation & Modernisierung',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Haustechnik Andreas Frey',
    url: 'https://haustechnik-frey.de',
  },
  areaServed: { '@type': 'City', name: 'Langenau' },
  serviceType: ['Heizungsinstallation', 'Wärmepumpe', 'Pelletheizung', 'Gasheizung', 'Fußbodenheizung'],
}

const systems = [
  {
    id: 'waermepumpe',
    title: 'Wärmepumpe',
    tagColor: 'bg-brand-green text-white',
    image: '/images/waermepumpe-2.jpg',
    imageAlt: 'Wärmepumpe Außeneinheit — Haustechnik Frey Langenau',
    description:
      'Die Wärmepumpe nutzt kostenlose Umgebungsenergie aus Luft, Erde oder Wasser und wandelt sie effizient in Heizwärme um. Mit einem COP von 3–5 erzeugt sie aus 1 kWh Strom bis zu 5 kWh Wärme.',
    pros: [
      'Bis zu 70 % BEG-Förderung möglich',
      'Sehr niedrige Betriebskosten',
      'Klimaneutral mit Ökostrom',
      'Kühlfunktion im Sommer (reversibel)',
      'Lange Lebensdauer: 20+ Jahre',
    ],
    when: 'Ideal für Neubauten und gut gedämmte Bestandsgebäude. Luftwärmepumpen sind auch bei schlechter Dämmung oft wirtschaftlich.',
  },
  {
    id: 'pellet',
    title: 'Pelletheizung',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/pellets-2.jpg',
    imageAlt: 'Pelletheizung Windhager — Haustechnik Frey Langenau',
    description:
      'Pelletheizungen verbrennen genormte Holzpresslinge (Pellets) und erreichen Wirkungsgrade von über 90 %. Der Brennstoff ist CO₂-neutral und regional verfügbar — eine moderne, bequeme Alternative zu Öl und Gas.',
    pros: [
      'CO₂-neutral & erneuerbar',
      'Hoher Komfort dank Vollautomatik',
      'Günstiger Brennstoffpreis (Pellets)',
      'Unabhängig von Gas- & Ölpreisen',
      'BEG-Förderung möglich',
    ],
    when: 'Perfekt für alle, die erneuerbar heizen möchten, aber keinen Platz/Budget für eine Wärmepumpe haben oder auf bewährte Verbrennungstechnik setzen.',
  },
  {
    id: 'gas',
    title: 'Gasheizung',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/gasheizung-1.avif',
    imageAlt: 'Gasheizung — Haustechnik Frey Langenau',
    description:
      'Moderne Gasbrennwertgeräte nutzen die Abgaswärme vollständig aus und erreichen Wirkungsgrade über 109 %. Kombiniert mit einer Solarthermieanlage lassen sich Heizkosten erheblich senken.',
    pros: [
      'Bewährte, zuverlässige Technologie',
      'Niedrige Investitionskosten',
      'Kompaktes Gerät, kein Lagerraum',
      'Kombinierbar mit Solarthermie',
      'H₂-ready-Geräte zukunftssicher',
    ],
    when: 'Sinnvoll als Brückentechnologie oder dort, wo eine Wärmepumpe aktuell nicht wirtschaftlich ist. H₂-ready-Modelle sind auf die Zukunft vorbereitet.',
  },
  {
    id: 'fussbodenheizung',
    title: 'Fußbodenheizung',
    tagColor: 'bg-brand-teal text-white',
    image: '/images/fussbodenheizung-4.jpg',
    imageAlt: 'Fußbodenheizung — Haustechnik Frey Langenau',
    description:
      'Fußbodenheizungen verteilen die Wärme gleichmäßig über die gesamte Bodenfläche und erzeugen ein besonders behagliches Raumklima. Sie arbeiten mit niedrigen Vorlauftemperaturen — ideal in Kombination mit Wärmepumpen.',
    pros: [
      'Gleichmäßige, behagliche Wärme',
      'Niedrige Vorlauftemperaturen (ideal für WP)',
      'Unsichtbar — kein Platz für Heizkörper',
      'Hygienefreundlich (weniger Staubaufwirbelung)',
      'Auch als Nachrüstlösung möglich',
    ],
    when: 'Empfehlenswert bei Neubau oder Kernsanierung sowie in Kombination mit Wärmepumpen, da niedrige Vorlauftemperaturen die Effizienz maximieren.',
  },
]

export default function HeizungPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(heizungJsonLd) }}
      />
      <Navigation />

      <main className="pt-20">
        {/* ── Hero ── */}
        <section className="bg-brand-purple-deep relative overflow-hidden py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple-deep via-brand-purple/60 to-brand-purple-deep" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/50 mb-8">
              <Link href="/" className="hover:text-white/80 transition-colors">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/#leistungen" className="hover:text-white/80 transition-colors">
                Leistungen
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white/90" aria-current="page">
                Heizung
              </span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
                Heizungstechnik
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
                Heizung —<br />
                <span className="text-brand-orange">von der Planung</span>{' '}
                bis zur Wartung
              </h1>
              <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10">
                Als Meisterbetrieb installieren und warten wir alle gängigen Heizsysteme in
                Langenau und Umgebung. Wir beraten Sie ehrlich und förderoptimiert — von der
                ersten Idee bis zur Inbetriebnahme.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="tel:+4973453286"
                  className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-8 py-4 rounded-full transition-all duration-200 shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  Kostenlos beraten lassen
                </a>
                <Link
                  href="/#kontakt"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full border border-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Anfrage senden
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Heizsysteme ── */}
        <section className="py-20 sm:py-28 bg-brand-warm" aria-labelledby="systeme-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
                Unsere Heizsysteme
              </span>
              <h2 id="systeme-heading" className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep">
                Welches Heizsystem passt zu Ihnen?
              </h2>
              <p className="mt-5 text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Jedes Gebäude und jede Lebenssituation ist anders. Wir finden gemeinsam die
                wirtschaftlichste und nachhaltigste Lösung für Ihr Zuhause.
              </p>
            </div>

            <div className="flex flex-col gap-16">
              {systems.map((sys, i) => (
                <article
                  key={sys.id}
                  id={sys.id}
                  className={`grid lg:grid-cols-2 gap-10 items-center ${
                    i % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Image */}
                  <div className={`relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-card-hover ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <Image
                      src={sys.image}
                      alt={sys.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/40 to-transparent" />
                    <span className={`absolute top-4 left-4 ${sys.tagColor} text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}>
                      {sys.title}
                    </span>
                  </div>

                  {/* Text */}
                  <div className={`flex flex-col gap-6 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep">
                      {sys.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{sys.description}</p>

                    <div>
                      <h4 className="font-semibold text-brand-purple-deep mb-3 text-sm uppercase tracking-wide">
                        Ihre Vorteile
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {sys.pros.map((pro) => (
                          <li key={pro} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-green"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-brand-purple-deep/5 border border-brand-purple/10 rounded-2xl p-4">
                      <span className="text-brand-purple-deep font-semibold text-sm">Wann sinnvoll?</span>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{sys.when}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── BEG Förderung Info Box ── */}
        <section className="py-16 sm:py-20 bg-white" aria-labelledby="foerderung-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-brand-orange/10 border-2 border-brand-orange/30 rounded-3xl p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="bg-brand-orange text-white rounded-2xl p-4 flex-shrink-0">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 id="foerderung-heading" className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep mb-4">
                    BEG-Förderung: bis zu 70 % Zuschuss
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Die Bundesförderung für effiziente Gebäude (BEG) unterstützt den Einbau
                    erneuerbarer Heizungssysteme mit attraktiven Zuschüssen:
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Grundförderung', value: '30 %', note: 'Für alle förderfähigen Systeme' },
                      { label: '+ Klimabonus', value: '+ 5 %', note: 'Beim Ersatz von Öl / Gas / Nachtspeicher' },
                      { label: '+ Einkommensbonus', value: '+ 5 %', note: 'Haushaltseinkommen ≤ €40.000 / Jahr' },
                    ].map((row) => (
                      <div key={row.label} className="bg-white rounded-2xl p-4 text-center border border-brand-orange/20">
                        <div className="text-2xl font-serif font-bold text-brand-orange mb-1">{row.value}</div>
                        <div className="text-brand-purple-deep font-semibold text-sm mb-1">{row.label}</div>
                        <div className="text-gray-500 text-xs leading-relaxed">{row.note}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    <strong>Max. förderfähige Kosten:</strong> €30.000 (EFH) bzw. €75.000 (MFH).
                    Der Antrag läuft über die BAFA. <strong>Wir unterstützen Sie dabei</strong> und
                    stellen sicher, dass Sie keinen Cent verschenken.
                  </p>
                  <a
                    href="tel:+4973453286"
                    className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-8 py-3.5 rounded-full transition-all duration-200 shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange text-sm"
                  >
                    Förderberatung vereinbaren
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 sm:py-20 bg-brand-purple-deep relative overflow-hidden" aria-label="Kontakt Aufruf">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-purple-deep to-brand-purple/80" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-5">
              Bereit für Ihre neue Heizung?
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10">
              Wir berechnen Ihre individuelle Lösung kostenlos — inklusive aller Fördermöglichkeiten.
              Einfach anrufen oder eine Nachricht schicken.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="tel:+4973453286"
                className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-10 py-4 rounded-full transition-all duration-200 shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                07345 3286 anrufen
              </a>
              <Link
                href="/#kontakt"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-full border border-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Anfrage senden
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
