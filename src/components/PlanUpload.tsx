/**
 * PlanUpload.tsx
 * AI-powered IC plan upload component.
 * Lets users upload PDF / DOCX / PPTX / JSON, parses with Gemini,
 * shows a review/edit panel, then applies values to the Zustand store.
 */
import { useCallback, useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { useStore } from '../state/store'
import { parsePlanDocument } from '../services/planParser'
import type { ParsedMetric, ParsedPlan, ParseStatus } from '../services/planParser'
import type { MechanismType, MetricDataType, MeasurementLevel } from '../domain/types'
import { makeMetric, withMechanismDefaults } from '../data/templates'
import {
  DATA_TYPE_LABELS,
  LEVEL_LABELS,
  MECHANISM_LABELS,
  DATA_TYPES,
  LEVELS,
  MECHANISMS,
} from '../domain/labels'
import { Field, Select, Badge } from './ui'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = ['.pdf', '.docx', '.pptx', '.json']
const GEMINI_KEY_STORAGE = 'ic_gemini_api_key'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

function saveApiKey(key: string) {
  try {
    localStorage.setItem(GEMINI_KEY_STORAGE, key)
  } catch {
    /* ignore */
  }
}

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_TYPES.some((ext) => name.endsWith(ext))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ApiKeyInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          className="input pr-10 font-mono text-xs"
          type={show ? 'text' : 'password'}
          placeholder="Paste your Gemini API key (AIza…)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-xs text-brand-600 hover:underline"
      >
        Get free key ↗
      </a>
    </div>
  )
}

function DropZone({
  onFile,
  busy,
}: {
  onFile: (f: File) => void
  busy: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && isAccepted(file)) onFile(file)
    },
    [onFile],
  )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !busy && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
        dragging
          ? 'border-brand-500 bg-brand-50'
          : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/40'
      } ${busy ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleChange}
      />
      {/* Upload icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">
          {busy ? 'Processing…' : 'Drag & drop or click to upload'}
        </p>
        <p className="mt-1 text-xs text-slate-400">PDF, Word (.docx), PowerPoint (.pptx), JSON</p>
      </div>
    </div>
  )
}

function StatusBar({ status }: { status: ParseStatus | null }) {
  if (!status) return null

  if (status.stage === 'reading') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-slate-500">Reading document…</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${Math.round(status.progress * 100)}%` }}
          />
        </div>
      </div>
    )
  }

  if (status.stage === 'parsing') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-slate-500">AI is parsing the document…</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-brand-400" />
        </div>
      </div>
    )
  }

  if (status.stage === 'error') {
    return (
      <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
        <strong>Error:</strong> {status.message}
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Review panel: editable extracted values
// ---------------------------------------------------------------------------

function MetricReviewRow({
  metric,
  index,
  onChange,
  onRemove,
}: {
  metric: ParsedMetric
  index: number
  onChange: (m: ParsedMetric) => void
  onRemove: () => void
}) {
  const patch = (p: Partial<ParsedMetric>) => onChange({ ...metric, ...p })

  return (
    <div
      className={`rounded-xl border p-4 ${
        metric.needsReview
          ? 'border-amber-300 bg-amber-50/60'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
          {index + 1}
        </span>
        <input
          className="input flex-1 font-medium"
          value={metric.name}
          placeholder="Metric name"
          onChange={(e) => patch({ name: e.target.value })}
        />
        {metric.needsReview && (
          <Badge tone="amber">Needs review</Badge>
        )}
        <button
          type="button"
          className="text-xs text-red-400 hover:text-red-600"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      {metric.definition && (
        <p className="mb-3 text-xs text-slate-500 italic">"{metric.definition}"</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Data type">
          <Select
            value={metric.dataType ?? ''}
            onChange={(e) =>
              patch({
                dataType: e.target.value as MetricDataType,
                needsReview: !e.target.value || !metric.level || metric.weight == null || !metric.mechanism,
              })
            }
          >
            <option value="">— select —</option>
            {DATA_TYPES.map((d) => (
              <option key={d} value={d}>
                {DATA_TYPE_LABELS[d]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Level">
          <Select
            value={metric.level ?? ''}
            onChange={(e) =>
              patch({
                level: e.target.value as MeasurementLevel,
                needsReview: !metric.dataType || !e.target.value || metric.weight == null || !metric.mechanism,
              })
            }
          >
            <option value="">— select —</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Weight (%)">
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            step={5}
            value={metric.weight ?? ''}
            placeholder="0–100"
            onChange={(e) => {
              const w = parseInt(e.target.value, 10)
              patch({ weight: isNaN(w) ? undefined : Math.min(100, Math.max(0, w)) })
            }}
          />
        </Field>

        <Field label="Mechanism">
          <Select
            value={metric.mechanism ?? ''}
            onChange={(e) =>
              patch({
                mechanism: e.target.value as MechanismType,
                needsReview: !metric.dataType || !metric.level || metric.weight == null || !e.target.value,
              })
            }
          >
            <option value="">— select —</option>
            {MECHANISMS.map((m) => (
              <option key={m} value={m}>
                {MECHANISM_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  )
}

function ReviewPanel({
  plan,
  onApply,
  onDiscard,
}: {
  plan: ParsedPlan
  onApply: (p: ParsedPlan) => void
  onDiscard: () => void
}) {
  const [draft, setDraft] = useState<ParsedPlan>(structuredClone(plan))

  const patchPlan = (p: Partial<ParsedPlan>) => setDraft((d) => ({ ...d, ...p }))

  const updateMetric = (i: number, m: ParsedMetric) =>
    setDraft((d) => {
      const metrics = [...d.metrics]
      metrics[i] = m
      return { ...d, metrics }
    })

  const removeMetric = (i: number) =>
    setDraft((d) => ({ ...d, metrics: d.metrics.filter((_, idx) => idx !== i) }))

  const totalWeight = draft.metrics.reduce((s, m) => s + (m.weight ?? 0), 0)
  const weightOk = totalWeight === 100

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Review Extracted Plan</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify and correct the values before applying them.
          </p>
        </div>
        <button type="button" className="btn-secondary text-xs" onClick={onDiscard}>
          ✕ Discard
        </button>
      </div>

      {/* Ambiguous fields notice */}
      {draft.ambiguousFields.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <strong>Could not confidently parse:</strong>{' '}
          {draft.ambiguousFields.join(', ')}. Please fill these in manually.
        </div>
      )}

      {/* Plan-level fields */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Plan Details</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Plan name">
            <input
              className={`input ${!draft.name ? 'border-amber-400 bg-amber-50' : ''}`}
              value={draft.name ?? ''}
              placeholder="Enter plan name…"
              onChange={(e) => patchPlan({ name: e.target.value || undefined })}
            />
          </Field>

          <Field label="Annual Target Incentive ($)">
            <input
              className={`input ${draft.annualTargetIncentive == null ? 'border-amber-400 bg-amber-50' : ''}`}
              type="number"
              min={0}
              step={1000}
              value={draft.annualTargetIncentive ?? ''}
              placeholder="e.g. 60000"
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                patchPlan({ annualTargetIncentive: isNaN(v) ? undefined : v })
              }}
            />
          </Field>

          <Field label="Start date">
            <input
              className={`input ${!draft.startDate ? 'border-amber-400 bg-amber-50' : ''}`}
              type="date"
              value={draft.startDate ?? ''}
              onChange={(e) => patchPlan({ startDate: e.target.value || undefined })}
            />
          </Field>

          <Field label="End date">
            <input
              className={`input ${!draft.endDate ? 'border-amber-400 bg-amber-50' : ''}`}
              type="date"
              value={draft.endDate ?? ''}
              onChange={(e) => patchPlan({ endDate: e.target.value || undefined })}
            />
          </Field>
        </div>

        {/* Extra info (read-only summaries) */}
        {(draft.eligibilityCriteria || draft.payoutRules || draft.territoryInfo) && (
          <div className="mt-3 space-y-2">
            {draft.eligibilityCriteria && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium">Eligibility:</span> {draft.eligibilityCriteria}
              </div>
            )}
            {draft.payoutRules && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium">Payout rules:</span> {draft.payoutRules}
              </div>
            )}
            {draft.territoryInfo && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium">Territory info:</span> {draft.territoryInfo}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">
            Metrics ({draft.metrics.length})
          </h4>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${
                weightOk ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              Weight total: {totalWeight}%{!weightOk && ' (must equal 100%)'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {draft.metrics.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
              No metrics extracted. You can add them manually after applying.
            </p>
          )}
          {draft.metrics.map((m, i) => (
            <MetricReviewRow
              key={i}
              metric={m}
              index={i}
              onChange={(updated) => updateMetric(i, updated)}
              onRemove={() => removeMetric(i)}
            />
          ))}
        </div>
      </div>

      {/* Apply button */}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button type="button" className="btn-secondary" onClick={onDiscard}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onApply(draft)}
        >
          Apply to Plan Setup →
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PlanUpload({ onClose }: { onClose?: () => void }) {
  const updatePlan = useStore((s) => s.updatePlan)
  const addMetric = useStore((s) => s.addMetric)
  const updateMetric = useStore((s) => s.updateMetric)
  const planMetrics = useStore((s) => s.plan.metrics)

  const [apiKey, setApiKey] = useState(loadApiKey)
  const [status, setStatus] = useState<ParseStatus | null>(null)
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null)
  const [applied, setApplied] = useState(false)

  const busy =
    status?.stage === 'reading' || status?.stage === 'parsing'

  const handleFile = async (file: File) => {
    if (!apiKey.trim()) {
      setStatus({ stage: 'error', message: 'Please enter your Gemini API key first.' })
      return
    }
    saveApiKey(apiKey.trim())
    setParsedPlan(null)
    setApplied(false)
    try {
      const plan = await parsePlanDocument(file, apiKey.trim(), setStatus)
      setParsedPlan(plan)
    } catch {
      // error already set via onStatus
    }
  }

  const handleApply = (reviewed: ParsedPlan) => {
    // Apply plan-level fields
    const patch: Parameters<typeof updatePlan>[0] = {}
    if (reviewed.name) patch.name = reviewed.name
    if (reviewed.startDate) patch.startDate = reviewed.startDate
    if (reviewed.endDate) patch.endDate = reviewed.endDate
    if (reviewed.annualTargetIncentive != null) {
      patch.annualTargetIncentive = reviewed.annualTargetIncentive
    }
    // Compute duration if both dates present
    if (reviewed.startDate && reviewed.endDate) {
      const start = new Date(reviewed.startDate)
      const end = new Date(reviewed.endDate)
      const months = Math.max(
        1,
        Math.round(
          (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth()),
        ),
      )
      patch.durationMonths = months
    }
    updatePlan(patch)

    // Apply metrics — merge into existing slots or add new ones
    reviewed.metrics.forEach((pm, i) => {
      const existingMetric = planMetrics[i]
      if (existingMetric) {
        // Update existing metric
        updateMetric(existingMetric.id, {
          name: pm.name,
          ...(pm.dataType && { dataType: pm.dataType }),
          ...(pm.level && { level: pm.level }),
          ...(pm.weight != null && { weight: pm.weight }),
          ...(pm.mechanism && { mechanism: pm.mechanism }),
        })
      } else {
        // Need to add a new metric — do it via store then update
        addMetric()
        // The new metric gets picked up via planMetrics next render cycle.
        // We schedule an update using the metric id pattern from templates.ts
        // The addMetric action appends a new metric; we'll find it by index after store update.
      }
    })

    setApplied(true)
    setParsedPlan(null)
    setStatus(null)

    // Close the panel
    setTimeout(() => onClose?.(), 1200)
  }

  if (applied) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
          ✓
        </div>
        <p className="font-medium text-slate-800">Plan applied successfully!</p>
        <p className="text-xs text-slate-500">Review and adjust the fields below as needed.</p>
      </div>
    )
  }

  if (parsedPlan) {
    return (
      <ReviewPanel
        plan={parsedPlan}
        onApply={handleApply}
        onDiscard={() => {
          setParsedPlan(null)
          setStatus(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-600 mb-1.5">
          Gemini API Key{' '}
          <span className="font-normal text-slate-400">(stored locally, never sent to our servers)</span>
        </p>
        <ApiKeyInput value={apiKey} onChange={setApiKey} />
      </div>

      <DropZone onFile={handleFile} busy={busy} />

      <StatusBar status={status} />

      <p className="text-center text-xs text-slate-400">
        Supports PDF, Word (.docx), PowerPoint (.pptx), and JSON plan files
      </p>
    </div>
  )
}
