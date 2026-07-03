/** Human-readable labels for the domain enums. */
import type { MeasurementLevel, MechanismType, MetricDataType } from './types'

export const DATA_TYPE_LABELS: Record<MetricDataType, string> = {
  SalesUnits: 'Sales Units',
  HCPReach: 'HCP Reach',
  MBORating: 'MBO Rating',
  Other: 'Other',
}

export const LEVEL_LABELS: Record<MeasurementLevel, string> = {
  Territory: 'Territory (Individual)',
  Area: 'Area (Team)',
  Nation: 'Nation',
}

export const MECHANISM_LABELS: Record<MechanismType, string> = {
  Curve: 'Payout Curve',
  Grid: 'Payout Grid (step)',
  RatingMap: 'Rating Map (MBO)',
  Commission: 'Commission',
  Rank: 'Rank-based',
}

export const DATA_TYPES: MetricDataType[] = ['SalesUnits', 'HCPReach', 'MBORating', 'Other']
export const LEVELS: MeasurementLevel[] = ['Territory', 'Area', 'Nation']
export const MECHANISMS: MechanismType[] = ['Curve', 'Grid', 'RatingMap', 'Commission', 'Rank']
