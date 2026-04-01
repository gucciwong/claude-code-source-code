import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SystemHealth } from './SystemHealth'
import { BenchmarkPanel } from './BenchmarkPanel'

type ActiveTab = 'health' | 'benchmark'

export function SystemPanel() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('health')
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-bg-surface-1 border-b border-border-default">
      <button
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-bg-surface-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-accent-500"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="System panel"
      >
        <h2 className="text-sm font-semibold text-text-primary">System Information</h2>
        {isExpanded ? (
          <ChevronUp size={18} aria-hidden="true" />
        ) : (
          <ChevronDown size={18} aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 py-4 border-t border-border-default">
          {/* Tab navigation */}
          <div className="flex gap-2 mb-6 border-b border-border-subtle">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-t ${
                activeTab === 'health'
                  ? 'text-accent-500 border-b-2 border-accent-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setActiveTab('health')}
              aria-selected={activeTab === 'health'}
              role="tab"
            >
              Health
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-t ${
                activeTab === 'benchmark'
                  ? 'text-accent-500 border-b-2 border-accent-500'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setActiveTab('benchmark')}
              aria-selected={activeTab === 'benchmark'}
              role="tab"
            >
              Benchmark
            </button>
          </div>

          {/* Tab content */}
          <div role="tabpanel" aria-label={activeTab === 'health' ? 'Health' : 'Benchmark'}>
            {activeTab === 'health' && <SystemHealth />}
            {activeTab === 'benchmark' && <BenchmarkPanel />}
          </div>
        </div>
      )}
    </div>
  )
}
