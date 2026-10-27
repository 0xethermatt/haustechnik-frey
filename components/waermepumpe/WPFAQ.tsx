'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { WP_FAQ, type WPFaqItem } from '@/lib/waermepumpe/faq'

const CATEGORIES: WPFaqItem['category'][] = ['Eignung', 'Förderung', 'Kosten', 'Technik', 'Ablauf']
const TOP_N = 5

export default function WPFAQ() {
  const [filter, setFilter] = useState<WPFaqItem['category'] | 'Alle'>('Alle')
  const [open, setOpen] = useState<number | null>(null)
  const [alle, setAlle] = useState(false)

  const gefiltert = WP_FAQ.map((item, index) => ({ ...item, index })).filter(
    (i) => filter === 'Alle' || i.category === filter
  )
  const items = alle || filter !== 'Alle' ? gefiltert : gefiltert.slice(0, TOP_N)

  return (
    <section id="faq" className="scroll-mt-32 py-14 sm:py-20 bg-brand-cream" aria-labelledby="wp-faq-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-block text-brand-orange-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Häufige Fragen
          </span>
          <h2 id="wp-faq-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-purple-deep">
            Alles, was Sie wissen wollen
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="FAQ filtern">
          {(['Alle', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              onClick={() => {
                setFilter(c)
                setOpen(null)
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                filter === c ? 'bg-brand-purple text-white' : 'bg-white text-brand-purple-deep/70 hover:bg-brand-purple/10 border border-brand-purple/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const isOpen = open === item.index
            return (
              <div key={item.question} className="bg-white rounded-2xl border border-brand-purple/10 overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : item.index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-4 sm:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
                >
                  <span className="font-semibold text-brand-purple-deep">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-brand-purple flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-5 sm:px-6 pb-5 text-brand-purple-deep/70 leading-relaxed">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {filter === 'Alle' && !alle && gefiltert.length > TOP_N && (
          <div className="text-center mt-6">
            <button
              onClick={() => setAlle(true)}
              className="inline-flex items-center gap-2 text-brand-purple font-semibold border-2 border-brand-purple/30 hover:border-brand-purple rounded-full px-6 py-3 transition-colors"
            >
              Alle {gefiltert.length} Fragen anzeigen
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
