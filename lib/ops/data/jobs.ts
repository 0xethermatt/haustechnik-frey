import 'server-only'
import type { ServerSupabase } from '../supabase/server'
import { customerName } from '../utils'

/** Auswahldaten für das Auftragsformular (nur Büro). */
export async function loadJobFormOptions(supabase: ServerSupabase) {
  const [{ data: customers }, { data: locations }] = await Promise.all([
    supabase.from('kunden').select('id, first_name, last_name, company_name, billing_city').is('archived_at', null).order('last_name').limit(2000),
    supabase.from('einsatzorte').select('id, customer_id, label, street, postal_code, city').is('archived_at', null).limit(5000),
  ])
  return {
    customers: (customers ?? [])
      .map((c) => ({ id: c.id, name: `${customerName(c)}${c.billing_city ? ` (${c.billing_city})` : ''}` }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de')),
    locations: locations ?? [],
  }
}
