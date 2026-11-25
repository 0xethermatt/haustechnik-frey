'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMinutes } from '@/lib/ops/domain/time'
import { cn } from '@/lib/ops/utils'
import { deleteWorkDay, saveWorkDay } from '@/app/(ops)/intern/(app)/zeiten/actions'

export interface WorkDayValue {
  id: string
  start_time: string
  end_time: string
  break_minutes: number
  duration_minutes: number
  note: string | null
}

function spanMinutes(start: string, end: string, breakMinutes: number) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm) - breakMinutes
}

/**
 * Arbeitstag mit einem Tipp: Die üblichen Zeiten sind vorausgefüllt und werden
 * nur bei Abweichung geändert. Ersetzt das Abfragen der Wochenstunden.
 */
export function WorkDayCard({
  employeeId,
  date,
  workDay,
  defaults,
  title,
  className,
}: {
  employeeId: string
  date: string
  workDay?: WorkDayValue
  defaults: { start: string; end: string; breakMinutes: number }
  title: string
  className?: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(!workDay)
  const [start, setStart] = useState(workDay?.start_time.slice(0, 5) ?? defaults.start)
  const [end, setEnd] = useState(workDay?.end_time.slice(0, 5) ?? defaults.end)
  const [breakMinutes, setBreakMinutes] = useState(workDay?.break_minutes ?? defaults.breakMinutes)
  const [note, setNote] = useState(workDay?.note ?? '')
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const minutes = start && end ? spanMinutes(start, end, breakMinutes) : 0

  const save = () =>
    startTransition(async () => {
      setError(undefined)
      try {
        const res = await saveWorkDay({
          employee_id: employeeId,
          work_date: date,
          start_time: start,
          end_time: end,
          break_minutes: breakMinutes,
          note,
        })
        if (!res.ok) {
          setError(Object.values(res.fieldErrors ?? {})[0] ?? res.error)
          return
        }
        toast.success('Arbeitszeit gespeichert')
        setEditing(false)
        router.refresh()
      } catch {
        setError('Keine Verbindung. Bitte erneut versuchen.')
      }
    })

  const remove = () =>
    startTransition(async () => {
      if (!workDay || !confirm('Arbeitszeit für diesen Tag löschen?')) return
      try {
        const res = await deleteWorkDay(workDay.id)
        if (!res.ok) return void toast.error(res.error)
        setEditing(true)
        router.refresh()
      } catch {
        toast.error('Keine Verbindung.')
      }
    })

  if (workDay && !editing) {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl border bg-card p-4', className)}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="tabular font-semibold">
            {workDay.start_time.slice(0, 5)}–{workDay.end_time.slice(0, 5)} Uhr
            <span className="font-normal text-muted-foreground">
              {' '}
              · {workDay.break_minutes ? `${workDay.break_minutes} min Pause · ` : ''}
              {formatMinutes(workDay.duration_minutes)}
            </span>
          </div>
          {workDay.note ? <div className="truncate text-xs text-muted-foreground">{workDay.note}</div> : null}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Arbeitszeit ändern">
          <Pencil />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3 rounded-xl border border-primary/30 bg-card p-4', className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <span className="font-semibold">{title}</span>
        <span className="tabular ml-auto text-sm text-muted-foreground">{minutes > 0 ? formatMinutes(minutes) : '–'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          Beginn
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Beginn" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Ende
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="Ende" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Pause (min)
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Pause in Minuten"
          />
        </label>
      </div>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bemerkung (optional), z. B. TÜV" maxLength={500} aria-label="Bemerkung" />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        {workDay ? (
          <Button variant="ghost" className="text-destructive" onClick={remove} disabled={pending} aria-label="Arbeitszeit löschen">
            <Trash2 />
          </Button>
        ) : null}
        {workDay ? (
          <Button variant="outline" onClick={() => setEditing(false)} disabled={pending}>
            Abbrechen
          </Button>
        ) : null}
        <Button className="flex-1" size="lg" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Check />}
          {workDay ? 'Speichern' : `${start}–${end} speichern`}
        </Button>
      </div>
    </div>
  )
}
