import type { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Haustechnik Andreas Frey',
  description: 'Datenschutzerklärung der Haustechnik Andreas Frey gemäß DSGVO.',
  robots: { index: false, follow: false },
}

export default function Datenschutz() {
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
        <h1 className="text-4xl font-serif font-bold text-brand-purple-deep mb-2">
          Datenschutzerklärung
        </h1>
        <p className="text-gray-400 text-sm mb-10">Zuletzt aktualisiert: März 2024</p>

        <div className="space-y-10 text-gray-700">
          <section aria-labelledby="ds-1">
            <h2 id="ds-1" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              1. Datenschutz auf einen Blick
            </h2>
            <h3 className="font-semibold text-gray-800 mb-2">Allgemeine Hinweise</h3>
            <p className="leading-relaxed">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Datenerfassung auf dieser Website</h3>
            <p className="leading-relaxed">
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber.
              Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>
            <p className="mt-2 leading-relaxed">
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen — etwa
              wenn Sie uns per E-Mail oder Telefon kontaktieren. Andere Daten werden automatisch
              beim Besuch der Website durch unsere IT-Systeme erfasst (vor allem technische Daten
              wie Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
            </p>
          </section>

          <section aria-labelledby="ds-2">
            <h2 id="ds-2" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              2. Verantwortliche Stelle
            </h2>
            <address className="not-italic leading-relaxed">
              <strong>Haustechnik Andreas Frey</strong>
              <br />
              Andreas Frey
              <br />
              Schammenstraße 19
              <br />
              89129 Langenau
              <br />
              Telefon:{' '}
              <a href="tel:+4973453286" className="text-brand-purple hover:underline">
                +49 7345 3286
              </a>
              <br />
              E-Mail:{' '}
              <a href="mailto:info@haustechnik-frey.de" className="text-brand-purple hover:underline">
                info@haustechnik-frey.de
              </a>
            </address>
          </section>

          <section aria-labelledby="ds-3">
            <h2 id="ds-3" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              3. Ihre Rechte
            </h2>
            <p className="leading-relaxed">
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und
              Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem
              das Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine
              Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung
              jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten
              Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
            </p>
            <p className="mt-2 leading-relaxed">
              Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an
              uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen
              Aufsichtsbehörde zu.
            </p>
          </section>

          <section aria-labelledby="ds-4">
            <h2 id="ds-4" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              4. Datenerfassung auf dieser Website
            </h2>
            <h3 className="font-semibold text-gray-800 mb-2">Server-Log-Dateien</h3>
            <p className="leading-relaxed">
              Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten
              Server-Log-Dateien, die Ihr Browser automatisch übermittelt. Dies sind:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600">
              <li>Browsertyp und Browserversion</li>
              <li>Verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
              Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
            </p>
            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Cookies</h3>
            <p className="leading-relaxed">
              Diese Website verwendet technisch notwendige Cookies, um die grundlegenden Funktionen
              der Website zu gewährleisten. Diese Cookies speichern keine personenbezogenen Daten
              und werden nur für den technischen Betrieb benötigt. Sie können Ihren Browser so
              einstellen, dass Sie über das Setzen von Cookies informiert werden.
            </p>
            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Kontaktaufnahme per E-Mail oder Telefon</h3>
            <p className="leading-relaxed">
              Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller
              daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der
              Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben
              wir nicht ohne Ihre Einwilligung weiter. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </section>

          <section aria-labelledby="ds-5">
            <h2 id="ds-5" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              5. Externe Dienste
            </h2>
            <h3 className="font-semibold text-gray-800 mb-2">Google Fonts</h3>
            <p className="leading-relaxed">
              Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten sogenannte Google
              Fonts. Die Google Fonts werden lokal über Next.js geladen. Eine Verbindung zu
              Google-Servern findet dabei nicht statt.
            </p>
            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Unsplash (Bilder)</h3>
            <p className="leading-relaxed">
              Diese Website verwendet Bilder von Unsplash. Dabei können Verbindungen zu den
              Servern von Unsplash aufgebaut werden. Die Bildplatzhalter werden zu einem späteren
              Zeitpunkt durch eigene Projektfotos ersetzt. Für weitere Informationen beachten
              Sie die Datenschutzerklärung von Unsplash: https://unsplash.com/privacy
            </p>
          </section>

          <section aria-labelledby="ds-6">
            <h2 id="ds-6" className="text-xl font-serif font-bold text-brand-purple-deep mb-3">
              6. KI-Badplaner
            </h2>
            <p className="leading-relaxed">
              Auf dieser Website bieten wir einen KI-gestützten Badplaner an, mit dem Sie ein Foto
              Ihres Badezimmers hochladen und eine KI-generierte Visualisierung einer möglichen
              Renovierung erhalten können.
            </p>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Welche Daten werden verarbeitet?</h3>
            <p className="leading-relaxed">
              Wenn Sie den KI-Badplaner nutzen, wird das von Ihnen hochgeladene Foto zur
              Verarbeitung an externe KI-Dienste weitergeleitet. Es werden keine personenbezogenen
              Daten (z. B. Name, E-Mail) erhoben. Das Foto selbst kann jedoch personenbezogene
              Daten enthalten, sofern Personen darauf abgebildet sind.
            </p>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Eingesetzte KI-Dienste</h3>
            <ul className="space-y-3 mt-2">
              <li className="bg-brand-warm rounded-xl p-4 border border-gray-200">
                <p className="font-semibold text-brand-purple-deep text-sm">Anthropic (Claude API)</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Das hochgeladene Foto wird zur strukturellen Bildanalyse an die API von Anthropic PBC
                  (San Francisco, USA) übermittelt. Die Verarbeitung dient ausschließlich dazu, Raumstruktur
                  und vorhandene Einrichtungsgegenstände zu erkennen. Anthropic speichert API-Eingaben
                  nicht dauerhaft für Trainingszwecke.{" "}
                  <a
                    href="https://www.anthropic.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-purple hover:underline"
                  >
                    Datenschutzerklärung Anthropic
                  </a>
                </p>
              </li>
              <li className="bg-brand-warm rounded-xl p-4 border border-gray-200">
                <p className="font-semibold text-brand-purple-deep text-sm">Replicate (Flux Depth Pro)</p>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Zur Generierung des renovierten Badezimmerbildes wird das Foto an Replicate Inc.
                  (San Francisco, USA) übermittelt. Das Bild wird dort mittels des KI-Modells
                  &ldquo;Flux Depth Pro&rdquo; verarbeitet. Replicate speichert hochgeladene Bilder
                  nur für den Zeitraum der Verarbeitung.{" "}
                  <a
                    href="https://replicate.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-purple hover:underline"
                  >
                    Datenschutzerklärung Replicate
                  </a>
                </p>
              </li>
            </ul>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Speicherung</h3>
            <p className="leading-relaxed">
              Ihr hochgeladenes Foto sowie das generierte Ergebnisbild werden auf unserem Server
              intern gespeichert, um die Qualität des KI-Badplaners kontinuierlich zu verbessern.
              Die Bilder werden <strong>nicht veröffentlicht, nicht weitergegeben und nicht für
              andere Zwecke verwendet</strong>. Sie können jederzeit die Löschung Ihrer Daten
              unter{" "}
              <a href="mailto:info@haustechnik-frey.de" className="text-brand-purple hover:underline">
                info@haustechnik-frey.de
              </a>{" "}
              beantragen.
            </p>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Rechtsgrundlage</h3>
            <p className="leading-relaxed">
              Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an der
              Verbesserung unserer digitalen Dienstleistungen gemäß Art. 6 Abs. 1 lit. f DSGVO.
              Durch die aktive Nutzung des KI-Badplaners werden Sie auf die Speicherung
              hingewiesen. Die Nutzung ist vollständig freiwillig.
            </p>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Übermittlung in Drittländer</h3>
            <p className="leading-relaxed">
              Anthropic und Replicate sind US-amerikanische Unternehmen. Die Datenübermittlung
              in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO)
              sowie im Rahmen des EU-U.S. Data Privacy Frameworks.
            </p>

            <h3 className="font-semibold text-gray-800 mb-2 mt-4">Empfehlung</h3>
            <p className="leading-relaxed">
              Bitte laden Sie keine Fotos hoch, auf denen Personen erkennbar abgebildet sind.
              Achten Sie darauf, dass das Foto ausschließlich den Badezimmerraum zeigt.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-purple text-white font-semibold px-6 py-3 rounded-full hover:bg-brand-purple-dark transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
          <Link
            href="/impressum"
            className="inline-flex items-center gap-2 bg-brand-warm text-brand-purple-deep font-semibold px-6 py-3 rounded-full hover:bg-brand-cream transition-colors border border-gray-200"
          >
            Zum Impressum
          </Link>
        </div>
      </main>
    </div>
  )
}
