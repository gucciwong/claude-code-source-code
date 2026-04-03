import { render, screen } from '@testing-library/react'
import { ConsensusPanel } from './ConsensusPanel'
import type { CouncilReport } from '../../../shared/personaCouncil'

const report: CouncilReport = {
  session_id: 'sess-1',
  code_snippet: 'const x = eval(input)',
  language: 'typescript',
  reviews: [],
  risk_score: {
    overall: 7.5,
    breakdown: {
      'Security Auditor': 9.0,
      'Style Reviewer': 3.0,
      'Performance Expert': 5.5,
    },
  },
  consensus_summary: 'High risk: critical security vulnerabilities found.',
}

describe('ConsensusPanel', () => {
  it('renders "Council Consensus" heading', () => {
    render(<ConsensusPanel report={report} />)
    expect(screen.getByText('Council Consensus')).toBeInTheDocument()
  })

  it('renders consensus_summary text', () => {
    render(<ConsensusPanel report={report} />)
    expect(screen.getByText('High risk: critical security vulnerabilities found.')).toBeInTheDocument()
  })

  it('renders overall risk score badge', () => {
    render(<ConsensusPanel report={report} />)
    expect(screen.getByText(/7\.5/)).toBeInTheDocument()
  })

  it('renders breakdown entry labels', () => {
    render(<ConsensusPanel report={report} />)
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Style')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
  })

  it('renders breakdown scores as badges', () => {
    render(<ConsensusPanel report={report} />)
    expect(screen.getByText(/9\.0/)).toBeInTheDocument()
    expect(screen.getByText(/3\.0/)).toBeInTheDocument()
    expect(screen.getByText(/5\.5/)).toBeInTheDocument()
  })
})
