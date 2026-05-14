import { render, screen } from '@testing-library/react'
import { ModelStatusChip } from './ModelStatusChip'

test('renders the default label for each status', () => {
  const cases: Array<[Parameters<typeof ModelStatusChip>[0]['status'], string]> = [
    ['ready', 'Ready'],
    ['active', 'Active'],
    ['queued', 'Queued'],
    ['downloading', 'Downloading'],
    ['warming', 'Warming'],
    ['error', 'Error'],
  ]
  for (const [status, label] of cases) {
    const { unmount } = render(<ModelStatusChip status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    unmount()
  }
})

test('downloading chip appends rounded percentage when progressPct is provided', () => {
  render(<ModelStatusChip status="downloading" progressPct={47.3} />)
  expect(screen.getByText('47%')).toBeInTheDocument()
})

test('downloading chip clamps progressPct to 0..100', () => {
  const { rerender } = render(<ModelStatusChip status="downloading" progressPct={-12} />)
  expect(screen.getByText('0%')).toBeInTheDocument()
  rerender(<ModelStatusChip status="downloading" progressPct={250} />)
  expect(screen.getByText('100%')).toBeInTheDocument()
})

test('non-downloading statuses ignore progressPct', () => {
  render(<ModelStatusChip status="ready" progressPct={42} />)
  expect(screen.queryByText(/%/)).not.toBeInTheDocument()
})

test('label prop overrides the default label', () => {
  render(<ModelStatusChip status="queued" label="Queued #2" />)
  expect(screen.getByText('Queued #2')).toBeInTheDocument()
  expect(screen.queryByText('Queued', { exact: true })).not.toBeInTheDocument()
})

test('compact mode hides the label text', () => {
  render(<ModelStatusChip status="ready" compact />)
  expect(screen.queryByText('Ready')).not.toBeInTheDocument()
  // aria-label is still present for screen readers via role=status
  expect(screen.getByRole('status', { name: /Ready/i })).toBeInTheDocument()
})

test('aria-label exposes status + progress for screen readers', () => {
  render(<ModelStatusChip status="downloading" progressPct={73} />)
  expect(screen.getByRole('status', { name: 'Downloading 73%' })).toBeInTheDocument()
})

test('chip carries data-status attribute for styling hooks', () => {
  const { container } = render(<ModelStatusChip status="active" />)
  expect(container.firstChild).toHaveAttribute('data-status', 'active')
})

test('error chip uses red tone classes', () => {
  const { container } = render(<ModelStatusChip status="error" />)
  expect(container.firstChild).toHaveClass('border-red-500/30')
})

test('active chip uses emerald tone classes', () => {
  const { container } = render(<ModelStatusChip status="active" />)
  expect(container.firstChild).toHaveClass('border-accent-500/40')
})
