'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  CloudOff,
  Loader2,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/select'
import { Field } from '@/components/ui/field'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ReportStatusBadge } from '@/components/ops/status-badges'
import { DurationInput } from './duration-input'
import { JobPicker } from './job-picker'
import { addDays, berlinToday, utcToBerlinTime } from '@/lib/ops/domain/dates'
import { formatMinutes } from '@/lib/ops/domain/time'
import { EMPLOYMENT_ROLE_LABELS, MATERIAL_UNITS } from '@/lib/ops/domain/labels'
import type { DirectoryEmployee, ReportStatus } from '@/lib/ops/domain/types'
import type { JobOption } from '@/lib/ops/data/common'
import { cn, fullName } from '@/lib/ops/utils'
import { emptyMaterial, type MaterialRow, type ParticipantRow, type ReportFormInitial, type ReportFormState } from '@/lib/ops/report-form-state'
import { listUnsyncedNewDrafts, loadLocalDraft, removeLocalDraft, saveLocalDraft } from '@/lib/ops/local-drafts'
import { deleteDraft, getReportSyncState, saveReport } from '@/app/(ops)/intern/(app)/berichte/actions'

type SaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'offline' | 'error' | 'conflict'

const SUGGESTED_ACTIVITIES = [
  'Dichtheitsprüfung durchgeführt',
  'Funktionsprüfung durchgeführt',
  'Kunde eingewiesen',
  'Arbeitsplatz gereinigt',
  'Altmaterial entsorgt',
]

const uuid = () => crypto.randomUUID()

function spanMinutes(p: ParticipantRow): number {
  if (!p.start_time || !p.end_time || p.end_time <= p.start_time) return 0
  const [sh, sm] = p.start_time.split(':').map(Number)
  const [eh, em] = p.end_time.split(':').map(Number)
  return Math.max(0, eh * 60 + em - (sh * 60 + sm) - p.break_minutes)
}

function effectiveMinutes(p: ParticipantRow) {
  return p.useSpan ? spanMinutes(p) : p.minutes
}

export function ReportForm({
  initial,
  jobs,
  employees,
  currentEmployeeId,
  isOffice,
  canEdit,
}: {
  initial: ReportFormInitial
  jobs: JobOption[]
  employees: DirectoryEmployee[]
  currentEmployeeId: string | null
  isOffice: boolean
  canEdit: boolean
}) {
  const router = useRouter()
  const [state, setState] = useState<ReportFormState>(initial.state)
  const [version, setVersion] = useState<number | null>(initial.version)
  const [status, setStatus] = useState<ReportStatus>(initial.status)
  const [saveState, setSaveState] = useState<SaveState>('clean')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [correctionReason, setCorrectionReason] = useState('')
  const [restorable, setRestorable] = useState<{ id: string; savedAt: string; state: ReportFormState } | null>(null)
  const [reportId, setReportId] = useState(initial.id)
  const [isNew, setIsNew] = useState(initial.isNew)
  const [addPersonOpen, setAddPersonOpen] = useState(false)

  const pendingMutation = useRef<string | null>(null)
  const sentMutations = useRef<string[]>([])
  const busy = useRef(false)

  const today = berlinToday()
  const needsReason = isOffice && status === 'freigegeben' && !initial.isNew
  const locked = !canEdit

  // Lokal gesicherten Stand anbieten (z. B. nach Funkloch oder Neuladen)
  const restoreChecked = useRef(false)
  useEffect(() => {
    if (restoreChecked.current) return
    restoreChecked.current = true
    if (initial.isNew) {
      const latest = listUnsyncedNewDrafts<ReportFormState>().find((d) => d.id !== initial.id)
      if (latest) setRestorable({ id: latest.id, savedAt: latest.savedAt, state: latest.state })
    } else {
      const local = loadLocalDraft<ReportFormState>(initial.id)
      if (local) setRestorable({ id: local.id, savedAt: local.savedAt, state: local.state })
    }
  }, [initial.id, initial.isNew])

  const update = useCallback(
    (fn: (s: ReportFormState) => ReportFormState) => {
      setState((prev) => {
        const next = fn(prev)
        saveLocalDraft({ id: reportId, savedAt: new Date().toISOString(), isNew, state: next })
        return next
      })
      pendingMutation.current = null
      setSaveState('dirty')
    },
    [reportId, isNew],
  )

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (['dirty', 'offline', 'error', 'saving'].includes(saveState)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [saveState])

  const totalMinutes = useMemo(() => state.participants.reduce((sum, p) => sum + effectiveMinutes(p), 0), [state.participants])

  const buildPayload = (submit: boolean, mutationId: string, expectedVersion: number | null) => ({
    id: reportId,
    mutation_id: mutationId,
    expected_version: expectedVersion,
    job_id: state.job_id ?? '',
    report_date: state.report_date,
    internal_notes: state.internal_notes,
    correction_reason: correctionReason || null,
    submit,
    activities: state.activities.filter((a) => a.description.trim()).map((a) => ({ id: a.id, description: a.description })),
    materials: state.materials
      .filter((m) => m.description.trim())
      .map((m) => ({
        id: m.id,
        description: m.description,
        quantity: Number(m.quantity.replace(',', '.')),
        unit: m.unit,
        manufacturer: m.manufacturer,
        article_number: m.article_number,
        supplier_article_number: m.supplier_article_number,
        supplier_reference: m.supplier_reference,
        catalog_article_id: m.catalog_article_id,
      })),
    participants: state.participants.map((p) =>
      p.useSpan
        ? {
            employee_id: p.employee_id,
            duration_minutes: Math.max(1, spanMinutes(p)),
            start_time: p.start_time,
            end_time: p.end_time,
            break_minutes: p.break_minutes,
          }
        : { employee_id: p.employee_id, duration_minutes: p.minutes, break_minutes: 0 },
    ),
  })

  const validate = (submit: boolean): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!state.job_id) e.job_id = 'Bitte Kunde und Auftrag wählen.'
    if (state.report_date > today) e.report_date = 'Datum liegt in der Zukunft.'
    state.participants.forEach((p, i) => {
      if (effectiveMinutes(p) <= 0) e[`participants.${i}`] = 'Arbeitszeit fehlt.'
    })
    state.materials.forEach((m, i) => {
      if (m.description.trim() && !(Number(m.quantity.replace(',', '.')) > 0)) e[`materials.${i}`] = 'Menge prüfen.'
    })
    if (submit) {
      if (!state.activities.some((a) => a.description.trim())) e.activities = 'Mindestens eine ausgeführte Arbeit eintragen.'
      if (state.participants.length === 0) e.participants = 'Mindestens einen Mitarbeiter eintragen.'
    }
    if (needsReason && correctionReason.trim().length < 5) e.correction_reason = 'Bitte die Korrektur begründen.'
    return e
  }

  const persist = async (submit: boolean) => {
    if (busy.current) return
    const clientErrors = validate(submit)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) {
      toast.error(Object.values(clientErrors)[0])
      return
    }
    busy.current = true
    setSaveState('saving')
    const mutationId = pendingMutation.current ?? uuid()
    pendingMutation.current = mutationId
    if (!sentMutations.current.includes(mutationId)) sentMutations.current.push(mutationId)

    try {
      let expected = version
      let res = await saveReport(buildPayload(submit, mutationId, expected))

      // Konflikt durch eigene, bereits angekommene Speicherung (Antwort ging verloren)?
      if (!res.ok && res.code === 'VERSION_CONFLICT') {
        const sync = await getReportSyncState(reportId)
        if (sync.ok && sync.data && sync.data.last_mutation_id && sentMutations.current.includes(sync.data.last_mutation_id)) {
          expected = sync.data.version
          const retryId = uuid()
          pendingMutation.current = retryId
          sentMutations.current.push(retryId)
          res = await saveReport(buildPayload(submit, retryId, expected))
        }
      }

      if (res.ok) {
        pendingMutation.current = null
        setVersion(res.data.version)
        setStatus(res.data.status)
        setIsNew(false)
        setErrors({})
        setCorrectionReason('')
        setSaveState('saved')
        setLastSavedAt(new Date().toISOString())
        removeLocalDraft(reportId)
        if (submit) {
          toast.success('Bericht eingereicht')
          router.push(`/intern/berichte/${reportId}`)
          router.refresh()
        } else {
          toast.success('Gespeichert')
          if (initial.isNew) router.replace(`/intern/berichte/${reportId}/bearbeiten`, { scroll: false })
        }
      } else if (res.code === 'VERSION_CONFLICT') {
        setSaveState('conflict')
        toast.error(res.error)
      } else {
        setSaveState('error')
        setErrors(res.fieldErrors ?? {})
        toast.error(res.error)
      }
    } catch {
      // Netzwerkfehler: Daten bleiben lokal gesichert, Wiederholung mit gleicher Mutations-ID ist sicher.
      setSaveState('offline')
      toast.error('Keine Verbindung. Ihre Eingaben sind auf diesem Gerät gesichert.')
    } finally {
      busy.current = false
    }
  }

  const discardDraft = async () => {
    if (isNew || version === null) {
      removeLocalDraft(reportId)
      router.push('/intern')
      return
    }
    if (!confirm('Entwurf wirklich verwerfen? Die erfassten Zeiten werden ebenfalls entfernt.')) return
    try {
      const res = await deleteDraft(reportId, version)
      if (!res.ok) return toast.error(res.error)
      removeLocalDraft(reportId)
      toast.success('Entwurf verworfen')
      router.push('/intern/berichte')
      router.refresh()
    } catch {
      toast.error('Keine Verbindung.')
    }
  }

  const restore = () => {
    if (!restorable) return
    if (restorable.id !== reportId) {
      setReportId(restorable.id)
      setIsNew(true)
    }
    setState(restorable.state)
    setRestorable(null)
    setSaveState('dirty')
    pendingMutation.current = null
  }

  const participantIds = new Set(state.participants.map((p) => p.employee_id))
  const addableEmployees = employees.filter((e) => e.is_active && !participantIds.has(e.id))
  const employeeName = (id: string) => {
    const e = employees.find((x) => x.id === id)
    return e ? fullName(e) : 'Unbekannt'
  }
  const employeeRole = (id: string) => {
    const e = employees.find((x) => x.id === id)
    return e ? EMPLOYMENT_ROLE_LABELS[e.employment_role] : ''
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pb-44 pt-4 md:px-8 md:pb-32 md:pt-6">
      {restorable ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <RotateCcw className="h-4 w-4 text-primary" />
          <span className="flex-1">Nicht gespeicherte Eingaben auf diesem Gerät gefunden.</span>
          <Button size="sm" onClick={restore}>
            Wiederherstellen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              removeLocalDraft(restorable.id)
              setRestorable(null)
            }}
          >
            Verwerfen
          </Button>
        </div>
      ) : null}

      {status === 'korrektur_erforderlich' && initial.reviewComment ? (
        <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <div className="font-medium">Korrektur angefordert</div>
            <div className="text-muted-foreground">{initial.reviewComment}</div>
          </div>
        </div>
      ) : null}

      {locked ? (
        <div className="rounded-xl border bg-muted p-3 text-sm text-muted-foreground">
          Dieser Bericht ist eingereicht und kann nur vom Büro geändert werden.
        </div>
      ) : null}

      <Section title="Kunde & Auftrag" step={1}>
        <JobPicker
          jobs={jobs}
          value={state.job_id}
          disabled={locked}
          error={errors.job_id}
          onChange={(job) => update((s) => ({ ...s, job_id: job.id }))}
        />
        <div className="mt-3 flex items-center gap-2">
          {[today, addDays(today, -1)].map((d) => (
            <button
              key={d}
              type="button"
              disabled={locked}
              onClick={() => update((s) => ({ ...s, report_date: d }))}
              className={cn(
                'h-10 rounded-lg border px-3 text-sm',
                state.report_date === d ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {d === today ? 'Heute' : 'Gestern'}
            </button>
          ))}
          <Input
            type="date"
            aria-label="Datum"
            value={state.report_date}
            max={today}
            disabled={locked}
            onChange={(e) => e.target.value && update((s) => ({ ...s, report_date: e.target.value }))}
            className="h-10 flex-1"
          />
        </div>
        {errors.report_date ? <p className="mt-1.5 text-sm text-destructive">{errors.report_date}</p> : null}
      </Section>

      <Section title="Ausgeführte Arbeiten" step={2} error={errors.activities}>
        <div className="space-y-2">
          {state.activities.map((a, i) => (
            <div key={a.id} className="flex items-center gap-2">
              <Input
                value={a.description}
                disabled={locked}
                placeholder={i === 0 ? 'z. B. Alten Waschtisch demontiert' : 'Weitere Arbeit …'}
                aria-label={`Arbeit ${i + 1}`}
                onChange={(e) =>
                  update((s) => ({
                    ...s,
                    activities: s.activities.map((x) => (x.id === a.id ? { ...x, description: e.target.value } : x)),
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (i === state.activities.length - 1 && a.description.trim()) {
                      update((s) => ({ ...s, activities: [...s.activities, { id: uuid(), description: '' }] }))
                      setTimeout(() => {
                        const inputs = document.querySelectorAll<HTMLInputElement>('[aria-label^="Arbeit "]')
                        inputs[inputs.length - 1]?.focus()
                      }, 0)
                    }
                  }
                }}
              />
              {!locked && state.activities.length > 1 ? (
                <RemoveButton
                  label="Arbeit entfernen"
                  onClick={() => update((s) => ({ ...s, activities: s.activities.filter((x) => x.id !== a.id) }))}
                />
              ) : null}
            </div>
          ))}
        </div>
        {!locked ? (
          <>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 text-primary"
              onClick={() => update((s) => ({ ...s, activities: [...s.activities, { id: uuid(), description: '' }] }))}
            >
              <Plus /> Arbeit hinzufügen
            </Button>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {SUGGESTED_ACTIVITIES.filter((s) => !state.activities.some((a) => a.description === s)).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() =>
                    update((s) => {
                      const empty = s.activities.find((a) => !a.description.trim())
                      return {
                        ...s,
                        activities: empty
                          ? s.activities.map((a) => (a.id === empty.id ? { ...a, description: sugg } : a))
                          : [...s.activities, { id: uuid(), description: sugg }],
                      }
                    })
                  }
                  className="h-8 rounded-full border border-dashed px-3 text-xs text-muted-foreground active:bg-accent"
                >
                  + {sugg}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </Section>

      <Section title="Material" step={3} hint="Optional">
        <div className="space-y-3">
          {state.materials.map((m, i) => (
            <MaterialEditor
              key={m.id}
              row={m}
              index={i}
              disabled={locked}
              error={errors[`materials.${i}`]}
              onChange={(row) => update((s) => ({ ...s, materials: s.materials.map((x) => (x.id === m.id ? row : x)) }))}
              onRemove={() => update((s) => ({ ...s, materials: s.materials.filter((x) => x.id !== m.id) }))}
            />
          ))}
        </div>
        {!locked ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-2 text-primary"
            onClick={() => update((s) => ({ ...s, materials: [...s.materials, emptyMaterial()] }))}
          >
            <Plus /> Material hinzufügen
          </Button>
        ) : null}
      </Section>

      <Section
        title="Mitarbeiter & Arbeitszeit"
        step={4}
        error={errors.participants}
        hint={totalMinutes ? `Gesamt ${formatMinutes(totalMinutes)}` : undefined}
      >
        <div className="space-y-3">
          {state.participants.map((p, i) => (
            <div key={p.employee_id} className="rounded-xl border bg-background p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {employeeName(p.employee_id)}
                    {p.employee_id === currentEmployeeId ? <span className="ml-1 text-muted-foreground">(ich)</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">{employeeRole(p.employee_id)}</div>
                </div>
                {!locked ? (
                  <RemoveButton
                    label="Mitarbeiter entfernen"
                    onClick={() => update((s) => ({ ...s, participants: s.participants.filter((x) => x.employee_id !== p.employee_id) }))}
                  />
                ) : null}
              </div>
              {p.useSpan ? (
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Beginn" htmlFor={`start-${p.employee_id}`}>
                    <Input
                      id={`start-${p.employee_id}`}
                      type="time"
                      value={p.start_time}
                      disabled={locked}
                      onChange={(e) => updateParticipant(update, p.employee_id, { start_time: e.target.value })}
                    />
                  </Field>
                  <Field label="Ende" htmlFor={`end-${p.employee_id}`}>
                    <Input
                      id={`end-${p.employee_id}`}
                      type="time"
                      value={p.end_time}
                      disabled={locked}
                      onChange={(e) => updateParticipant(update, p.employee_id, { end_time: e.target.value })}
                    />
                  </Field>
                  <Field label="Pause (min)" htmlFor={`break-${p.employee_id}`}>
                    <Input
                      id={`break-${p.employee_id}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={5}
                      value={p.break_minutes}
                      disabled={locked}
                      onChange={(e) => updateParticipant(update, p.employee_id, { break_minutes: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </Field>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    Arbeitszeit: <span className="tabular font-semibold text-foreground">{formatMinutes(spanMinutes(p))}</span>
                  </div>
                </div>
              ) : (
                <DurationInput
                  id={`duration-${p.employee_id}`}
                  value={p.minutes}
                  invalid={!!errors[`participants.${i}`]}
                  onChange={(minutes) => !locked && updateParticipant(update, p.employee_id, { minutes })}
                />
              )}
              {errors[`participants.${i}`] ? <p className="mt-1.5 text-sm text-destructive">{errors[`participants.${i}`]}</p> : null}
              {!locked ? (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    updateParticipant(update, p.employee_id, p.useSpan ? { useSpan: false, minutes: spanMinutes(p) || p.minutes } : { useSpan: true })
                  }
                >
                  <Clock className="h-3.5 w-3.5" />
                  {p.useSpan ? 'Nur Dauer angeben' : 'Uhrzeit von–bis angeben'}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {!locked ? (
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setAddPersonOpen(true)} disabled={!addableEmployees.length}>
            <UserPlus /> Mitarbeiter hinzufügen
          </Button>
        ) : null}
        <Sheet open={addPersonOpen} onOpenChange={setAddPersonOpen}>
          <SheetContent title="Mitarbeiter hinzufügen">
            <ul className="divide-y rounded-xl border">
              {addableEmployees.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3 text-left active:bg-accent"
                    onClick={() => {
                      const template = state.participants[0]
                      update((s) => ({
                        ...s,
                        participants: [
                          ...s.participants,
                          template
                            ? { ...template, employee_id: e.id }
                            : { employee_id: e.id, minutes: 0, useSpan: false, start_time: '07:30', end_time: '16:00', break_minutes: 30 },
                        ],
                      }))
                      setAddPersonOpen(false)
                    }}
                  >
                    <span className="font-medium">{fullName(e)}</span>
                    <span className="text-sm text-muted-foreground">{EMPLOYMENT_ROLE_LABELS[e.employment_role]}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Die Zeit des ersten Mitarbeiters wird übernommen und kann angepasst werden.</p>
          </SheetContent>
        </Sheet>
      </Section>

      <Section title="Interne Notiz" step={5} hint="Optional, nur intern sichtbar">
        <Textarea
          value={state.internal_notes}
          disabled={locked}
          onChange={(e) => update((s) => ({ ...s, internal_notes: e.target.value }))}
          placeholder="z. B. Material nachbestellen, Kunde wünscht Rückruf"
          maxLength={4000}
        />
      </Section>

      {needsReason && canEdit ? (
        <Section title="Begründung der Korrektur" step={6}>
          <Textarea
            value={correctionReason}
            onChange={(e) => {
              setCorrectionReason(e.target.value)
              setSaveState('dirty')
            }}
            placeholder="Warum wird der freigegebene Bericht geändert?"
            aria-invalid={!!errors.correction_reason}
          />
          {errors.correction_reason ? <p className="mt-1.5 text-sm text-destructive">{errors.correction_reason}</p> : null}
          <p className="mt-1.5 text-xs text-muted-foreground">Die Änderung wird mit Begründung im Änderungsprotokoll gespeichert.</p>
        </Section>
      ) : null}

      {!isNew && status === 'entwurf' && canEdit ? (
        <div className="pt-2 text-center">
          <Button type="button" variant="ghost" className="text-destructive" onClick={discardDraft}>
            <Trash2 /> Entwurf verwerfen
          </Button>
        </div>
      ) : null}

      {canEdit ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t bg-background/95 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 md:px-8">
            <SaveIndicator state={saveState} status={status} lastSavedAt={lastSavedAt} />
            <div className="ml-auto flex gap-2">
              {status === 'entwurf' || status === 'korrektur_erforderlich' ? (
                <>
                  <Button type="button" variant="outline" onClick={() => persist(false)} disabled={saveState === 'saving'}>
                    {saveState === 'offline' || saveState === 'error' ? 'Erneut speichern' : 'Speichern'}
                  </Button>
                  <Button type="button" onClick={() => persist(true)} disabled={saveState === 'saving'}>
                    {saveState === 'saving' ? <Loader2 className="animate-spin" /> : <Send />}
                    Einreichen
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => persist(false)} disabled={saveState === 'saving' || saveState === 'clean'}>
                  {saveState === 'saving' ? <Loader2 className="animate-spin" /> : null}
                  Änderungen speichern
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function updateParticipant(
  update: (fn: (s: ReportFormState) => ReportFormState) => void,
  employeeId: string,
  patch: Partial<ParticipantRow>,
) {
  update((s) => ({
    ...s,
    participants: s.participants.map((p) => (p.employee_id === employeeId ? { ...p, ...patch } : p)),
  }))
}

function Section({
  title,
  step,
  hint,
  error,
  children,
}: {
  title: string
  step: number
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm" aria-labelledby={`section-${step}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{step}</span>
        <h2 id={`section-${step}`} className="font-semibold">
          {title}
        </h2>
        {hint ? <span className="ml-auto text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive"
    >
      <X className="h-4 w-4" />
    </button>
  )
}

function MaterialEditor({
  row,
  index,
  disabled,
  error,
  onChange,
  onRemove,
}: {
  row: MaterialRow
  index: number
  disabled: boolean
  error?: string
  onChange: (row: MaterialRow) => void
  onRemove: () => void
}) {
  const [details, setDetails] = useState(
    !!(row.manufacturer || row.article_number || row.supplier_article_number || row.supplier_reference),
  )
  const set = (key: keyof MaterialRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...row, [key]: e.target.value })

  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Bezeichnung Material ${index + 1}`}
          value={row.description}
          placeholder="Bezeichnung, z. B. Einhebelmischer"
          disabled={disabled}
          onChange={set('description')}
          className="flex-1"
        />
        {!disabled ? <RemoveButton label="Material entfernen" onClick={onRemove} /> : null}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Input
          aria-label={`Menge Material ${index + 1}`}
          value={row.quantity}
          inputMode="decimal"
          disabled={disabled}
          onChange={set('quantity')}
          className="w-20 text-center"
          aria-invalid={!!error}
        />
        <div className="w-28">
          <NativeSelect aria-label="Einheit" value={row.unit} onChange={set('unit')} disabled={disabled}>
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            {!MATERIAL_UNITS.includes(row.unit as (typeof MATERIAL_UNITS)[number]) ? <option value={row.unit}>{row.unit}</option> : null}
          </NativeSelect>
        </div>
      </div>
      {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
      <button
        type="button"
        onClick={() => setDetails((d) => !d)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', details && 'rotate-180')} />
        Hersteller & Artikelnummern
      </button>
      {details ? (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input aria-label="Hersteller" placeholder="Hersteller" value={row.manufacturer} disabled={disabled} onChange={set('manufacturer')} />
          <Input aria-label="Artikelnummer" placeholder="Artikelnummer" value={row.article_number} disabled={disabled} onChange={set('article_number')} />
          <Input
            aria-label="Lieferanten-Artikelnummer"
            placeholder="Lieferanten-Artikelnr."
            value={row.supplier_article_number}
            disabled={disabled}
            onChange={set('supplier_article_number')}
          />
          <Input
            aria-label="Lieferantenreferenz"
            placeholder="Lieferant / Referenz"
            value={row.supplier_reference}
            disabled={disabled}
            onChange={set('supplier_reference')}
          />
        </div>
      ) : null}
    </div>
  )
}

function SaveIndicator({ state, status, lastSavedAt }: { state: SaveState; status: ReportStatus; lastSavedAt: string | null }) {
  const content = {
    clean: { icon: null, text: null, className: '' },
    dirty: { icon: <span className="h-2 w-2 rounded-full bg-warning" />, text: 'Ungespeichert', className: 'text-warning' },
    saving: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Speichert …', className: 'text-muted-foreground' },
    saved: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: lastSavedAt ? `Gespeichert ${utcToBerlinTime(lastSavedAt)}` : 'Gespeichert',
      className: 'text-success',
    },
    offline: { icon: <CloudOff className="h-4 w-4" />, text: 'Offline – lokal gesichert', className: 'text-destructive' },
    error: { icon: <AlertTriangle className="h-4 w-4" />, text: 'Nicht gespeichert', className: 'text-destructive' },
    conflict: { icon: <AlertTriangle className="h-4 w-4" />, text: 'Konflikt – bitte neu laden', className: 'text-destructive' },
  }[state]

  return (
    <div className={cn('flex min-w-0 items-center gap-1.5 text-xs font-medium', content.className)} aria-live="polite">
      {content.icon}
      {content.text ? <span className="truncate">{content.text}</span> : <ReportStatusBadge status={status} />}
    </div>
  )
}
