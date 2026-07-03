/**
 * Seeded, fully-editable defaults: the three named curve templates plus default
 * configs for the grid, MBO rating map, commission, and rank mechanisms.
 *
 * Curves follow requirements section 6.2 (Excellence anchored at 125%); the
 * tier-2 slope is derived to hit the Excellence payout exactly at 125%.
 */
import type {
  CommissionConfig,
  CurveConfig,
  GridConfig,
  MechanismType,
  Metric,
  RankConfig,
  RatingMapConfig,
} from '../domain/types'

export interface CurveTemplate {
  name: string
  description: string
  config: CurveConfig
}

/** Build a 3-tier curve from its Excellence payout & ceiling (slope derived). */
function buildCurve(excellencePayout: number, cap: number): CurveConfig {
  const excellenceAttainment = 1.25
  // tier-2 slope hits Excellence payout exactly at 125%.
  const tier2Slope = (excellencePayout - 1) / (excellenceAttainment - 1)
  return {
    excellenceAttainment,
    capEnabled: true,
    cap,
    tiers: [
      { fromAttainment: 0, toAttainment: 1, slope: 1, payoutAtFrom: 0 },
      { fromAttainment: 1, toAttainment: 1.25, slope: tier2Slope, payoutAtFrom: 1 },
      {
        fromAttainment: 1.25,
        toAttainment: Infinity,
        slope: 0.25,
        payoutAtFrom: excellencePayout,
      },
    ],
  }
}

export const CURVE_TEMPLATES: CurveTemplate[] = [
  {
    name: 'Individual',
    description: '350% at Excellence, capped at 400% (slope 10x).',
    config: { ...buildCurve(3.5, 4), templateName: 'Individual' },
  },
  {
    name: 'Area (Team)',
    description: '250% at Excellence, capped at 300% (slope 6x).',
    config: { ...buildCurve(2.5, 3), templateName: 'Area (Team)' },
  },
  {
    name: 'Nation (Team)',
    description: '200% at Excellence, capped at 250% (slope 4x).',
    config: { ...buildCurve(2.0, 2.5), templateName: 'Nation (Team)' },
  },
]

export function curveTemplate(name: string): CurveConfig {
  const t = CURVE_TEMPLATES.find((c) => c.name === name) ?? CURVE_TEMPLATES[2]
  // Deep clone so edits don't mutate the shared template.
  return structuredClone(t.config)
}

export const DEFAULT_GRID: GridConfig = {
  cap: 1,
  bands: [
    { fromAttainment: 0, payout: 0 },
    { fromAttainment: 0.4, payout: 0.4 },
    { fromAttainment: 0.6, payout: 0.6 },
    { fromAttainment: 0.8, payout: 0.8 },
    { fromAttainment: 1, payout: 1 },
  ],
}

export const DEFAULT_RATING_MAP: RatingMapConfig = {
  map: { 1: 0.4, 2: 0.6, 3: 0.8, 4: 1.0, 5: 1.25 },
}

export const DEFAULT_COMMISSION: CommissionConfig = {
  basis: 'PerUnit',
  rate: 50,
  output: 'PercentOfTI',
}

export const DEFAULT_RANK: RankConfig = {
  tieHandling: 'SharedRank',
  bands: [
    { fromRank: 1, toRank: 1, payout: 1.5 },
    { fromRank: 2, toRank: 2, payout: 1.25 },
    { fromRank: 3, toRank: 5, payout: 1.0 },
    { fromRank: 6, toRank: 999, payout: 0.5 },
  ],
}

/** Attach the default config block for a mechanism to a metric. */
export function withMechanismDefaults(
  metric: Metric,
  mechanism: MechanismType,
): Metric {
  const base: Metric = {
    ...metric,
    mechanism,
    curve: undefined,
    grid: undefined,
    ratingMap: undefined,
    commission: undefined,
    rank: undefined,
  }
  switch (mechanism) {
    case 'Curve':
      return { ...base, curve: curveTemplate('Nation (Team)') }
    case 'Grid':
      return { ...base, grid: structuredClone(DEFAULT_GRID) }
    case 'RatingMap':
      return { ...base, ratingMap: structuredClone(DEFAULT_RATING_MAP) }
    case 'Commission':
      return { ...base, commission: structuredClone(DEFAULT_COMMISSION) }
    case 'Rank':
      return { ...base, rank: structuredClone(DEFAULT_RANK) }
  }
}

let metricSeq = 0
/** Create a new metric with sensible defaults (Curve mechanism). */
export function makeMetric(partial: Partial<Metric> = {}): Metric {
  metricSeq += 1
  const base: Metric = {
    id: `metric-${Date.now()}-${metricSeq}`,
    name: partial.name ?? 'New Metric',
    dataType: partial.dataType ?? 'SalesUnits',
    level: partial.level ?? 'Territory',
    weight: partial.weight ?? 0,
    enabled: partial.enabled ?? true,
    mechanism: partial.mechanism ?? 'Curve',
  }
  const withDefaults = withMechanismDefaults(base, base.mechanism)
  return { ...withDefaults, ...stripMechanismBlocks(partial) }
}

/** Keep explicit mechanism config from a partial, ignoring undefined blocks. */
function stripMechanismBlocks(p: Partial<Metric>): Partial<Metric> {
  const out: Partial<Metric> = {}
  if (p.curve) out.curve = p.curve
  if (p.grid) out.grid = p.grid
  if (p.ratingMap) out.ratingMap = p.ratingMap
  if (p.commission) out.commission = p.commission
  if (p.rank) out.rank = p.rank
  return out
}
