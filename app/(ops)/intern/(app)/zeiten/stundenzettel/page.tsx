import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { requireOffice } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadTimesheets } from '@/lib/ops/data/timesheet'
import { berlinToday, formatDate, formatMonth } from '@/lib/ops/domain/dates'
import { formatMinutes } from '@/lib/ops/domain/time'
import { PageBody, PageHeader } from '@/components/ops/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NativeSelect } from '@/components/ui/select'
import { cn, fullName } from '@/lib/ops/utils'
import { AbbreviationsEditor } from './abbreviations-editor'

export const metadata: Metadata = { title: 'Stundenzettel' }

const fmt = (m: number | null) => (m ? formatMinutes(m, false) : '')

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return d.toISOString().slice(0, 7)
}

export default async function TimesheetPage({ searchParams }: { searchParams: { monat?: string; mitarbeiter?: string } }) {
  await requireOffice()
  const supabase = createClient()
  const current = berlinToday().slice(0, 7)
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.monat ?? '') ? searchParams.monat! : current
  const employeeId = /^[0-9a-f-]{36}$/i.test(searchParams.mitarbeiter ?? '') ? searchParams.mitarbeiter : undefined

  const [sheets, allSheets, { data: abbreviations }, { data: cities }] = await Promise.all([
    loadTimesheets(supabase, month, employeeId),
    employeeId ? loadTimesheets(supabase, month) : Promise.resolve(null),
    supabase.from('place_abbreviations').select('city, abbreviation').order('city'),
    supabase.from('service_locations').select('city').is('archived_at', null).limit(2000),
  ])
  const employees = (allSheets ?? sheets).map((s) => s.employee)
  const citySuggestions = [...new Set((cities ?? []).map((c) => c.city))].sort((a, b) => a.localeCompare(b, 'de'))
  const link = (patch: { monat?: string; mitarbeiter?: string | null }) => {
    const p = new URLSearchParams({ monat: patch.monat ?? month })
    const emp = patch.mitarbeiter === null ? undefined : (patch.mitarbeiter ?? employeeId)
    if (emp) p.set('mitarbeiter', emp)
    return `/intern/zeiten/stundenzettel?${p}`
  }
  const exportHref = `/intern/zeiten/stundenzettel/export?monat=${month}${employeeId ? `&mitarbeiter=${employeeId}` : ''}`

  return (
    <>
      <PageHeader
        title="Stundenzettel"
        description={`${formatMonth(`${month}-01`)} · Aufbau wie der bisherige Excel-Stundenzettel`}
        back={{ href: '/intern/zeiten/uebersicht', label: 'Zeitübersicht' }}
        actions={
          <Button asChild>
            <a href={exportHref} download>
              <Download /> Excel herunterladen
            </a>
          </Button>
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="icon" aria-label="Vormonat">
            <Link href={link({ monat: shiftMonth(month, -1) })}>
              <ChevronLeft />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={link({ monat: current })}>Aktueller Monat</Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Nächster Monat">
            <Link href={link({ monat: shiftMonth(month, 1) })}>
              <ChevronRight />
            </Link>
          </Button>
          <form method="get" className="ml-auto flex gap-2">
            <input type="hidden" name="monat" value={month} />
            <div className="min-w-[12rem]">
              <NativeSelect name="mitarbeiter" defaultValue={employeeId ?? ''} aria-label="Mitarbeiter">
                <option value="">Alle Mitarbeiter</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {fullName(e)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" variant="secondary">
              Anzeigen
            </Button>
          </form>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {sheets.map((sheet) => (
            <Card key={sheet.employee.id} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {sheet.employee.last_name} {sheet.employee.first_name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Pers.-Nr. {sheet.employee.employee_number}</p>
                </div>
                <div className="text-right">
                  <div className="tabular text-lg font-semibold text-primary">{formatMinutes(sheet.totalMinutes)}</div>
                  <div className="text-xs text-muted-foreground">{sheet.workedDays} Arbeitstage</div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead>
                    <tr className="border-y bg-muted/60 text-left text-muted-foreground">
                      <th className="px-2 py-1.5 font-medium">Tag</th>
                      <th className="px-2 py-1.5 text-center font-medium">Beginn</th>
                      <th className="px-2 py-1.5 text-center font-medium">Pause</th>
                      <th className="px-2 py-1.5 text-center font-medium">Ende</th>
                      <th className="px-2 py-1.5 text-center font-medium">Dauer</th>
                      <th className="px-2 py-1.5 text-center font-medium">aufgez. am</th>
                      <th className="px-2 py-1.5 font-medium">Bemerkungen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.map((r) => (
                      <tr
                        key={r.date}
                        className={cn(
                          'border-b last:border-0',
                          r.weekday === 6 && 'bg-orange-500/10',
                          (r.weekday === 7 || r.holiday) && 'bg-sky-500/10',
                        )}
                      >
                        <td className={cn('whitespace-nowrap px-2 py-1', r.weekday >= 6 && 'font-semibold')}>
                          <Link href={`/intern/zeiten?mitarbeiter=${sheet.employee.id}&datum=${r.date}`} className="hover:underline">
                            {r.label}
                          </Link>
                        </td>
                        <td className="tabular px-2 py-1 text-center">{r.start ?? ''}</td>
                        <td className="tabular px-2 py-1 text-center">{r.breakMinutes ? fmt(r.breakMinutes) : ''}</td>
                        <td className="tabular px-2 py-1 text-center">{r.end ?? ''}</td>
                        <td className="tabular px-2 py-1 text-center font-medium">{fmt(r.durationMinutes)}</td>
                        <td className="tabular px-2 py-1 text-center text-muted-foreground">{r.recordedOn?.slice(0, 6) ?? ''}</td>
                        <td className={cn('px-2 py-1', r.isAbsence && 'font-medium text-destructive')}>{r.remarks.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ortskürzel für die Bemerkungen</CardTitle>
          </CardHeader>
          <CardContent>
            <AbbreviationsEditor items={abbreviations ?? []} suggestions={citySuggestions} />
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Stand {formatDate(berlinToday())}. Beginn, Pause und Ende stammen aus der Tageserfassung der Mitarbeiter,
          Bemerkungen aus Arbeitsberichten, Zeiteinträgen und Abwesenheiten.
        </p>
      </PageBody>
    </>
  )
}
