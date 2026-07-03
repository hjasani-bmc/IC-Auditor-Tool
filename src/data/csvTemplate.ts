/**
 * Per-dataset CSV templates: a header row whose columns exactly match what the
 * importer/validator expects, plus a few sample rows. Users download, fill in,
 * and re-upload without column-mismatch errors.
 */
import type { DatasetDescriptor } from './datasets'
import { HIERARCHY_COLUMNS } from './datasets'

const HIERARCHY_HEADERS = HIERARCHY_COLUMNS.map((c) => c.aliases[0])

const SAMPLE_TERRITORIES = [
  ['T0001', 'Boston N, MA', 'AR01', 'East 1', 'RGN-E', 'East'],
  ['T0002', 'Denver, CO', 'AR05', 'West 1', 'RGN-W', 'West'],
  ['T0003', 'Dallas, TX', 'AR07', 'West 3', 'RGN-W', 'West'],
]

/** Example value per dataset for the sample rows. */
function sampleValues(d: DatasetDescriptor): (string | number)[] {
  if (d.kind === 'goals') return [150, 130, 175]
  switch (d.dataType) {
    case 'HCPReach':
      return [85, 60, 110]
    case 'MBORating':
      return [4, 3, 5]
    default:
      return [150, 95, 210]
  }
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

/** Standard per-territory template (hierarchy + the dataset's value column). */
export function buildDatasetTemplate(d: DatasetDescriptor): string {
  const valueHeader = d.valueAliases[0]
  const header = [...HIERARCHY_HEADERS, valueHeader]
  const values = sampleValues(d)
  const rows = SAMPLE_TERRITORIES.map((t, i) => [...t, values[i]])
  return toCsv([header, ...rows])
}

/** Account-level credited-sales template (credited_territory + final_credited_units). */
export function buildCreditedTemplate(): string {
  const header = ['credited_territory', 'territory_name', 'final_credited_units']
  const rows = [
    ['T0001', 'Boston N, MA', 1200],
    ['T0001', 'Boston N, MA', 380.5],
    ['T0002', 'Denver, CO', 940],
  ]
  return toCsv([header, ...rows])
}

/** Eligibility / LOA template (territory key + LOA flag + eligibility %). */
export function buildEligibilityTemplate(): string {
  const header = ['Territory ID', 'LOA Flag', 'Eligibility %']
  const rows = [
    ['T0001', 'N', 100],
    ['T0002', 'Y', 50],
    ['T0003', 'N', 0],
  ]
  return toCsv([header, ...rows])
}

/** Trigger a client-side download of CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
