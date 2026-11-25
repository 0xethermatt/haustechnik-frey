import { NextResponse, type NextRequest } from 'next/server'
import { getSessionContext } from '@/lib/ops/auth'
import { createClient } from '@/lib/ops/supabase/server'
import { loadTimesheets } from '@/lib/ops/data/timesheet'
import { buildTimesheetWorkbook, sheetName } from '@/lib/ops/exports/timesheet-xlsx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Excel-Download des Stundenzettels (nur Büro/Admin). Liest nur, verändert keine Daten. */
export async function GET(request: NextRequest) {
  const ctx = await getSessionContext()
  if (!ctx || !ctx.isOffice) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const month = request.nextUrl.searchParams.get('monat') ?? ''
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return NextResponse.json({ error: 'Ungültiger Monat' }, { status: 400 })
  const employeeId = request.nextUrl.searchParams.get('mitarbeiter') ?? undefined
  if (employeeId && !/^[0-9a-f-]{36}$/i.test(employeeId)) return NextResponse.json({ error: 'Ungültiger Mitarbeiter' }, { status: 400 })

  const sheets = await loadTimesheets(createClient(), month, employeeId)
  const buffer = await buildTimesheetWorkbook(month, sheets)
  const filename = `Stundenzettel_${sheetName(month)}.xlsx`
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'no-store',
    },
  })
}
