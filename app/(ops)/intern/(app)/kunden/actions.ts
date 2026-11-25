'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { customerCreateSchema, customerSchema, serviceLocationSchema } from '@/lib/ops/validation/schemas'
import { customerName } from '@/lib/ops/utils'

export interface CustomerHit {
  id: string
  customer_number: number
  name: string
  place: string
  /** true = nur über die Dublettenprüfung gefunden (Mitarbeiter ohne vollen Zugriff) */
  limited: boolean
  match_reason?: string
  locations: { id: string; label: string | null; street: string; postal_code: string; city: string }[]
}

export interface DuplicateHit {
  id: string
  customer_number: number
  display_name: string
  postal_code: string | null
  city: string | null
  match_reason: string
  service_locations: CustomerHit['locations']
}

function escapeLike(q: string) {
  return q.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** Kundensuche: sichtbare Kunden (RLS) plus Treffer der Dublettenprüfung. */
export async function searchCustomers(query: string): Promise<ActionResult<CustomerHit[]>> {
  await requireSession()
  const q = query.trim().toLowerCase().slice(0, 100)
  if (q.length < 2) return ok([])
  const supabase = createClient()
  const digits = q.replace(/\D/g, '')
  const isPhone = /^[\d\s/+()-]+$/.test(q) && digits.length >= 4
  const term = isPhone ? digits : q

  const [visible, duplicates] = await Promise.all([
    supabase
      .from('customers')
      .select('id, customer_number, first_name, last_name, company_name, billing_postal_code, billing_city, service_locations(id, label, street, postal_code, city, archived_at)')
      .is('archived_at', null)
      .ilike('search_text', `%${escapeLike(term)}%`)
      .order('last_name')
      .limit(8),
    supabase.rpc('find_customer_duplicates', {
      p_last_name: q,
      p_company_name: q,
      p_phone: digits.length >= 6 ? digits : null,
      p_email: q.includes('@') ? q : null,
    }),
  ])
  if (visible.error) return fromDbError(visible.error)

  const hits: CustomerHit[] = (visible.data ?? []).map((c) => ({
    id: c.id,
    customer_number: c.customer_number,
    name: customerName(c),
    place: [c.billing_postal_code, c.billing_city].filter(Boolean).join(' '),
    limited: false,
    locations: (c.service_locations ?? []).filter((l: { archived_at: string | null }) => !l.archived_at),
  }))
  for (const d of (duplicates.data ?? []) as DuplicateHit[]) {
    if (hits.some((h) => h.id === d.id)) continue
    hits.push({
      id: d.id,
      customer_number: d.customer_number,
      name: d.display_name,
      place: [d.postal_code, d.city].filter(Boolean).join(' '),
      limited: true,
      match_reason: d.match_reason,
      locations: d.service_locations,
    })
  }
  return ok(hits.slice(0, 10))
}

const duplicateQuery = z.object({
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  company_name: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  postal_code: z.string().nullish(),
})

export async function checkDuplicates(input: unknown): Promise<ActionResult<DuplicateHit[]>> {
  await requireSession()
  const parsed = duplicateQuery.safeParse(input)
  if (!parsed.success) return ok([])
  const v = parsed.data
  if (!v.last_name && !v.company_name && !v.phone && !v.email) return ok([])
  const supabase = createClient()
  const { data, error } = await supabase.rpc('find_customer_duplicates', {
    p_first_name: v.first_name || null,
    p_last_name: v.last_name || null,
    p_company_name: v.company_name || null,
    p_phone: v.phone || null,
    p_email: v.email || null,
    p_postal_code: v.postal_code || null,
  })
  if (error) return fromDbError(error)
  return ok((data ?? []) as DuplicateHit[])
}

export async function createCustomer(input: unknown): Promise<ActionResult<{ id: string; location_id: string | null }>> {
  const ctx = await requireSession()
  const parsed = customerCreateSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const { customer, service_location, service_location_same_as_billing } = parsed.data

  let location = service_location
  if (service_location_same_as_billing) {
    const loc = serviceLocationSchema.safeParse({
      street: customer.billing_street,
      postal_code: customer.billing_postal_code,
      city: customer.billing_city,
    })
    if (!loc.success) {
      return fail('Für den Einsatzort bitte Straße, PLZ und Ort der Rechnungsadresse angeben.', {
        code: 'INVALID',
        fieldErrors: { billing_street: 'Adresse unvollständig.' },
      })
    }
    location = loc.data
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...customer, created_by: ctx.userId })
    .select('id')
    .single()
  if (error) return fromDbError(error)

  let locationId: string | null = null
  if (location) {
    const loc = await supabase
      .from('service_locations')
      .insert({ ...location, customer_id: data.id })
      .select('id')
      .single()
    if (loc.error) return fromDbError(loc.error)
    locationId = loc.data.id
  }
  revalidatePath('/intern/kunden')
  return ok({ id: data.id, location_id: locationId })
}

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Nur das Büro kann Kundendaten ändern.', { code: 'FORBIDDEN' })
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const { error, count } = await supabase.from('customers').update(parsed.data, { count: 'exact' }).eq('id', id)
  if (error) return fromDbError(error)
  if (!count) return fail('Kunde nicht gefunden oder keine Berechtigung.', { code: 'FORBIDDEN' })
  revalidatePath(`/intern/kunden/${id}`)
  return ok(null)
}

export async function setCustomerArchived(id: string, archived: boolean): Promise<ActionResult<null>> {
  const ctx = await requireSession()
  if (!ctx.isOffice) return fail('Keine Berechtigung.', { code: 'FORBIDDEN' })
  const supabase = createClient()
  const { error } = await supabase
    .from('customers')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) return fromDbError(error)
  revalidatePath(`/intern/kunden/${id}`)
  revalidatePath('/intern/kunden')
  return ok(null)
}

export async function addServiceLocation(customerId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireSession()
  const parsed = serviceLocationSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('service_locations')
    .insert({ ...parsed.data, customer_id: customerId })
    .select('id')
    .single()
  if (error) return fromDbError(error)
  revalidatePath(`/intern/kunden/${customerId}`)
  return ok({ id: data.id })
}
