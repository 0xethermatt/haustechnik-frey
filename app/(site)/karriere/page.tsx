import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Karriere & Jobs — Haustechnik Frey Langenau',
  description:
    'Jobs in Langenau: Anlagenmechaniker SHK, Auszubildende, Servicetechniker. Meisterbetrieb Haustechnik Frey sucht Verstärkung im Team.',
  keywords: [
    'Jobs Langenau',
    'Ausbildung SHK Langenau',
    'Anlagenmechaniker Langenau',
    'Stelle Heizung Langenau',
  ],
  alternates: { canonical: 'https://haustechnik-frey.de/karriere' },
}

const benefits = [
  {
    icon: '🏠',
    title: 'Familiäres Team',
    text: 'Flache Hierarchien, direkter Kontakt zur Chefetage. Bei uns kennt man sich beim Namen.',
  },
  {
    icon: '📈',
    title: 'Weiterbildung',
    text: 'Regelmäßige Schulungen bei Viessmann, Vaillant & Co. Wir investieren in Ihre Entwicklung.',
  },
  {
    icon: '🔧',
    title: 'Moderne Ausstattung',
    text: 'Neues Werkzeug, aktuelle Fahrzeuge, digitale Auftragsabwicklung. Kein Flickwerk.',
  },
  {
    icon: '💰',
    title: 'Faire Vergütung',
    text: 'Übertarifliche Bezahlung, Urlaubs- und Weihnachtsgeld, betriebliche Altersvorsorge.',
  },
]

const jobs = [
  {
    title: 'Anlagenmechaniker SHK (m/w/d)',
    type: 'Vollzeit',
    location: 'Langenau',
    description:
      'Installation und Wartung von Heizungs-, Sanitär- und Lüftungsanlagen bei Privat- und Gewerbekunden.',
    tags: ['Heizung', 'Sanitär', 'Vollzeit'],
    subject: 'Bewerbung: Anlagenmechaniker SHK',
  },
  {
    title: 'Auszubildender Anlagenmechaniker SHK (m/w/d)',
    type: 'Ausbildung',
    location: 'Start: September 2026',
    description:
      'Lerne von Grund auf das SHK-Handwerk in einem modernen Meisterbetrieb mit persönlicher Betreuung.',
    tags: ['Ausbildung', 'Quereinsteiger willkommen'],
    subject: 'Bewerbung: Auszubildender Anlagenmechaniker SHK',
  },
  {
    title: 'Servicetechniker / Kundendienst (m/w/d)',
    type: 'Vollzeit oder Teilzeit',
    location: 'Langenau',
    description:
      'Wartung, Inspektion und Entstörung von Heizungs- und Sanitäranlagen. Führerschein Klasse B erforderlich.',
    tags: ['Kundendienst', 'Teilzeit möglich'],
    subject: 'Bewerbung: Servicetechniker Kundendienst',
  },
]

export default function KarrierePage() {
  return (
    <>
      <Navigation />

      {/* Hero */}
      <section className="bg-brand-purple-deep pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-brand-orange font-semibold text-xs tracking-widest uppercase mb-5">
            Karriere · Haustechnik Frey
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-6">
            Werde Teil unseres Teams
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Wir sind ein familiärer Meisterbetrieb in Langenau mit über 30 Jahren Erfahrung. Wir
            suchen Menschen, die mit Leidenschaft dabei sind — egal ob Profi oder Berufseinsteiger.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:bewerbung@haustechnik-frey.de"
              className="bg-brand-orange hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full transition-all duration-200 hover:shadow-lg text-base"
            >
              Jetzt bewerben
            </a>
            <a
              href="#offene-stellen"
              className="text-white/70 hover:text-white font-medium px-8 py-4 rounded-full border border-white/20 hover:border-white/40 transition-all duration-200 text-base"
            >
              Offene Stellen ansehen ↓
            </a>
          </div>
        </div>
      </section>

      {/* Warum Frey? */}
      <section className="bg-brand-warm py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-brand-orange font-semibold text-xs tracking-widest uppercase mb-4">
              Ihre Vorteile
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep">
              Warum Frey?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-white rounded-2xl shadow-card p-6 flex gap-4 items-start"
              >
                <span className="text-3xl flex-shrink-0">{b.icon}</span>
                <div>
                  <h3 className="font-bold text-brand-purple-deep text-lg mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offene Stellen */}
      <section id="offene-stellen" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-brand-orange font-semibold text-xs tracking-widest uppercase mb-4">
              Jetzt einsteigen
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-brand-purple-deep">
              Offene Stellen
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.title}
                className="bg-brand-warm rounded-2xl shadow-card p-6 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-brand-purple-deep text-lg leading-snug mb-2">
                    {job.title}
                  </h3>
                  <p className="text-brand-orange font-semibold text-sm mb-1">
                    {job.type} · {job.location}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{job.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-brand-purple/10 text-brand-purple text-xs font-semibold px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={`mailto:bewerbung@haustechnik-frey.de?subject=${encodeURIComponent(job.subject)}`}
                  className="inline-flex items-center justify-center gap-1 bg-brand-purple-deep hover:bg-brand-purple text-white font-semibold text-sm px-5 py-3 rounded-full transition-all duration-200"
                >
                  Jetzt bewerben →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bewerbung CTA */}
      <section className="bg-brand-purple py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
            Klingt gut? Dann melden Sie sich!
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Schicken Sie uns Ihre Unterlagen — oder rufen Sie einfach an. Wir sind unkompliziert.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:bewerbung@haustechnik-frey.de"
              className="bg-brand-orange hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full transition-all duration-200 hover:shadow-lg text-base"
            >
              Per E-Mail bewerben
            </a>
            <a
              href="tel:+4973453286"
              className="text-white font-semibold px-8 py-4 rounded-full border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all duration-200 text-base"
            >
              Anrufen: 07345 3286
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
