import type { z } from 'zod'
import { fieldErrors } from './validation/schemas'

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; fieldErrors?: Record<string, string> }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(error: string, extra: { code?: string; fieldErrors?: Record<string, string> } = {}): ActionResult<never> {
  return { ok: false, error, ...extra }
}

export function invalid(error: z.ZodError): ActionResult<never> {
  const errors = fieldErrors(error)
  return { ok: false, error: Object.values(errors)[0] ?? 'Eingaben prüfen.', code: 'INVALID', fieldErrors: errors }
}

interface PgError {
  code?: string
  message?: string
  details?: string | null
  hint?: string | null
}

/** Übersetzt Datenbankfehler in verständliche deutsche Meldungen (ohne interne Details). */
export function fromDbError(error: PgError): ActionResult<never> {
  if (error.code === 'P0001') {
    return { ok: false, code: error.message, error: error.details || 'Aktion nicht möglich.' }
  }
  if (error.code === '23505') return { ok: false, code: 'DUPLICATE', error: 'Dieser Eintrag existiert bereits.' }
  if (error.code === '23514') return { ok: false, code: 'CONSTRAINT', error: 'Die Angaben sind unvollständig oder widersprüchlich.' }
  if (error.code === '23503') return { ok: false, code: 'REFERENCE', error: 'Verknüpfter Datensatz nicht gefunden.' }
  // Funktion/Spalte/Tabelle fehlt: Das SQL-Update wurde in dieser Datenbank noch nicht eingespielt.
  if (error.code === 'PGRST202' || error.code === '42883' || error.code === '42703' || error.code === '42P01') {
    console.error('[db] Datenbank-Update fehlt:', error.code, error.message)
    return {
      ok: false,
      code: 'SCHEMA_OUTDATED',
      error: 'Die Datenbank ist noch nicht auf dem neuesten Stand. Bitte das passende SQL-Update im Supabase SQL Editor einspielen.',
    }
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    return { ok: false, code: 'FORBIDDEN', error: 'Keine Berechtigung für diese Aktion.' }
  }
  console.error('[db]', error.code, error.message)
  return { ok: false, code: 'UNKNOWN', error: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' }
}
