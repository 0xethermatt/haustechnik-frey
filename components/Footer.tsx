import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="bg-brand-purple-deep py-12"
      role="contentinfo"
      aria-label="Seitenfußzeile"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Logo + Company */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Logo size={44} withText={true} textColor="#FFFFFF" />
            <p className="text-white/40 text-sm text-center md:text-left max-w-xs leading-relaxed">
              Meisterbetrieb für Heizung, Sanitär,
              <br />
              Lüftung und Solar in Langenau.
            </p>
            <address className="not-italic text-white/40 text-xs text-center md:text-left leading-relaxed">
              Schammenstraße 19 · 89129 Langenau
              <br />
              Tel:{' '}
              <a
                href="tel:+4973453286"
                className="hover:text-white/70 transition-colors"
              >
                07345 3286
              </a>{' '}
              · Mobil:{' '}
              <a
                href="tel:+491727309901"
                className="hover:text-white/70 transition-colors"
              >
                0172 7309901
              </a>
            </address>
          </div>

          {/* Links */}
          <nav aria-label="Footer Navigation">
            <ul className="flex flex-wrap justify-center md:justify-end gap-6" role="list">
              <li>
                <Link
                  href="/karriere"
                  className="text-white/40 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                >
                  Karriere
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-white/40 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="text-white/40 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                >
                  Impressum
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-white/40 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <a
                  href="mailto:info@haustechnik-frey.de"
                  className="text-white/40 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded"
                >
                  info@haustechnik-frey.de
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Divider + Copyright */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/25 text-xs">
          <span>
            © {year} Haustechnik Andreas Frey · Alle Rechte vorbehalten
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" aria-hidden="true" />
            Meisterbetrieb · Langenau (Baden-Württemberg)
          </span>
        </div>
      </div>
    </footer>
  )
}
