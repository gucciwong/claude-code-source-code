import React from 'react'
import { TrendingDown } from 'lucide-react'
import type { SkillGapReport } from '../../../shared/orgIntelligence'

interface SkillGapChartProps {
  report: SkillGapReport
}

export function SkillGapChart({ report }: SkillGapChartProps) {
  if (report.gaps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary text-sm">No skill gaps detected — great coverage!</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {report.gaps.map(gap => (
        <div key={gap.topic} className="bg-bg-surface-2 border border-border-default rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} aria-hidden="true" className="text-yellow-400" />
              <span className="text-text-primary text-sm font-medium capitalize">{gap.topic.replace('_', ' ')}</span>
            </div>
            <span className="text-yellow-400 text-sm font-medium">{Math.round(gap.adoption_rate * 100)}% adoption</span>
          </div>
          <div className="w-full bg-bg-surface-3 rounded-full h-1.5">
            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${gap.adoption_rate * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
