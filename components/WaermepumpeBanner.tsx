'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { track } from '@vercel/analytics'
import { X, Thermometer } from 'lucide-react'
import { getNaechstePeriode, getPeriode, letzterTagVor, tageBis } from '@/lib/waermepumpe/foerderung'

const STORAGE_KEY = 'wp_banner_dismissed'
const storage = () => (typeof window !== 'undefined' ? sessionStorage : null)

export default function WaermepumpeBanner() {
  const [visible, setVisible] = useState(false)
  const [formImBlick, setFormImBlick] = useState(false)
  const [heroVorbei, setHeroVorbei] = useState(false)
  const [tage, setTage] = useState<number | null>(null)
  const pathname = usePathname()

  const periode = getPeriode()
  const naechste = getNaechstePeriode()

  // Nicht über dem Kontaktformular einblenden – sonst verdeckt der Banner „Anfrage senden“
  useEffect(() => {
    const form = document.getElementById('kontakt')
    if (!form) return
    const observer = new IntersectionObserver(([e]) => setFormImBlick(e.isIntersecting))
    observer.observe(form)
    return () => observer.disconnect()
  }, [pathname])

  // Erst nach dem Hero zeigen – dort gibt es bereits den Einstieg zur Wärmepumpe
  useEffect(() => {
    const onScroll = () => setHeroVorbei(window.scrollY > window.innerHeight * 0.9)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    // Auf der Wärmepumpen-Seite selbst ist der Hinweis überflüssig
    if (pathname === '/waermepumpe') {
      setVisible(false)
      return
    }
    try {
      if (storage()?.getItem(STORAGE_KEY)) return
    } catch {}
    if (naechste) setTage(tageBis(naechste.ab))
    const timer = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(timer)
  }, [pathname, naechste])

  const dismiss = () => {
    setVisible(false)
    try {
      storage()?.setItem(STORAGE_KEY, '1')
    } catch {}
  }

  return (
    <AnimatePresence>
      {visible && heroVorbei && !formImBlick && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
          role="dialog"
          aria-label="Hinweis Wärmepumpen-Förderung"
        >
          <div className="bg-brand-purple-deep border border-white/10 rounded-2xl shadow-2xl p-5 flex gap-4">
            <div className="bg-brand-green/20 rounded-xl p-2.5 flex-shrink-0 self-start">
              <Thermometer className="w-5 h-5 text-brand-green" aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug">
                Wärmepumpe: bis zu 80&nbsp;% Förderung
              </p>
              <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                {naechste && periode.klimaBonus > 0 ? (
                  <>
                    Klimabonus {periode.klimaBonus} % nur noch bis {letzterTagVor(naechste.ab)}
                    {tage !== null && <> ({tage} Tage)</>} – jetzt Zuschuss berechnen und sichern.
                  </>
                ) : (
                  <>Berechnen Sie in einer Minute, wie viel Zuschuss Ihnen zusteht.</>
                )}
              </p>
              <Link
                href="/waermepumpe#foerderrechner"
                onClick={() => {
                  track('wp_banner_klick')
                  dismiss()
                }}
                className="inline-flex items-center gap-1.5 mt-3 bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
              >
                Förderung berechnen →
              </Link>
            </div>

            <button
              onClick={dismiss}
              className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 self-start"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
