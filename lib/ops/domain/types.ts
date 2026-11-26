export type AppRole = 'admin' | 'office' | 'employee'
export type EmploymentRole = 'meister' | 'geselle' | 'auszubildender' | 'helfer' | 'buero'
export type JobStatus = 'geplant' | 'in_bearbeitung' | 'abgeschlossen' | 'abrechnungsbereit' | 'abgerechnet'
export type JobCategory =
  | 'kundendienst'
  | 'wartung'
  | 'reparatur'
  | 'sanitaer'
  | 'heizung'
  | 'waermepumpe'
  | 'badsanierung'
  | 'lueftung'
  | 'solar'
  | 'sonstiges'
export type ReportStatus = 'entwurf' | 'eingereicht' | 'freigegeben' | 'korrektur_erforderlich'
export type TimeEntryType = 'kundenarbeit' | 'fahrzeit' | 'materialbeschaffung' | 'lager' | 'intern' | 'pause'
export type PhotoPhase = 'bestand' | 'rohinstallation' | 'heizungsanlage' | 'fertigmontage' | 'inbetriebnahme' | 'sonstiges'
export type AbsenceType = 'urlaub' | 'krank' | 'berufsschule' | 'feiertag' | 'sonstiges'

export interface Profile {
  id: string
  email: string
  display_name: string
  roles: AppRole[]
  is_active: boolean
  created_at: string
}

export interface Employee {
  id: string
  profile_id: string | null
  employee_number: string
  first_name: string
  last_name: string
  employment_role: EmploymentRole
  is_active: boolean
  start_date: string
  end_date: string | null
  weekly_target_minutes: number
  annual_vacation_days: number
}

export interface DirectoryEmployee {
  id: string
  profile_id: string | null
  first_name: string
  last_name: string
  employment_role: EmploymentRole
  is_active: boolean
}

export interface Customer {
  id: string
  customer_number: number
  edison_customer_number: string | null
  short_name: string | null
  first_name: string | null
  last_name: string | null
  company_name: string | null
  billing_street: string | null
  billing_postal_code: string | null
  billing_city: string | null
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
  archived_at: string | null
}

export interface ServiceLocation {
  id: string
  customer_id: string
  label: string | null
  street: string
  postal_code: string
  city: string
  access_notes: string | null
  archived_at: string | null
}

export interface Job {
  id: string
  job_number: number
  customer_id: string
  service_location_id: string | null
  title: string
  description: string | null
  category: JobCategory
  status: JobStatus
  start_date: string
  completion_date: string | null
  notes: string | null
  created_at: string
  archived_at: string | null
}

export interface WorkReport {
  id: string
  report_number: number
  job_id: string
  report_date: string
  status: ReportStatus
  internal_notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_comment: string | null
  version: number
  last_mutation_id: string | null
}

export interface WorkReportActivity {
  id: string
  work_report_id: string
  position: number
  description: string
}

export interface WorkReportMaterial {
  id: string
  work_report_id: string
  position: number
  catalog_article_id: string | null
  description: string
  quantity: number
  unit: string
  manufacturer: string | null
  article_number: string | null
  supplier_article_number: string | null
  supplier_reference: string | null
}

export interface TimeEntry {
  id: string
  employee_id: string
  entry_date: string
  entry_type: TimeEntryType
  job_id: string | null
  started_at: string | null
  ended_at: string | null
  break_minutes: number
  duration_minutes: number
  billable: boolean
  note: string | null
}

export interface EmployeeAbsence {
  id: string
  employee_id: string
  absence_type: AbsenceType
  start_date: string
  end_date: string
  half_day: boolean
  note: string | null
}
