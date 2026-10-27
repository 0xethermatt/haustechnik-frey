import type { Altanlage, Einkommen } from './foerderung'

export type Option<T extends string> = { value: T; label: string }

export const ANLIEGEN = [
  { value: 'tausch', label: 'Heizungstausch geplant' },
  { value: 'defekt', label: 'Heizung defekt / macht Probleme' },
  { value: 'neubau', label: 'Neubau' },
  { value: 'info', label: 'Erst mal informieren' },
] as const satisfies readonly Option<string>[]

export const ZEITRAUM = [
  { value: 'sofort', label: 'So schnell wie möglich' },
  { value: '3-6', label: 'In 3–6 Monaten' },
  { value: '6-12', label: 'In 6–12 Monaten' },
  { value: 'offen', label: 'Noch offen' },
] as const satisfies readonly Option<string>[]

export const GEBAEUDETYP = [
  { value: 'efh', label: 'Einfamilienhaus' },
  { value: 'dhh', label: 'Doppel- / Reihenhaus' },
  { value: 'zfh', label: 'Zweifamilienhaus' },
  { value: 'mfh', label: 'Mehrfamilienhaus' },
  { value: 'etw', label: 'Eigentumswohnung' },
] as const satisfies readonly Option<string>[]

export const BAUJAHR = [
  { value: 'vor1978', label: 'vor 1978' },
  { value: '1978-1994', label: '1978 – 1994' },
  { value: '1995-2009', label: '1995 – 2009' },
  { value: 'ab2010', label: 'ab 2010' },
  { value: 'neubau', label: 'Neubau (in Planung)' },
] as const satisfies readonly Option<string>[]

export const SANIERUNG = [
  { value: 'fenster', label: 'Fenster erneuert' },
  { value: 'dach', label: 'Dach / oberste Decke gedämmt' },
  { value: 'fassade', label: 'Fassade gedämmt' },
  { value: 'keller', label: 'Kellerdecke gedämmt' },
] as const satisfies readonly Option<string>[]

export const ENERGIETRAEGER = [
  { value: 'oel', label: 'Heizöl' },
  { value: 'gas', label: 'Erdgas' },
  { value: 'gasetage', label: 'Gasetagenheizung' },
  { value: 'nachtspeicher', label: 'Nachtspeicher' },
  { value: 'pellet', label: 'Pellet / Holz' },
  { value: 'kohle', label: 'Kohle' },
  { value: 'waermepumpe', label: 'Alte Wärmepumpe' },
  { value: 'keine', label: 'Keine (Neubau)' },
] as const satisfies readonly Option<string>[]

export const VERBRAUCH_EINHEIT = [
  { value: 'l', label: 'Liter' },
  { value: 'm3', label: 'm³' },
  { value: 'kwh', label: 'kWh' },
] as const satisfies readonly Option<string>[]

export const WAERMEVERTEILUNG = [
  { value: 'fbh', label: 'Fußbodenheizung' },
  { value: 'heizkoerper', label: 'Heizkörper' },
  { value: 'gemischt', label: 'Beides' },
] as const satisfies readonly Option<string>[]

export const VORLAUF = [
  { value: 'bis45', label: 'bis 45 °C' },
  { value: '45-55', label: '45 – 55 °C' },
  { value: 'ueber55', label: 'über 55 °C' },
  { value: 'unbekannt', label: 'Weiß ich nicht' },
] as const satisfies readonly Option<string>[]

export const AUFSTELLORT = [
  { value: 'garten', label: 'Im Garten / Hof' },
  { value: 'hauswand', label: 'Direkt an der Hauswand' },
  { value: 'dach', label: 'Flachdach / Garage' },
  { value: 'unklar', label: 'Noch unklar' },
] as const satisfies readonly Option<string>[]

export const NACHBARABSTAND = [
  { value: 'gross', label: 'Mehr als 3 m' },
  { value: 'klein', label: 'Weniger als 3 m' },
  { value: 'unklar', label: 'Weiß ich nicht' },
] as const satisfies readonly Option<string>[]

export const PV = [
  { value: 'ja', label: 'Vorhanden' },
  { value: 'geplant', label: 'Geplant' },
  { value: 'nein', label: 'Nein' },
] as const satisfies readonly Option<string>[]

export const ZAEHLERSCHRANK = [
  { value: 'neu', label: 'Jünger als ca. 15 Jahre' },
  { value: 'alt', label: 'Älter' },
  { value: 'unbekannt', label: 'Weiß ich nicht' },
] as const satisfies readonly Option<string>[]

export const EIGENTUM = [
  { value: 'selbst', label: 'Ich bewohne das Haus selbst' },
  { value: 'vermietet', label: 'Vermietet' },
  { value: 'beides', label: 'Selbst bewohnt + vermietet' },
] as const satisfies readonly Option<string>[]

export const ERREICHBARKEIT = [
  { value: 'egal', label: 'Egal' },
  { value: 'vormittag', label: 'Vormittags' },
  { value: 'nachmittag', label: 'Nachmittags' },
  { value: 'abend', label: 'Ab 17 Uhr' },
] as const satisfies readonly Option<string>[]

type Values<T extends readonly Option<string>[]> = T[number]['value']

export interface WPAnfrageDaten {
  anliegen: Values<typeof ANLIEGEN> | ''
  zeitraum: Values<typeof ZEITRAUM> | ''
  gebaeudetyp: Values<typeof GEBAEUDETYP> | ''
  baujahr: Values<typeof BAUJAHR> | ''
  wohnflaeche: string
  wohneinheiten: string
  sanierung: Values<typeof SANIERUNG>[]
  energietraeger: Values<typeof ENERGIETRAEGER> | ''
  heizungBaujahr: string
  verbrauch: string
  verbrauchEinheit: Values<typeof VERBRAUCH_EINHEIT>
  waermeverteilung: Values<typeof WAERMEVERTEILUNG> | ''
  vorlauf: Values<typeof VORLAUF> | ''
  aufstellort: Values<typeof AUFSTELLORT> | ''
  nachbarabstand: Values<typeof NACHBARABSTAND> | ''
  pv: Values<typeof PV> | ''
  zaehlerschrank: Values<typeof ZAEHLERSCHRANK> | ''
  eigentum: Values<typeof EIGENTUM> | ''
  einkommen: Einkommen
  kindImHaushalt: boolean
  vorname: string
  nachname: string
  strasse: string
  plz: string
  ort: string
  telefon: string
  email: string
  erreichbarkeit: Values<typeof ERREICHBARKEIT>
  nachricht: string
  datenschutz: boolean
}

export const LEERE_ANFRAGE: WPAnfrageDaten = {
  anliegen: '',
  zeitraum: '',
  gebaeudetyp: '',
  baujahr: '',
  wohnflaeche: '',
  wohneinheiten: '1',
  sanierung: [],
  energietraeger: '',
  heizungBaujahr: '',
  verbrauch: '',
  verbrauchEinheit: 'l',
  waermeverteilung: '',
  vorlauf: '',
  aufstellort: '',
  nachbarabstand: '',
  pv: '',
  zaehlerschrank: '',
  eigentum: '',
  einkommen: 'keineAngabe',
  kindImHaushalt: false,
  vorname: '',
  nachname: '',
  strasse: '',
  plz: '',
  ort: '',
  telefon: '',
  email: '',
  erreichbarkeit: 'egal',
  nachricht: '',
  datenschutz: false,
}

export const MAX_FOTOS = 6
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function labelOf(options: readonly Option<string>[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? (value || '–')
}

export function validiereKontakt(d: WPAnfrageDaten): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!d.vorname.trim()) errors.vorname = 'Bitte Vornamen angeben'
  if (!d.nachname.trim()) errors.nachname = 'Bitte Nachnamen angeben'
  if (!/^\d{5}$/.test(d.plz.trim())) errors.plz = 'Bitte 5-stellige PLZ angeben'
  if (!d.ort.trim()) errors.ort = 'Bitte Ort angeben'
  if (d.telefon.replace(/[^\d]/g, '').length < 6) errors.telefon = 'Bitte gültige Telefonnummer angeben'
  if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Bitte gültige E-Mail angeben'
  if (!d.datenschutz) errors.datenschutz = 'Bitte stimmen Sie der Datenverarbeitung zu'
  return errors
}

/** Server-seitige Prüfung inkl. Typ- und Längenbegrenzung. */
export function bereinigeAnfrage(raw: unknown): WPAnfrageDaten | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const str = (k: keyof WPAnfrageDaten, max = 200) =>
    typeof r[k] === 'string' ? (r[k] as string).trim().slice(0, max) : ''
  const oneOf = <T extends string>(k: keyof WPAnfrageDaten, opts: readonly Option<T>[], fallback: T | '' = '') => {
    const v = r[k]
    return (opts.some((o) => o.value === v) ? v : fallback) as T | ''
  }

  const einkommenWerte: Einkommen[] = ['bis30', 'bis40', 'bis50', 'bis60', 'ueber60', 'keineAngabe']
  const sanierungRaw = Array.isArray(r.sanierung) ? r.sanierung : []

  const d: WPAnfrageDaten = {
    anliegen: oneOf('anliegen', ANLIEGEN),
    zeitraum: oneOf('zeitraum', ZEITRAUM),
    gebaeudetyp: oneOf('gebaeudetyp', GEBAEUDETYP),
    baujahr: oneOf('baujahr', BAUJAHR),
    wohnflaeche: str('wohnflaeche', 6),
    wohneinheiten: str('wohneinheiten', 3) || '1',
    sanierung: sanierungRaw.filter((s): s is WPAnfrageDaten['sanierung'][number] =>
      SANIERUNG.some((o) => o.value === s)
    ),
    energietraeger: oneOf('energietraeger', ENERGIETRAEGER),
    heizungBaujahr: str('heizungBaujahr', 4),
    verbrauch: str('verbrauch', 8),
    verbrauchEinheit: (oneOf('verbrauchEinheit', VERBRAUCH_EINHEIT, 'l') || 'l') as WPAnfrageDaten['verbrauchEinheit'],
    waermeverteilung: oneOf('waermeverteilung', WAERMEVERTEILUNG),
    vorlauf: oneOf('vorlauf', VORLAUF),
    aufstellort: oneOf('aufstellort', AUFSTELLORT),
    nachbarabstand: oneOf('nachbarabstand', NACHBARABSTAND),
    pv: oneOf('pv', PV),
    zaehlerschrank: oneOf('zaehlerschrank', ZAEHLERSCHRANK),
    eigentum: oneOf('eigentum', EIGENTUM),
    einkommen: einkommenWerte.includes(r.einkommen as Einkommen) ? (r.einkommen as Einkommen) : 'keineAngabe',
    kindImHaushalt: r.kindImHaushalt === true,
    vorname: str('vorname', 80),
    nachname: str('nachname', 80),
    strasse: str('strasse', 120),
    plz: str('plz', 5),
    ort: str('ort', 80),
    telefon: str('telefon', 40),
    email: str('email', 120),
    erreichbarkeit: (oneOf('erreichbarkeit', ERREICHBARKEIT, 'egal') || 'egal') as WPAnfrageDaten['erreichbarkeit'],
    nachricht: str('nachricht', 3000),
    datenschutz: r.datenschutz === true,
  }

  return Object.keys(validiereKontakt(d)).length === 0 ? d : null
}

/** Altanlage für die Förderberechnung aus den Formularangaben ableiten. */
export function altanlageAusAnfrage(d: WPAnfrageDaten, jahr = new Date().getFullYear()): Altanlage {
  switch (d.energietraeger) {
    case 'oel':
      return 'oel'
    case 'gasetage':
      return 'gasetage'
    case 'nachtspeicher':
      return 'nachtspeicher'
    case 'kohle':
      return 'kohle'
    case 'gas': {
      const bj = parseInt(d.heizungBaujahr, 10)
      return bj && jahr - bj >= 20 ? 'gas-alt' : 'gas-neu'
    }
    default:
      return 'andere'
  }
}

import type { Prioritaet } from '@/lib/mail/template'
export type { Prioritaet }

export function bewerteAnfrage(d: WPAnfrageDaten): { prioritaet: Prioritaet; hinweise: string[] } {
  const hinweise: string[] = []
  let prioritaet: Prioritaet = 'normal'

  if (d.anliegen === 'defekt') {
    prioritaet = 'hoch'
    hinweise.push('Heizung defekt – zeitnah zurückrufen, ggf. Übergangslösung klären.')
  } else if (d.zeitraum === 'sofort') {
    prioritaet = 'hoch'
  } else if (d.zeitraum === '3-6' || d.anliegen === 'tausch') {
    prioritaet = 'mittel'
  }

  const altanlage = altanlageAusAnfrage(d)
  if (d.eigentum !== 'vermietet' && ['oel', 'gas-alt', 'gasetage', 'nachtspeicher', 'kohle'].includes(altanlage)) {
    hinweise.push('Voraussichtlich Klimageschwindigkeitsbonus-berechtigt – auf Funktionstüchtigkeit der Altanlage achten.')
  }
  if (d.energietraeger === 'gas' && !d.heizungBaujahr) {
    hinweise.push('Gasheizung ohne Baujahr – für Klimabonus Alter laut Typenschild prüfen (≥ 20 Jahre).')
  }
  if (['bis30', 'bis40', 'bis50', 'bis60'].includes(d.einkommen) && d.eigentum !== 'vermietet') {
    hinweise.push('Einkommensbonus möglich – Steuerbescheide der letzten Jahre anfordern.')
  }
  if (d.vorlauf === 'ueber55' || (d.baujahr === 'vor1978' && d.sanierung.length === 0)) {
    hinweise.push('Hohe Vorlauftemperatur / unsaniert – raumweise Heizlast und Heizkörpertausch prüfen.')
  }
  if (d.nachbarabstand === 'klein') {
    hinweise.push('Geringer Abstand zum Nachbarn – Schallberechnung und Aufstellort sorgfältig planen.')
  }
  if (d.zaehlerschrank === 'alt') {
    hinweise.push('Alter Zählerschrank – Elektriker für Zählerplatz / Smart Meter einplanen.')
  }
  if (d.gebaeudetyp === 'mfh' || d.gebaeudetyp === 'zfh') {
    hinweise.push('Mehrere Wohneinheiten – Leistung und Warmwasserbereitung gesondert betrachten.')
  }

  return { prioritaet, hinweise }
}
