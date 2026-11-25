import Link from 'next/link'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { formatMinutes, worstSeverity, type DayFlag, type DaySummary } from '@/lib/ops/domain/time'
import { formatDate, weekdayLabel } from '@/lib/ops/domain/dates'
import { ABSENCE_TYPE_LABELS } from '@/lib/ops/domain/labels'
import type { EmployeeDay } from '@/lib/ops/data/time'
import { cn } from '@/lib/ops/utils'

export function SummaryTiles({ summary, className }: { summary: DaySummary; className?: string }) {
  const tiles = [
    { label: 'Arbeitszeit', value: summary.workMinutes, strong: true },
    { label: 'Verrechenbar', value: summary.billableMinutes },
    { label: 'Nicht verrechenbar', value: summary.nonBillableMinutes },
    { label: 'Pausen', value: summary.breakMinutes },
  ]
  return (
    <div className={cn('grid grid-cols-2 gap-2 md:grid-cols-4', className)}>
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border bg-card p-3">
          <div className="text-xs text-muted-foreground">{t.label}</div>
          <div className={cn('tabular mt-0.5 text-lg font-semibold', t.strong && 'text-primary')}>{formatMinutes(t.value)}</div>
        </div>
      ))}
    </div>
  )
}

const flagStyle = {
  error: { icon: AlertCircle, className: 'border-destructive/40 bg-destructive/5 text-destructive' },
  warning: { icon: AlertTriangle, className: 'border-warning/40 bg-warning/5 text-warning' },
  info: { icon: Info, className: 'border-border bg-muted/60 text-muted-foreground' },
} as const

export function FlagList({ flags }: { flags: DayFlag[] }) {
  if (!flags.length) return null
  return (
    <ul className="space-y-2">
      {flags.map((f, i) => {
        const s = flagStyle[f.severity]
        const Icon = s.icon
        return (
          <li key={`${f.code}-${i}`} className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-sm', s.className)}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{f.message}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function FlagDot({ flags }: { flags: DayFlag[] }) {
  const sev = worstSeverity(flags.filter((f) => f.code !== 'OPEN_DRAFT' || flags.length === 1))
  if (!sev) return null
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        sev === 'error' ? 'bg-destructive' : sev === 'warning' ? 'bg-warning' : 'bg-muted-foreground/50',
      )}
      aria-label={flags.map((f) => f.message).join(' ')}
    />
  )
}

export function WeekStrip({ days, selected, hrefFor }: { days: EmployeeDay[]; selected: string; hrefFor: (date: string) => string }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d) => (
        <Link
          key={d.date}
          href={hrefFor(d.date)}
          className={cn(
            'flex flex-col items-center gap-0.5 rounded-xl border bg-card py-2 text-xs',
            d.date === selected && 'border-primary bg-primary/5',
            (d.holiday || d.absence) && 'bg-muted/50',
          )}
        >
          <span className="text-muted-foreground">{weekdayLabel(d.date)}</span>
          <span className={cn('font-medium', d.date === selected && 'text-primary')}>{formatDate(d.date).slice(0, 2)}</span>
          <span className="tabular text-[11px] text-muted-foreground">
            {d.summary.workMinutes ? formatMinutes(d.summary.workMinutes, false) : d.absence ? ABSENCE_TYPE_LABELS[d.absence.absence_type].slice(0, 5) : '–'}
          </span>
          <span className="h-2">
            <FlagDot flags={d.flags} />
          </span>
        </Link>
      ))}
    </div>
  )
}
