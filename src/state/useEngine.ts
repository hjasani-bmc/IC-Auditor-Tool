/**
 * Reactive bridge between the store and the pure engine. Recomputes payouts,
 * summary, and validation whenever the plan or datasets change (memoized, so
 * unrelated renders don't recompute). This is the single place the UI reads
 * calculated results from.
 */
import { useMemo } from 'react'
import { useStore } from './store'
import {
  calculatePayouts,
  summarize,
  validatePlan,
  type EngineData,
  type PayoutResult,
  type Summary,
  type PlanValidation,
} from '../engine'

export interface EngineOutput {
  validation: PlanValidation
  result: PayoutResult | null
  summary: Summary | null
}

export function useEngine(): EngineOutput {
  const plan = useStore((s) => s.plan)
  const territories = useStore((s) => s.territories)
  const actuals = useStore((s) => s.actuals)
  const goals = useStore((s) => s.goals)
  const eligibility = useStore((s) => s.eligibility)

  return useMemo<EngineOutput>(() => {
    const validation = validatePlan(plan)
    if (!validation.canCalculate || territories.length === 0) {
      return { validation, result: null, summary: null }
    }
    const data: EngineData = { territories, actuals, goals, eligibility }
    const result = calculatePayouts(plan, data)
    return { validation, result, summary: summarize(result) }
  }, [plan, territories, actuals, goals, eligibility])
}
