import { render, screen } from '@testing-library/react'
import { FileTree } from './FileTree'
import { useCodingStore } from '../../store/codingStore'
import type { FileNode } from '../../store/codingStore'

const sampleTree: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    type: 'directory',
    isExpanded: true,
    children: [
      { id: 'src/App.tsx', name: 'App.tsx', path: 'src/App.tsx', type: 'file', language: 'typescript' },
      { id: 'src/index.ts', name: 'index.ts', path: 'src/index.ts', type: 'file', language: 'typescript' },
    ],
  },
  { id: 'package.json', name: 'package.json', path: 'package.json', type: 'file', language: 'json' },
]

beforeEach(() => {
  useCodingStore.setState({ workspaceRoot: '~/projects/my-app', fileTree: [], selectedFile: null })
})

test('renders Explorer heading', () => {
  render(<FileTree />)
  expect(screen.getByText('Explorer')).toBeInTheDocument()
})

test('renders workspace root name as label', () => {
  render(<FileTree />)
  expect(screen.getByText('my-app')).toBeInTheDocument()
})

test('renders file buttons with accessible aria-label', () => {
  useCodingStore.setState({ fileTree: sampleTree })
  render(<FileTree />)
  expect(screen.getByRole('button', { name: /Open file App.tsx/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Open file index.ts/ })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Open file package.json/ })).toBeInTheDocument()
})

test('renders directory button with accessible aria-label', () => {
  useCodingStore.setState({ fileTree: sampleTree })
  render(<FileTree />)
  expect(screen.getByRole('button', { name: /Open directory src/ })).toBeInTheDocument()
})

test('expanded directory child files are visible', () => {
  useCodingStore.setState({ fileTree: sampleTree })
  render(<FileTree />)
  expect(screen.getByText('App.tsx')).toBeInTheDocument()
  expect(screen.getByText('index.ts')).toBeInTheDocument()
})

test('renders without crashing when fileTree is empty', () => {
  useCodingStore.setState({ fileTree: [] })
  render(<FileTree />)
  expect(screen.getByText('Explorer')).toBeInTheDocument()
})
