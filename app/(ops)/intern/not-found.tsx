import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function OpsNotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">Nicht gefunden</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Der Eintrag existiert nicht oder Sie haben keinen Zugriff darauf.
      </p>
      <Button asChild>
        <Link href="/intern">Zur Startseite</Link>
      </Button>
    </div>
  )
}
