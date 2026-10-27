'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { track } from '@vercel/analytics'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Lock,
  Phone,
  Send,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useWP } from './WPContext'
import {
  ANLIEGEN,
  AUFSTELLORT,
  BAUJAHR,
  EIGENTUM,
  ENERGIETRAEGER,
  ERREICHBARKEIT,
  GEBAEUDETYP,
  LEERE_ANFRAGE,
  MAX_FOTOS,
  MAX_UPLOAD_BYTES,
  NACHBARABSTAND,
  PV,
  SANIERUNG,
  VERBRAUCH_EINHEIT,
  VORLAUF,
  WAERMEVERTEILUNG,
  ZAEHLERSCHRANK,
  ZEITRAUM,
  validiereKontakt,
  type Option,
  type WPAnfrageDaten,
} from '@/lib/waermepumpe/anfrage'
import { EINKOMMEN_LABELS, type Altanlage, type Einkommen } from '@/lib/waermepumpe/foerderung'

const DRAFT_KEY = 'wp-anfrage-entwurf'

const FOTO_KATEGORIEN = ['Heizung & Typenschild', 'Heizraum', 'Zählerschrank', 'Aufstellort außen', 'Heizkörper', 'Sonstiges']

const STEPS = ['Vorhaben', 'Gebäude', 'Heizung', 'Standort', 'Fotos', 'Kontakt'] as const

const ALTANLAGE_ZU_TRAEGER: Partial<Record<Altanlage, WPAnfrageDaten['energietraeger']>> = {
  oel: 'oel',
  'gas-alt': 'gas',
  'gas-neu': 'gas',
  gasetage: 'gasetage',
  nachtspeicher: 'nachtspeicher',
  kohle: 'kohle',
}

interface Foto {
  id: string
  blob: Blob
  url: string
  kategorie: string
}

async function compressImage(file: File, maxSize = 1600, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality)
  )
}

function Choice<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  name,
}: {
  options: readonly Option<T>[]
  value: T | ''
  onChange: (v: T) => void
  columns?: 2 | 3 | 4
  name: string
}) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[columns]
  return (
    <div role="radiogroup" aria-label={name} className={`grid ${cols} gap-2`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
            value === o.value
              ? 'border-brand-orange bg-brand-orange/10 text-brand-purple-deep'
              : 'border-brand-purple/10 text-brand-purple-deep/70 hover:border-brand-purple/30'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Group({ label, hint, children, required }: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-bold text-brand-purple-deep">
        {label}
        {required && <span className="text-brand-orange-dark"> *</span>}
      </legend>
      {hint && <p className="text-xs text-brand-purple-deep/50 -mt-1">{hint}</p>}
      {children}
    </fieldset>
  )
}

function TextInput({
  label,
  error,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-brand-purple-deep">
        {label}
        {props.required && <span className="text-brand-orange-dark"> *</span>}
      </span>
      <input
        {...props}
        aria-invalid={!!error}
        className={`mt-1.5 w-full rounded-xl border-2 px-4 py-3 text-brand-purple-deep bg-white placeholder:text-brand-purple-deep/35 focus:outline-none transition-colors ${
          error ? 'border-red-400 focus:border-red-500' : 'border-brand-purple/10 focus:border-brand-orange'
        }`}
      />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  )
}

export default function WPAnfrage() {
  const { foerder, eignung } = useWP()
  const [data, setData] = useState<WPAnfrageDaten>(LEERE_ANFRAGE)
  const [step, setStep] = useState(0)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [fotoFehler, setFotoFehler] = useState<string | null>(null)
  const [fotoLaedt, setFotoLaedt] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [serverFehler, setServerFehler] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const startedAt = useRef<number>(0)
  const tracked = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof WPAnfrageDaten>(k: K, v: WPAnfrageDaten[K]) => {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: '' }))
    if (!tracked.current) {
      tracked.current = true
      startedAt.current = Date.now()
      track('wp_check_gestartet')
    }
  }

  // Entwurf wiederherstellen
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) setData((d) => ({ ...d, ...JSON.parse(raw), datenschutz: false }))
    } catch {}
  }, [])

  useEffect(() => {
    if (status === 'success') return
    const t = setTimeout(() => {
      try {
        const { datenschutz: _ds, ...rest } = data
        localStorage.setItem(DRAFT_KEY, JSON.stringify(rest))
      } catch {}
    }, 500)
    return () => clearTimeout(t)
  }, [data, status])

  // Angaben aus Eignungs-Check und Förderrechner übernehmen, sofern noch leer
  useEffect(() => {
    if (!eignung) return
    setData((d) => ({
      ...d,
      waermeverteilung: d.waermeverteilung || eignung.waermeverteilung || '',
      vorlauf: d.vorlauf || eignung.vorlauf || '',
      nachbarabstand: d.nachbarabstand || eignung.nachbarabstand || '',
    }))
  }, [eignung])

  useEffect(() => {
    if (!foerder) return
    setData((d) => ({
      ...d,
      einkommen: foerder.einkommen as Einkommen,
      kindImHaushalt: foerder.kindImHaushalt,
      eigentum: foerder.selbstnutzer ? (d.eigentum === 'beides' ? 'beides' : 'selbst') : 'vermietet',
      energietraeger: d.energietraeger || ALTANLAGE_ZU_TRAEGER[foerder.altanlage] || '',
      wohneinheiten: foerder.wohneinheiten > 1 ? String(foerder.wohneinheiten) : d.wohneinheiten,
    }))
  }, [foerder])

  useEffect(() => () => fotos.forEach((f) => URL.revokeObjectURL(f.url)), []) // eslint-disable-line react-hooks/exhaustive-deps

  const istNeubau = data.anliegen === 'neubau'
  const visibleSteps = STEPS.map((label, i) => ({ label, i })).filter((s) => !(istNeubau && s.label === 'Heizung'))
  const posInVisible = visibleSteps.findIndex((s) => s.i === step)

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (s === 0 && !data.anliegen) e.anliegen = 'Bitte wählen Sie Ihr Anliegen'
    if (s === 1) {
      if (!data.gebaeudetyp) e.gebaeudetyp = 'Bitte Gebäudetyp wählen'
      if (!data.baujahr) e.baujahr = 'Bitte Baujahr wählen'
    }
    if (s === 2 && !istNeubau && !data.energietraeger) e.energietraeger = 'Bitte aktuelle Heizung wählen'
    if (s === 5) Object.assign(e, validiereKontakt(data))
    return e
  }

  const goTo = (target: number) => {
    setStep(target)
    setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const next = () => {
    const e = validateStep(step)
    setErrors(e)
    if (Object.values(e).some(Boolean)) return
    const nextVisible = visibleSteps[posInVisible + 1]
    if (nextVisible) goTo(nextVisible.i)
  }

  const back = () => {
    const prev = visibleSteps[posInVisible - 1]
    if (prev) goTo(prev.i)
  }

  const addFotos = async (files: FileList | null) => {
    if (!files?.length) return
    setFotoFehler(null)
    setFotoLaedt(true)
    const frei = MAX_FOTOS - fotos.length
    const neue: Foto[] = []
    let fehlgeschlagen = 0
    for (const file of Array.from(files).slice(0, frei)) {
      try {
        const blob = await compressImage(file)
        neue.push({
          id: `${Date.now()}-${Math.random()}`,
          blob,
          url: URL.createObjectURL(blob),
          kategorie: FOTO_KATEGORIEN[Math.min(fotos.length + neue.length, FOTO_KATEGORIEN.length - 1)],
        })
      } catch {
        fehlgeschlagen++
      }
    }
    const alle = [...fotos, ...neue]
    const total = alle.reduce((s, f) => s + f.blob.size, 0)
    if (total > MAX_UPLOAD_BYTES) {
      neue.forEach((f) => URL.revokeObjectURL(f.url))
      setFotoFehler('Die Fotos sind zusammen zu groß. Bitte weniger Bilder auswählen.')
    } else {
      setFotos(alle)
      if (fehlgeschlagen) setFotoFehler(`${fehlgeschlagen} Bild(er) konnten nicht gelesen werden (Format bitte JPG oder PNG).`)
      if (files.length > frei) setFotoFehler(`Maximal ${MAX_FOTOS} Fotos möglich.`)
    }
    setFotoLaedt(false)
  }

  const removeFoto = (id: string) => {
    setFotos((fs) => {
      const f = fs.find((x) => x.id === id)
      if (f) URL.revokeObjectURL(f.url)
      return fs.filter((x) => x.id !== id)
    })
  }

  const submit = async () => {
    const e = validateStep(5)
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    setStatus('sending')
    setServerFehler(null)
    const form = new FormData()
    form.append('daten', JSON.stringify({ ...data, energietraeger: istNeubau ? 'keine' : data.energietraeger }))
    form.append('startedAt', String(startedAt.current || Date.now() - 60_000))
    form.append('website', honeypot)
    if (foerder) form.append('investition', String(foerder.investition))
    if (eignung) form.append('eignung', `${eignung.label} (${eignung.score} %)`)
    const counts: Record<string, number> = {}
    fotos.forEach((f) => {
      counts[f.kategorie] = (counts[f.kategorie] ?? 0) + 1
      const suffix = counts[f.kategorie] > 1 ? `-${counts[f.kategorie]}` : ''
      form.append('fotos', f.blob, `${f.kategorie}${suffix}.jpg`)
    })

    try {
      const res = await fetch('/api/waermepumpe-anfrage', { method: 'POST', body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Senden fehlgeschlagen')
      setStatus('success')
      track('wp_anfrage_gesendet', { anliegen: data.anliegen, fotos: fotos.length })
      try {
        localStorage.removeItem(DRAFT_KEY)
      } catch {}
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (err) {
      setStatus('error')
      setServerFehler(err instanceof Error ? err.message : 'Senden fehlgeschlagen')
    }
  }

  const progress = status === 'success' ? 100 : ((posInVisible + 1) / visibleSteps.length) * 100

  return (
    <section
      id="anfrage"
      className="scroll-mt-28 py-16 sm:py-20 lg:py-24 relative overflow-clip bg-brand-purple-deep"
      aria-labelledby="anfrage-heading"
    >
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand-blue/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-12 items-start">
        <div className="lg:sticky lg:top-36">
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-4">
            Kostenloser Wärmepumpen-Check
          </span>
          <h2 id="anfrage-heading" className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight mb-5">
            In 5 Minuten zu Ihrem persönlichen Angebot
          </h2>
          <p className="text-white/70 leading-relaxed mb-6">
            Je mehr Sie uns vorab verraten, desto schneller und genauer können wir planen – oft
            sparen wir uns dadurch sogar einen Termin. Alle Angaben außer Kontakt sind freiwillig.
          </p>
          <ul className="space-y-3 text-white/75 text-sm" role="list">
            {[
              'Rückmeldung in der Regel innerhalb von 1–2 Werktagen',
              'Kostenlos & unverbindlich',
              'Inklusive Förderprüfung',
              'Ihre Daten bleiben bei uns – keine Weitergabe zu Werbezwecken',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-green flex-shrink-0" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
          <a href="tel:+4973453286" className="mt-8 inline-flex items-center gap-2 text-white/80 hover:text-white text-sm">
            <Phone className="w-4 h-4 text-brand-orange" aria-hidden="true" />
            Lieber telefonisch? <strong>07345 3286</strong>
          </a>
        </div>

        <div ref={cardRef} className="scroll-mt-32 bg-white rounded-3xl shadow-2xl overflow-hidden">
          {status !== 'success' && (
            <div className="px-5 sm:px-8 pt-5 pb-4 border-b border-brand-purple/10">
              <div className="flex items-center justify-between text-xs font-semibold text-brand-purple-deep/50 uppercase tracking-wide mb-3">
                <span>
                  Schritt {posInVisible + 1} von {visibleSteps.length} · {STEPS[step]}
                </span>
                {posInVisible > 0 && (
                  <button type="button" onClick={back} className="flex items-center gap-1 hover:text-brand-purple normal-case tracking-normal">
                    <ArrowLeft className="w-3 h-3" aria-hidden="true" /> Zurück
                  </button>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-brand-warm" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                <motion.div className="h-full rounded-full bg-brand-orange" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>
          )}

          <div className="px-5 sm:px-8 py-6 sm:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={status === 'success' ? 'success' : step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-7"
              >
                {status === 'success' ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-brand-green/15 text-brand-green mx-auto flex items-center justify-center mb-5">
                      <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-brand-purple-deep mb-3">
                      Vielen Dank, {data.vorname}!
                    </h3>
                    <p className="text-brand-purple-deep/70 max-w-md mx-auto leading-relaxed mb-6">
                      Ihre Anfrage ist bei uns angekommen. Eine Bestätigung mit den nächsten Schritten haben wir an{' '}
                      <strong>{data.email}</strong> gesendet. Wir melden uns in der Regel innerhalb von 1–2 Werktagen.
                    </p>
                    <div className="bg-brand-warm rounded-2xl p-5 text-left max-w-md mx-auto">
                      <p className="font-bold text-brand-purple-deep mb-2 text-sm">Bis dahin gerne bereitlegen:</p>
                      <ul className="text-sm text-brand-purple-deep/70 space-y-1 list-disc pl-5">
                        <li>Verbrauch / Heizkostenabrechnungen der letzten Jahre</li>
                        <li>Foto vom Typenschild Ihrer Heizung</li>
                        <li>Grundrisse (falls vorhanden)</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <>
                    {step === 0 && (
                      <>
                        <Group label="Was ist Ihr Anliegen?" required>
                          <Choice name="Anliegen" options={ANLIEGEN} value={data.anliegen} onChange={(v) => set('anliegen', v)} />
                          {errors.anliegen && <p className="text-xs text-red-600">{errors.anliegen}</p>}
                        </Group>
                        <Group label="Wann soll die Wärmepumpe kommen?">
                          <Choice name="Zeitraum" options={ZEITRAUM} value={data.zeitraum} onChange={(v) => set('zeitraum', v)} />
                        </Group>
                      </>
                    )}

                    {step === 1 && (
                      <>
                        <Group label="Gebäudetyp" required>
                          <Choice name="Gebäudetyp" options={GEBAEUDETYP} value={data.gebaeudetyp} columns={3} onChange={(v) => set('gebaeudetyp', v)} />
                          {errors.gebaeudetyp && <p className="text-xs text-red-600">{errors.gebaeudetyp}</p>}
                        </Group>
                        <Group label="Baujahr des Gebäudes" required>
                          <Choice name="Baujahr" options={BAUJAHR} value={data.baujahr} columns={3} onChange={(v) => set('baujahr', v)} />
                          {errors.baujahr && <p className="text-xs text-red-600">{errors.baujahr}</p>}
                        </Group>
                        <div className="grid grid-cols-2 gap-4">
                          <TextInput
                            label="Beheizte Wohnfläche (m²)"
                            inputMode="numeric"
                            placeholder="z. B. 140"
                            value={data.wohnflaeche}
                            onChange={(e) => set('wohnflaeche', e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                          />
                          {(data.gebaeudetyp === 'zfh' || data.gebaeudetyp === 'mfh') && (
                            <TextInput
                              label="Wohneinheiten"
                              inputMode="numeric"
                              value={data.wohneinheiten}
                              onChange={(e) => set('wohneinheiten', e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                            />
                          )}
                        </div>
                        <Group label="Was wurde bereits saniert?" hint="Mehrfachauswahl möglich">
                          <div className="grid grid-cols-2 gap-2">
                            {SANIERUNG.map((o) => {
                              const checked = data.sanierung.includes(o.value)
                              return (
                                <button
                                  key={o.value}
                                  type="button"
                                  role="checkbox"
                                  aria-checked={checked}
                                  onClick={() =>
                                    set('sanierung', checked ? data.sanierung.filter((s) => s !== o.value) : [...data.sanierung, o.value])
                                  }
                                  className={`px-3.5 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                                    checked ? 'border-brand-green bg-brand-green/10 text-brand-purple-deep' : 'border-brand-purple/10 text-brand-purple-deep/70 hover:border-brand-purple/30'
                                  }`}
                                >
                                  {checked ? '✓ ' : ''}
                                  {o.label}
                                </button>
                              )
                            })}
                          </div>
                        </Group>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <Group label="Womit heizen Sie aktuell?" required>
                          <Choice name="Energieträger" options={ENERGIETRAEGER.filter((o) => o.value !== 'keine')} value={data.energietraeger} columns={3} onChange={(v) => set('energietraeger', v)} />
                          {errors.energietraeger && <p className="text-xs text-red-600">{errors.energietraeger}</p>}
                        </Group>
                        <div className="grid sm:grid-cols-[1fr_1.4fr] gap-4">
                          <TextInput
                            label="Baujahr der Heizung"
                            inputMode="numeric"
                            placeholder="z. B. 2002"
                            value={data.heizungBaujahr}
                            onChange={(e) => set('heizungBaujahr', e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                          />
                          <div>
                            <span className="text-sm font-semibold text-brand-purple-deep">Jahresverbrauch</span>
                            <div className="mt-1.5 flex gap-2">
                              <input
                                inputMode="numeric"
                                placeholder="z. B. 2500"
                                aria-label="Jahresverbrauch"
                                value={data.verbrauch}
                                onChange={(e) => set('verbrauch', e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
                                className="min-w-0 flex-1 rounded-xl border-2 border-brand-purple/10 focus:border-brand-orange px-4 py-3 text-brand-purple-deep focus:outline-none"
                              />
                              <select
                                aria-label="Einheit"
                                value={data.verbrauchEinheit}
                                onChange={(e) => set('verbrauchEinheit', e.target.value as WPAnfrageDaten['verbrauchEinheit'])}
                                className="rounded-xl border-2 border-brand-purple/10 px-3 py-3 text-brand-purple-deep bg-white focus:outline-none focus:border-brand-orange"
                              >
                                {VERBRAUCH_EINHEIT.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <Group label="Wie wird die Wärme verteilt?">
                          <Choice name="Wärmeverteilung" options={WAERMEVERTEILUNG} value={data.waermeverteilung} columns={3} onChange={(v) => set('waermeverteilung', v)} />
                        </Group>
                        <Group label="Vorlauftemperatur an kalten Tagen" hint="Steht meist im Display der Heizung – sonst einfach „Weiß ich nicht“.">
                          <Choice name="Vorlauftemperatur" options={VORLAUF} value={data.vorlauf} columns={4} onChange={(v) => set('vorlauf', v)} />
                        </Group>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <Group label="Wo könnte die Außeneinheit stehen?">
                          <Choice name="Aufstellort" options={AUFSTELLORT} value={data.aufstellort} onChange={(v) => set('aufstellort', v)} />
                        </Group>
                        <Group label="Abstand zum Nachbargrundstück">
                          <Choice name="Nachbarabstand" options={NACHBARABSTAND} value={data.nachbarabstand} columns={3} onChange={(v) => set('nachbarabstand', v)} />
                        </Group>
                        <Group label="Photovoltaik-Anlage">
                          <Choice name="PV" options={PV} value={data.pv} columns={3} onChange={(v) => set('pv', v)} />
                        </Group>
                        <Group label="Alter des Zählerschranks">
                          <Choice name="Zählerschrank" options={ZAEHLERSCHRANK} value={data.zaehlerschrank} columns={3} onChange={(v) => set('zaehlerschrank', v)} />
                        </Group>
                      </>
                    )}

                    {step === 4 && (
                      <>
                        <div>
                          <h3 className="text-lg font-bold text-brand-purple-deep">Fotos hochladen (optional)</h3>
                          <p className="text-sm text-brand-purple-deep/60 mt-1">
                            Mit ein paar Handyfotos können wir vieles schon vorab beurteilen. Besonders hilfreich:
                            Heizung mit Typenschild, Zählerschrank (Tür offen) und der mögliche Aufstellort.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {fotos.map((f) => (
                            <div key={f.id} className="relative rounded-2xl overflow-hidden border border-brand-purple/10 bg-brand-warm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={f.url} alt={f.kategorie} className="w-full aspect-square object-cover" />
                              <button
                                type="button"
                                onClick={() => removeFoto(f.id)}
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 rounded-full p-1.5 shadow"
                                aria-label="Foto entfernen"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <select
                                value={f.kategorie}
                                onChange={(e) => setFotos((fs) => fs.map((x) => (x.id === f.id ? { ...x, kategorie: e.target.value } : x)))}
                                aria-label="Was zeigt das Foto?"
                                className="absolute bottom-0 inset-x-0 text-xs bg-brand-purple-deep/85 text-white px-2 py-2 focus:outline-none"
                              >
                                {FOTO_KATEGORIEN.map((k) => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                          {fotos.length < MAX_FOTOS && (
                            <label className="cursor-pointer rounded-2xl border-2 border-dashed border-brand-purple/25 hover:border-brand-orange aspect-square flex flex-col items-center justify-center gap-2 text-brand-purple-deep/60 hover:text-brand-orange-dark transition-colors text-center px-2">
                              {fotoLaedt ? <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-7 h-7" aria-hidden="true" />}
                              <span className="text-sm font-semibold">{fotos.length ? 'Weiteres Foto' : 'Fotos auswählen'}</span>
                              <span className="text-[11px]">noch {MAX_FOTOS - fotos.length} möglich</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="sr-only"
                                onChange={(e) => {
                                  addFotos(e.target.files)
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          )}
                        </div>
                        {fotoFehler && <p className="text-sm text-red-600">{fotoFehler}</p>}
                        <p className="flex gap-2 text-xs text-brand-purple-deep/50">
                          <Camera className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                          Bitte keine Personen fotografieren. Bilder werden automatisch verkleinert und nur an unser Büro übermittelt.
                        </p>
                      </>
                    )}

                    {step === 5 && (
                      <>
                        <Group label="Nutzung des Gebäudes" hint="Wichtig für die Förderboni.">
                          <Choice name="Eigentum" options={EIGENTUM} value={data.eigentum} columns={3} onChange={(v) => set('eigentum', v)} />
                        </Group>
                        {data.eigentum !== 'vermietet' && (
                          <div className="grid sm:grid-cols-2 gap-4 items-end">
                            <label className="block">
                              <span className="text-sm font-semibold text-brand-purple-deep">Haushaltseinkommen (zvE, optional)</span>
                              <select
                                value={data.einkommen}
                                onChange={(e) => set('einkommen', e.target.value as Einkommen)}
                                className="mt-1.5 w-full rounded-xl border-2 border-brand-purple/10 px-4 py-3 text-brand-purple-deep bg-white focus:outline-none focus:border-brand-orange"
                              >
                                {(Object.keys(EINKOMMEN_LABELS) as Einkommen[]).map((k) => (
                                  <option key={k} value={k}>{EINKOMMEN_LABELS[k]}</option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-3 py-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={data.kindImHaushalt}
                                onChange={(e) => set('kindImHaushalt', e.target.checked)}
                                className="w-5 h-5 accent-brand-orange"
                              />
                              <span className="text-sm text-brand-purple-deep">Minderjähriges Kind im Haushalt</span>
                            </label>
                          </div>
                        )}

                        <div className="border-t border-brand-purple/10 pt-6 grid sm:grid-cols-2 gap-4">
                          <TextInput label="Vorname" required autoComplete="given-name" value={data.vorname} error={errors.vorname} onChange={(e) => set('vorname', e.target.value)} />
                          <TextInput label="Nachname" required autoComplete="family-name" value={data.nachname} error={errors.nachname} onChange={(e) => set('nachname', e.target.value)} />
                          <TextInput label="Straße & Hausnummer" autoComplete="street-address" className="sm:col-span-2" value={data.strasse} onChange={(e) => set('strasse', e.target.value)} />
                          <div className="grid grid-cols-[7rem_1fr] gap-3 sm:col-span-2">
                            <TextInput label="PLZ" required inputMode="numeric" autoComplete="postal-code" value={data.plz} error={errors.plz} onChange={(e) => set('plz', e.target.value.replace(/[^\d]/g, '').slice(0, 5))} />
                            <TextInput label="Ort" required autoComplete="address-level2" value={data.ort} error={errors.ort} onChange={(e) => set('ort', e.target.value)} />
                          </div>
                          <TextInput label="Telefon" required type="tel" autoComplete="tel" value={data.telefon} error={errors.telefon} onChange={(e) => set('telefon', e.target.value)} />
                          <TextInput label="E-Mail" required type="email" autoComplete="email" value={data.email} error={errors.email} onChange={(e) => set('email', e.target.value)} />
                        </div>

                        <Group label="Wann erreichen wir Sie am besten?">
                          <Choice name="Erreichbarkeit" options={ERREICHBARKEIT} value={data.erreichbarkeit} columns={4} onChange={(v) => set('erreichbarkeit', v)} />
                        </Group>

                        <label className="block">
                          <span className="text-sm font-semibold text-brand-purple-deep">Nachricht (optional)</span>
                          <textarea
                            rows={3}
                            value={data.nachricht}
                            onChange={(e) => set('nachricht', e.target.value.slice(0, 3000))}
                            placeholder="Gibt es noch etwas, das wir wissen sollten?"
                            className="mt-1.5 w-full rounded-xl border-2 border-brand-purple/10 focus:border-brand-orange px-4 py-3 text-brand-purple-deep focus:outline-none resize-y"
                          />
                        </label>

                        {/* Honeypot – für Menschen unsichtbar */}
                        <div className="absolute -left-[9999px]" aria-hidden="true">
                          <label>
                            Website
                            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                          </label>
                        </div>

                        <label className="flex gap-3 items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={data.datenschutz}
                            onChange={(e) => set('datenschutz', e.target.checked)}
                            className="w-5 h-5 mt-0.5 accent-brand-orange flex-shrink-0"
                            aria-invalid={!!errors.datenschutz}
                          />
                          <span className="text-sm text-brand-purple-deep/70 leading-relaxed">
                            Ich bin einverstanden, dass meine Angaben und Fotos zur Bearbeitung meiner Anfrage
                            gespeichert und verarbeitet werden. Details in der{' '}
                            <Link href="/datenschutz" className="text-brand-purple underline" target="_blank">
                              Datenschutzerklärung
                            </Link>
                            . <span className="text-brand-orange-dark">*</span>
                          </span>
                        </label>
                        {errors.datenschutz && <p className="text-xs text-red-600 -mt-4">{errors.datenschutz}</p>}

                        {status === 'error' && serverFehler && (
                          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                            {serverFehler}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {status !== 'success' && (
              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
                {(step === 3 || step === 4) ? (
                  <button type="button" onClick={next} className="text-sm text-brand-purple-deep/50 hover:text-brand-purple text-center">
                    Überspringen
                  </button>
                ) : (
                  <span className="hidden sm:flex items-center gap-1.5 text-xs text-brand-purple-deep/40">
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" /> SSL-verschlüsselt
                  </span>
                )}
                {step === 5 ? (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={status === 'sending'}
                    className="inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark disabled:opacity-60 text-white font-bold px-8 py-4 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                  >
                    {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
                    {status === 'sending' ? 'Wird gesendet …' : 'Kostenlos anfragen'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold px-8 py-4 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
                  >
                    Weiter
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
