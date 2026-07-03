import { describe, it, expect } from 'vitest'
import { summarizeDataset } from './datasetSummary'
import type { DataRow, Territory } from '../domain/types'

const territories: Territory[] = [
  { territoryId: 'T1', territoryName: 'T1', areaId: 'A1', areaName: 'Area 1', regionId: 'R1', regionName: 'East' },
  { territoryId: 'T2', territoryName: 'T2', areaId: 'A1', areaName: 'Area 1', regionId: 'R1', regionName: 'East' },
  { territoryId: 'T3', territoryName: 'T3', areaId: 'A2', areaName: 'Area 2', regionId: 'R2', regionName: 'West' },
]
const mk = (id: string, value: number, area = 'A1', region = 'R1'): DataRow => ({
  territoryId: id, territoryName: id, areaId: area, areaName: area, regionId: region, regionName: region, value,
})

describe('summarizeDataset', () => {
  it('computes numeric stats and coverage', () => {
    const rows = [mk('T1', 100), mk('T2', 0), mk('GHOST', 50)]
    const s = summarizeDataset(rows, 'SalesUnits', territories)
    expect(s.total).toBe(3)
    expect(s.numeric.sum).toBe(150)
    expect(s.numeric.min).toBe(0)
    expect(s.numeric.max).toBe(100)
    expect(s.numeric.mean).toBeCloseTo(50, 6)
    expect(s.numeric.zeroCount).toBe(1)
    expect(s.unmatchedKeys).toEqual(['GHOST'])
    expect(s.missingTerritories).toEqual(['T3']) // T1,T2 present; GHOST not a territory
  })

  it('builds an MBO rating distribution across 1-5', () => {
    const rows = [mk('T1', 5), mk('T2', 5), mk('T3', 3, 'A2', 'R2')]
    const s = summarizeDataset(rows, 'MBORating', territories)
    const dist = Object.fromEntries(s.ratingDistribution!.map((b) => [b.rating, b.count]))
    expect(dist[5]).toBe(2)
    expect(dist[3]).toBe(1)
    expect(dist[1]).toBe(0)
  })
})
