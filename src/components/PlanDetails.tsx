import { useStore } from '../state/store'
import { proratedTargetIncentive } from '../engine'
import { endDateFromDuration, monthsBetween } from '../lib/dates'
import { formatCurrency } from '../lib/format'
import { Field, Section } from './ui'
import { NumberInput } from './inputs'

export function PlanDetails() {
  const plan = useStore((s) => s.plan)
  const updatePlan = useStore((s) => s.updatePlan)

  const prorated = proratedTargetIncentive(
    plan.annualTargetIncentive,
    plan.durationMonths,
  )
  const needsStartDate = !plan.startDate && plan.durationMonths > 0

  const onStartChange = (startDate: string) => {
    const patch: Partial<typeof plan> = { startDate: startDate || null }
    if (startDate && plan.endDate) {
      patch.durationMonths = monthsBetween(startDate, plan.endDate)
    } else if (startDate && plan.durationMonths > 0) {
      patch.endDate = endDateFromDuration(startDate, plan.durationMonths)
    }
    updatePlan(patch)
  }

  const onEndChange = (endDate: string) => {
    const patch: Partial<typeof plan> = { endDate: endDate || null }
    if (plan.startDate && endDate) {
      patch.durationMonths = monthsBetween(plan.startDate, endDate)
    }
    updatePlan(patch)
  }

  const onDurationChange = (months: number) => {
    const patch: Partial<typeof plan> = { durationMonths: Math.max(0, Math.round(months)) }
    if (plan.startDate) {
      patch.endDate = endDateFromDuration(plan.startDate, patch.durationMonths!)
    } else {
      patch.endDate = null
    }
    updatePlan(patch)
  }

  return (
    <Section title="Plan Details" description="Define the plan period and target incentive.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Plan name">
          <input
            className="input"
            value={plan.name}
            onChange={(e) => updatePlan({ name: e.target.value })}
          />
        </Field>
        <Field label="Annual target incentive" hint="Default $60,000 for a 12-month plan.">
          <NumberInput
            prefix="$"
            value={plan.annualTargetIncentive}
            step={1000}
            onChange={(v) => updatePlan({ annualTargetIncentive: v })}
          />
        </Field>
        <Field label="Start date" hint="Enter dates, or a duration below.">
          <input
            type="date"
            className="input"
            value={plan.startDate ?? ''}
            onChange={(e) => onStartChange(e.target.value)}
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            className="input"
            value={plan.endDate ?? ''}
            onChange={(e) => onEndChange(e.target.value)}
          />
        </Field>
        <Field label="Duration (months)" hint="Auto-fills from dates; or set it directly.">
          <NumberInput
            value={plan.durationMonths}
            min={1}
            step={1}
            onChange={(v) => onDurationChange(v)}
          />
        </Field>
        <div className="flex flex-col justify-end">
          <div className="rounded-lg bg-brand-50 px-4 py-3">
            <div className="text-xs font-medium text-brand-700">
              Pro-rated target incentive / rep
            </div>
            <div className="text-2xl font-semibold text-brand-900">
              {formatCurrency(prorated)}
            </div>
            <div className="text-xs text-brand-600">
              {formatCurrency(plan.annualTargetIncentive)} × {plan.durationMonths}/12
            </div>
          </div>
        </div>
      </div>

      {needsStartDate && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A duration is set but no start date. Please choose a <strong>start date</strong> so
          the plan period and end date can be determined.
        </div>
      )}
    </Section>
  )
}
