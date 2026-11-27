import type { ReportStatus } from './types'

export type AbgabeStatus = 'ok' | 'luecke' | 'kein_bericht' | 'entwurf' | 'keine_arbeitszeit' | 'nichts' | 'frei' | 'offen' | 'schule' | 'papier'

export interface AbgabeReport {
  id: string
  status: ReportStatus
  label: string
  minutes: number
}

export const ABGABE_PROBLEMS: AbgabeStatus[] = ['luecke', 'kein_bericht', 'entwurf', 'keine_arbeitszeit', 'nichts']

/**
 * Digitale Version des Rapportzettel-Abhakens: Stimmt für einen Mitarbeiter und Tag
 * die anwesende Zeit mit den abgegebenen Berichten überein?
 */
export function analyzeAbgabe(input: {
  /** Dauer des Arbeitstags (Beginn–Ende abzüglich Pause); null = nicht erfasst */
  presentMinutes: number | null
  /** Auf Berichte und sonstige Tätigkeiten verteilte Minuten (ohne Pause) */
  allocatedMinutes: number
  reports: AbgabeReport[]
  /** Wochenende, Feiertag oder Fehlzeit */
  free: boolean
  /** Heutiger Tag: noch nicht abgeschlossen */
  isToday: boolean
  /** Arbeitstag ist ein Berufsschultag: kein Bericht nötig */
  school?: boolean
  /** false = schreibt auf Papier (z. B. Inhaber): nie ein Problem, nur Anzeige, wenn er in Berichten steht */
  trackingRequired?: boolean
  toleranceMinutes?: number
}): { status: AbgabeStatus; gapMinutes: number } {
  const tolerance = input.toleranceMinutes ?? 15
  const { presentMinutes, allocatedMinutes, reports } = input
  const gap = presentMinutes == null ? 0 : presentMinutes - allocatedMinutes

  if (input.trackingRequired === false) return { status: reports.length === 0 ? 'frei' : 'papier', gapMinutes: 0 }
  if (input.school && presentMinutes != null && reports.length === 0) return { status: 'schule', gapMinutes: 0 }
  if (input.free && reports.length === 0) return { status: 'frei', gapMinutes: 0 }

  let status: AbgabeStatus
  if (reports.some((r) => r.status === 'entwurf' || r.status === 'korrektur_erforderlich')) status = 'entwurf'
  else if (reports.length === 0) status = presentMinutes == null ? 'nichts' : 'kein_bericht'
  else if (presentMinutes == null) status = 'keine_arbeitszeit'
  else status = gap > tolerance ? 'luecke' : 'ok'

  if (input.isToday && status !== 'ok') status = 'offen'
  return { status, gapMinutes: status === 'luecke' ? gap : 0 }
}
