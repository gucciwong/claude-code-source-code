import * as Tabs from '@radix-ui/react-tabs'
import { Database } from 'lucide-react'
import { ConnectorList } from '../components/enterprise/ConnectorList'
import { AuditLogTable } from '../components/enterprise/AuditLogTable'
import { PIIMaskingRules } from '../components/enterprise/PIIMaskingRules'

const tabTriggerClass =
  'px-3 py-2 text-sm font-medium text-text-muted hover:text-text-primary cursor-pointer ' +
  'border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'

export function Enterprise() {
  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      <div className="flex items-center gap-3">
        <Database size={20} aria-hidden="true" className="text-accent-400" />
        <h1 className="text-xl font-semibold text-text-primary">Enterprise Data</h1>
      </div>

      <Tabs.Root defaultValue="connectors" className="flex flex-col gap-4">
        <Tabs.List className="flex gap-1 border-b border-border-default">
          <Tabs.Trigger value="connectors" className={tabTriggerClass}>Connectors</Tabs.Trigger>
          <Tabs.Trigger value="audit" className={tabTriggerClass}>Audit Log</Tabs.Trigger>
          <Tabs.Trigger value="pii" className={tabTriggerClass}>PII Rules</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="connectors"><ConnectorList /></Tabs.Content>
        <Tabs.Content value="audit"><AuditLogTable /></Tabs.Content>
        <Tabs.Content value="pii"><PIIMaskingRules /></Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
