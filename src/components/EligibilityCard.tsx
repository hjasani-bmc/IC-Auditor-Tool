import { useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { processEligibilityUpload, type EligibilityImportResult } from '../data/eligibility'
import { buildEligibilityTemplate, downloadCsv } from '../data/csvTemplate'
import { formatNumber, formatPercent } from '../lib/format'
import { Badge } from './ui'

export function EligibilityCard() {
  const territories = useStore((s) => s.territories)
  const eligibility = useStore((s) => s.eligibility)
  const meta = useStore((s) => s.eligibilityMeta)
  const setEligibility = useStore((s) => s.setEligibility)
  const clearEligibility = useStore((s) => s.clearEligibility)
  const inputRef = useRef<HTMLInputElement>(null)
  const [report, setReport] = useState<EligibilityImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const entries = Object.values(eligibility)
  const dist = useMemo(() => {
    let full = 0
    let partial = 0
    let zero = 0
    let onLoa = 0
    for (const e of entries) {
      if (e.eligibility >= 1) full += 1
      else if (e.eligibility <= 0) zero += 1
      else partial += 1
      if (e.loa) onLoa += 1
    }
    const missing = territories.filter((t) => !(t.territoryId in eligibility)).length
    return { full, partial, zero, onLoa, missing }
  }, [entries, eligibility, territories])

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      const result = await processEligibilityUpload(file, territories)
      setReport(result)
      if (result.missingColumns.length === 0) {
        setEligibility(result.entries, {
          source: 'upload',
          fileName: file.name,
          rowCount: result.validRows,
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read the file.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const hasData = !!meta

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-slate-800">Eligibility / LOA</div>
          <div className="text-xs text-slate-400">
            Columns: Territory ID · LOA Flag · Eligibility %
          </div>
        </div>
        {hasData ? <Badge tone="green">uploaded</Badge> : <Badge tone="slate">not set · 100%</Badge>}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Eligibility % = days present ÷ total days (0–100%, never above 100%). It is
        applied as the final factor on each payout. Territories not in the file
        default to 100%. LOA is informational only.
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        <button
          type="button"
          className="btn-secondary flex-1"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Reading…' : 'Upload .xlsx / .csv'}
        </button>
        <button
          type="button"
          className="btn-secondary shrink-0"
          title="Download an eligibility template"
          onClick={() => downloadCsv('eligibility_loa_template.csv', buildEligibilityTemplate())}
        >
          Template
        </button>
        {hasData && (
          <button type="button" className="btn-secondary shrink-0" onClick={clearEligibility}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {report && report.missingColumns.length > 0 && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          Missing required column(s): {report.missingColumns.join(', ')}. Nothing imported.
        </div>
      )}

      {report && report.missingColumns.length === 0 && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
            Loaded <strong>{formatNumber(report.validRows)}</strong> of {report.totalRows} rows ·{' '}
            {report.errors.length} error(s) · {report.warnings.length} warning(s)
          </div>
          {report.warnings.length > 0 && (
            <ul className="max-h-32 list-disc space-y-0.5 overflow-auto rounded-lg bg-amber-50 px-5 py-2 text-amber-700">
              {report.warnings.slice(0, 20).map((w, i) => (
                <li key={i}>{w.territoryId ? `${w.territoryId}: ` : ''}{w.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasData && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
          <div className="mb-2 font-medium text-slate-700">Summary</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="At 100%" value={formatNumber(dist.full)} />
            <Stat label="Partial" value={formatNumber(dist.partial)} />
            <Stat label="At 0%" value={formatNumber(dist.zero)} />
            <Stat label="On LOA" value={formatNumber(dist.onLoa)} />
            <Stat label="Defaulted (missing)" value={formatNumber(dist.missing)} />
            <Stat label="Coverage" value={formatPercent(territories.length ? entries.length / territories.length : 0, 0)} />
          </div>
          {dist.missing > 0 && (
            <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-amber-700">
              {dist.missing} territor{dist.missing === 1 ? 'y' : 'ies'} not in the file — defaulted to 100% eligibility.
            </div>
          )}
        </div>
      )}
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
