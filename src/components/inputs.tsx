/**
 * Numeric input controls. They keep a local string while editing so users can
 * type freely (including intermediate states like "1." or ""), committing a
 * parsed number on change.
 */
import { useEffect, useState } from 'react'

interface BaseProps {
  className?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  id?: string
}

/** Plain number input bound to a numeric value. */
export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  ...base
}: BaseProps & {
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
}) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  const commit = (raw: string) => {
    setText(raw)
    const n = Number(raw)
    if (raw.trim() !== '' && Number.isFinite(n)) onChange(n)
  }

  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {prefix}
        </span>
      )}
      <input
        type="number"
        className={`input ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''} ${
          base.className ?? ''
        }`}
        value={text}
        disabled={base.disabled}
        min={base.min}
        max={base.max}
        step={base.step}
        id={base.id}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          setText(String(value))
        }}
        onChange={(e) => commit(e.target.value)}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  )
}

/** Percent input: displays a fraction as a percentage and reports a fraction. */
export function PercentInput({
  value,
  onChange,
  ...base
}: BaseProps & {
  value: number
  onChange: (fraction: number) => void
}) {
  const asPercent = Math.round(value * 1000) / 10
  return (
    <NumberInput
      {...base}
      suffix="%"
      value={asPercent}
      onChange={(pct) => onChange(pct / 100)}
    />
  )
}
