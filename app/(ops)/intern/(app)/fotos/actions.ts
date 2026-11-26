'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { requireSession } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { fail, fromDbError, invalid, ok, type ActionResult } from '@/lib/ops/actions'
import { photoUploadSchema } from '@/lib/ops/validation/schemas'
import { PHOTO_BUCKET } from '@/lib/ops/data/photos'

const MAX_FULL_BYTES = 4_500_000
const MAX_THUMB_BYTES = 600_000

/** Foto zu einem Auftrag hochladen (Original verkleinert + Vorschaubild). Die Zugriffsrechte prüft die Datenbank (RLS). */
export async function uploadJobPhoto(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSession()
  const parsed = photoUploadSchema.safeParse({
    job_id: formData.get('job_id'),
    phase: formData.get('phase'),
    caption: formData.get('caption'),
  })
  if (!parsed.success) return invalid(parsed.error)
  const file = formData.get('file')
  const thumb = formData.get('thumb')
  if (!(file instanceof File) || !(thumb instanceof File)) return fail('Kein Bild übermittelt.', { code: 'INVALID' })
  if (file.type !== 'image/jpeg' || thumb.type !== 'image/jpeg') return fail('Nur Fotos (JPEG) sind erlaubt.', { code: 'INVALID' })
  if (file.size > MAX_FULL_BYTES || thumb.size > MAX_THUMB_BYTES) return fail('Das Foto ist zu groß.', { code: 'INVALID' })

  const supabase = createClient()
  const id = randomUUID()
  const storagePath = `${parsed.data.job_id}/${id}.jpg`
  const thumbPath = `${parsed.data.job_id}/${id}_t.jpg`
  const bucket = supabase.storage.from(PHOTO_BUCKET)

  const up = await bucket.upload(storagePath, file, { contentType: 'image/jpeg', upsert: false })
  if (up.error) return fail('Foto konnte nicht gespeichert werden (keine Berechtigung für diesen Auftrag?).', { code: 'FORBIDDEN' })
  const upThumb = await bucket.upload(thumbPath, thumb, { contentType: 'image/jpeg', upsert: false })
  if (upThumb.error) {
    await bucket.remove([storagePath])
    return fail('Vorschaubild konnte nicht gespeichert werden.', { code: 'UNKNOWN' })
  }

  const { error } = await supabase.from('auftragsfotos').insert({
    id,
    job_id: parsed.data.job_id,
    storage_path: storagePath,
    thumb_path: thumbPath,
    phase: parsed.data.phase,
    caption: parsed.data.caption,
    size_bytes: file.size + thumb.size,
    created_by: ctx.userId,
  })
  if (error) {
    await bucket.remove([storagePath, thumbPath])
    return fromDbError(error)
  }
  revalidatePath(`/intern/auftraege/${parsed.data.job_id}`)
  return ok({ id })
}

export async function deleteJobPhoto(id: string): Promise<ActionResult<null>> {
  await requireSession()
  const supabase = createClient()
  const { data, error } = await supabase.from('auftragsfotos').delete().eq('id', id).select('job_id, storage_path, thumb_path')
  if (error) return fromDbError(error)
  const row = data?.[0]
  if (!row) return fail('Foto nicht gefunden oder keine Berechtigung zum Löschen.', { code: 'FORBIDDEN' })
  await supabase.storage.from(PHOTO_BUCKET).remove([row.storage_path, row.thumb_path])
  revalidatePath(`/intern/auftraege/${row.job_id}`)
  return ok(null)
}
