'use server'

import { revalidatePath } from 'next/cache'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, ok, type ActionResult } from '@/lib/ops/actions'
import { isIsoDate } from '@/lib/ops/domain/dates'

/** Gibt alle eingereichten Berichte eines Tages frei (jeweils über die geprüfte Datenbankfunktion). */
export async function approveSubmittedForDay(date: string): Promise<ActionResult<{ count: number }>> {
  await requireOffice()
  if (!isIsoDate(date)) return fail('Ungültiges Datum.', { code: 'INVALID' })
  const supabase = createClient()
  const { data, error } = await supabase.from('arbeitsberichte').select('id, version').eq('report_date', date).eq('status', 'eingereicht')
  if (error) return fromDbError(error)
  let count = 0
  for (const r of data ?? []) {
    const res = await supabase.rpc('arbeitsbericht_pruefen', { p_report_id: r.id, p_expected_version: r.version, p_decision: 'approve', p_comment: null })
    if (res.error) return fromDbError(res.error)
    count++
  }
  revalidatePath('/intern/abgabe')
  revalidatePath('/intern')
  return ok({ count })
}
