import { describe, expect, it } from 'vitest'
import {
  addDays,
  berlinLocalToUtc,
  berlinToday,
  endOfMonth,
  isIsoDate,
  isoWeekNumber,
  startOfWeek,
  utcToBerlinTime,
} from '@/lib/ops/domain/dates'
import { easterSunday, holidayName, publicHolidaysBW } from '@/lib/ops/domain/holidays'

describe('Zeitzone Europe/Berlin', () => {
  it('rechnet Winterzeit (UTC+1) und Sommerzeit (UTC+2) korrekt um', () => {
    expect(berlinLocalToUtc('2026-11-25', '07:30')).toBe('2026-11-25T06:30:00.000Z')
    expect(berlinLocalToUtc('2026-07-01', '07:30')).toBe('2026-07-01T05:30:00.000Z')
    expect(utcToBerlinTime('2026-07-01T05:30:00.000Z')).toBe('07:30')
  })

  it('behandelt die Zeitumstellung', () => {
    // 29.03.2026: 02:00 → 03:00
    expect(berlinLocalToUtc('2026-03-29', '01:30')).toBe('2026-03-29T00:30:00.000Z')
    expect(berlinLocalToUtc('2026-03-29', '03:30')).toBe('2026-03-29T01:30:00.000Z')
  })

  it('bestimmt das Berliner Kalenderdatum (nicht UTC)', () => {
    expect(berlinToday(new Date('2026-11-25T23:30:00Z'))).toBe('2026-11-26')
    expect(berlinToday(new Date('2026-06-30T22:30:00Z'))).toBe('2026-07-01')
  })
})

describe('Kalenderhelfer', () => {
  it('validiert Datumsangaben', () => {
    expect(isIsoDate('2026-02-29')).toBe(false)
    expect(isIsoDate('2028-02-29')).toBe(true)
    expect(isIsoDate('25.11.2026')).toBe(false)
  })
  it('berechnet Wochen und Monate', () => {
    expect(startOfWeek('2026-11-25')).toBe('2026-11-23')
    expect(startOfWeek('2026-11-29')).toBe('2026-11-23')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(endOfMonth('2028-02-10')).toBe('2028-02-29')
    expect(isoWeekNumber('2026-11-25')).toBe(48)
    expect(isoWeekNumber('2027-01-01')).toBe(53)
  })
})

describe('Feiertage Baden-Württemberg', () => {
  it('berechnet Ostern und bewegliche Feiertage', () => {
    expect(easterSunday(2026)).toBe('2026-04-05')
    expect(easterSunday(2027)).toBe('2027-03-28')
    expect(holidayName('2026-04-03')).toBe('Karfreitag')
    expect(holidayName('2026-06-04')).toBe('Fronleichnam')
    expect(holidayName('2026-01-06')).toBe('Heilige Drei Könige')
    expect(holidayName('2026-11-25')).toBeUndefined()
    expect(publicHolidaysBW(2026).size).toBe(12)
  })
})
