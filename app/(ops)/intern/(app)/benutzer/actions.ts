'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { createAdminClient } from '@/lib/ops/supabase/admin'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { inviteSchema, userAccessSchema } from '@/lib/ops/validation/schemas'

/**
 * Einladung per E-Mail (keine öffentliche Registrierung). Der Service-Role-Schlüssel
 * wird ausschließlich für den Auth-Aufruf verwendet; Rollen werden anschließend über
 * die rechteprüfende Datenbankfunktion mit der Sitzung des Admins gesetzt (auditiert).
 */
export async function inviteUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  if (!ctx.isAdmin) return fail('Nur Administratoren dürfen einladen.', { code: 'FORBIDDEN' })
  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  const origin = headers().get('origin') ?? ''
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { display_name: parsed.data.display_name },
    redirectTo: `${origin}/intern/auth/confirm?next=/intern/passwort`,
  })
  if (error || !data.user) {
    const exists = error?.code === 'email_exists' || /already/i.test(error?.message ?? '')
    return fail(exists ? 'Für diese E-Mail existiert bereits ein Zugang.' : 'Einladung konnte nicht versendet werden.', {
      code: exists ? 'DUPLICATE' : 'UNKNOWN',
    })
  }

  const supabase = createClient()
  const { error: accessError } = await supabase.rpc('zugang_setzen', {
    p_user_id: data.user.id,
    p_roles: parsed.data.roles,
    p_is_active: true,
    p_display_name: parsed.data.display_name,
    p_employee_id: parsed.data.employee_id,
  })
  if (accessError) return fromDbError(accessError)
  revalidatePath('/intern/benutzer')
  return ok({ id: data.user.id })
}

export async function setUserAccess(input: unknown): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isAdmin) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const parsed = userAccessSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const { error } = await supabase.rpc('zugang_setzen', {
    p_user_id: parsed.data.user_id,
    p_roles: parsed.data.roles,
    p_is_active: parsed.data.is_active,
    p_display_name: parsed.data.display_name,
    p_employee_id: parsed.data.employee_id,
  })
  if (error) return fromDbError(error)
  revalidatePath('/intern/benutzer')
  return ok(null)
}
