/**
 * Dataset validation (requirements 5.4). Maps uploaded columns to the schema,
 * validates every row, and returns the valid rows plus per-row issues. Invalid
 * rows are excluded from the result but always reported — never silently dropped.
 */
import type { DataRow, MetricDataType } from '../domain/types'
import {
  HIERARCHY_COLUMNS,
  type DatasetDescriptor,
} from './datasets'
import type { ParsedFile, RawRecord } from './parse'

export interface RowIssue {
  /** 1-based spreadsheet row (accounts for the header row). */
  row: number
  territoryId?: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  validRows: DataRow[]
  errors: RowIssue[]
  warnings: RowIssue[]
  /** Schema columns that could not be located in the file. */
  missingColumns: string[]
  totalRows: number
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Find the actual header matching any alias (normalized, order-sensitive). */
function matchHeader(headers: string[], aliases: string[]): string | undefined {
  const normalized = new Map(headers.map((h) => [norm(h), h]))
  for (const alias of aliases) {
    const hit = normalized.get(norm(alias))
    if (hit) return hit
  }
  return undefined
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const cleaned = String(value).replace(/[$,\s%]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function validateDataset(
  parsed: ParsedFile,
  descriptor: DatasetDescriptor,
): ValidationResult {
  const errors: RowIssue[] = []
  const warnings: RowIssue[] = []
  const missingColumns: string[] = []

  // Resolve hierarchy + value columns.
  const colMap = new Map<string, string>()
  for (const hc of HIERARCHY_COLUMNS) {
    const hit = matchHeader(parsed.headers, hc.aliases)
    if (hit) colMap.set(hc.field, hit)
    else if (hc.field === 'territoryId') missingColumns.push('Territory ID')
  }
  const valueCol = matchHeader(parsed.headers, descriptor.valueAliases)
  if (!valueCol) missingColumns.push(descriptor.valueLabel)

  // Territory ID and the value column are mandatory; without them, abort.
  if (missingColumns.length > 0) {
    return {
      ok: false,
      validRows: [],
      errors,
      warnings,
      missingColumns,
      totalRows: parsed.rows.length,
    }
  }

  // Past the guard above, the value column is guaranteed present.
  const valueColumn = valueCol as string

  const get = (rec: RawRecord, field: string): string =>
    String(rec[colMap.get(field) ?? ''] ?? '').trim()

  const seen = new Set<string>()
  const validRows: DataRow[] = []
  const isGoal = descriptor.kind === 'goals'
  const isMbo = descriptor.kind === 'actuals' && descriptor.dataType === 'MBORating'

  parsed.rows.forEach((rec, i) => {
    const rowNum = i + 2 // header is row 1
    const territoryId = get(rec, 'territoryId')

    if (!territoryId) {
      errors.push({ row: rowNum, message: 'Missing Territory ID.' })
      return
    }
    if (seen.has(territoryId)) {
      errors.push({
        row: rowNum,
        territoryId,
        message: `Duplicate Territory ID "${territoryId}" — row skipped.`,
      })
      return
    }

    const value = toNumber(rec[valueColumn])
    if (value === null) {
      errors.push({
        row: rowNum,
        territoryId,
        message: `${descriptor.valueLabel} is missing or not numeric.`,
      })
      return
    }
    if (isGoal && value <= 0) {
      errors.push({
        row: rowNum,
        territoryId,
        message: 'Goal must be greater than zero (prevents divide-by-zero).',
      })
      return
    }
    if (isMbo && (value < 1 || value > 5)) {
      errors.push({
        row: rowNum,
        territoryId,
        message: `MBO rating ${value} is outside the valid range 1–5.`,
      })
      return
    }

    // Warn on (but keep) missing hierarchy display fields.
    for (const hc of HIERARCHY_COLUMNS) {
      if (hc.field === 'territoryId') continue
      if (!colMap.has(hc.field) || !get(rec, hc.field)) {
        warnings.push({
          row: rowNum,
          territoryId,
          message: `Missing ${hc.field}; defaulted to blank.`,
        })
      }
    }

    seen.add(territoryId)
    validRows.push({
      territoryId,
      territoryName: get(rec, 'territoryName') || territoryId,
      areaId: get(rec, 'areaId'),
      areaName: get(rec, 'areaName'),
      regionId: get(rec, 'regionId'),
      regionName: get(rec, 'regionName'),
      value: isMbo ? Math.round(value) : value,
    })
  })

  return {
    ok: errors.length === 0,
    validRows,
    errors,
    warnings,
    missingColumns,
    totalRows: parsed.rows.length,
  }
}

/** Convenience: dataset descriptor lookup result keyed for store use. */
export interface LoadedDataset {
  dataType: MetricDataType
  rows: DataRow[]
}
