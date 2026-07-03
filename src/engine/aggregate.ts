/**
 * Roll-ups and distribution statistics over per-territory payouts, for the
 * summary dashboard. Pure functions over a PayoutResult.
 */
import type { PayoutResult, TerritoryPayout } from './calculate'

export interface DistributionStats {
  count: number
  /** Fractions (1.0 === 100%). */
  avg: number
  median: number
  min: number
  max: number
  countAtOrAbove100: number
  countBelow100: number
}

export interface GroupAggregate {
  key: string
  name: string
  territoryCount: number
  totalDollars: number
  avgPayoutFraction: number
}

export interface Summary {
  totalPayout: number
  totalTargetPool: number
  /** totalPayout / totalTargetPool. */
  payoutVsPool: number
  stats: DistributionStats
  byRegion: GroupAggregate[]
  byArea: GroupAggregate[]
  /** Pre-eligibility total dollars (sum of preEligibilityDollars). */
  totalPreEligibility: number
  /** Dollars removed by eligibility (pre minus final). */
  dollarsReducedByEligibility: number
  /** Territories flagged on Leave of Absence. */
  countOnLOA: number
  /** Territories with eligibility below 100%. */
  countBelowFullEligibility: number
}

export function distributionStats(rows: TerritoryPayout[]): DistributionStats {
  const n = rows.length
  if (n === 0) {
    return {
      count: 0,
      avg: 0,
      median: 0,
      min: 0,
      max: 0,
      countAtOrAbove100: 0,
      countBelow100: 0,
    }
  }
  const fractions = rows.map((r) => r.totalPayoutFraction)
  const sorted = [...fractions].sort((a, b) => a - b)
  const sum = fractions.reduce((s, f) => s + f, 0)
  const mid = Math.floor(n / 2)
  const median =
    n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  return {
    count: n,
    avg: sum / n,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    countAtOrAbove100: fractions.filter((f) => f >= 1).length,
    countBelow100: fractions.filter((f) => f < 1).length,
  }
}

function aggregateBy(
  rows: TerritoryPayout[],
  keyFn: (r: TerritoryPayout) => string,
  nameFn: (r: TerritoryPayout) => string,
): GroupAggregate[] {
  const groups = new Map<string, TerritoryPayout[]>()
  for (const r of rows) {
    const k = keyFn(r)
    const arr = groups.get(k)
    if (arr) arr.push(r)
    else groups.set(k, [r])
  }
  return [...groups.entries()]
    .map(([key, items]) => {
      const totalDollars = items.reduce((s, r) => s + r.totalPayoutDollars, 0)
      const avgPayoutFraction =
        items.reduce((s, r) => s + r.totalPayoutFraction, 0) / items.length
      return {
        key,
        name: nameFn(items[0]),
        territoryCount: items.length,
        totalDollars,
        avgPayoutFraction,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function summarize(result: PayoutResult): Summary {
  const rows = result.territories
  const totalPayout = rows.reduce((s, r) => s + r.totalPayoutDollars, 0)
  const totalPreEligibility = rows.reduce((s, r) => s + r.preEligibilityDollars, 0)
  const totalTargetPool = result.proratedTI * rows.length
  return {
    totalPayout,
    totalTargetPool,
    payoutVsPool: totalTargetPool > 0 ? totalPayout / totalTargetPool : 0,
    stats: distributionStats(rows),
    byRegion: aggregateBy(
      rows,
      (r) => r.territory.regionId,
      (r) => r.territory.regionName,
    ),
    byArea: aggregateBy(
      rows,
      (r) => r.territory.areaId,
      (r) => r.territory.areaName,
    ),
    totalPreEligibility,
    dollarsReducedByEligibility: totalPreEligibility - totalPayout,
    countOnLOA: rows.filter((r) => r.loaFlag).length,
    countBelowFullEligibility: rows.filter((r) => r.eligibilityFraction < 1).length,
  }
}
