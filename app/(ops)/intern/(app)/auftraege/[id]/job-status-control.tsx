'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER } from '@/lib/ops/domain/labels'
import type { JobStatus } from '@/lib/ops/domain/types'
import { cn } from '@/lib/ops/utils'
import { setJobArchived, setJobStatus } from '../actions'

export function JobStatusControl({ jobId, status, openReports }: { jobId: string; status: JobStatus; openReports: number }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const change = (next: JobStatus) =>
    start(async () => {
      if (next === 'abrechnungsbereit' && openReports > 0 && !confirm(`${openReports} Bericht(e) sind noch nicht freigegeben. Trotzdem als abrechnungsbereit markieren?`)) return
      const res = await setJobStatus({ job_id: jobId, status: next }).catch(() => null)
      if (!res?.ok) return void toast.error(res?.error ?? 'Keine Verbindung.')
      toast.success(`Status: ${JOB_STATUS_LABELS[next]}`)
      router.refresh()
    })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Auftragsstatus">
        {JOB_STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={status === s}
            disabled={pending}
            onClick={() => s !== status && change(s)}
            className={cn(
              'h-10 rounded-lg border px-2 text-xs font-medium',
              status === s ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {JOB_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
    </div>
  )
}

export function ArchiveJobButton({ jobId, archived }: { jobId: string; archived: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (!archived && !confirm('Auftrag archivieren? Berichte und Zeiten bleiben erhalten.')) return
          const res = await setJobArchived(jobId, !archived).catch(() => null)
          if (!res?.ok) return void toast.error(res?.error ?? 'Keine Verbindung.')
          router.refresh()
        })
      }
    >
      <Archive /> {archived ? 'Wiederherstellen' : 'Archivieren'}
    </Button>
  )
}
