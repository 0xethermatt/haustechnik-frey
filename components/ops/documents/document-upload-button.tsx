'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, FilePlus2, Loader2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { DOCUMENT_ARTS, DOCUMENT_ART_LABELS, MAX_DOCUMENT_BYTES, formatBytes, validateDocumentFile, type DocumentArt } from '@/lib/ops/domain/documents'
import { createClient } from '@/lib/ops/supabase/browser'
import { cn } from '@/lib/ops/utils'
import { confirmDocumentUpload, prepareDocumentUpload } from '@/app/(ops)/intern/(app)/dokumente/actions'

const BUCKET = 'auftragsdokumente'
const STORAGE_KEY = 'frey-dokument-art'

type Item = { name: string; size: number; state: 'wartet' | 'laeuft' | 'fertig' | 'fehler'; error?: string }

function rememberedArt(): DocumentArt {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as DocumentArt | null
    return v && DOCUMENT_ARTS.includes(v) ? v : 'sonstiges'
  } catch {
    return 'sonstiges'
  }
}

/** Dateien (PDF, Word, Excel, Pläne …) zu einem Auftrag hochladen. Die Datei geht direkt in den Speicher. */
export function DocumentUploadButton({ jobId, jobLabel, size }: { jobId: string; jobLabel?: string; size?: 'sm' | 'default' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [art, setArt] = useState<DocumentArt>('sonstiges')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const chooseArt = (a: DocumentArt) => {
    setArt(a)
    try {
      localStorage.setItem(STORAGE_KEY, a)
    } catch {
      // Merken ist optional
    }
  }

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const list = Array.from(files)
    setBusy(true)
    setItems(list.map((f) => ({ name: f.name, size: f.size, state: 'wartet' })))
    const supabase = createClient()
    let done = 0
    for (const [i, file] of list.entries()) {
      const set = (patch: Partial<Item>) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
      const problem = validateDocumentFile(file)
      if (problem) {
        set({ state: 'fehler', error: problem })
        continue
      }
      set({ state: 'laeuft' })
      try {
        const prep = await prepareDocumentUpload({ job_id: jobId, filename: file.name, size: file.size, art })
        if (!prep.ok) {
          set({ state: 'fehler', error: prep.error })
          continue
        }
        const up = await supabase.storage.from(BUCKET).uploadToSignedUrl(prep.data.path, prep.data.token, file, {
          contentType: file.type || 'application/octet-stream',
        })
        if (up.error) {
          set({ state: 'fehler', error: 'Hochladen fehlgeschlagen.' })
          continue
        }
        const conf = await confirmDocumentUpload({
          id: prep.data.id,
          job_id: jobId,
          path: prep.data.path,
          filename: file.name,
          mime: file.type || null,
          size: file.size,
          art,
          note,
        })
        if (conf.ok) {
          done++
          set({ state: 'fertig' })
        } else set({ state: 'fehler', error: conf.error })
      } catch (e) {
        set({ state: 'fehler', error: e instanceof Error ? e.message : 'Keine Verbindung.' })
      }
    }
    setBusy(false)
    if (done) {
      toast.success(done === 1 ? 'Datei gespeichert' : `${done} Dateien gespeichert`)
      router.refresh()
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => {
          setArt(rememberedArt())
          setItems([])
          setNote('')
          setOpen(true)
        }}
      >
        <FilePlus2 /> Datei hinzufügen
      </Button>
      <Sheet open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <SheetContent title="Datei hinzufügen" description={jobLabel}>
          <div className="space-y-4">
            <Field label="Was ist das?">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Art des Dokuments">
                {DOCUMENT_ARTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={art === a}
                    disabled={busy}
                    onClick={() => chooseArt(a)}
                    className={cn('h-9 rounded-full border px-3 text-sm', art === a ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground')}
                  >
                    {DOCUMENT_ART_LABELS[a]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Notiz" htmlFor="dok-note" optional>
              <Input id="dok-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} disabled={busy} autoComplete="off" />
            </Field>
            <Button type="button" size="lg" className="w-full" disabled={busy} onClick={() => inputRef.current?.click()}>
              <FilePlus2 /> Dateien auswählen
            </Button>
            <p className="-mt-2 text-xs text-muted-foreground">PDF, Word, Excel, Bilder und mehr, bis {formatBytes(MAX_DOCUMENT_BYTES)} je Datei.</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} aria-label="Dateien auswählen" />

            {items.length ? (
              <ul className="space-y-1.5 text-sm" aria-live="polite">
                {items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">
                      {it.state === 'laeuft' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
                      {it.state === 'wartet' ? <span className="block h-4 w-4 rounded-full border" /> : null}
                      {it.state === 'fertig' ? <Check className="h-4 w-4 text-success" /> : null}
                      {it.state === 'fehler' ? <TriangleAlert className="h-4 w-4 text-destructive" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{it.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatBytes(it.size)}</span>
                      {it.error ? <span className="block text-xs text-destructive">{it.error}</span> : null}
                    </span>
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
