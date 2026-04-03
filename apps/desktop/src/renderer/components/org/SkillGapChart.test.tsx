import { render, screen } from '@testing-library/react'
import { SkillGapChart } from './SkillGapChart'
import type { SkillGapReport } from '../../../shared/orgIntelligence'

const emptyReport: SkillGapReport = { gaps: [], generated_at: 1700000000 }

const reportWithGaps: SkillGapReport = {
  gaps: [
    { topic: 'unit_testing', adoption_rate: 0.42, recommended_patterns: [] },
    { topic: 'type_safety', adoption_rate: 0.75, recommended_patterns: [] },
  ],
  generated_at: 1700000000,
}

describe('SkillGapChart', () => {
  it('renders empty message when no gaps', () => {
    render(<SkillGapChart report={emptyReport} />)
    expect(screen.getByText('No skill gaps detected — great coverage!')).toBeInTheDocument()
  })

  it('renders topic name (underscores replaced with spaces)', () => {
    render(<SkillGapChart report={reportWithGaps} />)
    expect(screen.getByText('unit testing')).toBeInTheDocument()
  })

  it('renders adoption rate as percentage', () => {
    render(<SkillGapChart report={reportWithGaps} />)
    expect(screen.getByText('42% adoption')).toBeInTheDocument()
  })

  it('renders a bar for each gap', () => {
    const { container } = render(<SkillGapChart report={reportWithGaps} />)
    const bars = container.querySelectorAll('.bg-yellow-400.h-1\\.5')
    expect(bars.length).toBe(2)
  })
})
