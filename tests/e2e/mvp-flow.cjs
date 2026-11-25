/**
 * End-to-End-Prüfung der MVP-Abnahmekriterien gegen den lokalen Supabase-Stack.
 * Voraussetzungen: `npx supabase start && npx supabase db reset`, `npm run build && npm start`.
 * Aufruf: node tests/e2e/mvp-flow.cjs [screenshot-ordner]
 */
const { chromium, devices } = require('playwright')
const { execSync } = require('node:child_process')

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'
const DB = process.env.E2E_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const PASSWORD = 'Frey-Demo-2026!'
const shots = process.argv[2]

const sql = (q) => execSync(`psql "${DB}" -At -c "${q.replace(/"/g, '\\"')}"`).toString().trim()
const assert = (cond, msg) => {
  if (!cond) throw new Error(`✗ ${msg}`)
  console.log(`✓ ${msg}`)
}

async function login(page, email) {
  await page.goto(`${BASE}/intern/login`)
  await page.getByLabel('E-Mail').fill(email)
  await page.getByLabel('Passwort').fill(PASSWORD)
  await page.getByRole('button', { name: 'Anmelden' }).click()
  await page.waitForURL(`${BASE}/intern`)
}

async function shot(page, name) {
  if (shots) await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true })
}

;(async () => {
  const browser = await chromium.launch()

  // ---------- Mitarbeiter (Smartphone) ----------
  const mobile = await browser.newContext({ ...devices['iPhone 13'], locale: 'de-DE', timezoneId: 'Europe/Berlin' })
  const m = await mobile.newPage()
  await m.goto(`${BASE}/intern/berichte`)
  assert(m.url().startsWith(`${BASE}/intern/login`), 'Nicht angemeldete Benutzer werden zum Login umgeleitet')
  await login(m, 'jonas.keller@frey-demo.test')
  assert(await m.getByRole('link', { name: 'Neuer Arbeitsbericht' }).first().isVisible(), '1. Mitarbeiter ist angemeldet')
  await shot(m, '01-mitarbeiter-heute')

  await m.goto(`${BASE}/intern/berichte/neu`)
  await m.getByRole('button', { name: 'Kunde oder Auftrag wählen' }).click()
  await m.getByRole('button', { name: /Neuer Auftrag/ }).click()
  await m.getByLabel('Kunden suchen').fill('Weber')
  await m.waitForTimeout(800)
  await m.getByRole('button', { name: 'Neuen Kunden anlegen' }).click()
  await m.getByLabel('Vorname').fill('Monika')
  await m.getByLabel('Nachname').fill('Weber')
  await m.getByLabel('PLZ').fill('89143')
  await m.getByText('Diesen Kunden gibt es möglicherweise schon').waitFor({ timeout: 5000 })
  assert(true, '2. Dublettenprüfung erkennt bestehenden Kunden (ohne Vollzugriff)')
  await shot(m, '02-dublette')
  await m.getByRole('button', { name: /Monika Weber/ }).click()
  await m.getByLabel('Was ist zu tun?').fill('Wasserhahn austauschen Bad')
  await m.getByRole('button', { name: 'Reparatur' }).click()
  await m.getByRole('button', { name: 'Auftrag anlegen und auswählen' }).click()
  await m.getByText('Wasserhahn austauschen Bad').first().waitFor()
  assert(true, '3. Auftrag für Bestandskunden angelegt und ausgewählt')

  await m.getByLabel('Arbeit 1').fill('Alten Wasserhahn demontiert')
  await m.getByLabel('Arbeit 1').press('Enter')
  await m.getByLabel('Arbeit 2').fill('Neuen Einhebelmischer montiert')
  await m.getByRole('button', { name: '+ Dichtheitsprüfung durchgeführt' }).click()
  assert((await m.getByLabel(/^Arbeit \d/).count()) === 3, '4. Mehrere Arbeiten erfasst')

  await m.getByRole('button', { name: 'Material hinzufügen' }).click()
  await m.getByLabel('Bezeichnung Material 1').fill('Einhebelmischer')
  await m.getByRole('button', { name: 'Material hinzufügen' }).click()
  await m.getByLabel('Menge Material 2').fill('2')
  await m.getByLabel('Bezeichnung Material 2').fill('Flexschlauch 3/8"')
  assert(true, '5. Materialpositionen erfasst')

  await m.getByRole('button', { name: '2 h', exact: true }).first().click()
  await m.getByRole('button', { name: 'Mitarbeiter hinzufügen' }).click()
  await m.getByRole('button', { name: /Lena Schmid/ }).click()
  await m.getByRole('button', { name: '15 Minuten weniger' }).nth(1).click()
  assert(true, '6./7. Teilnehmer mit individuellen Stunden erfasst')
  await shot(m, '03-bericht-formular')

  await m.getByRole('button', { name: 'Speichern', exact: true }).click()
  await m.waitForURL(/berichte\/[0-9a-f-]{36}\/bearbeiten/)
  await m.getByText(/Gespeichert|Entwurf/).first().waitFor()
  const reportId = m.url().match(/berichte\/([0-9a-f-]{36})/)[1]
  const count1 = sql(`select count(*) from work_report_time_entries where work_report_id = '${reportId}'`)
  assert(count1 === '2', 'Entwurf gespeichert: 2 Zeiteinträge')
  const ids1 = sql(`select string_agg(time_entry_id::text, ',' order by time_entry_id) from work_report_time_entries where work_report_id = '${reportId}'`)

  await m.getByRole('button', { name: '15 Minuten mehr' }).first().click()
  await m.getByRole('button', { name: 'Speichern', exact: true }).click()
  await m.waitForTimeout(1500)
  await m.getByRole('button', { name: 'Einreichen' }).click()
  await m.waitForURL(new RegExp(`/intern/berichte/${reportId}$`))
  assert(await m.getByText('Eingereicht').first().isVisible(), '8. Bericht eingereicht')
  await shot(m, '04-bericht-eingereicht')

  const ids2 = sql(`select string_agg(time_entry_id::text, ',' order by time_entry_id) from work_report_time_entries where work_report_id = '${reportId}'`)
  const minutes = sql(`select string_agg(t.duration_minutes::text, ',' order by t.duration_minutes) from time_entries t join work_report_time_entries l on l.time_entry_id = t.id where l.work_report_id = '${reportId}'`)
  assert(ids1 === ids2, 'Bearbeiten + Einreichen: dieselben Zeiteinträge (keine Duplikate)')
  assert(minutes === '105,135', 'Arbeitszeiten korrekt: 1:45 h und 2:15 h')

  // Arbeitstag mit einem Tipp (vorausgefüllt mit den üblichen Zeiten)
  await m.goto(`${BASE}/intern`)
  const saveDay = m.getByRole('button', { name: /^\d{2}:\d{2}–\d{2}:\d{2} speichern$/ })
  if (await saveDay.count()) {
    await saveDay.click()
    await m.getByText('Arbeitszeit gespeichert').waitFor()
    const wd = sql(`select start_time || '-' || end_time from work_days w join employees e on e.id = w.employee_id where e.employee_number = '103' and work_date = (now() at time zone 'Europe/Berlin')::date`)
    assert(/^07:30:00-(16|13):(00|30):00$/.test(wd), `Arbeitstag mit einem Tipp gespeichert (${wd})`)
  }
  await m.goto(`${BASE}/intern/zeiten`)
  await shot(m, '05-meine-zeiten')

  // ---------- Büro (Desktop) ----------
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE', timezoneId: 'Europe/Berlin' })
  const d = await desktop.newPage()
  await login(d, 'sabine.frey@frey-demo.test')
  await d.getByText('Warten auf Freigabe').waitFor()
  assert(true, 'Büro sieht Dashboard')
  await shot(d, '06-buero-dashboard')

  await d.goto(`${BASE}/intern/kalender`)
  await d.getByText('Wasserhahn austauschen Bad').first().waitFor()
  assert(true, 'Office 2. Bericht im Kalender auffindbar')
  await shot(d, '07-kalender-woche')

  await d.goto(`${BASE}/intern/berichte/${reportId}`)
  await d.getByText('Neuen Einhebelmischer montiert').waitFor()
  assert(true, 'Office 3. Tätigkeiten sichtbar')
  assert(await d.getByText('Flexschlauch 3/8"').isVisible(), 'Office 3. Material sichtbar')
  assert(await d.getByText('Lena Schmid').first().isVisible(), 'Office 3. Arbeitszeiten sichtbar')
  await d.getByRole('button', { name: 'Freigeben' }).click()
  await d.getByText('Freigegeben').first().waitFor()
  assert(sql(`select status from work_reports where id = '${reportId}'`) === 'freigegeben', 'Office 4. Bericht freigegeben')

  // Korrektur eines freigegebenen Berichts – nachvollziehbar, ohne Duplikate
  await d.goto(`${BASE}/intern/berichte/${reportId}/bearbeiten`)
  await d.getByRole('button', { name: '15 Minuten weniger' }).nth(1).click()
  await d.getByPlaceholder('Warum wird der freigegebene Bericht geändert?').fill('Azubi früher in Berufsschule')
  await d.getByRole('button', { name: 'Änderungen speichern' }).click()
  await d.getByText(/Gespeichert/).first().waitFor()
  const ids3 = sql(`select string_agg(time_entry_id::text, ',' order by time_entry_id) from work_report_time_entries where work_report_id = '${reportId}'`)
  assert(ids3 === ids1, 'Korrektur nach Freigabe: weiterhin dieselben Zeiteinträge')
  assert(
    sql(`select count(*) from audit_logs where reason = 'Azubi früher in Berufsschule' and table_name = 'time_entries'`) === '1',
    'Korrektur mit Begründung im Audit-Log',
  )
  await d.goto(`${BASE}/intern/berichte/${reportId}`)
  await d.getByText(/Arbeitszeit Lena Schmid: 1:45 h → 1:30 h/).waitFor()
  assert(true, 'Korrekturverlauf im Bericht sichtbar')
  await shot(d, '08-bericht-verlauf')

  await d.goto(`${BASE}/intern/zeiten/uebersicht`)
  await d.getByRole('cell', { name: /Jonas Keller/ }).waitFor()
  assert(true, 'Office 5. Tagesübersicht Mitarbeiterzeiten')
  await shot(d, '09-zeituebersicht-woche')
  await d.goto(`${BASE}/intern/zeiten/uebersicht?ansicht=monat`)
  await d.getByText(/KW \d+/).first().waitFor()
  assert(true, 'Office 5. Monatsübersicht Mitarbeiterzeiten')

  // Stundenzettel wie die bisherige Excel-Tabelle + Download
  await d.goto(`${BASE}/intern/zeiten/stundenzettel`)
  await d.getByRole('cell', { name: /Weber/ }).first().waitFor()
  assert(true, 'Stundenzettel zeigt Orte aus den Berichten (z. B. „Weber …“)')
  await shot(d, '11-stundenzettel')
  const [download] = await Promise.all([d.waitForEvent('download'), d.getByRole('link', { name: 'Excel herunterladen' }).click()])
  const file = await download.path()
  const size = require('node:fs').statSync(file).size
  assert(/^Stundenzettel_.+\.xlsx$/.test(download.suggestedFilename()) && size > 5000, `Excel-Download (${download.suggestedFilename()}, ${size} Bytes)`)
  if (shots) await download.saveAs(`${shots}/${download.suggestedFilename()}`)

  await d.goto(`${BASE}/intern/auftraege?status=abrechnungsbereit`)
  await d.getByText('Heizungswartung Gasbrennwert').waitFor()
  assert(true, 'Office 6. Abrechnungsbereite Aufträge erkennbar')

  // Rollen-Grenzen in der Oberfläche
  await m.goto(`${BASE}/intern/benutzer`)
  await m.waitForLoadState('networkidle')
  assert(m.url() === `${BASE}/intern`, 'Mitarbeiter wird von Admin-Seite umgeleitet')
  await m.goto(`${BASE}/intern/zeiten/uebersicht`)
  await m.waitForLoadState('networkidle')
  assert(m.url() === `${BASE}/intern`, 'Mitarbeiter wird von Zeitübersicht umgeleitet')
  const res = await m.request.get(`${BASE}/intern/zeiten/stundenzettel/export?monat=2026-10`)
  assert(res.status() === 403, 'Mitarbeiter kann den Excel-Export nicht abrufen')

  // Dunkelmodus
  const dark = await browser.newContext({ ...devices['iPhone 13'], colorScheme: 'dark', locale: 'de-DE', timezoneId: 'Europe/Berlin' })
  const k = await dark.newPage()
  await login(k, 'jonas.keller@frey-demo.test')
  await k.goto(`${BASE}/intern/berichte/neu`)
  await shot(k, '10-dunkel-bericht')

  await browser.close()
  console.log('\nAlle MVP-Prüfungen bestanden.')
})().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
