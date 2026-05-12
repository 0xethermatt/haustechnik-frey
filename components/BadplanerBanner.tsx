'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'ki_badplaner_banner_dismissed'

export default function BadplanerBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(STORAGE_KEY)) return
    const timer = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
        >
          <div className="bg-brand-purple-deep border border-white/10 rounded-2xl shadow-2xl p-5 flex gap-4">
            {/* Icon */}
            <div className="bg-brand-orange/20 rounded-xl p-2.5 flex-shrink-0 self-start">
              <Sparkles className="w-5 h-5 text-brand-orange" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug">
                Neu: KI-Badplaner
              </p>
              <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                Laden Sie ein Foto hoch — die KI renoviert Ihr Bad in Sekunden. Kostenlos & unverbindlich.
              </p>
              <a
                href="https://bad.haustechnik-frey.de/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="inline-flex items-center gap-1.5 mt-3 bg-brand-orange hover:bg-brand-orange-dark text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
              >
                Jetzt ausprobieren →
              </a>
            </div>

            {/* Close */}
            <button
              onClick={dismiss}
              className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0 self-start"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
