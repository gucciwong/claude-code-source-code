import * as Tabs from '@radix-ui/react-tabs'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useKnowledgeLibraryStore } from '../store/knowledgeLibraryStore'
import { SnippetBrowser } from '../components/knowledge/SnippetBrowser'
import { DecisionLog } from '../components/knowledge/DecisionLog'
import { DomainExpertise } from '../components/knowledge/DomainExpertise'
import { MemoryEditor } from '../components/knowledge/MemoryEditor'

export function Knowledge() {
  const {
    snippets,
    decisions,
    domainStats,
    memoryMarkdown,
    totalItems,
    isIndexing,
    setMemoryMarkdown,
    removeSnippet,
  } = useKnowledgeLibraryStore()

  return (
    <div className="p-6 flex flex-col gap-6 h-full">
      {/* Header */}
      <div>
        <h1 className="text-text-primary text-xl font-semibold">Knowledge Library</h1>
        <p className="flex items-center gap-1.5 text-text-muted text-sm mt-1">
          {totalItems} items
          <span aria-hidden="true">·</span>
          {isIndexing ? (
            <>
              <Loader2 size={14} aria-hidden="true" className="animate-spin" />
              Indexing...
            </>
          ) : (
            <>
              <CheckCircle2 size={14} aria-hidden="true" className="text-green-500" />
              Ready
            </>
          )}
        </p>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="snippets" className="flex flex-col gap-4 flex-1">
        <Tabs.List
          className="flex border-b border-border-default"
          aria-label="Knowledge sections"
        >
          {(['snippets', 'decisions', 'domains', 'memory'] as const).map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-2 text-sm text-text-secondary capitalize cursor-pointer
                data-[state=active]:text-text-primary data-[state=active]:border-b-2
                data-[state=active]:border-accent-500 -mb-px
                hover:text-text-primary transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="snippets" className="flex-1 overflow-auto">
          <SnippetBrowser snippets={snippets} onDelete={removeSnippet} />
        </Tabs.Content>

        <Tabs.Content value="decisions" className="flex-1 overflow-auto">
          <DecisionLog decisions={decisions} />
        </Tabs.Content>

        <Tabs.Content value="domains" className="flex-1 overflow-auto">
          <DomainExpertise domains={domainStats} />
        </Tabs.Content>

        <Tabs.Content value="memory" className="flex-1 overflow-auto">
          <MemoryEditor
            value={memoryMarkdown}
            onChange={setMemoryMarkdown}
            onSave={() => {
              /* IPC call — future */
            }}
          />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
