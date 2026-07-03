import { describe, it, expect } from 'vitest'
import { calculatePayouts, type EngineData } from './calculate'
import { summarize } from './aggregate'
import { attainmentByGroup } from './attainment'
import type { CurveConfig, GridConfig, Metric, Plan } from '../domain/types'
// Use the original 61-territory workbook fixture so this stays a faithful
// regression check of the engine against the known $1,344,863 result,
// independent of the app's live demo seed.
import {
  sampleActuals as demoActuals,
  sampleGoals as demoGoals,
  sampleRows as demoRows,
  sampleTerritories as demoTerritories,
} from '../data/sampleFixture'

// The exact plan configured in the reference workbook:
// all components measured at Nation level, sales via a curve (slope 4,
// tier-3 0.3x, cap 250%), reach via a step grid capped at 100%.
const sampleCurve: CurveConfig = {
  excellenceAttainment: 1.25,
  cap: 2.5,
  tiers: [
    { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
    { fromAttainment: 1, toAttainment: 1.25, slope: 4, payoutAtFrom: 1 },
    { fromAttainment: 1.25, toAttainment: Infinity, slope: 0.3, payoutAtFrom: 2 },
  ],
}
const reachGrid: GridConfig = {
  cap: 1,
  bands: [
    { fromAttainment: 0, payout: 0 },
    { fromAttainment: 0.4, payout: 0.4 },
    { fromAttainment: 0.6, payout: 0.6 },
    { fromAttainment: 0.8, payout: 0.8 },
    { fromAttainment: 1, payout: 1 },
  ],
}

function metric(over: Partial<Metric> & Pick<Metric, 'id' | 'name'>): Metric {
  return {
    dataType: 'SalesUnits',
    level: 'Nation',
    weight: 0,
    enabled: true,
    mechanism: 'Curve',
    curve: sampleCurve,
    ...over,
  }
}

const samplePlan: Plan = {
  name: 'RevMed IC Plan 2026',
  startDate: '2026-08-01',
  endDate: '2026-12-31',
  durationMonths: 5,
  annualTargetIncentive: 60000,
  metrics: [
    metric({ id: 'nation', name: 'Nation', weight: 40 }),
    metric({ id: 'area', name: 'Area', weight: 30 }),
    metric({ id: 'individual', name: 'Individual', weight: 0 }),
    metric({
      id: 'reach',
      name: 'Target Reach',
      weight: 30,
      dataType: 'HCPReach',
      mechanism: 'Grid',
      grid: reachGrid,
      curve: undefined,
    }),
  ],
}

const data: EngineData = {
  territories: demoTerritories,
  actuals: demoActuals,
  goals: demoGoals,
}

describe('calculatePayouts — reproduces the reference workbook', () => {
  const result = calculatePayouts(samplePlan, data)
  const summary = summarize(result)

  it('pro-rates a 5-month plan to $25,000', () => {
    expect(result.proratedTI).toBe(25000)
  })

  it('computes Nation sales attainment of ~100.07%', () => {
    const salesAttain = result.nationAttainmentByMetric.find(
      (n) => n.metricId === 'nation',
    )!.attainment
    expect(salesAttain).toBeCloseTo(1.0006704, 6)
  })

  it('produces the headline total payout of $1,344,863', () => {
    expect(summary.totalPayout).toBeCloseTo(1344862.68, 1)
    expect(Math.round(summary.totalPayout)).toBe(1344863)
  })

  it('matches payout vs target pool of 88.2%', () => {
    expect(summary.totalTargetPool).toBe(25000 * 61)
    expect(summary.payoutVsPool).toBeCloseTo(0.881877, 5)
  })

  it('pays every rep the same ~$22,047 (all metrics at Nation level)', () => {
    for (const t of result.territories) {
      expect(t.totalPayoutDollars).toBeCloseTo(22046.93, 1)
    }
    expect(summary.stats.min).toBeCloseTo(summary.stats.max, 8)
    expect(summary.stats.countBelow100).toBe(61)
    expect(summary.stats.countAtOrAbove100).toBe(0)
  })

  it('exposes a full component breakdown per territory (auditability)', () => {
    const t = result.territories[0]
    expect(t.components).toHaveLength(4)
    const reach = t.components.find((c) => c.metricId === 'reach')!
    expect(reach.attainment).toBeCloseTo(0.7347424, 6)
    expect(reach.payoutFraction).toBe(0.6) // 60% grid band
    expect(reach.weightedContribution).toBeCloseTo(0.18, 10) // 0.30 * 0.60
  })
})

describe('attainment roll-up', () => {
  it('rolls Area attainment up as sum(actuals)/sum(goals)', () => {
    const byArea = attainmentByGroup(
      demoActuals.SalesUnits!,
      demoGoals.SalesUnits!,
      'Area',
    )
    const ar01 = demoRows.filter((r) => r.areaId === 'AR01')
    const credited = ar01.reduce((s, r) => s + r.creditedUnits, 0)
    const goal = ar01.reduce((s, r) => s + r.salesGoal, 0)
    expect(byArea.get('AR01')).toBeCloseTo(credited / goal, 10)
    expect(byArea.get('AR01')).toBeCloseTo(0.983, 2) // workbook: East 1 = 98.3%
  })

  it('assigns each territory its own attainment at Territory level', () => {
    const territoryPlan: Plan = {
      ...samplePlan,
      metrics: [metric({ id: 's', name: 'Sales', weight: 100, level: 'Territory' })],
    }
    const res = calculatePayouts(territoryPlan, data)
    const boston = res.territories.find(
      (t) => t.territory.territoryId === 'RS010407',
    )!
    // Boston N: credited 170.85 / goal 186 = 0.9185...
    expect(boston.components[0].attainment).toBeCloseTo(170.85 / 186, 8)
  })
})
