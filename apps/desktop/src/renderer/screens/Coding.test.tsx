import { render, screen } from '@testing-library/react'
import { Coding } from './Coding'
import { useCodingStore } from '../store/codingStore'

beforeEach(() => {
  useCodingStore.setState({
    openTabs: [],
    activeTabId: null,
    isPanelOpen: false,
    isCopilotOpen: true,
    selectedFile: null,
  })
})

test('renders Sovereign Code title bar', () => {
  render(<Coding />)
  expect(screen.getByText('Sovereign Code')).toBeInTheDocument()
})

test('renders file tree panel', () => {
  render(<Coding />)
  // FileTree renders an explorer heading
  expect(screen.getAllByText(/Explorer/i).length).toBeGreaterThan(0)
})

test('renders AI copilot panel when open', () => {
  useCodingStore.setState({ isCopilotOpen: true })
  render(<Coding />)
  expect(screen.getByText(/AI Copilot/i)).toBeInTheDocument()
})

test('renders sidebar resize separator', () => {
  render(<Coding />)
  const separators = screen.getAllByRole('separator')
  expect(separators.length).toBeGreaterThan(0)
})

test('shows active tab file path in title bar when a tab is open', () => {
  useCodingStore.setState({
    openTabs: [{ id: 'tab-1', path: 'src/main.ts', name: 'main.ts', language: 'TypeScript', content: '', isDirty: false }],
    activeTabId: 'tab-1',
  })
  render(<Coding />)
  expect(screen.getByText('src/main.ts')).toBeInTheDocument()
})

test('shows language and encoding in title bar when active tab exists', () => {
  useCodingStore.setState({
    openTabs: [{ id: 'tab-1', path: 'src/main.ts', name: 'main.ts', language: 'TypeScript', content: '', isDirty: false }],
    activeTabId: 'tab-1',
  })
  render(<Coding />)
  expect(screen.getByText('TypeScript')).toBeInTheDocument()
  expect(screen.getByText('UTF-8')).toBeInTheDocument()
})
