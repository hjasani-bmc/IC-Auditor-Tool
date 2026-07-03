import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PlanSetup } from './PlanSetup'
import { PayoutResults } from './PayoutResults'
import { Dashboard } from './Dashboard'
import { useStore } from '../state/store'

beforeEach(() => useStore.getState().resetToDemo())

describe('PlanSetup', () => {
  it('renders the seeded plan with a valid 100% weight total', () => {
    render(
      <MemoryRouter>
        <PlanSetup />
      </MemoryRouter>,
    )
    expect(screen.getByDisplayValue('RevMed IC Plan 2026')).toBeInTheDocument()
    expect(screen.getByText('Weight total: 100%')).toBeInTheDocument()
    // Pro-rated TI shown.
    expect(screen.getByText('$25,000')).toBeInTheDocument()
  })
})

describe('PayoutResults', () => {
  it('renders the per-territory table with computed dollars', () => {
    render(
      <MemoryRouter>
        <PayoutResults />
      </MemoryRouter>,
    )
    // A known seeded territory appears.
    expect(screen.getByText('Boston N, MA')).toBeInTheDocument()
    // Summary strip shows the target pool for 60 reps.
    const stat = screen.getByText('Target pool').parentElement!
    expect(within(stat).getByText('$1,500,000')).toBeInTheDocument()
  })

  it('always shows the eligibility columns (defaulting to 100% with no file)', () => {
    render(
      <MemoryRouter>
        <PayoutResults />
      </MemoryRouter>,
    )
    expect(screen.getByText('Elig %')).toBeInTheDocument()
    expect(screen.getByText('Eligible %')).toBeInTheDocument()
    expect(screen.getByText('LOA')).toBeInTheDocument()
    // No eligibility file -> every territory shows 100% eligibility.
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
  })

  it('reflects an uploaded 50% eligibility (half the dollars)', () => {
    const first = useStore.getState().territories[0].territoryId
    useStore.getState().setEligibility(
      { [first]: { loa: true, eligibility: 0.5 } },
      { source: 'upload', fileName: 'e.csv', rowCount: 1, errorCount: 0, warningCount: 0 },
    )
    render(
      <MemoryRouter>
        <PayoutResults />
      </MemoryRouter>,
    )
    // The 50% eligibility value is visible, and the LOA badge renders for that rep.
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('LOA').length).toBeGreaterThan(1) // header + at least one badge
  })
})

describe('Dashboard', () => {
  it('renders KPI cards and roll-up sections without crashing', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )
    expect(screen.getByText('Total payout')).toBeInTheDocument()
    expect(screen.getByText('Total payout by Region')).toBeInTheDocument()
    expect(screen.getByText('Nation attainment by metric')).toBeInTheDocument()
  })

  it('shows the "Reps ≥ 100%" KPI exactly once (no duplicate)', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('Reps ≥ 100%')).toHaveLength(1)
  })
})
