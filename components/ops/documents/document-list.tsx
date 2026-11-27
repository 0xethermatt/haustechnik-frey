'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, File, FileImage, FileSpreadsheet, FileText, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { DOCUMENT_ART_LABELS, documentKind, formatBytes, type DocumentArt } from '@/lib/ops/domain/documents'
import { formatDate } from '@/lib/ops/domain/dates'
import { deleteJobDocument } from '@/app/(ops)/intern/(app)/dokumente/actions'

export interface ListedDocument {
  id: string
  filename: string
  art: DocumentArt
  note: string | null
  size_bytes: number | null
  day: string
  by: string
  url: string | null
  canDelete: boolean
}

const ICONS = { pdf: FileText, bild: FileImage, tabelle: FileSpreadsheet, text: FileText, archiv: Archive, datei: File } as const

export function DocumentList({ documents }: { documents: ListedDocument[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  if (!documents.length) return <p className="text-sm text-muted-foreground">Noch keine Dokumente zu diesem Auftrag.</p>

  return (
    <ul className="divide-y">
      {documents.map((d) => {
        const Icon = ICONS[documentKind(d.filename)]
        return (
          <li key={d.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <Icon className="h-6 w-6 shrink-0 text-primary" />
            <a href={d.url ?? undefined} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:underline" aria-label={`${d.filename} öffnen`}>
              <span className="block truncate text-sm font-medium">{d.filename}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {formatDate(d.day)} · {d.by}
                {d.size_bytes ? ` · ${formatBytes(d.size_bytes)}` : ''}
                {d.note ? ` · ${d.note}` : ''}
              </span>
            </a>
            <Badge variant="muted" className="shrink-0">
              {DOCUMENT_ART_LABELS[d.art]}
            </Badge>
            {d.canDelete ? (
              <button
                type="button"
                disabled={pending}
                aria-label={`${d.filename} löschen`}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
                onClick={() =>
                  start(async () => {
                    if (!confirm(`„${d.filename}“ endgültig löschen?`)) return
                    const res = await deleteJobDocument(d.id).catch(() => null)
                    if (!res?.ok) return void toast.error(res?.error ?? 'Keine Verbindung.')
                    toast.success('Dokument gelöscht')
                    router.refresh()
                  })
                }
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
