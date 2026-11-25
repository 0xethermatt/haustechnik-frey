'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deletePlaceAbbreviation, savePlaceAbbreviation } from '../actions'

export function AbbreviationsEditor({ items, suggestions }: { items: { city: string; abbreviation: string }[]; suggestions: string[] }) {
  const router = useRouter()
  const [city, setCity] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [pending, start] = useTransition()

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) =>
    start(async () => {
      try {
        const res = await fn()
        if (!res.ok) return void toast.error(res.error)
        done?.()
        router.refresh()
      } catch {
        toast.error('Keine Verbindung.')
      }
    })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i.city} className="inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pl-3 pr-1 text-sm">
            {i.city} → <strong>{i.abbreviation}</strong>
            <button
              type="button"
              aria-label={`${i.city} entfernen`}
              className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
              onClick={() => run(() => deletePlaceAbbreviation(i.city))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(
            () => savePlaceAbbreviation({ city, abbreviation }),
            () => {
              setCity('')
              setAbbreviation('')
            },
          )
        }}
      >
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ort, z. B. Blaubeuren" list="ortsvorschlaege" className="min-w-[10rem] flex-1" aria-label="Ort" />
        <datalist id="ortsvorschlaege">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="Kürzel" className="w-28" aria-label="Kürzel" />
        <Button type="submit" variant="secondary" disabled={pending || !city || !abbreviation}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />} Speichern
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">Orte ohne Kürzel erscheinen ausgeschrieben, z. B. „Schulz Elchingen“.</p>
    </div>
  )
}
