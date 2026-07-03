/**
 * Single in-session store (Zustand): holds the plan and all datasets, plus the
 * actions that mutate them. Components select the slices they need; the engine
 * is recomputed reactively in `useEngine` whenever plan or data changes.
 *
 * v1 keeps everything in memory only — no persistence. A reload reseeds.
 */
import { create } from 'zustand'
import type {
  DataRow,
  EligibilityEntry,
  MechanismType,
  Metric,
  MetricDataType,
  Plan,
  Territory,
} from '../domain/types'
import { makeDefaultPlan } from '../data/defaultPlan'
import { makeMetric, withMechanismDefaults } from '../data/templates'
import {
  demoActuals,
  demoGoals,
  demoTerritories,
} from '../data/demoData'
import { deriveTerritories } from '../data/territories'
import type { DatasetKind } from '../data/datasets'

export type DatasetSource = 'seed' | 'upload' | 'manual'

export interface DatasetMeta {
  source: DatasetSource
  fileName?: string
  rowCount: number
  errorCount: number
  warningCount: number
}

type DatasetMap = Partial<Record<MetricDataType, DataRow[]>>
type MetaMap = Partial<Record<MetricDataType, DatasetMeta>>

export interface AppState {
  plan: Plan
  territories: Territory[]
  actuals: DatasetMap
  goals: DatasetMap
  meta: { actuals: MetaMap; goals: MetaMap }
  /** Per-territory eligibility/LOA, keyed by territoryId (empty = none uploaded). */
  eligibility: Record<string, EligibilityEntry>
  eligibilityMeta?: DatasetMeta

  // --- Plan detail actions ---
  updatePlan: (patch: Partial<Plan>) => void
  addMetric: () => void
  updateMetric: (id: string, patch: Partial<Metric>) => void
  changeMechanism: (id: string, mechanism: MechanismType) => void
  removeMetric: (id: string) => void

  // --- Data actions ---
  setDataset: (
    kind: DatasetKind,
    dataType: MetricDataType,
    rows: DataRow[],
    meta: DatasetMeta,
  ) => void
  updateCell: (
    kind: DatasetKind,
    dataType: MetricDataType,
    territoryId: string,
    value: number,
  ) => void
  clearDataset: (kind: DatasetKind, dataType: MetricDataType) => void
  setEligibility: (
    entries: Record<string, EligibilityEntry>,
    meta: DatasetMeta,
  ) => void
  clearEligibility: () => void
  resetToDemo: () => void
}

function seededMeta(rows: DataRow[]): DatasetMeta {
  return { source: 'seed', rowCount: rows.length, errorCount: 0, warningCount: 0 }
}

function buildSeedMeta(map: DatasetMap): MetaMap {
  const out: MetaMap = {}
  for (const key of Object.keys(map) as MetricDataType[]) {
    out[key] = seededMeta(map[key] ?? [])
  }
  return out
}

function initialState() {
  const actuals = structuredClone(demoActuals)
  const goals = structuredClone(demoGoals)
  return {
    plan: makeDefaultPlan(),
    territories: structuredClone(demoTerritories),
    actuals,
    goals,
    meta: { actuals: buildSeedMeta(actuals), goals: buildSeedMeta(goals) },
    eligibility: {} as Record<string, EligibilityEntry>,
    eligibilityMeta: undefined as DatasetMeta | undefined,
  }
}

export const useStore = create<AppState>((set) => ({
  ...initialState(),

  updatePlan: (patch) =>
    set((s) => ({ plan: { ...s.plan, ...patch } })),

  addMetric: () =>
    set((s) => {
      if (s.plan.metrics.length >= 5) return s
      return { plan: { ...s.plan, metrics: [...s.plan.metrics, makeMetric()] } }
    }),

  updateMetric: (id, patch) =>
    set((s) => ({
      plan: {
        ...s.plan,
        metrics: s.plan.metrics.map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        ),
      },
    })),

  changeMechanism: (id, mechanism) =>
    set((s) => ({
      plan: {
        ...s.plan,
        metrics: s.plan.metrics.map((m) =>
          m.id === id ? withMechanismDefaults(m, mechanism) : m,
        ),
      },
    })),

  removeMetric: (id) =>
    set((s) => ({
      plan: {
        ...s.plan,
        metrics: s.plan.metrics.filter((m) => m.id !== id),
      },
    })),

  setDataset: (kind, dataType, rows, meta) =>
    set((s) => {
      const next = { ...s[kind], [dataType]: rows }
      const nextActuals = kind === 'actuals' ? next : s.actuals
      const nextGoals = kind === 'goals' ? next : s.goals
      return {
        [kind]: next,
        territories: deriveTerritories(nextActuals, nextGoals),
        meta: {
          ...s.meta,
          [kind]: { ...s.meta[kind], [dataType]: meta },
        },
      } as Partial<AppState>
    }),

  updateCell: (kind, dataType, territoryId, value) =>
    set((s) => {
      const rows = s[kind][dataType]
      if (!rows) return s
      const updated = rows.map((r) =>
        r.territoryId === territoryId ? { ...r, value } : r,
      )
      const prevMeta =
        s.meta[kind][dataType] ??
        ({ source: 'manual', rowCount: updated.length, errorCount: 0, warningCount: 0 } as DatasetMeta)
      return {
        [kind]: { ...s[kind], [dataType]: updated },
        meta: {
          ...s.meta,
          [kind]: {
            ...s.meta[kind],
            [dataType]: { ...prevMeta, source: 'manual' },
          },
        },
      } as Partial<AppState>
    }),

  clearDataset: (kind, dataType) =>
    set((s) => {
      const next = { ...s[kind] }
      delete next[dataType]
      const nextMeta = { ...s.meta[kind] }
      delete nextMeta[dataType]
      const nextActuals = kind === 'actuals' ? next : s.actuals
      const nextGoals = kind === 'goals' ? next : s.goals
      return {
        [kind]: next,
        territories: deriveTerritories(nextActuals, nextGoals),
        meta: { ...s.meta, [kind]: nextMeta },
      } as Partial<AppState>
    }),

  setEligibility: (entries, meta) =>
    set(() => ({ eligibility: entries, eligibilityMeta: meta })),

  clearEligibility: () =>
    set(() => ({ eligibility: {}, eligibilityMeta: undefined })),

  resetToDemo: () => set(() => initialState()),
}))
