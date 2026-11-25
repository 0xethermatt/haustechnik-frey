'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { NativeSelect } from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ABSENCE_TYPE_LABELS } from '@/lib/ops/domain/labels'
import { formatDate } from '@/lib/ops/domain/dates'
import type { AbsenceType } from '@/lib/ops/domain/types'
import { deleteAbsence, saveAbsence } from '../../zeiten/actions'

interface Absence {
  id: string
  absence_type: AbsenceType
  start_date: string
  end_date: string
  half_day: boolean
  note: string | null
}

export function AbsenceManager({ employeeId, absences, today }: { employeeId: string; absences: Absence[]; today: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [v, setV] = useState({ absence_type: 'urlaub' as AbsenceType, start_date: today, end_date: today, half_day: false, note: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  const submit = () =>
    start(async () => {
      const res = await saveAbsence({ ...v, employee_id: employeeId }).catch(() => null)
      if (!res) return void toast.error('Keine Verbindung.')
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {})
        return void toast.error(res.error)
      }
      toast.success('Abwesenheit eingetragen')
      setOpen(false)
      router.refresh()
    })

  const remove = (id: string) =>
    start(async () => {
      if (!confirm('Abwesenheit löschen?')) return
      const res = await deleteAbsence(id).catch(() => null)
      if (!res?.ok) return void toast.error(res?.error ?? 'Keine Verbindung.')
      router.refresh()
    })

  return (
    <div className="space-y-3">
      {absences.length ? (
        <ul className="divide-y text-sm">
          {absences.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium">{ABSENCE_TYPE_LABELS[a.absence_type]}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {formatDate(a.start_date)}
                  {a.end_date !== a.start_date ? ` – ${formatDate(a.end_date)}` : ''}
                  {a.half_day ? ' (halber Tag)' : ''}
                  {a.note ? ` · ${a.note}` : ''}
                </span>
              </span>
              <button type="button" onClick={() => remove(a.id)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive" aria-label="Löschen">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Keine Abwesenheiten eingetragen.</p>
      )}
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus /> Abwesenheit
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Abwesenheit eintragen" description="Es werden keine Urlaubs- oder Zeitguthaben berechnet.">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <Field label="Art" htmlFor="a-type">
              <NativeSelect id="a-type" value={v.absence_type} onChange={(e) => setV({ ...v, absence_type: e.target.value as AbsenceType })}>
                {(Object.keys(ABSENCE_TYPE_LABELS) as AbsenceType[]).map((t) => (
                  <option key={t} value={t}>
                    {ABSENCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Von" htmlFor="a-start">
                <Input id="a-start" type="date" value={v.start_date} onChange={(e) => setV({ ...v, start_date: e.target.value, end_date: e.target.value > v.end_date ? e.target.value : v.end_date })} />
              </Field>
              <Field label="Bis" htmlFor="a-end" error={errors.end_date}>
                <Input id="a-end" type="date" value={v.end_date} min={v.start_date} onChange={(e) => setV({ ...v, end_date: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[hsl(var(--primary))]"
                checked={v.half_day}
                disabled={v.start_date !== v.end_date}
                onChange={(e) => setV({ ...v, half_day: e.target.checked })}
              />
              Halber Tag
            </label>
            <Field label="Notiz" optional htmlFor="a-note">
              <Input id="a-note" value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null} Speichern
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
