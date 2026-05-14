import { render, screen } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import { AppShell } from './AppShell'
import { useHealthStore } from '../../store/healthStore'

beforeEach(() => {
  // Stub fetch so the health polling effect doesn't try to hit real
  // localhost services from inside the jsdom test environment.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200 } as unknown as Response),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  useHealthStore.getState().stopPolling()
})

test('AppShell renders children', () => {
  render(<AppShell><div data-testid="child">hello</div></AppShell>)
  expect(screen.getByTestId('child')).toBeInTheDocument()
})

test('AppShell has h-screen class for full height', () => {
  const { container } = render(<AppShell><div>content</div></AppShell>)
  expect(container.firstChild).toHaveClass('h-screen')
})

test('AppShell kicks off global health polling on mount', () => {
  expect(useHealthStore.getState().polling).toBe(false)
  render(<AppShell><div>content</div></AppShell>)
  expect(useHealthStore.getState().polling).toBe(true)
})
