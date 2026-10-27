'use client'

import { createContext, useContext, useState } from 'react'
import type { Altanlage, Einkommen } from '@/lib/waermepumpe/foerderung'

export interface FoerderAuswahl {
  investition: number
  wohneinheiten: number
  selbstnutzer: boolean
  altanlage: Altanlage
  einkommen: Einkommen
  kindImHaushalt: boolean
}

export interface EignungsErgebnis {
  label: string
  score: number
  waermeverteilung?: 'fbh' | 'heizkoerper' | 'gemischt'
  vorlauf?: 'bis45' | '45-55' | 'ueber55' | 'unbekannt'
  nachbarabstand?: 'gross' | 'klein' | 'unklar'
}

interface WPState {
  foerder: FoerderAuswahl | null
  setFoerder: (f: FoerderAuswahl) => void
  eignung: EignungsErgebnis | null
  setEignung: (e: EignungsErgebnis) => void
}

const WPCtx = createContext<WPState | null>(null)

export function WPProvider({ children }: { children: React.ReactNode }) {
  const [foerder, setFoerder] = useState<FoerderAuswahl | null>(null)
  const [eignung, setEignung] = useState<EignungsErgebnis | null>(null)
  return (
    <WPCtx.Provider value={{ foerder, setFoerder, eignung, setEignung }}>{children}</WPCtx.Provider>
  )
}

export function useWP(): WPState {
  const ctx = useContext(WPCtx)
  if (!ctx) throw new Error('useWP must be used inside <WPProvider>')
  return ctx
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
