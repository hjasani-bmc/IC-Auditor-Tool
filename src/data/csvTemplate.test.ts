import { describe, it, expect } from 'vitest'
import { buildCreditedTemplate, buildDatasetTemplate } from './csvTemplate'
import { parseFile } from './parse'
import { validateDataset } from './validate'
import { DATASET_DESCRIPTORS, findDescriptor } from './datasets'
import { aggregateCreditedSales, isCreditedSalesFormat } from './creditedSales'

const fileFrom = (csv: string) => new File([csv], 't.csv', { type: 'text/csv' })

describe('dataset CSV templates round-trip through the validator', () => {
  for (const d of DATASET_DESCRIPTORS) {
    it(`${d.kind}/${d.dataType} template validates cleanly`, async () => {
      const csv = buildDatasetTemplate(d)
      const parsed = await parseFile(fileFrom(csv))
      const result = validateDataset(parsed, findDescriptor(d.kind, d.dataType)!)
      expect(result.missingColumns).toEqual([])
      expect(result.errors).toEqual([])
      expect(result.validRows).toHaveLength(3)
    })
  }
})

describe('credited-sales template', () => {
  it('matches the credited importer format and aggregates', async () => {
    const parsed = await parseFile(fileFrom(buildCreditedTemplate()))
    expect(isCreditedSalesFormat(parsed.headers)).toBe(true)
    const agg = aggregateCreditedSales(parsed.headers, parsed.rows)
    expect(agg.byTerritory.get('T0001')).toBeCloseTo(1580.5, 6)
    expect(agg.byTerritory.get('T0002')).toBe(940)
  })
})
