import type { ReactNode } from 'react'
import { useStore } from '../state/store'
import { useEngine } from '../state/useEngine'
import { ValidationBanner } from '../components/ValidationBanner'
import { PayoutByGroupChart, DistributionHistogram } from '../components/charts'
import { PageHeader, Section } from '../components/ui'
import { formatCurrency, formatNumber, formatPercent } from '../lib/format'
import type { GroupAggregate } from '../engine'

export function Dashboard() {
  const plan = useStore((s) => s.plan)
  const eligibilityProvided = useStore((s) => !!s.eligibilityMeta)
  const { validation, result, summary } = useEngine()

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`${plan.name} · summary & distribution`} />

      <ValidationBanner validation={validation} />

      {result && summary && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Kpi label="Total payout" value={formatCurrency(summary.totalPayout)} accent />
            <Kpi label="Target pool" value={formatCurrency(summary.totalTargetPool)} />
            <Kpi label="Payout vs pool" value={formatPercent(summary.payoutVsPool)} />
            <Kpi label="Avg payout %" value={formatPercent(summary.stats.avg)} />
            <Kpi label="Median payout %" value={formatPercent(summary.stats.median)} />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi label="Lowest payout %" value={formatPercent(summary.stats.min)} small />
            <Kpi label="Highest payout %" value={formatPercent(summary.stats.max)} small />
            <Kpi label="Reps < 100%" value={formatNumber(summary.stats.countBelow100)} small />
            <Kpi label="Reps ≥ 100%" value={formatNumber(summary.stats.countAtOrAbove100)} small />
          </div>

          {eligibilityProvided && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Kpi
                label="Pre-eligibility total"
                value={formatCurrency(summary.totalPreEligibility)}
                small
              />
              <Kpi
                label="Reduced by eligibility"
                value={formatCurrency(summary.dollarsReducedByEligibility)}
                small
              />
              <Kpi label="On LOA" value={formatNumber(summary.countOnLOA)} small />
              <Kpi
                label="Below 100% eligible"
                value={formatNumber(summary.countBelowFullEligibility)}
                small
              />
            </div>
          )}

          <Section title="Nation attainment by metric">
            <div className="flex flex-wrap gap-3">
              {result.nationAttainmentByMetric.map((m) => (
                <div key={m.metricId} className="rounded-lg bg-slate-50 px-4 py-2">
                  <div className="text-xs text-slate-500">{m.metricName}</div>
                  <div className="text-lg font-semibold text-slate-800">
                    {m.attainment === null ? 'n/a' : formatPercent(m.attainment)}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Total payout by Region">
              <PayoutByGroupChart data={summary.byRegion} />
            </Section>
            <Section title="Total payout by Area">
              <PayoutByGroupChart data={summary.byArea} />
            </Section>
          </div>

          <Section title="Payout % distribution across reps">
            <DistributionHistogram rows={result.territories} />
            <p className="mt-2 text-xs text-slate-400">
              Amber bars are below 100% of target; teal bars are at or above.
            </p>
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="By Region">
              <GroupTable groups={summary.byRegion} />
            </Section>
            <Section title="By Area">
              <GroupTable groups={summary.byArea} />
            </Section>
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({
  label,
  value,
  accent,
  small,
}: {
  label: string
  value: ReactNode
  accent?: boolean
  small?: boolean
}) {
  return (
    <div className={`card p-4 ${accent ? 'bg-brand-700 text-white' : ''}`}>
      <div className={`text-xs font-medium ${accent ? 'text-brand-100' : 'text-slate-500'}`}>
        {label}
      </div>
      <div className={`mt-1 font-semibold ${small ? 'text-lg' : 'text-2xl'}`}>{value}</div>
    </div>
  )
}

function GroupTable({ groups }: { groups: GroupAggregate[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium">Name</th>
            <th className="px-3 py-2 text-right text-xs font-medium">Territories</th>
            <th className="px-3 py-2 text-right text-xs font-medium">Total $</th>
            <th className="px-3 py-2 text-right text-xs font-medium">Avg %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groups.map((g) => (
            <tr key={g.key}>
              <td className="px-3 py-1.5 font-medium text-slate-700">{g.name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">{g.territoryCount}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-slate-800">
                {formatCurrency(g.totalDollars)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                {formatPercent(g.avgPayoutFraction)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
