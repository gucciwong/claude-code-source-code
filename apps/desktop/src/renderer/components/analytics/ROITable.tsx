import React from 'react'
import type { TrainingROI } from '../../../shared/analytics'

interface ROITableProps {
  roi: TrainingROI
}

export function ROITable({ roi }: ROITableProps) {
  const rows = [
    { label: 'Total Training Runs', value: roi.total_training_runs.toString() },
    { label: 'Avg Quality Improvement', value: `${roi.avg_improvement_pct.toFixed(1)}%` },
    { label: 'Estimated Time Saved', value: `${roi.time_saved_hours.toFixed(1)}h` },
    { label: 'ROI Multiplier', value: `${roi.estimated_roi_multiplier.toFixed(1)}x` },
  ]
  return (
    <div className="bg-bg-surface-2 border border-border-default rounded-lg overflow-hidden">
      <table className="w-full">
        <caption className="sr-only">Training ROI metrics</caption>
        <tbody>
          {rows.map(({ label, value }) => (
            <tr key={label} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-3 text-text-secondary text-sm">{label}</td>
              <td className="px-4 py-3 text-text-primary text-sm font-medium text-right">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
