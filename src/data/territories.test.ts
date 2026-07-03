import { describe, it, expect } from 'vitest'
import { deriveTerritories } from './territories'
import type { DataRow } from '../domain/types'

const mk = (id: string, area = 'AR01'): DataRow => ({
  territoryId: id,
  territoryName: `Name ${id}`,
  areaId: area,
  areaName: 'East 1',
  regionId: 'RGN-E',
  regionName: 'East',
  value: 1,
})

describe('deriveTerritories', () => {
  it('unions territories across datasets without duplicates', () => {
    const t = deriveTerritories(
      { SalesUnits: [mk('A'), mk('B')], HCPReach: [mk('B'), mk('C')] },
      { SalesUnits: [mk('A'), mk('D')] },
    )
    expect(t.map((x) => x.territoryId)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('prefers Sales Units actuals order', () => {
    const t = deriveTerritories(
      { HCPReach: [mk('Z')], SalesUnits: [mk('A'), mk('Z')] },
      {},
    )
    expect(t.map((x) => x.territoryId)).toEqual(['A', 'Z'])
  })
})
