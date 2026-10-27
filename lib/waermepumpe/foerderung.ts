// KfW 458 „Heizungsförderung für Privatpersonen“ — Regeln seit 21.07.2026.
// Zeitplan für Klimageschwindigkeitsbonus und Kostendeckel der 1. Wohneinheit
// laut Neufassung der BEG EM. Bei Änderungen der Förderrichtlinie nur hier anpassen.

export const FOERDER_STAND = '21.07.2026'

export const GRUNDFOERDERUNG = 30

/** Nach der Förderzusage bleibt so viel Zeit für die Umsetzung – der Fördersatz gilt ab Antrag. */
export const UMSETZUNGSFRIST_MONATE = 36

export interface FoerderPeriode {
  ab: string
  klimaBonus: number
  kostenErsteWE: number
}

export const FOERDER_PERIODEN: FoerderPeriode[] = [
  { ab: '2026-07-21', klimaBonus: 16, kostenErsteWE: 28000 },
  { ab: '2027-02-01', klimaBonus: 12, kostenErsteWE: 27250 },
  { ab: '2027-08-01', klimaBonus: 8, kostenErsteWE: 26500 },
  { ab: '2028-02-01', klimaBonus: 4, kostenErsteWE: 25750 },
  { ab: '2028-08-01', klimaBonus: 0, kostenErsteWE: 25000 },
]

const KOSTEN_WE_2_BIS_6 = 15000
const KOSTEN_WE_AB_7 = 8000

export type Altanlage =
  | 'oel'
  | 'gas-alt'
  | 'gas-neu'
  | 'gasetage'
  | 'nachtspeicher'
  | 'kohle'
  | 'andere'

export const ALTANLAGE_LABELS: Record<Altanlage, string> = {
  oel: 'Ölheizung',
  'gas-alt': 'Gasheizung (20 Jahre oder älter)',
  'gas-neu': 'Gasheizung (jünger als 20 Jahre)',
  gasetage: 'Gasetagenheizung',
  nachtspeicher: 'Nachtspeicher',
  kohle: 'Kohle',
  andere: 'Andere / Neubau',
}

const KLIMABONUS_ANLAGEN: Altanlage[] = ['oel', 'gas-alt', 'gasetage', 'nachtspeicher', 'kohle']

export type Einkommen = 'bis30' | 'bis40' | 'bis50' | 'bis60' | 'ueber60' | 'keineAngabe'

export const EINKOMMEN_LABELS: Record<Einkommen, string> = {
  bis30: 'bis 30.000 €',
  bis40: '30.001 – 40.000 €',
  bis50: '40.001 – 50.000 €',
  bis60: '50.001 – 60.000 €',
  ueber60: 'über 60.000 €',
  keineAngabe: 'Keine Angabe',
}

const EINKOMMEN_STUFEN: Einkommen[] = ['bis30', 'bis40', 'bis50', 'bis60', 'ueber60']

const EINKOMMENSBONUS: Record<Einkommen, number> = {
  bis30: 40,
  bis40: 30,
  bis50: 10,
  bis60: 0,
  ueber60: 0,
  keineAngabe: 0,
}

export interface FoerderInput {
  investition: number
  wohneinheiten: number
  selbstnutzer: boolean
  altanlage: Altanlage
  einkommen: Einkommen
  kindImHaushalt: boolean
  datum?: Date
}

export interface FoerderErgebnis {
  periode: FoerderPeriode
  grund: number
  klima: number
  einkommen: number
  summe: number
  deckel: number
  satzSelbstgenutzt: number
  foerderfaehig: number
  zuschuss: number
  eigenanteil: number
  effektiverSatz: number
  klimaBerechtigt: boolean
  einkommenEffektiv: Einkommen
  steuerjahre: [number, number]
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function getPeriode(datum: Date = new Date()): FoerderPeriode {
  const iso = toIsoDate(datum)
  let current = FOERDER_PERIODEN[0]
  for (const p of FOERDER_PERIODEN) {
    if (p.ab <= iso) current = p
  }
  return current
}

export function getNaechstePeriode(datum: Date = new Date()): FoerderPeriode | null {
  const iso = toIsoDate(datum)
  return FOERDER_PERIODEN.find((p) => p.ab > iso) ?? null
}

export function tageBis(isoDate: string, von: Date = new Date()): number {
  const ziel = new Date(isoDate + 'T00:00:00')
  return Math.max(Math.ceil((ziel.getTime() - von.getTime()) / 86_400_000), 0)
}

export function formatDatum(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}.${m}.${y}`
}

/** Letzter Tag vor Beginn der nächsten Periode, z. B. „31.01.2027“. */
export function letzterTagVor(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  return formatDatum(toIsoDate(d))
}

export function foerderfaehigeKosten(wohneinheiten: number, periode: FoerderPeriode): number {
  const we = Math.max(1, Math.round(wohneinheiten))
  const zweiBisSechs = Math.min(Math.max(we - 1, 0), 5)
  const abSieben = Math.max(we - 6, 0)
  return periode.kostenErsteWE + zweiBisSechs * KOSTEN_WE_2_BIS_6 + abSieben * KOSTEN_WE_AB_7
}

/** Familienzuschlag: mit minderjährigem Kind sinkt das anzurechnende zvE einmalig um 10.000 €. */
function effektivesEinkommen(einkommen: Einkommen, kind: boolean): Einkommen {
  if (!kind || einkommen === 'keineAngabe') return einkommen
  const idx = EINKOMMEN_STUFEN.indexOf(einkommen)
  return EINKOMMEN_STUFEN[Math.max(idx - 1, 0)]
}

export function berechneFoerderung(input: FoerderInput): FoerderErgebnis {
  const datum = input.datum ?? new Date()
  const periode = getPeriode(datum)

  const klimaBerechtigt = input.selbstnutzer && KLIMABONUS_ANLAGEN.includes(input.altanlage)
  const einkommenEffektiv = effektivesEinkommen(input.einkommen, input.kindImHaushalt)

  const grund = GRUNDFOERDERUNG
  const klima = klimaBerechtigt ? periode.klimaBonus : 0
  const einkommen = input.selbstnutzer ? EINKOMMENSBONUS[einkommenEffektiv] : 0
  const summe = grund + klima + einkommen
  const deckel = input.selbstnutzer && einkommenEffektiv === 'bis30' ? 80 : 70
  const satzSelbstgenutzt = Math.min(summe, deckel)

  // Boni gelten nur für die selbst genutzte Wohneinheit, alle weiteren erhalten die Grundförderung.
  const foerderfaehig = Math.min(input.investition, foerderfaehigeKosten(input.wohneinheiten, periode))
  const anteilErsteWE = Math.min(foerderfaehig, periode.kostenErsteWE)
  const anteilRest = foerderfaehig - anteilErsteWE
  const satzErsteWE = input.selbstnutzer ? satzSelbstgenutzt : grund

  const zuschuss = Math.round((anteilErsteWE * satzErsteWE + anteilRest * grund) / 100)
  const eigenanteil = Math.max(input.investition - zuschuss, 0)
  const effektiverSatz = input.investition > 0 ? Math.round((zuschuss / input.investition) * 100) : 0

  const jahr = datum.getFullYear()

  return {
    periode,
    grund,
    klima,
    einkommen,
    summe,
    deckel,
    satzSelbstgenutzt: input.selbstnutzer ? satzSelbstgenutzt : grund,
    foerderfaehig,
    zuschuss,
    eigenanteil,
    effektiverSatz,
    klimaBerechtigt,
    einkommenEffektiv,
    steuerjahre: [jahr - 3, jahr - 2],
  }
}

export function formatEuro(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'
}
