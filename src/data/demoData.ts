/**
 * Seeded demo dataset: 60 territories across 8 areas / 2 regions.
 *
 * Sales Units actuals (creditedUnits) are sourced from Credited_sales_data.xlsx,
 * aggregating final_credited_units by credited_territory and joining on territory
 * ID. Territories with no credited row are seeded to 0 (see CREDITED_SEED_REPORT).
 * HCP Reach, Sales Goal, Reach Goal come from the reference workbook; MBO and the
 * 'Other' metric are deterministic demo values.
 *
 * Generated from source files; edit the raw table below if reseeding.
 */
import type { DataRow, MetricDataType, Territory } from '../domain/types'

export interface DemoRow extends Territory {
  creditedUnits: number
  reachAchieved: number
  salesGoal: number
  reachGoal: number
  mboRating: number
  otherValue: number
  otherGoal: number
}

export const demoRows: DemoRow[] = [
  { territoryId: 'RS010407', territoryName: 'Boston N, MA', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 2580, reachAchieved: 35, salesGoal: 186, reachGoal: 100, mboRating: 1, otherValue: 3870, otherGoal: 260 },
  { territoryId: 'RS020204', territoryName: 'Boston S, MA', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 2280, reachAchieved: 56, salesGoal: 109, reachGoal: 108, mboRating: 2, otherValue: 3420, otherGoal: 153 },
  { territoryId: 'RS020105', territoryName: 'Hartford, CT', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1560, reachAchieved: 79, salesGoal: 206, reachGoal: 116, mboRating: 2, otherValue: 2340, otherGoal: 288 },
  { territoryId: 'RS020207', territoryName: 'Manhattan South, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1470, reachAchieved: 104, salesGoal: 73, reachGoal: 124, mboRating: 5, otherValue: 2205, otherGoal: 102 },
  { territoryId: 'RS020402', territoryName: 'Manhattan North, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1605, reachAchieved: 135, salesGoal: 142, reachGoal: 132, mboRating: 2, otherValue: 2408, otherGoal: 199 },
  { territoryId: 'RS010403', territoryName: 'Long Island, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1590, reachAchieved: 63, salesGoal: 102, reachGoal: 140, mboRating: 2, otherValue: 2385, otherGoal: 143 },
  { territoryId: 'RS010107', territoryName: 'Albany, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1140, reachAchieved: 86, salesGoal: 172, reachGoal: 148, mboRating: 3, otherValue: 1710, otherGoal: 241 },
  { territoryId: 'RS020203', territoryName: 'Buffalo, NY', areaId: 'AR01', areaName: 'East 1', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1860, reachAchieved: 112, salesGoal: 119, reachGoal: 156, mboRating: 1, otherValue: 2790, otherGoal: 167 },
  { territoryId: 'RS020401', territoryName: 'Newark, NJ', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1425, reachAchieved: 149, salesGoal: 89, reachGoal: 164, mboRating: 1, otherValue: 2138, otherGoal: 125 },
  { territoryId: 'RS010205', territoryName: 'Central/Southern NJ', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1050, reachAchieved: 108, salesGoal: 85, reachGoal: 100, mboRating: 2, otherValue: 1575, otherGoal: 119 },
  { territoryId: 'RS010404', territoryName: 'Philadelphia, PA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 930, reachAchieved: 41, salesGoal: 188, reachGoal: 108, mboRating: 3, otherValue: 1395, otherGoal: 263 },
  { territoryId: 'RS010101', territoryName: 'Baltimore, MD', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1440, reachAchieved: 73, salesGoal: 157, reachGoal: 116, mboRating: 2, otherValue: 2160, otherGoal: 220 },
  { territoryId: 'RS010102', territoryName: 'Pittsburgh, PA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 780, reachAchieved: 95, salesGoal: 149, reachGoal: 124, mboRating: 3, otherValue: 1170, otherGoal: 209 },
  { territoryId: 'RS010302', territoryName: 'Richmond, VA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1020, reachAchieved: 125, salesGoal: 133, reachGoal: 132, mboRating: 5, otherValue: 1530, otherGoal: 186 },
  { territoryId: 'RS020404', territoryName: 'Raleigh, NC', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 1200, reachAchieved: 157, salesGoal: 150, reachGoal: 140, mboRating: 4, otherValue: 1800, otherGoal: 210 },
  { territoryId: 'RS010301', territoryName: 'Southern Virginia, VA', areaId: 'AR02', areaName: 'East 2', regionId: 'RGN-E', regionName: 'East', creditedUnits: 872.55, reachAchieved: 73, salesGoal: 190, reachGoal: 148, mboRating: 4, otherValue: 1309, otherGoal: 266 },
  { territoryId: 'RS010307', territoryName: 'Central PA', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 509.22, reachAchieved: 86, salesGoal: 75, reachGoal: 156, mboRating: 5, otherValue: 764, otherGoal: 105 },
  { territoryId: 'RS010206', territoryName: 'Nashville, TN', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 540, reachAchieved: 133, salesGoal: 118, reachGoal: 164, mboRating: 3, otherValue: 810, otherGoal: 165 },
  { territoryId: 'A9001', territoryName: 'Charleston, SC', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 0, reachAchieved: 88, salesGoal: 146, reachGoal: 100, mboRating: 3, otherValue: 0, otherGoal: 204 },
  { territoryId: 'RS020202', territoryName: 'Atlanta N, GA', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 480, reachAchieved: 113, salesGoal: 87, reachGoal: 108, mboRating: 5, otherValue: 720, otherGoal: 122 },
  { territoryId: 'RS020301', territoryName: 'Atlanta S, GA', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 740.4, reachAchieved: 41, salesGoal: 168, reachGoal: 116, mboRating: 5, otherValue: 1111, otherGoal: 235 },
  { territoryId: 'A2005', territoryName: 'Orlando, FL', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 0, reachAchieved: 64, salesGoal: 99, reachGoal: 124, mboRating: 5, otherValue: 0, otherGoal: 139 },
  { territoryId: 'A9003', territoryName: 'Fort Lauderdale, FL', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 0, reachAchieved: 90, salesGoal: 157, reachGoal: 132, mboRating: 5, otherValue: 0, otherGoal: 220 },
  { territoryId: 'RS020302', territoryName: 'Miami, FL', areaId: 'AR03', areaName: 'East 3', regionId: 'RGN-E', regionName: 'East', creditedUnits: 650.4, reachAchieved: 118, salesGoal: 106, reachGoal: 140, mboRating: 1, otherValue: 976, otherGoal: 148 },
  { territoryId: 'RS020307', territoryName: 'Tampa, FL', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 480, reachAchieved: 151, salesGoal: 138, reachGoal: 148, mboRating: 1, otherValue: 720, otherGoal: 193 },
  { territoryId: 'RS010306', territoryName: 'Charlotte, NC', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 780, reachAchieved: 70, salesGoal: 110, reachGoal: 156, mboRating: 4, otherValue: 1170, otherGoal: 154 },
  { territoryId: 'RS020107', territoryName: 'Cleveland, OH', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 410.79, reachAchieved: 95, salesGoal: 130, reachGoal: 164, mboRating: 4, otherValue: 616, otherGoal: 182 },
  { territoryId: 'RS010405', territoryName: 'Cincinnati, OH', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 405.22, reachAchieved: 72, salesGoal: 103, reachGoal: 100, mboRating: 4, otherValue: 608, otherGoal: 144 },
  { territoryId: 'RS020303', territoryName: 'Michigan West', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 260.4, reachAchieved: 98, salesGoal: 82, reachGoal: 108, mboRating: 2, otherValue: 391, otherGoal: 115 },
  { territoryId: 'RS020102', territoryName: 'Michigan East', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 960, reachAchieved: 125, salesGoal: 100, reachGoal: 116, mboRating: 4, otherValue: 1440, otherGoal: 140 },
  { territoryId: 'RS020103', territoryName: 'Indianapolis, IN', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 210, reachAchieved: 47, salesGoal: 71, reachGoal: 124, mboRating: 5, otherValue: 315, otherGoal: 99 },
  { territoryId: 'RS010104', territoryName: 'Chicago , IL', areaId: 'AR04', areaName: 'East 4', regionId: 'RGN-E', regionName: 'East', creditedUnits: 197.25, reachAchieved: 83, salesGoal: 207, reachGoal: 132, mboRating: 5, otherValue: 296, otherGoal: 290 },
  { territoryId: 'RS020406', territoryName: 'Louisville, KY', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 240, reachAchieved: 108, salesGoal: 176, reachGoal: 140, mboRating: 1, otherValue: 360, otherGoal: 246 },
  { territoryId: 'RS010401', territoryName: 'Milwaukee, WI', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 330, reachAchieved: 141, salesGoal: 164, reachGoal: 148, mboRating: 5, otherValue: 495, otherGoal: 230 },
  { territoryId: 'RS010402', territoryName: 'Midwest Overlay', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 330, reachAchieved: 175, salesGoal: 92, reachGoal: 156, mboRating: 1, otherValue: 495, otherGoal: 129 },
  { territoryId: 'RS010106', territoryName: 'South St. Louis, MO', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 330, reachAchieved: 80, salesGoal: 255, reachGoal: 164, mboRating: 2, otherValue: 495, otherGoal: 357 },
  { territoryId: 'RS020104', territoryName: 'North St. Louis, MO', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 369.82, reachAchieved: 55, salesGoal: 146, reachGoal: 100, mboRating: 1, otherValue: 555, otherGoal: 204 },
  { territoryId: 'RS020408', territoryName: 'Kansas City, KS', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 270, reachAchieved: 87, salesGoal: 222, reachGoal: 108, mboRating: 3, otherValue: 405, otherGoal: 311 },
  { territoryId: 'RS020407', territoryName: 'Oklahoma City, OK', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 630, reachAchieved: 102, salesGoal: 173, reachGoal: 116, mboRating: 2, otherValue: 945, otherGoal: 242 },
  { territoryId: 'RS010204', territoryName: 'Denver, CO', areaId: 'AR05', areaName: 'West 1', regionId: 'RGN-W', regionName: 'West', creditedUnits: 60, reachAchieved: 130, salesGoal: 110, reachGoal: 124, mboRating: 1, otherValue: 90, otherGoal: 154 },
  { territoryId: 'RS020101', territoryName: 'Salt Lake City, UT', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 240, reachAchieved: 46, salesGoal: 134, reachGoal: 132, mboRating: 3, otherValue: 360, otherGoal: 188 },
  { territoryId: 'RS010103', territoryName: 'Phoenix N, AZ', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 330, reachAchieved: 73, salesGoal: 109, reachGoal: 140, mboRating: 4, otherValue: 495, otherGoal: 153 },
  { territoryId: 'RS010201', territoryName: 'Phoenix S, AZ', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 210, reachAchieved: 101, salesGoal: 118, reachGoal: 148, mboRating: 3, otherValue: 315, otherGoal: 165 },
  { territoryId: 'RS010203', territoryName: 'Minneapolis, MN', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 180, reachAchieved: 131, salesGoal: 98, reachGoal: 156, mboRating: 5, otherValue: 270, otherGoal: 137 },
  { territoryId: 'RS010303', territoryName: 'Birmingham, AL', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 240, reachAchieved: 167, salesGoal: 98, reachGoal: 164, mboRating: 1, otherValue: 360, otherGoal: 137 },
  { territoryId: 'RS010207', territoryName: 'Memphis, TN', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 180, reachAchieved: 45, salesGoal: 79, reachGoal: 100, mboRating: 4, otherValue: 270, otherGoal: 111 },
  { territoryId: 'RS010308', territoryName: 'New Orleans, LA', areaId: 'AR06', areaName: 'West 2', regionId: 'RGN-W', regionName: 'West', creditedUnits: 120, reachAchieved: 63, salesGoal: 176, reachGoal: 108, mboRating: 1, otherValue: 180, otherGoal: 246 },
  { territoryId: 'RS020106', territoryName: 'Dallas, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 120, reachAchieved: 84, salesGoal: 106, reachGoal: 116, mboRating: 3, otherValue: 180, otherGoal: 148 },
  { territoryId: 'RS020206', territoryName: 'Fort Worth, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 120, reachAchieved: 113, salesGoal: 119, reachGoal: 124, mboRating: 4, otherValue: 180, otherGoal: 167 },
  { territoryId: 'RS020205', territoryName: 'Houston, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 120, reachAchieved: 143, salesGoal: 179, reachGoal: 132, mboRating: 3, otherValue: 180, otherGoal: 251 },
  { territoryId: 'RS010406', territoryName: 'San Antonio, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 870, reachAchieved: 53, salesGoal: 255, reachGoal: 140, mboRating: 5, otherValue: 1305, otherGoal: 357 },
  { territoryId: 'A3002', territoryName: 'Lubbock, TX', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 0, reachAchieved: 93, salesGoal: 173, reachGoal: 148, mboRating: 3, otherValue: 0, otherGoal: 242 },
  { territoryId: 'RS020403', territoryName: 'SC Overlay', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 90, reachAchieved: 120, salesGoal: 86, reachGoal: 156, mboRating: 3, otherValue: 135, otherGoal: 120 },
  { territoryId: 'RS020405', territoryName: 'Sacramento, CA', areaId: 'AR07', areaName: 'West 3', regionId: 'RGN-W', regionName: 'West', creditedUnits: 0, reachAchieved: 156, salesGoal: 191, reachGoal: 164, mboRating: 5, otherValue: 0, otherGoal: 267 },
  { territoryId: 'RS010105', territoryName: 'Bakersfield, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 180, reachAchieved: 112, salesGoal: 123, reachGoal: 100, mboRating: 1, otherValue: 270, otherGoal: 172 },
  { territoryId: 'RS020201', territoryName: 'San Francisco, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 90, reachAchieved: 53, salesGoal: 209, reachGoal: 108, mboRating: 4, otherValue: 135, otherGoal: 293 },
  { territoryId: 'RS020305', territoryName: 'Los Angeles E, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 150, reachAchieved: 64, salesGoal: 78, reachGoal: 116, mboRating: 4, otherValue: 225, otherGoal: 109 },
  { territoryId: 'RS010304', territoryName: 'Los Angeles W, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 60, reachAchieved: 100, salesGoal: 84, reachGoal: 124, mboRating: 2, otherValue: 90, otherGoal: 118 },
  { territoryId: 'A5001', territoryName: 'San Diego, CA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 0, reachAchieved: 116, salesGoal: 161, reachGoal: 132, mboRating: 4, otherValue: 0, otherGoal: 225 },
  { territoryId: 'A3001', territoryName: 'Seattle, WA', areaId: 'AR08', areaName: 'West 4', regionId: 'RGN-W', regionName: 'West', creditedUnits: 0, reachAchieved: 147, salesGoal: 160, reachGoal: 140, mboRating: 2, otherValue: 0, otherGoal: 224 },
]

/** Join report from seeding Sales Units from Credited_sales_data.xlsx. */
export const CREDITED_SEED_REPORT = {
  unmatchedCreditedTerritories: ['RS010202', 'RS010305', 'RS020306', 'RS020308'] as string[],
  territoriesWithoutCredit: ['A2005', 'A3001', 'A3002', 'A5001', 'A9001', 'A9003', 'RS020405'] as string[],
}

export const demoTerritories: Territory[] = demoRows.map((r) => ({
  territoryId: r.territoryId,
  territoryName: r.territoryName,
  areaId: r.areaId,
  areaName: r.areaName,
  regionId: r.regionId,
  regionName: r.regionName,
}))

function toRows(pick: (r: DemoRow) => number): DataRow[] {
  return demoRows.map((r) => ({
    territoryId: r.territoryId,
    territoryName: r.territoryName,
    areaId: r.areaId,
    areaName: r.areaName,
    regionId: r.regionId,
    regionName: r.regionName,
    value: pick(r),
  }))
}

export const demoActuals: Partial<Record<MetricDataType, DataRow[]>> = {
  SalesUnits: toRows((r) => r.creditedUnits),
  HCPReach: toRows((r) => r.reachAchieved),
  MBORating: toRows((r) => r.mboRating),
  Other: toRows((r) => r.otherValue),
}

export const demoGoals: Partial<Record<MetricDataType, DataRow[]>> = {
  SalesUnits: toRows((r) => r.salesGoal),
  HCPReach: toRows((r) => r.reachGoal),
  Other: toRows((r) => r.otherGoal),
}
