import { render, screen } from '@testing-library/react'
import { MainContent } from './MainContent'
import { useNavigationStore } from '../../store/navigationStore'

beforeEach(() => {
  useNavigationStore.setState({ active: 'dashboard' })
})

test('shows Dashboard screen by default', () => {
  render(<MainContent />)
  expect(screen.getByTestId('screen-dashboard')).toBeInTheDocument()
})

test('shows Models screen when active is models', () => {
  useNavigationStore.setState({ active: 'models' })
  render(<MainContent />)
  expect(screen.getByTestId('screen-models')).toBeInTheDocument()
})

test('shows Chat screen when active is chat', () => {
  useNavigationStore.setState({ active: 'chat' })
  render(<MainContent />)
  expect(screen.getByTestId('screen-chat')).toBeInTheDocument()
})

test('shows Training screen when active is training', () => {
  useNavigationStore.setState({ active: 'training' })
  render(<MainContent />)
  expect(screen.getByTestId('screen-training')).toBeInTheDocument()
})

test('shows Federation screen when active is federation', () => {
  useNavigationStore.setState({ active: 'federation' })
  render(<MainContent />)
  expect(screen.getByRole('heading', { name: 'Federated Learning Core' })).toBeInTheDocument()
})

test('shows Settings screen when active is settings', () => {
  useNavigationStore.setState({ active: 'settings' })
  render(<MainContent />)
  expect(screen.getByTestId('screen-settings')).toBeInTheDocument()
})
