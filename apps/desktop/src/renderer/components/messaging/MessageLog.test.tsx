import { render, screen } from '@testing-library/react'
import { MessageLog } from './MessageLog'
import type { MessageLogEntry } from '../../../shared/messaging'

const entry: MessageLogEntry = {
  timestamp: 1700000000,
  platform: 'slack',
  sender_id: 'user42',
  command: 'models',
  response: 'Here are the installed models: llama3, mistral, gemma',
  authorized: true,
}

const longEntry: MessageLogEntry = {
  timestamp: 1700001000,
  platform: 'telegram',
  sender_id: 'botuser',
  command: 'status',
  response: 'A'.repeat(130),
  authorized: true,
}

describe('MessageLog', () => {
  it('has role log with accessible label', () => {
    render(<MessageLog entries={[]} />)
    expect(screen.getByRole('log')).toHaveAttribute('aria-label', 'Message history')
  })

  it('shows empty state when no entries', () => {
    render(<MessageLog entries={[]} />)
    expect(screen.getByText('No messages yet')).toBeInTheDocument()
  })

  it('shows sender id', () => {
    render(<MessageLog entries={[entry]} />)
    expect(screen.getByText(/from user42/)).toBeInTheDocument()
  })

  it('renders command in a code element', () => {
    const { container } = render(<MessageLog entries={[entry]} />)
    const codes = container.querySelectorAll('code')
    const commandCodes = Array.from(codes).filter(c => c.textContent === 'models')
    expect(commandCodes.length).toBeGreaterThan(0)
  })

  it('truncates response longer than 120 chars', () => {
    render(<MessageLog entries={[longEntry]} />)
    expect(screen.getByText(`${'A'.repeat(120)}…`)).toBeInTheDocument()
  })

  it('does not truncate response of 120 chars or less', () => {
    render(<MessageLog entries={[entry]} />)
    expect(screen.getByText(entry.response)).toBeInTheDocument()
  })
})
