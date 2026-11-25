import { REPORT_STATUS_LABELS } from './labels'
import { formatMinutes } from './time'
import type { ReportStatus } from './types'

export interface AuditRow {
  id: number
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  actor_id: string | null
  reason: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_at: string
}

export interface AuditEvent {
  id: number
  at: string
  actorId: string | null
  text: string
  reason: string | null
}

/**
 * Fasst Audit-Einträge eines Berichts zu lesbaren Ereignissen zusammen.
 * `employeeName` löst Mitarbeiter-IDs in Zeiteinträgen auf.
 */
export function summarizeReportAudit(rows: AuditRow[], employeeName: (id: string) => string): AuditEvent[] {
  const events: AuditEvent[] = []
  for (const r of rows) {
    const o = r.old_data ?? {}
    const n = r.new_data ?? {}
    let text: string | null = null

    if (r.table_name === 'arbeitsberichte') {
      if (r.action === 'INSERT') text = 'Bericht angelegt'
      else if (r.action === 'UPDATE' && o.status !== n.status) {
        const s = n.status as ReportStatus
        text =
          s === 'eingereicht'
            ? 'Bericht eingereicht'
            : s === 'freigegeben'
              ? 'Bericht freigegeben'
              : s === 'korrektur_erforderlich'
                ? `Korrektur angefordert${n.review_comment ? `: „${n.review_comment}“` : ''}`
                : `Status: ${REPORT_STATUS_LABELS[s]}`
      } else if (r.action === 'UPDATE' && (o.report_date !== n.report_date || o.job_id !== n.job_id || o.internal_notes !== n.internal_notes)) {
        const parts = []
        if (o.report_date !== n.report_date) parts.push('Datum')
        if (o.job_id !== n.job_id) parts.push('Auftrag')
        if (o.internal_notes !== n.internal_notes) parts.push('Notiz')
        text = `${parts.join(', ')} geändert`
      }
    } else if (r.table_name === 'zeiteintraege') {
      const emp = employeeName(String(n.employee_id ?? o.employee_id ?? ''))
      if (r.action === 'UPDATE' && o.duration_minutes !== n.duration_minutes) {
        text = `Arbeitszeit ${emp}: ${formatMinutes(Number(o.duration_minutes))} → ${formatMinutes(Number(n.duration_minutes))}`
      } else if (r.action === 'DELETE') {
        text = `${emp} aus dem Bericht entfernt (${formatMinutes(Number(o.duration_minutes))})`
      } else if (r.action === 'INSERT' && r.reason) {
        text = `${emp} hinzugefügt (${formatMinutes(Number(n.duration_minutes))})`
      }
    } else if (r.table_name === 'arbeitsbericht_material' && r.reason) {
      const desc = String(n.description ?? o.description ?? '')
      text =
        r.action === 'INSERT'
          ? `Material ergänzt: ${n.quantity} ${n.unit} ${desc}`
          : r.action === 'DELETE'
            ? `Material entfernt: ${desc}`
            : `Material geändert: ${desc}`
    } else if (r.table_name === 'arbeitsbericht_taetigkeiten' && r.reason) {
      const desc = String(n.description ?? o.description ?? '')
      text = r.action === 'INSERT' ? `Arbeit ergänzt: ${desc}` : r.action === 'DELETE' ? `Arbeit entfernt: ${desc}` : `Arbeit geändert: ${desc}`
    }

    if (text) events.push({ id: r.id, at: r.changed_at, actorId: r.actor_id, text, reason: r.reason })
  }
  return events
}
