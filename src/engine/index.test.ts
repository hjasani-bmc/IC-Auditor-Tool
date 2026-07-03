import { describe, it, expect } from 'vitest'
import { proratedTargetIncentive } from './index'

describe('proratedTargetIncentive', () => {
  it('pro-rates a 5-month plan from $60k annual to $25k', () => {
    expect(proratedTargetIncentive(60000, 5)).toBe(25000)
  })

  it('returns full annual TI for a 12-month plan', () => {
    expect(proratedTargetIncentive(60000, 12)).toBe(60000)
  })
})
