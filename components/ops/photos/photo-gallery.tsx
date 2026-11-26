'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PHOTO_PHASES, PHOTO_PHASE_LABELS } from '@/lib/ops/domain/labels'
import type { PhotoPhase } from '@/lib/ops/domain/types'
import { formatDate } from '@/lib/ops/domain/dates'
import { cn } from '@/lib/ops/utils'
import { deleteJobPhoto } from '@/app/(ops)/intern/(app)/fotos/actions'

export interface GalleryPhoto {
  id: string
  phase: PhotoPhase
  caption: string | null
  taken_on: string
  by: string
  thumbUrl: string | null
  fullUrl: string | null
  canDelete: boolean
}

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<PhotoPhase | 'alle'>('alle')
  const [openId, setOpenId] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const counts = useMemo(() => {
    const m = new Map<PhotoPhase, number>()
    for (const p of photos) m.set(p.phase, (m.get(p.phase) ?? 0) + 1)
    return m
  }, [photos])
  const visible = useMemo(() => (filter === 'alle' ? photos : photos.filter((p) => p.phase === filter)), [photos, filter])
  const groups = useMemo(
    () =>
      PHOTO_PHASES.map((phase) => ({ phase, items: visible.filter((p) => p.phase === phase) })).filter((g) => g.items.length > 0),
    [visible],
  )
  const index = openId ? visible.findIndex((p) => p.id === openId) : -1
  const current = index >= 0 ? visible[index] : null

  if (!photos.length) return <p className="text-sm text-muted-foreground">Noch keine Fotos zu diesem Auftrag.</p>

  const step = (delta: number) => {
    const next = visible[(index + delta + visible.length) % visible.length]
    if (next) setOpenId(next.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Fotos filtern">
        {(['alle', ...PHOTO_PHASES.filter((p) => counts.has(p))] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={filter === p}
            onClick={() => setFilter(p)}
            className={cn(
              'h-8 rounded-full border px-3 text-xs',
              filter === p ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
            )}
          >
            {p === 'alle' ? `Alle (${photos.length})` : `${PHOTO_PHASE_LABELS[p]} (${counts.get(p)})`}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.phase} className="space-y-2">
          {filter === 'alle' ? <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{PHOTO_PHASE_LABELS[g.phase]}</h3> : null}
          <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {g.items.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(p.id)}
                  className="relative block aspect-square w-full overflow-hidden rounded-lg border bg-muted"
                  aria-label={p.caption ?? `Foto vom ${formatDate(p.taken_on)}`}
                >
                  {p.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbUrl} alt={p.caption ?? ''} loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Sheet open={!!current} onOpenChange={(o) => !o && setOpenId(null)}>
        {current ? (
          <SheetContent title={PHOTO_PHASE_LABELS[current.phase]} description={`${formatDate(current.taken_on)} · ${current.by}`} className="md:max-w-2xl">
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl bg-black">
                {current.fullUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.fullUrl} alt={current.caption ?? ''} className="mx-auto max-h-[60dvh] w-full object-contain" />
                ) : null}
                {visible.length > 1 ? (
                  <>
                    <button type="button" onClick={() => step(-1)} aria-label="Vorheriges Foto" className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={() => step(1)} aria-label="Nächstes Foto" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
              {current.caption ? <p className="text-sm">{current.caption}</p> : null}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {index + 1} von {visible.length}
                </span>
                {current.canDelete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        if (!confirm('Dieses Foto endgültig löschen?')) return
                        const res = await deleteJobPhoto(current.id).catch(() => null)
                        if (!res?.ok) return void toast.error(res?.error ?? 'Keine Verbindung.')
                        toast.success('Foto gelöscht')
                        setOpenId(null)
                        router.refresh()
                      })
                    }
                  >
                    {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Löschen
                  </Button>
                ) : null}
              </div>
            </div>
          </SheetContent>
        ) : null}
      </Sheet>
    </div>
  )
}
