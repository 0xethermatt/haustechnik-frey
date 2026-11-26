'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { NativeSelect } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EMPLOYMENT_ROLE_LABELS, JOB_CATEGORY_LABELS } from '@/lib/ops/domain/labels'
import type { DirectoryEmployee, JobCategory } from '@/lib/ops/domain/types'
import { cn, formatAddress, fullName } from '@/lib/ops/utils'
import { createJob, updateJob } from '@/app/(ops)/intern/(app)/auftraege/actions'

export interface JobFormValues {
  customer_id: string
  service_location_id: string
  title: string
  description: string
  category: JobCategory
  start_date: string
  completion_date: string
  notes: string
  assigned_employee_ids: string[]
}

export function JobForm({
  jobId,
  initial,
  customers,
  locations,
  employees,
}: {
  jobId?: string
  initial: JobFormValues
  customers: { id: string; name: string }[]
  locations: { id: string; customer_id: string; label: string | null; street: string; postal_code: string; city: string }[]
  employees: DirectoryEmployee[]
}) {
  const router = useRouter()
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
  const customerLocations = useMemo(() => locations.filter((l) => l.customer_id === v.customer_id), [locations, v.customer_id])
  const set = <K extends keyof JobFormValues>(k: K, value: JobFormValues[K]) => setV((p) => ({ ...p, [k]: value }))

  const submit = () =>
    start(async () => {
      const payload = { ...v, service_location_id: v.service_location_id || null, completion_date: v.completion_date || null }
      try {
        const res = jobId ? await updateJob(jobId, payload) : await createJob(payload)
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {})
          return void toast.error(res.error)
        }
        toast.success(jobId ? 'Auftrag gespeichert' : 'Auftrag angelegt')
        router.push(`/intern/auftraege/${jobId ?? (res.data as { id: string }).id}`)
        router.refresh()
      } catch {
        toast.error('Keine Verbindung. Bitte erneut versuchen.')
      }
    })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Auftrag</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Kunde" htmlFor="j-customer" error={errors.customer_id} className="md:col-span-2">
            <NativeSelect
              id="j-customer"
              value={v.customer_id}
              onChange={(e) => setV((p) => ({ ...p, customer_id: e.target.value, service_location_id: '' }))}
              disabled={!!jobId}
            >
              <option value="">Kunde wählen …</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Einsatzort" htmlFor="j-location" optional className="md:col-span-2">
            <NativeSelect id="j-location" value={v.service_location_id} onChange={(e) => set('service_location_id', e.target.value)} disabled={!v.customer_id}>
              <option value="">Kein Einsatzort</option>
              {customerLocations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label ? `${l.label}: ` : ''}
                  {formatAddress(l)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Titel" htmlFor="j-title" error={errors.title} className="md:col-span-2">
            <Input id="j-title" value={v.title} onChange={(e) => set('title', e.target.value)} placeholder="z. B. Badsanierung OG" />
          </Field>
          <Field label="Kategorie" htmlFor="j-category">
            <NativeSelect id="j-category" value={v.category} onChange={(e) => set('category', e.target.value as JobCategory)}>
              {(Object.keys(JOB_CATEGORY_LABELS) as JobCategory[]).map((c) => (
                <option key={c} value={c}>
                  {JOB_CATEGORY_LABELS[c]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-3 md:col-span-2">
            <Field label="Beginn" htmlFor="j-start" error={errors.start_date}>
              <Input id="j-start" type="date" value={v.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </Field>
            <Field label="Fertigstellung" htmlFor="j-end" optional error={errors.completion_date}>
              <Input id="j-end" type="date" value={v.completion_date} onChange={(e) => set('completion_date', e.target.value)} />
            </Field>
          </div>
          <Field label="Beschreibung" htmlFor="j-desc" optional className="md:col-span-2">
            <Textarea id="j-desc" value={v.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Interne Notizen" htmlFor="j-notes" optional className="md:col-span-2">
            <Textarea id="j-notes" value={v.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zugewiesene Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {employees
            .filter((e) => e.is_active || v.assigned_employee_ids.includes(e.id))
            .map((e) => {
              const checked = v.assigned_employee_ids.includes(e.id)
              return (
                <label key={e.id} className={cn('flex items-center gap-3 rounded-lg border p-3 text-sm', checked && 'border-primary bg-primary/5')}>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[hsl(var(--primary))]"
                    checked={checked}
                    onChange={() =>
                      set('assigned_employee_ids', checked ? v.assigned_employee_ids.filter((id) => id !== e.id) : [...v.assigned_employee_ids, e.id])
                    }
                  />
                  <span>
                    <span className="block font-medium">{fullName(e)}</span>
                    <span className="text-xs text-muted-foreground">{EMPLOYMENT_ROLE_LABELS[e.employment_role]}</span>
                  </span>
                </label>
              )
            })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {jobId ? 'Speichern' : 'Auftrag anlegen'}
        </Button>
      </div>
    </form>
  )
}
