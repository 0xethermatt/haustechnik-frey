import { addDays } from './dates'

/** Ostersonntag nach dem gregorianischen Algorithmus (Meeus/Jones/Butcher). */
export function easterSunday(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Gesetzliche Feiertage in Baden-Württemberg. */
export function publicHolidaysBW(year: number): Map<string, string> {
  const easter = easterSunday(year)
  const entries: [string, string][] = [
    [`${year}-01-01`, 'Neujahr'],
    [`${year}-01-06`, 'Heilige Drei Könige'],
    [addDays(easter, -2), 'Karfreitag'],
    [addDays(easter, 1), 'Ostermontag'],
    [`${year}-05-01`, 'Tag der Arbeit'],
    [addDays(easter, 39), 'Christi Himmelfahrt'],
    [addDays(easter, 50), 'Pfingstmontag'],
    [addDays(easter, 60), 'Fronleichnam'],
    [`${year}-10-03`, 'Tag der Deutschen Einheit'],
    [`${year}-11-01`, 'Allerheiligen'],
    [`${year}-12-25`, '1. Weihnachtstag'],
    [`${year}-12-26`, '2. Weihnachtstag'],
  ]
  return new Map(entries)
}

export function holidayName(date: string): string | undefined {
  return publicHolidaysBW(Number(date.slice(0, 4))).get(date)
}
