/**
 * Core domain types for the IC Payout Tool.
 *
 * These types form the contract shared between the (pure) calculation engine,
 * the data layer, and the UI. They are intentionally framework-agnostic so the
 * engine can stay dependency-free and a v2 backend can reuse them as-is.
 *
 * Convention: attainment and payout values are stored as fractions
 * (1.0 === 100%), not whole-number percentages. Weights are the exception:
 * they are stored as whole-number percentages (0–100) to match the UI.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/**
 * Level at which a metric is measured and rolled up.
 * Region is intentionally excluded as a *selectable* level (display-only
 * roll-up per requirements decision); it still exists in the hierarchy.
 */
export type MeasurementLevel = 'Territory' | 'Area' | 'Nation'

export type MetricDataType = 'SalesUnits' | 'HCPReach' | 'MBORating' | 'Other'

export type MechanismType =
  | 'Curve'
  | 'Grid'
  | 'RatingMap'
  | 'Commission'
  | 'Rank'

// ---------------------------------------------------------------------------
// Organizational hierarchy & data
// ---------------------------------------------------------------------------

export interface Territory {
  territoryId: string
  territoryName: string
  areaId: string
  areaName: string
  regionId: string
  regionName: string
}

/** A single uploaded/seeded data point for a territory (actual or goal). */
export interface DataRow extends Territory {
  value: number
}

/** A named dataset of actuals or goals, keyed by metric data type. */
export interface Dataset {
  /** Which metric data type this dataset feeds (or 'Goal:<dataType>'). */
  rows: DataRow[]
}

// ---------------------------------------------------------------------------
// Payout mechanism configurations
// ---------------------------------------------------------------------------

/** One tier of a piecewise-linear payout curve. */
export interface CurveTier {
  /** Attainment at the start of the tier (fraction, e.g. 1.0 = 100%). */
  fromAttainment: number
  /** Attainment at the end of the tier (fraction). Use Infinity for open top. */
  toAttainment: number
  /** Payout multiple applied per unit of attainment above `fromAttainment`. */
  slope: number
  /** Payout at `fromAttainment` (fraction, e.g. 1.0 = 100% of TI). */
  payoutAtFrom: number
}

export interface CurveConfig {
  /** Name of the seed template this curve was based on, if any. */
  templateName?: string
  /** Attainment at which "Excellence" payout is anchored (fraction, default 1.25). */
  excellenceAttainment: number
  /**
   * Whether the payout ceiling (`cap`) is enforced. When false the final tier's
   * slope extends indefinitely (no ceiling). Absent === true for backward
   * compatibility with previously-seeded curves.
   */
  capEnabled?: boolean
  /** Hard ceiling on payout (fraction, e.g. 4.0 = 400%); used only when capEnabled. */
  cap: number
  tiers: CurveTier[]
}

/** One band of a step-function payout grid. */
export interface GridBand {
  /** Attainment at or above which this band applies (fraction). */
  fromAttainment: number
  /** Payout for this band (fraction). */
  payout: number
}

export interface GridConfig {
  bands: GridBand[]
  /** Hard ceiling on payout (fraction, e.g. 1.0 = 100%). */
  cap: number
}

/** MBO rating (1–5) → payout fraction. */
export interface RatingMapConfig {
  /** Map of rating to payout fraction, e.g. { 1: 0.4, ..., 5: 1.25 }. */
  map: Record<number, number>
}

export type CommissionBasis = 'PerUnit' | 'PercentOfValue'
export type CommissionOutput = 'PercentOfTI' | 'StandaloneDollar'

export interface CommissionConfig {
  basis: CommissionBasis
  /** $ per unit, or fractional rate of value depending on `basis`. */
  rate: number
  /** Whether the result is expressed as % of TI or added as standalone $. */
  output: CommissionOutput
}

export type RankTieHandling = 'SharedRank' | 'AveragedPayout'

export interface RankBand {
  fromRank: number
  toRank: number
  payout: number
}

export interface RankConfig {
  tieHandling: RankTieHandling
  bands: RankBand[]
}

// ---------------------------------------------------------------------------
// Metric & plan
// ---------------------------------------------------------------------------

export interface Metric {
  id: string
  name: string
  dataType: MetricDataType
  level: MeasurementLevel
  /** Whole-number percentage 0–100. Active metric weights must sum to 100. */
  weight: number
  enabled: boolean
  mechanism: MechanismType
  // Mechanism-specific config; only the one matching `mechanism` is used.
  curve?: CurveConfig
  grid?: GridConfig
  ratingMap?: RatingMapConfig
  commission?: CommissionConfig
  rank?: RankConfig
}

/** Per-territory eligibility / Leave-of-Absence input. */
export interface EligibilityEntry {
  /** Leave-of-Absence indicator — informational only, does not drive math. */
  loa: boolean
  /** Proportion of calculated payout the territory receives (0-1 fraction). */
  eligibility: number
}

export interface Plan {
  name: string
  /** ISO date string (yyyy-mm-dd) or null when entered by duration only. */
  startDate: string | null
  endDate: string | null
  durationMonths: number
  /** Annual target incentive in dollars (default 60000). */
  annualTargetIncentive: number
  metrics: Metric[]
}
