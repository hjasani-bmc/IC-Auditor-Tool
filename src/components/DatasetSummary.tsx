import { useMemo } from 'react'
import { useStore } from '../state/store'
import { summarizeDataset } from '../data/datasetSummary'
import type { DatasetKind } from '../data/datasets'
import type { MetricDataType } from '../domain/types'
import type { ValidationResult } from '../data/validate'
import { formatNumber } from '../lib/format'

/** Lightweight labelled bar row. */
function Bar({ label, value, max, tone = 'bg-brand-500' }: { label: string; value: number; max: number; tone?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 shrink-0 text-slate-500">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded bg-slate-100">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right tabular-nums text-slate-600">{value}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-medium tabular-nums text-slate-700">{value}</div>
    </div>
  )
}

export function DatasetSummary({
  kind,
  dataType,
  valueLabel,
  report,
}: {
  kind: DatasetKind
  dataType: MetricDataType
  valueLabel: string
  report?: ValidationResult | null
}) {
  const rows = useStore((s) => s[kind][dataType])
  const territories = useStore((s) => s.territories)

  const summary = useMemo(
    () => summarizeDataset(rows ?? [], dataType, territories),
    [rows, dataType, territories],
  )
  if (!rows || rows.length === 0) return null

  const accepted = report ? report.validRows.length : rows.length
  const rejected = report ? report.errors.length : 0
  const total = report ? report.totalRows : rows.length
  const maxRating = summary.ratingDistribution
    ? Math.max(1, ...summary.ratingDistribution.map((b) => b.count))
    : 0

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-medium text-slate-700">Summary</span>
        <span className="text-slate-500">
          {formatNumber(total)} loaded · <span className="text-emerald-600">{formatNumber(accepted)} accepted</span>
          {rejected > 0 && <> · <span className="text-red-600">{formatNumber(rejected)} rejected</span></>}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
        <span>{summary.distinctTerritories} territories</span>
        <span>{summary.distinctAreas} areas</span>
        <span>{summary.distinctRegions} regions</span>
      </div>

      {(summary.unmatchedKeys.length > 0 || summary.missingTerritories.length > 0) && (
        <div className="space-y-1">
          {summary.unmatchedKeys.length > 0 && (
            <div className="rounded bg-amber-50 px-2 py-1 text-amber-700">
              {summary.unmatchedKeys.length} uploaded key(s) matched no territory:{' '}
              {summary.unmatchedKeys.slice(0, 6).join(', ')}
              {summary.unmatchedKeys.length > 6 ? '…' : ''}
            </div>
          )}
          {summary.missingTerritories.length > 0 && (
            <div className="rounded bg-amber-50 px-2 py-1 text-amber-700">
              {summary.missingTerritories.length} known territor
              {summary.missingTerritories.length === 1 ? 'y' : 'ies'} missing from this dataset.
            </div>
          )}
        </div>
      )}

      {summary.ratingDistribution ? (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            Rating distribution
          </div>
          {summary.ratingDistribution.map((b) => (
            <Bar key={b.rating} label={`★${b.rating}`} value={b.count} max={maxRating} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Sum" value={formatNumber(Math.round(summary.numeric.sum))} />
          <Stat label="Mean" value={formatNumber(Math.round(summary.numeric.mean))} />
          <Stat label={`${valueLabel} count`} value={formatNumber(summary.numeric.count)} />
          <Stat label="Min" value={formatNumber(summary.numeric.min)} />
          <Stat label="Max" value={formatNumber(summary.numeric.max)} />
          <Stat label="Zero values" value={formatNumber(summary.numeric.zeroCount)} />
        </div>
      )}
    </div>
  )
}
