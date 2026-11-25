/**
 * Läuft nach `next build` (postbuild). Bricht den Build ab, wenn dem Stylesheet der Website
 * die Markenklassen fehlen oder das der Betriebsplattform verloren geht.
 * Hintergrund: Zwei Tailwind-Konfigurationen dürfen sich nie gegenseitig überschreiben.
 */
const fs = require('node:fs')
const path = require('node:path')

const dir = process.env.CSS_DIR || path.join(__dirname, '..', '.next', 'static', 'css')
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.css')) : []
const css = files.map((f) => ({ name: f, text: fs.readFileSync(path.join(dir, f), 'utf8') }))

const mustHave = [
  ['Website', ['.bg-brand-orange', '.text-brand-purple-deep', '.bg-brand-cream', '.text-white', '.rounded-full']],
  ['Betriebsplattform', ['--primary:', '--background:', '.bg-primary']],
]

let failed = false
for (const [label, needles] of mustHave) {
  const ok = css.some((file) => needles.every((n) => file.text.includes(n)))
  console.log(`${ok ? '✓' : '✗'} Stylesheet ${label}: ${ok ? 'vollständig' : 'FEHLT – ' + needles.join(', ')}`)
  if (!ok) failed = true
}
if (css.some((f) => f.text.includes('.bg-brand-orange') && f.text.includes('--primary:'))) {
  console.error('✗ Website und Betriebsplattform teilen sich ein Stylesheet – Konfigurationen vermischt.')
  failed = true
}
if (failed) {
  console.error('\nBuild abgebrochen: Stylesheet-Prüfung fehlgeschlagen (siehe PROJECT_SPEC.md, ADR-1).')
  process.exit(1)
}
