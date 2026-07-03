/**
 * The default plan seeded on first load. It mirrors the reference plan
 * (RevMed IC Plan 2026, Aug–Dec 2026, $25k pro-rated) and showcases multiple
 * measurement levels and mechanisms:
 *   - National Sales  → Nation-level curve
 *   - Area Sales      → Area-level curve
 *   - HCP Reach       → Territory-level step grid
 */
import type { Plan } from '../domain/types'
import { curveTemplate, DEFAULT_GRID } from './templates'

export function makeDefaultPlan(): Plan {
  return {
    name: 'RevMed IC Plan 2026',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    durationMonths: 5,
    annualTargetIncentive: 60000,
    metrics: [
      {
        id: 'seed-national-sales',
        name: 'National Sales',
        dataType: 'SalesUnits',
        level: 'Nation',
        weight: 40,
        enabled: true,
        mechanism: 'Curve',
        curve: curveTemplate('Nation (Team)'),
      },
      {
        id: 'seed-area-sales',
        name: 'Area Sales',
        dataType: 'SalesUnits',
        level: 'Area',
        weight: 30,
        enabled: true,
        mechanism: 'Curve',
        curve: curveTemplate('Area (Team)'),
      },
      {
        id: 'seed-hcp-reach',
        name: 'HCP Reach',
        dataType: 'HCPReach',
        level: 'Territory',
        weight: 30,
        enabled: true,
        mechanism: 'Grid',
        grid: structuredClone(DEFAULT_GRID),
      },
    ],
  }
}
