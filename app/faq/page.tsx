import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import FAQAccordion from '@/components/FAQAccordion'

export const metadata = {
  title: 'FAQ — Häufige Fragen zu Heizung, Bad & Förderung | Haustechnik Frey',
  description:
    'Antworten zu Heizungskosten, BEG-Förderung, Badsanierung, Solarthermie und mehr. Haustechnik Frey — Meisterbetrieb in Langenau.',
  keywords: [
    'FAQ Heizung',
    'BEG Förderung Fragen',
    'Wärmepumpe Kosten',
    'Badsanierung Kosten',
    'Heizung Langenau FAQ',
  ],
  alternates: { canonical: 'https://haustechnik-frey.de/faq' },
}

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Welche Heizung ist die beste für mein Zuhause?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Das hängt von Ihrem Gebäudetyp und der Infrastruktur ab. Wärmepumpe für gut gedämmte Gebäude, Pelletheizung für erneuerbare Energie, Gas als Brückentechnologie. Kostenlose Beratung bei Haustechnik Frey.',
                },
              },
              {
                '@type': 'Question',
                name: 'Wie hoch ist die BEG-Förderung für Wärmepumpen?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Grundförderung 30%, +5% Klimabonus beim Heizungstausch = 35%, +5% Einkommensbonus bis 40.000€ Jahreseinkommen = 40%. Max. förderfähig: 30.000€ EFH.',
                },
              },
              {
                '@type': 'Question',
                name: 'Was kostet eine Badsanierung?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Einfach ab 5.000€, mittel 10.000-20.000€, hochwertig ab 20.000€. Kostenlose Beratung vor Ort.',
                },
              },
              {
                '@type': 'Question',
                name: 'In welchem Gebiet sind Sie tätig?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Langenau und Umgebung: Ulm, Neu-Ulm, Blaubeuren, Heidenheim, Herbrechtingen — ca. 50km Umkreis.',
                },
              },
              {
                '@type': 'Question',
                name: 'Sind Sie ein Meisterbetrieb?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Ja, Andreas Frey ist geprüfter Meister im SHK-Handwerk seit 1994.',
                },
              },
            ],
          }),
        }}
      />
      <Navigation />
      <main>
        {/* Hero */}
        <section className="bg-brand-purple-deep pt-32 pb-16 text-white text-center px-4">
          <span className="text-brand-orange text-sm font-semibold tracking-widest uppercase">Häufige Fragen</span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mt-3 mb-5">FAQ</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Alles was Sie wissen möchten — rund um Heizung, Bad, Lüftung, Solar und Förderung.</p>
        </section>
        {/* Full accordion */}
        <FAQAccordion showAll showHeading={false} />
      </main>
      <Footer />
    </>
  )
}
