import { describe, it, expect } from 'vitest'
import { averageRating, calculatePayouts, type EngineData } from './'
import type { DataRow, Plan, RatingMapConfig, Territory } from '../domain/types'

describe('averageRating', () => {
  it('rounds the mean to the nearest whole rating (0.5 rounds up)', () => {
    expect(averageRating([3, 4, 4])).toBe(4) // mean 3.667 -> 4
    expect(averageRating([2, 3])).toBe(3) // mean 2.5 -> 3
    expect(averageRating([1, 2])).toBe(2) // mean 1.5 -> 2
  })

  it('clamps into 1-5 and returns null for an empty set', () => {
    expect(averageRating([])).toBeNull()
    expect(averageRating([5, 5, 5])).toBe(5)
  })
})

const map: RatingMapConfig = { map: { 1: 0.4, 2: 0.6, 3: 0.8, 4: 1.0, 5: 1.25 } }

const territories: Territory[] = [
  { territoryId: 'T1', territoryName: 'T1', areaId: 'A1', areaName: 'Area 1', regionId: 'R', regionName: 'R' },
  { territoryId: 'T2', territoryName: 'T2', areaId: 'A1', areaName: 'Area 1', regionId: 'R', regionName: 'R' },
  { territoryId: 'T3', territoryName: 'T3', areaId: 'A1', areaName: 'Area 1', regionId: 'R', regionName: 'R' },
  { territoryId: 'T4', territoryName: 'T4', areaId: 'A2', areaName: 'Area 2', regionId: 'R', regionName: 'R' },
]
const mk = (id: string, area: string, value: number): DataRow => ({
  territoryId: id, territoryName: id, areaId: area, areaName: area, regionId: 'R', regionName: 'R', value,
})

function mboPlan(): Plan {
  return {
    name: 'mbo', startDate: '2026-01-01', endDate: '2026-12-31', durationMonths: 12,
    annualTargetIncentive: 60000,
    metrics: [
      { id: 'mbo', name: 'MBO', dataType: 'MBORating', level: 'Area', weight: 100, enabled: true, mechanism: 'RatingMap', ratingMap: map },
    ],
  }
}

describe('MBO roll-up at Area level', () => {
  it('averages the area ratings, rounds, maps once, and propagates to all', () => {
    // Area 1 ratings [3,4,4] -> mean 3.667 -> 4 -> map[4]=1.0
    const data: EngineData = {
      territories,
      actuals: { MBORating: [mk('T1', 'A1', 3), mk('T2', 'A1', 4), mk('T3', 'A1', 4)] },
      goals: {},
    }
    const res = calculatePayouts(mboPlan(), data)
    for (const id of ['T1', 'T2', 'T3']) {
      const c = res.territories.find((t) => t.territory.territoryId === id)!.components[0]
      expect(c.basisValue).toBe(4)
      expect(c.payoutFraction).toBe(1.0)
    }
  })

  it('excludes blank/missing ratings from the mean (not counted as zero)', () => {
    // Area 1 present ratings [4,4] (T3 missing) -> mean 4 -> map[4]=1.0, NOT (4+4+0)/3.
    const data: EngineData = {
      territories,
      actuals: { MBORating: [mk('T1', 'A1', 4), mk('T2', 'A1', 4)] }, // T3 absent
      goals: {},
    }
    const res = calculatePayouts(mboPlan(), data)
    const t3 = res.territories.find((t) => t.territory.territoryId === 'T3')!.components[0]
    expect(t3.basisValue).toBe(4) // not 3 (which (4+4+0)/3=2.67 -> 3 would give)
    expect(t3.payoutFraction).toBe(1.0)
  })

  it('yields zero payout for a group with no rated territories', () => {
    const data: EngineData = {
      territories,
      actuals: { MBORating: [mk('T1', 'A1', 4)] }, // A2 (T4) has none
      goals: {},
    }
    const res = calculatePayouts(mboPlan(), data)
    const t4 = res.territories.find((t) => t.territory.territoryId === 'T4')!.components[0]
    expect(t4.basisValue).toBeNull()
    expect(t4.payoutFraction).toBe(0)
  })
})
