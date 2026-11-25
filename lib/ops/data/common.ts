import 'server-only'
import type { ServerSupabase } from '../supabase/server'
import type { DirectoryEmployee } from '../domain/types'
import { fullName } from '../utils'

export async function loadDirectory(supabase: ServerSupabase) {
  const { data } = await supabase.rpc('employee_directory')
  const list = (data ?? []) as DirectoryEmployee[]
  const byId = new Map(list.map((e) => [e.id, e]))
  const byProfile = new Map(list.filter((e) => e.profile_id).map((e) => [e.profile_id!, e]))
  return {
    list,
    active: list.filter((e) => e.is_active),
    name: (id: string | null | undefined) => (id && byId.get(id) ? fullName(byId.get(id)!) : 'Unbekannt'),
    profileName: (profileId: string | null | undefined) =>
      profileId && byProfile.get(profileId) ? fullName(byProfile.get(profileId)!) : null,
  }
}

export type Directory = Awaited<ReturnType<typeof loadDirectory>>

/** Auswahlliste der Aufträge (RLS begrenzt Mitarbeiter automatisch auf ihre Aufträge). */
export async function loadJobOptions(supabase: ServerSupabase) {
  const { data } = await supabase
    .from('jobs')
    .select(
      'id, job_number, title, status, category, start_date, customer:customers(id, customer_number, first_name, last_name, company_name), location:service_locations(street, postal_code, city)',
    )
    .is('archived_at', null)
    .neq('status', 'abgerechnet')
    .order('start_date', { ascending: false })
    .limit(400)
  return (data ?? []) as unknown as JobOption[]
}

export interface JobOption {
  id: string
  job_number: number
  title: string
  status: string
  category: string
  start_date: string
  customer: { id: string; customer_number: number; first_name: string | null; last_name: string | null; company_name: string | null } | null
  location: { street: string; postal_code: string; city: string } | null
}
