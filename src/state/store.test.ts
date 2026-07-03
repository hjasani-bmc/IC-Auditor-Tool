import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'

const reset = () => useStore.getState().resetToDemo()

describe('store', () => {
  beforeEach(reset)

  it('seeds the default plan and demo datasets', () => {
    const s = useStore.getState()
    expect(s.plan.metrics).toHaveLength(3)
    expect(s.territories).toHaveLength(60)
    expect(s.actuals.SalesUnits).toHaveLength(60)
    expect(s.meta.actuals.SalesUnits?.source).toBe('seed')
  })

  it('caps metrics at five', () => {
    const { addMetric } = useStore.getState()
    for (let i = 0; i < 10; i++) addMetric()
    expect(useStore.getState().plan.metrics).toHaveLength(5)
  })

  it('changeMechanism swaps in the right default config block', () => {
    const id = useStore.getState().plan.metrics[0].id
    useStore.getState().changeMechanism(id, 'Grid')
    const m = useStore.getState().plan.metrics.find((x) => x.id === id)!
    expect(m.mechanism).toBe('Grid')
    expect(m.grid).toBeDefined()
    expect(m.curve).toBeUndefined()
  })

  it('updateCell edits a value and marks the dataset manual', () => {
    const first = useStore.getState().actuals.SalesUnits![0].territoryId
    useStore.getState().updateCell('actuals', 'SalesUnits', first, 999)
    const s = useStore.getState()
    expect(s.actuals.SalesUnits!.find((r) => r.territoryId === first)!.value).toBe(999)
    expect(s.meta.actuals.SalesUnits?.source).toBe('manual')
  })

  it('setDataset replaces rows and re-derives territories', () => {
    useStore.getState().setDataset(
      'actuals',
      'SalesUnits',
      [
        {
          territoryId: 'NEW1',
          territoryName: 'New Terr',
          areaId: 'AR01',
          areaName: 'East 1',
          regionId: 'RGN-E',
          regionName: 'East',
          value: 5,
        },
      ],
      { source: 'upload', fileName: 'x.csv', rowCount: 1, errorCount: 0, warningCount: 0 },
    )
    const s = useStore.getState()
    expect(s.actuals.SalesUnits).toHaveLength(1)
    expect(s.territories.some((t) => t.territoryId === 'NEW1')).toBe(true)
    expect(s.meta.actuals.SalesUnits?.source).toBe('upload')
  })

  it('resetToDemo restores the seeded state', () => {
    useStore.getState().removeMetric(useStore.getState().plan.metrics[0].id)
    expect(useStore.getState().plan.metrics).toHaveLength(2)
    reset()
    expect(useStore.getState().plan.metrics).toHaveLength(3)
  })
})
