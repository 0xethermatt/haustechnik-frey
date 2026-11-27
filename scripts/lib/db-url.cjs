#!/usr/bin/env node
/**
 * Macht eine eingefügte Datenbank-Adresse lesbar: entfernt Leerzeichen/Zeilenumbrüche am Rand und
 * eckige Klammern um das Passwort („[YOUR-PASSWORD]“-Platzhalter) und kodiert Sonderzeichen im Passwort.
 * Gibt die Adresse nie im Klartext in Fehlermeldungen aus.
 */
function normalizeDbUrl(input) {
  const raw = String(input ?? '').trim()
  const m = /^(postgres(?:ql)?):\/\/([^:@/]+):([\s\S]*)@([^@/?#\s]+)(\/[^\s]*)?$/.exec(raw)
  if (!m) throw new Error('Die Datenbank-Adresse ist nicht lesbar. Erwartet: postgresql://BENUTZER:PASSWORT@HOST:5432/postgres')
  const [, scheme, user, rawPassword, host, path] = m
  let password = rawPassword.trim()
  if (password.startsWith('[') && password.endsWith(']')) password = password.slice(1, -1)
  if (!password) throw new Error('In der Datenbank-Adresse fehlt das Passwort.')
  const alreadyEncoded = /%[0-9A-Fa-f]{2}/.test(password)
  const result = `${scheme}://${user}:${alreadyEncoded ? password : encodeURIComponent(password)}@${host}${path || '/postgres'}`
  new URL(result) // wirft, wenn die Adresse trotzdem ungültig ist
  return result
}

module.exports = { normalizeDbUrl }

if (require.main === module) {
  try {
    process.stdout.write(normalizeDbUrl(process.argv[2] ?? process.env.DB_URL_INPUT))
  } catch (e) {
    process.stderr.write(`${e instanceof Error ? e.message : 'Adresse nicht lesbar.'}\n`)
    process.exit(1)
  }
}
