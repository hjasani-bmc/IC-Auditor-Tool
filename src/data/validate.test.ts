import { describe, it, expect } from 'vitest'
import { validateDataset } from './validate'
import { findDescriptor } from './datasets'
import type { ParsedFile } from './parse'

const salesActuals = findDescriptor('actuals', 'SalesUnits')!
const salesGoals = findDescriptor('goals', 'SalesUnits')!
const mboActuals = findDescriptor('actuals', 'MBORating')!

function parsed(headers: string[], rows: Record<string, unknown>[]): ParsedFile {
  return { headers, rows: rows as ParsedFile['rows'] }
}

const HEADERS = [
  'Territory ID',
  'Territory Name',
  'Area ID',
  'Area Name',
  'Region ID',
  'Region Name',
  'Credited Units',
]

function row(id: string, value: unknown, over: Record<string, unknown> = {}) {
  return {
    'Territory ID': id,
    'Territory Name': `Name ${id}`,
    'Area ID': 'AR01',
    'Area Name': 'East 1',
    'Region ID': 'RGN-E',
    'Region Name': 'East',
    'Credited Units': value,
    ...over,
  }
}

describe('validateDataset', () => {
  it('loads valid rows and maps hierarchy + value columns', () => {
    const res = validateDataset(
      parsed(HEADERS, [row('T1', 100), row('T2', 200)]),
      salesActuals,
    )
    expect(res.ok).toBe(true)
    expect(res.validRows).toHaveLength(2)
    expect(res.validRows[0]).toMatchObject({ territoryId: 'T1', value: 100 })
  })

  it('reports missing required columns and aborts', () => {
    const res = validateDataset(
      parsed(['Territory Name', 'Credited Units'], [{ 'Credited Units': 1 }]),
      salesActuals,
    )
    expect(res.ok).toBe(false)
    expect(res.missingColumns).toContain('Territory ID')
  })

  it('flags non-numeric values but keeps other rows', () => {
    const res = validateDataset(
      parsed(HEADERS, [row('T1', 'abc'), row('T2', 50)]),
      salesActuals,
    )
    expect(res.validRows.map((r) => r.territoryId)).toEqual(['T2'])
    expect(res.errors).toHaveLength(1)
    expect(res.errors[0].message).toMatch(/numeric/i)
  })

  it('parses currency/thousands-formatted numbers', () => {
    const res = validateDataset(parsed(HEADERS, [row('T1', '$1,250')]), salesActuals)
    expect(res.validRows[0].value).toBe(1250)
  })

  it('rejects duplicate Territory IDs, keeping the first', () => {
    const res = validateDataset(
      parsed(HEADERS, [row('T1', 10), row('T1', 20)]),
      salesActuals,
    )
    expect(res.validRows).toHaveLength(1)
    expect(res.validRows[0].value).toBe(10)
    expect(res.errors[0].message).toMatch(/duplicate/i)
  })

  it('rejects zero or blank goals (divide-by-zero guard)', () => {
    const goalHeaders = HEADERS.slice(0, 6).concat('Sales Goal')
    const gRow = (id: string, v: unknown) => ({ ...row(id, 0), 'Sales Goal': v })
    const res = validateDataset(
      parsed(goalHeaders, [gRow('T1', 0), gRow('T2', 150)]),
      salesGoals,
    )
    expect(res.validRows.map((r) => r.territoryId)).toEqual(['T2'])
    expect(res.errors[0].message).toMatch(/greater than zero/i)
  })

  it('enforces MBO ratings within 1–5', () => {
    const mboHeaders = HEADERS.slice(0, 6).concat('MBO Rating')
    const mRow = (id: string, v: unknown) => ({ ...row(id, v), 'MBO Rating': v })
    const res = validateDataset(
      parsed(mboHeaders, [mRow('T1', 3), mRow('T2', 7), mRow('T3', 0)]),
      mboActuals,
    )
    expect(res.validRows.map((r) => r.territoryId)).toEqual(['T1'])
    expect(res.errors).toHaveLength(2)
  })

  it('matches headers case- and spacing-insensitively', () => {
    const headers = ['territory_id', 'CREDITED UNITS']
    const res = validateDataset(
      parsed(headers, [{ territory_id: 'T1', 'CREDITED UNITS': 99 }]),
      salesActuals,
    )
    expect(res.validRows[0]).toMatchObject({ territoryId: 'T1', value: 99 })
  })
})
