import { describe, it, expect } from 'vitest'
import {
  curvePayout,
  gridPayout,
  ratingMapPayout,
  commissionResult,
  payoutForRank,
  rankItems,
} from './mechanisms'
import type {
  CurveConfig,
  GridConfig,
  RankConfig,
  RatingMapConfig,
} from '../domain/types'

// The three seed curves from requirements section 6.2 (Excellence at 125%).
const nationCurve: CurveConfig = {
  templateName: 'Nation',
  excellenceAttainment: 1.25,
  cap: 2.5,
  tiers: [
    { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
    { fromAttainment: 1, toAttainment: 1.25, slope: 4, payoutAtFrom: 1 },
    { fromAttainment: 1.25, toAttainment: Infinity, slope: 0.25, payoutAtFrom: 2 },
  ],
}
const areaCurve: CurveConfig = {
  templateName: 'Area',
  excellenceAttainment: 1.25,
  cap: 3,
  tiers: [
    { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
    { fromAttainment: 1, toAttainment: 1.25, slope: 6, payoutAtFrom: 1 },
    { fromAttainment: 1.25, toAttainment: Infinity, slope: 0.25, payoutAtFrom: 2.5 },
  ],
}
const individualCurve: CurveConfig = {
  templateName: 'Individual',
  excellenceAttainment: 1.25,
  cap: 4,
  tiers: [
    { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
    { fromAttainment: 1, toAttainment: 1.25, slope: 10, payoutAtFrom: 1 },
    { fromAttainment: 1.25, toAttainment: Infinity, slope: 0.25, payoutAtFrom: 3.5 },
  ],
}

describe('curvePayout', () => {
  it('matches the Nation curve worked examples (doc 6.2)', () => {
    expect(curvePayout(1.1, nationCurve)).toBeCloseTo(1.4, 10) // 100% + 0.1*4
    expect(curvePayout(1.25, nationCurve)).toBeCloseTo(2.0, 10) // Excellence
    expect(curvePayout(1.5, nationCurve)).toBeCloseTo(2.0625, 10) // 200% + 0.25*0.25
  })

  it('matches the Area curve (slope 6, cap 300%)', () => {
    expect(curvePayout(1.1, areaCurve)).toBeCloseTo(1.6, 10)
    expect(curvePayout(1.25, areaCurve)).toBeCloseTo(2.5, 10)
  })

  it('matches the Individual curve (slope 10, cap 400%)', () => {
    expect(curvePayout(1.1, individualCurve)).toBeCloseTo(2.0, 10)
    expect(curvePayout(1.25, individualCurve)).toBeCloseTo(3.5, 10)
  })

  it('pays 0 at 0% and 100% at exactly 100% attainment', () => {
    expect(curvePayout(0, nationCurve)).toBe(0)
    expect(curvePayout(1, nationCurve)).toBeCloseTo(1.0, 10)
  })

  it('enforces the tier-3 cap', () => {
    expect(curvePayout(5, nationCurve)).toBe(2.5)
    expect(curvePayout(10, individualCurve)).toBe(4)
  })

  it('never returns a non-finite number', () => {
    expect(curvePayout(NaN, nationCurve)).toBe(0)
    // Non-finite attainment is not a real measure; guard returns 0, never NaN.
    expect(curvePayout(Infinity, nationCurve)).toBe(0)
  })

  it('treats an absent capEnabled flag as capped (backward compatible)', () => {
    // nationCurve has no capEnabled field.
    expect(curvePayout(5, nationCurve)).toBe(2.5)
  })

  it('with the cap disabled, follows the final tier slope past the ceiling', () => {
    const uncapped: CurveConfig = { ...nationCurve, capEnabled: false }
    // At 200% attainment: final tier 200% + (2.0 - 1.25)*0.25 = 200% + 18.75% = 218.75%
    expect(curvePayout(2.0, uncapped)).toBeCloseTo(2.1875, 10)
    // Far above the old 250% ceiling, payout keeps rising.
    expect(curvePayout(10, uncapped)).toBeCloseTo(2.0 + (10 - 1.25) * 0.25, 10)
    expect(curvePayout(10, uncapped)).toBeGreaterThan(2.5)
  })

  it('with the cap enabled, clamps identically to before', () => {
    const capped: CurveConfig = { ...nationCurve, capEnabled: true }
    expect(curvePayout(10, capped)).toBe(2.5)
  })
})

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

describe('gridPayout', () => {
  it('returns the highest band at or below attainment', () => {
    expect(gridPayout(0.735, reachGrid)).toBe(0.6)
    expect(gridPayout(0.4, reachGrid)).toBe(0.4)
    expect(gridPayout(0.39, reachGrid)).toBe(0)
    expect(gridPayout(0.99, reachGrid)).toBe(0.8)
  })

  it('caps at 100%', () => {
    expect(gridPayout(1.5, reachGrid)).toBe(1)
  })
})

const mboMap: RatingMapConfig = {
  map: { 1: 0.4, 2: 0.6, 3: 0.8, 4: 1.0, 5: 1.25 },
}

describe('ratingMapPayout', () => {
  it('maps each rating to its payout (doc 6.5 defaults)', () => {
    expect(ratingMapPayout(1, mboMap)).toBe(0.4)
    expect(ratingMapPayout(3, mboMap)).toBe(0.8)
    expect(ratingMapPayout(5, mboMap)).toBe(1.25)
  })

  it('rounds and clamps out-of-range ratings to 1-5', () => {
    expect(ratingMapPayout(4.4, mboMap)).toBe(1.0)
    expect(ratingMapPayout(0, mboMap)).toBe(0.4)
    expect(ratingMapPayout(9, mboMap)).toBe(1.25)
  })
})

describe('commissionResult', () => {
  it('computes per-unit commission as % of TI', () => {
    const r = commissionResult(
      100,
      { basis: 'PerUnit', rate: 50, output: 'PercentOfTI' },
      25000,
    )
    expect(r.dollars).toBe(0)
    expect(r.fraction).toBeCloseTo(0.2, 10) // 100*50 = 5000 / 25000
  })

  it('computes percent-of-value commission as standalone dollars', () => {
    const r = commissionResult(
      200000,
      { basis: 'PercentOfValue', rate: 0.05, output: 'StandaloneDollar' },
      25000,
    )
    expect(r.fraction).toBe(0)
    expect(r.dollars).toBeCloseTo(10000, 10) // 5% of 200,000
  })
})

const rankCfg: RankConfig = {
  tieHandling: 'SharedRank',
  bands: [
    { fromRank: 1, toRank: 1, payout: 1.5 },
    { fromRank: 2, toRank: 2, payout: 1.0 },
    { fromRank: 3, toRank: 3, payout: 0.5 },
    { fromRank: 4, toRank: 99, payout: 0.25 },
  ],
}

describe('rank', () => {
  it('payoutForRank reads the right band', () => {
    expect(payoutForRank(1, rankCfg)).toBe(1.5)
    expect(payoutForRank(3, rankCfg)).toBe(0.5)
    expect(payoutForRank(10, rankCfg)).toBe(0.25)
  })

  it('ranks by value descending', () => {
    const out = rankItems(
      [
        { id: 'a', value: 10 },
        { id: 'b', value: 30 },
        { id: 'c', value: 20 },
      ],
      rankCfg,
    )
    expect(out.get('b')).toEqual({ rank: 1, payout: 1.5 })
    expect(out.get('c')).toEqual({ rank: 2, payout: 1.0 })
    expect(out.get('a')).toEqual({ rank: 3, payout: 0.5 })
  })

  it('SharedRank: ties share the lower rank and skip the next', () => {
    const out = rankItems(
      [
        { id: 'a', value: 30 },
        { id: 'b', value: 30 },
        { id: 'c', value: 10 },
      ],
      rankCfg,
    )
    expect(out.get('a')!.rank).toBe(1)
    expect(out.get('b')!.rank).toBe(1)
    expect(out.get('c')!.rank).toBe(3) // rank 2 skipped
    expect(out.get('c')!.payout).toBe(0.5)
  })

  it('AveragedPayout: ties receive the average payout of their positions', () => {
    const out = rankItems(
      [
        { id: 'a', value: 30 },
        { id: 'b', value: 30 },
        { id: 'c', value: 10 },
      ],
      { ...rankCfg, tieHandling: 'AveragedPayout' },
    )
    // positions 1 & 2 -> (1.5 + 1.0) / 2 = 1.25
    expect(out.get('a')!.payout).toBeCloseTo(1.25, 10)
    expect(out.get('b')!.payout).toBeCloseTo(1.25, 10)
  })
})
