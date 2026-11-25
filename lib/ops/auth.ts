import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { AppRole, Employee, Profile } from './domain/types'

export interface SessionContext {
  userId: string
  email: string
  profile: Profile
  roles: AppRole[]
  isAdmin: boolean
  isOffice: boolean
  isEmployee: boolean
  employee: Pick<Employee, 'id' | 'first_name' | 'last_name' | 'employment_role'> | null
}

/** Lädt Benutzer, Profil und verknüpften Mitarbeiter (pro Request gecacht). */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: employee }] = await Promise.all([
    supabase.from('profiles').select('id, email, display_name, roles, is_active, created_at').eq('id', user.id).maybeSingle(),
    supabase.from('employees').select('id, first_name, last_name, employment_role').eq('profile_id', user.id).eq('is_active', true).maybeSingle(),
  ])
  if (!profile) return null

  const roles = (profile.is_active ? profile.roles : []) as AppRole[]
  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile: profile as Profile,
    roles,
    isAdmin: roles.includes('admin'),
    isOffice: roles.includes('admin') || roles.includes('office'),
    isEmployee: roles.includes('employee') && !!employee,
    employee: roles.includes('employee') ? (employee ?? null) : null,
  }
})

export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) redirect('/intern/login')
  if (ctx.roles.length === 0) redirect('/intern/kein-zugriff')
  return ctx
}

export async function requireOffice(): Promise<SessionContext> {
  const ctx = await requireSession()
  if (!ctx.isOffice) redirect('/intern')
  return ctx
}

export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await requireSession()
  if (!ctx.isAdmin) redirect('/intern')
  return ctx
}
