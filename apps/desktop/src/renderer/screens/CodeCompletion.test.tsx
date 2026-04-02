import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { CodeCompletion } from './CodeCompletion'
import { useCodeCompletionStore } from '../store/codeCompletionStore'

vi.mock('../hooks/useCodeCompletion', () => ({
  useCodeCompletion: () => ({
    getCompletions: vi.fn().mockResolvedValue([]),
    submitFeedback: vi.fn().mockResolvedValue(true),
  }),
}))

describe('CodeCompletion screen', () => {
  beforeEach(() => {
    useCodeCompletionStore.setState({
      completions: [],
      activeIndex: 0,
      isLoading: false,
      prefix: '',
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading "Code Completions"', () => {
    render(<CodeCompletion />)
    expect(screen.getByText('Code Completions')).toBeInTheDocument()
  })

  it('renders description mentioning N-gram or prefix', () => {
    render(<CodeCompletion />)
    expect(screen.getByText(/N-gram prefix model/i)).toBeInTheDocument()
  })

  it('renders Editor, Completions, and Settings tabs', () => {
    render(<CodeCompletion />)
    expect(screen.getByRole('tab', { name: /editor/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /completions/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders prefix input', () => {
    render(<CodeCompletion />)
    expect(screen.getByLabelText(/prefix/i)).toBeInTheDocument()
  })

  it('renders "Get Completions" button', () => {
    render(<CodeCompletion />)
    expect(screen.getByRole('button', { name: /get completions/i })).toBeInTheDocument()
  })

  it('renders disabled "Get Completions" button when prefix is empty', () => {
    render(<CodeCompletion />)
    const btn = screen.getByRole('button', { name: /get completions/i })
    expect(btn).toBeDisabled()
  })

  it('shows completions count in Completions tab label', () => {
    render(<CodeCompletion />)
    // With 0 completions, shows "Completions (0)"
    expect(screen.getByRole('tab', { name: /completions \(0\)/i })).toBeInTheDocument()
  })
})
