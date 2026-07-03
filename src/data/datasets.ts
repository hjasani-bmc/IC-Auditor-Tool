/**
 * Descriptors for every uploadable dataset: the hierarchy columns they share,
 * and the value-column header aliases used to locate the metric/goal value.
 */
import type { MetricDataType } from '../domain/types'

export type DatasetKind = 'actuals' | 'goals'

export interface HierarchyColumn {
  field: 'territoryId' | 'territoryName' | 'areaId' | 'areaName' | 'regionId' | 'regionName'
  aliases: string[]
}

export const HIERARCHY_COLUMNS: HierarchyColumn[] = [
  { field: 'territoryId', aliases: ['Territory ID', 'TerritoryId', 'Terr ID', 'TID'] },
  { field: 'territoryName', aliases: ['Territory Name', 'TerritoryName', 'Territory'] },
  { field: 'areaId', aliases: ['Area ID', 'AreaId'] },
  { field: 'areaName', aliases: ['Area Name', 'AreaName', 'Area'] },
  { field: 'regionId', aliases: ['Region ID', 'RegionId'] },
  { field: 'regionName', aliases: ['Region Name', 'RegionName', 'Region'] },
]

export interface DatasetDescriptor {
  kind: DatasetKind
  dataType: MetricDataType
  label: string
  /** Header aliases for the single value column, most-specific first. */
  valueAliases: string[]
  /** Human description of the value column. */
  valueLabel: string
}

export const DATASET_DESCRIPTORS: DatasetDescriptor[] = [
  {
    kind: 'actuals',
    dataType: 'SalesUnits',
    label: 'Sales Units (Actuals)',
    valueAliases: ['Credited Units', 'Credited', 'Units', 'Sales Units', 'Value'],
    valueLabel: 'Credited Units',
  },
  {
    kind: 'actuals',
    dataType: 'HCPReach',
    label: 'HCP Reach (Actuals)',
    valueAliases: ['Reach Achieved', 'Reach', 'HCP Reach', 'Value'],
    valueLabel: 'Reach Achieved',
  },
  {
    kind: 'actuals',
    dataType: 'MBORating',
    label: 'MBO Ratings',
    valueAliases: ['MBO Rating', 'Rating', 'MBO', 'Value'],
    valueLabel: 'MBO Rating (1–5)',
  },
  {
    kind: 'actuals',
    dataType: 'Other',
    label: 'Other (Actuals)',
    valueAliases: ['Metric Value', 'Value', 'Amount'],
    valueLabel: 'Metric Value',
  },
  {
    kind: 'goals',
    dataType: 'SalesUnits',
    label: 'Sales Goal',
    valueAliases: ['Sales Goal', 'Goal', 'Target', 'Value'],
    valueLabel: 'Sales Goal',
  },
  {
    kind: 'goals',
    dataType: 'HCPReach',
    label: 'Reach Goal',
    valueAliases: ['Reach Goal', 'Goal', 'Target', 'Value'],
    valueLabel: 'Reach Goal',
  },
  {
    kind: 'goals',
    dataType: 'Other',
    label: 'Other Goal',
    valueAliases: ['Goal', 'Target', 'Value'],
    valueLabel: 'Goal',
  },
]

export function findDescriptor(
  kind: DatasetKind,
  dataType: MetricDataType,
): DatasetDescriptor | undefined {
  return DATASET_DESCRIPTORS.find(
    (d) => d.kind === kind && d.dataType === dataType,
  )
}
