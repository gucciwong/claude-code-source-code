# CLAUDE.md — Sovereign Coder & Claude Code Source

Coding-agent rules for this repository. Read this file before making any changes.

---

## Repository Overview

This repository contains two distinct projects:

| Layer | What it is | Stack |
|---|---|---|
| **Claude Code source** (`src/`) | Decompiled terminal CLI app v2.1.88 — research/reference only | Node.js, React, Ink (terminal renderer), TypeScript |
| **Sovereign Coder desktop** (`apps/desktop/` — to be built) | New Electron desktop AI coding assistant | Electron 30, React 18, TypeScript 5, Tailwind CSS v4, Radix UI, Lucide React, Zustand |

**Never modify `src/` for feature work.** It is read-only reference code. All new UI work goes in `apps/desktop/`.

---

## Part 1: Existing Claude Code Source (Reference Only)

### 1.1 Architecture

This is a **terminal UI application**, not a web app. It renders to the terminal using a custom Ink renderer, not HTML/CSS.

```
src/
  ink/           — custom terminal renderer (Ink fork: Box, Text, events)
  components/
    design-system/ — ThemedBox, ThemedText, ThemeProvider, color.ts, Dialog, Pane, ProgressBar, etc.
    screens/     — terminal screen components (REPL, Doctor, ResumeConversation)
    ...          — 100+ terminal UI components
  utils/
    theme.ts     — ALL color tokens (TypeScript objects, rgb() strings)
  state/         — Zustand-like state with AppState
  tools/         — AI tool implementations
```

### 1.2 Design Token System (Terminal / Ink)

Tokens are TypeScript object literals in [`src/utils/theme.ts`](src/utils/theme.ts).

**Theme type:**
```typescript
// src/utils/theme.ts
export type Theme = {
  autoAccept: string
  text: string
  inactive: string
  subtle: string
  suggestion: string
  success: string
  error: string
  warning: string
  diffAdded: string
  diffRemoved: string
  // ... ~60 more semantic keys
}

export type ThemeName = 'dark' | 'light' | 'light-daltonized' | 'dark-daltonized' | 'light-ansi' | 'dark-ansi'
export type ThemeSetting = 'auto' | ThemeName  // 'auto' = follow terminal
```

**Color format:** raw `rgb(r,g,b)` strings or ANSI (`ansi:magenta`, `ansi256(n)`).

**Theme lookup:**
```typescript
import { getTheme } from '../utils/theme.js'
const theme = getTheme('dark')   // → Theme object
theme.success                    // → 'rgb(44,122,57)'
```

**React hook:**
```typescript
import { useTheme } from '../components/design-system/ThemeProvider.js'
const [themeName] = useTheme()   // 'dark' | 'light' | ...
```

### 1.3 Component Primitives (Terminal)

All terminal UI goes through these wrappers. **Never use raw `ink` primitives directly in new code.**

```typescript
// src/ink.ts — the correct import for all terminal UI work
import { Box, Text, color } from '../../ink.js'
// Box = ThemedBox (theme-aware borderColor, backgroundColor)
// Text = ThemedText (theme-aware color, backgroundColor)

// Theme key usage (preferred over hardcoded colors):
<Text color="success">✓ Done</Text>
<Box borderColor="permission" borderStyle="round">...</Box>

// Raw color fallback (bypass theme):
<Text color="rgb(255,0,0)">...</Text>
<Text color="#FF0000">...</Text>
```

**Design-system components:**
```
src/components/design-system/
  ThemedBox.tsx      — Box with theme key color resolution
  ThemedText.tsx     — Text with theme key color resolution
  ThemeProvider.tsx  — Context + useTheme() / useThemeSetting()
  color.ts           — color(key, theme) curried fn for non-JSX use
  Dialog.tsx         — Confirm/cancel dialog with keybinding integration
  Pane.tsx           — Slash-command screen region (border + padding)
  ProgressBar.tsx    — Unicode block-char progress bar
  StatusIcon.tsx     — ✓ ✗ ⚠ ℹ ○ … indicators
  Tabs.tsx           — Tabbed layout
  FuzzyPicker.tsx    — Fuzzy-search list picker
  ListItem.tsx       — Consistent list item
  Divider.tsx        — Horizontal rule
  Byline.tsx         — Keyboard shortcut footer bar
  KeyboardShortcutHint.tsx — Inline keybinding hint
```

### 1.4 Styling Rules (Terminal Components)

- **No CSS.** No Tailwind. No styled-components. Terminal only.
- Pass `keyof Theme` values to `color` / `backgroundColor` props.
- Use `Box` flexbox props (`flexDirection`, `padding`, `gap`, `width`, `height`) for layout.
- Do not hardcode `rgb()` values — use theme keys.
- Icons: `figures` package (Unicode glyphs), not Lucide.

### 1.5 Build System

- **Runtime:** Node.js ≥ 18 (ESM)
- **Bundler:** esbuild (via `scripts/build.mjs`)
- **TypeScript:** `tsconfig.json` (strict)
- **Original runtime:** Bun with compile-time `feature()` / `bun:bundle` macros → stubbed out in this source
- **Build:** `npm run build` → `dist/cli.js`
- **Tests:** `npm run test:sovereign` → Node.js `--test` runner on `scripts/tests/*.test.mjs`

---

## Part 2: Sovereign Coder Desktop App (Active Development)

The new Electron desktop app. Plans are in `docs/plans/`. Code should go in `apps/desktop/` (not yet created — create it when beginning implementation).

### 2.1 Stack

| Concern | Technology |
|---|---|
| Shell | Electron 30 (main process + renderer) |
| UI framework | React 18 with TypeScript 5 |
| Build | electron-vite |
| Styling | **Tailwind CSS v4** with `@theme` CSS variables |
| Component primitives | **Radix UI** (Dialog, Tabs, Select, etc.) |
| Icons | **Lucide React** — never emoji as icon substitutes |
| State | **Zustand** stores |
| Testing | **Vitest** + **Testing Library** (TDD: red → green → commit) |

### 2.2 Design Token System (Desktop / Tailwind v4)

Tokens live in `apps/desktop/src/renderer/styles/tokens.css` using Tailwind v4 `@theme` syntax.

```css
/* apps/desktop/src/renderer/styles/tokens.css */
@theme {
  /* Background levels */
  --color-bg-base:      #0D0D0D;
  --color-bg-surface-1: #161616;  /* sidebar, status bar */
  --color-bg-surface-2: #1E1E1E;  /* cards, panels */
  --color-bg-surface-3: #252525;  /* nested cards, code blocks */
  --color-bg-elevated:  #2D2D2D;  /* popovers, dropdowns */

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
  --color-accent-500: #8B5CF6;   /* buttons, active nav, links */
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
}
```

**In Tailwind classes:** use `bg-bg-base`, `text-text-primary`, `border-border-default`, `bg-accent-500`, etc.

**Never hardcode hex values in JSX.** Always use Tailwind classes that reference CSS variables.

### 2.3 Typography

Font stack — system UI, no external fonts required at runtime:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
/* code: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace */
```

Text scale (add to `@theme`):
```
xs   → 11px  (timestamps, badges)
sm   → 13px  (labels, table cells)
base → 14px  (body, sidebar labels)
md   → 15px  (chat messages)
lg   → 17px  (panel headings)
xl   → 20px  (screen titles)
2xl  → 24px  (onboarding headings)
3xl  → 32px  (empty state headings)
```

### 2.4 Component File Conventions

```
apps/desktop/src/renderer/
  components/
    layout/
      Sidebar.tsx          — nav sidebar (56px collapsed / 220px expanded)
      StatusBar.tsx        — 28px persistent footer
      TitleBar.tsx         — 32px top bar
    screens/
      Dashboard.tsx        — /dashboard
      Models.tsx           — /models
      Chat.tsx             — /chat
      Training.tsx         — /training
      Federation.tsx       — /federation
      Settings.tsx         — /settings
    common/
      CommandPalette.tsx   — ⌘K global overlay
      Button.tsx           — filled / ghost / destructive variants
      VramBar.tsx          — VRAM progress indicator
      HealthDot.tsx        — status dot (green/yellow/red)
  store/
    navigationStore.ts     — Zustand: active screen
    systemStore.ts         — Zustand: GPU, temp, tok/s
    modelsStore.ts         — Zustand: installed + active model
    chatStore.ts           — Zustand: chat messages
    commandPaletteStore.ts — Zustand: open/close palette
  styles/
    tokens.css             — Tailwind v4 @theme tokens
    globals.css            — @import tokens, base resets
```

### 2.5 Component Patterns

**Naming:** PascalCase files + exports. One component per file.

**Button variants (required pattern):**
```tsx
// Filled/primary
<button className="bg-accent-500 hover:bg-accent-400 active:bg-accent-600
                   text-text-primary text-sm font-medium
                   px-4 py-2 rounded-md cursor-pointer
                   flex items-center gap-2
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
  <MessageSquare size={16} aria-hidden="true" />
  Open Chat
</button>

// Ghost/secondary
<button className="border border-border-default text-text-secondary
                   hover:bg-bg-surface-3 rounded-md px-3 py-[7px] cursor-pointer">
  ...
</button>

// Destructive
<button className="border border-border-default text-red-400
                   hover:bg-red-500/10 rounded-md px-3 py-[7px] cursor-pointer">
  ...
</button>
```

**Cards:**
```tsx
<div className="bg-bg-surface-2 border border-border-default rounded-lg p-6">
  ...
</div>
```

**Required on every interactive element:**
- `cursor-pointer` class
- For nav buttons: `aria-current={isActive ? 'page' : undefined}`
- All decorative icons: `aria-hidden="true"`
- For icon-only buttons: `aria-label="..."`

### 2.6 Icon System

**Always use Lucide React.** Never use emoji as icons.

```tsx
import { LayoutDashboard, Cpu, MessageSquare, Zap, Network,
         Settings, HelpCircle, CheckCircle2, Loader2, Lock,
         Server, Activity, MemoryStick, Gauge, Search,
         ChevronsLeft, Trash2, Download, Paperclip } from 'lucide-react'

// Usage — always set aria-hidden on decorative icons:
<LayoutDashboard size={18} aria-hidden="true" />

// Semantic icons (convey meaning without adjacent text) need aria-label:
<button aria-label="Search models">
  <Search size={16} aria-hidden="true" />
</button>
```

**Icon sizes by context:**
| Context | Size |
|---|---|
| Status bar | 14 |
| Sidebar nav | 18 |
| Button inline | 16 |
| Screen title | 20 |
| Empty state | 48 |

### 2.7 State Management (Zustand)

```typescript
// Store pattern — apps/desktop/src/renderer/store/navigationStore.ts
import { create } from 'zustand'

type NavigationStore = {
  active: string
  setActive: (screen: string) => void
}

export const useNavigationStore = create<NavigationStore>(set => ({
  active: 'dashboard',
  setActive: screen => set({ active: screen }),
}))
```

Each store is a single file. No store barrel exports. Import stores directly by path.

### 2.8 Layout Dimensions (exact — match Figma spec)

| Element | Dimension |
|---|---|
| Title bar | 32px height |
| Sidebar collapsed | 56px width |
| Sidebar expanded | 220px width |
| Status bar | 28px height |
| Main content | fills remaining |
| Command palette | 640px wide, max-height 480px |
| Context panel | 280px width (optional, slides in/out) |

### 2.9 Command Palette (⌘K / Ctrl+K)

Global overlay. Implemented as Radix `Dialog`. Triggered by:
- `⌘K` / `Ctrl+K` global keydown listener in `App.tsx`
- Clicking the model name in the status bar
- "Switch Model ▾" button on Dashboard

```typescript
// Required: register keydown once in App.tsx, not per-screen
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      togglePalette()
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [togglePalette])
```

### 2.10 Status Bar Rules

The status bar is always visible (28px, `bg-bg-surface-1`, `border-t border-border-subtle`).

**Required attributes:**
```tsx
<footer role="status" aria-label="System status" className="...">
```

**4 fixed segments + 2 conditional:**
1. `[Lock aria-hidden] Running Locally` — always
2. `| Model name` — always, clickable → opens ⌘K
3. `| GPU 18.2/24 GB · 72°C` — always when model loaded
4. `| 45 tok/s` — always when model loaded
5. `| [Zap] Training: Running` — **conditional**, only when `trainingStatus === 'running'`
6. `| [Network] N peers` — **conditional**, only when `federationPeers > 0`

All `|` separators: `<span aria-hidden="true">|</span>`

### 2.11 Dashboard Visual Hierarchy

**One hero per screen.** Active Model is the hero on Dashboard.

```
ActiveModelCard (hero — full width)
  ↓ model name + quant
  ↓ VramBar
  ↓ tok/s · context · first-token latency
  ↓ [Open Chat] — filled accent button (primary CTA)

HealthDot strip (compact — single line, not 3 equal cards)
  ● Inference: Ready · ● GPU: 72°C · ○ Training: Idle

Quick Actions (small, secondary)
  [Open Chat] [Start Training] [Browse Models] [System Health]
```

**Never** give 5 sections equal visual weight on Dashboard — this produces the "AI-generated feeling" failure.

### 2.12 Accessibility Requirements (WCAG AA)

- All `<button>` elements must have accessible name (text content or `aria-label`)
- Active nav items: `aria-current="page"`
- Status bar footer: `role="status"`
- All decorative icons: `aria-hidden="true"`
- Contrast: `text-text-secondary` (#A3A3A3) on `bg-bg-surface-1` (#161616) → 6.1:1 ✓
- Contrast: `text-text-muted` (#737373) on `bg-bg-surface-2` (#1E1E1E) → 4.6:1 ✓ (verify)
- Focus ring: `focus-visible:ring-2 focus-visible:ring-accent-500` on all interactive elements
- Never suppress focus with `outline-none` without a replacement focus style

### 2.13 Testing Pattern (TDD)

Every task: write failing test first → implement → pass → commit.

```typescript
// apps/desktop/src/renderer/components/layout/Sidebar.test.tsx
import { render, screen } from '@testing-library/react'
import { Sidebar } from './Sidebar'

test('renders all nav items', () => {
  render(<Sidebar />)
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})

test('active nav item has aria-current="page"', () => {
  useNavigationStore.setState({ active: 'chat' })
  render(<Sidebar />)
  expect(screen.getByText('Chat').closest('button'))
    .toHaveAttribute('aria-current', 'page')
})
```

Run tests:
```bash
cd apps/desktop && npm test
cd apps/desktop && npm test -- --testPathPattern "Sidebar"
```

Commit pattern per task:
```bash
git add apps/desktop/src/
git commit -m "feat(desktop): <task description>"
```

---

## Part 3: Figma MCP Integration

### 3.1 Fetching Design Context

When a Figma URL is provided, extract `fileKey` and `nodeId` then call:

```
get_design_context(fileKey="<key>", nodeId="<id>")
get_screenshot(fileKey="<key>", nodeId="<id>")
```

**URL parsing:**
- `https://figma.com/design/:fileKey/:name?node-id=42-15`
  - fileKey = `:fileKey`
  - nodeId = `42-15` (hyphens, not colons)

### 3.2 Translating Figma → Code

The Figma output (React + Tailwind reference) must be adapted to this project's stack:

1. **Map Figma color hex → Tailwind token class**
   - `#8B5CF6` → `bg-accent-500` or `text-accent-500`
   - `#1E1E1E` → `bg-bg-surface-2`
   - `#F5F5F5` → `text-text-primary`
   - Never hardcode hex in JSX — always use the token class

2. **Map Figma spacing → Tailwind spacing**
   - 4px → `p-1` or `gap-1` (Tailwind 4px = 1 unit)
   - 8px → `p-2`
   - 12px → `p-3`
   - 16px → `p-4`
   - 24px → `p-6`
   - 32px → `p-8`
   - 48px → `p-12`

3. **Replace Figma-generated icon names → Lucide React imports**
   - Always import from `lucide-react`
   - Add `aria-hidden="true"` on every icon

4. **Use Radix UI for interactive primitives**
   - Dropdowns → `@radix-ui/react-dropdown-menu`
   - Dialogs → `@radix-ui/react-dialog`
   - Tabs → `@radix-ui/react-tabs`
   - Select → `@radix-ui/react-select`

5. **Apply layout dimensions** from Section 2.8 — Figma and code must match exactly

6. **Add accessibility** — aria-current, role=status, aria-hidden — even if Figma doesn't annotate them

### 3.3 Design Token Mapping Table

| Figma token / hex | Tailwind class |
|---|---|
| `bg/base` `#0D0D0D` | `bg-bg-base` |
| `bg/surface-1` `#161616` | `bg-bg-surface-1` |
| `bg/surface-2` `#1E1E1E` | `bg-bg-surface-2` |
| `bg/surface-3` `#252525` | `bg-bg-surface-3` |
| `bg/elevated` `#2D2D2D` | `bg-bg-elevated` |
| `border/subtle` `#2A2A2A` | `border-border-subtle` |
| `border/default` `#363636` | `border-border-default` |
| `text/primary` `#F5F5F5` | `text-text-primary` |
| `text/secondary` `#A3A3A3` | `text-text-secondary` |
| `text/muted` `#737373` | `text-text-muted` |
| `accent/500` `#8B5CF6` | `bg-accent-500` / `text-accent-500` |
| `accent/400` `#A78BFA` | `bg-accent-400` / `text-accent-400` |
| `accent/600` `#7C3AED` | `bg-accent-600` |
| `semantic/green-500` `#22C55E` | `text-green-500` / `bg-green-500` |
| `semantic/red-400` `#F87171` | `text-red-400` |
| `semantic/yellow-400` `#FACC15` | `text-yellow-400` |
| `semantic/blue-400` `#60A5FA` | `text-blue-400` |
| `special/local-badge-bg` `#1A2744` | `bg-local-badge-bg` |
| `special/local-badge-fg` `#60A5FA` | `text-local-badge-fg` |

### 3.4 Asset Management

- No CDN. Electron app — all assets are local.
- Static assets: `apps/desktop/src/renderer/assets/`
- Images referenced via Vite `import` or `src/` relative paths
- No external image URLs at runtime (offline-first design principle)

---

## Part 4: Project Design Principles (Non-negotiable)

1. **Local-first** — no cloud icons, "Running Locally" badge always visible, lock icon prominent
2. **One hero per screen** — never give 5+ sections equal visual weight
3. **No emoji as icons** — Lucide React everywhere
4. **Status transparency** — GPU, VRAM, tok/s always in status bar
5. **LM Studio familiarity** — left sidebar, dark theme, model selector, status bar
6. **4px spacing grid** — all spacing is a multiple of 4
7. **Accessible by default** — aria-current, role=status, aria-hidden on every component
8. **TDD** — write failing test before any implementation

---

## Part 5: VibeVoice Integration

### 5.1 Architecture

VibeVoice adds voice I/O (speech-to-text + text-to-speech) to Sovereign Coder. The desktop app communicates with a Python FastAPI backend service for audio processing.

```
Desktop App (Electron + React)
    ↓ (useVoiceService hook)
    ↓ HTTP POST /transcribe, /synthesize
    ↓
Voice Service (FastAPI + Python)
    ├─ Whisper ASR (speech-to-text)
    ├─ Google TTS (text-to-speech)
    └─ Audio processing utilities
```

### 5.2 Voice Service Location

Located at `services/voice-service/`:

```
services/voice-service/
  main.py                    # FastAPI server (port 8000)
  voice_service/
    models/
      whisper.py            # Whisper ASR wrapper
      tts.py                # Google TTS wrapper
    audio/
      processor.py          # Audio utilities (librosa)
  requirements.txt          # Python dependencies
  pyproject.toml            # Build config
  .env.example              # Configuration template
```

### 5.3 Desktop App Voice Components

Located at `apps/desktop/src/renderer/components/voice/`:

```
voice/
  Waveform.tsx              # Real-time audio visualization (Web Audio API + Canvas)
  VoiceSettings.tsx         # Model/language selector panel
  TranscriptionHistory.tsx  # Searchable history with export/delete
  VoiceInput.tsx            # Mic recording + file upload
  VoiceOutput.tsx           # TTS synthesis + playback
  VoicePanel.tsx            # Unified voice controls
  index.ts                  # Component exports
```

Voice state management: `apps/desktop/src/renderer/store/voiceStore.ts` (Zustand)

Voice service client: `apps/desktop/src/renderer/hooks/useVoiceService.ts`

### 5.4 Getting Started with VibeVoice

**Option 1: Docker Compose (Recommended)**

```bash
# Start voice service + Redis cache
docker-compose up -d

# Verify health
curl http://localhost:8000/health
```

**Option 2: Local Python**

```bash
cd services/voice-service
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 5.5 Voice API Endpoints

All endpoints respond with JSON and support CORS.

**POST /transcribe** — Audio to text
```bash
curl -X POST http://localhost:8000/transcribe \
  -F "file=@audio.wav" \
  -F "language=en"

# Response:
# {"text": "...", "language": "en", "confidence": 0.95, "duration": 2.5}
```

**POST /synthesize** — Text to audio
```bash
curl -X POST http://localhost:8000/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}'

# Response:
# {"audio_url": "data:audio/wav;base64,...", "duration": 1.5}
```

**GET /health** — Service status
```bash
curl http://localhost:8000/health

# Response:
# {"status": "ok", "version": "0.1.0", "asr_loaded": true, "tts_loaded": true}
```

### 5.6 Voice Integration Pattern (in Desktop Components)

```typescript
import { useVoiceService } from '@/hooks/useVoiceService'
import { useVoiceStore } from '@/store/voiceStore'

function VoiceCapableComponent() {
  const { transcribeAudio, synthesizeText } = useVoiceService()
  const { isRecording, addTranscription } = useVoiceStore()

  // Transcribe audio blob to text
  const handleTranscribe = async (audioBlob: Blob) => {
    const result = await transcribeAudio(audioBlob, 'en')
    if (result) {
      addTranscription({
        id: crypto.randomUUID(),
        text: result.text,
        language: result.language,
        confidence: result.confidence,
        duration: result.duration,
        timestamp: Date.now(),
      })
    }
  }

  // Synthesize text to audio
  const handleSpeak = async (text: string) => {
    const result = await synthesizeText(text, 'en')
    if (result && result.audio_url) {
      const audio = new Audio(result.audio_url)
      await audio.play()
    }
  }

  return (
    <div>
      {/* Voice UI */}
    </div>
  )
}
```

### 5.7 Testing Voice Integration

**Unit tests** (mock backend):
```bash
npm test -- useVoiceService.test.ts
```

**E2E tests** (requires live service):
```bash
# Terminal 1: Start voice service
docker-compose up voice-service

# Terminal 2: Run E2E tests
npm test -- useVoiceService.e2e.test.ts
```

**Manual testing**:
```bash
# Verify service responds
curl http://localhost:8000/health

# Check documentation
cat VOICE_INTEGRATION.md
```

### 5.8 Configuration

Voice service respects these environment variables:

```bash
# Service
PORT=8000                   # Listen port
LOG_LEVEL=INFO             # Logging verbosity

# Audio Processing
VAD_AGGRESSIVENESS=2       # Voice Activity Detection (0-3)
SILENCE_THRESHOLD_MS=800   # Silence duration before finalizing
MIN_UTTERANCE_DURATION_MS=500  # Minimum speech duration

# Models
WHISPER_MODEL_SIZE=base    # tiny, base, small, medium, large
TTS_DEFAULT_LANG=en

# Optimization
DEVICE=cpu                 # cpu, cuda, mps, auto
ENABLE_GPU_OPTIMIZATION=false  # Use float16 for faster inference
```

See `services/voice-service/.env.example` for full config.

### 5.9 Performance Notes

- **First request latency**: ~500ms (models load on first use, then cached)
- **Subsequent requests**: ~50-100ms (CPU), ~10-20ms (GPU with CUDA)
- **Memory usage**: ~1.5GB (ASR + TTS models)
- **GPU memory**: ~4GB (with float16 optimization, ~2GB)

GPU acceleration requires NVIDIA CUDA 11.8+ installed locally.

### 5.10 Troubleshooting

**Service won't start**
```
Address already in use port 8000
→ Change PORT in .env or: lsof -ti:8000 | xargs kill -9
```

**Transcription fails**
```
CUDA device not available
→ Set DEVICE=cpu in .env
```

**Long latency on first request**
```
Models loading for first time (normal)
→ First request: wait 5-10s. Subsequent: <100ms
```

**Out of memory**
```
CUDA out of memory
→ Use smaller model or CPU: DEVICE=cpu WHISPER_MODEL_SIZE=tiny
```

---

## Part 6: Key File Locations

| File | Purpose |
|---|---|
| `src/utils/theme.ts` | Terminal color tokens (6 themes × ~60 keys each) |
| `src/components/design-system/` | Terminal design system primitives |
| `src/ink.ts` | Terminal render entry (exports `Box`, `Text`, `color`, `ThemeProvider`) |
| `docs/plans/2026-04-01-ui-ux-design.md` | Approved Sovereign Coder UI/UX spec |
| `docs/plans/2026-04-01-frontend-phase1-implementation-plan.md` | TDD task list for desktop app |
| `docs/plans/2026-04-01-figma-keyframes-spec.md` | Figma frame specs (exact px values) |
| `docs/plans/2026-04-01-figma-tokens.json` | W3C DTCG design tokens (import via Tokens Studio) |
| `docs/en/Sovereign-Coder-PRD.md` | Full product requirements |
| `services/voice-service/main.py` | FastAPI voice service (ASR + TTS) |
| `services/voice-service/requirements.txt` | Python dependencies |
| `apps/desktop/src/renderer/store/voiceStore.ts` | Voice state management (Zustand) |
| `apps/desktop/src/renderer/hooks/useVoiceService.ts` | Voice service API client |
| `VOICE_INTEGRATION.md` | Complete voice integration guide |
| `docker-compose.yml` | Docker setup for voice service + Redis |
