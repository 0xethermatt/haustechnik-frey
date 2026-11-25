'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { jobCategories, jobSchema, jobStatusSchema } from '@/lib/ops/validation/schemas'
import { berlinToday } from '@/lib/ops/domain/dates'
import type { JobOption } from '@/lib/ops/data/common'

const quickJobSchema = z.object({
  customer_id: z.uuid('Bitte einen Kunden wählen.'),
  service_location_id: z.uuid().nullable(),
  title: z.string().trim().min(1, 'Bitte beschreiben, was zu tun ist.').max(200),
  category: z.enum(jobCategories),
})

/** Schnellanlage eines Auftrags aus dem Arbeitsbericht heraus. */
export async function quickCreateJob(input: unknown): Promise<ActionResult<JobOption>> {
  const ctx = await requireSession()
  const parsed = quickJobSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...parsed.data,
      status: 'in_bearbeitung',
      start_date: berlinToday(),
      created_by: ctx.userId,
    })
    .select('id')
    .single()
  if (error) return fromDbError(error)
  // Separat nachladen: Die automatische Zuweisung (Trigger) macht den Kunden für
  // Mitarbeiter erst nach dem INSERT-Statement sichtbar.
  const { data: job, error: loadError } = await supabase
    .from('jobs')
    .select(
      'id, job_number, title, status, category, start_date, customer:customers(id, customer_number, first_name, last_name, company_name), location:service_locations(street, postal_code, city)',
    )
    .eq('id', data.id)
    .single()
  if (loadError) return fromDbError(loadError)
  revalidatePath('/intern/auftraege')
  return ok(job as unknown as JobOption)
}

export async function createJob(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Nur das Büro kann Aufträge vollständig anlegen.', { code: 'FORBIDDEN' })
  const parsed = jobSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const { assigned_employee_ids, ...job } = parsed.data
  const supabase = createClient()
  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...job, created_by: ctx.userId })
    .select('id')
    .single()
  if (error) return fromDbError(error)
  if (assigned_employee_ids.length) {
    const res = await supabase
      .from('job_assignments')
      .upsert(assigned_employee_ids.map((employee_id) => ({ job_id: data.id, employee_id })), { ignoreDuplicates: true })
    if (res.error) return fromDbError(res.error)
  }
  revalidatePath('/intern/auftraege')
  return ok({ id: data.id })
}

export async function updateJob(id: string, input: unknown): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const parsed = jobSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const { assigned_employee_ids, ...job } = parsed.data
  const supabase = createClient()
  const { error } = await supabase.from('jobs').update(job).eq('id', id)
  if (error) return fromDbError(error)

  const { data: current } = await supabase.from('job_assignments').select('employee_id').eq('job_id', id)
  const existing = new Set((current ?? []).map((a) => a.employee_id))
  const wanted = new Set(assigned_employee_ids)
  const toRemove = [...existing].filter((e) => !wanted.has(e))
  const toAdd = [...wanted].filter((e) => !existing.has(e))
  if (toRemove.length) {
    const res = await supabase.from('job_assignments').delete().eq('job_id', id).in('employee_id', toRemove)
    if (res.error) return fromDbError(res.error)
  }
  if (toAdd.length) {
    const res = await supabase.from('job_assignments').insert(toAdd.map((employee_id) => ({ job_id: id, employee_id })))
    if (res.error) return fromDbError(res.error)
  }
  revalidatePath(`/intern/auftraege/${id}`)
  revalidatePath('/intern/auftraege')
  return ok(null)
}

export async function setJobStatus(input: unknown): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const parsed = jobStatusSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const patch: Record<string, unknown> = { status: parsed.data.status }
  if (['abgeschlossen', 'abrechnungsbereit', 'abgerechnet'].includes(parsed.data.status)) {
    const { data: job } = await supabase.from('jobs').select('completion_date, start_date').eq('id', parsed.data.job_id).single()
    if (job && !job.completion_date) patch.completion_date = berlinToday() < job.start_date ? job.start_date : berlinToday()
  }
  const { error } = await supabase.from('jobs').update(patch).eq('id', parsed.data.job_id)
  if (error) return fromDbError(error)
  revalidatePath('/intern', 'layout')
  return ok(null)
}

export async function setJobArchived(id: string, archived: boolean): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const supabase = createClient()
  const { error } = await supabase.from('jobs').update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', id)
  if (error) return fromDbError(error)
  revalidatePath('/intern', 'layout')
  return ok(null)
}
