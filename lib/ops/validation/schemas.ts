import { z } from 'zod'
import { isIsoDate, isTimeOfDay } from '../domain/dates'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximal ${max} Zeichen.`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

export const isoDate = z.string().refine(isIsoDate, 'Ungültiges Datum.')
export const timeOfDay = z.string().refine(isTimeOfDay, 'Ungültige Uhrzeit (HH:MM).')
const postalCode = z
  .string()
  .trim()
  .regex(/^\d{5}$/, 'PLZ muss 5 Ziffern haben.')

const optionalPostalCode = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{5}$/.test(v), 'PLZ muss 5 Ziffern haben.')

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v.toLowerCase() : null))
  .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Ungültige E-Mail-Adresse.')

export const jobCategories = [
  'kundendienst', 'wartung', 'reparatur', 'sanitaer', 'heizung', 'waermepumpe',
  'badsanierung', 'lueftung', 'solar', 'sonstiges',
] as const
export const jobStatuses = ['geplant', 'in_bearbeitung', 'abgeschlossen', 'abrechnungsbereit', 'abgerechnet'] as const
export const employmentRoles = ['meister', 'geselle', 'auszubildender', 'helfer', 'buero'] as const
export const appRoles = ['admin', 'office', 'employee'] as const
export const absenceTypes = ['urlaub', 'krank', 'berufsschule', 'feiertag', 'sonstiges'] as const
export const manualEntryTypes = ['fahrzeit', 'materialbeschaffung', 'lager', 'intern', 'pause'] as const

export const serviceLocationSchema = z.object({
  label: optionalText(100),
  street: z.string().trim().min(1, 'Straße ist erforderlich.').max(200),
  postal_code: postalCode,
  city: z.string().trim().min(1, 'Ort ist erforderlich.').max(100),
  access_notes: optionalText(1000),
})

export const customerSchema = z
  .object({
    first_name: optionalText(100),
    last_name: optionalText(100),
    company_name: optionalText(200),
    edison_customer_number: optionalText(50),
    short_name: optionalText(40),
    billing_street: optionalText(200),
    billing_postal_code: optionalPostalCode,
    billing_city: optionalText(100),
    phone: optionalText(50),
    email: optionalEmail,
    notes: optionalText(4000),
  })
  .refine((c) => c.last_name || c.company_name, {
    message: 'Nachname oder Firmenname ist erforderlich.',
    path: ['last_name'],
  })

export const customerCreateSchema = z.object({
  customer: customerSchema,
  /** Einsatzort = Rechnungsadresse übernehmen oder separat angeben */
  service_location: serviceLocationSchema.nullable(),
  service_location_same_as_billing: z.boolean().default(false),
  /** Schnellanlage: Einsatzort nur anlegen, wenn die Adresse vollständig ist – sonst ohne Fehler weglassen */
  service_location_if_complete: z.boolean().default(false),
})

export const jobSchema = z.object({
  customer_id: z.uuid('Bitte einen Kunden wählen.'),
  service_location_id: z.uuid().nullable().optional().transform((v) => v ?? null),
  title: z.string().trim().min(1, 'Titel ist erforderlich.').max(200),
  description: optionalText(4000),
  category: z.enum(jobCategories),
  start_date: isoDate,
  completion_date: isoDate.nullable().optional().transform((v) => v ?? null),
  notes: optionalText(4000),
  assigned_employee_ids: z.array(z.uuid()).max(30).default([]),
})

export const jobStatusSchema = z.object({
  job_id: z.uuid(),
  status: z.enum(jobStatuses),
})

const reportParticipantSchema = z
  .object({
    employee_id: z.uuid(),
    duration_minutes: z.number().int().min(1, 'Arbeitszeit fehlt.').max(1440),
    start_time: timeOfDay.nullable().optional(),
    end_time: timeOfDay.nullable().optional(),
    break_minutes: z.number().int().min(0).max(600).default(0),
  })
  .refine((p) => (p.start_time ? !!p.end_time : !p.end_time), {
    message: 'Bitte Beginn und Ende angeben.',
    path: ['end_time'],
  })
  .refine((p) => !p.start_time || !p.end_time || p.end_time > p.start_time, {
    message: 'Ende muss nach Beginn liegen.',
    path: ['end_time'],
  })

export const reportMaterialSchema = z.object({
  id: z.uuid(),
  description: z.string().trim().min(1, 'Materialbezeichnung fehlt.').max(500),
  quantity: z.number().positive('Menge muss größer 0 sein.').max(999999),
  unit: z.string().trim().min(1).max(20),
  manufacturer: optionalText(100),
  article_number: optionalText(100),
  supplier_article_number: optionalText(100),
  supplier_reference: optionalText(200),
  catalog_article_id: z.uuid().nullable().optional().transform((v) => v ?? null),
})

export const reportActivitySchema = z.object({
  id: z.uuid(),
  description: z.string().trim().min(1).max(1000),
})

export const workReportSchema = z
  .object({
    id: z.uuid(),
    mutation_id: z.uuid(),
    expected_version: z.number().int().positive().nullable(),
    job_id: z.uuid('Bitte einen Auftrag wählen.'),
    report_date: isoDate,
    internal_notes: optionalText(4000),
    activities: z.array(reportActivitySchema).max(100),
    materials: z.array(reportMaterialSchema).max(200),
    participants: z.array(reportParticipantSchema).max(30),
    correction_reason: optionalText(1000),
    submit: z.boolean(),
  })
  .refine((r) => new Set(r.participants.map((p) => p.employee_id)).size === r.participants.length, {
    message: 'Ein Mitarbeiter ist mehrfach eingetragen.',
    path: ['participants'],
  })
  .refine((r) => !r.submit || r.activities.length > 0, {
    message: 'Mindestens eine ausgeführte Arbeit eintragen.',
    path: ['activities'],
  })
  .refine((r) => !r.submit || r.participants.length > 0, {
    message: 'Mindestens einen Mitarbeiter mit Arbeitszeit eintragen.',
    path: ['participants'],
  })

export type WorkReportInput = z.input<typeof workReportSchema>

export const reviewSchema = z
  .object({
    report_id: z.uuid(),
    expected_version: z.number().int().positive(),
    decision: z.enum(['approve', 'request_correction']),
    comment: optionalText(2000),
  })
  .refine((r) => r.decision === 'approve' || !!r.comment, {
    message: 'Bitte beschreiben, was korrigiert werden soll.',
    path: ['comment'],
  })

export const timeEntrySchema = z
  .object({
    id: z.uuid().optional(),
    employee_id: z.uuid(),
    entry_date: isoDate,
    entry_type: z.enum(manualEntryTypes),
    job_id: z.uuid().nullable().optional().transform((v) => v ?? null),
    start_time: timeOfDay.nullable().optional().transform((v) => v ?? null),
    end_time: timeOfDay.nullable().optional().transform((v) => v ?? null),
    break_minutes: z.number().int().min(0).max(600).default(0),
    duration_minutes: z.number().int().min(1).max(1440).nullable().optional().transform((v) => v ?? null),
    billable: z.boolean().default(false),
    note: optionalText(500),
  })
  .refine((t) => (t.start_time && t.end_time) || t.duration_minutes, {
    message: 'Bitte Von/Bis oder eine Dauer angeben.',
    path: ['duration_minutes'],
  })
  .refine((t) => !t.start_time === !t.end_time, { message: 'Bitte Beginn und Ende angeben.', path: ['end_time'] })
  .refine((t) => !t.start_time || !t.end_time || t.end_time > t.start_time, {
    message: 'Ende muss nach Beginn liegen.',
    path: ['end_time'],
  })
  .refine((t) => !t.billable || (t.job_id && t.entry_type === 'fahrzeit'), {
    message: 'Nur Fahrzeit mit Auftrag kann verrechenbar sein.',
    path: ['billable'],
  })
  .refine((t) => t.entry_type !== 'pause' || (!t.job_id && t.break_minutes === 0), {
    message: 'Pausen werden ohne Auftrag erfasst.',
    path: ['entry_type'],
  })

export const employeeSchema = z
  .object({
    employee_number: z.string().trim().min(1, 'Personalnummer ist erforderlich.').max(20),
    first_name: z.string().trim().min(1, 'Vorname ist erforderlich.').max(100),
    last_name: z.string().trim().min(1, 'Nachname ist erforderlich.').max(100),
    employment_role: z.enum(employmentRoles),
    is_active: z.boolean(),
    start_date: isoDate,
    end_date: isoDate.nullable().optional().transform((v) => v ?? null),
    weekly_target_minutes: z.number().int().min(0).max(4200),
    annual_vacation_days: z.number().min(0).max(60),
    requires_time_tracking: z.boolean().default(true),
  })
  .refine((e) => !e.end_date || e.end_date >= e.start_date, {
    message: 'Austritt muss nach dem Eintritt liegen.',
    path: ['end_date'],
  })

export const absenceSchema = z
  .object({
    employee_id: z.uuid(),
    absence_type: z.enum(absenceTypes),
    start_date: isoDate,
    end_date: isoDate,
    half_day: z.boolean().default(false),
    note: optionalText(500),
  })
  .refine((a) => a.end_date >= a.start_date, { message: 'Ende muss nach dem Beginn liegen.', path: ['end_date'] })
  .refine((a) => !a.half_day || a.start_date === a.end_date, {
    message: 'Halbe Tage nur für einen einzelnen Tag.',
    path: ['half_day'],
  })

export const inviteSchema = z.object({
  email: z.email('Ungültige E-Mail-Adresse.').transform((v) => v.toLowerCase()),
  display_name: z.string().trim().min(1, 'Name ist erforderlich.').max(100),
  roles: z.array(z.enum(appRoles)).min(1, 'Mindestens eine Rolle wählen.'),
  employee_id: z.uuid().nullable().optional().transform((v) => v ?? null),
})

export const createUserSchema = inviteSchema.extend({
  password: z.string().min(10, 'Mindestens 10 Zeichen.').max(72, 'Höchstens 72 Zeichen.'),
})

export const userAccessSchema = z.object({
  user_id: z.uuid(),
  roles: z.array(z.enum(appRoles)),
  is_active: z.boolean(),
  display_name: optionalText(100),
  employee_id: z.uuid().nullable().optional().transform((v) => v ?? null),
})

/** Erste Fehlermeldung je Feldpfad, für Formulare. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export const workDaySchema = z
  .object({
    employee_id: z.uuid(),
    work_date: isoDate,
    start_time: timeOfDay,
    end_time: timeOfDay,
    break_minutes: z.number().int().min(0).max(600),
    note: optionalText(500),
    berufsschule: z.boolean().default(false),
  })
  .refine((w) => w.end_time > w.start_time, { message: 'Ende muss nach dem Beginn liegen.', path: ['end_time'] })
  .refine(
    (w) => {
      const [sh, sm] = w.start_time.split(':').map(Number)
      const [eh, em] = w.end_time.split(':').map(Number)
      return eh * 60 + em - (sh * 60 + sm) > w.break_minutes
    },
    { message: 'Die Pause ist länger als die Arbeitszeit.', path: ['break_minutes'] },
  )

export const placeAbbreviationSchema = z.object({
  city: z.string().trim().min(1, 'Ort fehlt.').max(100),
  abbreviation: z.string().trim().min(1, 'Kürzel fehlt.').max(20),
})

export const photoPhases = ['bestand', 'rohinstallation', 'heizungsanlage', 'fertigmontage', 'inbetriebnahme', 'sonstiges'] as const

export const photoUploadSchema = z.object({
  job_id: z.uuid('Bitte einen Auftrag wählen.'),
  phase: z.enum(photoPhases),
  caption: optionalText(300),
})
