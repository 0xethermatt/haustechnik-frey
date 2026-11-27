'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { deleteJob, getJobDeletePreview, type JobDeletePreview } from '../actions'

const CONFIRM_WORD = 'LÖSCHEN'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Auftrag endgültig löschen – zeigt vorher, was alles verschwindet, und verlangt bei Inhalt eine Bestätigung. */
export function DeleteJobButton({ jobId, title, size = 'sm' }: { jobId: string; title: string; size?: 'sm' | 'default' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<JobDeletePreview | null>(null)
  const [error, setError] = useState<string>()
  const [typed, setTyped] = useState('')
  const [pending, start] = useTransition()

  const openSheet = () => {
    setOpen(true)
    setPreview(null)
    setError(undefined)
    setTyped('')
    getJobDeletePreview(jobId)
      .then((res) => (res.ok ? setPreview(res.data) : setError(res.error)))
      .catch(() => setError('Keine Verbindung.'))
  }

  const hasContent = !!preview && (preview.reports > 0 || preview.time_entries > 0 || preview.photos > 0)
  const confirmed = !hasContent || typed.trim().toUpperCase() === CONFIRM_WORD

  return (
    <>
      <Button type="button" variant="ghost" size={size} className="text-destructive hover:text-destructive" onClick={openSheet}>
        <Trash2 /> Löschen
      </Button>
      <Sheet open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <SheetContent title="Auftrag löschen" description={title}>
          <div className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!preview && !error ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Wird geprüft …
              </p>
            ) : null}
            {preview && !preview.allowed ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
                {preview.reason === 'BILLED'
                  ? 'Abgerechnete Aufträge können nicht gelöscht werden. Sie lassen sich archivieren.'
                  : preview.reason === 'HAS_CONTENT'
                    ? 'Zu diesem Auftrag gibt es schon Berichte, Zeiten oder Fotos. Bitte das Büro fragen.'
                    : 'Du darfst diesen Auftrag nicht löschen.'}
              </p>
            ) : null}
            {preview?.allowed ? (
              <>
                <p className="text-sm">Der Auftrag wird <strong>endgültig</strong> gelöscht. Das lässt sich nicht rückgängig machen.</p>
                {hasContent ? (
                  <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <div className="font-medium">Dabei verschwinden auch:</div>
                    <ul className="list-disc space-y-0.5 pl-5">
                      {preview.reports > 0 ? <li>{plural(preview.reports, 'Arbeitsbericht', 'Arbeitsberichte')}</li> : null}
                      {preview.time_entries > 0 ? (
                        <li>
                          {plural(preview.time_entries, 'Zeiteintrag', 'Zeiteinträge')} ({plural(preview.people, 'Mitarbeiter', 'Mitarbeiter')}) – deren Stunden aus diesen Berichten entfallen
                        </li>
                      ) : null}
                      {preview.photos > 0 ? <li>{plural(preview.photos, 'Foto', 'Fotos')}</li> : null}
                    </ul>
                  </div>
                ) : null}
                {hasContent ? (
                  <div className="space-y-1.5">
                    <label htmlFor="del-confirm" className="text-sm font-medium">
                      Zum Bestätigen <span className="font-mono">{CONFIRM_WORD}</span> eintippen
                    </label>
                    <Input id="del-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending || !confirmed}
                    onClick={() =>
                      start(async () => {
                        const res = await deleteJob(jobId).catch(() => null)
                        if (!res) return void toast.error('Keine Verbindung.')
                        if (!res.ok) return void toast.error(res.error)
                        toast.success('Auftrag gelöscht')
                        setOpen(false)
                        router.replace('/intern/auftraege')
                        router.refresh()
                      })
                    }
                  >
                    {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Endgültig löschen
                  </Button>
                </div>
              </>
            ) : null}
            {preview && !preview.allowed ? (
              <Button type="button" className="w-full" onClick={() => setOpen(false)}>
                Schließen
              </Button>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
