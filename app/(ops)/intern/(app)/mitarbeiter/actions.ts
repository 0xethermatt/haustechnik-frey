'use server'

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { employeeSchema } from '@/lib/ops/validation/schemas'

export async function saveEmployee(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const parsed = employeeSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  if (id) {
    const { error } = await supabase.from('mitarbeiter').update(parsed.data).eq('id', id)
    if (error) return fromDbError(error)
    revalidatePath('/intern', 'layout')
    return ok({ id })
  }
  const { data, error } = await supabase.from('mitarbeiter').insert(parsed.data).select('id').single()
  if (error) return fromDbError(error)
  revalidatePath('/intern', 'layout')
  return ok({ id: data.id })
}
