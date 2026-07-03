import { describe, it, expect } from 'vitest'
import { calculatePayouts, type EngineData } from './calculate'
import type { CurveConfig, DataRow, GridConfig, Plan, Territory } from '../domain/types'

// Two areas, two territories each. Nation and Area attainment differ, so a
// Nation-curve metric and an Area-grid metric must compute from different rolls.
const territories: Territory[] = [
  { territoryId: 'T1', territoryName: 'T1', areaId: 'A1', areaName: 'Area 1', regionId: 'R', regionName: 'R' },
  { territoryId: 'T2', territoryName: 'T2', areaId: 'A1', areaName: 'Area 1', regionId: 'R', regionName: 'R' },
  { territoryId: 'T3', territoryName: 'T3', areaId: 'A2', areaName: 'Area 2', regionId: 'R', regionName: 'R' },
  { territoryId: 'T4', territoryName: 'T4', areaId: 'A2', areaName: 'Area 2', regionId: 'R', regionName: 'R' },
]
const mk = (id: string, area: string, value: number): DataRow => ({
  territoryId: id,
  territoryName: id,
  areaId: area,
  areaName: area,
  regionId: 'R',
  regionName: 'R',
  value,
})

const actuals = [mk('T1', 'A1', 120), mk('T2', 'A1', 80), mk('T3', 'A2', 60), mk('T4', 'A2', 140)]
const goals = [mk('T1', 'A1', 100), mk('T2', 'A1', 100), mk('T3', 'A2', 100), mk('T4', 'A2', 100)]
// Nation attainment = 400/400 = 100%. Area A1 = 200/200 = 100%. Area A2 = 200/200 = 100%.

const curve: CurveConfig = {
  excellenceAttainment: 1.25,
  cap: 2.5,
  tiers: [
    { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
    { fromAttainment: 1, toAttainment: Infinity, slope: 4, payoutAtFrom: 1 },
  ],
}
const grid: GridConfig = {
  cap: 1,
  bands: [
    { fromAttainment: 0, payout: 0 },
    { fromAttainment: 1, payout: 1 },
  ],
}

const data: EngineData = {
  territories,
  actuals: { SalesUnits: actuals },
  goals: { SalesUnits: goals },
}

describe('per-level mechanism dispatch', () => {
  it('computes Nation=Curve and Area=Grid in the same plan', () => {
    const plan: Plan = {
      name: 'mixed',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      durationMonths: 12,
      annualTargetIncentive: 60000,
      metrics: [
        {
          id: 'nation',
          name: 'Nation Sales',
          dataType: 'SalesUnits',
          level: 'Nation',
          weight: 50,
          enabled: true,
          mechanism: 'Curve',
          curve,
        },
        {
          id: 'area',
          name: 'Area Sales',
          dataType: 'SalesUnits',
          level: 'Area',
          weight: 50,
          enabled: true,
          mechanism: 'Grid',
          grid,
        },
      ],
    }
    const result = calculatePayouts(plan, data)
    const t1 = result.territories.find((t) => t.territory.territoryId === 'T1')!
    const nation = t1.components.find((c) => c.metricId === 'nation')!
    const area = t1.components.find((c) => c.metricId === 'area')!

    expect(nation.mechanism).toBe('Curve')
    expect(nation.attainment).toBeCloseTo(1.0, 10) // 400/400
    expect(nation.payoutFraction).toBeCloseTo(1.0, 10) // curve at 100%

    expect(area.mechanism).toBe('Grid')
    expect(area.attainment).toBeCloseTo(1.0, 10) // A1 = 200/200
    expect(area.payoutFraction).toBe(1) // grid band at 100%

    // Blended: 0.5*1.0 + 0.5*1.0 = 1.0
    expect(t1.totalPayoutFraction).toBeCloseTo(1.0, 10)
  })
})
