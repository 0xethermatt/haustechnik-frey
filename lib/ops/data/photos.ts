import 'server-only'
import type { ServerSupabase } from '../supabase/server'
import type { PhotoPhase } from '../domain/types'

export const PHOTO_BUCKET = 'auftragsfotos'
const SIGNED_URL_SECONDS = 3600

export interface JobPhoto {
  id: string
  phase: PhotoPhase
  caption: string | null
  taken_on: string
  created_by: string | null
  created_at: string
  thumbUrl: string | null
  fullUrl: string | null
}

export async function loadJobPhotos(supabase: ServerSupabase, jobId: string): Promise<JobPhoto[]> {
  const { data } = await supabase
    .from('auftragsfotos')
    .select('id, phase, caption, taken_on, created_by, created_at, storage_path, thumb_path')
    .eq('job_id', jobId)
    .order('taken_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)
  const rows = data ?? []
  if (!rows.length) return []
  const bucket = supabase.storage.from(PHOTO_BUCKET)
  const [thumbs, fulls] = await Promise.all([
    bucket.createSignedUrls(rows.map((r) => r.thumb_path), SIGNED_URL_SECONDS),
    bucket.createSignedUrls(rows.map((r) => r.storage_path), SIGNED_URL_SECONDS),
  ])
  return rows.map((r, i) => ({
    id: r.id,
    phase: r.phase as PhotoPhase,
    caption: r.caption,
    taken_on: r.taken_on,
    created_by: r.created_by,
    created_at: r.created_at,
    thumbUrl: thumbs.data?.[i]?.signedUrl ?? null,
    fullUrl: fulls.data?.[i]?.signedUrl ?? null,
  }))
}

export async function countJobPhotos(supabase: ServerSupabase, jobId: string): Promise<number> {
  const { count } = await supabase.from('auftragsfotos').select('id', { count: 'exact', head: true }).eq('job_id', jobId)
  return count ?? 0
}
