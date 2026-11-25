import { Badge, type BadgeProps } from '@/components/ui/badge'
import { JOB_STATUS_LABELS, REPORT_STATUS_LABELS } from '@/lib/ops/domain/labels'
import type { JobStatus, ReportStatus } from '@/lib/ops/domain/types'

const reportVariant: Record<ReportStatus, BadgeProps['variant']> = {
  entwurf: 'muted',
  eingereicht: 'default',
  freigegeben: 'success',
  korrektur_erforderlich: 'warning',
}

const jobVariant: Record<JobStatus, BadgeProps['variant']> = {
  geplant: 'muted',
  in_bearbeitung: 'default',
  abgeschlossen: 'secondary',
  abrechnungsbereit: 'warning',
  abgerechnet: 'success',
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={reportVariant[status]}>{REPORT_STATUS_LABELS[status]}</Badge>
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={jobVariant[status]}>{JOB_STATUS_LABELS[status]}</Badge>
}
