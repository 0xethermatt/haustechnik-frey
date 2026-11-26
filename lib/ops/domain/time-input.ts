/** Eingabehilfen für Uhrzeiten im 24-Stunden-Format (unabhängig von der Geräteeinstellung). */

/** Formatiert die Eingabe während des Tippens: nur Ziffern, Doppelpunkt automatisch. */
export function maskTimeInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  if (d.length < 3) return d
  const twoDigitHour = Number(d.slice(0, 2)) <= 23 && d[0] <= '2'
  return twoDigitHour ? `${d.slice(0, 2)}:${d.slice(2)}` : `${d[0]}:${d.slice(1)}`
}

/** Wandelt Eingaben wie „7“, „730“, „7:30“, „0730“ in „HH:MM“ um; ungültig → null. */
export function normalizeTime(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  if (d.length === 0 || d.length > 4) return null
  let h: number
  let m: number
  if (d.length <= 2) {
    h = Number(d)
    m = 0
  } else if (d.length === 3) {
    h = Number(d[0])
    m = Number(d.slice(1))
  } else {
    h = Number(d.slice(0, 2))
    m = Number(d.slice(2))
  }
  if (h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
