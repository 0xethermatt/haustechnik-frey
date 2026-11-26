import type {
  AbsenceType,
  AppRole,
  EmploymentRole,
  JobCategory,
  JobStatus,
  PhotoPhase,
  ReportStatus,
  TimeEntryType,
} from './types'

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  office: 'Büro',
  employee: 'Mitarbeiter',
}

export const EMPLOYMENT_ROLE_LABELS: Record<EmploymentRole, string> = {
  meister: 'Meister',
  geselle: 'Geselle',
  auszubildender: 'Auszubildender',
  helfer: 'Helfer',
  buero: 'Büro',
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  geplant: 'Geplant',
  in_bearbeitung: 'In Bearbeitung',
  abgeschlossen: 'Abgeschlossen',
  abrechnungsbereit: 'Abrechnungsbereit',
  abgerechnet: 'Abgerechnet',
}

export const JOB_STATUS_ORDER: JobStatus[] = [
  'geplant',
  'in_bearbeitung',
  'abgeschlossen',
  'abrechnungsbereit',
  'abgerechnet',
]

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  kundendienst: 'Kundendienst',
  wartung: 'Wartung',
  reparatur: 'Reparatur',
  sanitaer: 'Sanitär',
  heizung: 'Heizung',
  waermepumpe: 'Wärmepumpe',
  badsanierung: 'Badsanierung',
  lueftung: 'Lüftung',
  solar: 'Solar',
  sonstiges: 'Sonstiges',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  entwurf: 'Entwurf',
  eingereicht: 'Eingereicht',
  freigegeben: 'Freigegeben',
  korrektur_erforderlich: 'Korrektur erforderlich',
}

export const TIME_ENTRY_TYPE_LABELS: Record<TimeEntryType, string> = {
  kundenarbeit: 'Kundenarbeit',
  fahrzeit: 'Fahrzeit',
  materialbeschaffung: 'Materialbeschaffung',
  lager: 'Lagerarbeit',
  intern: 'Interne Tätigkeit',
  pause: 'Pause',
}

/** Typen, die direkt (ohne Arbeitsbericht) erfasst werden. Pausen gehören zum Arbeitstag. */
export const MANUAL_TIME_ENTRY_TYPES: TimeEntryType[] = ['fahrzeit', 'materialbeschaffung', 'lager', 'intern']

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  urlaub: 'Urlaub',
  krank: 'Krank',
  berufsschule: 'Berufsschule',
  feiertag: 'Feiertag',
  sonstiges: 'Sonstige Abwesenheit',
}

export const MATERIAL_UNITS = ['Stk', 'm', 'm²', 'kg', 'l', 'Pkg', 'Satz', 'Rolle', 'Std'] as const

/** Reihenfolge entspricht dem Ablauf auf der Baustelle. */
export const PHOTO_PHASES: PhotoPhase[] = ['bestand', 'rohinstallation', 'heizungsanlage', 'fertigmontage', 'inbetriebnahme', 'sonstiges']

export const PHOTO_PHASE_LABELS: Record<PhotoPhase, string> = {
  bestand: 'Bestand / vorher',
  rohinstallation: 'Rohinstallation',
  heizungsanlage: 'Heizungsanlage',
  fertigmontage: 'Fertigmontage',
  inbetriebnahme: 'Inbetriebnahme',
  sonstiges: 'Sonstiges',
}
