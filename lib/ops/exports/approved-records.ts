import 'server-only'
import type { ServerSupabase } from '../supabase/server'

/**
 * Formatneutrales Lesemodell für spätere Exporte (Lohn-Excel, Edison-UGL, KLOWA …).
 *
 * Regeln:
 * - Exporte LESEN nur freigegebene Berichte und deren Zeiteinträge; sie verändern nie operative Daten.
 * - Konkrete Dateiformate werden erst implementiert, wenn Spezifikationen/Beispieldateien vorliegen.
 * - Jeder Exporter bildet dieses Modell in sein Zielformat ab (ein Modul pro Ziel unter lib/ops/exports/).
 */
export interface ApprovedWorkRecord {
  reportId: string
  reportNumber: number
  reportDate: string
  approvedAt: string | null
  job: { id: string; number: number; title: string; category: string }
  customer: { id: string; number: number; edisonNumber: string | null; name: string }
  activities: string[]
  materials: {
    description: string
    quantity: number
    unit: string
    manufacturer: string | null
    articleNumber: string | null
    supplierArticleNumber: string | null
    catalogArticleId: string | null
  }[]
  labor: { employeeId: string; timeEntryId: string; minutes: number; billable: boolean }[]
}

interface Row {
  id: string
  report_number: number
  report_date: string
  reviewed_at: string | null
  job: {
    id: string
    job_number: number
    title: string
    category: string
    customer: { id: string; customer_number: number; edison_customer_number: string | null; first_name: string | null; last_name: string | null; company_name: string | null }
  }
  activities: { position: number; description: string }[]
  materials: {
    position: number
    description: string
    quantity: number
    unit: string
    manufacturer: string | null
    article_number: string | null
    supplier_article_number: string | null
    catalog_article_id: string | null
  }[]
  time_links: { employee_id: string; time_entry_id: string; time_entry: { duration_minutes: number; billable: boolean } }[]
}

export function toApprovedWorkRecord(r: Row): ApprovedWorkRecord {
  const c = r.job.customer
  return {
    reportId: r.id,
    reportNumber: r.report_number,
    reportDate: r.report_date,
    approvedAt: r.reviewed_at,
    job: { id: r.job.id, number: r.job.job_number, title: r.job.title, category: r.job.category },
    customer: {
      id: c.id,
      number: c.customer_number,
      edisonNumber: c.edison_customer_number,
      name: c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' '),
    },
    activities: [...r.activities].sort((a, b) => a.position - b.position).map((a) => a.description),
    materials: [...r.materials]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        description: m.description,
        quantity: Number(m.quantity),
        unit: m.unit,
        manufacturer: m.manufacturer,
        articleNumber: m.article_number,
        supplierArticleNumber: m.supplier_article_number,
        catalogArticleId: m.catalog_article_id,
      })),
    labor: r.time_links.map((l) => ({
      employeeId: l.employee_id,
      timeEntryId: l.time_entry_id,
      minutes: l.time_entry.duration_minutes,
      billable: l.time_entry.billable,
    })),
  }
}

/** Freigegebene Berichte eines Zeitraums (RLS: nur Büro/Admin sehen alle). */
export async function loadApprovedWorkRecords(supabase: ServerSupabase, range: { from: string; to: string }) {
  const { data, error } = await supabase
    .from('arbeitsberichte')
    .select(
      `id, report_number, report_date, reviewed_at,
       job:auftraege!inner(id, job_number, title, category, customer:kunden!inner(id, customer_number, edison_customer_number, first_name, last_name, company_name)),
       activities:arbeitsbericht_taetigkeiten(position, description),
       materials:arbeitsbericht_material(position, description, quantity, unit, manufacturer, article_number, supplier_article_number, catalog_article_id),
       time_links:arbeitsbericht_zeiteintraege(employee_id, time_entry_id, time_entry:zeiteintraege!inner(duration_minutes, billable))`,
    )
    .eq('status', 'freigegeben')
    .gte('report_date', range.from)
    .lte('report_date', range.to)
    .order('report_date')
  if (error) throw error
  return (data as unknown as Row[]).map(toApprovedWorkRecord)
}
