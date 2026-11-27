'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { formatMinutes } from '@/lib/ops/domain/time'
import { deleteReportAsOffice } from '../actions'

const CONFIRM_WORD = 'LÖSCHEN'

/** Bericht endgültig löschen (nur Büro/Admin). Entwürfe ohne Rückfrage-Wort, eingereichte/freigegebene mit Bestätigung. */
export function DeleteReportButton({
  reportId,
  label,
  status,
  entries,
  people,
  minutes,
}: {
  reportId: string
  label: string
  status: string
  entries: number
  people: number
  minutes: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [pending, start] = useTransition()
  const needsWord = status !== 'entwurf'
  const confirmed = !needsWord || typed.trim().toUpperCase() === CONFIRM_WORD

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => {
          setTyped('')
          setOpen(true)
        }}
      >
        <Trash2 /> Löschen
      </Button>
      <Sheet open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <SheetContent title="Bericht löschen" description={label}>
          <div className="space-y-4">
            <p className="text-sm">
              Der Bericht wird <strong>endgültig</strong> gelöscht. Das lässt sich nicht rückgängig machen.
            </p>
            <div className="space-y-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <div className="font-medium">Dabei verschwinden auch:</div>
              <ul className="list-disc space-y-0.5 pl-5">
                <li>Ausgeführte Arbeiten und Material dieses Berichts</li>
                <li>
                  {entries} {entries === 1 ? 'Zeiteintrag' : 'Zeiteinträge'} ({people} {people === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}, zusammen {formatMinutes(minutes)}) – automatisch übernommene
                  Arbeitstage passen sich an
                </li>
              </ul>
            </div>
            {needsWord ? (
              <div className="space-y-1.5">
                <label htmlFor="delr-confirm" className="text-sm font-medium">
                  Zum Bestätigen <span className="font-mono">{CONFIRM_WORD}</span> eintippen
                </label>
                <Input id="delr-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" />
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
                    const res = await deleteReportAsOffice(reportId).catch(() => null)
                    if (!res) return void toast.error('Keine Verbindung.')
                    if (!res.ok) return void toast.error(res.error)
                    toast.success('Bericht gelöscht')
                    setOpen(false)
                    router.replace('/intern/berichte')
                    router.refresh()
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Endgültig löschen
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
