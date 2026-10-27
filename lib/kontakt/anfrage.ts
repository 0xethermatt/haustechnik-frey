import type { Prioritaet } from '@/lib/mail/template'

export const THEMEN = [
  { value: 'reparatur', label: 'Reparatur / Störung' },
  { value: 'heizung', label: 'Heizung erneuern' },
  { value: 'waermepumpe', label: 'Wärmepumpe' },
  { value: 'bad', label: 'Bad / Sanitär' },
  { value: 'wartung', label: 'Wartung' },
  { value: 'sonstiges', label: 'Sonstiges' },
] as const

export type Thema = (typeof THEMEN)[number]['value']

export const DRINGLICHKEIT = [
  { value: 'normal', label: 'Normal' },
  { value: 'bald', label: 'Diese Woche' },
  { value: 'dringend', label: 'Dringend' },
] as const

export type Dringlichkeit = (typeof DRINGLICHKEIT)[number]['value']

export const ERREICHBARKEIT = [
  { value: 'egal', label: 'Egal' },
  { value: 'vormittag', label: 'Vormittags' },
  { value: 'nachmittag', label: 'Nachmittags' },
  { value: 'abend', label: 'Ab 17 Uhr' },
] as const

export type Erreichbarkeit = (typeof ERREICHBARKEIT)[number]['value']

export interface KontaktDaten {
  thema: Thema | ''
  dringlichkeit: Dringlichkeit
  nachricht: string
  name: string
  telefon: string
  email: string
  plz: string
  ort: string
  strasse: string
  erreichbarkeit: Erreichbarkeit
  datenschutz: boolean
}

export const LEERE_KONTAKT: KontaktDaten = {
  thema: '',
  dringlichkeit: 'normal',
  nachricht: '',
  name: '',
  telefon: '',
  email: '',
  plz: '',
  ort: '',
  strasse: '',
  erreichbarkeit: 'egal',
  datenschutz: false,
}

export const KONTAKT_MAX_FOTOS = 4
export const KONTAKT_MAX_BYTES = 4 * 1024 * 1024

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function labelVon(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? (value || '–')
}

export function validiereKontakt(d: KontaktDaten): Record<string, string> {
  const e: Record<string, string> = {}
  if (!d.thema) e.thema = 'Bitte wählen Sie ein Thema'
  if (d.nachricht.trim().length < 10) e.nachricht = 'Bitte beschreiben Sie Ihr Anliegen kurz (mind. 10 Zeichen)'
  if (d.name.trim().length < 2) e.name = 'Bitte Namen angeben'
  if (d.telefon.replace(/[^\d]/g, '').length < 6) e.telefon = 'Bitte gültige Telefonnummer angeben'
  if (d.email.trim() && !EMAIL_RE.test(d.email.trim())) e.email = 'Bitte gültige E-Mail angeben'
  if (!/^\d{5}$/.test(d.plz.trim())) e.plz = 'Bitte 5-stellige PLZ'
  if (!d.datenschutz) e.datenschutz = 'Bitte stimmen Sie der Datenverarbeitung zu'
  return e
}

export function bereinigeKontakt(raw: unknown): KontaktDaten | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const str = (k: keyof KontaktDaten, max = 200) => (typeof r[k] === 'string' ? (r[k] as string).trim().slice(0, max) : '')
  const oneOf = <T extends string>(v: unknown, opts: readonly { value: T }[], fallback: T): T =>
    opts.some((o) => o.value === v) ? (v as T) : fallback

  const d: KontaktDaten = {
    thema: oneOf(r.thema, THEMEN, 'sonstiges'),
    dringlichkeit: oneOf(r.dringlichkeit, DRINGLICHKEIT, 'normal'),
    nachricht: str('nachricht', 3000),
    name: str('name', 120),
    telefon: str('telefon', 40),
    email: str('email', 120),
    plz: str('plz', 5),
    ort: str('ort', 80),
    strasse: str('strasse', 120),
    erreichbarkeit: oneOf(r.erreichbarkeit, ERREICHBARKEIT, 'egal'),
    datenschutz: r.datenschutz === true,
  }
  return Object.keys(validiereKontakt(d)).length === 0 ? d : null
}

export function prioritaetVon(d: KontaktDaten): Prioritaet {
  if (d.dringlichkeit === 'dringend') return 'hoch'
  if (d.dringlichkeit === 'bald' || d.thema === 'reparatur') return 'mittel'
  return 'normal'
}
