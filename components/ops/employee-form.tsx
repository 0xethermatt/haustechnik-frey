'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { NativeSelect } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { EMPLOYMENT_ROLE_LABELS } from '@/lib/ops/domain/labels'
import type { EmploymentRole } from '@/lib/ops/domain/types'
import { saveEmployee } from '@/app/(ops)/intern/(app)/mitarbeiter/actions'

export interface EmployeeFormValues {
  employee_number: string
  first_name: string
  last_name: string
  employment_role: EmploymentRole
  is_active: boolean
  start_date: string
  end_date: string
  weekly_target_hours: string
  annual_vacation_days: string
  requires_time_tracking: boolean
}

export function EmployeeForm({ id, initial }: { id?: string; initial: EmployeeFormValues }) {
  const router = useRouter()
  const [v, setV] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()
  const set = <K extends keyof EmployeeFormValues>(k: K, value: EmployeeFormValues[K]) => setV((p) => ({ ...p, [k]: value }))

  const submit = () =>
    start(async () => {
      try {
        const res = await saveEmployee(id ?? null, {
          employee_number: v.employee_number,
          first_name: v.first_name,
          last_name: v.last_name,
          employment_role: v.employment_role,
          is_active: v.is_active,
          start_date: v.start_date,
          end_date: v.end_date || null,
          weekly_target_minutes: Math.round(Number(v.weekly_target_hours.replace(',', '.')) * 60),
          annual_vacation_days: Number(v.annual_vacation_days.replace(',', '.')),
          requires_time_tracking: v.requires_time_tracking,
        })
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {})
          return void toast.error(res.error)
        }
        toast.success('Gespeichert')
        router.push(`/intern/mitarbeiter/${res.data.id}`)
        router.refresh()
      } catch {
        toast.error('Keine Verbindung.')
      }
    })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="space-y-4"
    >
      <Card>
        <CardContent className="grid gap-4 pt-4 md:grid-cols-2 md:pt-5">
          <Field label="Vorname" htmlFor="e-first" error={errors.first_name}>
            <Input id="e-first" value={v.first_name} onChange={(e) => set('first_name', e.target.value)} />
          </Field>
          <Field label="Nachname" htmlFor="e-last" error={errors.last_name}>
            <Input id="e-last" value={v.last_name} onChange={(e) => set('last_name', e.target.value)} />
          </Field>
          <Field label="Personalnummer" htmlFor="e-number" error={errors.employee_number}>
            <Input id="e-number" value={v.employee_number} onChange={(e) => set('employee_number', e.target.value)} />
          </Field>
          <Field label="Beschäftigung" htmlFor="e-role" hint="Unabhängig von Zugriffsrechten in der App">
            <NativeSelect id="e-role" value={v.employment_role} onChange={(e) => set('employment_role', e.target.value as EmploymentRole)}>
              {(Object.keys(EMPLOYMENT_ROLE_LABELS) as EmploymentRole[]).map((r) => (
                <option key={r} value={r}>
                  {EMPLOYMENT_ROLE_LABELS[r]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Eintritt" htmlFor="e-start" error={errors.start_date}>
            <Input id="e-start" type="date" value={v.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </Field>
          <Field label="Austritt" htmlFor="e-end" optional error={errors.end_date}>
            <Input id="e-end" type="date" value={v.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </Field>
          <Field label="Wochenarbeitszeit (Stunden)" htmlFor="e-target" error={errors.weekly_target_minutes} hint="Nur Stammdatum – keine Überstundenberechnung">
            <Input id="e-target" inputMode="decimal" value={v.weekly_target_hours} onChange={(e) => set('weekly_target_hours', e.target.value)} />
          </Field>
          <Field label="Urlaubsanspruch (Tage/Jahr)" htmlFor="e-vac" error={errors.annual_vacation_days}>
            <Input id="e-vac" inputMode="decimal" value={v.annual_vacation_days} onChange={(e) => set('annual_vacation_days', e.target.value)} />
          </Field>
          <label className="flex items-start gap-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 accent-[hsl(var(--primary))]"
              checked={v.requires_time_tracking}
              onChange={(e) => set('requires_time_tracking', e.target.checked)}
            />
            <span>
              Erfasst Arbeitszeit und Berichte selbst
              <span className="block text-xs text-muted-foreground">
                Ausschalten für den Inhaber, der auf Papier schreibt: Er erscheint nicht unter „Fehlende Zeiten“ und im Abgabe-Check und bekommt keinen automatischen Arbeitstag. In Berichten lässt er sich weiterhin mit Stunden eintragen.
              </span>
            </span>
          </label>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input type="checkbox" className="h-5 w-5 accent-[hsl(var(--primary))]" checked={v.is_active} onChange={(e) => set('is_active', e.target.checked)} />
            Aktiv (erscheint in Auswahllisten)
          </label>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null} Speichern
        </Button>
      </div>
    </form>
  )
}
