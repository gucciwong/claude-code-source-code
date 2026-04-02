import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { useAnalytics } from '../../hooks/useAnalytics'

export function ExportPanel() {
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const { exportReport } = useAnalytics()

  const handleExport = async () => {
    const data = await exportReport(format)
    if (!data) return
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg p-5">
      <h3 className="text-text-primary text-sm font-semibold mb-4">Export Report</h3>
      <div className="flex items-center gap-4 mb-4">
        {(['json', 'csv'] as const).map(f => (
          <label key={f} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="export-format"
              value={f}
              checked={format === f}
              onChange={() => setFormat(f)}
              className="accent-accent-500"
            />
            <span className="text-text-secondary text-sm uppercase">{f}</span>
          </label>
        ))}
      </div>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-text-primary text-sm font-medium px-4 py-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        aria-label={`Export analytics report as ${format.toUpperCase()}`}
      >
        <Download size={16} aria-hidden="true" />
        Export as {format.toUpperCase()}
      </button>
    </div>
  )
}
