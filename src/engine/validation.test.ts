import { describe, it, expect } from 'vitest'
import { validateCurveTiers, validatePlan } from './validation'
import { curvePayout } from './mechanisms'
import type { CurveConfig, Plan } from '../domain/types'

const contiguous: CurveConfig = {
  excellenceAttainment: 1.25,
  cap: 3,
  tiers: [
    { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
    { fromAttainment: 1, toAttainment: 1.25, slope: 4, payoutAtFrom: 1 },
    { fromAttainment: 1.25, toAttainment: Infinity, slope: 0.25, payoutAtFrom: 2 },
  ],
}

describe('validateCurveTiers', () => {
  it('passes a contiguous, ordered curve', () => {
    expect(validateCurveTiers(contiguous)).toEqual([])
  })

  it('flags a gap where a tier from does not equal the previous tier to', () => {
    const broken: CurveConfig = {
      ...contiguous,
      tiers: [
        { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
        { fromAttainment: 1.1, toAttainment: Infinity, slope: 4, payoutAtFrom: 1 }, // gap 1.0 -> 1.1
      ],
    }
    expect(validateCurveTiers(broken).length).toBeGreaterThan(0)
    expect(validateCurveTiers(broken)[0]).toMatch(/contiguous/i)
  })

  it('flags a tier whose to is below its from', () => {
    const broken: CurveConfig = {
      ...contiguous,
      tiers: [{ fromAttainment: 1, toAttainment: 0.5, slope: 1, payoutAtFrom: 0 }],
    }
    expect(validateCurveTiers(broken)[0]).toMatch(/greater than or equal/i)
  })
})

describe('curvePayout with arbitrary tier counts', () => {
  it('handles a 5-tier curve, picking the right segment', () => {
    const fiveTier: CurveConfig = {
      excellenceAttainment: 1.25,
      cap: 5,
      tiers: [
        { fromAttainment: 0, toAttainment: 0.5, slope: 0.5, payoutAtFrom: 0 },
        { fromAttainment: 0.5, toAttainment: 1, slope: 1.5, payoutAtFrom: 0.25 },
        { fromAttainment: 1, toAttainment: 1.25, slope: 4, payoutAtFrom: 1 },
        { fromAttainment: 1.25, toAttainment: 1.5, slope: 2, payoutAtFrom: 2 },
        { fromAttainment: 1.5, toAttainment: Infinity, slope: 0.5, payoutAtFrom: 2.5 },
      ],
    }
    expect(curvePayout(1.0, fiveTier)).toBeCloseTo(1.0, 10) // end of tier 2
    expect(curvePayout(1.4, fiveTier)).toBeCloseTo(2.3, 10) // tier 4: 2 + 0.15*2
    expect(curvePayout(2.0, fiveTier)).toBeCloseTo(2.75, 10) // tier 5: 2.5 + 0.5*0.5
  })
})

describe('validatePlan gates on malformed curves', () => {
  it('blocks calculation when a curve tier is non-contiguous', () => {
    const plan: Plan = {
      name: 'p',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      durationMonths: 12,
      annualTargetIncentive: 60000,
      metrics: [
        {
          id: 'm',
          name: 'Sales',
          dataType: 'SalesUnits',
          level: 'Nation',
          weight: 100,
          enabled: true,
          mechanism: 'Curve',
          curve: {
            excellenceAttainment: 1.25,
            cap: 2,
            tiers: [
              { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
              { fromAttainment: 1.2, toAttainment: Infinity, slope: 4, payoutAtFrom: 1 },
            ],
          },
        },
      ],
    }
    const v = validatePlan(plan)
    expect(v.canCalculate).toBe(false)
    expect(v.errors.some((e) => /contiguous/i.test(e))).toBe(true)
  })
})
