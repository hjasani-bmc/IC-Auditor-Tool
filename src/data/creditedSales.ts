/**
 * Credited-sales importer.
 *
 * The credited sales file (Credited_sales_data.xlsx) is account-level: many
 * rows per territory, joined on `credited_territory`, with the actual in
 * `final_credited_units`. This module aggregates units by territory and joins
 * to the known territory hierarchy, reporting any credited rows that match no
 * territory and any territories with no credited data (seeded/treated as 0).
 */
import type { DataRow, Territory } from '../domain/types'
import { parseFile, type RawRecord } from './parse'
import type { RowIssue, ValidationResult } from './validate'

// Specific to the account-level credited file so a plain per-territory Sales
// Units file (Territory ID + Credited Units) is NOT mistaken for this format
// and falls back to the standard validator.
const TERRITORY_ALIASES = ['credited_territory', 'credited territory']
const VALUE_ALIASES = ['final_credited_units', 'final credited units']

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function matchHeader(headers: string[], aliases: string[]): string | undefined {
  const map = new Map(headers.map((h) => [norm(h), h]))
  for (const a of aliases) {
    const hit = map.get(norm(a))
    if (hit) return hit
  }
  return undefined
}

/** True if a parsed file looks like the account-level credited-sales format. */
export function isCreditedSalesFormat(headers: string[]): boolean {
  return (
    !!matchHeader(headers, TERRITORY_ALIASES) &&
    !!matchHeader(headers, VALUE_ALIASES)
  )
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const cleaned = String(v).replace(/[$,\s%]/g, '')
  if (cleaned === '' || cleaned.toUpperCase() === 'N/A' || cleaned === '#N/A') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export interface CreditedAggregation {
  /** territoryId -> summed final_credited_units. */
  byTerritory: Map<string, number>
  /** rows whose value could not be parsed (counted, not summed). */
  unparsedValueRows: number
}

export function aggregateCreditedSales(
  headers: string[],
  rows: RawRecord[],
): CreditedAggregation {
  const terrCol = matchHeader(headers, TERRITORY_ALIASES)
  const valCol = matchHeader(headers, VALUE_ALIASES)
  const byTerritory = new Map<string, number>()
  let unparsedValueRows = 0
  if (!terrCol || !valCol) return { byTerritory, unparsedValueRows }

  for (const rec of rows) {
    const id = String(rec[terrCol] ?? '').trim()
    if (!id) continue
    const n = toNumber(rec[valCol])
    if (n === null) {
      unparsedValueRows += 1
      continue
    }
    byTerritory.set(id, (byTerritory.get(id) ?? 0) + n)
  }
  return { byTerritory, unparsedValueRows }
}

export interface CreditedJoin {
  rows: DataRow[]
  /** credited_territory values present in the file but not in the hierarchy. */
  unmatchedCreditedTerritories: string[]
  /** territories with no credited row (value treated as 0). */
  territoriesWithoutCredit: string[]
}

export function joinCreditedSales(
  agg: CreditedAggregation,
  territories: Territory[],
): CreditedJoin {
  const known = new Set(territories.map((t) => t.territoryId))
  const rows: DataRow[] = territories.map((t) => ({
    ...t,
    value: agg.byTerritory.get(t.territoryId) ?? 0,
  }))
  const unmatchedCreditedTerritories = [...agg.byTerritory.keys()]
    .filter((id) => !known.has(id))
    .sort()
  const territoriesWithoutCredit = territories
    .filter((t) => !agg.byTerritory.has(t.territoryId))
    .map((t) => t.territoryId)
    .sort()
  return { rows, unmatchedCreditedTerritories, territoriesWithoutCredit }
}

/**
 * Parse + aggregate + join a credited-sales file, returning a ValidationResult
 * shape so the existing upload UI can render it. Unmatched credited rows and
 * territories-without-credit are surfaced as warnings (not hidden).
 */
export async function processCreditedUpload(
  file: File,
  territories: Territory[],
): Promise<ValidationResult> {
  const parsed = await parseFile(file)
  if (!isCreditedSalesFormat(parsed.headers)) {
    return {
      ok: false,
      validRows: [],
      errors: [],
      warnings: [],
      missingColumns: ['credited_territory', 'final_credited_units'],
      totalRows: parsed.rows.length,
    }
  }

  const agg = aggregateCreditedSales(parsed.headers, parsed.rows)
  const join = joinCreditedSales(agg, territories)

  const warnings: RowIssue[] = []
  for (const id of join.unmatchedCreditedTerritories) {
    warnings.push({ row: 0, territoryId: id, message: `credited_territory "${id}" matched no known territory — its units were not credited.` })
  }
  for (const id of join.territoriesWithoutCredit) {
    warnings.push({ row: 0, territoryId: id, message: `Territory "${id}" had no credited row — credited units set to 0.` })
  }
  if (agg.unparsedValueRows > 0) {
    warnings.push({ row: 0, message: `${agg.unparsedValueRows} row(s) had a non-numeric final_credited_units and were skipped.` })
  }

  return {
    ok: true,
    validRows: join.rows,
    errors: [],
    warnings,
    missingColumns: [],
    totalRows: agg.byTerritory.size,
  }
}
