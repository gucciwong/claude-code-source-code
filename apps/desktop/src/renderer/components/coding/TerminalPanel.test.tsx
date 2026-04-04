import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TerminalPanel } from './TerminalPanel'
import { useCodingStore } from '../../store/codingStore'

beforeEach(() => {
  useCodingStore.setState({
    activePanelTab: 'terminal',
    terminalLines: ['$ Sovereign Code Terminal', '$ Ready.'],
    isPanelOpen: true,
  })
})

test('renders all panel tabs', () => {
  render(<TerminalPanel />)
  expect(screen.getByRole('tab', { name: /Terminal/ })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Problems/ })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Output/ })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Debug Console/ })).toBeInTheDocument()
})

test('terminal tab is selected by default', () => {
  render(<TerminalPanel />)
  expect(screen.getByRole('tab', { name: /Terminal/ })).toHaveAttribute('aria-selected', 'true')
})

test('renders terminal line content', () => {
  render(<TerminalPanel />)
  expect(screen.getByText('$ Sovereign Code Terminal')).toBeInTheDocument()
  expect(screen.getByText('$ Ready.')).toBeInTheDocument()
})

test('renders close panel button', () => {
  render(<TerminalPanel />)
  expect(screen.getByRole('button', { name: /Close panel/ })).toBeInTheDocument()
})

test('renders terminal input with placeholder', () => {
  render(<TerminalPanel />)
  expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument()
})

test('terminal input has accessible label', () => {
  render(<TerminalPanel />)
  expect(screen.getByRole('textbox', { name: /Terminal input/ })).toBeInTheDocument()
})

test('clicking close panel calls store action', async () => {
  const user = userEvent.setup()
  render(<TerminalPanel />)
  await user.click(screen.getByRole('button', { name: /Close panel/ }))
  expect(useCodingStore.getState().isPanelOpen).toBe(false)
})
