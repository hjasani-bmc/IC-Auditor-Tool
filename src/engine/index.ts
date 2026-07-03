/**
 * Pure, dependency-free calculation engine — public barrel.
 *
 * This module (and everything it re-exports) must never import from React, the
 * data layer, or any UI code. Everything is a pure function of its inputs so it
 * can be unit-tested in isolation and reused by a future v2 backend.
 */
export { proratedTargetIncentive } from './prorate'
export {
  attainmentByGroup,
  groupKeyFor,
  rowsByGroup,
  valueByGroup,
} from './attainment'
export {
  curvePayout,
  gridPayout,
  ratingMapPayout,
  averageRating,
  commissionResult,
  payoutForRank,
  rankItems,
} from './mechanisms'
export type { CommissionResult, RankOutcome } from './mechanisms'
export { calculatePayouts } from './calculate'
export type {
  EngineData,
  MetricComponentResult,
  TerritoryPayout,
  NationAttainment,
  PayoutResult,
} from './calculate'
export { summarize, distributionStats } from './aggregate'
export type { Summary, GroupAggregate, DistributionStats } from './aggregate'
export { validatePlan, validateCurveTiers } from './validation'
export type { PlanValidation } from './validation'
