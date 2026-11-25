import ExcelJS from 'exceljs'
import type { EmployeeTimesheet } from '../data/timesheet'
import { formatMonth } from '../domain/dates'

/** Blattname wie im bisherigen Stundenzettel, z. B. „Okt2026“. */
const SHEET_MONTH = ['Jan', 'Febr', 'März', 'April', 'Mai', 'Jun', 'Jul', 'Aug', 'Sept', 'Okt', 'Nov', 'Dez']
export function sheetName(month: string) {
  const [y, m] = month.split('-').map(Number)
  return `${SHEET_MONTH[m - 1]}${y}`
}

const HEADERS = ['Kalender-\ntag', 'Beginn\n(Uhrzeit)', 'Pause\n(Dauer)', 'Ende\n(Uhrzeit)', 'Dauer\n(Summe)', '*', 'aufgezeichnet\nam:', 'Bemerkungen']
const WIDTHS = [9, 9, 9, 9, 9, 5, 12, 38]
const BLOCK_WIDTH = HEADERS.length + 1 // eine Leerspalte zwischen Mitarbeitern

const SATURDAY_FILL = 'FFFCE4D6'
const SUNDAY_FILL = 'FFDDEBF7'
const HEADER_FILL = 'FFBFBFBF'
const thin = { style: 'thin' as const, color: { argb: 'FF808080' } }
const border = { top: thin, left: thin, bottom: thin, right: thin }

const timeValue = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h * 60 + m) / 1440
}
const durationValue = (minutes: number) => minutes / 1440

/**
 * Stundenzettel im Aufbau der bisherigen Excel-Tabelle: ein Blatt pro Monat,
 * Mitarbeiter nebeneinander, eine Zeile pro Kalendertag.
 * Zeiten sind echte Excel-Zeitwerte, damit Summen/Formeln weiter funktionieren.
 */
export async function buildTimesheetWorkbook(month: string, sheets: EmployeeTimesheet[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Frey Haustechnik Betriebsplattform'
  wb.created = new Date()
  const ws = wb.addWorksheet(sheetName(month), {
    // Druck: ein Mitarbeiter pro A4-Seite (Hochformat)
    pageSetup: {
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: Math.max(1, sheets.length),
      fitToHeight: 1,
      paperSize: 9,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    views: [{ showGridLines: false }],
  })

  sheets.forEach((sheet, index) => {
    const c0 = 1 + index * BLOCK_WIDTH
    WIDTHS.forEach((w, i) => (ws.getColumn(c0 + i).width = w))
    ws.getColumn(c0 + HEADERS.length).width = 3

    const name = `${sheet.employee.last_name} ${sheet.employee.first_name}`
    ws.getCell(2, c0).value = 'Name des Mitarbeiters:'
    ws.mergeCells(2, c0 + 3, 2, c0 + 7)
    Object.assign(ws.getCell(2, c0 + 3), { value: name, font: { color: { argb: 'FFC00000' }, bold: true }, alignment: { horizontal: 'center' }, border })
    ws.getCell(3, c0).value = 'Pers.-Nr.:'
    Object.assign(ws.getCell(3, c0 + 2), { value: sheet.employee.employee_number, border, alignment: { horizontal: 'center' } })
    ws.getCell(3, c0 + 4).value = 'Monat/Jahr:'
    ws.mergeCells(3, c0 + 6, 3, c0 + 7)
    Object.assign(ws.getCell(3, c0 + 6), { value: formatMonth(`${month}-01`), font: { color: { argb: 'FF1F4E79' } }, alignment: { horizontal: 'center' }, border })

    const headerRow = 5
    HEADERS.forEach((h, i) => {
      Object.assign(ws.getCell(headerRow, c0 + i), {
        value: h,
        font: { bold: true, size: 9 },
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } },
        border,
      })
    })
    ws.getRow(headerRow).height = 30

    sheet.rows.forEach((row, r) => {
      const excelRow = headerRow + 1 + r
      const weekendFill = row.weekday === 6 ? SATURDAY_FILL : row.weekday === 7 || row.holiday ? SUNDAY_FILL : null
      const values: (string | number | null)[] = [
        row.label,
        row.start ? timeValue(row.start) : null,
        row.breakMinutes ? durationValue(row.breakMinutes) : null,
        row.end ? timeValue(row.end) : null,
        row.durationMinutes ? durationValue(row.durationMinutes) : null,
        null,
        row.recordedOn,
        row.remarks.join(', ') || null,
      ]
      values.forEach((v, i) => {
        const cell = ws.getCell(excelRow, c0 + i)
        cell.value = v
        cell.border = border
        cell.font = { size: 9, bold: i === 0 && row.weekday >= 6, color: i === 7 && row.isAbsence ? { argb: 'FFC00000' } : undefined }
        cell.alignment = { horizontal: i === 7 ? 'left' : 'center', vertical: 'middle' }
        if (i === 1 || i === 3) cell.numFmt = 'h:mm'
        if (i === 2 || i === 4) cell.numFmt = '[h]:mm'
        if (weekendFill && (i === 0 || row.weekday === 6)) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: weekendFill } }
      })
    })

    const sumRow = headerRow + 1 + sheet.rows.length
    Object.assign(ws.getCell(sumRow, c0 + 3), { value: 'Summe', font: { bold: true, size: 9 }, alignment: { horizontal: 'right' } })
    Object.assign(ws.getCell(sumRow, c0 + 4), {
      value: durationValue(sheet.totalMinutes),
      numFmt: '[h]:mm',
      font: { bold: true, size: 9 },
      alignment: { horizontal: 'center' },
      border,
    })
  })

  return Buffer.from(await wb.xlsx.writeBuffer())
}
