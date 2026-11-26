'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { approveSubmittedForDay } from './actions'

export function ApproveDayButton({ date, count }: { date: string; count: number }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await approveSubmittedForDay(date).catch(() => null)
          if (!res) return void toast.error('Keine Verbindung.')
          if (!res.ok) return void toast.error(res.error)
          toast.success(`${res.data.count} ${res.data.count === 1 ? 'Bericht' : 'Berichte'} freigegeben`)
          router.refresh()
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <CheckCheck />} {count} freigeben
    </Button>
  )
}
