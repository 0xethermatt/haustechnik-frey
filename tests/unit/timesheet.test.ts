import { describe, expect, it } from 'vitest'
import { buildTimesheetRows, defaultScheduleFor, placeLabel, shortCompanyName, sumTimesheet } from '@/lib/ops/domain/workday'
import { sheetName, buildTimesheetWorkbook } from '@/lib/ops/exports/timesheet-xlsx'
import ExcelJS from 'exceljs'

const abbreviations = new Map([
  ['ulm', 'UL'],
  ['langenau', 'LA'],
])
const job = (last: string, city: string, company: string | null = null) => ({
  customer: { first_name: null, last_name: last, company_name: company, billing_city: city },
  location: null,
})

const rows = buildTimesheetRows({
  month: '2026-10',
  abbreviations,
  workDays: [
    { work_date: '2026-10-01', start_time: '07:30:00', end_time: '16:00:00', break_minutes: 30, duration_minutes: 480, note: null, created_at: '2026-10-01T15:30:00Z' },
    { work_date: '2026-10-02', start_time: '07:30:00', end_time: '13:30:00', break_minutes: 0, duration_minutes: 360, note: 'TÜV', created_at: '2026-10-05T07:00:00Z' },
  ],
  entries: [
    { entry_date: '2026-10-01', entry_type: 'kundenarbeit', started_at: null, note: null, job: job('Wagner', 'Ulm') },
    { entry_date: '2026-10-01', entry_type: 'kundenarbeit', started_at: null, note: null, job: job('Wagner', 'Ulm') },
    { entry_date: '2026-10-02', entry_type: 'kundenarbeit', started_at: null, note: null, job: job('Weiß', 'Langenau') },
    { entry_date: '2026-10-02', entry_type: 'kundenarbeit', started_at: null, note: null, job: job('Schulz', 'Elchingen') },
    { entry_date: '2026-10-02', entry_type: 'lager', started_at: null, note: null, job: null },
  ],
  absences: [{ absence_type: 'berufsschule', start_date: '2026-10-06', end_date: '2026-10-06', half_day: false }],
})

describe('Stundenzettel wie die bisherige Excel-Tabelle', () => {
  it('eine Zeile pro Kalendertag mit Beschriftung „Do, 01“', () => {
    expect(rows).toHaveLength(31)
    expect(rows[0].label).toBe('Do, 01')
    expect(rows[2]).toMatchObject({ label: 'Sa, 03', weekday: 6, start: null })
  })

  it('übernimmt Beginn, Pause, Ende, Dauer und Erfassungsdatum aus dem Arbeitstag', () => {
    expect(rows[0]).toMatchObject({ start: '07:30', end: '16:00', breakMinutes: 30, durationMinutes: 480, recordedOn: '01.10.2026' })
    expect(rows[1].recordedOn).toBe('05.10.2026')
  })

  it('erzeugt Bemerkungen „Name Ortskürzel“ ohne Dopplungen, sonst ausgeschriebener Ort', () => {
    expect(rows[0].remarks).toEqual(['Wagner UL'])
    expect(rows[1].remarks).toEqual(['Weiß LA', 'Schulz Elchingen', 'Lager', 'TÜV'])
  })

  it('markiert Abwesenheiten wie „Schule“ und Feiertage', () => {
    expect(rows[5]).toMatchObject({ remarks: ['Schule'], isAbsence: true })
    expect(rows[2].holiday).toBe('Tag der Deutschen Einheit')
    expect(rows[2].remarks).toEqual(['Tag der Deutschen Einheit'])
  })

  it('summiert die Monatsstunden', () => {
    expect(sumTimesheet(rows)).toEqual({ minutes: 840, days: 2 })
  })

  it('kürzt Firmennamen: Kurzname, sonst ohne Rechtsform', () => {
    expect(placeLabel(job('Roth', 'Neu-Ulm', 'Wohnbau Donautal GmbH'), abbreviations)).toBe('Wohnbau Donautal Neu-Ulm')
    expect(shortCompanyName('Bäckerei Hofmann GmbH & Co. KG')).toBe('Bäckerei Hofmann')
    expect(shortCompanyName('Elektro Maier e.K.')).toBe('Elektro Maier')
    expect(shortCompanyName('AG Bau')).toBe('AG Bau')
    const withShort = { customer: { first_name: null, last_name: 'Roth', company_name: 'Wohnbau Donautal GmbH', short_name: 'Donautal', billing_city: 'Ulm' }, location: null }
    expect(placeLabel(withShort, abbreviations)).toBe('Donautal UL')
  })

  it('Vorbelegung Mo–Do 7:30–16:00, Fr bis 13:30, ohne Pausenabzug', () => {
    expect(defaultScheduleFor('2026-11-26')).toEqual({ start: '07:30', end: '16:00', breakMinutes: 0 })
    expect(defaultScheduleFor('2026-11-27')).toEqual({ start: '07:30', end: '13:30', breakMinutes: 0 })
  })
})

describe('Excel-Export', () => {
  it('Blattname wie bisher und echte Excel-Zeitwerte', async () => {
    expect(sheetName('2026-10')).toBe('Okt2026')
    expect(sheetName('2026-02')).toBe('Febr2026')
    const buffer = await buildTimesheetWorkbook('2026-10', [
      {
        employee: { id: 'x', first_name: 'Mathis', last_name: 'Frey', employee_number: '105', employment_role: 'geselle' },
        rows,
        totalMinutes: 840,
        workedDays: 2,
      },
    ])
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer as never)
    const ws = wb.getWorksheet('Okt2026')!
    expect(ws.getCell(2, 4).value).toBe('Frey Mathis')
    expect(ws.getCell(6, 1).value).toBe('Do, 01')
    // ExcelJS liest Zeitzellen als Datum ab 30.12.1899 zurück – in Excel erscheinen sie als 7:30 bzw. 8:00
    const asTime = (v: unknown) => (v as Date).toISOString().slice(11, 16)
    expect(asTime(ws.getCell(6, 2).value)).toBe('07:30')
    expect(ws.getCell(6, 2).numFmt).toBe('h:mm')
    expect(asTime(ws.getCell(6, 5).value)).toBe('08:00')
    expect(ws.getCell(6, 5).numFmt).toBe('[h]:mm')
    expect(ws.getCell(7, 8).value).toBe('Weiß LA, Schulz Elchingen, Lager, TÜV')
    expect(asTime(ws.getCell(37, 5).value)).toBe('14:00')
  })
})
