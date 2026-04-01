import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from './Sidebar'
import { useNavigationStore } from '../../store/navigationStore'

beforeEach(() => {
  useNavigationStore.setState({ active: 'dashboard' })
})

test('Sidebar renders all navigation items', () => {
  render(<Sidebar />)
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(screen.getByText('Models')).toBeInTheDocument()
  expect(screen.getByText('Chat')).toBeInTheDocument()
  expect(screen.getByText('Training')).toBeInTheDocument()
  expect(screen.getByText('Federation')).toBeInTheDocument()
  expect(screen.getByText('Settings')).toBeInTheDocument()
})

test('active nav item has aria-current="page"', () => {
  useNavigationStore.setState({ active: 'chat' })
  render(<Sidebar />)
  const chatButton = screen.getByText('Chat').closest('button')
  expect(chatButton).toHaveAttribute('aria-current', 'page')
})

test('inactive nav items do not have aria-current', () => {
  render(<Sidebar />)
  const dashboardButton = screen.getByText('Dashboard').closest('button')
  // active === dashboard, so it SHOULD have aria-current
  expect(dashboardButton).toHaveAttribute('aria-current', 'page')
  const modelsButton = screen.getByText('Models').closest('button')
  expect(modelsButton).not.toHaveAttribute('aria-current', 'page')
})

test('clicking a nav item calls setActive', () => {
  render(<Sidebar />)
  fireEvent.click(screen.getByText('Models'))
  expect(useNavigationStore.getState().active).toBe('models')
})
