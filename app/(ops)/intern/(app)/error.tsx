'use client'

import { Button } from '@/components/ui/button'

export default function OpsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Die Seite konnte nicht geladen werden. Bitte prüfen Sie die Verbindung und versuchen Sie es erneut.
      </p>
      <Button onClick={reset}>Erneut versuchen</Button>
    </div>
  )
}
