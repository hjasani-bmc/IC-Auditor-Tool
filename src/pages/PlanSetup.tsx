import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../state/store'
import { useEngine } from '../state/useEngine'
import { PlanDetails } from '../components/PlanDetails'
import { MetricCard } from '../components/MetricCard'
import { PlanUpload } from '../components/PlanUpload'
import { Badge, PageHeader, Section } from '../components/ui'

export function PlanSetup() {
  const plan = useStore((s) => s.plan)
  const addMetric = useStore((s) => s.addMetric)
  const resetToDemo = useStore((s) => s.resetToDemo)
  const { validation } = useEngine()
  const [showUpload, setShowUpload] = useState(false)

  const total = validation.totalWeight
  const tone = validation.weightsValid ? 'green' : total > 100 ? 'red' : 'amber'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan Setup"
        description="Configure plan details, metrics, weights, and payout mechanisms."
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setShowUpload((v) => !v)}
            >
              {/* Upload icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              {showUpload ? 'Hide Upload' : 'Upload Plan'}
            </button>
            <button className="btn-secondary" onClick={resetToDemo}>
              Reset to demo
            </button>
          </div>
        }
      />

      {/* AI Upload Panel */}
      {showUpload && (
        <section className="card overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
                {/* Sparkle / AI icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Plan Upload</h2>
                <p className="text-xs text-brand-200">
                  Upload a plan document and let Gemini extract IC fields automatically
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-brand-200 transition-colors hover:bg-white/10 hover:text-white"
              onClick={() => setShowUpload(false)}
              aria-label="Close upload panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel body */}
          <div className="p-5">
            <PlanUpload onClose={() => setShowUpload(false)} />
          </div>
        </section>
      )}

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
