import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Badsanierung Langenau — Sanitär & Badplanung | Haustechnik Frey',
  description:
    'Badsanierung & Sanitärinstallation in Langenau. Traumbad, barrierefreies Bad, Markenarmaturen von Grohe, Hansgrohe, Villeroy & Boch. Meisterbetrieb seit 1994.',
  keywords: [
    'Badsanierung Langenau',
    'Sanitär Langenau',
    'Badplanung Langenau',
    'Barrierefreies Bad Langenau',
    'Badezimmer renovieren Langenau',
    'Sanitärinstallation Langenau',
  ],
  openGraph: {
    title: 'Badsanierung Langenau — Sanitär & Badplanung | Haustechnik Frey',
    description:
      'Badsanierung & Sanitärinstallation in Langenau. Traumbad, barrierefreies Bad, Markenhersteller.',
    url: 'https://haustechnik-frey.de/leistungen/sanitaer',
  },
  alternates: { canonical: 'https://haustechnik-frey.de/leistungen/sanitaer' },
}

const sanitaerJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Badsanierung & Sanitärinstallation',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Haustechnik Andreas Frey',
    url: 'https://haustechnik-frey.de',
  },
  areaServed: { '@type': 'City', name: 'Langenau' },
  serviceType: ['Badsanierung', 'Sanitärinstallation', 'Barrierefreies Bad', 'Badplanung', 'Wasserhygiene'],
}

const sections = [
  {
    id: 'badsanierung',
    title: 'Badsanierung',
    tagColor: 'bg-brand-blue text-white',
    image: '/images/bad-1.jpg',
    imageAlt: 'Badsanierung — Haustechnik Frey Langenau',
    description:
      'Eine Badsanierung ist eine Investition in Lebensqualität. Ob komplette Kernsanierung oder gezielte Erneuerung einzelner Elemente — wir planen Ihr Traumbad und setzen es handwerklich perfekt um.',
    items: [
      'Komplette Grundrissplanung & Visualisierung',
      'Fliesenarbeiten nach Ihren Wünschen',
      'Badmöbel, Waschtische & Spiegel',
      'Dusche, Badewanne oder beides',
      'Abwasser- & Zuleitungsinstallation',
    ],
  },
  {
    id: 'barrierefrei',
    title: 'Barrierefreies Bad',
    tagColor: 'bg-brand-teal text-white',
    image: '/images/bad-3.jpg',
    imageAlt: 'Barrierefreies Bad — Haustechnik Frey Langenau',
    description:
      'Barrierefreiheit bedeutet Selbstständigkeit und Komfort — für jedes Alter. Wir planen und installieren Bäder nach DIN 18040 mit ebenerdiger Dusche, Haltegriffen und ergonomischen Sitzmöglichkeiten.',
    items: [
      'Ebenerdige Dusche (Bodengleich)',
      'Haltegriffe & Stützklappgriffe',
      'Unterfahrbare Waschtische',
      'Rutschfeste Bodenfliesen (R-Klasse)',
      'KfW- & Pflegekassen-Förderung möglich',
    ],
  },
  {
    id: 'wasserhygiene',
    title: 'Wasserhygiene',
    tagColor: 'bg-brand-green text-white',
    image: '/images/bad-4.jpg',
    imageAlt: 'Wasserhygiene — Haustechnik Frey Langenau',
    description:
      'Sauberes Trinkwasser beginnt bei der Rohrinstallation. Wir setzen die Trinkwasserverordnung (TrinkwV) konsequent um und schützen Sie vor Legionellen und Biofilmbildung in Ihren Leitungen.',
    items: [
      'Legionellenprüfung & Spülung',
      'Rohrsanierung ohne Stemmen',
      'Hygienische Rohrleitungsführung',
      'Wasserfilteranlagen & Enthärter',
      'Zirkulationssysteme für schnelles Warmwasser',
    ],
  },
  {
    id: 'armaturen',
    title: 'Armaturen & Keramik',
    tagColor: 'bg-brand-orange text-white',
    image: '/images/bad-2.jpg',
    imageAlt: 'Armaturen & Keramik — Haustechnik Frey Langenau',
    description:
      'Von der Einhand-Armatur bis zur berührungslosen Sensor-Armatur — wir liefern und installieren ausschließlich Markenprodukte mit Herstellergarantie und jahrzehntelanger Erfahrung in der Verarbeitung.',
    items: [
      'Grohe, Hansgrohe, Hansa',
      'Geberit-Spülsysteme & -Vorwände',
      'Villeroy & Boch, Duravit, Laufen',
      'Thermostat-Armaturen für Komfort & Sicherheit',
      'Handtuchtrockner & Bad-Accessoires',
    ],
  },
]

const processSteps = [
  {
    step: '01',
    title: 'Beratung & Planung',
    description:
      'Wir kommen zu Ihnen — kostenlos und unverbindlich. Wir erfassen Ihre Wünsche, messen den Raum aus und zeigen Ihnen Möglichkeiten auf.',
    color: 'bg-brand-blue/15 text-brand-blue border-brand-blue/30',
  },
  {
    step: '02',
    title: 'Materialauswahl',
    description:
      'Gemeinsam wählen wir Fliesen, Armaturen, Sanitärkeramik und Möbel aus — abgestimmt auf Ihren Geschmack und Ihr Budget.',
    color: 'bg-brand-orange/15 text-brand-orange-dark border-brand-orange/30',
  },
  {
    step: '03',
    title: 'Installation',
    description:
      'Unser erfahrenes Team führt alle Arbeiten termintreu und sauber aus — von der Demontage bis zur funktionsfähigen Übergabe.',
    color: 'bg-brand-green/15 text-brand-green border-brand-green/30',
  },
  {
    step: '04',
    title: 'Übergabe',
    description:
      'Wir reinigen die Baustelle, übergeben Ihr neues Bad und erklären Ihnen alles Wichtige zur Pflege und Bedienung.',
    color: 'bg-brand-purple/15 text-brand-purple border-brand-purple/30',
  },
]

const costCards = [
  {
    tier: 'Basis',
    range: '€5.000 – €10.000',
    color: 'border-brand-blue/40',
    tagColor: 'bg-brand-blue text-white',
    items: ['Armaturen- & WC-Erneuerung', 'Teilfliesung', 'Neue Dusche', 'Ohne Grundrissänderung'],
  },
  {
    tier: 'Komfort',
    range: '€10.000 – €20.000',
    color: 'border-brand-orange/50',
    tagColor: 'bg-brand-orange text-white',
    highlight: true,
    items: ['Vollfliesung', 'Neue Badmöbel', 'Bodengleiche Dusche', 'Inkl. Elektroanpassungen'],
  },
  {
    tier: 'Premium',
    range: 'ab €20.000',
    color: 'border-brand-purple/40',
    tagColor: 'bg-brand-purple text-white',
    items: ['Kernsanierung', 'Designelemente & Naturstein', 'Fußbodenheizung', 'Individuelles Maßkonzept'],
  },
]

export default function SanitaerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sanitaerJsonLd) }}
      />
      <Navigation />

      <main className="pt-20">
        {/* ── Hero ── */}
        <section className="bg-brand-purple-deep relative overflow-hidden py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple-deep via-brand-blue/20 to-brand-purple-deep" aria-hidden="true" />
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />

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
                Sanitär
              </span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-block text-brand-blue-light font-semibold text-sm tracking-widest uppercase mb-4">
                Sanitär & Badsanierung
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
                Ihr Traumbad —<br />
                <span className="text-brand-blue-light">geplant & installiert</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10">
                Von der Badsanierung bis zum barrierefreien Umbau — wir setzen Ihre Vorstellungen
                handwerklich präzise um. Persönliche Beratung, faire Preise, Meisterqualität.
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

        {/* ── Leistungsbereiche ── */}
        <section className="py-20 sm:py-28 bg-brand-warm" aria-labelledby="sanitaer-leistungen-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block text-brand-blue font-semibold text-sm tracking-widest uppercase mb-4">
                Unser Angebot
              </span>
              <h2 id="sanitaer-leistungen-heading" className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep">
                Alles rund ums Bad
              </h2>
              <p className="mt-5 text-gray-500 max-w-2xl mx-auto leading-relaxed">
                Von der vollständigen Kernsanierung bis zur gezielten Erneuerung einzelner
                Elemente — wir übernehmen alles aus einer Hand.
              </p>
            </div>

            <div className="flex flex-col gap-16">
              {sections.map((sec, i) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="grid lg:grid-cols-2 gap-10 items-center"
                >
                  {/* Image */}
                  <div className={`relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-card-hover ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <Image
                      src={sec.image}
                      alt={sec.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-purple-deep/40 to-transparent" />
                    <span className={`absolute top-4 left-4 ${sec.tagColor} text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}>
                      {sec.title}
                    </span>
                  </div>

                  {/* Text */}
                  <div className={`flex flex-col gap-6 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep">
                      {sec.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{sec.description}</p>
                    <ul className="flex flex-col gap-2">
                      {sec.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-blue"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process Steps ── */}
        <section className="py-20 sm:py-24 bg-white" aria-labelledby="prozess-heading">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block text-brand-blue font-semibold text-sm tracking-widest uppercase mb-4">
                So läuft es ab
              </span>
              <h2 id="prozess-heading" className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep">
                Ihr Weg zum neuen Bad
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step) => (
                <div
                  key={step.step}
                  className={`bg-white rounded-3xl p-6 border-2 ${step.color} shadow-card flex flex-col gap-4`}
                >
                  <div className={`text-4xl font-serif font-bold opacity-30 ${step.color.split(' ')[1]}`}>
                    {step.step}
                  </div>
                  <h3 className="text-brand-purple-deep font-serif font-bold text-lg">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Cost Overview ── */}
        <section className="py-20 sm:py-24 bg-brand-warm" aria-labelledby="kosten-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
                Investition
              </span>
              <h2 id="kosten-heading" className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep">
                Was kostet eine Badsanierung?
              </h2>
              <p className="mt-5 text-gray-500 max-w-xl mx-auto leading-relaxed text-base">
                Die Kosten variieren je nach Umfang und Materialwahl. Diese Richtwerte geben
                Orientierung — ein exaktes Angebot erstellen wir kostenlos vor Ort.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {costCards.map((card) => (
                <div
                  key={card.tier}
                  className={`bg-white rounded-3xl border-2 ${card.color} p-7 flex flex-col gap-5 shadow-card ${
                    card.highlight ? 'shadow-orange-glow' : ''
                  }`}
                >
                  {card.highlight && (
                    <div className="bg-brand-orange text-white text-xs font-bold px-4 py-1.5 rounded-full self-start shadow-sm">
                      Häufigste Wahl
                    </div>
                  )}
                  <div>
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${card.tagColor}`}>
                      {card.tier}
                    </span>
                    <div className="text-2xl font-serif font-bold text-brand-purple-deep">{card.range}</div>
                  </div>
                  <ul className="flex flex-col gap-2.5 flex-1">
                    {card.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
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
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="tel:+4973453286"
                    className={`block text-center text-sm font-semibold py-3 px-5 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                      card.highlight
                        ? 'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-orange-glow hover:shadow-none'
                        : 'bg-brand-warm hover:bg-gray-100 text-brand-purple-deep border border-gray-200'
                    }`}
                  >
                    Angebot anfragen
                  </a>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">
              * Alle Preisangaben sind Richtwerte inkl. Materialkosten. Endgültige Kosten nach
              kostenloser Besichtigung.
            </p>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 sm:py-20 bg-brand-purple-deep relative overflow-hidden" aria-label="Kontakt Aufruf">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-purple-deep to-brand-blue/30" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-5">
              Bereit für Ihr neues Traumbad?
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10">
              Wir kommen kostenlos zu Ihnen — mit Aufmaß, Beratung und einem verbindlichen
              Angebot. Einfach anrufen oder eine Nachricht schicken.
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
