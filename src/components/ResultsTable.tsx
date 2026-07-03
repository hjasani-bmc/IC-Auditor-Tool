import { Fragment, useMemo, useState, type ReactNode } from 'react'
import type { PayoutResult, TerritoryPayout } from '../engine'
import { MECHANISM_LABELS, LEVEL_LABELS } from '../domain/labels'
import { formatCurrency, formatPercent, formatNumber } from '../lib/format'

type SortKey = 'territory' | 'area' | 'region' | 'totalPct' | 'totalDollars' | string
type SortDir = 'asc' | 'desc'

export function ResultsTable({
  result,
  eligibilityProvided = false,
}: {
  result: PayoutResult
  eligibilityProvided?: boolean
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('totalDollars')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)

  const metrics = result.territories[0]?.components ?? []

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = result.territories.filter((t) => {
      if (!q) return true
      return (
        t.territory.territoryId.toLowerCase().includes(q) ||
        t.territory.territoryName.toLowerCase().includes(q) ||
        t.territory.areaName.toLowerCase().includes(q) ||
        t.territory.regionName.toLowerCase().includes(q)
      )
    })
    const val = (t: TerritoryPayout): string | number => {
      switch (sortKey) {
        case 'territory':
          return t.territory.territoryName
        case 'area':
          return t.territory.areaName
        case 'region':
          return t.territory.regionName
        case 'totalPct':
          return t.totalPayoutFraction
        case 'elig':
          return t.eligibilityFraction
        case 'eligible':
          return t.eligiblePayoutFraction
        case 'totalDollars':
          return t.totalPayoutDollars
        default:
          return t.components.find((c) => c.metricId === sortKey)?.payoutFraction ?? 0
      }
    }
    return [...filtered].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [result.territories, query, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'territory' || key === 'area' || key === 'region' ? 'asc' : 'desc')
    }
  }

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')
  const Th = ({ k, children, right }: { k: SortKey; children: ReactNode; right?: boolean }) => (
    <th
      className={`cursor-pointer whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 ${
        right ? 'text-right' : 'text-left'
      }`}
      onClick={() => toggleSort(k)}
    >
      {children}
      {arrow(k)}
    </th>
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search territory, area, region…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="text-xs text-slate-400">{rows.length} territories</span>
      </div>

      <div className="max-h-[34rem] overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-2 py-2"></th>
              <Th k="territory">Territory</Th>
              <Th k="area">Area</Th>
              <Th k="region">Region</Th>
              {metrics.map((m) => (
                <Th key={m.metricId} k={m.metricId} right>
                  {m.metricName} %
                </Th>
              ))}
              <Th k="totalPct" right>
                Total %
              </Th>
              <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">LOA</th>
              <Th k="elig" right>
                Elig %
              </Th>
              <Th k="eligible" right>
                Eligible %
              </Th>
              <Th k="totalDollars" right>
                Final $
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((t) => {
              const isOpen = expanded === t.territory.territoryId
              const atOrAbove = t.totalPayoutFraction >= 1
              return (
                <Fragment key={t.territory.territoryId}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-700"
                        onClick={() => setExpanded(isOpen ? null : t.territory.territoryId)}
                        aria-label="Toggle breakdown"
                      >
                        {isOpen ? '▾' : '▸'}
                      </button>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="font-medium text-slate-700">{t.territory.territoryName}</div>
                      <div className="text-xs text-slate-400">{t.territory.territoryId}</div>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{t.territory.areaName}</td>
                    <td className="px-3 py-1.5 text-slate-600">{t.territory.regionName}</td>
                    {t.components.map((c) => (
                      <td key={c.metricId} className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                        {formatPercent(c.payoutFraction)}
                      </td>
                    ))}
                    <td
                      className={`px-3 py-1.5 text-right font-medium tabular-nums ${
                        atOrAbove ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {formatPercent(t.totalPayoutFraction)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {t.loaFlag ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          LOA
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td
                      className="px-3 py-1.5 text-right tabular-nums text-slate-600"
                      title={
                        eligibilityProvided && t.eligibilityDefaulted
                          ? 'Defaulted to 100% (territory missing from eligibility file)'
                          : undefined
                      }
                    >
                      {formatPercent(t.eligibilityFraction, 0)}
                      {eligibilityProvided && t.eligibilityDefaulted && (
                        <span className="ml-0.5 text-amber-500">*</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                      {formatPercent(t.eligiblePayoutFraction)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-slate-800">
                      {formatCurrency(t.totalPayoutDollars)}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-slate-50/70">
                      <td></td>
                      <td colSpan={8 + metrics.length} className="px-4 py-3">
                        <BreakdownTable payout={t} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BreakdownTable({ payout }: { payout: TerritoryPayout }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-1.5 text-left">Metric</th>
            <th className="px-3 py-1.5 text-left">Level</th>
            <th className="px-3 py-1.5 text-left">Mechanism</th>
            <th className="px-3 py-1.5 text-right">Attainment</th>
            <th className="px-3 py-1.5 text-right">Basis</th>
            <th className="px-3 py-1.5 text-right">Weight</th>
            <th className="px-3 py-1.5 text-right">Payout %</th>
            <th className="px-3 py-1.5 text-right">Weighted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payout.components.map((c) => (
            <tr key={c.metricId}>
              <td className="px-3 py-1.5 font-medium text-slate-700">{c.metricName}</td>
              <td className="px-3 py-1.5 text-slate-500">{LEVEL_LABELS[c.level]}</td>
              <td className="px-3 py-1.5 text-slate-500">{MECHANISM_LABELS[c.mechanism]}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {c.attainment === null ? '—' : formatPercent(c.attainment)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {c.rank !== null ? `rank ${c.rank}` : c.basisValue === null ? '—' : formatNumber(c.basisValue)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">{c.weight}%</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatPercent(c.payoutFraction)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                {formatPercent(c.weightedContribution)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 font-medium">
            <td className="px-3 py-1.5 text-slate-700" colSpan={6}>
              Total payout % (pre-eligibility)
            </td>
            <td className="px-3 py-1.5 text-right tabular-nums">{formatPercent(payout.totalPayoutFraction)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
              {formatCurrency(payout.preEligibilityDollars)}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-1.5 text-slate-500" colSpan={6}>
              Eligibility %{payout.eligibilityDefaulted ? ' (defaulted to 100%)' : payout.loaFlag ? ' · on LOA' : ''}
            </td>
            <td className="px-3 py-1.5 text-right tabular-nums" colSpan={2}>
              {formatPercent(payout.eligibilityFraction)}
            </td>
          </tr>
          <tr className="border-t border-slate-200 font-semibold">
            <td className="px-3 py-1.5 text-slate-700" colSpan={6}>
              Eligible % → Final $
            </td>
            <td className="px-3 py-1.5 text-right tabular-nums">{formatPercent(payout.eligiblePayoutFraction)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums text-slate-800">
              {formatCurrency(payout.totalPayoutDollars)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
