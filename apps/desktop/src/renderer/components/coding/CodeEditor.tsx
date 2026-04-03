import Editor from '@monaco-editor/react'
import { X, Circle } from 'lucide-react'
import { useCodingStore } from '../../store/codingStore'

export function CodeEditor() {
  const { openTabs, activeTabId, setActiveTab, closeTab, updateTabContent } = useCodingStore()
  const activeTab = openTabs.find(t => t.id === activeTabId)

  if (openTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4 select-none">
        <svg className="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <div className="text-center">
          <p className="text-sm text-text-secondary">No file open</p>
          <p className="text-xs mt-1">Click a file in the Explorer to open it</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {['Explain this code', 'Find bugs', 'Add tests', 'Refactor'].map(hint => (
            <div key={hint} className="text-xs px-3 py-1.5 bg-bg-surface-3 border border-border-subtle rounded text-text-muted text-center">
              {hint}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div
        className="flex items-end bg-bg-surface-1 border-b border-border-subtle overflow-x-auto flex-shrink-0"
        role="tablist"
        aria-label="Open editor tabs"
      >
        {openTabs.map(tab => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={[
                'flex items-center gap-1.5 px-3 py-2 text-[13px] cursor-pointer select-none flex-shrink-0',
                'border-r border-border-subtle group relative',
                isActive
                  ? 'bg-bg-base text-text-primary border-t-2 border-t-accent-500'
                  : 'bg-bg-surface-1 text-text-muted hover:text-text-secondary hover:bg-bg-surface-2',
              ].join(' ')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.isDirty && (
                <Circle size={8} fill="currentColor" className="text-text-muted flex-shrink-0" aria-label="Unsaved changes" />
              )}
              <span className="max-w-[140px] truncate">{tab.name}</span>
              <button
                onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                aria-label={`Close ${tab.name}`}
                className={[
                  'flex-shrink-0 rounded p-0.5',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-500',
                  isActive
                    ? 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-3'
                    : 'text-transparent group-hover:text-text-muted hover:text-text-primary hover:bg-bg-surface-3',
                ].join(' ')}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Breadcrumb */}
      {activeTab && (
        <div className="flex items-center px-3 py-1 text-[12px] text-text-muted bg-bg-base border-b border-border-subtle flex-shrink-0 gap-1">
          {activeTab.path.split('/').map((part, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronR />}
              <span className={i === arr.length - 1 ? 'text-text-secondary' : ''}>{part}</span>
            </span>
          ))}
        </div>
      )}

      {/* Monaco editor */}
      <div className="flex-1 min-h-0">
        {activeTab ? (
          <Editor
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: true, scale: 1 },
              wordWrap: 'off',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              selectionHighlight: true,
              bracketPairColorization: { enabled: true },
              scrollBeyondLastLine: false,
              padding: { top: 8 },
              suggest: { showKeywords: true, showSnippets: true },
            }}
            onChange={value => {
              if (value !== undefined) updateTabContent(activeTabId!, value)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function ChevronR() {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
