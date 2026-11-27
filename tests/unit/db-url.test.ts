import { describe, expect, it } from 'vitest'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { normalizeDbUrl } = require('../../scripts/lib/db-url.cjs') as { normalizeDbUrl: (u: string) => string }

const base = (pw: string) => `postgresql://postgres.abcdefgh:${pw}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
const passwordOf = (url: string) => decodeURIComponent(new URL(url).password)

describe('Datenbank-Adresse bereinigen', () => {
  it('lässt eine gültige Adresse unverändert', () => {
    expect(normalizeDbUrl(base('Abc123xyz'))).toBe(base('Abc123xyz'))
  })
  it('entfernt Klammern um das Passwort (Platzhalter-Stil)', () => {
    expect(passwordOf(normalizeDbUrl(base('[Abc123xyz]')))).toBe('Abc123xyz')
  })
  it('entfernt Leerzeichen und Zeilenumbrüche am Rand', () => {
    expect(normalizeDbUrl(`  ${base('Abc123xyz')}\n`)).toBe(base('Abc123xyz'))
  })
  it('kodiert Sonderzeichen im Passwort, auch @ und #', () => {
    for (const pw of ['p@ss#word', 'a:b/c?d', 'Ä ü %ß!', 'x$y&z=1+2']) {
      const url = normalizeDbUrl(base(pw))
      expect(new URL(url).host).toBe('aws-0-eu-central-1.pooler.supabase.com:5432')
      expect(passwordOf(url)).toBe(pw)
    }
  })
  it('behält bereits kodierte Passwörter bei und ergänzt den Datenbanknamen', () => {
    expect(normalizeDbUrl(base('p%40ss'))).toBe(base('p%40ss'))
    expect(normalizeDbUrl('postgresql://u:pw@host.example:5432')).toBe('postgresql://u:pw@host.example:5432/postgres')
  })
  it('verständliche Fehlermeldung ohne Passwort', () => {
    expect(() => normalizeDbUrl('kein url')).toThrow(/nicht lesbar/)
    expect(() => normalizeDbUrl('postgresql://u:[]@h:5432/postgres')).toThrow(/Passwort/)
    try {
      normalizeDbUrl('postgresql://u:GEHEIM@')
    } catch (e) {
      expect(String(e)).not.toContain('GEHEIM')
    }
  })
})
