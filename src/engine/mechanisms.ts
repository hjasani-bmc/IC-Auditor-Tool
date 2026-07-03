/**
 * The five payout mechanisms, each a pure function mapping a performance
 * measure to a payout fraction (1.0 === 100% of TI).
 *
 * Mechanisms:
 *   - curvePayout      piecewise-linear goal-attainment curve (capped)
 *   - gridPayout       step function: highest band at/below attainment (capped)
 *   - ratingMapPayout  MBO rating (1-5) mapped directly to a payout
 *   - commissionResult rate applied to a value (% of TI or standalone $)
 *   - rankPayouts      rank within a group mapped to a payout (with tie rules)
 */
import type {
  CommissionConfig,
  CurveConfig,
  GridConfig,
  RankConfig,
  RatingMapConfig,
} from '../domain/types'

// ---------------------------------------------------------------------------
// Curve (piecewise-linear)
// ---------------------------------------------------------------------------

/**
 * Within the tier containing `attainment`:
 *   payout = payoutAtFrom + (attainment - fromAttainment) x slope
 * Result is clamped to [0, cap]. Matches the spreadsheet's nested-IF logic.
 */
export function curvePayout(attainment: number, curve: CurveConfig): number {
  if (!Number.isFinite(attainment)) return 0
  // Pick the highest tier whose `fromAttainment` is <= attainment.
  let tier = curve.tiers[0]
  for (const t of curve.tiers) {
    if (attainment >= t.fromAttainment && t.fromAttainment >= tier.fromAttainment) {
      tier = t
    }
  }
  const raw = tier.payoutAtFrom + (attainment - tier.fromAttainment) * tier.slope
  // Cap is optional: absent capEnabled === true (backward compatible). When the
  // cap is disabled the final tier's slope extends with no ceiling.
  const capped = curve.capEnabled !== false
  return capped ? Math.max(0, Math.min(raw, curve.cap)) : Math.max(0, raw)
}

// ---------------------------------------------------------------------------
// Grid (step function)
// ---------------------------------------------------------------------------

/** Payout = the highest band whose `fromAttainment` <= attainment, clamped to cap. */
export function gridPayout(attainment: number, grid: GridConfig): number {
  if (!Number.isFinite(attainment)) return 0
  let payout = 0
  let bestFrom = -Infinity
  for (const b of grid.bands) {
    if (attainment >= b.fromAttainment && b.fromAttainment > bestFrom) {
      bestFrom = b.fromAttainment
      payout = b.payout
    }
  }
  return Math.max(0, Math.min(payout, grid.cap))
}

// ---------------------------------------------------------------------------
// Rating Map (MBO)
// ---------------------------------------------------------------------------

/** Map an MBO rating (rounded & clamped to 1-5) directly to a payout fraction. */
export function ratingMapPayout(rating: number, cfg: RatingMapConfig): number {
  if (!Number.isFinite(rating)) return 0
  const r = Math.min(5, Math.max(1, Math.round(rating)))
  return cfg.map[r] ?? 0
}

/**
 * Roll up MBO ratings above territory level: arithmetic mean of the present
 * ratings (each territory counts equally), rounded to the nearest whole rating
 * (0.5 rounds up) and clamped to 1-5. Returns null when no ratings are present
 * (caller treats per missing-data rules). Blank/missing ratings must be
 * excluded by the caller (pass only present values).
 */
export function averageRating(ratings: number[]): number | null {
  const present = ratings.filter((r) => Number.isFinite(r))
  if (present.length === 0) return null
  const mean = present.reduce((s, r) => s + r, 0) / present.length
  return Math.min(5, Math.max(1, Math.round(mean)))
}

// ---------------------------------------------------------------------------
// Commission
// ---------------------------------------------------------------------------

export interface CommissionResult {
  /** Payout expressed as a fraction of TI (0 when output is standalone $). */
  fraction: number
  /** Standalone dollar amount (0 when output is % of TI). */
  dollars: number
}

/**
 * Commission = rate x value. For `PerUnit` the rate is $/unit and value is a
 * unit count; for `PercentOfValue` the rate is a fraction and value is a $
 * amount. Either way the product is dollars, then expressed per `output`.
 */
export function commissionResult(
  value: number,
  cfg: CommissionConfig,
  proratedTI: number,
): CommissionResult {
  const dollars = Number.isFinite(value) ? cfg.rate * value : 0
  if (cfg.output === 'StandaloneDollar') {
    return { fraction: 0, dollars }
  }
  return { fraction: proratedTI > 0 ? dollars / proratedTI : 0, dollars: 0 }
}

// ---------------------------------------------------------------------------
// Rank-based
// ---------------------------------------------------------------------------

/** Payout for a given rank from the rank->payout band table. */
export function payoutForRank(rank: number, cfg: RankConfig): number {
  for (const b of cfg.bands) {
    if (rank >= b.fromRank && rank <= b.toRank) return b.payout
  }
  return 0
}

export interface RankOutcome {
  rank: number
  payout: number
}

/**
 * Rank a set of items (by id) on their value, highest value = rank 1.
 * Tie handling:
 *   - SharedRank: standard competition ranking (1,1,3,...); tied items share
 *     the lower rank and the next rank is skipped.
 *   - AveragedPayout: tied items share rank but each receives the average of
 *     the payouts across the positions they occupy.
 */
export function rankItems(
  items: { id: string; value: number }[],
  cfg: RankConfig,
): Map<string, RankOutcome> {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const out = new Map<string, RankOutcome>()

  let i = 0
  while (i < sorted.length) {
    // Find the extent of a tie group (equal values).
    let j = i
    while (j + 1 < sorted.length && sorted[j + 1].value === sorted[i].value) j++
    const sharedRank = i + 1 // 1-based; positions i..j tie at this rank
    const groupSize = j - i + 1

    let payout: number
    if (cfg.tieHandling === 'AveragedPayout' && groupSize > 1) {
      let sum = 0
      for (let p = i; p <= j; p++) sum += payoutForRank(p + 1, cfg)
      payout = sum / groupSize
    } else {
      payout = payoutForRank(sharedRank, cfg)
    }

    for (let k = i; k <= j; k++) {
      out.set(sorted[k].id, { rank: sharedRank, payout })
    }
    i = j + 1
  }
  return out
}
