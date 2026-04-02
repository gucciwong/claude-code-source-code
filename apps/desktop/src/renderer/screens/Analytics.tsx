import React, { useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { BarChart2, RefreshCw } from 'lucide-react'
import { useAnalytics } from '../hooks/useAnalytics'
import { useAnalyticsStore } from '../store/analyticsStore'
import { MetricCard, TrendChart, ROITable, ExportPanel } from '../components/analytics'

export function Analytics() {
  const { fetchReport } = useAnalytics()
  const { report, isLoading, error } = useAnalyticsStore()

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const prod = report?.productivity
  const roi = report?.training_roi

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart2 size={20} aria-hidden="true" className="text-accent-400" />
              <h1 className="text-text-primary text-xl font-semibold">Analytics</h1>
            </div>
            <p className="text-text-secondary text-sm">Local productivity metrics, quality trends, and training ROI</p>
          </div>
          <button
            onClick={() => fetchReport()}
            disabled={isLoading}
            className="flex items-center gap-2 border border-border-default text-text-secondary hover:bg-bg-surface-3 rounded-md px-3 py-2 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50"
            aria-label="Refresh analytics"
          >
            <RefreshCw size={14} aria-hidden="true" className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <Tabs.Root defaultValue="productivity" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex gap-1 px-6 border-b border-border-subtle bg-bg-surface-1" aria-label="Analytics tabs">
          {(['productivity', 'quality', 'roi', 'export'] as const).map(tab => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="px-4 py-3 text-sm text-text-secondary hover:text-text-primary data-[state=active]:text-text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent-500 -mb-px cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 capitalize"
            >
              {tab === 'roi' ? 'Training ROI' : tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="productivity" className="flex-1 overflow-y-auto p-6">
          {prod ? (
            <div className="grid grid-cols-2 gap-4">
              <MetricCard label="Total Sessions" value={prod.total_sessions} />
              <MetricCard label="Total Tokens" value={prod.total_tokens.toLocaleString()} />
              <MetricCard label="Avg Tokens / Session" value={prod.avg_tokens_per_session.toFixed(0)} />
              <MetricCard label="Acceptance Rate" value={`${(prod.acceptance_rate * 100).toFixed(0)}%`} accent />
              <MetricCard label="Code Reviews" value={prod.total_code_reviews} />
              <MetricCard label="Training Runs" value={prod.total_training_runs} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-text-muted text-sm">{isLoading ? 'Loading metrics…' : 'No data yet'}</p>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="quality" className="flex-1 overflow-y-auto p-6">
          {report?.quality_trends ? (
            <TrendChart trends={report.quality_trends} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-text-muted text-sm">{isLoading ? 'Loading trends…' : 'No trend data'}</p>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="roi" className="flex-1 overflow-y-auto p-6">
          {roi ? (
            <ROITable roi={roi} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-text-muted text-sm">{isLoading ? 'Loading ROI…' : 'No ROI data'}</p>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="export" className="flex-1 overflow-y-auto p-6">
          <ExportPanel />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
