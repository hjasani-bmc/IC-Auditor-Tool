/**
 * Attainment roll-up helpers.
 *
 * Attainment is computed as summed-actuals / summed-goals at the metric's
 * measurement level. Every territory in a group inherits that group's
 * attainment (e.g. a Nation-level metric assigns the same Nation attainment to
 * every territory).
 */
import type { DataRow, MeasurementLevel, Territory } from '../domain/types'

/** The grouping key for a territory at a given measurement level. */
export function groupKeyFor(t: Territory, level: MeasurementLevel): string {
  switch (level) {
    case 'Territory':
      return t.territoryId
    case 'Area':
      return t.areaId
    case 'Nation':
      return 'NATION'
  }
}

function sumByGroup(rows: DataRow[], level: MeasurementLevel): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of rows) {
    const k = groupKeyFor(r, level)
    out.set(k, (out.get(k) ?? 0) + r.value)
  }
  return out
}

/**
 * Attainment fraction per group at the given level.
 * Divide-by-zero is guarded: a zero/absent goal yields 0 attainment (never
 * NaN/Infinity). Goals of zero are rejected at upload, but the engine must
 * still never produce a non-finite number.
 */
export function attainmentByGroup(
  actuals: DataRow[],
  goals: DataRow[],
  level: MeasurementLevel,
): Map<string, number> {
  const actualSum = sumByGroup(actuals, level)
  const goalSum = sumByGroup(goals, level)
  const out = new Map<string, number>()
  const keys = new Set<string>([...actualSum.keys(), ...goalSum.keys()])
  for (const k of keys) {
    const a = actualSum.get(k) ?? 0
    const g = goalSum.get(k) ?? 0
    out.set(k, g !== 0 ? a / g : 0)
  }
  return out
}

/** Sum of a value column per group at the given level. */
export function valueByGroup(
  rows: DataRow[],
  level: MeasurementLevel,
): Map<string, number> {
  return sumByGroup(rows, level)
}

/** Group the rows themselves by level (used for ranking & averaging). */
export function rowsByGroup(
  rows: DataRow[],
  level: MeasurementLevel,
): Map<string, DataRow[]> {
  const out = new Map<string, DataRow[]>()
  for (const r of rows) {
    const k = groupKeyFor(r, level)
    const arr = out.get(k)
    if (arr) arr.push(r)
    else out.set(k, [r])
  }
  return out
}
