import { describe, expect, it } from 'vitest'
import { fromDbError } from '@/lib/ops/actions'

describe('Datenbankfehler → Meldung', () => {
  it('fehlende Datenbankfunktion/-spalte weist auf das fehlende SQL-Update hin', () => {
    for (const code of ['PGRST202', '42883', '42703', '42P01']) {
      const res = fromDbError({ code, message: 'x' })
      expect(res).toMatchObject({ ok: false, code: 'SCHEMA_OUTDATED' })
      expect(res.ok === false && res.error).toMatch(/SQL-Update/)
    }
  })
  it('fachliche Fehler behalten ihre eigene Meldung', () => {
    expect(fromDbError({ code: 'P0001', message: 'LOCKED', details: 'Gesperrt.' })).toMatchObject({ code: 'LOCKED', error: 'Gesperrt.' })
    expect(fromDbError({ code: '23505' })).toMatchObject({ code: 'DUPLICATE' })
  })
})
