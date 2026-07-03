import { useState } from 'react'
import { useStore } from '../state/store'
import { useEngine } from '../state/useEngine'
import { ResultsTable } from '../components/ResultsTable'
import { ValidationBanner } from '../components/ValidationBanner'
import { PageHeader, Section } from '../components/ui'
import { formatCurrency, formatPercent } from '../lib/format'
import { exportToExcel } from '../data/exportExcel'

export function PayoutResults() {
  const plan = useStore((s) => s.plan)
  const eligibilityProvided = useStore((s) => !!s.eligibilityMeta)
  const { validation, result, summary } = useEngine()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!result || !summary) return
    setExporting(true)
    try {
      await exportToExcel(plan, result, summary)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout Results"
        description="Per-territory payout with a component-by-component breakdown."
        actions={
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={!result || exporting}
          >
            {exporting ? 'Exporting…' : 'Export to Excel'}
          </button>
        }
      />

      <ValidationBanner validation={validation} />

      {result && summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MiniStat label="Total payout" value={formatCurrency(summary.totalPayout)} />
            <MiniStat label="Target pool" value={formatCurrency(summary.totalTargetPool)} />
            <MiniStat label="Payout vs pool" value={formatPercent(summary.payoutVsPool)} />
            <MiniStat label="Avg payout %" value={formatPercent(summary.stats.avg)} />
          </div>

          <Section title="Per-territory payout">
            <ResultsTable result={result} eligibilityProvided={eligibilityProvided} />
          </Section>
        </>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}
