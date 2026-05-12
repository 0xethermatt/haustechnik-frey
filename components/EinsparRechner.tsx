'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Droplets, Zap, Sun, TrendingDown, Leaf, Info } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const OIL_KWH_PER_LITER = 10      // Heizwert Heizöl EL
const OIL_BOILER_EFF    = 0.85
const GAS_KWH_PER_M3    = 10      // Erdgas
const GAS_BOILER_EFF    = 0.90
const COP               = 3.0
const PV_KWH_PER_KWP    = 950     // ~Deutschland Süd
const PV_SELFUSE_NO_BAT = 0.32
const PV_SELFUSE_BAT    = 0.65
const CO2_OIL_KG_PER_L  = 2.65
const CO2_GAS_KG_PER_KWH = 0.201
const CO2_STROM_KG_PER_KWH = 0.38

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, digits = 0) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
  hint?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className="text-sm font-bold text-white">
          {fmt(value)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--range-pct': `${pct}%` } as React.CSSProperties}
        className="w-full accent-brand-orange"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-white/30">
        <span>{fmt(min)} {unit}</span>
        {hint && <span className="text-white/40 italic">{hint}</span>}
        <span>{fmt(max)} {unit}</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EinsparRechner() {
  const [fuel, setFuel] = useState<'oel' | 'gas'>('oel')
  const [consumption, setConsumption] = useState(2000)   // Liter Öl or m³ Gas
  const [fuelPrice, setFuelPrice] = useState(fuel === 'oel' ? 1.05 : 1.10)
  const [strompreis, setStrompreis] = useState(0.32)
  const [pvKwp, setPvKwp] = useState(0)
  const [withBattery, setWithBattery] = useState(false)

  // Switch fuel defaults
  const handleFuelChange = (f: 'oel' | 'gas') => {
    setFuel(f)
    setConsumption(f === 'oel' ? 2000 : 1500)
    setFuelPrice(f === 'oel' ? 1.05 : 1.10)
  }

  const result = useMemo(() => {
    // Heat from fossil fuel (kWh/year)
    const heatKwh =
      fuel === 'oel'
        ? consumption * OIL_KWH_PER_LITER * OIL_BOILER_EFF
        : consumption * GAS_KWH_PER_M3 * GAS_BOILER_EFF

    // Current annual cost
    const currentCost = fuel === 'oel'
      ? consumption * fuelPrice
      : consumption * fuelPrice  // fuelPrice = €/m³ for gas

    // Heat pump: electricity needed
    const hpElecKwh = heatKwh / COP

    // PV self-coverage
    const pvGenKwh  = pvKwp * PV_KWH_PER_KWP
    const selfRate  = withBattery ? PV_SELFUSE_BAT : PV_SELFUSE_NO_BAT
    const pvCovered = Math.min(pvGenKwh * selfRate, hpElecKwh)
    const hpElecNet = hpElecKwh - pvCovered

    // Heat pump annual cost
    const hpCost = hpElecNet * strompreis

    // Savings
    const annualSavings   = currentCost - hpCost
    const monthlySavings  = annualSavings / 12

    // CO2
    const co2Current =
      fuel === 'oel'
        ? consumption * CO2_OIL_KG_PER_L
        : consumption * GAS_KWH_PER_M3 * CO2_GAS_KG_PER_KWH
    const co2Hp = hpElecKwh * CO2_STROM_KG_PER_KWH
    const co2Saved = co2Current - co2Hp

    return {
      currentCost,
      hpCost,
      annualSavings,
      monthlySavings,
      heatKwh,
      hpElecKwh,
      pvCovered,
      co2Saved: Math.max(co2Saved, 0),
      savingsPct: currentCost > 0 ? Math.round((annualSavings / currentCost) * 100) : 0,
    }
  }, [fuel, consumption, fuelPrice, strompreis, pvKwp, withBattery])

  const barWidthCurrent = 100
  const barWidthHp = result.currentCost > 0
    ? Math.max(Math.round((result.hpCost / result.currentCost) * 100), 4)
    : 50

  return (
    <section
      id="einsparrechner"
      className="py-12 sm:py-16 lg:py-24 bg-brand-purple-deep relative overflow-hidden"
      aria-labelledby="einspar-heading"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-brand-green/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-brand-orange/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
            id="einspar-heading"
            className="text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-white"
          >
            Wechsel-Einsparrechner
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-white/65 max-w-xl mx-auto leading-relaxed">
            Wie viel sparen Sie beim Wechsel von Öl oder Gas zur Wärmepumpe? Berechnen Sie
            Ihre persönliche Ersparnis — optional mit PV-Anlage.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* ── Left: Inputs ── */}
          <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-3xl p-6 flex flex-col gap-6">
            {/* Fuel toggle */}
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                Aktuelles Heizsystem
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['oel', 'gas'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFuelChange(f)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 focus:outline-none ${
                      fuel === f
                        ? 'bg-brand-orange text-white shadow-orange-glow/40'
                        : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {f === 'oel' ? <Droplets className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                    {f === 'oel' ? 'Öl' : 'Gas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Consumption */}
            <SliderRow
              label={fuel === 'oel' ? 'Jahresverbrauch Heizöl' : 'Jahresverbrauch Erdgas'}
              value={consumption}
              min={fuel === 'oel' ? 500 : 500}
              max={fuel === 'oel' ? 6000 : 4000}
              step={fuel === 'oel' ? 100 : 100}
              unit={fuel === 'oel' ? 'L' : 'm³'}
              onChange={setConsumption}
              hint={fuel === 'oel' ? '~2.000 L typisch' : '~1.500 m³ typisch'}
            />

            {/* Prices */}
            <SliderRow
              label={fuel === 'oel' ? 'Heizölpreis' : 'Gaspreis'}
              value={fuelPrice}
              min={fuel === 'oel' ? 0.70 : 0.08}
              max={fuel === 'oel' ? 1.60 : 0.20}
              step={0.01}
              unit={fuel === 'oel' ? '€/L' : '€/kWh'}
              onChange={setFuelPrice}
            />

            <SliderRow
              label="Strompreis"
              value={strompreis}
              min={0.18}
              max={0.50}
              step={0.01}
              unit="€/kWh"
              onChange={setStrompreis}
              hint="~0,32 € typisch"
            />

            {/* PV toggle */}
            <div className="border-t border-white/10 pt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-brand-orange" />
                  <span className="text-sm font-semibold text-white">PV-Anlage hinzufügen</span>
                </div>
                <button
                  onClick={() => setPvKwp(pvKwp === 0 ? 8 : 0)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                    pvKwp > 0 ? 'bg-brand-orange' : 'bg-white/20'
                  }`}
                  aria-pressed={pvKwp > 0}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      pvKwp > 0 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {pvKwp > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-4"
                >
                  <SliderRow
                    label="PV-Anlagengröße"
                    value={pvKwp}
                    min={2}
                    max={20}
                    step={0.5}
                    unit="kWp"
                    onChange={setPvKwp}
                    hint="~8 kWp typisch"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Mit Batteriespeicher</span>
                    <button
                      onClick={() => setWithBattery(!withBattery)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                        withBattery ? 'bg-brand-orange' : 'bg-white/20'
                      }`}
                      aria-pressed={withBattery}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                          withBattery ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-white/40">
                    Eigenverbrauch: {withBattery ? '65 %' : '32 %'} der PV-Erzeugung
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="flex flex-col gap-4">
            {/* Cost comparison bars */}
            <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                Jährliche Heizkosten im Vergleich
              </p>

              {/* Current */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-white/70">
                    {fuel === 'oel' ? <Droplets className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                    {fuel === 'oel' ? 'Ölheizung (aktuell)' : 'Gasheizung (aktuell)'}
                  </span>
                  <span className="font-bold text-white">{fmt(result.currentCost)} €</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-400/70 rounded-full"
                    animate={{ width: `${barWidthCurrent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Heat pump */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-white/70">
                    <Zap className="w-4 h-4 text-brand-green" />
                    Wärmepumpe (COP {COP})
                    {pvKwp > 0 && <Sun className="w-3.5 h-3.5 text-brand-orange" />}
                  </span>
                  <span className="font-bold text-brand-green">{fmt(result.hpCost)} €</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-green rounded-full"
                    animate={{ width: `${barWidthHp}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10" />

              {/* Savings highlight */}
              <motion.div
                key={result.annualSavings}
                initial={{ scale: 0.97, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl p-4 flex items-center justify-between ${
                  result.annualSavings > 0
                    ? 'bg-brand-green/15 border border-brand-green/30'
                    : 'bg-white/8 border border-white/10'
                }`}
              >
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-0.5">
                    Jährliche Ersparnis
                  </p>
                  <p className={`text-3xl font-serif font-bold ${result.annualSavings > 0 ? 'text-brand-green' : 'text-white/40'}`}>
                    {result.annualSavings > 0 ? `${fmt(result.annualSavings)} €` : 'Kein Vorteil'}
                  </p>
                  {result.annualSavings > 0 && (
                    <p className="text-xs text-white/50 mt-0.5">
                      ≈ {fmt(result.monthlySavings)} € pro Monat · {result.savingsPct} % günstiger
                    </p>
                  )}
                </div>
                <TrendingDown className={`w-8 h-8 flex-shrink-0 ${result.annualSavings > 0 ? 'text-brand-green' : 'text-white/20'}`} />
              </motion.div>
            </div>

            {/* CO2 savings */}
            <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-3xl p-5 flex items-center gap-4">
              <div className="bg-brand-green/15 p-3 rounded-2xl">
                <Leaf className="w-6 h-6 text-brand-green" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide font-semibold mb-0.5">
                  CO₂-Einsparung
                </p>
                <p className="text-xl font-serif font-bold text-white">
                  {fmt(result.co2Saved / 1000, 1)} Tonnen / Jahr
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  Vergleich {fuel === 'oel' ? 'Öl' : 'Gas'} vs. Ökostrom-Wärmepumpe
                </p>
              </div>
            </div>

            {/* Tech detail */}
            <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/35 leading-relaxed">
                Berechnung: {fuel === 'oel' ? `${fmt(consumption)} L × 10 kWh/L × 85% = ${fmt(result.heatKwh)} kWh Wärme` : `${fmt(consumption)} m³ × 10 kWh/m³ × 90% = ${fmt(result.heatKwh)} kWh Wärme`}
                {' '}→ WP benötigt {fmt(result.hpElecKwh)} kWh Strom (÷ COP {COP})
                {pvKwp > 0 && ` · PV deckt ${fmt(result.pvCovered)} kWh`}
              </p>
            </div>

            {/* CTA */}
            <a
              href="tel:+4973453286"
              className="flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-5 py-4 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange text-sm"
            >
              Jetzt Wechsel besprechen
            </a>
          </div>
        </motion.div>

        <p className="text-white/20 text-xs text-center mt-6">
          * Richtwerte. Öl: 10 kWh/L, Wirkungsgrad 85 %. Gas: 10 kWh/m³, Wirkungsgrad 90 %.
          WP COP 3,0. PV: 950 kWh/kWp/Jahr (Süddeutschland).
        </p>
      </div>
    </section>
  )
}
