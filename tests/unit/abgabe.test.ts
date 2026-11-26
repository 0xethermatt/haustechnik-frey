import { describe, expect, it } from 'vitest'
import { analyzeAbgabe, type AbgabeReport } from '@/lib/ops/domain/abgabe'

const report = (status: AbgabeReport['status'] = 'eingereicht', minutes = 480): AbgabeReport => ({ id: 'r', status, label: 'Müller', minutes })
const base = { presentMinutes: 510, allocatedMinutes: 510, reports: [report()], free: false, isToday: false }

describe('Abgabe-Check', () => {
  it('vollständig: Berichtszeit deckt die Anwesenheit', () => {
    expect(analyzeAbgabe(base).status).toBe('ok')
    expect(analyzeAbgabe({ ...base, allocatedMinutes: 500 }).status).toBe('ok')
  })
  it('Lücke ab mehr als 15 Minuten ohne Zuordnung', () => {
    expect(analyzeAbgabe({ ...base, allocatedMinutes: 300 })).toEqual({ status: 'luecke', gapMinutes: 210 })
  })
  it('Arbeitszeit erfasst, aber kein Bericht', () => {
    expect(analyzeAbgabe({ ...base, reports: [], allocatedMinutes: 0 }).status).toBe('kein_bericht')
  })
  it('weder Arbeitszeit noch Bericht', () => {
    expect(analyzeAbgabe({ ...base, reports: [], allocatedMinutes: 0, presentMinutes: null }).status).toBe('nichts')
  })
  it('Bericht ohne Arbeitszeit', () => {
    expect(analyzeAbgabe({ ...base, presentMinutes: null }).status).toBe('keine_arbeitszeit')
  })
  it('Entwurf oder Korrektur gilt als nicht abgegeben', () => {
    expect(analyzeAbgabe({ ...base, reports: [report('entwurf')] }).status).toBe('entwurf')
    expect(analyzeAbgabe({ ...base, reports: [report('korrektur_erforderlich')] }).status).toBe('entwurf')
  })
  it('freie Tage und heutiger Tag sind keine Beanstandung', () => {
    expect(analyzeAbgabe({ ...base, reports: [], allocatedMinutes: 0, presentMinutes: null, free: true }).status).toBe('frei')
    expect(analyzeAbgabe({ ...base, reports: [], allocatedMinutes: 0, isToday: true }).status).toBe('offen')
    expect(analyzeAbgabe({ ...base, isToday: true }).status).toBe('ok')
  })
})
