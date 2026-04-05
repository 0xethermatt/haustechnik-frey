'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone } from 'lucide-react'
import Link from 'next/link'
import Logo from './Logo'

type NavLink = { label: string; href: string; accent?: boolean; isPage?: boolean }

const navLinks: NavLink[] = [
  { label: 'Leistungen', href: '#leistungen' },
  { label: 'So läufts ab', href: '#prozess' },
  { label: 'Projekte', href: '#projekte' },
  { label: 'Rechner', href: '#heizungsrechner' },
  { label: 'Über uns', href: '#ueber-uns' },
  { label: 'KI-Badplaner', href: '/bad-designer', isPage: true },
  { label: 'FAQ', href: '/faq', isPage: true },
  { label: 'Karriere', href: '/karriere', isPage: true },
  { label: 'Kontakt', href: '#kontakt' },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setMenuOpen(false)
    if (pathname === '/') {
      // Already on homepage — just scroll to section
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      // On a subpage — navigate to homepage with hash
      router.push('/' + href)
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-brand-purple-deep shadow-lg shadow-brand-purple-deep/20 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between" aria-label="Hauptnavigation">
            {/* Logo */}
            <Link
              href="/"
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
                setMenuOpen(false)
              }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded-lg"
              aria-label="Zur Startseite"
            >
              <Logo size={40} withText={true} textColor="#FFFFFF" />
            </Link>

            {/* Desktop Nav Links */}
            <ul className="hidden md:flex items-center gap-5 lg:gap-7" role="list">
              {navLinks.map((link) => (
                <li key={link.href}>
                  {link.isPage ? (
                    <Link
                      href={link.href}
                      className="font-medium text-sm tracking-wide transition-colors duration-200 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded text-white/80 hover:text-white"
                    >
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-orange rounded-full transition-all duration-300 group-hover:w-full" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleNavClick(link.href)}
                      className={`font-medium text-sm tracking-wide transition-colors duration-200 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange rounded ${
                        link.accent
                          ? 'text-brand-orange hover:text-brand-orange-light'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {link.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-orange rounded-full transition-all duration-300 group-hover:w-full" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="tel:+4973453286"
                className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors duration-200"
                aria-label="Anrufen"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden lg:inline">07345 3286</span>
              </a>
              <button
                onClick={() => handleNavClick('#kontakt')}
                className="bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-orange-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-purple-deep"
              >
                Kontakt aufnehmen
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-brand-purple-deep/97 backdrop-blur-md flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-5">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                aria-label="Zur Startseite"
              >
                <Logo size={40} withText={true} textColor="#FFFFFF" />
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Menü schließen"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex flex-col gap-2 px-4 mt-8" aria-label="Mobile Navigation">
              {navLinks.map((link, i) => (
                link.isPage ? (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + 0.1 }}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block text-left text-2xl font-serif font-bold py-4 border-b border-white/10 hover:text-brand-orange transition-colors focus:outline-none text-white"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    onClick={() => handleNavClick(link.href)}
                    className={`text-left text-2xl font-serif font-bold py-4 border-b border-white/10 hover:text-brand-orange transition-colors focus:outline-none ${
                      link.accent ? 'text-brand-orange' : 'text-white'
                    }`}
                  >
                    {link.label}
                  </motion.button>
                )
              ))}
            </nav>

            <div className="mt-auto px-4 pb-12 flex flex-col gap-3">
              <a
                href="tel:+4973453286"
                className="flex items-center justify-center gap-2 bg-white/10 text-white font-medium px-6 py-4 rounded-2xl hover:bg-white/20 transition-colors text-lg"
              >
                <Phone className="w-5 h-5" />
                07345 3286
              </a>
              <button
                onClick={() => handleNavClick('#kontakt')}
                className="bg-brand-orange text-white font-bold px-6 py-4 rounded-2xl hover:bg-brand-orange-dark transition-colors text-lg"
              >
                Kontakt aufnehmen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
