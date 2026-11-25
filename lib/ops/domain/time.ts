import { isoWeekday } from './dates'
import { holidayName } from './holidays'
import type { AbsenceType, TimeEntryType } from './types'

/** Minimale Sicht auf einen Zeiteintrag – alle Dauern als ganze Minuten. */
export interface TimeEntryInput {
  id: string
  entry_date: string
  entry_type: TimeEntryType
  started_at: string | null
  ended_at: string | null
  break_minutes: number
  duration_minutes: number
  billable: boolean
}

export interface AbsenceInput {
  absence_type: AbsenceType
  start_date: string
  end_date: string
  half_day: boolean
}

export interface DaySummary {
  workMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  breakMinutes: number
  byType: Partial<Record<TimeEntryType, number>>
}

export type FlagSeverity = 'error' | 'warning' | 'info'

export interface DayFlag {
  code: 'OVERLAP' | 'MISSING' | 'ABSENCE_WITH_TIME' | 'LONG_DAY' | 'BREAK_HINT' | 'OPEN_DRAFT'
  severity: FlagSeverity
  message: string
  entryIds?: string[]
}

/** Parst Stundenangaben wie „2,5“, „2.5“, „2:30“ oder „150min“ in ganze Minuten. */
export function parseDurationToMinutes(input: string): number | null {
  const value = input.trim().toLowerCase().replace(/\s+/g, '').replace(/(std|h)$/, '')
  if (!value) return null
  const minutesMatch = /^(\d{1,4})min$/.exec(value)
  if (minutesMatch) return Number(minutesMatch[1])
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(value)
  if (clock) return Number(clock[1]) * 60 + Number(clock[2])
  const decimal = /^(\d{1,2})(?:[.,](\d{1,2}))?$/.exec(value)
  if (decimal) {
    const hours = Number(`${decimal[1]}.${decimal[2] ?? '0'}`)
    return Math.round(hours * 60)
  }
  return null
}

/** 150 → „2:30 h“ */
export function formatMinutes(minutes: number, unit = true): string {
  const sign = minutes < 0 ? '−' : ''
  const abs = Math.abs(Math.round(minutes))
  const text = `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`
  return unit ? `${text} h` : text
}

/** Dauer aus Von/Bis/Pause; null wenn unvollständig oder ungültig. */
export function durationFromSpan(startedAt: string, endedAt: string, breakMinutes: number): number | null {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  const minutes = Math.floor(ms / 60000) - breakMinutes
  return minutes > 0 ? minutes : null
}

export function summarizeEntries(entries: TimeEntryInput[]): DaySummary {
  const summary: DaySummary = { workMinutes: 0, billableMinutes: 0, nonBillableMinutes: 0, breakMinutes: 0, byType: {} }
  for (const e of entries) {
    summary.byType[e.entry_type] = (summary.byType[e.entry_type] ?? 0) + e.duration_minutes
    summary.breakMinutes += e.break_minutes
    if (e.entry_type === 'pause') {
      summary.breakMinutes += e.duration_minutes
      continue
    }
    summary.workMinutes += e.duration_minutes
    if (e.billable) summary.billableMinutes += e.duration_minutes
    else summary.nonBillableMinutes += e.duration_minutes
  }
  return summary
}

/** Paare von Einträgen mit überschneidenden Von/Bis-Zeiten. Pausen innerhalb eines Eintrags zählen nicht. */
export function findOverlaps(entries: TimeEntryInput[]): [string, string][] {
  const timed = entries
    .filter((e) => e.started_at && e.ended_at)
    .map((e) => ({ id: e.id, start: new Date(e.started_at!).getTime(), end: new Date(e.ended_at!).getTime() }))
    .sort((a, b) => a.start - b.start)
  const pairs: [string, string][] = []
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length && timed[j].start < timed[i].end; j++) {
      pairs.push([timed[i].id, timed[j].id])
    }
  }
  return pairs
}

export function absenceOn(date: string, absences: AbsenceInput[]): AbsenceInput | undefined {
  return absences.find((a) => a.start_date <= date && date <= a.end_date)
}

export function isRegularWorkday(date: string): boolean {
  return isoWeekday(date) <= 5 && !holidayName(date)
}

export interface AnalyzeDayInput {
  date: string
  today: string
  entries: TimeEntryInput[]
  absences: AbsenceInput[]
  openDraftCount?: number
  /** Mitarbeiter war an diesem Tag beschäftigt (Eintritt/Austritt) */
  employed?: boolean
}

/**
 * Prüft einen Tag auf Unvollständigkeit und Widersprüche.
 * Hinweise zu Pausen orientieren sich am ArbZG §4, sind aber KEINE rechtliche Bewertung.
 */
export function analyzeDay(input: AnalyzeDayInput): DayFlag[] {
  const flags: DayFlag[] = []
  const { date, today, entries, absences } = input
  const summary = summarizeEntries(entries)
  const absence = absenceOn(date, absences)

  for (const [a, b] of findOverlaps(entries)) {
    flags.push({ code: 'OVERLAP', severity: 'error', message: 'Zeiteinträge überschneiden sich.', entryIds: [a, b] })
  }

  const employed = input.employed ?? true
  if (employed && date < today && entries.length === 0 && !absence && isRegularWorkday(date)) {
    flags.push({ code: 'MISSING', severity: 'warning', message: 'Keine Zeiten erfasst.' })
  }

  if (absence && !absence.half_day && summary.workMinutes > 0) {
    flags.push({
      code: 'ABSENCE_WITH_TIME',
      severity: 'warning',
      message: 'Abwesenheit eingetragen, aber Arbeitszeit erfasst.',
    })
  }

  if (summary.workMinutes > 600) {
    flags.push({ code: 'LONG_DAY', severity: 'warning', message: 'Mehr als 10 Stunden Arbeitszeit erfasst.' })
  }

  const requiredBreak = summary.workMinutes > 540 ? 45 : summary.workMinutes > 360 ? 30 : 0
  if (requiredBreak > 0 && summary.breakMinutes < requiredBreak) {
    flags.push({
      code: 'BREAK_HINT',
      severity: 'info',
      message: `Pausenzeit prüfen (erfasst: ${summary.breakMinutes} min, Richtwert: ${requiredBreak} min).`,
    })
  }

  if (input.openDraftCount && input.openDraftCount > 0) {
    flags.push({
      code: 'OPEN_DRAFT',
      severity: 'info',
      message:
        input.openDraftCount === 1 ? '1 Bericht noch nicht eingereicht.' : `${input.openDraftCount} Berichte noch nicht eingereicht.`,
    })
  }

  return flags
}

export function worstSeverity(flags: DayFlag[]): FlagSeverity | null {
  if (flags.some((f) => f.severity === 'error')) return 'error'
  if (flags.some((f) => f.severity === 'warning')) return 'warning'
  if (flags.some((f) => f.severity === 'info')) return 'info'
  return null
}
