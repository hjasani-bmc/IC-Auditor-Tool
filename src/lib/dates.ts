/** Date helpers for plan period <-> duration conversion. */

/** Inclusive whole-month span between two ISO dates (yyyy-mm-dd). */
export function monthsBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO)
  const end = new Date(endISO)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  return Math.max(0, months)
}

/** End date = start + N months − 1 day, as an ISO date (yyyy-mm-dd). */
export function endDateFromDuration(startISO: string, months: number): string {
  const start = new Date(startISO)
  if (isNaN(start.getTime()) || months <= 0) return ''
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)
  end.setDate(end.getDate() - 1)
  return toISODate(end)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Format an ISO date for display, e.g. "01 Aug 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
