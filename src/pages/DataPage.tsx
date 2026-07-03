import { useState } from 'react'
import { useStore } from '../state/store'
import { DATASET_DESCRIPTORS } from '../data/datasets'
import { UploadCard } from '../components/UploadCard'
import { EligibilityCard } from '../components/EligibilityCard'
import { EditableDataTable } from '../components/EditableDataTable'
import { PageHeader, Section, Tabs } from '../components/ui'

const actuals = DATASET_DESCRIPTORS.filter((d) => d.kind === 'actuals')
const goals = DATASET_DESCRIPTORS.filter((d) => d.kind === 'goals')

export function DataPage() {
  const resetToDemo = useStore((s) => s.resetToDemo)
  const [activeKey, setActiveKey] = useState(`${actuals[0].kind}:${actuals[0].dataType}`)

  const active =
    DATASET_DESCRIPTORS.find((d) => `${d.kind}:${d.dataType}` === activeKey) ?? actuals[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data"
        description="Upload actuals & goals per dataset, or edit values directly. Demo data is seeded."
        actions={
          <button className="btn-secondary" onClick={resetToDemo}>
            Reset to demo
          </button>
        }
      />

      <Section title="Actuals" description="One dataset per metric data type.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actuals.map((d) => (
            <UploadCard key={`${d.kind}:${d.dataType}`} descriptor={d} />
          ))}
        </div>
      </Section>

      <Section title="Goals" description="Used to compute attainment for goal-based metrics.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((d) => (
            <UploadCard key={`${d.kind}:${d.dataType}`} descriptor={d} />
          ))}
        </div>
      </Section>

      <Section
        title="Eligibility / LOA"
        description="Applied as the final factor on each payout (after all metric blending)."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EligibilityCard />
        </div>
      </Section>

      <Section title="Edit values" description="Inline-edit any dataset; the engine recomputes live.">
        <Tabs
          tabs={DATASET_DESCRIPTORS.map((d) => ({
            id: `${d.kind}:${d.dataType}`,
            label: d.label,
          }))}
          active={activeKey}
          onChange={setActiveKey}
        />
        <div className="mt-4">
          <EditableDataTable
            kind={active.kind}
            dataType={active.dataType}
            valueLabel={active.valueLabel}
          />
        </div>
      </Section>
    </div>
  )
}
