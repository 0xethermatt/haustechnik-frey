'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { DurationInput } from './report-form/duration-input'
import { addDays } from '@/lib/ops/domain/dates'
import {
  INTERNAL_KINDS,
  INTERNAL_KIND_ENTRY_TYPE,
  INTERNAL_KIND_LABELS,
  INTERNAL_SUGGESTIONS,
  internalNote,
  type InternalKind,
} from '@/lib/ops/domain/internal-work'
import { cn } from '@/lib/ops/utils'
import { saveTimeEntry } from '@/app/(ops)/intern/(app)/zeiten/actions'

/** Schnellerfassung für Arbeit ohne Kunde: Lager, Fahrzeug, Material, Sonstiges. */
export function InternalEntryForm({ employeeId, today, initialKind }: { employeeId: string; today: string; initialKind: InternalKind }) {
  const router = useRouter()
  const [kind, setKind] = useState<InternalKind>(initialKind)
  const [date, setDate] = useState(today)
  const [text, setText] = useState('')
  const [minutes, setMinutes] = useState(60)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  const submit = () =>
    start(async () => {
      setErrors({})
      try {
        const res = await saveTimeEntry({
          employee_id: employeeId,
          entry_date: date,
          entry_type: INTERNAL_KIND_ENTRY_TYPE[kind],
          job_id: null,
          duration_minutes: minutes,
          break_minutes: 0,
          billable: false,
          note: internalNote(kind, text),
        })
        if (!res.ok) {
          setErrors(res.fieldErrors ?? {})
          return void toast.error(res.error)
        }
        toast.success('Gespeichert')
        router.push('/intern')
        router.refresh()
      } catch {
        toast.error('Keine Verbindung. Bitte erneut versuchen.')
      }
    })

  return (
    <form
      className="mx-auto max-w-xl space-y-5 px-4 py-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Art der Arbeit">
        {INTERNAL_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={cn('h-10 rounded-md text-sm text-muted-foreground', kind === k && 'bg-background font-medium text-foreground shadow-sm')}
          >
            {INTERNAL_KIND_LABELS[k]}
          </button>
        ))}
      </div>

      <Field label="Was wurde gemacht?" htmlFor="ie-text" optional error={errors.note}>
        <Input id="ie-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} autoComplete="off" placeholder={INTERNAL_SUGGESTIONS[kind][0]} />
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERNAL_SUGGESTIONS[kind].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setText(s)}
              className={cn('h-9 rounded-full border px-3 text-sm', text === s ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground')}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Wie lange?" error={errors.duration_minutes}>
        <DurationInput value={minutes} onChange={setMinutes} invalid={!!errors.duration_minutes} />
      </Field>

      <Field label="Wann?" error={errors.entry_date}>
        <div className="flex items-center gap-2">
          {[today, addDays(today, -1)].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              className={cn('h-10 rounded-lg border px-3 text-sm', date === d ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground')}
            >
              {d === today ? 'Heute' : 'Gestern'}
            </button>
          ))}
          <Input type="date" aria-label="Datum" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-10 flex-1" />
        </div>
      </Field>

      <Button type="submit" size="xl" className="w-full" disabled={pending || minutes < 1}>
        {pending ? <Loader2 className="animate-spin" /> : null} Speichern
      </Button>
    </form>
  )
}
