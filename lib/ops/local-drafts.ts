/**
 * Lokale Sicherung ungespeicherter Berichte im Browser (z. B. bei Funkloch).
 * Enthält nur das, was der Benutzer selbst eingegeben hat, und wird nach
 * erfolgreichem Speichern gelöscht.
 */
const PREFIX = 'frey:bericht:'
const INDEX = 'frey:berichte-lokal'

export interface LocalDraft<T> {
  id: string
  savedAt: string
  isNew: boolean
  state: T
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export function saveLocalDraft<T>(draft: LocalDraft<T>) {
  safe(() => {
    localStorage.setItem(PREFIX + draft.id, JSON.stringify(draft))
    const index = new Set<string>(JSON.parse(localStorage.getItem(INDEX) ?? '[]'))
    index.add(draft.id)
    localStorage.setItem(INDEX, JSON.stringify([...index]))
  }, undefined)
}

export function loadLocalDraft<T>(id: string): LocalDraft<T> | null {
  return safe(() => {
    const raw = localStorage.getItem(PREFIX + id)
    return raw ? (JSON.parse(raw) as LocalDraft<T>) : null
  }, null)
}

export function removeLocalDraft(id: string) {
  safe(() => {
    localStorage.removeItem(PREFIX + id)
    const index = new Set<string>(JSON.parse(localStorage.getItem(INDEX) ?? '[]'))
    index.delete(id)
    localStorage.setItem(INDEX, JSON.stringify([...index]))
  }, undefined)
}

/** Neue, noch nie auf dem Server gespeicherte Berichte (für „Wiederherstellen“). */
export function listUnsyncedNewDrafts<T>(): LocalDraft<T>[] {
  return safe(() => {
    const index: string[] = JSON.parse(localStorage.getItem(INDEX) ?? '[]')
    return index
      .map((id) => loadLocalDraft<T>(id))
      .filter((d): d is LocalDraft<T> => !!d && d.isNew)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  }, [])
}
