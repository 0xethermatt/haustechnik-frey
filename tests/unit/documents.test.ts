import { describe, expect, it } from 'vitest'
import { MAX_DOCUMENT_BYTES, documentKind, fileExtension, formatBytes, storageExtension, validateDocumentFile } from '@/lib/ops/domain/documents'

describe('Dokumente', () => {
  it('erlaubt gängige Dateien aller Art', () => {
    for (const name of ['Angebot.pdf', 'Aufmaß Bad.xlsx', 'Plan.DWG', 'Lieferschein.jpg', 'notizen.txt', 'Heizlast.zip', 'datei ohne endung'])
      expect(validateDocumentFile({ name, size: 1000 })).toBeNull()
  })
  it('blockiert ausführbare und aktive Dateien', () => {
    for (const name of ['setup.exe', 'run.BAT', 'seite.html', 'bild.svg', 'x.js', 'script.sh'])
      expect(validateDocumentFile({ name, size: 1000 })).toMatch(/nicht erlaubt/)
  })
  it('prüft Größe und leere Dateien', () => {
    expect(validateDocumentFile({ name: 'a.pdf', size: 0 })).toMatch(/leer/)
    expect(validateDocumentFile({ name: 'a.pdf', size: MAX_DOCUMENT_BYTES + 1 })).toMatch(/zu groß/)
    expect(validateDocumentFile({ name: 'a.pdf', size: MAX_DOCUMENT_BYTES })).toBeNull()
  })
  it('Endungen, Speicherendung und Anzeige', () => {
    expect(fileExtension('Plan.Final.PDF')).toBe('pdf')
    expect(storageExtension('ohne')).toBe('bin')
    expect(storageExtension('a.pdf')).toBe('pdf')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5,0 MB')
    expect(documentKind('a.xlsx')).toBe('tabelle')
    expect(documentKind('a.pdf')).toBe('pdf')
    expect(documentKind('a.xyz')).toBe('datei')
  })
})
