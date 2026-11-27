import 'server-only'
import type { ServerSupabase } from '../supabase/server'
import type { DocumentArt } from '../domain/documents'

export const DOCUMENT_BUCKET = 'auftragsdokumente'
const SIGNED_URL_SECONDS = 3600

export interface JobDocument {
  id: string
  filename: string
  art: DocumentArt
  note: string | null
  size_bytes: number | null
  created_by: string | null
  created_at: string
  url: string | null
}

export async function loadJobDocuments(supabase: ServerSupabase, jobId: string): Promise<JobDocument[]> {
  const { data } = await supabase
    .from('auftragsdokumente')
    .select('id, filename, art, note, size_bytes, created_by, created_at, storage_path')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(300)
  const rows = data ?? []
  if (!rows.length) return []
  const signed = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrls(rows.map((r) => r.storage_path), SIGNED_URL_SECONDS)
  return rows.map((r, i) => ({
    id: r.id,
    filename: r.filename,
    art: r.art as DocumentArt,
    note: r.note,
    size_bytes: r.size_bytes === null ? null : Number(r.size_bytes),
    created_by: r.created_by,
    created_at: r.created_at,
    url: signed.data?.[i]?.signedUrl ?? null,
  }))
}
