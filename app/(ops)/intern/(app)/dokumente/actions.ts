'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { DOCUMENT_BUCKET } from '@/lib/ops/data/documents'
import { DOCUMENT_ARTS, storageExtension, validateDocumentFile } from '@/lib/ops/domain/documents'

const prepareSchema = z.object({
  job_id: z.uuid('Bitte einen Auftrag wählen.'),
  filename: z.string().trim().min(1).max(255),
  size: z.number().int().min(1),
  art: z.enum(DOCUMENT_ARTS),
})

/**
 * Schritt 1: Upload vorbereiten. Die Datei geht danach direkt vom Browser in den Speicher
 * (nicht über den Server – so sind auch große PDFs möglich). Zugriff prüft die Datenbank (RLS).
 */
export async function prepareDocumentUpload(input: unknown): Promise<ActionResult<{ id: string; path: string; token: string }>> {
  await requireSession()
  const parsed = prepareSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const v = parsed.data
  const problem = validateDocumentFile({ name: v.filename, size: v.size })
  if (problem) return fail(problem, { code: 'INVALID' })

  const supabase = createClient()
  const { data: job } = await supabase.from('auftraege').select('id').eq('id', v.job_id).maybeSingle()
  if (!job) return fail('Kein Zugriff auf diesen Auftrag.', { code: 'FORBIDDEN' })

  const id = randomUUID()
  const path = `${v.job_id}/${id}.${storageExtension(v.filename)}`
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return fail('Upload konnte nicht vorbereitet werden (Speicher nicht eingerichtet?).', { code: 'UNKNOWN' })
  return ok({ id, path, token: data.token })
}

const confirmSchema = z.object({
  id: z.uuid(),
  job_id: z.uuid(),
  path: z.string().min(10).max(300),
  filename: z.string().trim().min(1).max(255),
  mime: z.string().max(200).nullish(),
  size: z.number().int().min(1),
  art: z.enum(DOCUMENT_ARTS),
  note: z.string().trim().max(300).nullish(),
})

/** Schritt 2: Nach erfolgreichem Upload den Eintrag anlegen. Prüft, dass die Datei wirklich im Speicher liegt. */
export async function confirmDocumentUpload(input: unknown): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  const parsed = confirmSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const v = parsed.data
  if (!v.path.startsWith(`${v.job_id}/${v.id}.`)) return fail('Ungültiger Dateipfad.', { code: 'INVALID' })

  const supabase = createClient()
  const bucket = supabase.storage.from(DOCUMENT_BUCKET)
  const { data: listed } = await bucket.list(v.job_id, { search: v.id, limit: 5 })
  if (!listed?.some((o) => v.path.endsWith(`/${o.name}`))) return fail('Die Datei wurde nicht hochgeladen.', { code: 'INVALID' })

  const { error } = await supabase.from('auftragsdokumente').insert({
    id: v.id,
    job_id: v.job_id,
    storage_path: v.path,
    filename: v.filename,
    mime_type: v.mime || null,
    art: v.art,
    note: v.note || null,
    size_bytes: v.size,
    created_by: ctx.userId,
  })
  if (error) {
    await bucket.remove([v.path])
    return fromDbError(error)
  }
  revalidatePath(`/intern/auftraege/${v.job_id}`)
  return ok({ id: v.id })
}

export async function deleteJobDocument(id: string): Promise<ActionResult<null>> {
  await requireSession()
  const supabase = createClient()
  const { data, error } = await supabase.from('auftragsdokumente').delete().eq('id', id).select('job_id, storage_path')
  if (error) return fromDbError(error)
  const row = data?.[0]
  if (!row) return fail('Dokument nicht gefunden oder keine Berechtigung zum Löschen.', { code: 'FORBIDDEN' })
  await supabase.storage.from(DOCUMENT_BUCKET).remove([row.storage_path])
  revalidatePath(`/intern/auftraege/${row.job_id}`)
  return ok(null)
}
