/**
 * Eligibility / LOA importer. The file is territory-level with three columns:
 * a territory key, an LOA flag (informational only), and an Eligibility %
 * (accepted as 0-100 or 0-1, stored as a 0-1 fraction). Eligibility is applied
 * as the final factor on payouts; LOA never drives the math.
 */
import type { EligibilityEntry, Territory } from '../domain/types'
import { parseFile, type RawRecord } from './parse'
import type { RowIssue } from './validate'

const TERRITORY_ALIASES = ['territory id', 'territory', 'territory_id', 'credited_territory', 'territorykey', 'territory key']
const LOA_ALIASES = ['loa flag', 'loa', 'leave of absence', 'loa_flag']
const ELIGIBILITY_ALIASES = ['eligibility %', 'eligibility', 'eligibility percent', 'eligibility_pct', 'eligibility pct']

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function matchHeader(headers: string[], aliases: string[]): string | undefined {
  const map = new Map(headers.map((h) => [norm(h), h]))
  for (const a of aliases) {
    const hit = map.get(norm(a))
    if (hit) return hit
  }
  return undefined
}

export function parseLoaFlag(v: unknown): boolean {
  const s = String(v ?? '').trim().toLowerCase()
  return ['y', 'yes', 'true', '1', 'loa', 't'].includes(s)
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const cleaned = String(v).replace(/[$,\s%]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/**
 * Accept 0-1 or 0-100 and return a 0-1 fraction (values > 1 are treated as
 * percent). Eligibility represents days-present ÷ total-days, so it can never
 * exceed 100% — the result is clamped to [0, 1] as a hard guarantee.
 */
export function normalizeEligibility(n: number): number {
  const frac = n > 1 ? n / 100 : n
  return Math.min(1, Math.max(0, frac))
}

export interface EligibilityImportResult {
  entries: Record<string, EligibilityEntry>
  validRows: number
  totalRows: number
  errors: RowIssue[]
  warnings: RowIssue[]
  missingColumns: string[]
  /** keys in the file not matching a known territory. */
  unmatchedKeys: string[]
  /** known territories missing from the file (default to 100%). */
  missingTerritories: string[]
}

export async function processEligibilityUpload(
  file: File,
  territories: Territory[],
): Promise<EligibilityImportResult> {
  const parsed = await parseFile(file)
  const errors: RowIssue[] = []
  const warnings: RowIssue[] = []
  const missingColumns: string[] = []

  const terrCol = matchHeader(parsed.headers, TERRITORY_ALIASES)
  const eligCol = matchHeader(parsed.headers, ELIGIBILITY_ALIASES)
  const loaCol = matchHeader(parsed.headers, LOA_ALIASES)
  if (!terrCol) missingColumns.push('Territory ID')
  if (!eligCol) missingColumns.push('Eligibility %')

  if (missingColumns.length > 0) {
    return {
      entries: {}, validRows: 0, totalRows: parsed.rows.length,
      errors, warnings, missingColumns, unmatchedKeys: [], missingTerritories: [],
    }
  }

  const known = new Set(territories.map((t) => t.territoryId))
  const entries: Record<string, EligibilityEntry> = {}
  const seen = new Set<string>()

  parsed.rows.forEach((rec: RawRecord, i) => {
    const rowNum = i + 2
    const id = String(rec[terrCol!] ?? '').trim()
    if (!id) {
      errors.push({ row: rowNum, message: 'Missing Territory ID.' })
      return
    }
    const raw = toNumber(rec[eligCol!])
    if (raw === null) {
      // Blank eligibility for a present row: default to 100% with a warning.
      warnings.push({ row: rowNum, territoryId: id, message: 'Blank eligibility — defaulted to 100%.' })
      entries[id] = { loa: parseLoaFlag(rec[loaCol ?? '']), eligibility: 1 }
      seen.add(id)
      return
    }
    if (raw < 0 || raw > 100) {
      errors.push({ row: rowNum, territoryId: id, message: `Eligibility ${raw} is outside 0–100%.` })
      return
    }
    entries[id] = {
      loa: loaCol ? parseLoaFlag(rec[loaCol]) : false,
      eligibility: normalizeEligibility(raw),
    }
    seen.add(id)
  })

  const unmatchedKeys = [...seen].filter((id) => !known.has(id)).sort()
  const missingTerritories = territories
    .filter((t) => !seen.has(t.territoryId))
    .map((t) => t.territoryId)
    .sort()

  for (const id of unmatchedKeys) {
    warnings.push({ row: 0, territoryId: id, message: `Eligibility key "${id}" matched no known territory.` })
  }
  if (missingTerritories.length > 0) {
    warnings.push({ row: 0, message: `${missingTerritories.length} territor${missingTerritories.length === 1 ? 'y' : 'ies'} missing from the file — defaulted to 100% eligibility.` })
  }

  return {
    entries,
    validRows: Object.keys(entries).length,
    totalRows: parsed.rows.length,
    errors,
    warnings,
    missingColumns: [],
    unmatchedKeys,
    missingTerritories,
  }
}
