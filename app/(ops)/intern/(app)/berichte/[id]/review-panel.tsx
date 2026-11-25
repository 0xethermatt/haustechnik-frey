'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, MessageSquareWarning } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ReportStatus } from '@/lib/ops/domain/types'
import { reviewReport } from '../actions'

export function ReviewPanel({ reportId, version, status }: { reportId: string; version: number; status: ReportStatus }) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [mode, setMode] = useState<'idle' | 'correction'>('idle')
  const [pending, start] = useTransition()

  const decide = (decision: 'approve' | 'request_correction') =>
    start(async () => {
      try {
        const res = await reviewReport({ report_id: reportId, expected_version: version, decision, comment: comment || null })
        if (!res.ok) return void toast.error(res.error)
        toast.success(decision === 'approve' ? 'Bericht freigegeben' : 'Korrektur angefordert')
        setMode('idle')
        setComment('')
        router.refresh()
      } catch {
        toast.error('Keine Verbindung. Bitte erneut versuchen.')
      }
    })

  if (status !== 'eingereicht' && status !== 'freigegeben') return null

  return (
    <div className="space-y-3">
      {mode === 'correction' ? (
        <>
          <Textarea
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Was soll korrigiert werden?"
            aria-label="Korrekturhinweis"
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setMode('idle')} disabled={pending}>
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => decide('request_correction')}
              disabled={pending || !comment.trim()}
            >
              {pending ? <Loader2 className="animate-spin" /> : <MessageSquareWarning />}
              Korrektur anfordern
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          {status === 'eingereicht' ? (
            <Button variant="success" size="lg" className="flex-1" onClick={() => decide('approve')} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Freigeben
            </Button>
          ) : null}
          <Button variant="outline" size="lg" className="flex-1" onClick={() => setMode('correction')} disabled={pending}>
            <MessageSquareWarning /> Korrektur anfordern
          </Button>
        </div>
      )}
    </div>
  )
}
