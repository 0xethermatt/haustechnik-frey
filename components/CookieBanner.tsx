'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import Link from 'next/link'

const COOKIE_KEY = 'frey-cookies-accepted'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY)
    if (!stored) {
      // Small delay so it doesn't pop up immediately
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
        >
          <div className="bg-white rounded-2xl shadow-card-hover border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-brand-orange flex-shrink-0" aria-hidden="true" />
                <h3 id="cookie-title" className="font-semibold text-brand-purple-deep text-sm">
                  Cookies & Datenschutz
                </h3>
              </div>
              <button
                onClick={decline}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple rounded"
                aria-label="Ablehnen und schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p id="cookie-desc" className="text-xs text-gray-500 leading-relaxed mb-4">
              Diese Website verwendet technisch notwendige Cookies für einen reibungslosen Betrieb.
              Weitere Informationen finden Sie in unserer{' '}
              <Link
                href="/datenschutz"
                className="text-brand-purple underline hover:text-brand-purple-dark"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>
            <div className="flex gap-2">
              <button
                onClick={decline}
                className="flex-1 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                Ablehnen
              </button>
              <button
                onClick={accept}
                className="flex-1 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark py-2.5 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                Akzeptieren
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
