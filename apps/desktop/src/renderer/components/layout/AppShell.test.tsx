import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

test('AppShell renders children', () => {
  render(<AppShell><div data-testid="child">hello</div></AppShell>)
  expect(screen.getByTestId('child')).toBeInTheDocument()
})

test('AppShell has h-screen class for full height', () => {
  const { container } = render(<AppShell><div>content</div></AppShell>)
  expect(container.firstChild).toHaveClass('h-screen')
})
