import React, { useState } from 'react'
import { Gauge, Play, Download, RotateCw } from 'lucide-react'
import { useSystemStore } from '../../store/systemStore'

interface BenchmarkResult {
  name: string
  score: number
  unit: string
  baseline?: number
  improvement?: string
}

export function BenchmarkPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<BenchmarkResult[]>([
    {
      name: 'Inference Speed',
      score: 45,
      unit: 'tok/s',
      baseline: 38,
      improvement: '+18%',
    },
    {
      name: 'Memory Efficiency',
      score: 87,
      unit: '%',
      baseline: 82,
      improvement: '+6%',
    },
    {
      name: 'Latency (first token)',
      score: 245,
      unit: 'ms',
      baseline: 312,
      improvement: '-21%',
    },
    {
      name: 'Throughput',
      score: 1024,
      unit: 'tokens/min',
      baseline: 876,
      improvement: '+17%',
    },
  ])
  const { activeModel } = useSystemStore()

  const handleRunBenchmark = async () => {
    setIsRunning(true)
    // Simulate benchmark run
    await new Promise(resolve => setTimeout(resolve, 2000))
    // In real implementation, this would call backend API
    setIsRunning(false)
  }

  const handleExportResults = () => {
    try {
      const csv = [
        ['Benchmark', 'Score', 'Unit', 'Baseline', 'Improvement'],
        ...results.map(r => [r.name, r.score, r.unit, r.baseline || '-', r.improvement || '-']),
      ]
        .map(row => row.join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      
      // Check if URL API is available (not available in test environment)
      if (typeof window.URL?.createObjectURL !== 'function') {
        console.warn('Export not available in this environment')
        return
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `benchmark-${new Date().toISOString()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export results:', error)
    }
  }

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Gauge size={20} aria-hidden="true" />
          Performance Benchmark
        </h3>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-white text-xs font-medium rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            onClick={handleRunBenchmark}
            disabled={isRunning || !activeModel}
            aria-label={isRunning ? 'Benchmark running...' : 'Run benchmark'}
          >
            {isRunning ? (
              <>
                <RotateCw size={14} className="animate-spin" aria-hidden="true" />
                Running...
              </>
            ) : (
              <>
                <Play size={14} aria-hidden="true" />
                Run
              </>
            )}
          </button>
          <button
            className="flex items-center gap-2 px-3 py-1.5 border border-border-default hover:bg-bg-surface-3 text-text-secondary text-xs font-medium rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            onClick={handleExportResults}
            aria-label="Export benchmark results"
          >
            <Download size={14} aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {!activeModel && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-md text-sm text-yellow-300 mb-6">
          Load a model to run benchmarks
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, idx) => {
          const isImprovement = result.improvement?.startsWith('+')
          const improvementColor = isImprovement ? 'text-green-400' : 'text-green-400'

          return (
            <div
              key={idx}
              className="bg-bg-surface-3 border border-border-subtle rounded-md p-4"
              role="article"
              aria-label={`${result.name}: ${result.score} ${result.unit}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-text-secondary">{result.name}</h4>
                {result.improvement && (
                  <span className={`text-xs font-semibold ${improvementColor}`}>
                    {result.improvement}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-text-primary">{result.score}</span>
                <span className="text-sm text-text-muted">{result.unit}</span>
              </div>

              {result.baseline && (
                <div className="text-xs text-text-muted">
                  Baseline: <span className="text-text-secondary font-mono">{result.baseline} {result.unit}</span>
                </div>
              )}

              {/* Simple progress bar */}
              <div className="mt-3 h-2 bg-bg-base rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all"
                  style={{ width: `${Math.min((result.score / (result.baseline || result.score)) * 100, 100)}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-bg-base border border-border-subtle rounded-md">
        <h4 className="text-xs font-semibold text-text-secondary mb-2">Last Run</h4>
        <p className="text-xs text-text-muted">
          {new Date().toLocaleString()} • Model: <span className="text-text-secondary font-mono">{activeModel || 'None'}</span>
        </p>
      </div>
    </div>
  )
}
