import 'server-only'
import type { ServerSupabase } from '../supabase/server'
import type { ReportStatus } from '../domain/types'
import type { ReportDetailRow } from '../report-form-state'

export interface ReportDetail extends ReportDetailRow {
  report_number: number
  status: ReportStatus
  version: number
  created_by: string
  created_at: string
  updated_at: string
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_comment: string | null
  job: {
    id: string
    job_number: number
    title: string
    status: string
    customer: { id: string; customer_number: number; first_name: string | null; last_name: string | null; company_name: string | null; phone: string | null } | null
    location: { street: string; postal_code: string; city: string } | null
  } | null
}

export async function loadReportDetail(supabase: ServerSupabase, id: string): Promise<ReportDetail | null> {
  const { data } = await supabase
    .from('work_reports')
    .select(
      `id, report_number, job_id, report_date, status, version, internal_notes, created_by, created_at, updated_at,
       submitted_at, reviewed_at, reviewed_by, review_comment,
       job:jobs(id, job_number, title, status, customer:customers(id, customer_number, first_name, last_name, company_name, phone), location:service_locations(street, postal_code, city)),
       activities:work_report_activities(id, position, description),
       materials:work_report_materials(id, position, description, quantity, unit, manufacturer, article_number, supplier_article_number, supplier_reference, catalog_article_id),
       time_links:work_report_time_entries(employee_id, time_entry:time_entries(duration_minutes, started_at, ended_at, break_minutes))`,
    )
    .eq('id', id)
    .maybeSingle()
  return (data as unknown as ReportDetail) ?? null
}

export interface ReportListItem {
  id: string
  report_number: number
  report_date: string
  status: ReportStatus
  created_by: string
  submitted_at: string | null
  job: {
    id: string
    job_number: number
    title: string
    customer: { id: string; first_name: string | null; last_name: string | null; company_name: string | null } | null
  } | null
  time_links: { employee_id: string; time_entry: { duration_minutes: number } | null }[]
}

export const REPORT_LIST_SELECT = `id, report_number, report_date, status, created_by, submitted_at,
  job:jobs!inner(id, job_number, title, customer_id, customer:customers(id, first_name, last_name, company_name)),
  time_links:work_report_time_entries(employee_id, time_entry:time_entries(duration_minutes))`

export function reportMinutes(r: Pick<ReportListItem, 'time_links'>) {
  return r.time_links.reduce((sum, l) => sum + (l.time_entry?.duration_minutes ?? 0), 0)
}

export interface ReportFilters {
  status?: ReportStatus
  from?: string
  to?: string
  customerId?: string
  jobId?: string
  employeeId?: string
  limit?: number
}

export async function loadReports(supabase: ServerSupabase, f: ReportFilters): Promise<ReportListItem[]> {
  let reportIds: string[] | null = null
  if (f.employeeId) {
    const { data } = await supabase.from('work_report_time_entries').select('work_report_id').eq('employee_id', f.employeeId)
    reportIds = (data ?? []).map((r) => r.work_report_id)
    if (!reportIds.length) return []
  }
  let q = supabase.from('work_reports').select(REPORT_LIST_SELECT)
  if (f.status) q = q.eq('status', f.status)
  if (f.from) q = q.gte('report_date', f.from)
  if (f.to) q = q.lte('report_date', f.to)
  if (f.jobId) q = q.eq('job_id', f.jobId)
  if (f.customerId) q = q.eq('job.customer_id', f.customerId)
  if (reportIds) q = q.in('id', reportIds)
  const { data } = await q.order('report_date', { ascending: false }).order('report_number', { ascending: false }).limit(f.limit ?? 200)
  return (data ?? []) as unknown as ReportListItem[]
}
