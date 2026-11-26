import type { TimeEntryType } from './types'

/** Tätigkeiten ohne Kunde, die Mitarbeiter direkt erfassen (Lager, Fahrzeug, Material …). */
export type InternalKind = 'lager' | 'fahrzeug' | 'material' | 'sonstiges'

export const INTERNAL_KINDS: InternalKind[] = ['lager', 'fahrzeug', 'material', 'sonstiges']

export const INTERNAL_KIND_LABELS: Record<InternalKind, string> = {
  lager: 'Lager',
  fahrzeug: 'Fahrzeug',
  material: 'Material',
  sonstiges: 'Sonstiges',
}

export const INTERNAL_KIND_TITLES: Record<InternalKind, string> = {
  lager: 'Arbeit im Lager',
  fahrzeug: 'Arbeit am Fahrzeug',
  material: 'Material bestellen / besorgen',
  sonstiges: 'Sonstige interne Arbeit',
}

/** Zeitart in der Datenbank. Fahrzeug und Sonstiges sind „intern“, der Text steht in der Bemerkung. */
export const INTERNAL_KIND_ENTRY_TYPE: Record<InternalKind, TimeEntryType> = {
  lager: 'lager',
  fahrzeug: 'intern',
  material: 'materialbeschaffung',
  sonstiges: 'intern',
}

export const INTERNAL_SUGGESTIONS: Record<InternalKind, string[]> = {
  lager: ['Material kommissioniert', 'Lager aufgeräumt', 'Ware eingelagert', 'Inventur'],
  fahrzeug: ['Auto aufgeräumt', 'Auto geputzt', 'Auto beladen', 'Werkzeug geprüft'],
  material: ['Material bestellt', 'Material beim Großhandel geholt', 'Angebot eingeholt'],
  sonstiges: ['Werkstatt aufgeräumt', 'Besprechung', 'Schulung'],
}

export function isInternalKind(value: string | undefined | null): value is InternalKind {
  return !!value && (INTERNAL_KINDS as string[]).includes(value)
}

/** Bemerkung eines Eintrags: eigener Text, sonst die Art („Lager“, „Fahrzeug“ …). */
export function internalNote(kind: InternalKind, text: string): string {
  return text.trim() || INTERNAL_KIND_LABELS[kind]
}
