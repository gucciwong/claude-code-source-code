# Sovereign Coder Desktop App — Phase 1 Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Electron desktop app shell + Phase 1 screens (Dashboard, Models Hub, Chat) based on the approved UI/UX design in `docs/plans/2026-04-01-ui-ux-design.md`.

**Architecture:** New Electron app in `apps/desktop/` using `electron-vite` + React 18 + TypeScript. Communication with the Ollama backend via HTTP REST. No new server code — UI wraps existing Ollama endpoints. Zustand for state. Tailwind CSS v4 for styling.

**Tech Stack:** Electron 30, electron-vite, React 18, TypeScript 5, Tailwind CSS v4, Radix UI, Lucide React, Zustand, Recharts, highlight.js.

**Design Reference:** `docs/plans/2026-04-01-ui-ux-design.md` — read this before each task.

---

## Task 1: Scaffold Electron App

**Files:**
- Create: `apps/desktop/` (new directory tree)
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/electron.vite.config.ts`
- Create: `apps/desktop/tsconfig.json`
- Create: `apps/desktop/src/main/index.ts` (Electron main process)
- Create: `apps/desktop/src/preload/index.ts` (Electron preload)
- Create: `apps/desktop/src/renderer/index.html`
- Create: `apps/desktop/src/renderer/main.tsx`

**Step 1: Create the Electron + Vite project scaffold**

```bash
cd d:/Users/Admin/Documents/GitHub/claude-code-source-code
mkdir apps
cd apps
npm create @quick-start/electron@latest desktop -- --template react-ts
cd desktop
npm install
```

Expected: Project created with `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/`.

**Step 2: Install dependencies**

```bash
cd apps/desktop
npm install zustand @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-scroll-area lucide-react recharts highlight.js
npm install -D tailwindcss @tailwindcss/vite
```

**Step 3: Add Tailwind to Vite config**

In `apps/desktop/electron.vite.config.ts`, add `@tailwindcss/vite` to the renderer plugins:

```typescript
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    plugins: [react(), tailwindcss()]
  }
})
```

**Step 4: Create design tokens file**

Create `apps/desktop/src/renderer/styles/tokens.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg-base: #0D0D0D;
  --color-bg-surface-1: #161616;
  --color-bg-surface-2: #1E1E1E;
  --color-bg-surface-3: #252525;
  --color-bg-elevated: #2D2D2D;
  --color-border-subtle: #2A2A2A;
  --color-border-default: #363636;
  --color-border-strong: #484848;
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #A3A3A3;
  --color-text-muted: #737373;
  --color-text-code: #E5E5E5;
  --color-accent-400: #A78BFA;
  --color-accent-500: #8B5CF6;
  --color-accent-600: #7C3AED;
  --color-green-400: #4ADE80;
  --color-green-500: #22C55E;
  --color-red-400: #F87171;
  --color-red-500: #EF4444;
  --color-yellow-400: #FACC15;
  --color-blue-400: #60A5FA;
  --color-local-badge-bg: #1A2744;
  --color-local-badge-fg: #60A5FA;
}
```

**Step 5: Import tokens in renderer entry**

In `apps/desktop/src/renderer/main.tsx`:
```typescript
import './styles/tokens.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Step 6: Start dev server and confirm it runs**

```bash
cd apps/desktop
npm run dev
```

Expected: Electron window opens with Vite dev server. Background should be default (white). No errors in console.

**Step 7: Commit**

```bash
cd d:/Users/Admin/Documents/GitHub/claude-code-source-code
git add apps/desktop/
git commit -m "feat(desktop): scaffold Electron app with Vite, React, Tailwind v4, design tokens"
```

---

## Task 2: App Shell — Window Background & App Root

**Files:**
- Modify: `apps/desktop/src/renderer/App.tsx`
- Create: `apps/desktop/src/renderer/components/layout/AppShell.tsx`

**Step 1: Write a failing test for AppShell renders without crashing**

```typescript
// apps/desktop/src/renderer/components/layout/AppShell.test.tsx
import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'

test('AppShell renders children', () => {
  render(<AppShell><div data-testid="child">hello</div></AppShell>)
  expect(screen.getByTestId('child')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern AppShell
```
Expected: FAIL — `AppShell` module not found.

**Step 3: Implement AppShell**

```tsx
// apps/desktop/src/renderer/components/layout/AppShell.tsx
import React from 'react'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] overflow-hidden">
      {children}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern AppShell
```
Expected: PASS

**Step 5: Wire into App.tsx**

```tsx
// apps/desktop/src/renderer/App.tsx
import { AppShell } from './components/layout/AppShell'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { MainContent } from './components/layout/MainContent'

export default function App() {
  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StatusBar />
    </AppShell>
  )
}
```

**Step 6: Run dev to verify the dark background renders**

```bash
cd apps/desktop && npm run dev
```
Expected: Black/very dark window. No errors.

**Step 7: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): add AppShell layout wrapper with dark background"
```

---

## Task 2.5: Command Palette (⌘K / Ctrl+K)

**Files:**
- Create: `apps/desktop/src/renderer/components/CommandPalette.tsx`
- Create: `apps/desktop/src/renderer/store/commandPaletteStore.ts`
- Modify: `apps/desktop/src/renderer/App.tsx`

**Step 1: Write failing tests**

```typescript
// apps/desktop/src/renderer/components/CommandPalette.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'

test('CommandPalette is hidden by default', () => {
  render(<CommandPalette />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('CommandPalette opens on ⌘K', () => {
  render(<CommandPalette />)
  fireEvent.keyDown(document, { key: 'k', metaKey: true })
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByPlaceholderText(/Type a model name or command/)).toBeInTheDocument()
})

test('CommandPalette closes on Escape', () => {
  render(<CommandPalette />)
  fireEvent.keyDown(document, { key: 'k', metaKey: true })
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('CommandPalette shows installed models', () => {
  const { useModelsStore } = require('../store/modelsStore')
  useModelsStore.setState({
    installed: [
      { name: 'qwen2.5-coder:32b', size: 20_000_000_000, digest: 'abc', modified_at: '2026-01-01' },
    ],
  })
  render(<CommandPalette />)
  fireEvent.keyDown(document, { key: 'k', metaKey: true })
  expect(screen.getByText('qwen2.5-coder:32b')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern CommandPalette
```
Expected: FAIL — `CommandPalette` module not found.

**Step 3: Create command palette store**

```typescript
// apps/desktop/src/renderer/store/commandPaletteStore.ts
import { create } from 'zustand'

interface CommandPaletteState {
  open: boolean
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  open: false,
  openPalette: () => set({ open: true }),
  closePalette: () => set({ open: false }),
  togglePalette: () => set((s) => ({ open: !s.open })),
}))
```

**Step 4: Implement CommandPalette**

```tsx
// apps/desktop/src/renderer/components/CommandPalette.tsx
import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Cpu, MessageSquare, Zap, Download } from 'lucide-react'
import { useCommandPaletteStore } from '../store/commandPaletteStore'
import { useModelsStore } from '../store/modelsStore'
import { useNavigationStore } from '../store/navigationStore'

const ACTIONS = [
  { id: 'chat', label: 'Open Chat', icon: MessageSquare, section: 'chat' as const },
  { id: 'training', label: 'Start Training', icon: Zap, section: 'training' as const },
  { id: 'models', label: 'Browse Models', icon: Download, section: 'models' as const },
]

export function CommandPalette() {
  const { open, closePalette, togglePalette } = useCommandPaletteStore()
  const { installed } = useModelsStore()
  const { setActive } = useNavigationStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Global ⌘K / Ctrl+K listener — registered once here, not per-screen
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        togglePalette()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [togglePalette])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const q = query.toLowerCase()
  const filteredModels = installed.filter((m) => m.name.toLowerCase().includes(q))
  const filteredActions = ACTIONS.filter((a) => a.label.toLowerCase().includes(q))

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && closePalette()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content
          aria-label="Command palette"
          className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[560px] max-h-[360px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] rounded-lg shadow-lg z-50 overflow-hidden flex flex-col"
        >
          <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a model name or command..."
              className="w-full bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
              aria-label="Command palette search"
            />
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {filteredModels.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Models
                </p>
                {filteredModels.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => { useModelsStore.getState().setSelected(m.name); closePalette() }}
                    className="w-full flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-3)] rounded-md transition-colors cursor-pointer"
                  >
                    <Cpu size={14} className="text-[var(--color-text-muted)] flex-shrink-0" aria-hidden="true" />
                    {m.name}
                  </button>
                ))}
              </div>
            )}
            {filteredActions.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Actions
                </p>
                {filteredActions.map(({ id, label, icon: Icon, section }) => (
                  <button
                    key={id}
                    onClick={() => { setActive(section); closePalette() }}
                    className="w-full flex items-center gap-3 px-2 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-3)] rounded-md transition-colors cursor-pointer"
                  >
                    <Icon size={14} className="text-[var(--color-text-muted)] flex-shrink-0" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
            {filteredModels.length === 0 && filteredActions.length === 0 && (
              <p className="px-2 py-4 text-sm text-[var(--color-text-muted)] text-center">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

**Step 5: Wire into App.tsx**

Add `<CommandPalette />` as a sibling inside `AppShell`:

```tsx
// apps/desktop/src/renderer/App.tsx
import { AppShell } from './components/layout/AppShell'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { MainContent } from './components/layout/MainContent'
import { CommandPalette } from './components/CommandPalette'
import { useOllamaStatus } from './hooks/useOllamaStatus'

export default function App() {
  useOllamaStatus()
  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <StatusBar />
      <CommandPalette />
    </AppShell>
  )
}
```

**Step 6: Run tests to verify they pass**

```bash
cd apps/desktop && npm test -- --testPathPattern CommandPalette
```
Expected: PASS (all 4 tests green)

**Step 7: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): add global command palette (⌘K) with model switching and action shortcuts"
```

---

## Task 3: Sidebar Navigation

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/Sidebar.tsx`
- Create: `apps/desktop/src/renderer/store/navigationStore.ts`

**Step 1: Write failing test: sidebar renders all nav items**

```typescript
// apps/desktop/src/renderer/components/layout/Sidebar.test.tsx
import { render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'

test('Sidebar renders all navigation items', () => {
  render(<Sidebar />)
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(screen.getByText('Models')).toBeInTheDocument()
  expect(screen.getByText('Chat')).toBeInTheDocument()
  expect(screen.getByText('Training')).toBeInTheDocument()
  expect(screen.getByText('Federation')).toBeInTheDocument()
  expect(screen.getByText('Settings')).toBeInTheDocument()
})

test('clicking a nav item sets it as active', async () => {
  render(<Sidebar />)
  const modelsLink = screen.getByText('Models')
  modelsLink.click()
  expect(modelsLink.closest('button')).toHaveClass('bg-accent-500/10')
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern Sidebar
```
Expected: FAIL — `Sidebar` not found.

**Step 3: Create navigation store**

```typescript
// apps/desktop/src/renderer/store/navigationStore.ts
import { create } from 'zustand'

export type NavSection = 'dashboard' | 'models' | 'chat' | 'training' | 'federation' | 'settings'

interface NavigationState {
  active: NavSection
  setActive: (section: NavSection) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  active: 'dashboard',
  setActive: (section) => set({ active: section }),
}))
```

**Step 4: Implement Sidebar**

```tsx
// apps/desktop/src/renderer/components/layout/Sidebar.tsx
import { LayoutDashboard, Cpu, MessageSquare, Zap, Network, Settings, HelpCircle } from 'lucide-react'
import { useNavigationStore, NavSection } from '../../store/navigationStore'

const navItems: { id: NavSection; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'models', label: 'Models', icon: Cpu },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'training', label: 'Training', icon: Zap },
  { id: 'federation', label: 'Federation', icon: Network },
]

const bottomItems: { id: NavSection; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { active, setActive } = useNavigationStore()

  return (
    <aside className="w-[220px] flex flex-col bg-[var(--color-bg-surface-1)] border-r border-[var(--color-border-subtle)] flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[var(--color-border-subtle)]">
        <span className="text-[var(--color-text-primary)] font-semibold text-sm">Sovereign Coder</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            aria-current={active === id ? 'page' : undefined}
            className={[
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer',
              active === id
                ? 'bg-accent-500/10 text-[var(--color-accent-400)] border-l-2 border-[var(--color-accent-500)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)]',
            ].join(' ')}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="py-2 border-t border-[var(--color-border-subtle)]">
        {bottomItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)] transition-colors"
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
```

**Step 5: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern Sidebar
```
Expected: PASS

**Step 6: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): add sidebar navigation with Zustand active-section store"
```

---

## Task 4: Status Bar

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/StatusBar.tsx`
- Create: `apps/desktop/src/renderer/store/systemStore.ts`

**Step 1: Write failing test**

```typescript
// apps/desktop/src/renderer/components/layout/StatusBar.test.tsx
import { render, screen } from '@testing-library/react'
import { StatusBar } from './StatusBar'

test('StatusBar shows "Running Locally" badge', () => {
  render(<StatusBar />)
  expect(screen.getByText('Running Locally')).toBeInTheDocument()
})

test('StatusBar shows model name when model is loaded', () => {
  // Pre-populate store
  const { useSystemStore } = require('../../store/systemStore')
  useSystemStore.setState({ activeModel: 'qwen2.5-coder-32b' })
  render(<StatusBar />)
  expect(screen.getByText('qwen2.5-coder-32b')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern StatusBar
```
Expected: FAIL

**Step 3: Create system store**

```typescript
// apps/desktop/src/renderer/store/systemStore.ts
import { create } from 'zustand'

interface SystemState {
  activeModel: string | null
  tokensPerSec: number | null
  gpuName: string | null
  vramUsed: number | null
  vramTotal: number | null
  gpuTemp: number | null
  trainingStatus: 'idle' | 'running' | 'complete'
  federationPeers: number
  ollamaOnline: boolean
}

export const useSystemStore = create<SystemState>(() => ({
  activeModel: null,
  tokensPerSec: null,
  gpuName: null,
  vramUsed: null,
  vramTotal: null,
  gpuTemp: null,
  trainingStatus: 'idle',
  federationPeers: 0,
  ollamaOnline: false,
}))
```

**Step 4: Implement StatusBar**

```tsx
// apps/desktop/src/renderer/components/layout/StatusBar.tsx
import { Lock } from 'lucide-react'
import { useSystemStore } from '../../store/systemStore'

export function StatusBar() {
  const { activeModel, tokensPerSec, vramUsed, vramTotal, gpuTemp, trainingStatus, federationPeers } = useSystemStore()

  return (
    <footer
      role="status"
      aria-label="System status"
      className="h-[28px] flex items-center px-3 gap-3 bg-[var(--color-bg-surface-1)] border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] flex-shrink-0"
    >
      {/* Segment 1: Running Locally */}
      <span className="flex items-center gap-1.5 bg-[var(--color-local-badge-bg)] text-[var(--color-local-badge-fg)] px-2 py-0.5 rounded-sm">
        <Lock size={9} aria-hidden="true" />
        Running Locally
      </span>

      <span aria-hidden="true" className="text-[var(--color-border-default)]">|</span>

      {/* Segment 2: Model */}
      <span className="text-[var(--color-text-secondary)]">
        {activeModel ?? 'No model loaded'}
      </span>

      {/* Segment 3: GPU — VRAM + temp combined */}
      {vramUsed !== null && vramTotal !== null && (
        <>
          <span aria-hidden="true" className="text-[var(--color-border-default)]">|</span>
          <span>
            GPU {vramUsed.toFixed(1)}/{vramTotal} GB
            {gpuTemp !== null && ` · ${gpuTemp}°C`}
          </span>
        </>
      )}

      {/* Segment 4: tok/s */}
      {tokensPerSec !== null && (
        <>
          <span aria-hidden="true" className="text-[var(--color-border-default)]">|</span>
          <span>{tokensPerSec.toFixed(0)} tok/s</span>
        </>
      )}

      {/* Conditional: Training — only when running */}
      {trainingStatus === 'running' && (
        <>
          <span aria-hidden="true" className="text-[var(--color-border-default)]">|</span>
          <span className="text-[var(--color-yellow-400)]">Training: Running</span>
        </>
      )}

      {/* Conditional: Federation — only when peers connected */}
      {federationPeers > 0 && (
        <>
          <span aria-hidden="true" className="text-[var(--color-border-default)]">|</span>
          <span className="text-[var(--color-green-400)]">{federationPeers} peers</span>
        </>
      )}
    </footer>
  )
}
```

**Step 5: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern StatusBar
```
Expected: PASS

**Step 6: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): add status bar with Running Locally badge, model, VRAM, tok/s, training, federation"
```

---

## Task 5: Ollama Health Check (Wire Status Bar to real data)

**Files:**
- Create: `apps/desktop/src/renderer/services/ollamaClient.ts`
- Create: `apps/desktop/src/renderer/hooks/useOllamaStatus.ts`

**Step 1: Write failing test for ollamaClient.getModels**

```typescript
// apps/desktop/src/renderer/services/ollamaClient.test.ts
import { ollamaClient } from './ollamaClient'

// Mock fetch
global.fetch = vi.fn()

test('getModels returns list of installed models', async () => {
  (fetch as vi.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ models: [{ name: 'qwen2.5-coder:latest', size: 20_000_000_000 }] }),
  })

  const models = await ollamaClient.getModels()
  expect(models).toHaveLength(1)
  expect(models[0].name).toBe('qwen2.5-coder:latest')
})

test('getModels returns empty array on network failure', async () => {
  (fetch as vi.Mock).mockRejectedValueOnce(new Error('Connection refused'))
  const models = await ollamaClient.getModels()
  expect(models).toEqual([])
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern ollamaClient
```
Expected: FAIL

**Step 3: Implement ollamaClient**

```typescript
// apps/desktop/src/renderer/services/ollamaClient.ts
export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

const BASE = 'http://localhost:11434'

export const ollamaClient = {
  async getModels(): Promise<OllamaModel[]> {
    try {
      const res = await fetch(`${BASE}/api/tags`)
      if (!res.ok) return []
      const data = await res.json()
      return data.models ?? []
    } catch {
      return []
    }
  },

  async isOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/api/tags`, { signal: AbortSignal.timeout(2000) })
      return res.ok
    } catch {
      return false
    }
  },

  async *streamChat(model: string, messages: { role: string; content: string }[]) {
    const res = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
    })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
        try {
          const json = JSON.parse(line.slice(6))
          const delta = json.choices?.[0]?.delta?.content
          if (delta) yield delta
        } catch { /* skip malformed lines */ }
      }
    }
  },
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern ollamaClient
```
Expected: PASS

**Step 5: Create useOllamaStatus hook that polls and updates systemStore**

```typescript
// apps/desktop/src/renderer/hooks/useOllamaStatus.ts
import { useEffect } from 'react'
import { ollamaClient } from '../services/ollamaClient'
import { useSystemStore } from '../store/systemStore'

export function useOllamaStatus() {
  useEffect(() => {
    async function poll() {
      const online = await ollamaClient.isOnline()
      const models = online ? await ollamaClient.getModels() : []
      useSystemStore.setState({
        ollamaOnline: online,
        activeModel: models.length > 0 ? models[0].name : null,
      })
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])
}
```

**Step 6: Wire hook in App.tsx**

In `apps/desktop/src/renderer/App.tsx`, call `useOllamaStatus()` at the top level of the App component.

**Step 7: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): add Ollama client + useOllamaStatus hook, wire to status bar"
```

---

## Task 6: Main Content Router

**Files:**
- Create: `apps/desktop/src/renderer/components/layout/MainContent.tsx`
- Create: `apps/desktop/src/renderer/screens/Dashboard.tsx` (stub)
- Create: `apps/desktop/src/renderer/screens/Models.tsx` (stub)
- Create: `apps/desktop/src/renderer/screens/Chat.tsx` (stub)
- Create: `apps/desktop/src/renderer/screens/Training.tsx` (stub)
- Create: `apps/desktop/src/renderer/screens/Federation.tsx` (stub)
- Create: `apps/desktop/src/renderer/screens/Settings.tsx` (stub)

**Step 1: Write failing test**

```typescript
// apps/desktop/src/renderer/components/layout/MainContent.test.tsx
import { render, screen } from '@testing-library/react'
import { MainContent } from './MainContent'
import { useNavigationStore } from '../../store/navigationStore'

test('MainContent shows Dashboard by default', () => {
  useNavigationStore.setState({ active: 'dashboard' })
  render(<MainContent />)
  expect(screen.getByTestId('screen-dashboard')).toBeInTheDocument()
})

test('MainContent shows Models screen when active is models', () => {
  useNavigationStore.setState({ active: 'models' })
  render(<MainContent />)
  expect(screen.getByTestId('screen-models')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern MainContent
```
Expected: FAIL

**Step 3: Implement screen stubs and MainContent router**

```tsx
// apps/desktop/src/renderer/screens/Dashboard.tsx
export function Dashboard() {
  return <div data-testid="screen-dashboard" className="p-6"><h1 className="text-xl text-[var(--color-text-primary)]">Dashboard</h1></div>
}
```
(Repeat the same pattern for Models, Chat, Training, Federation, Settings — each with a unique `data-testid`.)

```tsx
// apps/desktop/src/renderer/components/layout/MainContent.tsx
import { useNavigationStore } from '../../store/navigationStore'
import { Dashboard } from '../../screens/Dashboard'
import { Models } from '../../screens/Models'
import { Chat } from '../../screens/Chat'
import { Training } from '../../screens/Training'
import { Federation } from '../../screens/Federation'
import { Settings } from '../../screens/Settings'

const screens = {
  dashboard: Dashboard,
  models: Models,
  chat: Chat,
  training: Training,
  federation: Federation,
  settings: Settings,
}

export function MainContent() {
  const { active } = useNavigationStore()
  const Screen = screens[active]
  return (
    <main className="flex-1 overflow-auto bg-[var(--color-bg-base)]">
      <Screen />
    </main>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern MainContent
```
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): add MainContent router + screen stubs for all 6 sections"
```

---

## Task 7: Dashboard Screen (Full Implementation)

**Files:**
- Modify: `apps/desktop/src/renderer/screens/Dashboard.tsx`

**Step 1: Write failing tests for dashboard cards**

```typescript
// apps/desktop/src/renderer/screens/Dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import { useSystemStore } from '../store/systemStore'

test('Dashboard shows system health strip', () => {
  render(<Dashboard />)
  expect(screen.getByText(/Inference:/)).toBeInTheDocument()
  expect(screen.getByText(/GPU:/)).toBeInTheDocument()
  expect(screen.getByText(/Training:/)).toBeInTheDocument()
})

test('Dashboard shows active model when loaded', () => {
  useSystemStore.setState({ activeModel: 'qwen2.5-coder:32b', tokensPerSec: 45.3 })
  render(<Dashboard />)
  expect(screen.getByText('qwen2.5-coder:32b')).toBeInTheDocument()
  expect(screen.getByText(/45\.3 tok\/s/)).toBeInTheDocument()
})

test('Dashboard shows No model loaded when no model', () => {
  useSystemStore.setState({ activeModel: null })
  render(<Dashboard />)
  expect(screen.getByText('No model loaded')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern Dashboard
```
Expected: FAIL

**Step 3: Implement full Dashboard screen**

See design: `docs/plans/2026-04-01-ui-ux-design.md` Section 4.1.

```tsx
// apps/desktop/src/renderer/screens/Dashboard.tsx
import { useSystemStore } from '../store/systemStore'
import { useNavigationStore } from '../store/navigationStore'
import { MessageSquare, Zap, Download, Activity } from 'lucide-react'

function HealthDot({ colour }: { colour: 'green' | 'yellow' | 'red' }) {
  const cls = {
    green: 'bg-[var(--color-green-500)]',
    yellow: 'bg-[var(--color-yellow-400)]',
    red: 'bg-[var(--color-red-400)]',
  }[colour]
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls} flex-shrink-0`} />
}

function VramBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / total) * 100))
  const colour =
    pct > 90
      ? 'bg-[var(--color-red-400)]'
      : pct > 75
      ? 'bg-[var(--color-yellow-400)]'
      : 'bg-[var(--color-accent-500)]'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour} transition-[width]`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[var(--color-text-secondary)] tabular-nums flex-shrink-0">
        {used.toFixed(1)} / {total} GB
      </span>
    </div>
  )
}

export function Dashboard() {
  const { activeModel, tokensPerSec, vramUsed, vramTotal, gpuTemp, trainingStatus, ollamaOnline } = useSystemStore()
  const { setActive } = useNavigationStore()

  const inferenceColour: 'green' | 'yellow' | 'red' = ollamaOnline ? 'green' : 'red'
  const gpuColour: 'green' | 'yellow' | 'red' = gpuTemp != null ? (gpuTemp > 80 ? 'yellow' : 'green') : 'red'
  const trainingColour: 'green' | 'yellow' | 'red' = trainingStatus === 'running' ? 'yellow' : 'green'

  return (
    <div data-testid="screen-dashboard" className="p-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Dashboard</h1>

      {/* HERO: Active Model — the primary focus */}
      <section className="mb-4">
        <div className="bg-[var(--color-bg-surface-2)] rounded-lg border border-[var(--color-border-subtle)] p-5">
          {activeModel ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{activeModel}</p>
                  {tokensPerSec != null && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                      {tokensPerSec.toFixed(1)} tok/s · 128K context
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setActive('models')}
                  className="text-xs text-[var(--color-accent-400)] hover:text-[var(--color-accent-500)] transition-colors cursor-pointer"
                >
                  Switch Model ▾
                </button>
              </div>
              {vramUsed != null && vramTotal != null && (
                <div className="mb-4">
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">VRAM</p>
                  <VramBar used={vramUsed} total={vramTotal} />
                </div>
              )}
              <button
                onClick={() => setActive('chat')}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white text-sm rounded-md transition-colors cursor-pointer"
              >
                <MessageSquare size={14} aria-hidden="true" />
                Open Chat
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">No model loaded</p>
              <button
                onClick={() => setActive('models')}
                className="text-xs px-3 py-1.5 bg-[var(--color-accent-500)] text-white rounded-md hover:bg-[var(--color-accent-600)] transition-colors cursor-pointer"
              >
                Browse Models
              </button>
            </div>
          )}
        </div>
      </section>

      {/* System Health strip — compact, secondary */}
      <section className="mb-6">
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] py-2 border-t border-b border-[var(--color-border-subtle)]">
          <span className="flex items-center gap-1.5">
            <HealthDot colour={inferenceColour} />
            Inference: {ollamaOnline ? 'Ready' : 'Offline'}
          </span>
          <span aria-hidden="true" className="text-[var(--color-border-default)]">·</span>
          <span className="flex items-center gap-1.5">
            <HealthDot colour={gpuColour} />
            GPU: {gpuTemp != null ? `${gpuTemp}°C` : 'Unknown'}
          </span>
          <span aria-hidden="true" className="text-[var(--color-border-default)]">·</span>
          <span className="flex items-center gap-1.5">
            <HealthDot colour={trainingColour} />
            Training: {trainingStatus === 'idle' ? 'Idle' : trainingStatus === 'running' ? 'Running' : 'Complete'}
          </span>
        </div>
      </section>

      {/* Quick Actions — tertiary */}
      <section>
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Quick Actions
        </p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Open Chat', icon: MessageSquare, section: 'chat' as const },
            { label: 'Start Training', icon: Zap, section: 'training' as const },
            { label: 'Browse Models', icon: Download, section: 'models' as const },
            { label: 'System Health', icon: Activity, section: 'settings' as const },
          ].map(({ label, icon: Icon, section }) => (
            <button
              key={label}
              onClick={() => setActive(section)}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-surface-2)] border border-[var(--color-border-default)] rounded-md text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors cursor-pointer"
            >
              <Icon size={13} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
```
**Step 4: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern Dashboard
```
Expected: PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/screens/Dashboard.tsx
git commit -m "feat(desktop): implement Dashboard screen with health cards, active model, quick actions"
```

---

## Task 8: Models Hub Screen

**Files:**
- Modify: `apps/desktop/src/renderer/screens/Models.tsx`
- Create: `apps/desktop/src/renderer/store/modelsStore.ts`

**Step 1: Write failing tests**

```typescript
// apps/desktop/src/renderer/screens/Models.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { Models } from './Models'

vi.mock('../services/ollamaClient', () => ({
  ollamaClient: {
    getModels: vi.fn().mockResolvedValue([
      { name: 'qwen2.5-coder:32b', size: 20_000_000_000, modified_at: '2026-01-01', digest: 'abc123' }
    ])
  }
}))

test('Models screen shows installed models', async () => {
  render(<Models />)
  await waitFor(() => {
    expect(screen.getByText('qwen2.5-coder:32b')).toBeInTheDocument()
  })
})

test('Models screen shows INSTALLED section header', async () => {
  render(<Models />)
  expect(screen.getByText('INSTALLED')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern "Models.test"
```
Expected: FAIL

**Step 3: Create models store**

```typescript
// apps/desktop/src/renderer/store/modelsStore.ts
import { create } from 'zustand'
import { OllamaModel, ollamaClient } from '../services/ollamaClient'

interface ModelsState {
  installed: OllamaModel[]
  selected: string | null
  downloading: Record<string, number> // model name -> progress 0-100
  setSelected: (name: string) => void
  loadInstalled: () => Promise<void>
}

export const useModelsStore = create<ModelsState>((set) => ({
  installed: [],
  selected: null,
  downloading: {},
  setSelected: (name) => set({ selected: name }),
  loadInstalled: async () => {
    const models = await ollamaClient.getModels()
    set({ installed: models, selected: models[0]?.name ?? null })
  },
}))
```

**Step 4: Implement Models screen (full implementation)**

```tsx
// apps/desktop/src/renderer/screens/Models.tsx
import { useEffect } from 'react'
import { CheckCircle2, Cpu, Zap, Trash2 } from 'lucide-react'
import { useModelsStore } from '../store/modelsStore'
import { useSystemStore } from '../store/systemStore'

function formatGB(bytes: number): string {
  return (bytes / 1_073_741_824).toFixed(1) + ' GB'
}

export function Models() {
  const { installed, selected, setSelected, loadInstalled } = useModelsStore()
  const { activeModel } = useSystemStore()

  useEffect(() => {
    loadInstalled()
  }, [loadInstalled])

  const selectedModel = installed.find((m) => m.name === selected)

  return (
    <div data-testid="screen-models" className="flex h-full">
      {/* Left: model list */}
      <aside className="w-[200px] flex-shrink-0 bg-[var(--color-bg-surface-1)] border-r border-[var(--color-border-subtle)] overflow-y-auto">
        <div className="px-3 py-3">
          <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            Installed
          </p>
          {installed.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] py-2">No models installed.</p>
          ) : (
            installed.map((m) => (
              <button
                key={m.name}
                onClick={() => setSelected(m.name)}
                aria-current={selected === m.name ? 'true' : undefined}
                className={[
                  'w-full text-left flex items-center gap-2 px-2 py-2 rounded-md text-xs mb-1 transition-colors cursor-pointer',
                  selected === m.name
                    ? 'bg-[var(--color-accent-500)]/10 text-[var(--color-accent-400)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]',
                ].join(' ')}
              >
                {m.name === activeModel && (
                  <CheckCircle2
                    size={10}
                    className="text-[var(--color-green-400)] flex-shrink-0"
                    aria-label="Active"
                  />
                )}
                <span className="truncate">{m.name}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Right: detail panel */}
      <main className="flex-1 overflow-y-auto p-6">
        {selectedModel ? (
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
              {selectedModel.name}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">
              {formatGB(selectedModel.size)} · Modified{' '}
              {new Date(selectedModel.modified_at).toLocaleDateString()}
            </p>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Digest', value: selectedModel.digest.slice(0, 12) + '...' },
                { label: 'Size', value: formatGB(selectedModel.size) },
                {
                  label: 'Status',
                  value: selectedModel.name === activeModel ? 'Active' : 'Installed',
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-[var(--color-bg-surface-2)] rounded-md border border-[var(--color-border-subtle)] px-3 py-2"
                >
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm text-[var(--color-text-primary)] font-mono truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => useSystemStore.setState({ activeModel: selectedModel.name })}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white text-sm rounded-md transition-colors cursor-pointer"
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                Set as Active
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] text-sm rounded-md transition-colors cursor-pointer"
                aria-label={`Fine-tune ${selectedModel.name}`}
              >
                <Zap size={14} aria-hidden="true" />
                Fine-tune
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-red-400)] hover:border-[var(--color-red-400)] text-sm rounded-md transition-colors cursor-pointer"
                aria-label={`Delete ${selectedModel.name}`}
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Cpu size={32} className="text-[var(--color-text-muted)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--color-text-muted)]">Select a model to see details</p>
          </div>
        )}
      </main>
    </div>
  )
}
```

**Step 5: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern "Models.test"
```
Expected: PASS

**Step 6: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): implement Models Hub screen with installed list and detail panel"
```

---

## Task 9: Chat Screen (Streaming)

**Files:**
- Modify: `apps/desktop/src/renderer/screens/Chat.tsx`
- Create: `apps/desktop/src/renderer/store/chatStore.ts`

**Step 1: Write failing tests**

```typescript
// apps/desktop/src/renderer/screens/Chat.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Chat } from './Chat'

vi.mock('../services/ollamaClient', () => ({
  ollamaClient: {
    streamChat: vi.fn(async function*() { yield 'Hello' })
  }
}))

test('Chat renders message input', () => {
  render(<Chat />)
  expect(screen.getByPlaceholderText(/Ask Sovereign/i)).toBeInTheDocument()
})

test('Chat sends message on Enter', async () => {
  render(<Chat />)
  const input = screen.getByPlaceholderText(/Ask Sovereign/i)
  fireEvent.change(input, { target: { value: 'hello' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(await screen.findByText('hello')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/desktop && npm test -- --testPathPattern "Chat.test"
```
Expected: FAIL

**Step 3: Create chat store**

```typescript
// apps/desktop/src/renderer/store/chatStore.ts
import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  streaming?: boolean
}

interface ChatState {
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  appendToLast: (content: string) => void
  setLastStreaming: (streaming: boolean) => void
  clear: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendToLast: (content) =>
    set((s) => {
      const msgs = [...s.messages]
      if (msgs.length === 0) return s
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + content }
      return { messages: msgs }
    }),
  setLastStreaming: (streaming) =>
    set((s) => {
      const msgs = [...s.messages]
      if (msgs.length === 0) return s
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], streaming }
      return { messages: msgs }
    }),
  clear: () => set({ messages: [] }),
}))
```

**Step 4: Implement Chat screen**

See design: `docs/plans/2026-04-01-ui-ux-design.md` Section 4.3.

Key implementation notes:
- Message list scrolls to bottom on new message (use `useRef` + `scrollIntoView`)
- User presses Enter (without Shift) to send
- When streaming, show animated cursor (`█`) at end of assistant message
- Code blocks in assistant messages get syntax-highlighted with `highlight.js`
- Context panel on the right (collapsible) shows tokens used and model name from `useSystemStore`

**Step 5: Run test to verify it passes**

```bash
cd apps/desktop && npm test -- --testPathPattern "Chat.test"
```
Expected: PASS

**Step 6: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "feat(desktop): implement Chat screen with streaming support and chat store"
```

---

## Task 10: Integration Test — Full App Renders

**Files:**
- Create: `apps/desktop/src/renderer/App.test.tsx`

**Step 1: Write integration test**

```typescript
// apps/desktop/src/renderer/App.test.tsx
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./services/ollamaClient', () => ({
  ollamaClient: {
    isOnline: vi.fn().mockResolvedValue(false),
    getModels: vi.fn().mockResolvedValue([]),
  }
}))

test('App renders without crashing', () => {
  render(<App />)
  expect(screen.getByText('Running Locally')).toBeInTheDocument()
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(screen.getByText('Models')).toBeInTheDocument()
  expect(screen.getByText('Chat')).toBeInTheDocument()
})

test('App shows dashboard screen by default', () => {
  render(<App />)
  expect(screen.getByTestId('screen-dashboard')).toBeInTheDocument()
})
```

**Step 2: Run integration test**

```bash
cd apps/desktop && npm test -- --testPathPattern "App.test"
```
Expected: PASS (all 2 tests green)

**Step 3: Run full test suite**

```bash
cd apps/desktop && npm test
```
Expected: All tests pass. 0 failures.

**Step 4: Do a manual smoke test in dev mode**

```bash
cd apps/desktop && npm run dev
```

Verify:
- [ ] Window opens with dark background
- [ ] Sidebar shows all 6 nav items
- [ ] Status bar shows "Running Locally" badge
- [ ] Clicking "Models" in sidebar switches to Models screen
- [ ] Clicking "Chat" in sidebar switches to Chat screen
- [ ] Typing in chat input and pressing Enter shows user message

**Step 5: Commit**

```bash
git add apps/desktop/
git commit -m "feat(desktop): Phase 1 MVP complete — app shell, dashboard, models hub, chat with streaming"
```

---

## Task 10b: Accessibility Pass

**Files:**
- Modify: `apps/desktop/src/renderer/components/layout/Sidebar.tsx`
- Modify: `apps/desktop/src/renderer/components/layout/StatusBar.tsx`

**Step 1: Write accessibility-focused tests**

```typescript
// Add to apps/desktop/src/renderer/components/layout/Sidebar.test.tsx
test('active nav item has aria-current="page"', () => {
  const { useNavigationStore } = require('../../store/navigationStore')
  useNavigationStore.setState({ active: 'chat' })
  render(<Sidebar />)
  const chatButton = screen.getByText('Chat').closest('button')
  expect(chatButton).toHaveAttribute('aria-current', 'page')
})

test('inactive nav items do not have aria-current', () => {
  render(<Sidebar />)
  const dashboardButton = screen.getByText('Dashboard').closest('button')
  expect(dashboardButton).not.toHaveAttribute('aria-current', 'page')
})

// Add to apps/desktop/src/renderer/components/layout/StatusBar.test.tsx
test('StatusBar has role="status"', () => {
  render(<StatusBar />)
  expect(screen.getByRole('status')).toBeInTheDocument()
})
```

**Step 2: Run tests to verify they fail (if aria-current/role not yet applied)**

```bash
cd apps/desktop && npm test -- --testPathPattern "Sidebar|StatusBar"
```

Expected: Tests for `aria-current` and `role=status` fail if not yet applied from Tasks 3/4.

**Step 3: Verify fixes are in place**

Confirm from Tasks 3 and 4:
- `Sidebar.tsx` nav buttons have `aria-current={active === id ? 'page' : undefined}`
- `StatusBar.tsx` `<footer>` has `role="status"` and `aria-label="System status"`
- All decorative icons have `aria-hidden="true"`
- All separator `|` spans have `aria-hidden="true"`

Run:
```bash
cd apps/desktop && npm test -- --testPathPattern "Sidebar|StatusBar"
```

Expected: PASS

**Step 4: Run full test suite**

```bash
cd apps/desktop && npm test
```

Expected: All tests pass. 0 failures.

**Step 5: Lighthouse accessibility note**

After `npm run dev`, open Chromium DevTools in the Electron window and run Lighthouse:

```bash
# In the Electron renderer DevTools console:
# Open DevTools → Lighthouse tab → Accessibility only → Generate report
```

Target score: **100**. Common failure patterns to check:
- Contrast: `text-secondary` (#A3A3A3) on `bg-surface-1` (#161616) → ~6.1:1 ✓ passes WCAG AA
- Contrast: `text-muted` (#737373) on `bg-surface-2` (#1E1E1E) → ~4.6:1 ✓ passes WCAG AA (verify in practice)
- Button names: every `<button>` must have accessible name (text content or `aria-label`)
- Focus visible: Electron's Chromium shows default focus ring — verify not suppressed by `outline-none`

**Step 6: Commit**

```bash
git add apps/desktop/src/renderer/
git commit -m "a11y(desktop): add aria-current to sidebar nav, role=status to status bar, aria-hidden to decorative icons"
```

---

## Completion Checklist (Status as of 2026-04-03)

- [x] Desktop tests pass in `apps/desktop` baseline suites
- [x] App shell + navigation + status bar implemented
- [x] Dashboard / Models / Chat wired and renderable
- [x] Core tokenized styling aligned with design system
- [x] Accessibility essentials present (`aria-current`, `role="status"`, decorative icon rules)
- [ ] Voice E2E integration tests enabled in CI by default (currently opt-in/skip controlled)
- [ ] Lighthouse accessibility evidence refreshed for latest branch state

---

## Historical Scope Note

This file is a Phase 1 implementation artifact and should be treated as archived planning context.

Features originally listed as deferred (for example agent mode, training console, federation console, trace/graph) are now implemented in later phases. Keep this document for historical traceability only.
