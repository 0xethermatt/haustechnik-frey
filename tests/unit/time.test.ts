import { describe, expect, it } from 'vitest'
import {
  analyzeDay,
  dayTotals,
  durationFromSpan,
  findOverlaps,
  formatMinutes,
  parseDurationToMinutes,
  summarizeEntries,
  type TimeEntryInput,
} from '@/lib/ops/domain/time'

const entry = (p: Partial<TimeEntryInput> & { id: string }): TimeEntryInput => ({
  entry_date: '2026-11-24',
  entry_type: 'kundenarbeit',
  started_at: null,
  ended_at: null,
  break_minutes: 0,
  duration_minutes: 60,
  billable: false,
  ...p,
})

describe('Dauer-Eingabe', () => {
  it.each([
    ['2,5', 150],
    ['2.5', 150],
    ['2:30', 150],
    ['2,25 h', 135],
    ['8', 480],
    ['45min', 45],
    ['0,1', 6],
  ])('%s → %i Minuten', (input, minutes) => {
    expect(parseDurationToMinutes(input)).toBe(minutes)
  })
  it('lehnt ungültige Eingaben ab', () => {
    expect(parseDurationToMinutes('abc')).toBeNull()
    expect(parseDurationToMinutes('2:75')).toBeNull()
    expect(parseDurationToMinutes('')).toBeNull()
  })
  it('formatiert als Std:Min', () => {
    expect(formatMinutes(150)).toBe('2:30 h')
    expect(formatMinutes(5, false)).toBe('0:05')
  })
  it('berechnet Dauer aus Von/Bis abzüglich Pause', () => {
    expect(durationFromSpan('2026-11-24T06:30:00Z', '2026-11-24T15:00:00Z', 30)).toBe(480)
    expect(durationFromSpan('2026-11-24T06:30:00Z', '2026-11-24T06:45:00Z', 30)).toBeNull()
  })
})

describe('Tageszusammenfassung', () => {
  it('trennt Arbeitszeit, verrechenbar, nicht verrechenbar und Pausen (ganze Minuten)', () => {
    const s = summarizeEntries([
      entry({ id: 'a', duration_minutes: 150, billable: true, break_minutes: 15 }),
      entry({ id: 'b', entry_type: 'fahrzeit', duration_minutes: 25, billable: true }),
      entry({ id: 'c', entry_type: 'lager', duration_minutes: 60 }),
      entry({ id: 'd', entry_type: 'pause', duration_minutes: 30 }),
    ])
    expect(s).toMatchObject({ workMinutes: 235, billableMinutes: 175, nonBillableMinutes: 60, breakMinutes: 45 })
  })
})

describe('Prüfungen', () => {
  it('erkennt Überschneidungen nur bei echten Zeitspannen', () => {
    const overlaps = findOverlaps([
      entry({ id: 'a', started_at: '2026-11-24T12:00:00Z', ended_at: '2026-11-24T13:30:00Z' }),
      entry({ id: 'b', started_at: '2026-11-24T13:00:00Z', ended_at: '2026-11-24T14:00:00Z' }),
      entry({ id: 'c', started_at: '2026-11-24T14:00:00Z', ended_at: '2026-11-24T15:00:00Z' }),
      entry({ id: 'd' }),
    ])
    expect(overlaps).toEqual([['a', 'b']])
  })

  it('meldet fehlende Zeiten nur an vergangenen regulären Werktagen ohne Abwesenheit', () => {
    const base = { today: '2026-11-25', entries: [], absences: [] }
    expect(analyzeDay({ ...base, date: '2026-11-24' }).map((f) => f.code)).toEqual(['MISSING'])
    expect(analyzeDay({ ...base, date: '2026-11-22' })).toEqual([]) // Sonntag
    expect(analyzeDay({ ...base, date: '2026-11-25' })).toEqual([]) // heute
    expect(analyzeDay({ ...base, date: '2026-12-25', today: '2027-01-10' })).toEqual([]) // Feiertag
    expect(
      analyzeDay({
        ...base,
        date: '2026-11-24',
        absences: [{ absence_type: 'urlaub', start_date: '2026-11-23', end_date: '2026-11-27', half_day: false }],
      }),
    ).toEqual([])
    expect(analyzeDay({ ...base, date: '2026-11-24', employed: false })).toEqual([])
  })

  it('weist auf Widersprüche und lange Tage hin', () => {
    const flags = analyzeDay({
      date: '2026-11-24',
      today: '2026-11-25',
      entries: [entry({ id: 'a', duration_minutes: 620 })],
      absences: [{ absence_type: 'krank', start_date: '2026-11-24', end_date: '2026-11-24', half_day: false }],
      openDraftCount: 1,
    })
    expect(flags.map((f) => f.code).sort()).toEqual(['ABSENCE_WITH_TIME', 'LONG_DAY', 'OPEN_DRAFT'])
  })
})

describe('Arbeitstag (Beginn/Ende/Pause) als Lohngrundlage', () => {
  const workDay = { duration_minutes: 480, break_minutes: 30 }

  it('Arbeitszeit kommt aus dem Arbeitstag, Rest ist nicht verrechenbar', () => {
    const t = dayTotals([entry({ id: 'a', duration_minutes: 300, billable: true }), entry({ id: 'b', entry_type: 'lager', duration_minutes: 60 })], workDay)
    expect(t).toMatchObject({
      workMinutes: 480,
      billableMinutes: 300,
      nonBillableMinutes: 180,
      breakMinutes: 30,
      allocatedMinutes: 360,
      unallocatedMinutes: 120,
      hasWorkDay: true,
    })
  })

  it('erkennt fehlende Arbeitstage und Überbuchung', () => {
    const base = { date: '2026-11-24', today: '2026-11-25', absences: [] }
    expect(analyzeDay({ ...base, entries: [entry({ id: 'a', duration_minutes: 120 })] }).map((f) => f.code)).toEqual(['WORKDAY_MISSING'])
    expect(analyzeDay({ ...base, entries: [], workDay })).toEqual([])
    expect(analyzeDay({ ...base, entries: [entry({ id: 'a', duration_minutes: 540 })], workDay }).map((f) => f.code)).toEqual(['OVER_ALLOCATED'])
    // heute noch keine Erinnerung
    expect(analyzeDay({ ...base, today: '2026-11-24', entries: [entry({ id: 'a', duration_minutes: 120 })] })).toEqual([])
  })
})
