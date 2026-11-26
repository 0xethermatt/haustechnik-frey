'use client'

import { TimeInput } from '@/components/ui/time-input'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, GraduationCap, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMinutes } from '@/lib/ops/domain/time'
import { ARBEITSTAG_STANDARD, BERUFSSCHULTAG } from '@/lib/ops/domain/workday'
import { cn } from '@/lib/ops/utils'
import { deleteWorkDay, saveWorkDay } from '@/app/(ops)/intern/(app)/zeiten/actions'

export interface WorkDayValue {
  id: string
  start_time: string
  end_time: string
  break_minutes: number
  duration_minutes: number
  note: string | null
  berufsschule?: boolean
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
  canSchool = false,
  schoolDefault = false,
  className,
}: {
  employeeId: string
  date: string
  workDay?: WorkDayValue
  defaults: { start: string; end: string; breakMinutes: number }
  title: string
  /** Azubis können den Tag als Berufsschultag erfassen */
  canSchool?: boolean
  schoolDefault?: boolean
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
          berufsschule: false,
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

  const saveQuick = (times: { start: string; end: string; breakMinutes: number }, school: boolean) =>
    startTransition(async () => {
      setError(undefined)
      try {
        const res = await saveWorkDay({
          employee_id: employeeId,
          work_date: date,
          start_time: times.start,
          end_time: times.end,
          break_minutes: times.breakMinutes,
          note: '',
          berufsschule: school,
        })
        if (!res.ok) {
          setError(Object.values(res.fieldErrors ?? {})[0] ?? res.error)
          return
        }
        toast.success(school ? 'Berufsschule gespeichert' : 'Arbeitszeit gespeichert')
        setEditing(false)
        router.refresh()
      } catch {
        setError('Keine Verbindung. Bitte erneut versuchen.')
      }
    })
  const saveSchool = () => saveQuick(BERUFSSCHULTAG, true)
  const saveStandard = () => saveQuick(ARBEITSTAG_STANDARD, false)

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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {workDay.berufsschule ? <GraduationCap className="h-3.5 w-3.5 text-primary" /> : null}
            {title}
          </div>
          <div className="tabular font-semibold">
            {workDay.berufsschule ? (
              <>
                Berufsschule
                <span className="font-normal text-muted-foreground"> · {formatMinutes(workDay.duration_minutes)} pauschal</span>
              </>
            ) : (
              <>
                {workDay.start_time.slice(0, 5)}–{workDay.end_time.slice(0, 5)} Uhr
                <span className="font-normal text-muted-foreground">
                  {' '}
                  · {workDay.break_minutes ? `${workDay.break_minutes} min Pause · ` : ''}
                  {formatMinutes(workDay.duration_minutes)}
                </span>
              </>
            )}
          </div>
          {workDay.note ? <div className="truncate text-xs text-muted-foreground">{workDay.note}</div> : null}
        </div>
        {canSchool && !workDay.berufsschule ? (
          <Button variant="outline" size="sm" onClick={saveSchool} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <GraduationCap />} Schule
          </Button>
        ) : null}
        {workDay.berufsschule ? (
          <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Berufsschultag zurücksetzen">
            <Trash2 />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Arbeitszeit ändern">
            <Pencil />
          </Button>
        )}
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
      <Button type="button" size="lg" className="w-full" onClick={saveStandard} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Check />}
        8,5 Std. ({ARBEITSTAG_STANDARD.start}–{ARBEITSTAG_STANDARD.end})
      </Button>
      {canSchool ? (
        <Button
          type="button"
          variant={schoolDefault ? 'default' : 'outline'}
          className="w-full"
          onClick={saveSchool}
          disabled={pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : <GraduationCap />}
          {schoolDefault ? 'Berufsschule laut Plan · 8 Std. speichern' : 'Heute Berufsschule · 8 Std.'}
        </Button>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          Beginn
          <TimeInput value={start} onValueChange={setStart} aria-label="Beginn" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Ende
          <TimeInput value={end} onValueChange={setEnd} aria-label="Ende" />
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
        <Button className="flex-1" size="lg" variant={workDay ? 'default' : 'outline'} onClick={save} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Check />}
          {workDay ? 'Speichern' : `${start}–${end} speichern`}
        </Button>
      </div>
    </div>
  )
}
