import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import BadplanerBanner from '@/components/BadplanerBanner'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://haustechnik-frey.de'),
  title: 'Haustechnik Andreas Frey | Heizung · Sanitär · Lüftung · Solar in Langenau',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  description:
    'Ihr Meisterbetrieb für Heizung, Sanitär, Lüftung und Solar in Langenau (Baden-Württemberg). Seit über 30 Jahren selbständig — persönlich, zuverlässig, regional. Jetzt Kontakt aufnehmen!',
  keywords: [
    'Heizung Langenau',
    'Sanitär Langenau',
    'Lüftung Langenau',
    'Solar Langenau',
    'Haustechnik Langenau',
    'Meisterbetrieb Langenau',
    'Wärmepumpe Langenau',
    'Badsanierung Langenau',
    'Andreas Frey Langenau',
    'SHK Langenau',
    'Heizung Baden-Württemberg',
  ],
  authors: [{ name: 'Andreas Frey' }],
  creator: 'Haustechnik Andreas Frey',
  publisher: 'Haustechnik Andreas Frey',
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://haustechnik-frey.de',
    siteName: 'Haustechnik Andreas Frey',
    title: 'Haustechnik Andreas Frey | Heizung · Sanitär · Lüftung · Solar',
    description:
      'Meisterbetrieb für Heizung, Sanitär, Lüftung und Solar in Langenau. Seit über 30 Jahren selbständig — 24/6 erreichbar.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Haustechnik Frey Langenau' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haustechnik Andreas Frey | Heizung · Sanitär · Lüftung · Solar in Langenau',
    description:
      'Meisterbetrieb für Heizung, Sanitär, Lüftung und Solar in Langenau. Seit über 30 Jahren selbständig — 24/6 erreichbar.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://haustechnik-frey.de',
  },
  verification: {
    google: '',
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: 'Haustechnik Andreas Frey',
  alternateName: 'Haustechnik Frey',
  description:
    'Meisterbetrieb für Heizung, Sanitär, Lüftung und Solar in Langenau (Baden-Württemberg). Seit über 30 Jahren selbständig.',
  url: 'https://haustechnik-frey.de',
  telephone: '+4973453286',
  email: 'info@haustechnik-frey.de',
  foundingDate: '1994',
  slogan: 'Ihr Partner für Wärme und Wasser in Langenau & Umgebung',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Schammenstraße 19',
    addressLocality: 'Langenau',
    postalCode: '89129',
    addressRegion: 'Baden-Württemberg',
    addressCountry: 'DE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 48.4964,
    longitude: 10.1278,
  },
  areaServed: [
    { '@type': 'City', name: 'Langenau' },
    { '@type': 'City', name: 'Ulm' },
    { '@type': 'City', name: 'Neu-Ulm' },
    { '@type': 'City', name: 'Heidenheim' },
    { '@type': 'City', name: 'Blaubeuren' },
    { '@type': 'City', name: 'Herbrechtingen' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: '08:00',
      closes: '13:00',
    },
  ],
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Rechnung, Bar, Überweisung',
  hasCredential: {
    '@type': 'EducationalOccupationalCredential',
    name: 'Meisterbrief SHK',
  },
  sameAs: [],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Haustechnik-Leistungen',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Heizungsinstallation', url: 'https://haustechnik-frey.de/leistungen/heizung' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Wärmepumpe Installation', url: 'https://haustechnik-frey.de/leistungen/heizung' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Pelletheizung', url: 'https://haustechnik-frey.de/leistungen/heizung' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Badsanierung', url: 'https://haustechnik-frey.de/leistungen/sanitaer' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sanitärinstallation', url: 'https://haustechnik-frey.de/leistungen/sanitaer' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Lüftungsanlagen', url: 'https://haustechnik-frey.de/' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Solarthermie', url: 'https://haustechnik-frey.de/' } },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="theme-color" content="#6B2D8B" />
        <meta name="geo.region" content="DE-BW" />
        <meta name="geo.placename" content="Langenau" />
        <meta name="geo.position" content="48.4964;10.1278" />
        <meta name="ICBM" content="48.4964, 10.1278" />
      </head>
      <body className="font-sans bg-brand-cream text-brand-purple-deep antialiased">
        {children}
        <CookieBanner />
        <BadplanerBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
