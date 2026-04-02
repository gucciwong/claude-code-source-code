# Sovereign Coder — Desktop App UI/UX Design Document

**Version:** 1.0  
**Date:** 2026-04-01  
**Status:** Approved  
**Author:** Sovereign AI Labs  

---

## 0. Decision Summary

| Question | Decision | Rationale |
|---|---|---|
| Primary platform | **Electron desktop app** | Closest analogue to LM Studio; full feature access; works offline; direct GPU access |
| Secondary surfaces | VSCode plugin panel (Phase 1), Web dashboard (Phase 2) | Same design system, simplified to fit surface |
| Design language | **LM Studio-inspired dark theme** | Target users are technical; dark is standard for developer tools |
| Scope | All 4 PRD phases, MVP-prioritized | Design full vision, build Phase 1 screens first |
| Theme toggle | Dark only in MVP; light toggle in Phase 2 | Reduces scope; dark is appropriate default |

---

## 1. Design Principles

1. **Zero Friction First Launch** — User should run their first inference within 5 minutes of installing. Model download, inference start, and first completion should feel effortless.
2. **Status Transparency** — GPU VRAM, tokens/sec, model loaded, training progress — always visible. Developers need to know what is happening at all times.
3. **LM Studio Familiarity** — Users migrating from LM Studio should feel at home. Left sidebar, dark theme, model selector, status bar. Muscle memory transfers.
4. **Depth Without Overload** — Simple things are simple (click a model, start chatting). Complex things (QLoRA training, federation) are progressively disclosed behind expandable panels.
5. **Local-First Visual Identity** — UI should subtly reinforce privacy: no cloud icons, "Running locally" badge, lock icons, hardware metrics front and center.

---

## 2. Design System

### 2.1 Colour Tokens

```
Background Levels
─────────────────────────────────────────────────────
bg-base        #0D0D0D    App window background
bg-surface-1   #161616    Sidebar background  
bg-surface-2   #1E1E1E    Card / panel background
bg-surface-3   #252525    Nested card, code block bg
bg-elevated    #2D2D2D    Popover, dropdown, tooltip

Border
─────────────────────────────────────────────────────
border-subtle  #2A2A2A    Low-contrast dividers
border-default #363636    Standard borders
border-strong  #484848    Active / focused state

Text
─────────────────────────────────────────────────────
text-primary   #F5F5F5    Main body text
text-secondary #A3A3A3    Labels, descriptions
text-muted     #737373    Disabled, placeholder
text-code      #E5E5E5    Monospace code text

Accent — Sovereign Violet (brand primary)
─────────────────────────────────────────────────────
accent-400     #A78BFA    Hover states
accent-500     #8B5CF6    Primary buttons, links, active nav
accent-600     #7C3AED    Button active/pressed

Semantic Colours
─────────────────────────────────────────────────────
green-400      #4ADE80    Online, accepted, success
green-500      #22C55E    Running, healthy
red-400        #F87171    Error state
red-500        #EF4444    Critical error, offline
yellow-400     #FACC15    Warning, training active
yellow-500     #EAB308    Caution
blue-400       #60A5FA    Info, streaming tokens
blue-500       #3B82F6    Download progress

Special
─────────────────────────────────────────────────────
local-badge-bg #1A2744    "Running Locally" badge bg (deep navy)
local-badge-fg #60A5FA    "Running Locally" badge text (blue)
```

### 2.2 Typography

```
Font Stack (system-ui stack, no external fonts required)
─────────────────────────────────────────────────────────────────
UI Text:    -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Code:       'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace

Scale
─────────────────────────────────────────────────────────────────
xs      11px   Metadata, timestamps, status badges
sm      13px   Secondary labels, table cells, descriptions
base    14px   Body text, sidebar labels
md      15px   Paragraph text in chat
lg      17px   Panel headings
xl      20px   Screen titles
2xl     24px   Onboarding headings
3xl     32px   Empty state headings
```

### 2.3 Spacing Scale

```
4px grid (all values multiples of 4)
─────────────────────────────────────────
xs   4px    Icon padding, tight spacing
sm   8px    Component internal padding
md  12px    Standard gap
lg  16px    Section gap
xl  24px    Panel padding
2xl 32px    Section separation
3xl 48px    Screen-level spacing
```

### 2.4 Border Radius

```
none    0px    Hard edge elements (progress bars, status bars)
sm      4px    Badges, chips, small buttons
md      6px    Buttons, inputs, small cards
lg      8px    Cards, panels
xl     12px    Modals, large cards
full  9999px   Toggle pills, avatar circles
```

### 2.5 Iconography

Use **Lucide React** icon set throughout. Key icons mapped to features:

| Feature | Icon | 
|---|---|
| Dashboard | `LayoutDashboard` |
| Models | `Cpu` |
| Chat / Agent | `MessageSquare` |
| Training | `Zap` |
| Federation | `Network` |
| Settings | `Settings` |
| Download | `Download` |
| Running/Online | `CheckCircle2` (green) |
| Loading | `Loader2` (animated spin) |
| Training active | `Zap` (yellow, animated pulse) |
| Locally running | `Lock` + `Server` |
| GPU | `Activity` |
| VRAM | `MemoryStick` |
| Tokens/sec | `Gauge` |

---

## 3. Layout Structure

### 3.1 Outer Shell (always visible)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TITLEBAR (macOS traffic lights / Windows controls)                      │ 32px
│ [●][●][●]         Sovereign Coder — Qwen2.5-Coder-32B ▾       [–][□][✕] │
├──────┬──────────────────────────────────────────────┬────────────────────┤
│      │                                              │                    │
│  S   │                                              │                    │
│  I   │         MAIN CONTENT AREA                    │   CONTEXT / INFO   │
│  D   │                                              │      PANEL         │
│  E   │                                              │    (optional,      │
│  B   │                                              │  slides in/out)    │
│  A   │                                              │                    │
│  R   │                                              │                    │
│      │                                              │                    │
│ 56px │         (fills remaining space)              │       280px        │
│      │                                              │                    │
├──────┴──────────────────────────────────────────────┴────────────────────┤
│ STATUS BAR                                                               │ 28px
│ ● Running Locally  |  Qwen2.5-32B  |  GPU: RTX 4090 (18.2/24 GB VRAM)  │
│ Temp: 72°C  |  45.3 tok/s  |  Training: Idle  |  Fed: 0 active peers   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Sidebar

All icons: **Lucide React**. Never use emoji as icon substitutes.
Icon map: Dashboard=`LayoutDashboard`, Models=`Cpu`, Chat=`MessageSquare`, Training=`Zap`, Federation=`Network`, Settings=`Settings`, Help=`HelpCircle`.

```
┌────────────────────────────────────────────┐
│  ≡                                         │  ← Collapse/expand toggle
├────────────────────────────────────────────┤
│  <LayoutDashboard>   Dashboard             │  ← active: accent tint, left 2px bar
│  <Cpu>               Models               │
│  <MessageSquare>     Chat / Agent         │
│  <Zap>               Training             │
│  <Network>           Federation           │
├────────────────────────────────────────────┤
│  <Settings>          Settings             │  ← pinned to bottom
│  <HelpCircle>        Help & Docs          │
└────────────────────────────────────────────┘

Expanded sidebar (220px):
┌────────────────────────────────────────┐
│  ≡  Sovereign                          │  ← Logo + app name
├────────────────────────────────────────┤
│  <LayoutDashboard>  Dashboard          │  ← Active: accent bg, bold text
│  <Cpu>              Models             │
│  <MessageSquare>    Chat / Agent       │
│  <Zap>              Training           │  ← Yellow dot if training running
│  <Network>          Federation         │  ← Green dot if peers connected
├────────────────────────────────────────┤
│  <Settings>         Settings           │
│  <HelpCircle>       Help               │
└────────────────────────────────────────┘
```

### 3.3 Status Bar (persistent, bottom)

Always visible. 28px height. Background `bg-surface-1`.

**MVP — 4 fixed segments, 2 conditional:**

```
[Lock] Running Locally  │  Qwen2.5-Coder-32B  │  GPU 18.2/24 GB · 72°C  │  45 tok/s
```

Training and Federation segments appear **conditionally** — only when training is running or federation peers are connected. When idle/offline they are silent, keeping the bar uncluttered.

- **"Running Locally"** — `<Lock>` icon + text badge. Clicking opens "Privacy Status" popover.
- **Model name** — clicking opens the ⌘K Command Palette pre-filtered to installed models.
- **GPU · temp** — VRAM used/total combined with temperature in one segment. Compact.
- **tok/s** — tokens per second; hidden when no model is loaded.
- **Training** *(conditional)* — visible only when `trainingStatus === 'running'`. Shows "Training: Running".
- **Fed** *(conditional)* — visible only when `federationPeers > 0`. Shows "N peers".

---

### 3.4 Command Palette (⌘K / Ctrl+K)

Global overlay accessible from anywhere. Triggered by `⌘K` (macOS) / `Ctrl+K` (Windows/Linux), by clicking the model name in the status bar, or by the "Switch Model ▾" button on the Dashboard.

```
┌───────────────────────────────────────────────────────────────────┐
│  > Type a model name or command...                    [Esc close] │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ── Models ──────────────────────────────────────────────────  │
│  <CheckCircle2> (green)  qwen2.5-coder:32b          Active       │
│                          deepseek-coder:33b                       │
│                          starcoder2:15b                           │
│                                                                   │
│  ── Actions ─────────────────────────────────────────────────  │
│  <MessageSquare>  Open Chat                                       │
│  <Zap>            Start Training                                  │
│  <Download>       Browse Models                                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Implemented as a Radix `Dialog` — traps focus, `Escape` closes.
- Input auto-focuses on open. Arrow keys navigate. Enter selects.
- Fuzzy search filters installed models first, then static actions.
- Global `keydown` listener registered once in `App.tsx`, not per-screen.
- All icons: Lucide React. Never emoji.

---

## 4. Screen Designs

### 4.1 Dashboard / Home

**Purpose:** Show the user what is running right now and get them to their next action in one click.

**Visual hierarchy decision:** Active Model is the **hero** (120 pts) — it answers "What is running?" without a click. System Health is a compact single-line strip, not three equal cards. Quick Actions are small secondary buttons. Recent Activity and Benchmark Summary are **Phase 2** — present in MVP would produce the "five equal sections = AI-generated feeling" failure.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                             [⌘K Search...]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── Active Model ─────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Qwen2.5-Coder-32B-Instruct  Q4_K_M        [Switch Model ▾]      │   │
│  │  ──────────────────────────────────────────────────────────────  │   │
│  │                                                                   │   │
│  │  VRAM   ████████████████████░░░░  18.2 / 24 GB                   │   │
│  │                                                                   │   │
│  │  45.3 tok/s  ·  128K context  ·  First token: 380ms              │   │
│  │                                                                   │   │
│  │  [<MessageSquare> Open Chat]                                      │   │
│  │                                                                   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ── System Health ──────────────────────────────────────────────────── │
│  ● Inference: Ready  ·  ● GPU: 72°C  ·  ○ Training: Idle              │
│  ──────────────────────────────────────────────────────────────────── │
│                                                                         │
│  ┌─── Quick Actions ────────────────────────────────────────────────┐   │
│  │  [<MessageSquare> Open Chat]   [<Zap> Start Training]            │   │
│  │  [<Download> Browse Models]    [<Activity> System Health]        │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key interactions:**
- "Switch Model ▾" opens the ⌘K command palette pre-filtered to installed models.
- Clicking a System Health indicator navigates to the relevant screen (GPU → Settings, Training → Training console).
- System Health strip pulses only when GPU temp > 80°C or VRAM > 90% — not by default.
- "Open Chat" is the primary CTA — styled as a filled accent button, not a ghost button.

---

### 4.2 Models Hub

**Purpose:** Browse, download, switch, and manage models. The LM Studio centrepiece.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Models                  [<Search> Search models...]  [+ Add Custom Model]  │
├───────────────────┬─────────────────────────────────────────────────────┤
│  INSTALLED        │                                                     │
│  ──────────       │  Qwen2.5-Coder-32B-Instruct                        │
│  > Qwen2.5-32B  ● │  ─────────────────────────────────────────────────  │
│    DeepSeek-33B   │  Parameters: 32B | Quant: Q4_K_M | VRAM: 24 GB     │
│    StarCoder2-15B │  Context: 128K tokens | Format: GGUF               │
│                   │                                                     │
│  AVAILABLE        │  ┌─ Versions ─────────────────────────────────┐    │
│  ──────────       │  │  ● base          [Active]                   │    │
│    Phi-4-Coder    │  │  ○ fine-tune-v1  +3.2% HumanEval  2 days ago│    │
│    Llama-3.1-70B  │  │  ○ fine-tune-v2  +5.1% HumanEval  18h ago   │    │
│    Mistral-22B    │  │  [Load Fine-tune v2]                        │    │
│                   │  └────────────────────────────────────────────┘    │
│  DISCOVER         │                                                     │
│  ──────────       │  ┌─ Performance ──────────────────────────────┐    │
│    Browse HF Hub  │  │  Tokens/sec:  45.3 (streaming)             │    │
│    Browse GGUF    │  │  First token: 380ms                         │    │
│    Custom URL     │  │  HumanEval:   72.4% pass@1                 │    │
│                   │  │  MBPP:        68.1% pass@1                 │    │
│                   │  └────────────────────────────────────────────┘    │
│                   │                                                     │
│                   │  [<CheckCircle2> Set as Active]  [<Zap> Fine-tune]  [<Trash2> Delete]  │
│                   │                                                     │
└───────────────────┴─────────────────────────────────────────────────────┘
```

**Download flow:**
- Clicking "Phi-4-Coder" in "Available" shows an info card with model card, VRAM requirement, and [Download Q4_K_M (10 GB)] / [Download Q8_0 (15 GB)] buttons.
- Download shows a progress bar with speed (MB/s), ETA, and a [Cancel] link.
- After download completes, model moves to "Installed" list automatically.

**Model switcher (quick):**
- `⌘K` anywhere opens a command palette.
- Type a model name to switch instantly. No need to navigate to Models screen.

---

### 4.3 Chat / Agent Workspace

**Purpose:** Primary LLM interaction. Streaming chat + autonomous agent task view.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Chat                                                [◑ Agent Mode]  [⋮] │
├──────────────────────────────────────────────┬──────────────────────────┤
│                                              │  CONTEXT PANEL           │
│  ┌──────────────────────────────────────┐    │  ─────────────           │
│  │  system                              │    │  Project: my-app/        │
│  │  You are Sovereign Coder, a local... │    │                          │
│  └──────────────────────────────────────┘    │  Indexed files: 1,247   │
│                                              │  Last indexed: 2m ago    │
│  ┌── User ──────────────────────────────┐    │                          │
│  │  Fix the login bug in auth.py        │    │  ┌─ Context Used ──────┐ │
│  └──────────────────────────────────────┘    │  │  auth.py (line 42)  │ │
│                                              │  │  models/user.py     │ │
│  ┌── Sovereign ─────────────────────────┐    │  │  tests/test_auth.py │ │
│  │  I'll investigate the login bug.     │    │  └────────────────────┘ │
│  │                                      │    │                          │
│  │  📄 Reading auth.py...               │    │  ┌─ Tools Used ────────┐ │
│  │  🔍 Found issue at line 42:          │    │  │  read_file ✓        │ │
│  │  `if user.password == plain_text`    │    │  │  grep_search ✓      │ │
│  │                                      │    │  │  edit_file ✓        │ │
│  │  This compares plain text passwords  │    │  │  run_tests ✓        │ │
│  │  directly. I'll fix this to use      │    │  └────────────────────┘ │
│  │  bcrypt comparison.                  │    │                          │
│  │                                      │    │  Tokens used: 4,821     │
│  │  ```python                           │    │  Context: 12,440 / 128K │
│  │  # Before:                           │    │                          │
│  │  if user.password == password:       │    │  ┌─ Model ─────────────┐ │
│  │                                      │    │  │  Qwen2.5-Coder-32B  │ │
│  │  # After:                            │    │  │  45.3 tok/s         │ │
│  │  if bcrypt.check(password,           │    │  │  temp: 0.2          │ │
│  │      user.password_hash):            │    │  │  [Adjust ▾]         │ │
│  │  ```                                 │    │  └────────────────────┘ │
│  │                                      │    │                          │
│  │  ✅ Changes applied. Running tests..│    │                          │
│  │  ✅ 12/12 tests passed               │    │                          │
│  └──────────────────────────────────────┘    │                          │
│                                              │                          │
├──────────────────────────────────────────────┴──────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Ask Sovereign anything... (or press Tab to see suggestions)       │  │
│  │                                                             [Send] │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  [<Paperclip> Attach]  |  /commands  |  [Agent Task ▾]  |  Stream: ████░░░ │
└─────────────────────────────────────────────────────────────────────────┘
```

**Agent mode toggle:**
When "Agent Mode" is active, the interface shifts slightly:
- Tool calls are shown as expandable rows with status indicators (thinking → executing → done).
- A "Pause Agent" button appears at the top.  
- File diffs are shown inline with [Accept] / [Reject] controls per change.
- A "Dry Run" switch prevents actual file writes (for review mode).

**Slash commands:**
- `/compress` — compress context
- `/save` — save chat session
- `/clear` — clear history
- `/model` — switch model mid-conversation
- `/temp 0.7` — adjust temperature

---

### 4.4 Training Console

**Purpose:** Observe, schedule, and manage QLoRA training runs.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Training                                          [▶ Start Training]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── Current Run ──────────────────────────────────────────────────┐  │
│  │  ⚡ RUNNING  |  Iteration 23/48  |  Elapsed: 02:18:34  |  ETA: 04:01h │
│  │                                                                   │  │
│  │  Progress:  ████████████░░░░░░░░░░░░░  48%                       │  │
│  │                                                                   │  │
│  │  Train Loss:  0.312  ↓  |  Val Loss:  0.341  ↓                   │  │
│  │  Learning Rate:  1.2e-4  |  Batch Size:  4  |  LoRA Rank: 16     │  │
│  │                                                                   │  │
│  │  GPU: RTX 4090  |  VRAM: 22.1/24 GB  |  Temp: 78°C  |  TDP: 310W │  │
│  │                                                                   │  │
│  │  [Pause]   [Stop]   [View Logs ▾]                                 │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Data Collection ──────────────────────────────────────────────┐  │
│  │  Collected this session:                                          │  │
│  │  • 847  completion pairs  (tab-accepted suggestions)              │  │
│  │  • 12   agent trajectories  (completed tasks)                     │  │
│  │  • 203  correction pairs  (user edits to model output)            │  │
│  │                                                                   │  │
│  │  Total training samples: 14,820  |  Est. training time: 4.2h     │  │
│  │                                                                   │  │
│  │  [🗑 Clear Dataset]  [👁 Preview Samples]  [📤 Export Dataset]   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Schedule ─────────────────────────────────────────────────────┐  │
│  │  ○ Manual (start manually)                                        │  │
│  │  ● Auto (train when GPU idle > 10 min)                            │  │
│  │  ○ Scheduled — [Set Time...]                                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Version History ──────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  v1.4  ───  +3.2% HumanEval  |  Apr 1, 02:14  [Load] [Export]    │  │
│  │  v1.3  ───  +1.8% HumanEval  |  Mar 31, 22:00  [Load] [Export]   │  │
│  │  v1.2  ───  +0.4% HumanEval  |  Mar 31, 14:00  [Load] [Export]   │  │
│  │  v1.1  ───  -0.1% HumanEval  ← Rejected automatically            │  │
│  │  v1.0  ───  Baseline         |  Mar 30, 10:00  [Load] [Export]   │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**10-minute loop visualisation:**
A sub-panel (expandable) shows the 10-minute cycle as a circular progress ring with 4 segments: Collect → Prepare → Train → Validate.

---

### 4.5 Federation Console

**Purpose:** Join federations, contribute gradients, monitor peer network.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Federation                                  [+ Join Federation]        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── My Federations ───────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ● Finance AI Consortium                   [Connected · 8 peers]  │  │
│  │    Round: 127  |  My contribution: 0.42%  |  Epsilon: 0.1        │  │
│  │    Last sync: 14 min ago  |  Bandwidth: ↑ 120 KB/s  ↓ 45 KB/s   │  │
│  │    [Details]   [Pause]   [Leave]                                  │  │
│  │                                                                   │  │
│  │  ○ Open Source Coder Commons               [Offline — Resume]    │  │
│  │    Last active: 3 days ago                                        │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Privacy Status ───────────────────────────────────────────────┐  │
│  │  ✓ Differential Privacy: ON  (ε = 0.1, δ = 1e-5)                 │  │
│  │  ✓ Secure Aggregation: ON                                         │  │
│  │  ✓ Raw code transmitted: NONE                                     │  │
│  │  ✓ Gradient encryption: TLS 1.3                                   │  │
│  │                                                                   │  │
│  │  What is transmitted: gradient updates only (encrypted)           │  │
│  │  What stays local: all code, training data, chat history          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Network Graph ────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │   [●]─────[●]        Nodes: 8 active peers                       │  │
│  │    │  ╲  ╱  │        Your node: Org-7af3 (anonymous)             │  │
│  │   [●]  [●]  [●]      Aggregation server: agg.finai.network       │  │
│  │    │       │          Latency: 42ms                               │  │
│  │   [●]─────[●]                                                     │  │
│  │         ^                                                         │  │
│  │       You                                                         │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Contribution History ─────────────────────────────────────────┐  │
│  │  Round 127: ✓ Submitted  |  Quality score: 0.91  |  Reward: +12  │  │
│  │  Round 126: ✓ Submitted  |  Quality score: 0.88  |  Reward: +11  │  │
│  │  Your reputation: 847 points  |  Top 15% contributor             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Settings

Tabbed settings panel. Tabs: **General | Inference | Training | Federation | Privacy | About**

#### General tab

```
Display
  Theme:          [Dark ▾]  (Light coming in Phase 2)
  Sidebar:        [Expanded ▾]
  Status bar:     [Show ▾]
  Font size:      [14px ▾]

Editor Integration
  VSCode extension:    [Connected ✓]  [Reconnect]
  JetBrains plugin:    [Not installed]  [Get Plugin →]
  Tab to accept:       [On ▾]
  Ghost text:          [On ▾]

Notifications
  Training complete:   [✓] Desktop notification
  Federation sync:     [✓] Status bar only
  Model update:        [✓] Desktop notification
```

#### Inference tab

```
Active model:     Qwen2.5-Coder-32B  [Switch ▾]
Backend:          [Ollama ▾]  (Ollama / llama.cpp / vLLM)
Ollama host:      http://localhost:11434  [Test Connection]
Max context:      [32768 ▾] tokens
Temperature:      ────●──────  0.2
Top-p:            ─────────●  0.95
Max tokens:       [2048]
Stream responses: [On ▾]
GPU layers:       [All ▾]  (35/35 layers on GPU)
```

#### Privacy tab

```
┌─── Privacy Guarantees ─────────────────────────────────────────┐
│  ✓ All inference is local                                       │
│  ✓ No telemetry collected                                       │
│  ✓ No API keys sent externally                                  │
│  ✓ All data stored in ~/.sovereign-coder/ (encrypted)          │
└─────────────────────────────────────────────────────────────────┘

Data Storage
  Chat history:    [Retain 30 days ▾]  [Clear Now]
  Training data:   [Retain until trained ▾]  [Clear Now]
  Embeddings:      [Keep with project ▾]

Opt-in Telemetry
  Usage analytics (no code):   [Off ▾]  ← default off
  Crash reports (anonymised):  [Off ▾]  ← default off
```

---

## 5. Key User Flows

### 5.1 First-Time Setup (< 5 minutes target)

```
1. Install Sovereign Coder
   ↓
2. Launch → Welcome screen
   "Welcome to Sovereign Coder — your private AI coding companion."
   • Hardware check: GPU detected (RTX 4090 ✓), 64 GB RAM ✓
   • Ollama check: [Install Ollama ▾] or [Ollama detected ✓]
   ↓
3. Choose first model
   • Recommended for your GPU: Qwen2.5-Coder-32B (24 GB VRAM — Excellent)
   • [Download Qwen2.5-Coder-32B Q4_K_M — 20 GB]
   • Progress bar with speed + ETA
   ↓
4. Model loads → success banner
   "Qwen2.5-Coder-32B loaded and ready. 45 tok/s"
   ↓
5. "Start your first chat →"
   → Directed to Chat screen with starter prompt pre-filled
```

### 5.2 Daily Development Flow

```
Open project in VSCode → VSCode plugin activates
↓
Code as normal → ghost text completions appear
↓
Press Tab to accept → completion logged as training data
↓
Complex task needed → open Sovereign Coder sidebar in VSCode
(or launch desktop app)
↓
Chat: "Refactor this function to use async/await"
↓
Agent reads codebase context → streams response → shows diff
↓
User clicks [Accept All] → changes applied
↓
At end of day → training data collected automatically
Training console shows: "847 new samples ready"
```

### 5.3 Overnight Training

```
Training Console → Schedule tab
↓
Select "Scheduled — Tonight at 11:00 PM"
↓
Configure: Base model, LoRA rank, epochs
↓
Confirm → Desktop notification cleared for overnight
↓
Morning: Desktop notification
"Training complete. Fine-tune v1.5 ready. +4.1% HumanEval."
↓
Dashboard shows: "New model version available"
[Load v1.5] button prominent on dashboard
```

### 5.4 Joining a Federation

```
Federation Console → [+ Join Federation]
↓
Enter federation ID or browse public federations
↓
Review federation terms:
• Industry: Financial Services
• Privacy: ε = 0.1 DP, secure aggregation
• Contribution: gradient updates only
• Schedule: Every 2 hours
↓
[Join Federation]
↓
First round begins → status bar shows "Fed: 8 peers"
↓
Federation Console shows network graph, contribution history
```

---

## 6. VSCode Plugin Panel (Phase 1, Simplified Surface)

The VSCode plugin uses the same design language but simplified.

```
┌─────────────────────────────────────────────────────┐
│  SOVEREIGN CODER        ● Connected  v1.4           │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Model: Qwen2.5-32B  Q4_K_M  45 tok/s  [Switch ▾]  │
│                                                     │
│  ┌─── Chat ──────────────────────────────────────┐  │
│  │                                               │  │
│  │  ...conversation history...                   │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Ask about the current file...                 │ │
│  │                                       [Send ↵] │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  Context: auth.py (428 lines) · 3 related files    │
│                                                     │
│  ── Quick Actions ─────────────────────────────── │
│  [Explain selection]  [Fix error]  [Write tests]   │
│  [Refactor]  [Document]  [Agent Mode →]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 7. System Health / Benchmark Panel (Sovereign Week 1 Integration)

The Week 1 health check scripts (`runtime-check.mjs`, `benchmark.mjs`, `report.mjs`) integrate directly into the Dashboard's **"Benchmark Summary"** card and a full-screen expandable **System Health** panel.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  System Health Report           Last run: 2 min ago  [▶ Run Now]        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── Runtime Check ────────────────────────────────────────────────┐  │
│  │  Port 11434:        ✓ Open (Ollama reachable)                    │  │
│  │  Timeout:           ✓ 30s configured                              │  │
│  │  Backend:           ✓ Ollama v0.3.12                              │  │
│  │  GPU detected:      ✓ NVIDIA RTX 4090 (24 GB)                    │  │
│  │  CUDA:              ✓ 12.4                                        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Benchmark ────────────────────────────────────────────────────┐  │
│  │  Tokens/sec:        45.3 (target: 30+) ✓                         │  │
│  │  First token:       380 ms (target: < 500ms) ✓                   │  │
│  │  Context 32K:       ✓ loaded in 1.4s                              │  │
│  │  HumanEval pass@1:  72.4% (target: 70%+) ✓                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── Readiness ────────────────────────────────────────────────────┐  │
│  │  Tier: EXCELLENT  |  Gate: ✓ Satisfied  |  Demo Ready: ✓         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

The panel renders the parsed JSON output from `report.mjs` directly. The "Run Now" button executes `node scripts/sovereign-week1-benchmark.mjs` and streams the output.

---

## 8. Empty States

### No model installed
```
┌───────────────────────────────────────────────────┐
│                                                   │
│          <Cpu>                                    │
│                                                   │
│          No model loaded                          │
│                                                   │
│          Download your first model to start       │
│          using Sovereign Coder.                   │
│                                                   │
│          [Browse Models →]                        │
│                                                   │
│          Recommended: Qwen2.5-Coder-7B (6 GB)    │
│          for 6–8 GB VRAM systems                  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### No training data yet
```
Start using Chat and code completions.
Training data is collected automatically.
When you have 50+ samples, training becomes available.
(Current: 0 samples)
```

---

## 9. Accessibility & Interaction

- **Keyboard navigation**: Full keyboard nav. Tab order follows visual order. `⌘K` for command palette everywhere.
- **Focus management**: Modals trap focus. Escape closes modals and dropdowns.
- **Contrast ratios**: All text combinations exceed WCAG AA (4.5:1 for body text, 3:1 for large text).
- **Reduced motion**: Respect `prefers-reduced-motion`. Disable spinning loaders and animations when set.
- **Screen readers**: All icons have accessible labels. Status indicators use both colour and text.
- **Zoom**: UI tested at 125% and 150% zoom factors in Electron.

---

## 10. Phase Status (Design Scope vs Implementation)

### MVP (Phase 1 — Month 1-2)
- [x] App shell: titlebar, sidebar (collapsed + expanded), status bar
- [x] Dashboard screen (system health cards, active model, quick actions)
- [x] Models Hub (installed view, download flow, model switcher)
- [x] Chat screen (basic chat, streaming, context panel)
- [x] Settings (General + Inference tabs baseline)
- [x] VSCode plugin sidebar panel (available in extension workspace)

### Phase 2 (Month 3-5)
- [x] Agent mode UI (tool call trace, diff viewer, Accept/Reject, Dry Run)
- [x] Training Console (progress view, data collection stats, version history)
- [x] System Health / Benchmark panel (Week 1 integration path present)
- [x] Settings (Training tab, Privacy tab)
- [ ] Light theme toggle (remaining)

### Phase 3 (Month 10-12)
- [x] Federation Console
- [ ] Settings (Federation tab hardening, if not fully aligned)
- [ ] Mobile companion app (separate product track)

---

## 11. Technology Stack for UI

```
Electron + React + TypeScript
├── Bundler:      Vite + electron-vite
├── UI Library:   React 18 + TypeScript
├── Styling:      Tailwind CSS v4 (utility-first, design tokens as CSS vars)
├── Components:   Radix UI primitives (accessible, unstyled)
├── Icons:        Lucide React
├── State:        Zustand (lightweight, no boilerplate)
├── IPC:          electron.ipcRenderer ↔ electron.ipcMain (typed)
├── Backend IPC:  gRPC (core engine layer)
├── Charts:       Recharts (training loss curves, GPU metrics)
└── Code blocks:  highlight.js with custom dark theme
```

Design tokens live in `src/styles/tokens.css` as CSS custom properties, consumed by Tailwind. This creates a single source of truth shared across the Desktop app and (Phase 2) the Web dashboard.

---

## 12. Next Steps (Documentation + Hardening)

1. Reconcile status language across PRD/spec/implementation plans (single source of truth)
2. Finalize remaining light-theme and federation-settings hardening items
3. Convert skipped E2E voice tests into opt-in CI lane with explicit evidence artifacts
4. Refresh acceptance checklist with completed vs remaining tags and owners
5. Maintain this design doc as canonical UI contract for v1.0 polish
