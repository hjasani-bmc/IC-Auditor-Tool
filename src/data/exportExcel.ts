/**
 * Multi-sheet Excel export (Payout Calc + Summary). The AoA builders are pure
 * and unit-tested; SheetJS is imported dynamically inside `exportToExcel` so it
 * is code-split out of the initial bundle.
 */
import type { Plan } from '../domain/types'
import type { PayoutResult, Summary } from '../engine'
import { formatDate } from '../lib/dates'

const PCT = '0.0%'
const USD = '$#,##0'

type Cell = string | number

export interface PayoutCalcSheet {
  aoa: Cell[][]
  /** Column indices to format as percentages. */
  pctCols: number[]
  /** Column indices to format as currency. */
  usdCols: number[]
  /** Number of data rows (excludes header). */
  rowCount: number
}

export function buildPayoutCalcSheet(result: PayoutResult): PayoutCalcSheet {
  const metrics = result.territories[0]?.components ?? []
  const header: Cell[] = [
    'Territory ID',
    'Territory Name',
    'Area ID',
    'Area Name',
    'Region ID',
    'Region Name',
  ]
  metrics.forEach((m) => header.push(`${m.metricName} Attainment`, `${m.metricName} Payout %`))
  header.push(
    'Total Payout %',
    'LOA Flag',
    'Eligibility %',
    'Eligible Payout %',
    'Pre-Eligibility $',
    'Final Payout $',
  )

  const body = result.territories.map((t) => {
    const row: Cell[] = [
      t.territory.territoryId,
      t.territory.territoryName,
      t.territory.areaId,
      t.territory.areaName,
      t.territory.regionId,
      t.territory.regionName,
    ]
    t.components.forEach((c) => row.push(c.attainment ?? '', c.payoutFraction))
    row.push(
      t.totalPayoutFraction,
      t.loaFlag ? 'Y' : 'N',
      t.eligibilityFraction,
      t.eligiblePayoutFraction,
      t.preEligibilityDollars,
      t.totalPayoutDollars,
    )
    return row
  })

  const n = metrics.length
  const pctCols: number[] = []
  metrics.forEach((_, i) => pctCols.push(6 + i * 2, 7 + i * 2))
  const totalPctCol = 6 + n * 2 // Total Payout %
  const eligCol = totalPctCol + 2 // after LOA Flag
  const eligibleCol = totalPctCol + 3
  const preUsdCol = totalPctCol + 4
  const finalUsdCol = totalPctCol + 5
  pctCols.push(totalPctCol, eligCol, eligibleCol)

  return {
    aoa: [header, ...body],
    pctCols,
    usdCols: [preUsdCol, finalUsdCol],
    rowCount: body.length,
  }
}

export function buildSummarySheet(
  plan: Plan,
  result: PayoutResult,
  summary: Summary,
): Cell[][] {
  const s = summary
  return [
    ['Summary'],
    [],
    ['Plan Name', plan.name],
    ['Plan Period', `${formatDate(plan.startDate)} to ${formatDate(plan.endDate)}`],
    ['Duration (months)', plan.durationMonths],
    ['Reps (Territories)', s.stats.count],
    ['Target Incentive / Rep', result.proratedTI],
    ['Total Target Pool', s.totalTargetPool],
    ['Pre-Eligibility Total', s.totalPreEligibility],
    ['Reduced by Eligibility', s.dollarsReducedByEligibility],
    ['Total Payout (post-eligibility)', s.totalPayout],
    ['Territories on LOA', s.countOnLOA],
    ['Territories below 100% eligible', s.countBelowFullEligibility],
    ['Payout vs Target Pool', s.payoutVsPool],
    ['Average Payout %', s.stats.avg],
    ['Median Payout %', s.stats.median],
    ['Lowest Payout %', s.stats.min],
    ['Highest Payout %', s.stats.max],
    ['Reps >= 100% Payout', s.stats.countAtOrAbove100],
    ['Reps < 100% Payout', s.stats.countBelow100],
    [],
    ['Nation Attainment by Metric'],
    ...result.nationAttainmentByMetric.map(
      (m): Cell[] => [m.metricName, m.attainment === null ? 'n/a' : m.attainment],
    ),
    [],
    ['By Region'],
    ['Region', 'Territories', 'Total Payout $', 'Avg Payout %'],
    ...s.byRegion.map((g): Cell[] => [g.name, g.territoryCount, g.totalDollars, g.avgPayoutFraction]),
    [],
    ['By Area'],
    ['Area', 'Territories', 'Total Payout $', 'Avg Payout %'],
    ...s.byArea.map((g): Cell[] => [g.name, g.territoryCount, g.totalDollars, g.avgPayoutFraction]),
  ]
}

type XLSXModule = typeof import('xlsx')

function setFormat(
  XLSX: XLSXModule,
  ws: import('xlsx').WorkSheet,
  r: number,
  c: number,
  z: string,
): void {
  const cell = ws[XLSX.utils.encode_cell({ r, c })]
  if (cell && typeof cell.v === 'number') cell.z = z
}

export async function exportToExcel(
  plan: Plan,
  result: PayoutResult,
  summary: Summary,
): Promise<void> {
  const XLSX = await import('xlsx')

  // Payout Calc sheet.
  const calc = buildPayoutCalcSheet(result)
  const wsCalc = XLSX.utils.aoa_to_sheet(calc.aoa)
  for (let r = 1; r <= calc.rowCount; r++) {
    for (const c of calc.pctCols) setFormat(XLSX, wsCalc, r, c, PCT)
    for (const c of calc.usdCols) setFormat(XLSX, wsCalc, r, c, USD)
  }
  wsCalc['!cols'] = calc.aoa[0].map((h, i) =>
    i < 6 ? { wch: 16 } : { wch: Math.max(12, String(h).length + 2) },
  )

  // Summary sheet.
  const summaryAoa = buildSummarySheet(plan, result, summary)
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 14 }]
  // USD: Target Incentive/Rep, Total Pool, Pre-Eligibility, Reduced, Total Payout.
  for (let r = 6; r <= 10; r++) setFormat(XLSX, wsSummary, r, 1, USD)
  // PCT: Payout vs Pool, Average, Median, Lowest, Highest.
  for (let r = 13; r <= 17; r++) setFormat(XLSX, wsSummary, r, 1, PCT)
  summaryAoa.forEach((row, r) => {
    if (row[0] === 'Region' || row[0] === 'Area') {
      for (let rr = r + 1; rr < summaryAoa.length; rr++) {
        if (typeof summaryAoa[rr]?.[2] !== 'number') break
        setFormat(XLSX, wsSummary, rr, 2, USD)
        setFormat(XLSX, wsSummary, rr, 3, PCT)
      }
    }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsCalc, 'Payout Calc')
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  const safeName = plan.name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'IC Plan'
  XLSX.writeFile(wb, `${safeName} - IC Payout.xlsx`)
}
