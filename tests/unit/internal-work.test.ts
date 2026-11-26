import { describe, expect, it } from 'vitest'
import { INTERNAL_KINDS, INTERNAL_KIND_ENTRY_TYPE, INTERNAL_SUGGESTIONS, internalNote, isInternalKind } from '@/lib/ops/domain/internal-work'
import { MANUAL_TIME_ENTRY_TYPES } from '@/lib/ops/domain/labels'

describe('Arbeit ohne Kunde', () => {
  it('erkennt gültige Arten', () => {
    expect(isInternalKind('lager')).toBe(true)
    expect(isInternalKind('kunde')).toBe(false)
    expect(isInternalKind(undefined)).toBe(false)
  })
  it('jede Art wird als ohne Auftrag erfassbare Zeitart gespeichert', () => {
    for (const k of INTERNAL_KINDS) expect(MANUAL_TIME_ENTRY_TYPES).toContain(INTERNAL_KIND_ENTRY_TYPE[k])
  })
  it('Bemerkung: eigener Text, sonst die Art', () => {
    expect(internalNote('fahrzeug', '  Auto geputzt ')).toBe('Auto geputzt')
    expect(internalNote('lager', '')).toBe('Lager')
  })
  it('zu jeder Art gibt es Vorschläge', () => {
    for (const k of INTERNAL_KINDS) expect(INTERNAL_SUGGESTIONS[k].length).toBeGreaterThan(1)
  })
})
