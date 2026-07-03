import { Link } from 'react-router-dom'
import { useStore } from '../state/store'
import { useEngine } from '../state/useEngine'
import { PlanDetails } from '../components/PlanDetails'
import { MetricCard } from '../components/MetricCard'
import { Badge, PageHeader, Section } from '../components/ui'

export function PlanSetup() {
  const plan = useStore((s) => s.plan)
  const addMetric = useStore((s) => s.addMetric)
  const resetToDemo = useStore((s) => s.resetToDemo)
  const { validation } = useEngine()

  const total = validation.totalWeight
  const tone = validation.weightsValid ? 'green' : total > 100 ? 'red' : 'amber'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan Setup"
        description="Configure plan details, metrics, weights, and payout mechanisms."
        actions={
          <button className="btn-secondary" onClick={resetToDemo}>
            Reset to demo
          </button>
        }
      />

      <PlanDetails />

      <Section
        title="Plan Components / Metrics"
        description="Up to 5 metrics. Active weights must total exactly 100% to calculate."
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={tone}>Weight total: {total}%</Badge>
            <button
              className="btn-primary"
              onClick={addMetric}
              disabled={plan.metrics.length >= 5}
            >
              + Add metric
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {plan.metrics.map((m, i) => (
            <MetricCard key={m.id} metric={m} index={i} />
          ))}
          {plan.metrics.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              No metrics yet. Add one to begin.
            </p>
          )}
        </div>

        {!validation.weightsValid && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Active metric weights currently total <strong>{total}%</strong>. Adjust them to
            exactly <strong>100%</strong> to enable the payout calculation.
          </div>
        )}
      </Section>

      <div className="flex justify-end">
        <Link
          to="/results"
          className={validation.canCalculate ? 'btn-primary' : 'btn-primary pointer-events-none opacity-50'}
        >
          View payout results →
        </Link>
      </div>
    </div>
  )
}
