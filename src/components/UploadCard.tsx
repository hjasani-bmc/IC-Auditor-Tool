import { useRef, useState } from 'react'
import { useStore } from '../state/store'
import { processUpload } from '../data/upload'
import { processCreditedUpload } from '../data/creditedSales'
import { CREDITED_SEED_REPORT } from '../data/demoData'
import {
  buildCreditedTemplate,
  buildDatasetTemplate,
  downloadCsv,
} from '../data/csvTemplate'
import type { DatasetDescriptor } from '../data/datasets'
import type { ValidationResult } from '../data/validate'
import { DatasetSummary } from './DatasetSummary'
import { Badge } from './ui'

const SOURCE_TONE = { seed: 'slate', upload: 'green', manual: 'blue' } as const

export function UploadCard({ descriptor }: { descriptor: DatasetDescriptor }) {
  const rows = useStore((s) => s[descriptor.kind][descriptor.dataType])
  const meta = useStore((s) => s.meta[descriptor.kind][descriptor.dataType])
  const territories = useStore((s) => s.territories)
  const setDataset = useStore((s) => s.setDataset)
  const inputRef = useRef<HTMLInputElement>(null)
  const [report, setReport] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isCreditedSales =
    descriptor.kind === 'actuals' && descriptor.dataType === 'SalesUnits'

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(null)
    setReport(null)
    try {
      let result: ValidationResult
      if (isCreditedSales) {
        // Try the account-level credited format first; fall back to a plain
        // per-territory Sales Units file if those columns aren't present.
        const credited = await processCreditedUpload(file, territories)
        result = credited.missingColumns.length
          ? await processUpload(file, descriptor.kind, descriptor.dataType)
          : credited
      } else {
        result = await processUpload(file, descriptor.kind, descriptor.dataType)
      }
      setReport(result)
      if (result.validRows.length > 0) {
        setDataset(descriptor.kind, descriptor.dataType, result.validRows, {
          source: 'upload',
          fileName: file.name,
          rowCount: result.validRows.length,
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

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-slate-800">{descriptor.label}</div>
          <div className="text-xs text-slate-400">
            {isCreditedSales
              ? 'Joins on credited_territory · sums final_credited_units'
              : `Value column: ${descriptor.valueLabel}`}
          </div>
        </div>
        {meta && <Badge tone={SOURCE_TONE[meta.source]}>{meta.source}</Badge>}
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
        <span>{rows?.length ?? 0} rows</span>
        {meta?.fileName && <span className="truncate text-xs text-slate-400">· {meta.fileName}</span>}
      </div>

      {isCreditedSales && meta?.source === 'seed' && !report && (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Seeded from <strong>Credited_sales_data.xlsx</strong>:{' '}
          {CREDITED_SEED_REPORT.unmatchedCreditedTerritories.length} unmatched credited
          territor{CREDITED_SEED_REPORT.unmatchedCreditedTerritories.length === 1 ? 'y' : 'ies'},{' '}
          {CREDITED_SEED_REPORT.territoriesWithoutCredit.length} territor
          {CREDITED_SEED_REPORT.territoriesWithoutCredit.length === 1 ? 'y' : 'ies'} with no credited
          data (set to 0).
        </div>
      )}

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
          title="Download a CSV template for this dataset"
          onClick={() => {
            const csv = isCreditedSales
              ? buildCreditedTemplate()
              : buildDatasetTemplate(descriptor)
            const base = isCreditedSales
              ? 'credited_sales'
              : `${descriptor.kind}_${descriptor.dataType}`
            downloadCsv(`${base}_template.csv`, csv)
          }}
        >
          Template
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      {report && <UploadReport report={report} />}

      <DatasetSummary
        kind={descriptor.kind}
        dataType={descriptor.dataType}
        valueLabel={descriptor.valueLabel}
        report={report}
      />
    </div>
  )
}

function UploadReport({ report }: { report: ValidationResult }) {
  const loaded = report.validRows.length
  if (report.missingColumns.length > 0) {
    return (
      <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
        Missing required column(s): {report.missingColumns.join(', ')}. Nothing was imported.
      </div>
    )
  }
  const fmtIssue = (e: { row: number; territoryId?: string; message: string }) => {
    const loc = e.row > 0 ? `Row ${e.row}` : e.territoryId ? e.territoryId : ''
    const prefix = e.row > 0 && e.territoryId ? `${loc} (${e.territoryId})` : loc
    return prefix ? `${prefix}: ${e.message}` : e.message
  }
  return (
    <div className="mt-3 space-y-2 text-xs">
      <div
        className={`rounded-lg px-3 py-2 ${
          report.errors.length ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        Loaded <strong>{loaded}</strong> of {report.totalRows} rows ·{' '}
        {report.errors.length} error(s) · {report.warnings.length} warning(s)
      </div>
      {report.errors.length > 0 && (
        <ul className="max-h-32 list-disc space-y-0.5 overflow-auto rounded-lg bg-slate-50 px-5 py-2 text-slate-600">
          {report.errors.slice(0, 25).map((e, i) => (
            <li key={i}>{fmtIssue(e)}</li>
          ))}
          {report.errors.length > 25 && <li>…and {report.errors.length - 25} more.</li>}
        </ul>
      )}
      {report.warnings.length > 0 && (
        <ul className="max-h-32 list-disc space-y-0.5 overflow-auto rounded-lg bg-amber-50 px-5 py-2 text-amber-700">
          {report.warnings.slice(0, 25).map((w, i) => (
            <li key={i}>{fmtIssue(w)}</li>
          ))}
          {report.warnings.length > 25 && <li>…and {report.warnings.length - 25} more.</li>}
        </ul>
      )}
    </div>
  )
}
