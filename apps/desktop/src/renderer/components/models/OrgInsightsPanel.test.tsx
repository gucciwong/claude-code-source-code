import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrgInsightsPanel } from './OrgInsightsPanel'

describe('OrgInsightsPanel', () => {
  it('renders the "Org Insights" heading', () => {
    render(<OrgInsightsPanel />)
    expect(screen.getByRole('heading', { name: /org insights/i })).toBeInTheDocument()
  })

  it('renders the "Recommended by Your Team" section', () => {
    render(<OrgInsightsPanel />)
    expect(screen.getByText(/recommended by your team/i)).toBeInTheDocument()
  })

  it('renders org recommendation cards', () => {
    render(<OrgInsightsPanel />)
    expect(screen.getByText('Qwen 2.5 Coder 7B')).toBeInTheDocument()
  })

  it('shows endorsement counts on recommendation cards', () => {
    render(<OrgInsightsPanel />)
    // Qwen 2.5 Coder has 4 endorsements (highest)
    const endorsementCounts = screen.getAllByText('4')
    expect(endorsementCounts.length).toBeGreaterThan(0)
  })

  it('renders the org trained models section heading', () => {
    render(<OrgInsightsPanel />)
    expect(screen.getByRole('heading', { name: /trained models/i })).toBeInTheDocument()
  })

  it('renders trained model cards', () => {
    render(<OrgInsightsPanel />)
    expect(screen.getByText('Sovereign-QwenCoder-v3')).toBeInTheDocument()
  })

  it('marks the most-trained model', () => {
    render(<OrgInsightsPanel />)
    // Sovereign-QwenCoder-v3 has 12 runs — highest
    expect(screen.getByText('Most trained')).toBeInTheDocument()
  })

  it('marks unique org models', () => {
    render(<OrgInsightsPanel />)
    // Sovereign-QwenCoder-v3 and DevTeam-Llama-8B are unique to org
    const uniqueBadges = screen.getAllByText('Unique to org')
    expect(uniqueBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('shows training run counts', () => {
    render(<OrgInsightsPanel />)
    expect(screen.getByText(/12 training runs/i)).toBeInTheDocument()
  })

  it('renders Download buttons for recommendations', () => {
    render(<OrgInsightsPanel />)
    const downloadButtons = screen.getAllByText('Download')
    expect(downloadButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('renders Load buttons for trained models', () => {
    render(<OrgInsightsPanel />)
    const loadButtons = screen.getAllByRole('button', { name: /load/i })
    expect(loadButtons.length).toBeGreaterThanOrEqual(3)
  })

  it('sorts recommendations by endorsements descending', () => {
    render(<OrgInsightsPanel />)
    const cards = screen.getAllByText(/coder|phi|llama/i)
    // Qwen 2.5 Coder (4 endorsements) should appear before Llama (1 endorsement)
    const qwenIdx = cards.findIndex(el => el.textContent?.includes('Coder'))
    const llamaIdx = cards.findIndex(el => el.textContent?.includes('Llama'))
    expect(qwenIdx).toBeLessThan(llamaIdx < 0 ? Infinity : llamaIdx)
  })
})
