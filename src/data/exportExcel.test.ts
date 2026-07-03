import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { buildPayoutCalcSheet, buildSummarySheet } from './exportExcel'
import { calculatePayouts, summarize, type EngineData } from '../engine'
import { makeDefaultPlan } from './defaultPlan'
import { demoActuals, demoGoals, demoTerritories } from './demoData'

const plan = makeDefaultPlan()
const data: EngineData = {
  territories: demoTerritories,
  actuals: demoActuals,
  goals: demoGoals,
}
const result = calculatePayouts(plan, data)
const summary = summarize(result)

describe('buildPayoutCalcSheet', () => {
  const sheet = buildPayoutCalcSheet(result)

  it('has one header + one row per territory', () => {
    expect(sheet.rowCount).toBe(60)
    expect(sheet.aoa).toHaveLength(61)
  })

  it('includes attainment + payout columns for each metric, then totals', () => {
    const header = sheet.aoa[0]
    expect(header.slice(0, 6)).toEqual([
      'Territory ID',
      'Territory Name',
      'Area ID',
      'Area Name',
      'Region ID',
      'Region Name',
    ])
    expect(header).toContain('National Sales Payout %')
    expect(header).toContain('Total Payout %')
    expect(header).toContain('LOA Flag')
    expect(header).toContain('Eligibility %')
    expect(header.at(-2)).toBe('Pre-Eligibility $')
    expect(header.at(-1)).toBe('Final Payout $')
  })

  it('marks the correct percent and currency columns', () => {
    // 3 metrics -> pairs 6..11; Total% 12; LOA 13; Elig% 14; Eligible% 15; Pre$ 16; Final$ 17.
    expect(sheet.pctCols).toEqual([6, 7, 8, 9, 10, 11, 12, 14, 15])
    expect(sheet.usdCols).toEqual([16, 17])
  })

  it('first data row carries the first territory and its final dollars', () => {
    const row = sheet.aoa[1]
    const finalCol = sheet.usdCols[1]
    expect(row[0]).toBe(demoTerritories[0].territoryId)
    expect(typeof row[finalCol]).toBe('number')
    expect(row[finalCol]).toBeCloseTo(result.territories[0].totalPayoutDollars, 6)
  })
})

describe('buildSummarySheet', () => {
  const aoa = buildSummarySheet(plan, result, summary)
  const find = (label: string) => aoa.find((r) => r[0] === label)

  it('reports the plan, pool, and payout totals', () => {
    expect(find('Plan Name')?.[1]).toBe('RevMed IC Plan 2026')
    expect(find('Total Target Pool')?.[1]).toBe(summary.totalTargetPool)
    expect(find('Total Payout (post-eligibility)')?.[1]).toBeCloseTo(summary.totalPayout, 6)
  })

  it('includes By Region and By Area sections', () => {
    expect(aoa.some((r) => r[0] === 'By Region')).toBe(true)
    expect(aoa.some((r) => r[0] === 'By Area')).toBe(true)
  })
})

describe('workbook round-trip through SheetJS', () => {
  it('writes a 2-sheet workbook that reads back with the same data', () => {
    const calc = buildPayoutCalcSheet(result)
    const wsCalc = XLSX.utils.aoa_to_sheet(calc.aoa)
    const wsSummary = XLSX.utils.aoa_to_sheet(buildSummarySheet(plan, result, summary))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsCalc, 'Payout Calc')
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    const reread = XLSX.read(buf, { type: 'array' })

    expect(reread.SheetNames).toEqual(['Payout Calc', 'Summary'])
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      reread.Sheets['Payout Calc'],
    )
    expect(rows).toHaveLength(60)
    expect(rows[0]['Territory ID']).toBe(demoTerritories[0].territoryId)
  })
})
