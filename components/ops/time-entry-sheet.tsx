'use client'

import { TimeInput } from '@/components/ui/time-input'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { NativeSelect } from '@/components/ui/select'
import { DurationInput } from './report-form/duration-input'
import { MANUAL_TIME_ENTRY_TYPES, TIME_ENTRY_TYPE_LABELS } from '@/lib/ops/domain/labels'
import { formatMinutes } from '@/lib/ops/domain/time'
import type { TimeEntryType } from '@/lib/ops/domain/types'
import { cn } from '@/lib/ops/utils'
import { deleteTimeEntry, saveTimeEntry } from '@/app/(ops)/intern/(app)/zeiten/actions'

export interface EditableEntry {
  id?: string
  entry_type: TimeEntryType
  job_id: string | null
  start_time: string
  end_time: string
  break_minutes: number
  duration_minutes: number
  useSpan: boolean
  billable: boolean
  note: string
}

const blank: EditableEntry = {
  entry_type: 'fahrzeit',
  job_id: null,
  start_time: '',
  end_time: '',
  break_minutes: 0,
  duration_minutes: 30,
  useSpan: false,
  billable: false,
  note: '',
}

function spanMinutes(e: EditableEntry) {
  if (!e.start_time || !e.end_time || e.end_time <= e.start_time) return 0
  const [sh, sm] = e.start_time.split(':').map(Number)
  const [eh, em] = e.end_time.split(':').map(Number)
  return Math.max(0, eh * 60 + em - sh * 60 - sm - (e.entry_type === 'pause' ? 0 : e.break_minutes))
}

export function TimeEntrySheet({
  employeeId,
  date,
  jobs,
  entry,
  children,
  triggerClassName,
}: {
  employeeId: string
  date: string
  jobs: { id: string; label: string }[]
  entry?: EditableEntry
  /** Inhalt eines eigenen Auslöse-Buttons (z. B. Listenzeile); sonst Standard-Button */
  children?: React.ReactNode
  triggerClassName?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [e, setE] = useState<EditableEntry>(entry ?? blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  const openSheet = () => {
    setE(entry ?? blank)
    setErrors({})
    setOpen(true)
  }
  const set = (patch: Partial<EditableEntry>) => setE((prev) => ({ ...prev, ...patch }))
  const canBill = e.entry_type === 'fahrzeit' && !!e.job_id

  const submit = () =>
    start(async () => {
      try {
        const res = await saveTimeEntry({
          id: e.id,
          employee_id: employeeId,
          entry_date: date,
          entry_type: e.entry_type,
          job_id: e.entry_type === 'pause' ? null : e.job_id,
          start_time: e.useSpan ? e.start_time || null : null,
          end_time: e.useSpan ? e.end_time || null : null,
          break_minutes: e.useSpan && e.entry_type !== 'pause' ? e.break_minutes : 0,
          duration_minutes: e.useSpan ? null : e.duration_minutes || null,
          billable: canBill && e.billable,
          note: e.note,
        })
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {})
          return void toast.error(res.error)
        }
        toast.success('Zeit gespeichert')
        setOpen(false)
        router.refresh()
      } catch {
        toast.error('Keine Verbindung. Bitte erneut versuchen.')
      }
    })

  const remove = () =>
    start(async () => {
      if (!e.id || !confirm('Eintrag löschen?')) return
      try {
        const res = await deleteTimeEntry(e.id)
        if (!res.ok) return void toast.error(res.error)
        toast.success('Eintrag gelöscht')
        setOpen(false)
        router.refresh()
      } catch {
        toast.error('Keine Verbindung.')
      }
    })

  return (
    <>
      {children ? (
        <button type="button" onClick={openSheet} className={triggerClassName}>
          {children}
        </button>
      ) : (
        <Button onClick={openSheet} variant="outline" className="w-full">
          <Plus /> Zeit hinzufügen
        </Button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          title={e.id ? 'Zeit bearbeiten' : 'Zeit hinzufügen'}
          description="Kundenarbeit wird über den Arbeitsbericht erfasst."
        >
          <form
            className="space-y-4"
            onSubmit={(ev) => {
              ev.preventDefault()
              submit()
            }}
          >
            <Field label="Art">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MANUAL_TIME_ENTRY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set({ entry_type: t, billable: t === 'fahrzeit' ? e.billable : false })}
                    className={cn(
                      'h-11 rounded-lg border text-sm',
                      e.entry_type === t ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {TIME_ENTRY_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </Field>

            {e.entry_type !== 'pause' ? (
              <Field label="Auftrag" optional htmlFor="te-job" error={errors.job_id}>
                <NativeSelect id="te-job" value={e.job_id ?? ''} onChange={(ev) => set({ job_id: ev.target.value || null })}>
                  <option value="">Ohne Auftrag</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}

            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {[false, true].map((span) => (
                <button
                  key={String(span)}
                  type="button"
                  onClick={() => set({ useSpan: span })}
                  className={cn('h-9 rounded-md text-sm text-muted-foreground', e.useSpan === span && 'bg-background font-medium text-foreground shadow-sm')}
                >
                  {span ? 'Von – Bis' : 'Dauer'}
                </button>
              ))}
            </div>

            {e.useSpan ? (
              <div className="grid grid-cols-3 gap-2">
                <Field label="Beginn" htmlFor="te-start">
                  <TimeInput id="te-start" value={e.start_time} onValueChange={(v) => set({ start_time: v })} required />
                </Field>
                <Field label="Ende" htmlFor="te-end" error={errors.end_time}>
                  <TimeInput id="te-end" value={e.end_time} onValueChange={(v) => set({ end_time: v })} required />
                </Field>
                {e.entry_type !== 'pause' ? (
                  <Field label="Pause (min)" htmlFor="te-break" error={errors.break_minutes}>
                    <Input
                      id="te-break"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={5}
                      value={e.break_minutes}
                      onChange={(ev) => set({ break_minutes: Math.max(0, Number(ev.target.value) || 0) })}
                    />
                  </Field>
                ) : null}
                <p className="col-span-3 text-sm text-muted-foreground">
                  Dauer: <span className="tabular font-semibold text-foreground">{formatMinutes(spanMinutes(e))}</span>
                </p>
              </div>
            ) : (
              <Field label="Dauer" error={errors.duration_minutes}>
                <DurationInput value={e.duration_minutes} onChange={(m) => set({ duration_minutes: m })} />
              </Field>
            )}

            {e.entry_type === 'fahrzeit' ? (
              <label className={cn('flex items-center gap-3 rounded-lg border p-3 text-sm', !canBill && 'opacity-50')}>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[hsl(var(--primary))]"
                  checked={canBill && e.billable}
                  disabled={!canBill}
                  onChange={(ev) => set({ billable: ev.target.checked })}
                />
                <span>
                  Verrechenbar (Anfahrt beim Kunden)
                  {!canBill ? <span className="block text-xs text-muted-foreground">Nur mit Auftrag möglich</span> : null}
                </span>
              </label>
            ) : null}

            <Field label="Notiz" optional htmlFor="te-note">
              <Input id="te-note" value={e.note} onChange={(ev) => set({ note: ev.target.value })} maxLength={500} />
            </Field>

            <div className="flex gap-2">
              {e.id ? (
                <Button type="button" variant="ghost" className="text-destructive" onClick={remove} disabled={pending}>
                  <Trash2 /> Löschen
                </Button>
              ) : null}
              <Button type="submit" className="flex-1" size="lg" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null} Speichern
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
