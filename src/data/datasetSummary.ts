/**
 * Pure dataset-summary statistics for the interactive upload panels: row counts,
 * coverage vs known territories, numeric field stats, and MBO rating distribution.
 */
import type { DataRow, MetricDataType, Territory } from '../domain/types'

export interface NumericStats {
  count: number
  sum: number
  min: number
  max: number
  mean: number
  /** Rows whose value is exactly zero. */
  zeroCount: number
}

export interface RatingBucket {
  rating: number
  count: number
}

export interface DatasetSummary {
  /** Rows currently loaded for the dataset. */
  total: number
  distinctTerritories: number
  distinctAreas: number
  distinctRegions: number
  /** Row territory keys that don't match any known territory. */
  unmatchedKeys: string[]
  /** Known territories with no row in this dataset. */
  missingTerritories: string[]
  numeric: NumericStats
  /** Present only for MBO datasets. */
  ratingDistribution?: RatingBucket[]
}

function numericStats(values: number[]): NumericStats {
  if (values.length === 0) {
    return { count: 0, sum: 0, min: 0, max: 0, mean: 0, zeroCount: 0 }
  }
  let sum = 0
  let min = Infinity
  let max = -Infinity
  let zeroCount = 0
  for (const v of values) {
    sum += v
    if (v < min) min = v
    if (v > max) max = v
    if (v === 0) zeroCount += 1
  }
  return { count: values.length, sum, min, max, mean: sum / values.length, zeroCount }
}

export function summarizeDataset(
  rows: DataRow[],
  dataType: MetricDataType,
  allTerritories: Territory[],
): DatasetSummary {
  const known = new Set(allTerritories.map((t) => t.territoryId))
  const present = new Set(rows.map((r) => r.territoryId))

  const summary: DatasetSummary = {
    total: rows.length,
    distinctTerritories: present.size,
    distinctAreas: new Set(rows.map((r) => r.areaId)).size,
    distinctRegions: new Set(rows.map((r) => r.regionId)).size,
    unmatchedKeys: [...present].filter((id) => !known.has(id)).sort(),
    missingTerritories: allTerritories
      .filter((t) => !present.has(t.territoryId))
      .map((t) => t.territoryId)
      .sort(),
    numeric: numericStats(rows.map((r) => r.value)),
  }

  if (dataType === 'MBORating') {
    const counts = new Map<number, number>([
      [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
    ])
    for (const r of rows) {
      const rating = Math.min(5, Math.max(1, Math.round(r.value)))
      counts.set(rating, (counts.get(rating) ?? 0) + 1)
    }
    summary.ratingDistribution = [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([rating, count]) => ({ rating, count }))
  }

  return summary
}
