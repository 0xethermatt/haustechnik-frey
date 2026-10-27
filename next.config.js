/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/bad-designer',
        destination: 'https://bad.haustechnik-frey.de/',
        permanent: false,
      },
      // Kurz-URLs für Flyer, Fahrzeugbeschriftung & Telefon: haustechnik-frey.de/wärmepumpe
      // (Next.js vergleicht Pfade ohne Groß-/Kleinschreibung, /Wärmepumpe ist damit abgedeckt)
      { source: '/w%C3%A4rmepumpe', destination: '/waermepumpe', permanent: true },
      { source: '/wärmepumpe', destination: '/waermepumpe', permanent: true },
      { source: '/waermepumpen', destination: '/waermepumpe', permanent: true },
      { source: '/wp', destination: '/waermepumpe', permanent: true },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'waermepumpe.haustechnik-frey.de' }],
        destination: 'https://haustechnik-frey.de/waermepumpe',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
