import { describe, it, expect } from 'vitest'
import {
  normalizeEligibility,
  parseLoaFlag,
  processEligibilityUpload,
} from './eligibility'
import type { Territory } from '../domain/types'

const territories: Territory[] = ['T1', 'T2', 'T3', 'T4'].map((id) => ({
  territoryId: id, territoryName: id, areaId: 'A1', areaName: 'A1', regionId: 'R', regionName: 'R',
}))
const fileFrom = (csv: string) => new File([csv], 'elig.csv', { type: 'text/csv' })

describe('normalizeEligibility', () => {
  it('treats >1 as percent and <=1 as fraction', () => {
    expect(normalizeEligibility(50)).toBe(0.5)
    expect(normalizeEligibility(100)).toBe(1)
    expect(normalizeEligibility(0.5)).toBe(0.5)
    expect(normalizeEligibility(0)).toBe(0)
  })

  it('never exceeds 100% (days present / total days is capped)', () => {
    expect(normalizeEligibility(120)).toBe(1)
    expect(normalizeEligibility(150)).toBe(1)
  })
})

describe('parseLoaFlag', () => {
  it('parses common truthy/falsey encodings', () => {
    expect(parseLoaFlag('Y')).toBe(true)
    expect(parseLoaFlag('yes')).toBe(true)
    expect(parseLoaFlag('TRUE')).toBe(true)
    expect(parseLoaFlag('N')).toBe(false)
    expect(parseLoaFlag('')).toBe(false)
  })
})

describe('processEligibilityUpload', () => {
  it('normalizes 0-100 and 0-1, joins, and reports unmatched + missing', async () => {
    const csv =
      'Territory ID,LOA Flag,Eligibility %\nT1,Y,50\nT2,N,1\nGHOST,N,80\n'
    const res = await processEligibilityUpload(fileFrom(csv), territories)
    expect(res.missingColumns).toEqual([])
    expect(res.entries['T1']).toEqual({ loa: true, eligibility: 0.5 })
    expect(res.entries['T2']).toEqual({ loa: false, eligibility: 1 }) // 1 -> 100%
    expect(res.unmatchedKeys).toEqual(['GHOST'])
    // T3 and T4 absent from the file -> defaulted later by the engine, flagged here.
    expect(res.missingTerritories).toEqual(['T3', 'T4'])
  })

  it('defaults a blank eligibility cell to 100% with a warning', async () => {
    const csv = 'Territory ID,LOA Flag,Eligibility %\nT1,N,\n'
    const res = await processEligibilityUpload(fileFrom(csv), territories)
    expect(res.entries['T1'].eligibility).toBe(1)
    expect(res.warnings.some((w) => /blank/i.test(w.message))).toBe(true)
  })

  it('rejects out-of-range eligibility', async () => {
    const csv = 'Territory ID,LOA Flag,Eligibility %\nT1,N,150\n'
    const res = await processEligibilityUpload(fileFrom(csv), territories)
    expect(res.entries['T1']).toBeUndefined()
    expect(res.errors.some((e) => /0–100/.test(e.message))).toBe(true)
  })
})
