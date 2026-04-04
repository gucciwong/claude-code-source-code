import { create } from 'zustand'

export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  language?: string
  children?: FileNode[]
  isExpanded?: boolean
}

export interface EditorTab {
  id: string
  path: string
  name: string
  language: string
  content: string
  isDirty: boolean
}

export type PanelTab = 'terminal' | 'problems' | 'output' | 'debug'

interface CodingStore {
  // File tree
  workspaceRoot: string
  fileTree: FileNode[]
  selectedFile: string | null

  // Editor tabs
  openTabs: EditorTab[]
  activeTabId: string | null

  // Bottom panel
  isPanelOpen: boolean
  activePanelTab: PanelTab
  terminalLines: string[]

  // AI copilot
  isCopilotOpen: boolean
  copilotMessages: Array<{ id?: string; role: 'user' | 'assistant'; content: string }>
  copilotInput: string

  // Actions — file tree
  setWorkspaceRoot: (root: string) => void
  setFileTree: (tree: FileNode[]) => void
  toggleDirectory: (nodeId: string) => void
  setSelectedFile: (path: string | null) => void

  // Actions — editor
  openFile: (tab: EditorTab) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  markTabClean: (tabId: string) => void

  // Actions — panel
  setPanelOpen: (open: boolean) => void
  setActivePanelTab: (tab: PanelTab) => void
  appendTerminalLine: (line: string) => void
  clearTerminal: () => void

  // Actions — copilot
  setCopilotOpen: (open: boolean) => void
  addCopilotMessage: (msg: { id?: string; role: 'user' | 'assistant'; content: string }) => void
  setCopilotInput: (input: string) => void
  clearCopilotMessages: () => void
}

function toggleNode(nodes: FileNode[], id: string): FileNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, isExpanded: !n.isExpanded }
    if (n.children) return { ...n, children: toggleNode(n.children, id) }
    return n
  })
}

// -- Demo scaffolding defaults are declared before store creation to avoid TDZ access --

const WELCOME_CODE = `// Welcome to Sovereign Code
// Your local-first AI coding assistant
//
// • AI Copilot panel (right) answers questions about your code
// • File Explorer (left) browses your project
// • Integrated terminal (bottom) runs commands locally
// • All inference stays on-device — zero cloud, zero telemetry

import { useState } from 'react'

interface CounterProps {
  initialValue?: number
}

export function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue)
  return (
    <div className="flex items-center gap-4">
      <button onClick={() => setCount(c => c - 1)}>−</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  )
}
`

const defaultTab: EditorTab = {
  id: 'welcome',
  path: 'src/Welcome.tsx',
  name: 'Welcome.tsx',
  language: 'typescript',
  content: WELCOME_CODE,
  isDirty: false,
}

const defaultFileTree: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    path: 'src',
    type: 'directory',
    isExpanded: true,
    children: [
      {
        id: 'src-components',
        name: 'components',
        path: 'src/components',
        type: 'directory',
        isExpanded: false,
        children: [
          { id: 'src-components-app', name: 'App.tsx', path: 'src/components/App.tsx', type: 'file', language: 'typescript' },
          { id: 'src-components-button', name: 'Button.tsx', path: 'src/components/Button.tsx', type: 'file', language: 'typescript' },
        ],
      },
      {
        id: 'src-hooks',
        name: 'hooks',
        path: 'src/hooks',
        type: 'directory',
        isExpanded: false,
        children: [
          { id: 'src-hooks-useapi', name: 'useApi.ts', path: 'src/hooks/useApi.ts', type: 'file', language: 'typescript' },
        ],
      },
      { id: 'src-welcome', name: 'Welcome.tsx', path: 'src/Welcome.tsx', type: 'file', language: 'typescript' },
      { id: 'src-index', name: 'index.ts', path: 'src/index.ts', type: 'file', language: 'typescript' },
    ],
  },
  {
    id: 'public',
    name: 'public',
    path: 'public',
    type: 'directory',
    isExpanded: false,
    children: [
      { id: 'public-index', name: 'index.html', path: 'public/index.html', type: 'file', language: 'html' },
    ],
  },
  { id: 'package-json', name: 'package.json', path: 'package.json', type: 'file', language: 'json' },
  { id: 'tsconfig', name: 'tsconfig.json', path: 'tsconfig.json', type: 'file', language: 'json' },
  { id: 'readme', name: 'README.md', path: 'README.md', type: 'file', language: 'markdown' },
]

export const useCodingStore = create<CodingStore>((set) => ({
  workspaceRoot: '~/projects',
  fileTree: defaultFileTree,
  selectedFile: null,

  openTabs: [defaultTab],
  activeTabId: defaultTab.id,

  isPanelOpen: true,
  activePanelTab: 'terminal',
  terminalLines: [
    '$ Sovereign Code Terminal',
    '$ Ready.',
  ],

  isCopilotOpen: true,
  copilotMessages: [],
  copilotInput: '',

  setWorkspaceRoot: root => set({ workspaceRoot: root }),
  setFileTree: tree => set({ fileTree: tree }),
  toggleDirectory: id => set(s => ({ fileTree: toggleNode(s.fileTree, id) })),
  setSelectedFile: path => set({ selectedFile: path }),

  openFile: tab =>
    set(s => {
      const existing = s.openTabs.find(t => t.path === tab.path)
      if (existing) return { activeTabId: existing.id }
      return { openTabs: [...s.openTabs, tab], activeTabId: tab.id }
    }),
  closeTab: tabId =>
    set(s => {
      const remaining = s.openTabs.filter(t => t.id !== tabId)
      const newActive =
        s.activeTabId === tabId
          ? (remaining[remaining.length - 1]?.id ?? null)
          : s.activeTabId
      return { openTabs: remaining, activeTabId: newActive }
    }),
  setActiveTab: tabId => set({ activeTabId: tabId }),
  updateTabContent: (tabId, content) =>
    set(s => ({
      openTabs: s.openTabs.map(t =>
        t.id === tabId ? { ...t, content, isDirty: true } : t
      ),
    })),
  markTabClean: tabId =>
    set(s => ({
      openTabs: s.openTabs.map(t => (t.id === tabId ? { ...t, isDirty: false } : t)),
    })),

  setPanelOpen: open => set({ isPanelOpen: open }),
  setActivePanelTab: tab => set({ activePanelTab: tab }),
  appendTerminalLine: line =>
    set(s => ({ terminalLines: [...s.terminalLines, line] })),
  clearTerminal: () => set({ terminalLines: [] }),

  setCopilotOpen: open => set({ isCopilotOpen: open }),
  addCopilotMessage: msg =>
    set(s => ({ copilotMessages: [...s.copilotMessages, msg] })),
  setCopilotInput: input => set({ copilotInput: input }),
  clearCopilotMessages: () => set({ copilotMessages: [] }),
}))
