import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Impressum | Haustechnik Andreas Frey',
  description: 'Impressum der Haustechnik Andreas Frey, Schammenstraße 19, 89129 Langenau.',
  robots: { index: false, follow: false },
}

export default function Impressum() {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="bg-brand-purple-deep py-5 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" aria-label="Zurück zur Startseite">
            <Logo size={40} withText={true} textColor="#FFFFFF" />
          </Link>
          <Link
            href="/"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-4xl font-serif font-bold text-brand-purple-deep mb-10">Impressum</h1>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
          <section aria-labelledby="angaben-heading">
            <h2 id="angaben-heading" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              Angaben gemäß § 5 TMG
            </h2>
            <address className="not-italic leading-relaxed">
              <strong>Haustechnik Andreas Frey</strong>
              <br />
              Schammenstraße 19
              <br />
              89129 Langenau
              <br />
              Baden-Württemberg, Deutschland
            </address>
          </section>

          <section aria-labelledby="kontakt-heading">
            <h2 id="kontakt-heading" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              Kontakt
            </h2>
            <p>
              Telefon:{' '}
              <a href="tel:+4973453286" className="text-brand-purple hover:underline">
                +49 7345 3286
              </a>
              <br />
              Mobil:{' '}
              <a href="tel:+491727309901" className="text-brand-purple hover:underline">
                +49 172 7309901
              </a>
              <br />
              E-Mail:{' '}
              <a href="mailto:info@haustechnik-frey.de" className="text-brand-purple hover:underline">
                info@haustechnik-frey.de
              </a>
            </p>
          </section>

          <section aria-labelledby="inhaber-heading">
            <h2 id="inhaber-heading" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)
            </h2>
            <p>Andreas Frey, Schammenstraße 19, 89129 Langenau</p>
          </section>

          <section aria-labelledby="berufsrecht-heading">
            <h2 id="berufsrecht-heading" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              Berufsbezeichnung und berufsrechtliche Regelungen
            </h2>
            <p>
              <strong>Berufsbezeichnung:</strong> Meisterbetrieb für Sanitär-, Heizungs- und
              Klimatechnik (SHK)
              <br />
              <strong>Zuständige Kammer:</strong> Handwerkskammer Ulm
              <br />
              <strong>Zuständige Aufsichtsbehörde:</strong> Handwerkskammer Ulm
            </p>
          </section>

          <section aria-labelledby="haftung-heading">
            <h2 id="haftung-heading" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              Haftungsausschluss
            </h2>
            <h3 className="font-semibold text-gray-800 mb-2">Haftung für Inhalte</h3>
            <p className="leading-relaxed">
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
              Tätigkeit hinweisen.
            </p>
            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Haftung für Links</h3>
            <p className="leading-relaxed">
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
              Seiten verantwortlich.
            </p>
          </section>

          <section aria-labelledby="urheberrecht-heading">
            <h2 id="urheberrecht-heading" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              Urheberrecht
            </h2>
            <p className="leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
              Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <section aria-labelledby="streit-heading">
            <h2 id="streit-heading" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              Streitschlichtung
            </h2>
            <p className="leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit.
              Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet,
              an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-purple text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-purple-dark transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </main>
    </div>
  )
}
