import { describe, it, expect } from 'vitest'
import {
  aggregateCreditedSales,
  isCreditedSalesFormat,
  joinCreditedSales,
} from './creditedSales'
import type { Territory } from '../domain/types'

const territories: Territory[] = [
  { territoryId: 'RS010407', territoryName: 'Boston N, MA', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East' },
  { territoryId: 'RS020204', territoryName: 'Boston S, MA', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East' },
  { territoryId: 'A9001', territoryName: 'Charleston, SC', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East' },
]

const headers = ['credited_territory', 'final_credited_units']

describe('isCreditedSalesFormat', () => {
  it('detects the credited columns (case/spacing insensitive)', () => {
    expect(isCreditedSalesFormat(['Credited Territory', 'Final Credited Units'])).toBe(true)
    expect(isCreditedSalesFormat(['Territory ID', 'Credited Units'])).toBe(false)
  })
})

describe('aggregateCreditedSales', () => {
  it('sums final_credited_units per credited_territory', () => {
    const agg = aggregateCreditedSales(headers, [
      { credited_territory: 'RS010407', final_credited_units: 100 },
      { credited_territory: 'RS010407', final_credited_units: 50.5 },
      { credited_territory: 'RS020204', final_credited_units: 200 },
    ])
    expect(agg.byTerritory.get('RS010407')).toBeCloseTo(150.5, 6)
    expect(agg.byTerritory.get('RS020204')).toBe(200)
  })

  it('skips non-numeric values (e.g. #N/A) and counts them', () => {
    const agg = aggregateCreditedSales(headers, [
      { credited_territory: 'RS010407', final_credited_units: '#N/A' },
      { credited_territory: 'RS010407', final_credited_units: 75 },
    ])
    expect(agg.byTerritory.get('RS010407')).toBe(75)
    expect(agg.unparsedValueRows).toBe(1)
  })
})

describe('joinCreditedSales', () => {
  it('joins to territories and reports unmatched + missing', () => {
    const agg = aggregateCreditedSales(headers, [
      { credited_territory: 'RS010407', final_credited_units: 100 },
      { credited_territory: 'RS020204', final_credited_units: 200 },
      { credited_territory: 'GHOST99', final_credited_units: 999 }, // not a territory
      // A9001 has no credited row
    ])
    const join = joinCreditedSales(agg, territories)
    expect(join.rows).toHaveLength(3)
    expect(join.rows.find((r) => r.territoryId === 'RS010407')!.value).toBe(100)
    expect(join.rows.find((r) => r.territoryId === 'A9001')!.value).toBe(0)
    expect(join.unmatchedCreditedTerritories).toEqual(['GHOST99'])
    expect(join.territoriesWithoutCredit).toEqual(['A9001'])
  })
})
