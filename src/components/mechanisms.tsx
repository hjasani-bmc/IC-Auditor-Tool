/**
 * Per-mechanism configuration editors. Each receives the metric and a patch
 * callback; all values are edited in human terms (percentages, multiples) and
 * stored as fractions. Curves, grids, maps, rates, and rank tables are all
 * fully editable, seeded from defaults.
 */
import type {
  CurveConfig,
  CurveTier,
  GridConfig,
  Metric,
  RankConfig,
  RatingMapConfig,
} from '../domain/types'
import { CURVE_TEMPLATES, curveTemplate } from '../data/templates'
import { validateCurveTiers } from '../engine'
import { NumberInput, PercentInput } from './inputs'
import { Field, Select, Toggle } from './ui'

interface EditorProps {
  metric: Metric
  onPatch: (patch: Partial<Metric>) => void
}

const th = 'px-2 py-1.5 text-left text-xs font-medium text-slate-500'
const td = 'px-2 py-1'

// ---------------------------------------------------------------------------
// Curve
// ---------------------------------------------------------------------------

function CurveEditor({ metric, onPatch }: EditorProps) {
  const curve = metric.curve
  if (!curve) return null

  const setCurve = (patch: Partial<CurveConfig>) =>
    onPatch({ curve: { ...curve, ...patch, templateName: patch.tiers ? undefined : curve.templateName } })

  const setTier = (i: number, patch: Partial<CurveTier>) => {
    const tiers = curve.tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t))
    setCurve({ tiers })
  }

  const addTier = () => {
    const tiers = [...curve.tiers]
    const last = tiers[tiers.length - 1]
    const newFrom = Number.isFinite(last.toAttainment)
      ? last.toAttainment
      : last.fromAttainment + 0.25
    // Close the previously-open top tier and continue payout from there.
    const payoutAtNewFrom =
      last.payoutAtFrom + (newFrom - last.fromAttainment) * last.slope
    tiers[tiers.length - 1] = { ...last, toAttainment: newFrom }
    tiers.push({
      fromAttainment: newFrom,
      toAttainment: Infinity,
      slope: 0.25,
      payoutAtFrom: payoutAtNewFrom,
    })
    setCurve({ tiers })
  }

  const removeTier = (i: number) => {
    if (curve.tiers.length <= 1) return
    const tiers = curve.tiers.filter((_, idx) => idx !== i)
    // Keep the curve sane: first tier starts at 0, last tier stays open.
    tiers[0] = { ...tiers[0], fromAttainment: 0 }
    tiers[tiers.length - 1] = { ...tiers[tiers.length - 1], toAttainment: Infinity }
    setCurve({ tiers })
  }

  const tierIssues = validateCurveTiers(curve)
  const capEnabled = curve.capEnabled !== false

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Curve template">
          <Select
            value={curve.templateName ?? 'Custom'}
            onChange={(e) => {
              const name = e.target.value
              if (name === 'Custom') return
              onPatch({ curve: curveTemplate(name) })
            }}
          >
            {CURVE_TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
            <option value="Custom">Custom (edited)</option>
          </Select>
        </Field>
        <Field label="Excellence at">
          <PercentInput
            value={curve.excellenceAttainment}
            onChange={(v) => setCurve({ excellenceAttainment: v })}
          />
        </Field>
        <Field label="Cap payout %" hint={capEnabled ? 'Payout is clamped to this ceiling.' : 'Uncapped — final tier slope extends.'}>
          <div className="flex items-center gap-3">
            <Toggle
              checked={capEnabled}
              onChange={(v) => setCurve({ capEnabled: v })}
              label="Enable payout cap"
            />
            {capEnabled && (
              <div className="flex-1">
                <PercentInput value={curve.cap} onChange={(v) => setCurve({ cap: v })} />
              </div>
            )}
          </div>
        </Field>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Tier</th>
              <th className={th}>From attain.</th>
              <th className={th}>To attain.</th>
              <th className={th}>Slope (x)</th>
              <th className={th}>Payout at From</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {curve.tiers.map((t, i) => {
              const isLast = i === curve.tiers.length - 1
              return (
                <tr key={i}>
                  <td className={`${td} text-slate-500`}>{i + 1}</td>
                  <td className={td}>
                    <PercentInput value={t.fromAttainment} onChange={(v) => setTier(i, { fromAttainment: v })} />
                  </td>
                  <td className={td}>
                    {isLast ? (
                      <span className="text-slate-400">and above</span>
                    ) : (
                      <PercentInput value={t.toAttainment} onChange={(v) => setTier(i, { toAttainment: v })} />
                    )}
                  </td>
                  <td className={td}>
                    <NumberInput value={t.slope} step={0.1} onChange={(v) => setTier(i, { slope: v })} />
                  </td>
                  <td className={td}>
                    <PercentInput value={t.payoutAtFrom} onChange={(v) => setTier(i, { payoutAtFrom: v })} />
                  </td>
                  <td className={`${td} text-right`}>
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                      onClick={() => removeTier(i)}
                      disabled={curve.tiers.length <= 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="btn-secondary text-xs" onClick={addTier}>
          + Add tier
        </button>
        <p className="text-xs text-slate-400">
          Payout = Payout-at-From + (attainment − From) × Slope, capped at the payout cap.
        </p>
      </div>

      {tierIssues.length > 0 && (
        <ul className="list-disc space-y-0.5 rounded-lg border border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800">
          {tierIssues.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

function GridEditor({ metric, onPatch }: EditorProps) {
  const grid = metric.grid
  if (!grid) return null
  const setGrid = (patch: Partial<GridConfig>) => onPatch({ grid: { ...grid, ...patch } })
  const setBand = (i: number, patch: Partial<GridConfig['bands'][number]>) =>
    setGrid({ bands: grid.bands.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) })

  return (
    <div className="space-y-3">
      <Field label="Payout cap">
        <div className="max-w-[160px]">
          <PercentInput value={grid.cap} onChange={(v) => setGrid({ cap: v })} />
        </div>
      </Field>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Attainment ≥</th>
              <th className={th}>Payout %</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grid.bands.map((b, i) => (
              <tr key={i}>
                <td className={td}>
                  <PercentInput value={b.fromAttainment} onChange={(v) => setBand(i, { fromAttainment: v })} />
                </td>
                <td className={td}>
                  <PercentInput value={b.payout} onChange={(v) => setBand(i, { payout: v })} />
                </td>
                <td className={`${td} text-right`}>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => setGrid({ bands: grid.bands.filter((_, idx) => idx !== i) })}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() => setGrid({ bands: [...grid.bands, { fromAttainment: 1, payout: 1 }] })}
      >
        + Add band
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rating map (MBO)
// ---------------------------------------------------------------------------

function RatingMapEditor({ metric, onPatch }: EditorProps) {
  const cfg = metric.ratingMap
  if (!cfg) return null
  const setRating = (rating: number, payout: number) =>
    onPatch({ ratingMap: { map: { ...cfg.map, [rating]: payout } } as RatingMapConfig })

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className={th}>MBO Rating</th>
            <th className={th}>Payout %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((r) => (
            <tr key={r}>
              <td className={`${td} font-medium text-slate-700`}>{r}</td>
              <td className={td}>
                <div className="max-w-[160px]">
                  <PercentInput value={cfg.map[r] ?? 0} onChange={(v) => setRating(r, v)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Commission
// ---------------------------------------------------------------------------

function CommissionEditor({ metric, onPatch }: EditorProps) {
  const cfg = metric.commission
  if (!cfg) return null
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Field label="Basis" hint="What the rate is applied to.">
        <Select value={cfg.basis} onChange={(e) => onPatch({ commission: { ...cfg, basis: e.target.value as typeof cfg.basis } })}>
          <option value="PerUnit">$ per unit</option>
          <option value="PercentOfValue">% of value</option>
        </Select>
      </Field>
      <Field label={cfg.basis === 'PerUnit' ? 'Rate ($/unit)' : 'Rate (fraction)'}>
        <NumberInput value={cfg.rate} step={cfg.basis === 'PerUnit' ? 1 : 0.01} onChange={(v) => onPatch({ commission: { ...cfg, rate: v } })} />
      </Field>
      <Field label="Output" hint="How it feeds the blend.">
        <Select value={cfg.output} onChange={(e) => onPatch({ commission: { ...cfg, output: e.target.value as typeof cfg.output } })}>
          <option value="PercentOfTI">% of target incentive</option>
          <option value="StandaloneDollar">Standalone $</option>
        </Select>
      </Field>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rank
// ---------------------------------------------------------------------------

function RankEditor({ metric, onPatch }: EditorProps) {
  const cfg = metric.rank
  if (!cfg) return null
  const setRank = (patch: Partial<RankConfig>) => onPatch({ rank: { ...cfg, ...patch } })
  const setBand = (i: number, patch: Partial<RankConfig['bands'][number]>) =>
    setRank({ bands: cfg.bands.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) })

  return (
    <div className="space-y-3">
      <Field label="Tie handling" hint="Reps are ranked within the metric's measurement level.">
        <div className="max-w-[260px]">
          <Select value={cfg.tieHandling} onChange={(e) => setRank({ tieHandling: e.target.value as typeof cfg.tieHandling })}>
            <option value="SharedRank">Shared rank (competition)</option>
            <option value="AveragedPayout">Averaged payout</option>
          </Select>
        </div>
      </Field>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>From rank</th>
              <th className={th}>To rank</th>
              <th className={th}>Payout %</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cfg.bands.map((b, i) => (
              <tr key={i}>
                <td className={td}>
                  <NumberInput value={b.fromRank} min={1} step={1} onChange={(v) => setBand(i, { fromRank: v })} />
                </td>
                <td className={td}>
                  <NumberInput value={b.toRank} min={1} step={1} onChange={(v) => setBand(i, { toRank: v })} />
                </td>
                <td className={td}>
                  <PercentInput value={b.payout} onChange={(v) => setBand(i, { payout: v })} />
                </td>
                <td className={`${td} text-right`}>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => setRank({ bands: cfg.bands.filter((_, idx) => idx !== i) })}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() => setRank({ bands: [...cfg.bands, { fromRank: 1, toRank: 1, payout: 1 }] })}
      >
        + Add band
      </button>
    </div>
  )
}

export function MechanismEditor({ metric, onPatch }: EditorProps) {
  switch (metric.mechanism) {
    case 'Curve':
      return <CurveEditor metric={metric} onPatch={onPatch} />
    case 'Grid':
      return <GridEditor metric={metric} onPatch={onPatch} />
    case 'RatingMap':
      return <RatingMapEditor metric={metric} onPatch={onPatch} />
    case 'Commission':
      return <CommissionEditor metric={metric} onPatch={onPatch} />
    case 'Rank':
      return <RankEditor metric={metric} onPatch={onPatch} />
  }
}
