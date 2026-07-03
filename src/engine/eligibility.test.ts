import { describe, it, expect } from 'vitest'
import { calculatePayouts, type EngineData } from './'
import type { DataRow, GridConfig, Plan, Territory } from '../domain/types'

const territories: Territory[] = [
  { territoryId: 'T1', territoryName: 'T1', areaId: 'A1', areaName: 'A1', regionId: 'R', regionName: 'R' },
  { territoryId: 'T2', territoryName: 'T2', areaId: 'A1', areaName: 'A1', regionId: 'R', regionName: 'R' },
  { territoryId: 'T3', territoryName: 'T3', areaId: 'A1', areaName: 'A1', regionId: 'R', regionName: 'R' },
]
const mk = (id: string, v: number): DataRow => ({
  territoryId: id, territoryName: id, areaId: 'A1', areaName: 'A1', regionId: 'R', regionName: 'R', value: v,
})
// Grid: attainment >= 100% -> 100% payout. All territories at goal -> 100%.
const grid: GridConfig = { cap: 1, bands: [{ fromAttainment: 0, payout: 0 }, { fromAttainment: 1, payout: 1 }] }

const plan: Plan = {
  name: 'p', startDate: '2026-01-01', endDate: '2026-12-31', durationMonths: 12,
  annualTargetIncentive: 60000, // proratedTI = 60000
  metrics: [
    { id: 's', name: 'Sales', dataType: 'SalesUnits', level: 'Territory', weight: 100, enabled: true, mechanism: 'Grid', grid },
  ],
}
const base: Omit<EngineData, 'eligibility'> = {
  territories,
  actuals: { SalesUnits: [mk('T1', 100), mk('T2', 100), mk('T3', 100)] },
  goals: { SalesUnits: [mk('T1', 100), mk('T2', 100), mk('T3', 100)] },
}

const find = (res: ReturnType<typeof calculatePayouts>, id: string) =>
  res.territories.find((t) => t.territory.territoryId === id)!

describe('eligibility applied as the final factor', () => {
  it('100% leaves payout unchanged; 50% halves; 0% yields $0', () => {
    const res = calculatePayouts(plan, {
      ...base,
      eligibility: {
        T1: { loa: false, eligibility: 1 },
        T2: { loa: false, eligibility: 0.5 },
        T3: { loa: true, eligibility: 0 },
      },
    })
    // Each territory's pre-eligibility payout is 100% * 60000 = 60000.
    expect(find(res, 'T1').preEligibilityDollars).toBeCloseTo(60000, 6)
    expect(find(res, 'T1').totalPayoutDollars).toBeCloseTo(60000, 6)
    expect(find(res, 'T2').totalPayoutDollars).toBeCloseTo(30000, 6)
    expect(find(res, 'T3').totalPayoutDollars).toBe(0)
    // Upstream totalPayoutFraction unchanged by eligibility.
    expect(find(res, 'T2').totalPayoutFraction).toBeCloseTo(1, 6)
    expect(find(res, 'T2').eligiblePayoutFraction).toBeCloseTo(0.5, 6)
    expect(find(res, 'T3').loaFlag).toBe(true)
  })

  it('defaults a territory missing from the eligibility file to 100% and flags it', () => {
    const res = calculatePayouts(plan, {
      ...base,
      eligibility: { T1: { loa: false, eligibility: 0.5 } }, // T2, T3 missing
    })
    expect(find(res, 'T1').eligibilityDefaulted).toBe(false)
    expect(find(res, 'T2').eligibilityDefaulted).toBe(true)
    expect(find(res, 'T2').eligibilityFraction).toBe(1)
    expect(find(res, 'T2').totalPayoutDollars).toBeCloseTo(60000, 6)
  })

  it('clamps eligibility above 100% down to 100% (never amplifies payout)', () => {
    const res = calculatePayouts(plan, {
      ...base,
      eligibility: { T1: { loa: false, eligibility: 1.2 } },
    })
    expect(find(res, 'T1').eligibilityFraction).toBe(1)
    expect(find(res, 'T1').totalPayoutDollars).toBeCloseTo(60000, 6) // not 72000
  })

  it('with no eligibility data, every territory is full (100%)', () => {
    const res = calculatePayouts(plan, base)
    for (const t of res.territories) {
      expect(t.eligibilityFraction).toBe(1)
      expect(t.totalPayoutDollars).toBeCloseTo(60000, 6)
    }
  })
})
