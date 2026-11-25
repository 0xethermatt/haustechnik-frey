import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { ReportStatusBadge } from './status-badges'
import { formatDateShort } from '@/lib/ops/domain/dates'
import { formatMinutes } from '@/lib/ops/domain/time'
import { reportMinutes, type ReportListItem } from '@/lib/ops/data/reports'
import type { Directory } from '@/lib/ops/data/common'
import { customerName, formatReportNumber } from '@/lib/ops/utils'

export function ReportList({ reports, directory, compact = false }: { reports: ReportListItem[]; directory: Directory; compact?: boolean }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {reports.map((r) => {
        const people = r.time_links.map((l) => directory.name(l.employee_id).split(' ')[0])
        return (
          <li key={r.id}>
            <Link href={`/intern/berichte/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 active:bg-accent">
              <div className="w-14 shrink-0 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">{formatDateShort(r.report_date).split(', ')[1]}</div>
                {formatDateShort(r.report_date).split(', ')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{r.job?.customer ? customerName(r.job.customer) : '—'}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {r.job?.title}
                  {!compact && people.length ? ` · ${people.join(', ')}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <ReportStatusBadge status={r.status} />
                <span className="tabular text-xs text-muted-foreground">
                  {formatMinutes(reportMinutes(r))} · {formatReportNumber(r.report_number)}
                </span>
              </div>
              <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
