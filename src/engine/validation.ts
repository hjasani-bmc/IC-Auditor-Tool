/**
 * Plan validation: pure checks that gate whether a calculation may run.
 * The UI surfaces these; the calculation should only run when `canCalculate`.
 */
import type { CurveConfig, Plan } from '../domain/types'

/**
 * Validate that a curve's tiers are ordered and contiguous: each tier's `from`
 * must equal the previous tier's `to`. Returns human-readable problems (empty
 * when valid). Used both by the editor (inline) and the calculation gate.
 */
export function validateCurveTiers(curve: CurveConfig): string[] {
  const issues: string[] = []
  const tiers = curve.tiers
  if (tiers.length === 0) {
    issues.push('Curve must have at least one tier.')
    return issues
  }
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]
    if (Number.isFinite(t.toAttainment) && t.toAttainment < t.fromAttainment) {
      issues.push(`Tier ${i + 1}: "to" must be greater than or equal to "from".`)
    }
    if (i > 0) {
      const prev = tiers[i - 1]
      if (Math.abs(t.fromAttainment - prev.toAttainment) > 1e-9) {
        issues.push(
          `Tier ${i + 1} is not contiguous: its "from" must equal tier ${i}'s "to".`,
        )
      }
    }
  }
  return issues
}

export interface PlanValidation {
  /** Sum of weights across enabled metrics (whole-number percent). */
  totalWeight: number
  weightsValid: boolean
  errors: string[]
  warnings: string[]
  canCalculate: boolean
}

const EPSILON = 1e-6

export function validatePlan(plan: Plan): PlanValidation {
  const errors: string[] = []
  const warnings: string[] = []

  const active = plan.metrics.filter((m) => m.enabled)
  const totalWeight = active.reduce((s, m) => s + m.weight, 0)
  const weightsValid = Math.abs(totalWeight - 100) < EPSILON

  if (active.length === 0) {
    errors.push('At least one metric must be enabled.')
  }
  if (!weightsValid) {
    errors.push(
      `Active metric weights must total exactly 100% (currently ${totalWeight}%).`,
    )
  }
  if (plan.durationMonths <= 0) {
    errors.push('Plan duration must be greater than zero months.')
  }
  if (plan.annualTargetIncentive <= 0) {
    errors.push('Annual target incentive must be greater than zero.')
  }
  for (const m of active) {
    if (m.weight < 0 || m.weight > 100) {
      errors.push(`Metric "${m.name}" weight must be between 0 and 100%.`)
    }
    if (m.mechanism === 'Curve' && m.curve) {
      for (const issue of validateCurveTiers(m.curve)) {
        errors.push(`Metric "${m.name}" — ${issue}`)
      }
    }
  }

  return {
    totalWeight,
    weightsValid,
    errors,
    warnings,
    canCalculate: errors.length === 0,
  }
}
