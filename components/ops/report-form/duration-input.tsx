'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { formatMinutes, parseDurationToMinutes } from '@/lib/ops/domain/time'
import { cn } from '@/lib/ops/utils'

const QUICK = [120, 240, 480, 510]
const STEP = 15

/** Stundeneingabe für Daumenbedienung: ±15 min, Schnellwahl oder Eingabe („2,5“ / „2:30“). */
export function DurationInput({
  value,
  onChange,
  id,
  invalid,
}: {
  value: number
  onChange: (minutes: number) => void
  id?: string
  invalid?: boolean
}) {
  const [text, setText] = useState(value ? formatMinutes(value, false) : '')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(value ? formatMinutes(value, false) : '')
  }, [value, focused])

  const commit = (raw: string) => {
    const parsed = parseDurationToMinutes(raw)
    if (parsed !== null && parsed <= 1440) onChange(parsed)
    else setText(value ? formatMinutes(value, false) : '')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="15 Minuten weniger"
          onClick={() => onChange(Math.max(0, value - STEP))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background active:bg-accent"
        >
          <Minus className="h-5 w-5" />
        </button>
        <div className="relative flex-1">
          <input
            id={id}
            inputMode="decimal"
            aria-label="Arbeitszeit in Stunden"
            aria-invalid={invalid || undefined}
            value={text}
            placeholder="0:00"
            onFocus={(e) => {
              setFocused(true)
              e.target.select()
            }}
            onBlur={(e) => {
              setFocused(false)
              commit(e.target.value)
            }}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className={cn(
              'tabular h-12 w-full rounded-xl border border-input bg-background text-center text-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              invalid && 'border-destructive',
            )}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">h</span>
        </div>
        <button
          type="button"
          aria-label="15 Minuten mehr"
          onClick={() => onChange(Math.min(1440, value + STEP))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background active:bg-accent"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="flex gap-2">
        {QUICK.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={cn(
              'h-9 flex-1 rounded-lg border text-sm text-muted-foreground active:bg-accent',
              value === m && 'border-primary bg-primary/5 font-medium text-primary',
            )}
          >
            {String(m / 60).replace('.', ',')} h
          </button>
        ))}
      </div>
    </div>
  )
}
