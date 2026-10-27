'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, BadgeEuro, Baby, Home, Info, Building2, Users } from 'lucide-react'
import { scrollToId, useWP } from './WPContext'
import {
  ALTANLAGE_LABELS,
  EINKOMMEN_LABELS,
  FOERDER_STAND,
  berechneFoerderung,
  formatEuro,
  getNaechstePeriode,
  formatDatum,
  type Altanlage,
  type Einkommen,
} from '@/lib/waermepumpe/foerderung'

const ALTANLAGEN: Altanlage[] = ['oel', 'gas-alt', 'gas-neu', 'gasetage', 'nachtspeicher', 'kohle', 'andere']
const EINKOMMEN: Einkommen[] = ['bis30', 'bis40', 'bis50', 'bis60', 'ueber60', 'keineAngabe']

type Gebaeude = 'efh' | 'zfh' | 'mfh'

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
        active
          ? 'bg-brand-orange text-white shadow-orange-glow/40'
          : 'bg-white/10 text-white/65 hover:bg-white/15 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2.5">
      <p className="text-xs font-semibold text-white/55 uppercase tracking-widest">{children}</p>
      {hint && <p className="text-xs text-white/35 mt-1">{hint}</p>}
    </div>
  )
}

export default function WPFoerderrechner() {
  const { setFoerder } = useWP()
  const [investition, setInvestition] = useState(32000)
  const [gebaeude, setGebaeude] = useState<Gebaeude>('efh')
  const [mfhEinheiten, setMfhEinheiten] = useState(4)
  const [selbstnutzer, setSelbstnutzer] = useState(true)
  const [altanlage, setAltanlage] = useState<Altanlage>('oel')
  const [einkommen, setEinkommen] = useState<Einkommen>('keineAngabe')
  const [kind, setKind] = useState(false)

  const wohneinheiten = gebaeude === 'efh' ? 1 : gebaeude === 'zfh' ? 2 : mfhEinheiten
  const input = { investition, wohneinheiten, selbstnutzer, altanlage, einkommen, kindImHaushalt: kind }

  const r = useMemo(() => berechneFoerderung(input), [investition, wohneinheiten, selbstnutzer, altanlage, einkommen, kind]) // eslint-disable-line react-hooks/exhaustive-deps

  const naechste = getNaechstePeriode()
  const spaeter = useMemo(
    () => (naechste ? berechneFoerderung({ ...input, datum: new Date(naechste.ab + 'T12:00:00') }) : null),
    [r] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const verlust = spaeter ? r.zuschuss - spaeter.zuschuss : 0

  // Erst nach einer Nutzereingabe in die Anfrage übernehmen – nicht die Standardwerte
  const touched = useRef(false)
  const initialInput = useRef(JSON.stringify(input))
  useEffect(() => {
    if (!touched.current && JSON.stringify(input) === initialInput.current) return
    touched.current = true
    setFoerder(input)
  }, [r]) // eslint-disable-line react-hooks/exhaustive-deps

  const pct = ((investition - 15000) / (60000 - 15000)) * 100
  const ungedeckelt = r.grund + r.klima + r.einkommen
  let rest = r.deckel
  const segments = [
    { label: 'Grundförderung', value: r.grund, color: 'bg-brand-blue' },
    { label: 'Klimabonus', value: r.klima, color: 'bg-brand-green' },
    { label: 'Einkommensbonus', value: r.einkommen, color: 'bg-brand-orange' },
  ]
    .filter((s) => s.value > 0)
    .map((s) => {
      const width = Math.min(s.value, rest)
      rest -= width
      return { ...s, width }
    })

  return (
    <section
      id="foerderrechner"
      className="scroll-mt-32 py-16 sm:py-20 lg:py-24 bg-[#3B1560] relative overflow-clip"
      aria-labelledby="foerder-heading"
    >
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-green/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Förderrechner KfW 458
          </span>
          <h2 id="foerder-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white">
            Wie viel Zuschuss bekommen Sie?
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-white/65 max-w-2xl mx-auto leading-relaxed">
            Nach den aktuellen Förderregeln (Stand {FOERDER_STAND}) – mit allen Boni, Deckelungen und
            dem Familienzuschlag. Ergebnis in Echtzeit.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
          {/* Inputs */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-5 sm:p-7 flex flex-col gap-7">
            {/* Mobile: Ergebnis bleibt beim Ausfüllen sichtbar */}
            <div className="lg:hidden sticky top-[8rem] z-10 -mx-2 bg-white rounded-2xl px-4 py-3 shadow-card-hover flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-purple/60">Ihr Zuschuss</p>
                <p className="text-xl font-serif font-bold text-brand-purple-deep">{formatEuro(r.zuschuss)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-brand-purple-deep/50">Fördersatz</p>
                <p className="font-bold text-brand-green">{r.satzSelbstgenutzt} %</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold text-white/55 uppercase tracking-widest">Investitionskosten (brutto)</p>
                <span className="text-lg font-bold text-white">{formatEuro(investition)}</span>
              </div>
              <input
                type="range"
                min={15000}
                max={60000}
                step={500}
                value={investition}
                onChange={(e) => setInvestition(Number(e.target.value))}
                style={{ '--range-pct': `${pct}%` } as React.CSSProperties}
                aria-label="Investitionskosten"
              />
              <div className="flex justify-between text-xs text-white/35 mt-1.5">
                <span>15.000 €</span>
                <span className="italic">Luft-WP im EFH meist 25–40 T€</span>
                <span>60.000 €</span>
              </div>
            </div>

            <div>
              <Label>Gebäude</Label>
              <div className="grid grid-cols-3 gap-2">
                <Chip active={gebaeude === 'efh'} onClick={() => setGebaeude('efh')}>
                  <span className="flex items-center gap-1.5"><Home className="w-4 h-4" aria-hidden="true" /> EFH / ETW</span>
                </Chip>
                <Chip active={gebaeude === 'zfh'} onClick={() => setGebaeude('zfh')}>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" aria-hidden="true" /> 2 WE</span>
                </Chip>
                <Chip active={gebaeude === 'mfh'} onClick={() => setGebaeude('mfh')}>
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" aria-hidden="true" /> MFH</span>
                </Chip>
              </div>
              {gebaeude === 'mfh' && (
                <div className="mt-3 flex items-center gap-3">
                  <label htmlFor="mfh-we" className="text-sm text-white/65">Wohneinheiten</label>
                  <input
                    id="mfh-we"
                    type="number"
                    min={3}
                    max={50}
                    value={mfhEinheiten}
                    onChange={(e) => setMfhEinheiten(Math.min(Math.max(Number(e.target.value) || 3, 3), 50))}
                    className="w-20 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-orange"
                  />
                </div>
              )}
            </div>

            <div>
              <Label hint="Boni gibt es nur für die selbst bewohnte Wohneinheit.">Bewohnen Sie das Haus selbst?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Chip active={selbstnutzer} onClick={() => setSelbstnutzer(true)}>Ja, selbst bewohnt</Chip>
                <Chip active={!selbstnutzer} onClick={() => setSelbstnutzer(false)}>Nein, vermietet</Chip>
              </div>
            </div>

            <div>
              <Label hint="Die alte Heizung muss zum Antragszeitpunkt funktionstüchtig sein.">Welche Heizung wird ersetzt?</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALTANLAGEN.map((a) => (
                  <Chip key={a} active={altanlage === a} onClick={() => setAltanlage(a)}>
                    {ALTANLAGE_LABELS[a]}
                  </Chip>
                ))}
              </div>
            </div>

            {selbstnutzer && (
              <div>
                <Label hint="Zu versteuerndes Einkommen (zvE) des Haushalts – steht im Steuerbescheid und liegt meist deutlich unter dem Brutto.">
                  Haushaltseinkommen (zvE)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EINKOMMEN.map((e) => (
                    <Chip key={e} active={einkommen === e} onClick={() => setEinkommen(e)}>
                      {EINKOMMEN_LABELS[e]}
                    </Chip>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setKind(!kind)}
                  aria-pressed={kind}
                  className="mt-3 flex items-center gap-3 text-sm text-white/75"
                >
                  <span className={`relative w-11 h-6 rounded-full transition-colors ${kind ? 'bg-brand-orange' : 'bg-white/20'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${kind ? 'translate-x-5' : ''}`} />
                  </span>
                  <Baby className="w-4 h-4 text-brand-orange" aria-hidden="true" />
                  Minderjähriges Kind im Haushalt (−10.000 € zvE)
                </button>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-36 self-start w-full">
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-purple/60">Ihr geschätzter Zuschuss</p>
              <motion.p
                key={r.zuschuss}
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl font-serif font-bold text-brand-purple-deep mt-1"
              >
                {formatEuro(r.zuschuss)}
              </motion.p>
              <p className="text-sm text-brand-purple-deep/60 mt-1">
                {r.satzSelbstgenutzt} % Fördersatz
                {wohneinheiten > 1 && ` für die erste WE, ${r.grund} % für weitere`} · förderfähig {formatEuro(r.foerderfaehig)}
              </p>

              <div className="mt-6">
                <div className="relative h-4 rounded-full bg-brand-warm overflow-hidden flex" aria-hidden="true">
                  {segments.map((s) => (
                    <motion.div
                      key={s.label}
                      className={`${s.color} h-full`}
                      animate={{ width: `${s.width}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  ))}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-brand-purple-deep" style={{ left: `${r.deckel}%` }} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
                  {segments.map((s) => (
                    <span key={s.label} className="flex items-center gap-1.5 text-brand-purple-deep/70">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      {s.label} {s.value} %
                    </span>
                  ))}
                  <span className="text-brand-purple-deep/50">| Deckel {r.deckel} %</span>
                </div>
                {ungedeckelt > r.deckel && selbstnutzer && (
                  <p className="text-xs text-brand-purple-deep/50 mt-2">
                    Ihre Boni ergeben {ungedeckelt} % – gefördert werden maximal {r.deckel} %.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="bg-brand-warm rounded-2xl p-4">
                  <p className="text-xs text-brand-purple-deep/55">Investition</p>
                  <p className="font-bold text-brand-purple-deep text-lg">{formatEuro(investition)}</p>
                </div>
                <div className="bg-brand-green/10 rounded-2xl p-4">
                  <p className="text-xs text-brand-purple-deep/55">Ihr Eigenanteil</p>
                  <p className="font-bold text-brand-green text-lg">{formatEuro(r.eigenanteil)}</p>
                </div>
              </div>

              <button
                onClick={() => scrollToId('anfrage')}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold px-6 py-4 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <BadgeEuro className="w-5 h-5" aria-hidden="true" />
                Förderung sichern – Check starten
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <p className="text-[11px] text-brand-purple-deep/45 text-center mt-2">
                Ihre Auswahl wird automatisch in die Anfrage übernommen.
              </p>
            </div>

            {naechste && verlust > 0 && (
              <div className="bg-brand-orange/15 border border-brand-orange/30 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-white/85 leading-relaxed">
                  Bei Antrag ab dem {formatDatum(naechste.ab)}{' '}
                  bekommen Sie voraussichtlich <strong className="text-brand-orange">{formatEuro(verlust)} weniger</strong>.
                  Maßgeblich ist das Datum der Antragstellung.
                </p>
              </div>
            )}

            <div className="bg-white/10 border border-white/10 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-white/55 leading-relaxed space-y-1.5">
                {r.einkommen > 0 && (
                  <p>Für den Einkommensbonus benötigen Sie die Steuerbescheide {r.steuerjahre[0]} und {r.steuerjahre[1]}.</p>
                )}
                {!r.klimaBerechtigt && selbstnutzer && altanlage === 'gas-neu' && (
                  <p>Gasheizungen unter 20 Jahren erhalten keinen Klimabonus – Alter steht auf dem Typenschild.</p>
                )}
                <p>
                  Für 2027 sind weitere Änderungen angekündigt (u. a. niedrigere Grundförderung, Bonus für in der EU
                  gefertigte Wärmepumpen). Unverbindliche Schätzung – keine Förderzusage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
