import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompletionDropdown } from './CompletionDropdown'
import { useCodeCompletionStore } from '../../store/codeCompletionStore'
import type { Completion } from '../../../shared/codeCompletion'

const completions: Completion[] = [
  { text: 'const x = 1', confidence: 0.9, source: 'prefix' },
  { text: 'const y = 2', confidence: 0.7, source: 'ngram' },
]

describe('CompletionDropdown', () => {
  beforeEach(() => {
    useCodeCompletionStore.setState({ completions: [], activeIndex: 0 })
  })

  it('renders null when completions is empty', () => {
    const { container } = render(<CompletionDropdown onAccept={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders listbox role when completions present', () => {
    useCodeCompletionStore.setState({ completions, activeIndex: 0 })
    render(<CompletionDropdown onAccept={vi.fn()} />)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('renders all completion texts', () => {
    useCodeCompletionStore.setState({ completions, activeIndex: 0 })
    render(<CompletionDropdown onAccept={vi.fn()} />)
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
    expect(screen.getByText('const y = 2')).toBeInTheDocument()
  })

  it('calls onAccept when item is clicked', async () => {
    const onAccept = vi.fn()
    useCodeCompletionStore.setState({ completions, activeIndex: 0 })
    render(<CompletionDropdown onAccept={onAccept} />)
    await userEvent.click(screen.getByText('const x = 1'))
    expect(onAccept).toHaveBeenCalledWith('const x = 1')
  })

  it('marks active item via store activeIndex', () => {
    useCodeCompletionStore.setState({ completions, activeIndex: 1 })
    const { container } = render(<CompletionDropdown onAccept={vi.fn()} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons[0]).not.toHaveClass('bg-accent-500/20')
    expect(buttons[1]).toHaveClass('bg-accent-500/20')
  })
})
