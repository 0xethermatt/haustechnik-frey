'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Building2,
  Building,
  Flame,
  Droplets,
  Zap,
  Thermometer,
  Leaf,
  Sun,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Phone,
  TrendingDown,
  BadgeEuro,
  Percent,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Gebaeudetyp = 'einfamilienhaus' | 'mehrfamilienhaus' | 'wohnung'
type Baujahr = 'vor1978' | '1978-2000' | '2001-2015' | 'nach2015'
type AktuellesSystem = 'gas' | 'oel' | 'nachtspeicher' | 'waermepumpe' | 'fernwaerme'
type Heizloesung = 'waermepumpe' | 'pellet' | 'gas-brennwert' | 'solar-kombi'

interface WizardState {
  step: number
  gebaeudetyp: Gebaeudetyp | null
  wohnflaeche: number
  baujahr: Baujahr | null
  aktuellesSystem: AktuellesSystem | null
  heizloesung: Heizloesung | null
}

interface CalcResult {
  bruttoMin: number
  bruttoMax: number
  begPct: number
  begNote: string
  subsidyMin: number
  subsidyMax: number
  netMin: number
  netMax: number
  annualSavings: number
  paybackYears: number | null
  recommendation: string
  noSubsidy: boolean
}

// ─── Calculation logic ────────────────────────────────────────────────────────

const BASE_COSTS: Record<Heizloesung, { min: number; max: number }> = {
  waermepumpe:      { min: 18000, max: 35000 },
  pellet:           { min: 15000, max: 25000 },
  'gas-brennwert':  { min:  5500, max: 10000 },
  'solar-kombi':    { min: 20000, max: 32000 },
}

const SPECIFIC_DEMAND: Record<Baujahr, number> = {
  'vor1978':    220,
  '1978-2000':  160,
  '2001-2015':  100,
  'nach2015':    65,
}

const CURRENT_ENERGY_PRICE: Record<AktuellesSystem, number> = {
  gas:           0.11,
  oel:           0.09,
  nachtspeicher: 0.28,
  waermepumpe:   0.12,
  fernwaerme:    0.13,
}

const NEW_SYSTEM_COST_PER_KWH: Record<Heizloesung, number> = {
  waermepumpe:     0.045,
  pellet:          0.058,
  'gas-brennwert': 0.095,
  'solar-kombi':   0.038,
}

function sizeMultiplier(sqm: number): number {
  if (sqm <= 80)  return 0.82
  if (sqm <= 120) return 0.93
  if (sqm <= 180) return 1.00
  if (sqm <= 250) return 1.18
  return 1.35
}

const BUILDING_MULT: Record<Gebaeudetyp, number> = {
  einfamilienhaus:  1.00,
  wohnung:          0.72,
  mehrfamilienhaus: 1.65,
}

function getBeg(
  loesung: Heizloesung,
  current: AktuellesSystem
): { pct: number; note: string } {
  if (loesung === 'gas-brennwert') {
    return {
      pct: 0,
      note: 'Gas-Brennwert ist seit 2024 nicht mehr über die BEG förderfähig.',
    }
  }
  let pct = 30
  if (['oel', 'gas', 'nachtspeicher'].includes(current)) pct += 5   // Klimaschutz-Bonus
  if (['oel', 'nachtspeicher'].includes(current)) pct += 5          // Heizungstausch-Bonus
  return {
    pct,
    note: `BEG EM ${pct}% (inkl. Boni für Heizungstausch)`,
  }
}

function calcResult(s: WizardState): CalcResult {
  const { gebaeudetyp, wohnflaeche, baujahr, aktuellesSystem, heizloesung } = s
  if (!gebaeudetyp || !baujahr || !aktuellesSystem || !heizloesung) {
    return {} as CalcResult
  }

  const base = BASE_COSTS[heizloesung]
  const sizeMult = sizeMultiplier(wohnflaeche)
  const buildMult = BUILDING_MULT[gebaeudetyp]

  const bruttoMin = Math.round(base.min * sizeMult * buildMult / 100) * 100
  const bruttoMax = Math.round(base.max * sizeMult * buildMult / 100) * 100
  const bruttoMid = (bruttoMin + bruttoMax) / 2

  const { pct: begPct, note: begNote } = getBeg(heizloesung, aktuellesSystem)

  const maxFundable = gebaeudetyp === 'mehrfamilienhaus' ? 75000 : 30000
  const subsidyCap = maxFundable * (begPct / 100)
  const subsidyMid = Math.min(bruttoMid * (begPct / 100), subsidyCap)
  const subsidyMin = Math.round(subsidyMid * 0.88 / 100) * 100
  const subsidyMax = Math.round(subsidyMid * 1.12 / 100) * 100

  const netMin = Math.max(Math.round((bruttoMin - subsidyMax) / 100) * 100, 0)
  const netMax = Math.max(Math.round((bruttoMax - subsidyMin) / 100) * 100, 0)

  // Annual cost comparison
  const annualDemand = wohnflaeche * SPECIFIC_DEMAND[baujahr]
  const currentAnnual = annualDemand * CURRENT_ENERGY_PRICE[aktuellesSystem]
  const newAnnual = annualDemand * NEW_SYSTEM_COST_PER_KWH[heizloesung]
  const annualSavings = Math.max(Math.round((currentAnnual - newAnnual) / 10) * 10, 0)

  const netMid = (netMin + netMax) / 2
  const paybackYears =
    annualSavings > 0 ? Math.round((netMid / annualSavings) * 10) / 10 : null

  // Recommendation text
  const loesungLabel: Record<Heizloesung, string> = {
    waermepumpe: 'Wärmepumpe',
    pellet: 'Pelletheizung',
    'gas-brennwert': 'Gas-Brennwertanlage',
    'solar-kombi': 'Solar-Wärmepumpen-Kombination',
  }
  const currentLabel: Record<AktuellesSystem, string> = {
    gas: 'Gasheizung',
    oel: 'Ölheizung',
    nachtspeicher: 'Nachtspeicherheizung',
    waermepumpe: 'bestehenden Wärmepumpe',
    fernwaerme: 'Fernwärme',
  }
  const bajrLabel: Record<Baujahr, string> = {
    'vor1978': 'vor 1978',
    '1978-2000': 'zwischen 1978 und 2000',
    '2001-2015': 'zwischen 2001 und 2015',
    'nach2015': 'nach 2015',
  }

  let recommendation = ''
  if (heizloesung === 'gas-brennwert') {
    recommendation = `Die ${loesungLabel[heizloesung]} ist die günstigste Option in der Anschaffung. Beachten Sie jedoch: Sie erhalten keine staatliche Förderung und ab 2045 dürfen fossile Heizungen nicht mehr betrieben werden. Für eine langfristige Planung empfehlen wir eine erneuerbare Alternative.`
  } else if (heizloesung === 'waermepumpe' && baujahr === 'vor1978') {
    recommendation = `Für ein Gebäude aus ${bajrLabel[baujahr]} lohnt sich eine Wärmepumpe besonders in Kombination mit einer Gebäudedämmung. Mit ${begPct}% BEG-Förderung und dem Tausch der ${currentLabel[aktuellesSystem]} erzielen Sie die maximale Einsparung.`
  } else {
    recommendation = `Die ${loesungLabel[heizloesung]} ist eine ausgezeichnete Wahl für Ihr ${gebaeudetyp === 'einfamilienhaus' ? 'Einfamilienhaus' : gebaeudetyp === 'wohnung' ? 'Wohnung' : 'Gebäude'} (Baujahr ${bajrLabel[baujahr]}). Mit ${begPct > 0 ? `${begPct}% staatlicher Förderung und ` : ''}${annualSavings > 0 ? `ca. ${annualSavings.toLocaleString('de-DE')} € jährlicher Ersparnis` : 'modernen Betriebskosten'} ist diese Lösung wirtschaftlich attraktiv.`
  }

  return {
    bruttoMin,
    bruttoMax,
    begPct,
    begNote,
    subsidyMin,
    subsidyMax,
    netMin,
    netMax,
    annualSavings,
    paybackYears,
    recommendation,
    noSubsidy: begPct === 0,
  }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] } },
  exit: (dir: number) => ({
    x: dir > 0 ? -50 : 50,
    opacity: 0,
    transition: { duration: 0.22 },
  }),
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface OptionCardProps {
  icon: React.ReactNode
  label: string
  sublabel?: string
  selected: boolean
  onClick: () => void
  accent?: string
}

function OptionCard({ icon, label, sublabel, selected, onClick, accent = 'brand-orange' }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange
        ${selected
          ? 'border-brand-orange bg-brand-orange/8 shadow-orange-glow/30'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-card'
        }`}
    >
      <div
        className={`p-3 rounded-xl transition-colors duration-200 ${
          selected ? 'bg-brand-orange/15 text-brand-orange' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {icon}
      </div>
      <span className={`font-semibold text-sm leading-tight ${selected ? 'text-brand-purple-deep' : 'text-gray-600'}`}>
        {label}
      </span>
      {sublabel && (
        <span className={`text-[11px] leading-tight ${selected ? 'text-brand-orange' : 'text-gray-400'}`}>
          {sublabel}
        </span>
      )}
    </button>
  )
}

// ─── Step renderers ───────────────────────────────────────────────────────────

function Step1({
  state,
  setState,
  goTo,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  goTo: (n: number) => void
}) {
  const options: { value: Gebaeudetyp; label: string; sublabel: string; icon: React.ReactNode }[] = [
    { value: 'einfamilienhaus', label: 'Einfamilienhaus', sublabel: 'Freistehendes / Reihenhaus', icon: <Home className="w-7 h-7" /> },
    { value: 'mehrfamilienhaus', label: 'Mehrfamilienhaus', sublabel: '3 + Wohneinheiten', icon: <Building2 className="w-7 h-7" /> },
    { value: 'wohnung', label: 'Wohnung', sublabel: 'Einzelne Einheit', icon: <Building className="w-7 h-7" /> },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-serif font-bold text-brand-purple-deep mb-1">
          Was möchten Sie beheizen?
        </h3>
        <p className="text-sm text-gray-400">Wählen Sie Ihren Gebäudetyp</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {options.map((o) => (
          <OptionCard
            key={o.value}
            icon={o.icon}
            label={o.label}
            sublabel={o.sublabel}
            selected={state.gebaeudetyp === o.value}
            onClick={() => {
              setState((s) => ({ ...s, gebaeudetyp: o.value }))
              setTimeout(() => goTo(2), 180)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function Step2({
  state,
  setState,
  goTo,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  goTo: (n: number) => void
}) {
  const min = 40
  const max = 400
  const pct = ((state.wohnflaeche - min) / (max - min)) * 100

  const sizeHint =
    state.wohnflaeche <= 80
      ? 'Kleine Wohnung / Apartment'
      : state.wohnflaeche <= 130
      ? 'Typisches Einfamilienhaus'
      : state.wohnflaeche <= 200
      ? 'Großes Einfamilienhaus'
      : 'Großes Haus / Mehrfamilienhaus'

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-xl font-serif font-bold text-brand-purple-deep mb-1">
          Wie groß ist die Wohnfläche?
        </h3>
        <p className="text-sm text-gray-400">Bewegen Sie den Regler oder tippen Sie den Wert ein</p>
      </div>

      {/* Display */}
      <div className="text-center">
        <span className="text-6xl font-serif font-bold text-brand-purple-deep">
          {state.wohnflaeche}
        </span>
        <span className="text-3xl font-serif font-bold text-brand-purple-deep ml-1">m²</span>
        <p className="text-sm text-gray-400 mt-2">{sizeHint}</p>
      </div>

      {/* Slider */}
      <div className="px-2">
        <input
          type="range"
          min={min}
          max={max}
          step={5}
          value={state.wohnflaeche}
          onChange={(e) => setState((s) => ({ ...s, wohnflaeche: Number(e.target.value) }))}
          style={{ '--range-pct': `${pct}%` } as React.CSSProperties}
          aria-label="Wohnfläche in Quadratmeter"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>40 m²</span>
          <span>400 m²</span>
        </div>
      </div>

      <button
        onClick={() => goTo(3)}
        className="flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-semibold px-6 py-3 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange w-full sm:w-auto sm:self-end"
      >
        Weiter <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function Step3({
  state,
  setState,
  goTo,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  goTo: (n: number) => void
}) {
  const options: { value: Baujahr; label: string; sublabel: string }[] = [
    { value: 'vor1978',    label: 'Vor 1978',      sublabel: 'Energieklasse G / H' },
    { value: '1978-2000',  label: '1978 – 2000',   sublabel: 'Energieklasse D / E' },
    { value: '2001-2015',  label: '2001 – 2015',   sublabel: 'Energieklasse C / D' },
    { value: 'nach2015',   label: 'Nach 2015',     sublabel: 'Energieklasse A / B' },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-serif font-bold text-brand-purple-deep mb-1">
          Wann wurde das Gebäude gebaut?
        </h3>
        <p className="text-sm text-gray-400">Das Baujahr beeinflusst den Energiebedarf</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <OptionCard
            key={o.value}
            icon={<span className="text-xl font-serif font-bold">{o.value === 'vor1978' ? '70s' : o.value === '1978-2000' ? '90s' : o.value === '2001-2015' ? '00s' : '15+'}</span>}
            label={o.label}
            sublabel={o.sublabel}
            selected={state.baujahr === o.value}
            onClick={() => {
              setState((s) => ({ ...s, baujahr: o.value }))
              setTimeout(() => goTo(4), 180)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function Step4({
  state,
  setState,
  goTo,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  goTo: (n: number) => void
}) {
  const options: { value: AktuellesSystem; label: string; sublabel: string; icon: React.ReactNode }[] = [
    { value: 'gas',           label: 'Gas',              sublabel: 'Ausstieg geplant (2045)',     icon: <Flame className="w-6 h-6" /> },
    { value: 'oel',           label: 'Öl',               sublabel: 'Hohe Förderung beim Tausch', icon: <Droplets className="w-6 h-6" /> },
    { value: 'nachtspeicher', label: 'Nachtspeicher',    sublabel: 'Hohe Stromkosten',            icon: <Zap className="w-6 h-6" /> },
    { value: 'waermepumpe',   label: 'Wärmepumpe',       sublabel: 'Bereits modern',              icon: <Thermometer className="w-6 h-6" /> },
    { value: 'fernwaerme',    label: 'Fernwärme',        sublabel: 'Netzgebunden',                icon: <span className="text-xl">⌁</span> },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-serif font-bold text-brand-purple-deep mb-1">
          Was haben Sie aktuell?
        </h3>
        <p className="text-sm text-gray-400">Ihr bestehendes Heizsystem</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((o) => (
          <OptionCard
            key={o.value}
            icon={o.icon}
            label={o.label}
            sublabel={o.sublabel}
            selected={state.aktuellesSystem === o.value}
            onClick={() => {
              setState((s) => ({ ...s, aktuellesSystem: o.value }))
              setTimeout(() => goTo(5), 180)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function Step5({
  state,
  setState,
  goTo,
}: {
  state: WizardState
  setState: React.Dispatch<React.SetStateAction<WizardState>>
  goTo: (n: number) => void
}) {
  const options: { value: Heizloesung; label: string; sublabel: string; icon: React.ReactNode; tag: string; tagColor: string }[] = [
    {
      value: 'waermepumpe',
      label: 'Wärmepumpe',
      sublabel: 'Effizient & zukunftssicher',
      icon: <Thermometer className="w-6 h-6" />,
      tag: 'BEG bis 40 %',
      tagColor: 'bg-brand-green/15 text-brand-green',
    },
    {
      value: 'pellet',
      label: 'Pelletheizung',
      sublabel: 'CO₂-neutral & günstig',
      icon: <Leaf className="w-6 h-6" />,
      tag: 'BEG bis 35 %',
      tagColor: 'bg-brand-green/15 text-brand-green',
    },
    {
      value: 'gas-brennwert',
      label: 'Gas-Brennwert',
      sublabel: 'Günstigste Anschaffung',
      icon: <Flame className="w-6 h-6" />,
      tag: 'Keine Förderung',
      tagColor: 'bg-gray-100 text-gray-400',
    },
    {
      value: 'solar-kombi',
      label: 'Solar-Kombi',
      sublabel: 'WP + Solarthermie',
      icon: <Sun className="w-6 h-6" />,
      tag: 'BEG bis 40 %',
      tagColor: 'bg-brand-green/15 text-brand-green',
    },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-xl font-serif font-bold text-brand-purple-deep mb-1">
          Welche Lösung interessiert Sie?
        </h3>
        <p className="text-sm text-gray-400">Wählen Sie Ihr Wunschsystem</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              setState((s) => ({ ...s, heizloesung: o.value }))
              setTimeout(() => goTo(6), 180)
            }}
            className={`flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange
              ${state.heizloesung === o.value
                ? 'border-brand-orange bg-brand-orange/8 shadow-orange-glow/30'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-card'
              }`}
          >
            <div className={`p-2.5 rounded-xl w-fit ${state.heizloesung === o.value ? 'bg-brand-orange/15 text-brand-orange' : 'bg-gray-100 text-gray-400'}`}>
              {o.icon}
            </div>
            <span className={`font-semibold text-sm ${state.heizloesung === o.value ? 'text-brand-purple-deep' : 'text-gray-600'}`}>
              {o.label}
            </span>
            <span className="text-[11px] text-gray-400 leading-tight">{o.sublabel}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${o.tagColor}`}>
              {o.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function fmt(n: number) {
  return n.toLocaleString('de-DE') + ' €'
}

function Step6({ state, reset }: { state: WizardState; reset: () => void }) {
  const r = calcResult(state)
  if (!r.bruttoMin) return null

  const kpis = [
    {
      icon: <BadgeEuro className="w-5 h-5" />,
      label: 'Investition (brutto)',
      value: `${fmt(r.bruttoMin)} – ${fmt(r.bruttoMax)}`,
      color: 'text-brand-purple',
      bg: 'bg-brand-purple/8',
    },
    {
      icon: <Percent className="w-5 h-5" />,
      label: r.noSubsidy ? 'Förderung (BEG)' : `BEG-Förderung (${r.begPct} %)`,
      value: r.noSubsidy ? 'Keine' : `${fmt(r.subsidyMin)} – ${fmt(r.subsidyMax)}`,
      color: r.noSubsidy ? 'text-gray-400' : 'text-brand-green',
      bg: r.noSubsidy ? 'bg-gray-100' : 'bg-brand-green/8',
    },
    {
      icon: <TrendingDown className="w-5 h-5" />,
      label: 'Jährliche Ersparnis',
      value: r.annualSavings > 0 ? `≈ ${fmt(r.annualSavings)} / Jahr` : 'Kaum Ersparnis',
      color: 'text-brand-blue',
      bg: 'bg-brand-blue/8',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="bg-brand-green/15 text-brand-green p-1.5 rounded-full">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-serif font-bold text-brand-purple-deep">
          Ihre persönliche Schätzung
        </h3>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.1 }}
            className={`${k.bg} rounded-2xl p-4 flex flex-col gap-1.5`}
          >
            <div className={`${k.color} flex items-center gap-1.5`}>
              {k.icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{k.label}</span>
            </div>
            <span className={`font-serif font-bold text-lg leading-tight ${k.color}`}>
              {k.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Net cost after subsidy */}
      {!r.noSubsidy && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-brand-orange/10 border border-brand-orange/30 rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <BadgeEuro className="w-5 h-5 text-brand-orange flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-brand-orange uppercase tracking-wide">
              Netto nach Förderung
            </span>
            <p className="font-serif font-bold text-brand-purple-deep text-lg leading-tight">
              {fmt(r.netMin)} – {fmt(r.netMax)}
            </p>
            {r.paybackYears && (
              <p className="text-xs text-gray-400 mt-0.5">
                Amortisation in ca. {r.paybackYears} Jahren
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-brand-cream rounded-2xl p-4 border border-gray-200"
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Unsere Einschätzung
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">{r.recommendation}</p>
      </motion.div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-gray-400">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">
          Richtwerte auf Basis aktueller Marktpreise und BEG-Fördersätze (2025). Verbindliche
          Planung erst nach Vor-Ort-Besichtigung.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="tel:+4973453286"
          className="flex-1 flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-5 py-3.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
        >
          <Phone className="w-4 h-4" />
          Kostenlos beraten lassen
        </a>
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 bg-brand-warm border border-gray-200 text-gray-500 hover:text-brand-purple-deep font-semibold px-5 py-3.5 rounded-full transition-colors focus:outline-none"
        >
          <RotateCcw className="w-4 h-4" />
          Neu berechnen
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TOTAL_STEPS = 5

export default function Heizungsrechner() {
  const [state, setState] = useState<WizardState>({
    step: 1,
    gebaeudetyp: null,
    wohnflaeche: 130,
    baujahr: null,
    aktuellesSystem: null,
    heizloesung: null,
  })
  const direction = useRef(1)

  const goTo = (next: number) => {
    direction.current = next > state.step ? 1 : -1
    setState((s) => ({ ...s, step: next }))
  }

  const reset = () => {
    direction.current = 1
    setState({
      step: 1,
      gebaeudetyp: null,
      wohnflaeche: 130,
      baujahr: null,
      aktuellesSystem: null,
      heizloesung: null,
    })
  }

  const progressPct =
    state.step > TOTAL_STEPS
      ? 100
      : ((state.step - 1) / TOTAL_STEPS) * 100

  const stepLabels = [
    'Gebäudetyp',
    'Wohnfläche',
    'Baujahr',
    'Aktuelles System',
    'Wunschlösung',
  ]

  return (
    <section
      id="heizungsrechner"
      className="py-12 sm:py-16 lg:py-24 bg-[#3B1560] relative overflow-hidden"
      aria-labelledby="rechner-heading"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Kostenloser Rechner
          </span>
          <h2
            id="rechner-heading"
            className="text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-white"
          >
            Heizungsrechner
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-white/65 max-w-xl mx-auto leading-relaxed">
            In 5 Schritten zu Ihrer persönlichen Kostenschätzung — inklusive aktueller
            BEG-Fördermöglichkeiten.
          </p>
        </motion.div>

        {/* Wizard card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white rounded-3xl shadow-card-hover overflow-hidden"
        >
          {/* Progress header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {state.step <= TOTAL_STEPS
                  ? `Schritt ${state.step} von ${TOTAL_STEPS} — ${stepLabels[state.step - 1]}`
                  : 'Ergebnis'}
              </span>
              {state.step > 1 && state.step <= TOTAL_STEPS && (
                <button
                  onClick={() => goTo(state.step - 1)}
                  className="text-xs text-gray-400 hover:text-brand-purple flex items-center gap-1 transition-colors focus:outline-none"
                  aria-label="Zurück"
                >
                  <ArrowLeft className="w-3 h-3" /> Zurück
                </button>
              )}
              {state.step > TOTAL_STEPS && (
                <button
                  onClick={reset}
                  className="text-xs text-gray-400 hover:text-brand-purple flex items-center gap-1 transition-colors focus:outline-none"
                >
                  <RotateCcw className="w-3 h-3" /> Neu
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                className="h-full bg-brand-orange rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Step dots */}
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i < state.step - 1 || state.step > TOTAL_STEPS
                      ? 'bg-brand-orange'
                      : i === state.step - 1
                      ? 'bg-brand-orange/40'
                      : 'bg-gray-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="px-4 sm:px-6 py-6 sm:py-8 min-h-[320px] sm:min-h-[360px]">
            <AnimatePresence mode="wait" custom={direction.current}>
              <motion.div
                key={state.step}
                custom={direction.current}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {state.step === 1 && <Step1 state={state} setState={setState} goTo={goTo} />}
                {state.step === 2 && <Step2 state={state} setState={setState} goTo={goTo} />}
                {state.step === 3 && <Step3 state={state} setState={setState} goTo={goTo} />}
                {state.step === 4 && <Step4 state={state} setState={setState} goTo={goTo} />}
                {state.step === 5 && <Step5 state={state} setState={setState} goTo={goTo} />}
                {state.step === 6 && <Step6 state={state} reset={reset} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="text-white/25 text-xs text-center mt-4">
          * Alle Angaben sind unverbindliche Richtwerte. Förderbedingungen gelten für selbst
          genutzte Wohngebäude (BEG EM, Stand 2025).
        </p>
      </div>
    </section>
  )
}
