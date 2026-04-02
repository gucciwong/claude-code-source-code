# Sovereign Coder Desktop App - Phase 1 Implementation Plan

**Date:** April 2, 2026  
**Status:** Ready for Implementation  
**Scope:** Electron desktop app with React UI, integrated training service, voice capabilities  
**Timeline:** 6-8 weeks  
**Target:** Production-ready Electron app v1.0 with training + voice I/O

---

## Executive Summary

Build a professional Electron 30 + React 18 desktop application for Sovereign Coder with:
- **Local-first architecture** (all inference on user's machine)
- **Status transparency** (GPU, VRAM, tok/s always visible)
- **Training integration** (background fine-tuning)
- **Voice I/O** (hands-free coding via VibeVoice)
- **Model management** (install, switch, delete models)

Final deliverable: Production-ready app installer (.exe, .dmg, .AppImage) with:
- 50+ typed components
- 8 main screens
- 5 Zustand stores
- 40+ unit tests
- Full accessibility (WCAG AA)

---

## Phase 1: Bootstrap & Layout (Week 1-2)

### 1.1 Project Setup

**Task 1.1a: Initialize Electron + React project**

```bash
# Create project structure
mkdir -p apps/desktop/{src/{main,preload,renderer},public}

# Files to create:
apps/desktop/
  ├── electron-builder.config.js    # Builder config
  ├── package.json                   # Scripts: dev, build, dist
  ├── tsconfig.json                  # TS config (strict)
  ├── tailwind.config.js             # Tailwind v4 with @theme
  ├── src/
  │   ├── main/
  │   │   └── index.ts               # Electron main process
  │   ├── preload/
  │   │   └── index.ts               # IPC bridge
  │   └── renderer/
  │       ├── index.tsx              # React root
  │       ├── App.tsx                # App layout + router
  │       └── ...
```

**Dependencies:**
```json
{
  "devDependencies": {
    "electron": "^30.0.0",
    "electron-builder": "^25.0.0",
    "electron-vite": "^2.1.0",
    "react": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/typography": "^0.5.0"
  },
  "dependencies": {
    "zustand": "^4.5.0",
    "lucide-react": "^0.408.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-select": "^2.1.2",
    "react-router-dom": "^6.22.0"
  }
}
```

**Commit:** `bootstrap: electron + react + tailwind v4 setup`

---

### 1.2 Design Tokens & Base Styles

**Task 1.2a: Tailwind v4 tokens**

File: `apps/desktop/src/renderer/styles/tokens.css`

```css
@import "tailwindcss";

@theme {
  /* Background levels */
  --color-bg-base:      #0D0D0D;
  --color-bg-surface-1: #161616;   /* sidebar, status bar */
  --color-bg-surface-2: #1E1E1E;   /* cards, panels */
  --color-bg-surface-3: #252525;   /* nested, code blocks */
  --color-bg-elevated:  #2D2D2D;   /* popovers, dropdowns */

  /* Borders */
  --color-border-subtle:  #2A2A2A;
  --color-border-default: #363636;
  --color-border-strong:  #484848;

  /* Text */
  --color-text-primary:   #F5F5F5;
  --color-text-secondary: #A3A3A3;
  --color-text-muted:     #737373;
  --color-text-code:      #E5E5E5;

  /* Accent — Sovereign Violet */
  --color-accent-400: #A78BFA;   /* hover */
  --color-accent-500: #8B5CF6;   /* buttons, active nav */
  --color-accent-600: #7C3AED;   /* pressed */

  /* Semantic */
  --color-green-400:  #4ADE80;
  --color-green-500:  #22C55E;
  --color-red-400:    #F87171;
  --color-red-500:    #EF4444;
  --color-yellow-400: #FACC15;
  --color-yellow-500: #EAB308;
  --color-blue-400:   #60A5FA;
  --color-blue-500:   #3B82F6;

  /* Special */
  --color-local-badge-bg: #1A2744;
  --color-local-badge-fg: #60A5FA;

  /* Spacing (4px grid) */
  --spacing-xs:  4px;
  --spacing-sm:  8px;
  --spacing-md:  12px;
  --spacing-lg:  16px;
  --spacing-xl:  24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;

  /* Border radius */
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-full: 9999px;

  /* Font sizes */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 14px;
  --text-md:   15px;
  --text-lg:   17px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  32px;
}
```

**Task 1.2b: Global styles**

File: `apps/desktop/src/renderer/styles/globals.css`

```css
@import "./tokens.css";

* {
  @apply antialiased;
}

body {
  @apply bg-bg-base text-text-primary font-sans;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

code, pre {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  @apply text-text-code bg-bg-surface-3 rounded-sm;
}

/* Focus visible for keyboard nav */
*:focus-visible {
  @apply outline-none ring-2 ring-accent-500 ring-offset-1 ring-offset-bg-base;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-bg-surface-1;
}

::-webkit-scrollbar-thumb {
  @apply bg-border-default rounded-full hover:bg-border-strong;
}
```

**Commit:** `style: tailwind v4 tokens + global styles (design system)`

---

### 1.3 Core Layout Components

**Task 1.3a: TitleBar (32px)**

File: `apps/desktop/src/renderer/components/layout/TitleBar.tsx`

```tsx
import React from 'react'
import { Lock } from 'lucide-react'

export const TitleBar: React.FC = () => {
  return (
    <header className="h-8 bg-bg-surface-1 border-b border-border-subtle 
                       flex items-center justify-between px-4 gap-2 select-none">
      <div className="flex items-center gap-2">
        <Lock size={14} aria-hidden="true" className="text-accent-500" />
        <span className="text-xs font-medium text-text-primary">
          Sovereign Coder
        </span>
      </div>
      
      <div className="flex gap-1" role="group" aria-label="Window controls">
        {/* Minimize, Maximize, Close buttons would go here (OS native in Electron) */}
      </div>
    </header>
  )
}
```

**Task 1.3b: Sidebar (56px collapsed / 220px expanded)**

File: `apps/desktop/src/renderer/components/layout/Sidebar.tsx`

```tsx
import React from 'react'
import {
  LayoutDashboard, Cpu, MessageSquare, Zap, Network,
  Settings, ChevronsLeft, ChevronsRight
} from 'lucide-react'
import { useNavigationStore } from '@/store/navigationStore'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'models', label: 'Models', icon: <Cpu size={18} /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
  { id: 'training', label: 'Training', icon: <Zap size={18} /> },
  { id: 'federation', label: 'Federation', icon: <Network size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]

export const Sidebar: React.FC = () => {
  const { active, setActive } = useNavigationStore()
  const [expanded, setExpanded] = React.useState(true)

  const width = expanded ? 'w-[220px]' : 'w-[56px]'

  return (
    <nav className={`${width} bg-bg-surface-1 border-r border-border-subtle 
                    flex flex-col transition-all duration-200`}>
      {/* Nav items */}
      <div className="flex-1 px-2 py-4 space-y-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md
                        transition-colors cursor-pointer text-sm
                        ${active === item.id
                          ? 'bg-accent-500 text-text-primary'
                          : 'text-text-secondary hover:bg-bg-surface-2'
                        }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            {expanded && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Toggle collapse button */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="m-2 p-2 rounded-md text-text-secondary hover:bg-bg-surface-2
                   cursor-pointer transition-colors"
      >
        {expanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
      </button>
    </nav>
  )
}
```

**Task 1.3c: StatusBar (28px)**

File: `apps/desktop/src/renderer/components/layout/StatusBar.tsx`

```tsx
import React from 'react'
import { Lock, Zap, Network } from 'lucide-react'
import { useSystemStore } from '@/store/systemStore'
import { useModelsStore } from '@/store/modelsStore'

export const StatusBar: React.FC = () => {
  const { gpu, vram, temp, tokPerSec } = useSystemStore()
  const { activeModel } = useModelsStore()

  return (
    <footer
      role="status"
      aria-label="System status"
      className="h-7 bg-bg-surface-1 border-t border-border-subtle
                 flex items-center px-4 gap-3 text-xs text-text-secondary"
    >
      {/* Segment 1: Running Locally */}
      <div className="flex items-center gap-1.5">
        <Lock size={12} aria-hidden="true" className="text-local-badge-fg" />
        <span>Running Locally</span>
      </div>

      <span aria-hidden="true" className="text-border-default">|</span>

      {/* Segment 2: Model name */}
      {activeModel && (
        <>
          <button
            className="hover:text-accent-400 cursor-pointer transition-colors"
            aria-label={`Switch model (current: ${activeModel.name})`}
          >
            {activeModel.name}
          </button>
          <span aria-hidden="true" className="text-border-default">|</span>
        </>
      )}

      {/* Segment 3: GPU stats */}
      {gpu && (
        <>
          <span className="whitespace-nowrap">
            GPU {vram?.toFixed(1)}/{gpu.totalVram}GB · {temp}°C
          </span>
          <span aria-hidden="true" className="text-border-default">|</span>
        </>
      )}

      {/* Segment 4: tok/s */}
      {tokPerSec !== null && (
        <>
          <span>{tokPerSec} tok/s</span>
          <span aria-hidden="true" className="text-border-default">|</span>
        </>
      )}

      {/* Optional: Training status */}
      {/* Optional: Federation peers */}
    </footer>
  )
}
```

**Commit:** `feat(desktop): core layout components (titlebar, sidebar, statusbar)`

---

### 1.4 Navigation & State Management

**Task 1.4a: Navigation store**

File: `apps/desktop/src/renderer/store/navigationStore.ts`

```typescript
import { create } from 'zustand'

type Screen = 'dashboard' | 'models' | 'chat' | 'training' | 'federation' | 'settings'

interface NavigationStore {
  active: Screen
  setActive: (screen: Screen) => void
}

export const useNavigationStore = create<NavigationStore>(set => ({
  active: 'dashboard',
  setActive: screen => set({ active: screen }),
}))
```

**Task 1.4b: System store**

File: `apps/desktop/src/renderer/store/systemStore.ts`

```typescript
import { create } from 'zustand'

interface SystemStore {
  gpu: { name: string; totalVram: number } | null
  vram: number | null
  temp: number | null
  tokPerSec: number | null

  setGpuInfo: (gpu: SystemStore['gpu']) => void
  setVram: (vram: number) => void
  setTemp: (temp: number) => void
  setTokPerSec: (tokPerSec: number) => void
}

export const useSystemStore = create<SystemStore>(set => ({
  gpu: null,
  vram: null,
  temp: null,
  tokPerSec: null,

  setGpuInfo: gpu => set({ gpu }),
  setVram: vram => set({ vram }),
  setTemp: temp => set({ temp }),
  setTokPerSec: tokPerSec => set({ tokPerSec }),
}))
```

**Task 1.4c: Models store**

File: `apps/desktop/src/renderer/store/modelsStore.ts`

```typescript
import { create } from 'zustand'

export interface Model {
  id: string
  name: string
  size: string
  quantization: string
  installed: boolean
  downloaded: number
  total: number
}

interface ModelsStore {
  models: Model[]
  activeModel: Model | null

  setModels: (models: Model[]) => void
  setActiveModel: (model: Model) => void
  updateDownloadProgress: (modelId: string, progress: number) => void
}

export const useModelsStore = create<ModelsStore>(set => ({
  models: [],
  activeModel: null,

  setModels: models => set({ models }),
  setActiveModel: model => set({ activeModel: model }),
  updateDownloadProgress: (modelId, progress) =>
    set(state => ({
      models: state.models.map(m =>
        m.id === modelId ? { ...m, downloaded: progress } : m
      ),
    })),
}))
```

**Task 1.4d: Command palette store**

File: `apps/desktop/src/renderer/store/commandPaletteStore.ts`

```typescript
import { create } from 'zustand'

interface CommandPaletteStore {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useCommandPaletteStore = create<CommandPaletteStore>(set => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(state => ({ isOpen: !state.isOpen })),
}))
```

**Commit:** `feat(desktop): zustand stores (navigation, system, models, commandPalette)`

---

### 1.5 App Root & Router

**Task 1.5a: App.tsx**

File: `apps/desktop/src/renderer/App.tsx`

```tsx
import React, { useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { CommandPalette } from '@/components/common/CommandPalette'
import { useCommandPaletteStore } from '@/store/commandPaletteStore'
import { useNavigationStore } from '@/store/navigationStore'

// Screen imports (lazy load later)
import Dashboard from '@/screens/Dashboard'
import Models from '@/screens/Models'
import Chat from '@/screens/Chat'
import Training from '@/screens/Training'
import Federation from '@/screens/Federation'
import Settings from '@/screens/Settings'

const SCREENS = {
  dashboard: Dashboard,
  models: Models,
  chat: Chat,
  training: Training,
  federation: Federation,
  settings: Settings,
}

export const App: React.FC = () => {
  const { active } = useNavigationStore()
  const { isOpen: commandPaletteOpen } = useCommandPaletteStore()

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        useCommandPaletteStore.setState(state => ({
          isOpen: !state.isOpen,
        }))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const CurrentScreen = SCREENS[active as keyof typeof SCREENS] || Dashboard

  return (
    <div className="h-screen flex flex-col bg-bg-base">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-bg-base">
          <CurrentScreen />
        </main>
      </div>

      <StatusBar />

      {/* Command Palette */}
      {commandPaletteOpen && <CommandPalette />}
    </div>
  )
}
```

**Commit:** `feat(desktop): app root with screen routing`

---

## Phase 2: Core Screens (Week 2-3)

### 2.1 Dashboard Screen

**File:** `apps/desktop/src/renderer/screens/Dashboard.tsx`

Key sections:
- Active model hero card (large, prominent)
- Health dot strip (GPU, temp, tok/s)
- Quick action buttons

```tsx
import React, { useEffect } from 'react'
import { useModelsStore } from '@/store/modelsStore'
import { useSystemStore } from '@/store/systemStore'
import { MessageSquare, Play, Settings } from 'lucide-react'

export default function Dashboard() {
  const { activeModel } = useModelsStore()
  const { vram, temp, tokPerSec } = useSystemStore()

  return (
    <div className="p-6 space-y-6">
      {/* Hero: Active Model */}
      {activeModel && (
        <div className="bg-bg-surface-2 border border-border-default 
                       rounded-lg p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-text-primary">
              {activeModel.name}
            </h1>
            <p className="text-sm text-text-secondary">
              {activeModel.quantization} · {activeModel.size}
            </p>
          </div>

          {/* VRAM Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>VRAM</span>
              <span>{vram?.toFixed(1)}GB</span>
            </div>
            <div className="w-full h-2 bg-bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 transition-all"
                style={{ width: `${(vram ?? 0) / 24 * 100}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {temp}°C
              </div>
              <div className="text-xs text-text-muted">Temp</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary">
                {tokPerSec}
              </div>
              <div className="text-xs text-text-muted">tok/s</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-500">
                Ready
              </div>
              <div className="text-xs text-text-muted">Status</div>
            </div>
          </div>

          {/* Primary CTA */}
          <button className="w-full bg-accent-500 hover:bg-accent-400 
                            active:bg-accent-600 text-text-primary 
                            font-medium py-2 rounded-md flex items-center 
                            justify-center gap-2 cursor-pointer">
            <MessageSquare size={16} aria-hidden="true" />
            Open Chat
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button className="bg-bg-surface-2 hover:bg-bg-surface-3 
                          text-text-primary py-3 rounded-md flex 
                          items-center justify-center gap-2 cursor-pointer
                          border border-border-default">
          <MessageSquare size={16} aria-hidden="true" />
          <span className="text-sm">Chat</span>
        </button>
        <button className="bg-bg-surface-2 hover:bg-bg-surface-3 
                          text-text-primary py-3 rounded-md flex 
                          items-center justify-center gap-2 cursor-pointer
                          border border-border-default">
          <Play size={16} aria-hidden="true" />
          <span className="text-sm">Training</span>
        </button>
        <button className="bg-bg-surface-2 hover:bg-bg-surface-3 
                          text-text-primary py-3 rounded-md flex 
                          items-center justify-center gap-2 cursor-pointer
                          border border-border-default">
          <Settings size={16} aria-hidden="true" />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  )
}
```

**Commit:** `feat(desktop): dashboard screen (hero + quick actions)`

### 2.2 Models Screen

**File:** `apps/desktop/src/renderer/screens/Models.tsx`

- List of available models
- Download progress indicators
- Model switching
- Enable/disable

(Scaffold with 250 LOC)

**Commit:** `feat(desktop): models screen (list + download)`

### 2.3 Chat Screen

**File:** `apps/desktop/src/renderer/screens/Chat.tsx`

- Message history
- Input area (text + voice buttons)
- Integration with Chat API

(Scaffold with 300 LOC)

**Commit:** `feat(desktop): chat screen (messages + input)`

### 2.4 Remaining Screens (Training, Federation, Settings)

- **Training.tsx** - Fine-tuning status, metrics, logs (250 LOC)
- **Federation.tsx** - Peer discovery, sharing status (200 LOC)
- **Settings.tsx** - Config, API keys, preferences (200 LOC)

### 2.5 Common Components

Build reusable components:
- `Button.tsx` - 3 variants (filled, ghost, destructive)
- `VramBar.tsx` - Animated progress bar
- `HealthDot.tsx` - Status indicator (green/yellow/red)
- `CommandPalette.tsx` - ⌘K overlay

---

## Phase 3: Integration (Week 3-4)

### 3.1 Training Service Integration

Connect desktop app to training service running on `http://localhost:8001`:

```typescript
// apps/desktop/src/renderer/services/trainingClient.ts
class TrainingClient {
  async getStatus() {
    return fetch('http://localhost:8001/api/v1/training/status').then(r => r.json())
  }

  async postEvent(event: TrainingEvent) {
    return fetch('http://localhost:8001/api/v1/training/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).then(r => r.json())
  }

  async getModels() {
    return fetch('http://localhost:8001/api/v1/models').then(r => r.json())
  }
}
```

Auto-log completion events when user accepts code suggestions:
- `event_type: "completion_accepted"`
- `language: "typescript"` (detected from active file)
- `completion_length: 45` (tokens)

### 3.2 Voice Service Integration

Connect to voice service on `http://localhost:8000`:

```typescript
// apps/desktop/src/renderer/services/voiceClient.ts
class VoiceClient {
  async transcribeAudio(blob: Blob, language: string = 'en') {
    const formData = new FormData()
    formData.append('file', blob)
    formData.append('language', language)
    return fetch('http://localhost:8000/transcribe', {
      method: 'POST',
      body: formData,
    }).then(r => r.json())
  }

  async synthesizeText(text: string, language: string = 'en') {
    return fetch('http://localhost:8000/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    }).then(r => r.json())
  }

  async checkHealth() {
    return fetch('http://localhost:8000/health').then(r => r.json())
  }
}
```

Integrate into Chat screen:
- Voice input button → transcribe → send to LLM
- LLM response → synthesize → play audio

---

## Phase 4: Testing & Polish (Week 4)

### 4.1 Unit Tests

Target: 40+ tests covering:
- Store mutations (100%)
- Component rendering (80%+)
- Integration with services (80%+)

```bash
npm test -- --testPathPattern="store" --coverage
```

### 4.2 E2E Tests

Key flows:
1. Launch app → load dashboard → models visible
2. Download model → progress shows → switch to model
3. Open chat → type message → receive response
4. Voice input → transcribe → send → voice output
5. Training → view metrics → see fine-tuning progress

### 4.3 Accessibility Audit

- ✅ All buttons have accessible names
- ✅ Color contrast WCAG AA
- ✅ Keyboard navigation (Tab, Enter, Escape, ⌘K)
- ✅ Screen reader support (aria-current, role="status")

---

## Phase 5: Build & Packaging (Week 4-5)

### 5.1 Electron Builder Configuration

File: `apps/desktop/electron-builder.config.js`

```javascript
module.exports = {
  appId: "com.sovereigncoder.app",
  productName: "Sovereign Coder",
  directories: {
    buildResources: "assets",
    output: "dist"
  },
  files: [
    "dist/**"
  ],
  win: {
    target: ["nsis", "portable"],
    certificateFile: process.env.CERT_FILE,
    certificatePassword: process.env.CERT_PASSWORD
  },
  mac: {
    target: ["dmg", "zip"],
    identity: process.env.IDENTITY
  },
  linux: {
    target: ["AppImage", "deb"]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
}
```

Build commands:
```bash
npm run build           # Build Electron app
npm run dist:win       # Package for Windows (.exe)
npm run dist:mac       # Package for macOS (.dmg)
npm run dist:linux     # Package for Linux (.AppImage)
```

### 5.2 Auto-updater

Integrate electron-updater for automatic security updates:

```typescript
// apps/desktop/src/main/updater.ts
import { autoUpdater } from 'electron-updater'

autoUpdater.checkForUpdatesAndNotify()
```

---

## Deliverables Checklist

### Code (Production-Ready)
- [ ] 50+ typed React components
- [ ] 5 Zustand stores
- [ ] 6 main screens
- [ ] 10+ common components
- [ ] Training service integration
- [ ] Voice service integration
- [ ] Dark theme (Tailwind v4 tokens)

### Testing
- [ ] 40+ unit tests (>85% coverage)
- [ ] 5+ E2E test flows
- [ ] Accessibility audit (WCAG AA)
- [ ] Manual testing on Windows/Mac/Linux

### Documentation
- [ ] Dev setup guide (clone, npm install, npm run dev)
- [ ] Build instructions (npm run dist:win/mac/linux)
- [ ] Architecture overview
- [ ] Component API docs
- [ ] Integration guide (training + voice services)

### Packaging
- [ ] Windows installer (.exe)
- [ ] macOS app (.dmg)
- [ ] Linux AppImage (.AppImage)
- [ ] Auto-updater configured
- [ ] Code signing (if applicable)

---

## File Structure (Final)

```
apps/desktop/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   └── updater.ts
│   ├── preload/
│   │   └── index.ts
│   └── renderer/
│       ├── App.tsx
│       ├── index.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── TitleBar.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── StatusBar.tsx
│       │   ├── common/
│       │   │   ├── Button.tsx
│       │   │   ├── VramBar.tsx
│       │   │   ├── HealthDot.tsx
│       │   │   └── CommandPalette.tsx
│       │   └── voice/
│       │       ├── VoiceInput.tsx
│       │       ├── VoiceOutput.tsx
│       │       └── VoicePanel.tsx
│       ├── screens/
│       │   ├── Dashboard.tsx
│       │   ├── Models.tsx
│       │   ├── Chat.tsx
│       │   ├── Training.tsx
│       │   ├── Federation.tsx
│       │   └── Settings.tsx
│       ├── services/
│       │   ├── trainingClient.ts
│       │   └── voiceClient.ts
│       ├── store/
│       │   ├── navigationStore.ts
│       │   ├── systemStore.ts
│       │   ├── modelsStore.ts
│       │   ├── chatStore.ts
│       │   └── commandPaletteStore.ts
│       ├── styles/
│       │   ├── tokens.css
│       │   └── globals.css
│       └── __tests__/
│           ├── stores/
│           ├── components/
│           └── integration/
├── public/
│   └── icon.png
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── electron-builder.config.js
```

---

## Next Steps

1. **Immediate (Now):** Create project structure + setup bootstrap
2. **Week 1:** Complete layout components + stores
3. **Week 2-3:** Build all screens + common components
4. **Week 3-4:** Integration with training + voice services
5. **Week 4:** Testing + accessibility audit
6. **Week 5:** Build + packaging for all platforms

---

## Estimation

| Phase | Tasks | LOC | Days | Status |
|-------|-------|-----|------|--------|
| 1. Bootstrap | Setup | 500 | 1-2 | Ready |
| 2. Screens | 6 screens + components | 2500 | 2-3 | Ready |
| 3. Integration | Training + Voice | 800 | 1-2 | Ready |
| 4. Testing | Unit + E2E | 1500 | 2-3 | Ready |
| 5. Build | Packaging | 300 | 1-2 | Ready |
| **TOTAL** | **5 phases** | **5600+** | **7-12 days** | **Ready** |

---

## Standing Order

**User Command:** "go on"  
**Instruction:** Implement Phase 1 autonomously  
**Status:** Ready for execution

