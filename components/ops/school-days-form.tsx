'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { formatDateShort } from '@/lib/ops/domain/dates'
import { BERUFSSCHULTAG } from '@/lib/ops/domain/workday'
import { formatMinutes } from '@/lib/ops/domain/time'
import { cn } from '@/lib/ops/utils'
import { saveWorkDay } from '@/app/(ops)/intern/(app)/zeiten/actions'

export interface SchoolDayOption {
  date: string
  /** schon als Berufsschultag erfasst */
  isSchool: boolean
  /** hat bereits einen anderen Arbeitstag (wird ersetzt) */
  hasOtherWorkDay: boolean
  holiday?: string
}

/** Berufsschultage für Azubis: ein oder mehrere Tage antippen, pauschal 8 Stunden je Tag (auch nachträglich). */
export function SchoolDaysForm({ employeeId, days, today }: { employeeId: string; days: SchoolDayOption[]; today: string }) {
  const router = useRouter()
  const first = days.find((d) => d.date === today && !d.isSchool)
  const [selected, setSelected] = useState<string[]>(first ? [first.date] : [])
  const [pending, start] = useTransition()
  const toggle = (d: string) => setSelected((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const submit = () =>
    start(async () => {
      let ok = 0
      for (const date of [...selected].sort()) {
        const res = await saveWorkDay({
          employee_id: employeeId,
          work_date: date,
          start_time: BERUFSSCHULTAG.start,
          end_time: BERUFSSCHULTAG.end,
          break_minutes: BERUFSSCHULTAG.breakMinutes,
          note: '',
          berufsschule: true,
        }).catch(() => null)
        if (!res?.ok) {
          toast.error(`${formatDateShort(date)}: ${res?.error ?? 'Keine Verbindung.'}`)
          break
        }
        ok++
      }
      if (ok) {
        toast.success(ok === 1 ? 'Berufsschule gespeichert' : `${ok} Berufsschultage gespeichert`)
        router.push('/intern')
        router.refresh()
      }
    })

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-4">
      <Field label="Welche Tage waren Berufsschule?" hint={`Pro Tag pauschal ${formatMinutes(480)}, ohne weitere Angaben.`}>
        <ul className="grid grid-cols-2 gap-2">
          {days.map((d) => {
            const on = selected.includes(d.date)
            return (
              <li key={d.date}>
                <button
                  type="button"
                  disabled={d.isSchool}
                  aria-pressed={on}
                  onClick={() => toggle(d.date)}
                  className={cn(
                    'flex h-14 w-full flex-col items-start justify-center rounded-xl border px-3 text-left disabled:opacity-60',
                    on ? 'border-primary bg-primary/10 text-primary' : 'bg-background',
                  )}
                >
                  <span className="flex w-full items-center justify-between text-sm font-medium">
                    {formatDateShort(d.date)}
                    {d.date === today ? <span className="text-xs font-normal text-muted-foreground">heute</span> : null}
                    {on ? <Check className="h-4 w-4" /> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {d.isSchool ? 'bereits Berufsschule' : d.holiday ? `Feiertag: ${d.holiday}` : d.hasOtherWorkDay ? 'Arbeitszeit wird ersetzt' : 'noch frei'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </Field>
      <Button type="button" size="xl" className="w-full" disabled={pending || selected.length === 0} onClick={submit}>
        {pending ? <Loader2 className="animate-spin" /> : <GraduationCap />}
        {selected.length === 0 ? 'Tage auswählen' : selected.length === 1 ? 'Berufsschule speichern' : `${selected.length} Berufsschultage speichern`}
      </Button>
    </div>
  )
}
