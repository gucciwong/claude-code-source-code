import { render, screen } from '@testing-library/react'
import { CodeEditor } from './CodeEditor'
import { useCodingStore } from '../../store/codingStore'

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="monaco-editor">{value}</div>
  ),
}))

beforeEach(() => {
  useCodingStore.setState({ openTabs: [], activeTabId: null })
})

test('renders empty state when no tabs are open', () => {
  render(<CodeEditor />)
  expect(screen.getByText('No file open')).toBeInTheDocument()
})

test('empty state shows explorer hint text', () => {
  render(<CodeEditor />)
  expect(screen.getByText(/Click a file in the Explorer to open it/)).toBeInTheDocument()
})

test('empty state hint chips are visible', () => {
  render(<CodeEditor />)
  expect(screen.getByText('Explain this code')).toBeInTheDocument()
  expect(screen.getByText('Find bugs')).toBeInTheDocument()
  expect(screen.getByText('Add tests')).toBeInTheDocument()
  expect(screen.getByText('Refactor')).toBeInTheDocument()
})

test('renders tab list when tabs are open', () => {
  useCodingStore.setState({
    openTabs: [
      {
        id: 'tab-1',
        path: 'src/App.tsx',
        name: 'App.tsx',
        language: 'typescript',
        content: 'const x = 1',
        isDirty: false,
      },
    ],
    activeTabId: 'tab-1',
  })
  render(<CodeEditor />)
  expect(screen.getByRole('tablist', { name: /Open editor tabs/ })).toBeInTheDocument()
})

test('renders tab with correct name and active state', () => {
  useCodingStore.setState({
    openTabs: [
      {
        id: 'tab-1',
        path: 'src/App.tsx',
        name: 'App.tsx',
        language: 'typescript',
        content: 'const x = 1',
        isDirty: false,
      },
    ],
    activeTabId: 'tab-1',
  })
  render(<CodeEditor />)
  const tab = screen.getByRole('tab', { name: /App.tsx/ })
  expect(tab).toBeInTheDocument()
  expect(tab).toHaveAttribute('aria-selected', 'true')
})

test('renders close button for open tab', () => {
  useCodingStore.setState({
    openTabs: [
      {
        id: 'tab-1',
        path: 'src/App.tsx',
        name: 'App.tsx',
        language: 'typescript',
        content: 'const x = 1',
        isDirty: false,
      },
    ],
    activeTabId: 'tab-1',
  })
  render(<CodeEditor />)
  expect(screen.getByRole('button', { name: /Close App.tsx/ })).toBeInTheDocument()
})

test('renders monaco editor with file content when tab is active', () => {
  useCodingStore.setState({
    openTabs: [
      {
        id: 'tab-1',
        path: 'src/App.tsx',
        name: 'App.tsx',
        language: 'typescript',
        content: 'const hello = "world"',
        isDirty: false,
      },
    ],
    activeTabId: 'tab-1',
  })
  render(<CodeEditor />)
  expect(screen.getByTestId('monaco-editor')).toHaveTextContent('const hello = "world"')
})
