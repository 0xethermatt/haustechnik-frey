/**
 * Kalender- und Zeitzonen-Helfer. Fachliche Datumswerte sind ISO-Strings `YYYY-MM-DD`
 * im Kalender von Europe/Berlin; Zeitpunkte sind ISO-Strings in UTC.
 */
export const TIME_ZONE = 'Europe/Berlin'

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isIsoDate(value: string): boolean {
  const m = DATE_RE.exec(value)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]
}

export function isTimeOfDay(value: string): boolean {
  return TIME_RE.test(value)
}

function parseIsoDate(value: string): Date {
  if (!isIsoDate(value)) throw new Error(`Ungültiges Datum: ${value}`)
  const [y, m, d] = value.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function berlinParts(instant: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant).map((p) => [p.type, p.value]))
  return {
    year: +parts.year,
    month: +parts.month,
    day: +parts.day,
    hour: +parts.hour,
    minute: +parts.minute,
    second: +parts.second,
  }
}

/** Offset von Europe/Berlin zu UTC in Minuten zum gegebenen Zeitpunkt (60 oder 120). */
function berlinOffsetMinutes(instant: Date): number {
  const p = berlinParts(instant)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000)
}

export function berlinToday(now: Date = new Date()): string {
  const p = berlinParts(now)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export function berlinDateOf(iso: string | Date): string {
  return berlinToday(typeof iso === 'string' ? new Date(iso) : iso)
}

/** Wandelt lokale Berliner Uhrzeit an einem Datum in einen UTC-ISO-Zeitpunkt um. */
export function berlinLocalToUtc(date: string, time: string): string {
  if (!isTimeOfDay(time)) throw new Error(`Ungültige Uhrzeit: ${time}`)
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const localAsUtc = Date.UTC(y, m - 1, d, hh, mm)
  let guess = localAsUtc - berlinOffsetMinutes(new Date(localAsUtc)) * 60000
  guess = localAsUtc - berlinOffsetMinutes(new Date(guess)) * 60000
  return new Date(guess).toISOString()
}

/** Uhrzeit `HH:MM` in Berlin für einen UTC-Zeitpunkt. */
export function utcToBerlinTime(iso: string): string {
  const p = berlinParts(new Date(iso))
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

export function addDays(date: string, days: number): string {
  const d = parseIsoDate(date)
  d.setUTCDate(d.getUTCDate() + days)
  return toIsoDate(d)
}

/** 1 = Montag … 7 = Sonntag */
export function isoWeekday(date: string): number {
  const day = parseIsoDate(date).getUTCDay()
  return day === 0 ? 7 : day
}

export function startOfWeek(date: string): string {
  return addDays(date, 1 - isoWeekday(date))
}

export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`
}

export function endOfMonth(date: string): string {
  const d = parseIsoDate(startOfMonth(date))
  d.setUTCMonth(d.getUTCMonth() + 1)
  d.setUTCDate(0)
  return toIsoDate(d)
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  return days
}

export function isoWeekNumber(date: string): number {
  const d = parseIsoDate(date)
  const thursday = new Date(d)
  thursday.setUTCDate(d.getUTCDate() + 4 - isoWeekday(date))
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
  return Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

const weekdayShort = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const weekdayLong = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const monthLong = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function weekdayLabel(date: string, long = false): string {
  return (long ? weekdayLong : weekdayShort)[isoWeekday(date) - 1]
}

/** z. B. „25.11.2026“ */
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}.${m}.${y}`
}

/** z. B. „Mi, 25.11.“ */
export function formatDateShort(date: string): string {
  const [, m, d] = date.split('-')
  return `${weekdayLabel(date)}, ${d}.${m}.`
}

/** z. B. „Mittwoch, 25. November 2026“ */
export function formatDateLong(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${weekdayLabel(date, true)}, ${d}. ${monthLong[m - 1]} ${y}`
}

export function formatMonth(date: string): string {
  const [y, m] = date.split('-').map(Number)
  return `${monthLong[m - 1]} ${y}`
}

export function formatDateTime(iso: string): string {
  return `${formatDate(berlinDateOf(iso))}, ${utcToBerlinTime(iso)} Uhr`
}

export function relativeDayLabel(date: string, today: string = berlinToday()): string {
  if (date === today) return 'Heute'
  if (date === addDays(today, -1)) return 'Gestern'
  return formatDateShort(date)
}
