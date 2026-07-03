import { describe, it, expect } from 'vitest'
import { parseFile, isAcceptedFile } from './parse'

describe('parseFile', () => {
  it('accepts xlsx and csv, rejects others', () => {
    expect(isAcceptedFile('data.xlsx')).toBe(true)
    expect(isAcceptedFile('data.CSV')).toBe(true)
    expect(isAcceptedFile('data.txt')).toBe(false)
  })

  it('parses a CSV file into header-keyed records', async () => {
    const csv =
      'Territory ID,Credited Units\nT1,100\nT2,250\n'
    const file = new File([csv], 'actuals.csv', { type: 'text/csv' })
    const parsed = await parseFile(file)
    expect(parsed.headers).toEqual(['Territory ID', 'Credited Units'])
    expect(parsed.rows).toHaveLength(2)
    expect(parsed.rows[0]).toMatchObject({ 'Territory ID': 'T1', 'Credited Units': 100 })
  })

  it('skips blank rows', async () => {
    const csv = 'Territory ID,Value\nT1,1\n\n\nT2,2\n'
    const file = new File([csv], 'x.csv', { type: 'text/csv' })
    const parsed = await parseFile(file)
    expect(parsed.rows).toHaveLength(2)
  })
})
