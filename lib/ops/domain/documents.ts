/** Dokumente zu Aufträgen: erlaubte Dateien, Größen, Anzeige. */

export const DOCUMENT_ARTS = ['angebot', 'aufmass', 'plan', 'lieferschein', 'datenblatt', 'protokoll', 'sonstiges'] as const
export type DocumentArt = (typeof DOCUMENT_ARTS)[number]

export const DOCUMENT_ART_LABELS: Record<DocumentArt, string> = {
  angebot: 'Angebot',
  aufmass: 'Aufmaß',
  plan: 'Plan / Zeichnung',
  lieferschein: 'Lieferschein',
  datenblatt: 'Datenblatt / Anleitung',
  protokoll: 'Protokoll',
  sonstiges: 'Sonstiges',
}

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024

/** Dateien, die beim Öffnen Code ausführen könnten oder keine Dokumente sind. Alles andere ist erlaubt. */
const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif', 'lnk', 'reg', 'dll', 'jar', 'apk', 'dmg', 'app',
  'js', 'mjs', 'cjs', 'vbs', 'ps1', 'sh', 'php', 'html', 'htm', 'xhtml', 'svg',
])

export function fileExtension(name: string): string {
  const m = /\.([A-Za-z0-9]{1,10})$/.exec(name.trim())
  return m ? m[1].toLowerCase() : ''
}

/** Fehlermeldung oder null, wenn die Datei hochgeladen werden darf. */
export function validateDocumentFile(file: { name: string; size: number }): string | null {
  if (!file.name.trim()) return 'Die Datei hat keinen Namen.'
  if (file.size <= 0) return 'Die Datei ist leer.'
  if (file.size > MAX_DOCUMENT_BYTES) return `Die Datei ist zu groß (max. ${formatBytes(MAX_DOCUMENT_BYTES)}).`
  if (BLOCKED_EXTENSIONS.has(fileExtension(file.name))) return 'Dieser Dateityp ist aus Sicherheitsgründen nicht erlaubt.'
  return null
}

/** Endung für den Speicherpfad (nur Buchstaben/Ziffern). */
export function storageExtension(name: string): string {
  return fileExtension(name) || 'bin'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

export type DocumentKind = 'pdf' | 'bild' | 'tabelle' | 'text' | 'archiv' | 'datei'

export function documentKind(name: string): DocumentKind {
  const ext = fileExtension(name)
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'tif', 'tiff'].includes(ext)) return 'bild'
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'tabelle'
  if (['doc', 'docx', 'odt', 'txt', 'rtf', 'ppt', 'pptx'].includes(ext)) return 'text'
  if (['zip', 'rar', '7z'].includes(ext)) return 'archiv'
  return 'datei'
}
