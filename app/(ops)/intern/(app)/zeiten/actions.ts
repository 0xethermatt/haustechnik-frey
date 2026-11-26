'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { absenceSchema, placeAbbreviationSchema, timeEntrySchema, workDaySchema } from '@/lib/ops/validation/schemas'
import { berlinLocalToUtc, berlinToday } from '@/lib/ops/domain/dates'
import { durationFromSpan } from '@/lib/ops/domain/time'

function revalidateTime() {
  revalidatePath('/intern', 'layout')
}

/** Manuelle Zeiterfassung (keine Kundenarbeit – die entsteht nur über Arbeitsberichte). */
export async function saveTimeEntry(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  const parsed = timeEntrySchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const t = parsed.data
  if (!ctx.isOffice && t.employee_id !== ctx.employee?.id) return fail('Nur eigene Zeiten erfassen.', { code: 'FORBIDDEN' })
  if (t.entry_date > berlinToday()) return fail('Zeiten können nicht im Voraus erfasst werden.', { code: 'INVALID' })

  let started_at: string | null = null
  let ended_at: string | null = null
  let duration = t.duration_minutes
  const breakMinutes = t.entry_type === 'pause' ? 0 : t.break_minutes
  if (t.start_time && t.end_time) {
    started_at = berlinLocalToUtc(t.entry_date, t.start_time)
    ended_at = berlinLocalToUtc(t.entry_date, t.end_time)
    duration = durationFromSpan(started_at, ended_at, breakMinutes)
    if (!duration) return fail('Die Pause ist länger als die erfasste Zeit.', { code: 'INVALID', fieldErrors: { break_minutes: 'Pause prüfen.' } })
  }

  const row = {
    employee_id: t.employee_id,
    entry_date: t.entry_date,
    entry_type: t.entry_type,
    job_id: t.entry_type === 'pause' ? null : t.job_id,
    started_at,
    ended_at,
    break_minutes: breakMinutes,
    duration_minutes: duration!,
    billable: t.billable,
    note: t.note,
  }

  const supabase = createClient()
  if (t.id) {
    const { data, error } = await supabase.from('zeiteintraege').update(row).eq('id', t.id).select('id')
    if (error) return fromDbError(error)
    if (!data?.length) return fail('Eintrag nicht änderbar (z. B. Teil eines Arbeitsberichts).', { code: 'FORBIDDEN' })
    revalidateTime()
    return ok({ id: t.id })
  }
  const { data, error } = await supabase.from('zeiteintraege').insert({ ...row, created_by: ctx.userId }).select('id').single()
  if (error) return fromDbError(error)
  revalidateTime()
  return ok({ id: data.id })
}

export async function deleteTimeEntry(id: string): Promise<ActionResult<null>> {
  await requireSession()
  const supabase = createClient()
  const { data, error } = await supabase.from('zeiteintraege').delete().eq('id', id).select('id')
  if (error) return fromDbError(error)
  if (!data?.length) return fail('Eintrag nicht löschbar (z. B. Teil eines Arbeitsberichts).', { code: 'FORBIDDEN' })
  revalidateTime()
  return ok(null)
}

export async function saveAbsence(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Abwesenheiten pflegt das Büro.', { code: 'FORBIDDEN' })
  const parsed = absenceSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const { data, error } = await supabase.from('fehlzeiten').insert({ ...parsed.data, created_by: ctx.userId }).select('id').single()
  if (error) return fromDbError(error)
  revalidateTime()
  return ok({ id: data.id })
}

export async function deleteAbsence(id: string): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const supabase = createClient()
  const { error } = await supabase.from('fehlzeiten').delete().eq('id', id)
  if (error) return fromDbError(error)
  revalidateTime()
  return ok(null)
}

/** Arbeitstag (Beginn/Ende/Pause) anlegen oder ändern – genau einer pro Mitarbeiter und Tag. */
export async function saveWorkDay(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  const parsed = workDaySchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const w = parsed.data
  if (!ctx.isOffice && w.employee_id !== ctx.employee?.id) return fail('Nur die eigene Arbeitszeit erfassen.', { code: 'FORBIDDEN' })
  if (w.berufsschule && !ctx.isOffice && ctx.employee?.employment_role !== 'auszubildender')
    return fail('Berufsschule können nur Auszubildende eintragen.', { code: 'FORBIDDEN' })
  if (w.work_date > berlinToday()) return fail('Arbeitszeit kann nicht im Voraus erfasst werden.', { code: 'INVALID' })
  const supabase = createClient()
  const { data, error } = await supabase
    .from('arbeitstage')
    .upsert({ ...w, created_by: ctx.userId }, { onConflict: 'employee_id,work_date' })
    .select('id')
    .single()
  if (error) return fromDbError(error)
  revalidateTime()
  return ok({ id: data.id })
}

export async function deleteWorkDay(id: string): Promise<ActionResult<null>> {
  await requireSession()
  const supabase = createClient()
  const { data, error } = await supabase.from('arbeitstage').delete().eq('id', id).select('id')
  if (error) return fromDbError(error)
  if (!data?.length) return fail('Eintrag nicht gefunden oder keine Berechtigung.', { code: 'FORBIDDEN' })
  revalidateTime()
  return ok(null)
}

export async function savePlaceAbbreviation(input: unknown): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Ortskürzel pflegt das Büro.', { code: 'FORBIDDEN' })
  const parsed = placeAbbreviationSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const { error } = await supabase.from('ortskuerzel').upsert(parsed.data, { onConflict: 'city' })
  if (error) return fromDbError(error)
  revalidateTime()
  return ok(null)
}

export async function deletePlaceAbbreviation(city: string): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const supabase = createClient()
  const { error } = await supabase.from('ortskuerzel').delete().eq('city', city)
  if (error) return fromDbError(error)
  revalidateTime()
  return ok(null)
}
