import { useState } from 'react'
import type { MechanismType, Metric, MetricDataType, MeasurementLevel } from '../domain/types'
import {
  DATA_TYPES,
  DATA_TYPE_LABELS,
  LEVELS,
  LEVEL_LABELS,
  MECHANISMS,
  MECHANISM_LABELS,
} from '../domain/labels'
import { useStore } from '../state/store'
import { Badge, Field, Select, Toggle } from './ui'
import { NumberInput } from './inputs'
import { MechanismEditor } from './mechanisms'

export function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const updateMetric = useStore((s) => s.updateMetric)
  const changeMechanism = useStore((s) => s.changeMechanism)
  const removeMetric = useStore((s) => s.removeMetric)
  const [open, setOpen] = useState(false)

  const patch = (p: Partial<Metric>) => updateMetric(metric.id, p)

  return (
    <div className={`card p-4 ${metric.enabled ? '' : 'opacity-60'}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
          {index + 1}
        </span>
        <input
          className="input max-w-xs flex-1 font-medium"
          value={metric.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Metric name"
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {metric.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Toggle checked={metric.enabled} onChange={(v) => patch({ enabled: v })} label="Enable metric" />
          <button
            type="button"
            className="text-sm text-red-500 hover:underline"
            onClick={() => removeMetric(metric.id)}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Data type">
          <Select
            value={metric.dataType}
            onChange={(e) => patch({ dataType: e.target.value as MetricDataType })}
          >
            {DATA_TYPES.map((d) => (
              <option key={d} value={d}>
                {DATA_TYPE_LABELS[d]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Measurement level">
          <Select
            value={metric.level}
            onChange={(e) => patch({ level: e.target.value as MeasurementLevel })}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Weight">
          <NumberInput
            value={metric.weight}
            min={0}
            max={100}
            step={5}
            suffix="%"
            onChange={(v) => patch({ weight: v })}
          />
        </Field>
        <Field label="Payout mechanism">
          <Select
            value={metric.mechanism}
            onChange={(e) => changeMechanism(metric.id, e.target.value as MechanismType)}
          >
            {MECHANISMS.map((m) => (
              <option key={m} value={m}>
                {MECHANISM_LABELS[m]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide' : 'Configure'} {MECHANISM_LABELS[metric.mechanism]}
        </button>
        <Badge tone="brand">{MECHANISM_LABELS[metric.mechanism]}</Badge>
        {metric.curve?.templateName && <Badge tone="slate">{metric.curve.templateName}</Badge>}
      </div>

      {open && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <MechanismEditor metric={metric} onPatch={patch} />
        </div>
      )}
    </div>
  )
}
