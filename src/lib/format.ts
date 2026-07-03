/** Shared formatting helpers for currency and percentages. */

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const currencyFmtCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFmt = new Intl.NumberFormat('en-US')

/** Format a dollar amount, e.g. 1344863 -> "$1,344,863". */
export function formatCurrency(value: number, cents = false): string {
  if (!Number.isFinite(value)) return '—'
  return (cents ? currencyFmtCents : currencyFmt).format(value)
}

/** Format a fraction as a percentage, e.g. 0.882 -> "88.2%". */
export function formatPercent(fraction: number, decimals = 1): string {
  if (!Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(decimals)}%`
}

/** Format a plain number with thousands separators. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return numberFmt.format(value)
}
