'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Check, ImagePlus, Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PHOTO_PHASES, PHOTO_PHASE_LABELS } from '@/lib/ops/domain/labels'
import type { PhotoPhase } from '@/lib/ops/domain/types'
import { prepareImage } from '@/lib/ops/images'
import { cn } from '@/lib/ops/utils'
import { uploadJobPhoto } from '@/app/(ops)/intern/(app)/fotos/actions'

type Item = { name: string; state: 'wartet' | 'laeuft' | 'fertig' | 'fehler'; error?: string }

const STORAGE_KEY = 'frey-foto-phase'

function rememberedPhase(): PhotoPhase {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as PhotoPhase | null
    return v && PHOTO_PHASES.includes(v) ? v : 'sonstiges'
  } catch {
    return 'sonstiges'
  }
}

export function PhotoUploadButton({
  jobId,
  jobLabel,
  variant = 'outline',
  size,
  label = 'Fotos hinzufügen',
  className,
}: {
  jobId: string
  jobLabel?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  label?: string
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<PhotoPhase>('sonstiges')
  const [caption, setCaption] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const choosePhase = (p: PhotoPhase) => {
    setPhase(p)
    try {
      localStorage.setItem(STORAGE_KEY, p)
    } catch {
      // Merken der Auswahl ist optional
    }
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = Array.from(files)
    setBusy(true)
    setItems(list.map((f) => ({ name: f.name, state: 'wartet' })))
    let done = 0
    for (const [i, file] of list.entries()) {
      const set = (patch: Partial<Item>) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
      set({ state: 'laeuft' })
      try {
        const { full, thumb } = await prepareImage(file)
        const fd = new FormData()
        fd.set('job_id', jobId)
        fd.set('phase', phase)
        fd.set('caption', caption)
        fd.set('file', full)
        fd.set('thumb', thumb)
        const res = await uploadJobPhoto(fd)
        if (res.ok) {
          done++
          set({ state: 'fertig' })
        } else set({ state: 'fehler', error: res.error })
      } catch (e) {
        set({ state: 'fehler', error: e instanceof Error ? e.message : 'Keine Verbindung.' })
      }
    }
    setBusy(false)
    if (done) {
      toast.success(done === 1 ? 'Foto gespeichert' : `${done} Fotos gespeichert`)
      router.refresh()
    }
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          setPhase(rememberedPhase())
          setItems([])
          setCaption('')
          setOpen(true)
        }}
      >
        <Camera /> {label}
      </Button>
      <Sheet open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <SheetContent title="Fotos hinzufügen" description={jobLabel}>
          <div className="space-y-4">
            <Field label="Was zeigt das Foto?">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Phase">
                {PHOTO_PHASES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={phase === p}
                    disabled={busy}
                    onClick={() => choosePhase(p)}
                    className={cn(
                      'h-9 rounded-full border px-3 text-sm',
                      phase === p ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {PHOTO_PHASE_LABELS[p]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Beschreibung" htmlFor="foto-caption" optional hint="z. B. „Leitungen im Bad hinter der Vorwand“">
              <Input id="foto-caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} disabled={busy} autoComplete="off" />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" size="lg" disabled={busy} onClick={() => cameraRef.current?.click()}>
                <Camera /> Foto aufnehmen
              </Button>
              <Button type="button" size="lg" variant="outline" disabled={busy} onClick={() => galleryRef.current?.click()}>
                <ImagePlus /> Aus Galerie
              </Button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => upload(e.target.files)} aria-label="Foto aufnehmen" />
            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} aria-label="Fotos aus Galerie wählen" />

            {items.length ? (
              <ul className="space-y-1.5 text-sm" aria-live="polite">
                {items.map((it, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {it.state === 'laeuft' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
                    {it.state === 'wartet' ? <span className="h-4 w-4 rounded-full border" /> : null}
                    {it.state === 'fertig' ? <Check className="h-4 w-4 text-success" /> : null}
                    {it.state === 'fehler' ? <TriangleAlert className="h-4 w-4 text-destructive" /> : null}
                    <span className="min-w-0 flex-1 truncate">{it.name}</span>
                    {it.error ? <span className="text-xs text-destructive">{it.error}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {!busy && items.length > 0 ? (
              <Button type="button" className="w-full" onClick={() => setOpen(false)}>
                Fertig
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
