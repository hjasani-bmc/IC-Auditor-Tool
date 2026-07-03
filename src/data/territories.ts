/**
 * Derive the master territory universe from the loaded datasets. Sales Units
 * actuals define the canonical order; territories appearing only in other
 * datasets are appended so nothing is lost.
 */
import type { DataRow, MetricDataType, Territory } from '../domain/types'

function toTerritory(r: DataRow): Territory {
  return {
    territoryId: r.territoryId,
    territoryName: r.territoryName,
    areaId: r.areaId,
    areaName: r.areaName,
    regionId: r.regionId,
    regionName: r.regionName,
  }
}

const PRIORITY: MetricDataType[] = ['SalesUnits', 'HCPReach', 'MBORating', 'Other']

export function deriveTerritories(
  actuals: Partial<Record<MetricDataType, DataRow[]>>,
  goals: Partial<Record<MetricDataType, DataRow[]>>,
): Territory[] {
  const seen = new Set<string>()
  const out: Territory[] = []
  const add = (rows: DataRow[] | undefined) => {
    if (!rows) return
    for (const r of rows) {
      if (!seen.has(r.territoryId)) {
        seen.add(r.territoryId)
        out.push(toTerritory(r))
      }
    }
  }
  for (const dt of PRIORITY) add(actuals[dt])
  for (const dt of PRIORITY) add(goals[dt])
  return out
}
