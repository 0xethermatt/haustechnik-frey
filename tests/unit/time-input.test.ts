import { describe, expect, it } from 'vitest'
import { maskTimeInput, normalizeTime } from '@/lib/ops/domain/time-input'

describe('Uhrzeit-Eingabe (24 h)', () => {
  it('setzt den Doppelpunkt beim Tippen', () => {
    expect(maskTimeInput('0')).toBe('0')
    expect(maskTimeInput('07')).toBe('07')
    expect(maskTimeInput('073')).toBe('07:3')
    expect(maskTimeInput('0730')).toBe('07:30')
    expect(maskTimeInput('730')).toBe('7:30')
    expect(maskTimeInput('7:30')).toBe('7:30')
    expect(maskTimeInput('1630')).toBe('16:30')
    expect(maskTimeInput('07:3a0x')).toBe('07:30')
  })

  it('normalisiert Eingaben zu HH:MM', () => {
    expect(normalizeTime('7')).toBe('07:00')
    expect(normalizeTime('16')).toBe('16:00')
    expect(normalizeTime('730')).toBe('07:30')
    expect(normalizeTime('7:30')).toBe('07:30')
    expect(normalizeTime('0730')).toBe('07:30')
    expect(normalizeTime('16:45')).toBe('16:45')
    expect(normalizeTime('24:00')).toBeNull()
    expect(normalizeTime('12:60')).toBeNull()
    expect(normalizeTime('')).toBeNull()
  })
})
