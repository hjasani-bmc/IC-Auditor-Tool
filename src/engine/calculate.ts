/**
 * Calculation orchestrator: turns a plan + datasets into per-territory payouts.
 *
 * Flow (per requirements section 7):
 *   1. Pro-rate the target incentive.
 *   2. For each enabled metric, derive a payout fraction per territory using the
 *      metric's mechanism, at its measurement level.
 *   3. Blend: total payout % = Sum(weight x metric payout %).
 *   4. Convert: total payout $ = total % x pro-rated TI (+ standalone $ commissions).
 *
 * Every territory result carries a component-by-component breakdown so any
 * payout is fully explainable (auditability requirement).
 */
import type {
  DataRow,
  EligibilityEntry,
  MetricDataType,
  Metric,
  Plan,
  Territory,
} from '../domain/types'
import { proratedTargetIncentive } from './prorate'
import {
  attainmentByGroup,
  groupKeyFor,
  rowsByGroup,
  valueByGroup,
} from './attainment'
import {
  averageRating,
  commissionResult,
  curvePayout,
  gridPayout,
  rankItems,
  ratingMapPayout,
} from './mechanisms'

/** Datasets keyed by metric data type (actuals and goals uploaded per type). */
export interface EngineData {
  /** Master list of territories defining the universe & display order. */
  territories: Territory[]
  actuals: Partial<Record<MetricDataType, DataRow[]>>
  goals: Partial<Record<MetricDataType, DataRow[]>>
  /** Per-territory eligibility/LOA, keyed by territoryId. Missing → 100%. */
  eligibility?: Record<string, EligibilityEntry>
}

export interface MetricComponentResult {
  metricId: string
  metricName: string
  dataType: MetricDataType
  level: Metric['level']
  mechanism: Metric['mechanism']
  /** Whole-number percentage weight (0-100). */
  weight: number
  /** Attainment fraction for goal-based mechanisms; null otherwise. */
  attainment: number | null
  /** Raw basis value used (rating, commission value, or ranked value). */
  basisValue: number | null
  /** Rank within the measurement-level group (rank mechanism only). */
  rank: number | null
  /** Metric payout as a fraction of TI. */
  payoutFraction: number
  /** weight/100 x payoutFraction. */
  weightedContribution: number
  /** Standalone $ from a commission configured to add dollars directly. */
  standaloneDollars: number
}

export interface TerritoryPayout {
  territory: Territory
  components: MetricComponentResult[]
  /** Blended payout as a fraction of TI, BEFORE eligibility. */
  totalPayoutFraction: number
  /** Leave-of-Absence flag (informational, carried through). */
  loaFlag: boolean
  /** Eligibility applied (0-1 fraction). */
  eligibilityFraction: number
  /** True when the territory had no eligibility row (defaulted to 100%). */
  eligibilityDefaulted: boolean
  /** totalPayoutFraction x eligibilityFraction. */
  eligiblePayoutFraction: number
  /** Dollars before eligibility (for audit/export). */
  preEligibilityDollars: number
  /** Final dollars AFTER eligibility. */
  totalPayoutDollars: number
}

export interface NationAttainment {
  metricId: string
  metricName: string
  attainment: number | null
}

export interface PayoutResult {
  proratedTI: number
  territories: TerritoryPayout[]
  nationAttainmentByMetric: NationAttainment[]
}

const GOAL_BASED = new Set(['Curve', 'Grid'])

/** Per-territory payout fraction (+ audit fields) for a single metric. */
interface MetricEval {
  attainment: (id: string) => number | null
  basisValue: (id: string) => number | null
  rank: (id: string) => number | null
  payoutFraction: (id: string) => number
  standaloneDollars: (id: string) => number
}

function evaluateMetric(
  metric: Metric,
  data: EngineData,
  proratedTI: number,
): MetricEval {
  const actuals = data.actuals[metric.dataType] ?? []
  const goals = data.goals[metric.dataType] ?? []
  const level = metric.level

  // Map each territory to its group key once.
  const groupOf = new Map<string, string>()
  for (const t of data.territories) groupOf.set(t.territoryId, groupKeyFor(t, level))

  // Attainment per group (used by curve & grid).
  const attain = attainmentByGroup(actuals, goals, level)

  // Per-territory actual value (for rating/commission/rank).
  const valueOf = new Map<string, number>()
  for (const r of actuals) valueOf.set(r.territoryId, r.value)

  const none = () => null

  switch (metric.mechanism) {
    case 'Curve': {
      const curve = metric.curve
      return {
        attainment: (id) => attain.get(groupOf.get(id)!) ?? 0,
        basisValue: none,
        rank: none,
        payoutFraction: (id) =>
          curve ? curvePayout(attain.get(groupOf.get(id)!) ?? 0, curve) : 0,
        standaloneDollars: () => 0,
      }
    }
    case 'Grid': {
      const grid = metric.grid
      return {
        attainment: (id) => attain.get(groupOf.get(id)!) ?? 0,
        basisValue: none,
        rank: none,
        payoutFraction: (id) =>
          grid ? gridPayout(attain.get(groupOf.get(id)!) ?? 0, grid) : 0,
        standaloneDollars: () => 0,
      }
    }
    case 'RatingMap': {
      const cfg = metric.ratingMap
      // The integer rating actually used per territory (null when none present).
      const ratingUsed = new Map<string, number | null>()
      if (level === 'Territory') {
        // Each territory uses its own rating directly (null if missing).
        for (const t of data.territories) {
          ratingUsed.set(t.territoryId, valueOf.has(t.territoryId) ? valueOf.get(t.territoryId)! : null)
        }
      } else {
        // Above territory: average the group's present ratings, round to 1-5,
        // and assign the same rating to every territory in the group.
        const groups = rowsByGroup(actuals, level)
        const groupRating = new Map<string, number | null>()
        for (const [k, rows] of groups) {
          groupRating.set(k, averageRating(rows.map((r) => r.value)))
        }
        for (const t of data.territories) {
          ratingUsed.set(t.territoryId, groupRating.get(groupOf.get(t.territoryId)!) ?? null)
        }
      }
      return {
        attainment: none,
        basisValue: (id) => ratingUsed.get(id) ?? null,
        rank: none,
        payoutFraction: (id) => {
          const r = ratingUsed.get(id) ?? null
          return cfg && r !== null ? ratingMapPayout(r, cfg) : 0
        },
        standaloneDollars: () => 0,
      }
    }
    case 'Commission': {
      const cfg = metric.commission
      // Value at the measurement level (group sum); each territory in the
      // group inherits its group's commission, mirroring attainment roll-up.
      const valByGroup = valueByGroup(actuals, level)
      const valueAt = (id: string) =>
        level === 'Territory'
          ? valueOf.get(id) ?? 0
          : valByGroup.get(groupOf.get(id)!) ?? 0
      return {
        attainment: none,
        basisValue: (id) => valueAt(id),
        rank: none,
        payoutFraction: (id) =>
          cfg ? commissionResult(valueAt(id), cfg, proratedTI).fraction : 0,
        standaloneDollars: (id) =>
          cfg ? commissionResult(valueAt(id), cfg, proratedTI).dollars : 0,
      }
    }
    case 'Rank': {
      const cfg = metric.rank
      // Rank within each measurement-level group on the metric value.
      const outcome = new Map<string, { rank: number; payout: number }>()
      if (cfg) {
        const groups = rowsByGroup(actuals, level)
        for (const rows of groups.values()) {
          const ranked = rankItems(
            rows.map((r) => ({ id: r.territoryId, value: r.value })),
            cfg,
          )
          for (const [id, o] of ranked) outcome.set(id, o)
        }
      }
      return {
        attainment: none,
        basisValue: (id) => valueOf.get(id) ?? null,
        rank: (id) => outcome.get(id)?.rank ?? null,
        payoutFraction: (id) => outcome.get(id)?.payout ?? 0,
        standaloneDollars: () => 0,
      }
    }
  }
}

export function calculatePayouts(plan: Plan, data: EngineData): PayoutResult {
  const proratedTI = proratedTargetIncentive(
    plan.annualTargetIncentive,
    plan.durationMonths,
  )

  const activeMetrics = plan.metrics.filter((m) => m.enabled)
  const evals = activeMetrics.map((m) => ({
    metric: m,
    ev: evaluateMetric(m, data, proratedTI),
  }))

  const territories: TerritoryPayout[] = data.territories.map((territory) => {
    const components: MetricComponentResult[] = evals.map(({ metric, ev }) => {
      const id = territory.territoryId
      const payoutFraction = ev.payoutFraction(id)
      const standaloneDollars = ev.standaloneDollars(id)
      const weightedContribution = (metric.weight / 100) * payoutFraction
      return {
        metricId: metric.id,
        metricName: metric.name,
        dataType: metric.dataType,
        level: metric.level,
        mechanism: metric.mechanism,
        weight: metric.weight,
        attainment: ev.attainment(id),
        basisValue: ev.basisValue(id),
        rank: ev.rank(id),
        payoutFraction,
        weightedContribution,
        standaloneDollars,
      }
    })

    const totalPayoutFraction = components.reduce(
      (s, c) => s + c.weightedContribution,
      0,
    )
    const standalone = components.reduce((s, c) => s + c.standaloneDollars, 0)
    const preEligibilityDollars = totalPayoutFraction * proratedTI + standalone

    // Eligibility is the LAST factor applied (after all blending). A territory
    // with no eligibility row defaults to 100% (and is flagged).
    const entry = data.eligibility?.[territory.territoryId]
    // Eligibility = days present / total days, so it is capped at 100% (1.0)
    // and floored at 0; defensively clamp regardless of the source.
    const eligibilityFraction = entry ? Math.min(1, Math.max(0, entry.eligibility)) : 1
    const loaFlag = entry ? entry.loa : false
    const eligibilityDefaulted = !entry
    const eligiblePayoutFraction = totalPayoutFraction * eligibilityFraction
    const totalPayoutDollars = preEligibilityDollars * eligibilityFraction

    return {
      territory,
      components,
      totalPayoutFraction,
      loaFlag,
      eligibilityFraction,
      eligibilityDefaulted,
      eligiblePayoutFraction,
      preEligibilityDollars,
      totalPayoutDollars,
    }
  })

  // Nation-level attainment per goal-based metric (for the dashboard).
  const nationAttainmentByMetric: NationAttainment[] = activeMetrics.map((m) => {
    if (!GOAL_BASED.has(m.mechanism)) {
      return { metricId: m.id, metricName: m.name, attainment: null }
    }
    const actuals = data.actuals[m.dataType] ?? []
    const goals = data.goals[m.dataType] ?? []
    const nation = attainmentByGroup(actuals, goals, 'Nation')
    return {
      metricId: m.id,
      metricName: m.name,
      attainment: nation.get('NATION') ?? 0,
    }
  })

  return { proratedTI, territories, nationAttainmentByMetric }
}
