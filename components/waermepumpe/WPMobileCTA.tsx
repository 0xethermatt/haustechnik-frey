'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardCheck, Phone } from 'lucide-react'
import { scrollToId } from './WPContext'

export default function WPMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Ausblenden, solange Formular oder Chat sichtbar sind – die Leiste würde Eingaben verdecken
    const sichtbar = new Set<string>()
    const update = () => setVisible(window.scrollY > 700 && sichtbar.size === 0)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? sichtbar.add(e.target.id) : sichtbar.delete(e.target.id)))
      update()
    })
    ;['anfrage', 'ki-berater'].forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-brand-purple/10 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-3"
        >
          <a
            href="tel:+4973453286"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 border-brand-purple/15 text-brand-purple-deep font-semibold"
            aria-label="Anrufen: 07345 3286"
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
          </a>
          <button
            onClick={() => scrollToId('anfrage')}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-orange text-white font-bold py-3 rounded-full"
          >
            <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
            Wärmepumpen-Check starten
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
