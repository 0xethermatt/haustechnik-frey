'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Trash2,
} from 'lucide-react'
import {
  DRINGLICHKEIT,
  ERREICHBARKEIT,
  KONTAKT_MAX_BYTES,
  KONTAKT_MAX_FOTOS,
  LEERE_KONTAKT,
  THEMEN,
  validiereKontakt,
  type KontaktDaten,
  type Thema,
} from '@/lib/kontakt/anfrage'
import { compressImage } from '@/lib/bildkompression'

const THEMA_EVENT = 'kontakt-thema'

/** Von anderen Abschnitten aus: Thema vorauswählen und zum Kontaktformular scrollen. */
export function zumKontakt(thema?: Thema) {
  if (thema) window.dispatchEvent(new CustomEvent(THEMA_EVENT, { detail: thema }))
  document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })
}

const contactItems = [
  { icon: Phone, label: 'Telefon (Büro)', value: '07345 3286', href: 'tel:+4973453286' },
  { icon: Mail, label: 'E-Mail', value: 'info@haustechnik-frey.de', href: 'mailto:info@haustechnik-frey.de' },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Schammenstraße 19, 89129 Langenau',
    href: 'https://maps.google.com/?q=Schammenstraße+19+89129+Langenau',
  },
]

interface Foto {
  id: string
  blob: Blob
  url: string
}

function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[]
  value: T | ''
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-2 rounded-full border-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
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

function Feld({
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
        className={`mt-1 w-full rounded-xl border-2 px-4 py-2.5 text-brand-purple-deep bg-white placeholder:text-brand-purple-deep/35 focus:outline-none ${
          error ? 'border-red-400' : 'border-brand-purple/10 focus:border-brand-orange'
        }`}
      />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  )
}

export default function Contact() {
  const [data, setData] = useState<KontaktDaten>(LEERE_KONTAKT)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [fotos, setFotos] = useState<Foto[]>([])
  const [fotoFehler, setFotoFehler] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [serverFehler, setServerFehler] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const startedAt = useRef(0)

  const set = <K extends keyof KontaktDaten>(k: K, v: KontaktDaten[K]) => {
    if (!startedAt.current) startedAt.current = Date.now()
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: '' }))
  }

  useEffect(() => {
    const onThema = (e: Event) => set('thema', (e as CustomEvent<Thema>).detail)
    window.addEventListener(THEMA_EVENT, onThema)
    return () => window.removeEventListener(THEMA_EVENT, onThema)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => fotos.forEach((f) => URL.revokeObjectURL(f.url)), []) // eslint-disable-line react-hooks/exhaustive-deps

  const addFotos = async (files: FileList | null) => {
    if (!files?.length) return
    setFotoFehler(null)
    const neue: Foto[] = []
    for (const file of Array.from(files).slice(0, KONTAKT_MAX_FOTOS - fotos.length)) {
      try {
        const blob = await compressImage(file)
        neue.push({ id: `${Date.now()}-${Math.random()}`, blob, url: URL.createObjectURL(blob) })
      } catch {
        setFotoFehler('Ein Bild konnte nicht gelesen werden (bitte JPG oder PNG).')
      }
    }
    const alle = [...fotos, ...neue]
    if (alle.reduce((s, f) => s + f.blob.size, 0) > KONTAKT_MAX_BYTES) {
      neue.forEach((f) => URL.revokeObjectURL(f.url))
      setFotoFehler('Die Fotos sind zusammen zu groß.')
      return
    }
    setFotos(alle)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validiereKontakt(data)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setStatus('sending')
    setServerFehler(null)
    const form = new FormData()
    form.append('daten', JSON.stringify(data))
    form.append('startedAt', String(startedAt.current || Date.now() - 60_000))
    form.append('website', honeypot)
    fotos.forEach((f, i) => form.append('fotos', f.blob, `foto-${i + 1}.jpg`))

    try {
      const res = await fetch('/api/kontakt', { method: 'POST', body: form })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Senden fehlgeschlagen')
      setStatus('success')
      track('kontakt_gesendet', { thema: data.thema })
    } catch (err) {
      setStatus('error')
      setServerFehler(err instanceof Error ? err.message : 'Senden fehlgeschlagen')
    }
  }

  return (
    <section
      id="kontakt"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #6B2D8B 0%, #4A1D63 100%)' }}
      aria-labelledby="kontakt-heading"
    >
      <div
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(232, 160, 48, 0.12)' }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.3fr] lg:grid-rows-[auto_1fr] gap-8 lg:gap-x-12 items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <span className="inline-block text-brand-orange font-semibold text-sm tracking-widest uppercase mb-3">
            Kontakt aufnehmen
          </span>
          <h2 id="kontakt-heading" className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
            Projekt im Kopf? Lassen Sie uns reden.
          </h2>
          <p className="mt-4 text-white/65 leading-relaxed">
            Schreiben Sie uns kurz, worum es geht – wir melden uns in der Regel innerhalb von 1–2 Werktagen.
            Kostenlos und unverbindlich.
          </p>
        </div>

        {/* Desktop: Spalte auf Formularhöhe strecken, Ansprechpartner schließt unten bündig ab */}
        <div className="lg:col-start-1 lg:row-start-2 order-last lg:order-none lg:self-stretch flex flex-col gap-4 lg:gap-6">
          <div className="space-y-3">
            <div className="grid gap-3">
              {contactItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.label === 'Adresse' ? '_blank' : undefined}
                  rel={item.label === 'Adresse' ? 'noopener noreferrer' : undefined}
                  className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl px-4 py-3 lg:py-4 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-brand-orange flex-shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-white/50 text-xs">{item.label}</span>
                    <span className="block text-white font-semibold text-sm break-words group-hover:text-brand-orange">
                      {item.value}
                    </span>
                  </span>
                </a>
              ))}
            </div>
            <p className="flex items-center gap-2 text-white/55 text-sm px-1">
              <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              Mo–Sa erreichbar · Notdienst auch am Sonntag
            </p>
          </div>

          {/* Desktop: unten bündig mit dem Formular */}
          <div className="lg:mt-auto space-y-3 lg:space-y-4">
            <div className="rounded-2xl border border-white/15 p-4 lg:p-5">
              <p className="text-white font-semibold text-sm mb-3">So geht es weiter</p>
              <ol className="space-y-2.5 lg:space-y-3.5" role="list">
                {[
                  'Sie senden uns Ihre Anfrage – gerne mit Fotos.',
                  'Wir rufen Sie zurück, meist innerhalb von 1–2 Werktagen.',
                  'Termin vor Ort und ein faires, verbindliches Angebot.',
                ].map((t, i) => (
                  <li key={t} className="flex gap-3 text-sm text-white/70">
                    <span className="w-6 h-6 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white/10 border border-white/15 p-4 lg:p-5">
              <div className="w-12 h-12 rounded-full bg-brand-orange text-white font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">
                AF
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/50">Ihr Ansprechpartner</p>
                <p className="font-bold text-white leading-tight">Andreas Frey</p>
                <p className="text-xs text-white/60">Inhaber &amp; SHK-Meister · seit 1994</p>
                <a href="tel:+4973453286" className="mt-1 inline-flex items-center gap-1.5 text-sm text-white hover:text-brand-orange">
                  <Phone className="w-4 h-4 text-brand-orange" aria-hidden="true" />
                  07345 3286
                </a>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="lg:col-start-2 lg:row-start-1 lg:row-span-2 bg-white rounded-3xl shadow-2xl p-5 sm:p-7"
        >
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 text-brand-green mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-2xl font-serif font-bold text-brand-purple-deep mb-2">Vielen Dank!</h3>
              <p className="text-brand-purple-deep/70 max-w-sm mx-auto">
                Ihre Anfrage ist bei uns angekommen. Wir melden uns in der Regel innerhalb von 1–2 Werktagen.
                {data.email && ' Eine Bestätigung ist unterwegs.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-bold text-brand-purple-deep">
                  Worum geht es? <span className="text-brand-orange-dark">*</span>
                </p>
                <Chips label="Thema" options={THEMEN} value={data.thema} onChange={(v) => set('thema', v)} />
                {errors.thema && <p className="text-xs text-red-600">{errors.thema}</p>}
              </div>

              {data.thema === 'waermepumpe' && (
                <Link
                  href="/waermepumpe#anfrage"
                  className="flex items-center justify-between gap-3 rounded-2xl bg-brand-green/10 border border-brand-green/30 px-4 py-3 text-sm text-brand-purple-deep"
                >
                  <span>
                    <strong>Tipp:</strong> Mit dem Wärmepumpen-Check inkl. Förderrechner bekommen Sie schneller ein genaues Angebot.
                  </span>
                  <ArrowRight className="w-4 h-4 text-brand-green flex-shrink-0" aria-hidden="true" />
                </Link>
              )}

              <div className="space-y-2">
                <p className="text-sm font-bold text-brand-purple-deep">Wie dringend?</p>
                <Chips label="Dringlichkeit" options={DRINGLICHKEIT} value={data.dringlichkeit} onChange={(v) => set('dringlichkeit', v)} />
                {data.dringlichkeit === 'dringend' && (
                  <a
                    href="tel:+4973453286"
                    className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span>
                      Heizungsausfall, Wasserschaden oder Gasgeruch? Bitte rufen Sie direkt an:{' '}
                      <strong>07345 3286</strong>
                    </span>
                  </a>
                )}
              </div>

              <label className="block">
                <span className="text-sm font-bold text-brand-purple-deep">
                  Ihr Anliegen <span className="text-brand-orange-dark">*</span>
                </span>
                <textarea
                  rows={3}
                  value={data.nachricht}
                  onChange={(e) => set('nachricht', e.target.value.slice(0, 3000))}
                  placeholder="z. B. „Heizung macht Geräusche“ oder „Bad im 1. OG modernisieren, ca. 8 m²“"
                  aria-invalid={!!errors.nachricht}
                  className={`mt-1 w-full rounded-xl border-2 px-4 py-3 text-brand-purple-deep placeholder:text-brand-purple-deep/35 focus:outline-none resize-y ${
                    errors.nachricht ? 'border-red-400' : 'border-brand-purple/10 focus:border-brand-orange'
                  }`}
                />
                {errors.nachricht && <span className="text-xs text-red-600">{errors.nachricht}</span>}
              </label>

              <div>
                <div className="flex flex-wrap gap-2 items-center">
                  {fotos.map((f) => (
                    <div key={f.id} className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-purple/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt="Hochgeladenes Foto" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(f.url)
                          setFotos((fs) => fs.filter((x) => x.id !== f.id))
                        }}
                        className="absolute top-0.5 right-0.5 bg-white/90 rounded-full p-1 text-red-600"
                        aria-label="Foto entfernen"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  {fotos.length < KONTAKT_MAX_FOTOS && (
                    <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-brand-purple hover:text-brand-orange-dark border-2 border-dashed border-brand-purple/20 rounded-xl px-4 py-3">
                      <ImagePlus className="w-5 h-5" aria-hidden="true" />
                      Fotos hinzufügen (optional)
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
                {fotoFehler && <p className="text-xs text-red-600 mt-1">{fotoFehler}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 border-t border-brand-purple/10 pt-5">
                <Feld label="Name" required autoComplete="name" value={data.name} error={errors.name} onChange={(e) => set('name', e.target.value)} />
                <Feld label="Telefon" required type="tel" autoComplete="tel" value={data.telefon} error={errors.telefon} onChange={(e) => set('telefon', e.target.value)} />
                <Feld label="E-Mail (für die Bestätigung)" type="email" autoComplete="email" value={data.email} error={errors.email} onChange={(e) => set('email', e.target.value)} />
                <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                  <Feld label="PLZ" required inputMode="numeric" autoComplete="postal-code" value={data.plz} error={errors.plz} onChange={(e) => set('plz', e.target.value.replace(/[^\d]/g, '').slice(0, 5))} />
                  <Feld label="Ort" autoComplete="address-level2" value={data.ort} onChange={(e) => set('ort', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-brand-purple-deep">Wann erreichen wir Sie am besten?</p>
                <Chips label="Erreichbarkeit" options={ERREICHBARKEIT} value={data.erreichbarkeit} onChange={(v) => set('erreichbarkeit', v)} />
              </div>

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
                  Ich bin einverstanden, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet werden. Details in der{' '}
                  <Link href="/datenschutz" className="text-brand-purple underline" target="_blank">
                    Datenschutzerklärung
                  </Link>
                  . <span className="text-brand-orange-dark">*</span>
                </span>
              </label>
              {errors.datenschutz && <p className="text-xs text-red-600 -mt-3">{errors.datenschutz}</p>}

              {status === 'error' && serverFehler && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{serverFehler}</div>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark disabled:opacity-60 text-white font-bold px-8 py-4 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
              >
                {status === 'sending' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5" aria-hidden="true" />}
                {status === 'sending' ? 'Wird gesendet …' : 'Anfrage senden'}
              </button>
              <p className="text-center text-xs text-brand-purple-deep/45">Kostenlos · unverbindlich · Rückmeldung in 1–2 Werktagen</p>
            </div>
          )}
        </form>
      </div>
    </section>
  )
}
