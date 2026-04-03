import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompletionItem } from './CompletionItem'
import type { Completion } from '../../../shared/codeCompletion'

const completion: Completion = {
  text: 'console.log(message)',
  confidence: 0.87,
  source: 'prefix',
}

describe('CompletionItem', () => {
  it('renders completion text', () => {
    render(<CompletionItem completion={completion} isActive={false} onAccept={vi.fn()} />)
    expect(screen.getByText('console.log(message)')).toBeInTheDocument()
  })

  it('renders confidence as percentage', () => {
    render(<CompletionItem completion={completion} isActive={false} onAccept={vi.fn()} />)
    expect(screen.getByText('87%')).toBeInTheDocument()
  })

  it('applies active classes when isActive=true', () => {
    const { container } = render(
      <CompletionItem completion={completion} isActive={true} onAccept={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass('bg-accent-500/20')
  })

  it('does not apply active class when isActive=false', () => {
    const { container } = render(
      <CompletionItem completion={completion} isActive={false} onAccept={vi.fn()} />
    )
    expect(container.firstChild).not.toHaveClass('bg-accent-500/20')
  })

  it('calls onAccept with completion text when clicked', async () => {
    const onAccept = vi.fn()
    render(<CompletionItem completion={completion} isActive={false} onAccept={onAccept} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onAccept).toHaveBeenCalledWith('console.log(message)')
  })
})
