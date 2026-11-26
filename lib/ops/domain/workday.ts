import { eachDay, endOfMonth, formatDate, isoWeekday, weekdayLabel } from './dates'
import { holidayName } from './holidays'
import type { AbsenceType, TimeEntryType } from './types'

/**
 * Übliche Arbeitszeiten (Vorbelegung beim Erfassen des Arbeitstags).
 * Laut bisherigem Stundenzettel: Mo–Do 7:30–16:00, Fr 7:30–13:30.
 * Pausen werden im Betrieb nicht abgezogen (bestätigt 25.11.2026) – daher 0.
 */
export const DEFAULT_SCHEDULE: Record<number, { start: string; end: string; breakMinutes: number } | null> = {
  1: { start: '07:30', end: '16:00', breakMinutes: 0 },
  2: { start: '07:30', end: '16:00', breakMinutes: 0 },
  3: { start: '07:30', end: '16:00', breakMinutes: 0 },
  4: { start: '07:30', end: '16:00', breakMinutes: 0 },
  5: { start: '07:30', end: '13:30', breakMinutes: 0 },
  6: null,
  7: null,
}

export function defaultScheduleFor(date: string) {
  return DEFAULT_SCHEDULE[isoWeekday(date)] ?? { start: '07:30', end: '16:00', breakMinutes: 0 }
}

/** „07:30:00“ → „07:30“ */
export function hhmm(time: string): string {
  return time.slice(0, 5)
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

export interface WorkDayInput {
  work_date: string
  start_time: string
  end_time: string
  break_minutes: number
  duration_minutes: number
  note: string | null
  berufsschule?: boolean
  created_at: string
}

export interface SheetEntryInput {
  entry_date: string
  entry_type: TimeEntryType
  started_at: string | null
  note: string | null
  job: {
    customer: {
      first_name: string | null
      last_name: string | null
      company_name: string | null
      short_name?: string | null
      billing_city: string | null
    } | null
    location: { city: string } | null
  } | null
}

export interface SheetAbsenceInput {
  absence_type: AbsenceType
  start_date: string
  end_date: string
  half_day: boolean
}

export interface TimesheetRow {
  date: string
  /** „Do, 01“ wie im bisherigen Stundenzettel */
  label: string
  weekday: number
  holiday: string | undefined
  start: string | null
  breakMinutes: number | null
  end: string | null
  durationMinutes: number | null
  /** Datum der Erfassung („aufgezeichnet am“) */
  recordedOn: string | null
  remarks: string[]
  /** Bemerkung ist eine Abwesenheit (im Stundenzettel rot) */
  isAbsence: boolean
}

/** Bezeichnungen wie im bisherigen Stundenzettel */
const ABSENCE_REMARK: Record<AbsenceType, string> = {
  urlaub: 'Urlaub',
  krank: 'Krank',
  berufsschule: 'Schule',
  feiertag: 'Feiertag',
  sonstiges: 'Abwesend',
}

const ENTRY_REMARK: Partial<Record<TimeEntryType, string>> = {
  lager: 'Lager',
  materialbeschaffung: 'Material',
  intern: 'Intern',
}

const LEGAL_FORM = /[\s,]+(gmbh\s*&\s*co\.?\s*kg|gmbh|ug\s*\(haftungsbeschränkt\)|ug|ag|kg|ohg|gbr|e\.\s?k\.?|e\.\s?v\.?|mbh)\.?$/i

/** „Wohnbau Donautal GmbH“ → „Wohnbau Donautal“ (Rechtsform entfernen). */
export function shortCompanyName(name: string): string {
  let result = name.trim()
  for (let i = 0; i < 2 && LEGAL_FORM.test(result); i++) result = result.replace(LEGAL_FORM, '').trim()
  return result || name.trim()
}

/** Name im Stundenzettel: Kurzname, sonst Firma ohne Rechtsform, sonst Nachname. */
export function customerShortName(c: { first_name: string | null; last_name: string | null; company_name: string | null; short_name?: string | null }): string | null {
  if (c.short_name?.trim()) return c.short_name.trim()
  if (c.company_name?.trim()) return shortCompanyName(c.company_name)
  return c.last_name || c.first_name
}

/** „Girbach UL“ – Kundenname plus Ortskürzel (oder ausgeschriebener Ort). */
export function placeLabel(
  job: NonNullable<SheetEntryInput['job']>,
  abbreviations: Map<string, string>,
): string | null {
  const c = job.customer
  if (!c) return null
  const name = customerShortName(c)
  if (!name) return null
  const city = job.location?.city ?? c.billing_city
  if (!city) return name
  return `${name} ${abbreviations.get(city.trim().toLowerCase()) ?? city}`
}

export function buildTimesheetRows(opts: {
  month: string // YYYY-MM
  workDays: WorkDayInput[]
  entries: SheetEntryInput[]
  absences: SheetAbsenceInput[]
  abbreviations: Map<string, string>
}): TimesheetRow[] {
  const from = `${opts.month}-01`
  const to = endOfMonth(from)
  return eachDay(from, to).map((date) => {
    const wd = opts.workDays.find((w) => w.work_date === date)
    const absence = opts.absences.find((a) => a.start_date <= date && date <= a.end_date)
    const holiday = holidayName(date)
    const remarks: string[] = []
    const add = (text: string | null | undefined) => {
      const t = text?.trim()
      if (t && !remarks.includes(t)) remarks.push(t)
    }

    const dayEntries = opts.entries
      .filter((e) => e.entry_date === date)
      .sort((a, b) => (a.started_at ?? '').localeCompare(b.started_at ?? ''))
    for (const e of dayEntries) {
      if (e.job) add(placeLabel(e.job, opts.abbreviations))
      else if (e.entry_type === 'intern') add(e.note || ENTRY_REMARK.intern)
      else add(ENTRY_REMARK[e.entry_type])
    }
    if (wd?.berufsschule) add('Schule')
    add(wd?.note)
    if (absence) add(ABSENCE_REMARK[absence.absence_type] + (absence.half_day ? ' (½ Tag)' : ''))
    else if (holiday && !wd) add(holiday)

    const [, , d] = date.split('-')
    return {
      date,
      label: `${weekdayLabel(date)}, ${d}`,
      weekday: isoWeekday(date),
      holiday,
      start: wd ? hhmm(wd.start_time) : null,
      breakMinutes: wd ? wd.break_minutes : null,
      end: wd ? hhmm(wd.end_time) : null,
      durationMinutes: wd ? wd.duration_minutes : null,
      recordedOn: wd ? formatDate(berlinDate(wd.created_at)) : null,
      remarks,
      isAbsence: !!absence && !wd,
    }
  })
}

function berlinDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

export function sumTimesheet(rows: TimesheetRow[]) {
  return {
    minutes: rows.reduce((s, r) => s + (r.durationMinutes ?? 0), 0),
    days: rows.filter((r) => r.durationMinutes).length,
  }
}
