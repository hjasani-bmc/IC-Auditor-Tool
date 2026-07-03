import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { GroupAggregate, TerritoryPayout } from '../engine'
import { formatCurrency } from '../lib/format'

const BRAND = '#0d9488'

export function PayoutByGroupChart({ data }: { data: GroupAggregate[] }) {
  const chartData = data.map((g) => ({ name: g.name, value: g.totalDollars }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
        />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface Bin {
  label: string
  count: number
  atOrAbove: boolean
}

function buildHistogram(rows: TerritoryPayout[]): Bin[] {
  const fractions = rows.map((r) => r.totalPayoutFraction)
  if (fractions.length === 0) return []
  const max = Math.max(...fractions, 1)
  const width = 0.1
  const top = Math.ceil(max / width) * width
  const bins: Bin[] = []
  for (let from = 0; from < top; from += width) {
    const to = from + width
    const count = fractions.filter((f) => f >= from && (f < to || (to >= top && f <= to))).length
    bins.push({
      label: `${Math.round(from * 100)}–${Math.round(to * 100)}%`,
      count,
      atOrAbove: from >= 1,
    })
  }
  return bins
}

export function DistributionHistogram({ rows }: { rows: TerritoryPayout[] }) {
  const bins = buildHistogram(rows)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={bins} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={0} angle={-30} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip formatter={(v) => [`${Number(v)} reps`, 'Count']} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {bins.map((b, i) => (
            <Cell key={i} fill={b.atOrAbove ? BRAND : '#f59e0b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
