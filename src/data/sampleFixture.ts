/**
 * Engine validation fixture: the ORIGINAL 61-territory sample from the
 * reference workbook (RevMed IC Plan 2026). Used solely by the engine
 * reproduction test to prove the engine reproduces the workbook's
 * \,344,863 total. The app's live demo seed lives in demoData.ts.
 */
import type { DataRow, MetricDataType, Territory } from '../domain/types'

interface SampleRow extends Territory {
  creditedUnits: number
  reachAchieved: number
  salesGoal: number
  reachGoal: number
}

export const sampleRows: SampleRow[] = [
  { territoryId: 'RS010407', territoryName: 'Boston N, MA', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 170.85, reachAchieved: 35, salesGoal: 186, reachGoal: 100 },
  { territoryId: 'RS020204', territoryName: 'Boston S, MA', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 115.41, reachAchieved: 56, salesGoal: 109, reachGoal: 108 },
  { territoryId: 'RS020105', territoryName: 'Hartford, CT', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 173.22, reachAchieved: 79, salesGoal: 206, reachGoal: 116 },
  { territoryId: 'RS020207', territoryName: 'Manhattan South, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 84, reachAchieved: 104, salesGoal: 73, reachGoal: 124 },
  { territoryId: 'RS020402', territoryName: 'Manhattan North, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 139, reachAchieved: 135, salesGoal: 142, reachGoal: 132 },
  { territoryId: 'RS010403', territoryName: 'Long Island, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 126, reachAchieved: 63, salesGoal: 102, reachGoal: 140 },
  { territoryId: 'RS010107', territoryName: 'Albany, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 151.13, reachAchieved: 86, salesGoal: 172, reachGoal: 148 },
  { territoryId: 'RS020203', territoryName: 'Buffalo, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 130.5, reachAchieved: 112, salesGoal: 119, reachGoal: 156 },
  { territoryId: 'RS020401', territoryName: 'Newark, NJ', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 116, reachAchieved: 149, salesGoal: 89, reachGoal: 164 },
  { territoryId: 'RS010205', territoryName: 'Central/Southern NJ', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 67.5, reachAchieved: 108, salesGoal: 85, reachGoal: 100 },
  { territoryId: 'RS010404', territoryName: 'Philadelphia, PA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 192, reachAchieved: 41, salesGoal: 188, reachGoal: 108 },
  { territoryId: 'RS010101', territoryName: 'Baltimore, MD', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 148.7, reachAchieved: 73, salesGoal: 157, reachGoal: 116 },
  { territoryId: 'RS010102', territoryName: 'Pittsburgh, PA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 176, reachAchieved: 95, salesGoal: 149, reachGoal: 124 },
  { territoryId: 'RS010302', territoryName: 'Richmond, VA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 119.8, reachAchieved: 125, salesGoal: 133, reachGoal: 132 },
  { territoryId: 'RS020404', territoryName: 'Raleigh, NC', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 162, reachAchieved: 157, salesGoal: 150, reachGoal: 140 },
  { territoryId: 'RS010301', territoryName: 'Southern Virginia, VA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 163, reachAchieved: 73, salesGoal: 190, reachGoal: 148 },
  { territoryId: 'RS010307', territoryName: 'Central PA', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 91, reachAchieved: 86, salesGoal: 75, reachGoal: 156 },
  { territoryId: 'RS010206', territoryName: 'Nashville, TN', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 118, reachAchieved: 133, salesGoal: 118, reachGoal: 164 },
  { territoryId: 'A9001', territoryName: 'Charleston, SC', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 137, reachAchieved: 88, salesGoal: 146, reachGoal: 100 },
  { territoryId: 'RS020202', territoryName: 'Atlanta N, GA', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 98, reachAchieved: 113, salesGoal: 87, reachGoal: 108 },
  { territoryId: 'RS020301', territoryName: 'Atlanta S, GA', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 154.18, reachAchieved: 41, salesGoal: 168, reachGoal: 116 },
  { territoryId: 'A2005', territoryName: 'Orlando, FL', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 105, reachAchieved: 64, salesGoal: 99, reachGoal: 124 },
  { territoryId: 'A9003', territoryName: 'Fort Lauderdale, FL', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 131.5, reachAchieved: 90, salesGoal: 157, reachGoal: 132 },
  { territoryId: 'RS020302', territoryName: 'Miami, FL', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 122, reachAchieved: 118, salesGoal: 106, reachGoal: 140 },
  { territoryId: 'RS020307', territoryName: 'Tampa, FL', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 135, reachAchieved: 151, salesGoal: 138, reachGoal: 148 },
  { territoryId: 'RS010306', territoryName: 'Charlotte, NC', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 137, reachAchieved: 70, salesGoal: 110, reachGoal: 156 },
  { territoryId: 'RS020107', territoryName: 'Cleveland, OH', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 114.7, reachAchieved: 95, salesGoal: 130, reachGoal: 164 },
  { territoryId: 'RS010405', territoryName: 'Cincinnati, OH', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 113, reachAchieved: 72, salesGoal: 103, reachGoal: 100 },
  { territoryId: 'RS020303', territoryName: 'Michigan West', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 106, reachAchieved: 98, salesGoal: 82, reachGoal: 108 },
  { territoryId: 'RS020102', territoryName: 'Michigan East', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 79, reachAchieved: 125, salesGoal: 100, reachGoal: 116 },
  { territoryId: 'RS020103', territoryName: 'Indianapolis, IN', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 72, reachAchieved: 47, salesGoal: 71, reachGoal: 124 },
  { territoryId: 'RS010104', territoryName: 'Chicago , IL', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 196.22, reachAchieved: 83, salesGoal: 207, reachGoal: 132 },
  { territoryId: 'RS020406', territoryName: 'Louisville, KY', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 208, reachAchieved: 108, salesGoal: 176, reachGoal: 140 },
  { territoryId: 'RS010401', territoryName: 'Milwaukee, WI', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 147.89, reachAchieved: 141, salesGoal: 164, reachGoal: 148 },
  { territoryId: 'RS010402', territoryName: 'Midwest Overlay', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 99, reachAchieved: 175, salesGoal: 92, reachGoal: 156 },
  { territoryId: 'RS010106', territoryName: 'South St. Louis, MO', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 219.18, reachAchieved: 80, salesGoal: 255, reachGoal: 164 },
  { territoryId: 'RS020104', territoryName: 'North St. Louis, MO', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 176.85, reachAchieved: 55, salesGoal: 146, reachGoal: 100 },
  { territoryId: 'RS020408', territoryName: 'Kansas City, KS', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 222.39, reachAchieved: 87, salesGoal: 222, reachGoal: 108 },
  { territoryId: 'RS020407', territoryName: 'Oklahoma City, OK', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 162.73, reachAchieved: 102, salesGoal: 173, reachGoal: 116 },
  { territoryId: 'RS010204', territoryName: 'Denver, CO', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 123, reachAchieved: 130, salesGoal: 110, reachGoal: 124 },
  { territoryId: 'RS020101', territoryName: 'Salt Lake City, UT', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 123, reachAchieved: 46, salesGoal: 134, reachGoal: 132 },
  { territoryId: 'RS010103', territoryName: 'Phoenix N, AZ', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 115.89, reachAchieved: 73, salesGoal: 109, reachGoal: 140 },
  { territoryId: 'RS010201', territoryName: 'Phoenix S, AZ', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 99.5, reachAchieved: 101, salesGoal: 118, reachGoal: 148 },
  { territoryId: 'RS010203', territoryName: 'Minneapolis, MN', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 113, reachAchieved: 131, salesGoal: 98, reachGoal: 156 },
  { territoryId: 'RS010303', territoryName: 'Birmingham, AL', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 96, reachAchieved: 167, salesGoal: 98, reachGoal: 164 },
  { territoryId: 'RS010207', territoryName: 'Memphis, TN', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 98.52, reachAchieved: 45, salesGoal: 79, reachGoal: 100 },
  { territoryId: 'RS010308', territoryName: 'New Orleans, LA', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 154.7, reachAchieved: 63, salesGoal: 176, reachGoal: 108 },
  { territoryId: 'RS020106', territoryName: 'Dallas, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 117, reachAchieved: 84, salesGoal: 106, reachGoal: 116 },
  { territoryId: 'RS020206', territoryName: 'Fort Worth, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 155.3, reachAchieved: 113, salesGoal: 119, reachGoal: 124 },
  { territoryId: 'RS020205', territoryName: 'Houston, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 141.53, reachAchieved: 143, salesGoal: 179, reachGoal: 132 },
  { territoryId: 'RS010406', territoryName: 'San Antonio, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 260.23, reachAchieved: 53, salesGoal: 255, reachGoal: 140 },
  { territoryId: 'A3002', territoryName: 'Lubbock, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 164.47, reachAchieved: 93, salesGoal: 173, reachGoal: 148 },
  { territoryId: 'RS020403', territoryName: 'SC Overlay', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 101.72, reachAchieved: 120, salesGoal: 86, reachGoal: 156 },
  { territoryId: 'RS020405', territoryName: 'Sacramento, CA', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 172, reachAchieved: 156, salesGoal: 191, reachGoal: 164 },
  { territoryId: 'RS010105', territoryName: 'Bakersfield, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 132.59, reachAchieved: 112, salesGoal: 123, reachGoal: 100 },
  { territoryId: 'RS020201', territoryName: 'San Francisco, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 179.5, reachAchieved: 53, salesGoal: 209, reachGoal: 108 },
  { territoryId: 'RS020305', territoryName: 'Los Angeles E, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 94.47, reachAchieved: 64, salesGoal: 78, reachGoal: 116 },
  { territoryId: 'RS010304', territoryName: 'Los Angeles W, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 84, reachAchieved: 100, salesGoal: 84, reachGoal: 124 },
  { territoryId: 'A5001', territoryName: 'San Diego, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 151.43, reachAchieved: 116, salesGoal: 161, reachGoal: 132 },
  { territoryId: 'A3001', territoryName: 'Seattle, WA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 179, reachAchieved: 147, salesGoal: 160, reachGoal: 140 },
  { territoryId: 'A2004', territoryName: 'Portland, OR', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 121, reachAchieved: 52, salesGoal: 132, reachGoal: 148 },
]

export const sampleTerritories: Territory[] = sampleRows.map((r) => ({
  territoryId: r.territoryId,
  territoryName: r.territoryName,
  areaId: r.areaId,
  areaName: r.areaName,
  regionId: r.regionId,
  regionName: r.regionName,
}))

function toRows(pick: (r: SampleRow) => number): DataRow[] {
  return sampleRows.map((r) => ({
    territoryId: r.territoryId,
    territoryName: r.territoryName,
    areaId: r.areaId,
    areaName: r.areaName,
    regionId: r.regionId,
    regionName: r.regionName,
    value: pick(r),
  }))
}

export const sampleActuals: Partial<Record<MetricDataType, DataRow[]>> = {
  SalesUnits: toRows((r) => r.creditedUnits),
  HCPReach: toRows((r) => r.reachAchieved),
}

export const sampleGoals: Partial<Record<MetricDataType, DataRow[]>> = {
  SalesUnits: toRows((r) => r.salesGoal),
  HCPReach: toRows((r) => r.reachGoal),
}
