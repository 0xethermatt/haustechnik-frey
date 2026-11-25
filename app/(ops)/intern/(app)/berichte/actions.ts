'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { reviewSchema, workReportSchema } from '@/lib/ops/validation/schemas'
import { SpanError, toRpcPayload } from '@/lib/ops/reports'
import type { ReportStatus } from '@/lib/ops/domain/types'

export interface SaveResult {
  id: string
  version: number
  status: ReportStatus
  report_number: number
  replayed: boolean
}

function revalidateReports(id?: string) {
  revalidatePath('/intern', 'layout')
  if (id) revalidatePath(`/intern/berichte/${id}`)
}

export async function saveReport(input: unknown): Promise<ActionResult<SaveResult>> {
  await requireSession()
  const parsed = workReportSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  let payload
  try {
    payload = toRpcPayload(parsed.data)
  } catch (e) {
    if (e instanceof SpanError) return fail(e.message, { code: 'INVALID', fieldErrors: { participants: e.message } })
    throw e
  }

  const supabase = createClient()
  const { data, error } = await supabase.rpc('arbeitsbericht_speichern', { p: payload })
  if (error) return fromDbError(error)
  revalidateReports(parsed.data.id)
  return ok(data as SaveResult)
}

/** Aktueller Stand für Konfliktauflösung nach Netzabbruch. */
export async function getReportSyncState(
  id: string,
): Promise<ActionResult<{ version: number; last_mutation_id: string | null; status: ReportStatus } | null>> {
  await requireSession()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('arbeitsberichte')
    .select('version, last_mutation_id, status')
    .eq('id', id)
    .maybeSingle()
  if (error) return fromDbError(error)
  return ok(data as { version: number; last_mutation_id: string | null; status: ReportStatus } | null)
}

export async function reviewReport(input: unknown): Promise<ActionResult<{ status: ReportStatus; version: number }>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Nur das Büro kann Berichte prüfen.', { code: 'FORBIDDEN' })
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const { data, error } = await supabase.rpc('arbeitsbericht_pruefen', {
    p_report_id: parsed.data.report_id,
    p_expected_version: parsed.data.expected_version,
    p_decision: parsed.data.decision,
    p_comment: parsed.data.comment,
  })
  if (error) return fromDbError(error)
  revalidateReports(parsed.data.report_id)
  return ok(data as { status: ReportStatus; version: number })
}

export async function deleteDraft(id: string, version: number): Promise<ActionResult<null>> {
  await requireSession()
  const supabase = createClient()
  const { error } = await supabase.rpc('arbeitsbericht_entwurf_loeschen', { p_report_id: id, p_expected_version: version })
  if (error) return fromDbError(error)
  revalidateReports()
  return ok(null)
}
