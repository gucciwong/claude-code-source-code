import * as Tabs from '@radix-ui/react-tabs'
import { DatabaseZap } from 'lucide-react'
import { HRMPanel } from '../components/datahub/HRMPanel'
import { PersonalDataPanel } from '../components/datahub/PersonalDataPanel'
import { SyncLogTable } from '../components/datahub/SyncLogTable'

const tabTriggerClass =
  'px-3 py-2 text-sm font-medium text-text-muted hover:text-text-primary cursor-pointer ' +
  'border-b-2 border-transparent data-[state=active]:border-accent-500 data-[state=active]:text-text-primary ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'

export function DataHub() {
  return (
    <div data-testid="screen-datahub" className="p-6 flex flex-col gap-6 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <DatabaseZap size={20} aria-hidden="true" className="text-accent-400" />
        <h1 className="text-xl font-semibold text-text-primary">Data Hub</h1>
      </div>

      <Tabs.Root defaultValue="hrm" className="flex flex-col gap-4">
        <Tabs.List className="flex gap-1 border-b border-border-default">
          <Tabs.Trigger value="hrm" className={tabTriggerClass}>HRM Systems</Tabs.Trigger>
          <Tabs.Trigger value="personal" className={tabTriggerClass}>Personal Data</Tabs.Trigger>
          <Tabs.Trigger value="synclog" className={tabTriggerClass}>Sync Log</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="hrm"><HRMPanel /></Tabs.Content>
        <Tabs.Content value="personal"><PersonalDataPanel /></Tabs.Content>
        <Tabs.Content value="synclog"><SyncLogTable /></Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
