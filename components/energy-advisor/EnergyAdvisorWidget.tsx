'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Zap } from 'lucide-react'
import EnergyAdvisorChat from './EnergyAdvisorChat'

interface EnergyAdvisorWidgetProps {
  /** Embedded mode: renders the full chat without the floating bubble */
  embedded?: boolean
}

export default function EnergyAdvisorWidget({ embedded = false }: EnergyAdvisorWidgetProps) {
  const [open, setOpen] = useState(false)

  // Feature flag — NEXT_PUBLIC_ENERGY_ADVISOR_ENABLED must be "true"
  if (process.env.NEXT_PUBLIC_ENERGY_ADVISOR_ENABLED !== 'true' && !embedded) {
    return null
  }

  if (embedded) {
    return (
      <div className="flex flex-col bg-brand-cream rounded-2xl overflow-hidden border border-brand-purple/10 shadow-card" style={{ minHeight: '520px', maxHeight: '700px' }}>
        <ChatHeader onClose={undefined} />
        <div className="flex-1 min-h-0">
          <EnergyAdvisorChat />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-purple hover:bg-brand-purple-dark shadow-purple-glow flex items-center justify-center text-white transition-colors"
            aria-label="Energieberater öffnen"
          >
            <Zap className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-brand-purple/10 bg-brand-cream"
            style={{ maxHeight: 'min(600px, calc(100vh - 3.5rem))' }}
          >
            <ChatHeader onClose={() => setOpen(false)} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <EnergyAdvisorChat />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ChatHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-brand-purple-deep text-white flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center">
        <MessageCircle className="w-4 h-4 text-brand-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-none">Energieberater</p>
        <p className="text-white/50 text-xs mt-0.5">Haustechnik Frey · Langenau</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
