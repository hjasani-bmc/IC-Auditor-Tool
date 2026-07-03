import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import type { DatasetKind } from '../data/datasets'
import type { MetricDataType } from '../domain/types'
import { NumberInput } from './inputs'
import { EmptyState } from './ui'

export function EditableDataTable({
  kind,
  dataType,
  valueLabel,
}: {
  kind: DatasetKind
  dataType: MetricDataType
  valueLabel: string
}) {
  const rows = useStore((s) => s[kind][dataType])
  const updateCell = useStore((s) => s.updateCell)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!rows) return []
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.territoryId.toLowerCase().includes(q) ||
        r.territoryName.toLowerCase().includes(q) ||
        r.areaName.toLowerCase().includes(q) ||
        r.regionName.toLowerCase().includes(q),
    )
  }, [rows, query])

  if (!rows || rows.length === 0) {
    return <EmptyState title="No data in this dataset">Upload a file to populate it.</EmptyState>
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search territory, area, region…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="text-xs text-slate-400">
          {filtered.length} of {rows.length} rows
        </span>
      </div>
      <div className="max-h-[28rem] overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Territory</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Area</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Region</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">{valueLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.territoryId} className="hover:bg-slate-50">
                <td className="px-3 py-1.5">
                  <div className="font-medium text-slate-700">{r.territoryName}</div>
                  <div className="text-xs text-slate-400">{r.territoryId}</div>
                </td>
                <td className="px-3 py-1.5 text-slate-600">{r.areaName}</td>
                <td className="px-3 py-1.5 text-slate-600">{r.regionName}</td>
                <td className="px-3 py-1.5">
                  <div className="ml-auto max-w-[140px]">
                    <NumberInput
                      value={r.value}
                      onChange={(v) => updateCell(kind, dataType, r.territoryId, v)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
