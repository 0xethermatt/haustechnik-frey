import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { WPProvider } from '@/components/waermepumpe/WPContext'
import WPHero from '@/components/waermepumpe/WPHero'
import WPSubNav from '@/components/waermepumpe/WPSubNav'
import WPEignungsCheck from '@/components/waermepumpe/WPEignungsCheck'
import WPVorteile from '@/components/waermepumpe/WPVorteile'
import WPSysteme from '@/components/waermepumpe/WPSysteme'
import WPRechner from '@/components/waermepumpe/WPRechner'
import WPWissen from '@/components/waermepumpe/WPWissen'
import WPMythen from '@/components/waermepumpe/WPMythen'
import WPKosten from '@/components/waermepumpe/WPKosten'
import WPAblauf from '@/components/waermepumpe/WPAblauf'
import WPReferenz from '@/components/waermepumpe/WPReferenz'
import WPKIBerater from '@/components/waermepumpe/WPKIBerater'
import WPFAQ from '@/components/waermepumpe/WPFAQ'
import WPAnfrage from '@/components/waermepumpe/WPAnfrage'
import WPMobileCTA from '@/components/waermepumpe/WPMobileCTA'
import { WP_FAQ } from '@/lib/waermepumpe/faq'
import { REFERENZ } from '@/lib/waermepumpe/referenz'

// Förder-Countdown und Fördersätze sind datumsabhängig → täglich neu rendern
export const revalidate = 86400

const PAGE_URL = 'https://haustechnik-frey.de/waermepumpe'

export const metadata: Metadata = {
  title: 'Wärmepumpe Langenau & Ulm – bis 80 % Förderung | Haustechnik Frey',
  description:
    'Wärmepumpe vom Meisterbetrieb: Eignungs-Check, Förderrechner KfW 458, Kosten, Ablauf und kostenloser Wärmepumpen-Check. Planung, Einbau & Förderantrag aus einer Hand – Langenau, Ulm, Heidenheim.',
  keywords: [
    'Wärmepumpe Langenau',
    'Wärmepumpe Ulm',
    'Wärmepumpe Heidenheim',
    'Wärmepumpe Förderung 2026',
    'KfW 458',
    'Wärmepumpe Altbau',
    'Wärmepumpe Kosten',
    'Luft-Wasser-Wärmepumpe',
    'Luft-Wasser-Wärmepumpe Langenau',
    'Luftwärmepumpe Ulm',
    'Heizungstausch Förderung',
    'Wärmepumpe Installateur',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'Wärmepumpe – bis zu 80 % gefördert | Haustechnik Frey Langenau',
    description: 'Eignungs-Check, Förderrechner und kostenloser Wärmepumpen-Check vom Meisterbetrieb.',
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Wärmepumpe: Planung, Installation & Förderantrag',
    serviceType: 'Luft-Wasser-Wärmepumpe – Planung und Installation',
    url: PAGE_URL,
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: 'Haustechnik Andreas Frey',
      url: 'https://haustechnik-frey.de',
      telephone: '+4973453286',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Schammenstraße 19',
        addressLocality: 'Langenau',
        postalCode: '89129',
        addressCountry: 'DE',
      },
    },
    areaServed: ['Langenau', 'Ulm', 'Neu-Ulm', 'Heidenheim', 'Blaubeuren', 'Herbrechtingen'].map((name) => ({
      '@type': 'City',
      name,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: WP_FAQ.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haustechnik-frey.de' },
      { '@type': 'ListItem', position: 2, name: 'Heizung', item: 'https://haustechnik-frey.de/leistungen/heizung' },
      { '@type': 'ListItem', position: 3, name: 'Wärmepumpe', item: PAGE_URL },
    ],
  },
]

const SUBNAV = [
  { id: 'eignung', label: 'Eignung' },
  { id: 'foerderrechner', label: 'Förderung' },
  { id: 'wissen', label: 'Kosten & Ablauf' },
  { id: 'referenz', label: 'Praxis' },
  { id: 'ki-berater', label: 'KI-Berater' },
  { id: 'faq', label: 'FAQ' },
  { id: 'anfrage', label: 'Check starten' },
]

export default function WaermepumpePage() {
  const advisorEnabled =
    Boolean(process.env.OPENAI_API_KEY) && process.env.NEXT_PUBLIC_ENERGY_ADVISOR_ENABLED !== 'false'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navigation />
      <WPProvider>
        <main>
          <WPHero />
          <WPSubNav
            items={SUBNAV.filter(
              (i) => (advisorEnabled || i.id !== 'ki-berater') && (REFERENZ.schritte.length > 0 || i.id !== 'referenz')
            )}
          />
          <WPEignungsCheck />
          <WPVorteile />
          <WPRechner />
          <WPWissen
            tabs={[
              { id: 'kosten', label: 'Kosten', content: <WPKosten /> },
              { id: 'ablauf', label: 'Ablauf', content: <WPAblauf /> },
              { id: 'technik', label: 'Technik', content: <WPSysteme /> },
              { id: 'mythen', label: 'Mythen', content: <WPMythen /> },
            ]}
          />
          <WPReferenz />
          {advisorEnabled && <WPKIBerater />}
          <WPFAQ />
          <WPAnfrage />
        </main>
        <WPMobileCTA />
      </WPProvider>
      <Footer />
    </>
  )
}
