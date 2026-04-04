> Plan Status: Closed on 2026-04-04. This file is a historical planning artifact; execution tracking is consolidated in docs/plans/2026-04-04-plan-closure-report.md.

# Sovereign Code — Figma Key Frames & Component Spec

**Version:** 1.0  
**Date:** 2026-04-01  
**Status:** Ready for Figma build  
**Source:** Derived from UI/UX Design Doc v1.0 + Implementation Plan  

Use this document to build the Figma file. All values are exact — do not approximate.  
Import `tokens.json` (sibling file) into Figma via **Tokens Studio** or the **Variables** panel.

---

## 0. Figma File Setup

```
File name:  Sovereign Code — Design System
Pages:
  1. 🎨 Tokens & Styles    (colour styles, text styles, effect styles)
  2. 🧩 Components         (all reusable components)
  3. 🖥 Frame: Dashboard
  4. 🖥 Frame: Models Hub
  5. 🖥 Frame: Chat / Agent
  6. 🖥 Frame: Command Palette
  7. 🖥 Frame: Status Bar States
  8. 📐 Annotations        (spacing callouts, redlines)
```

---

## 1. Canvas & Frame Sizes

| Frame | Width | Height | Notes |
|---|---|---|---|
| App Window (all screens) | 1280 | 800 | Default Electron window |
| Sidebar — collapsed | 56 | 800 | Icon-only |
| Sidebar — expanded | 220 | 800 | Icon + label |
| Status Bar | 1280 | 28 | Full-width, bottom |
| Title Bar | 1280 | 32 | Full-width, top |
| Main Content | 1004 | 740 | 1280 − 220 sidebar − 56 right gutter |
| Command Palette overlay | 640 | auto | Centred, max-h 480 |
| Mobile / narrow (Phase 2) | 375 | 812 | — |

---

## 2. Colour Styles (create as Figma Colour Styles)

### 2.1 Background

| Style name | Hex | Usage |
|---|---|---|
| `bg/base` | `#0D0D0D` | App window background |
| `bg/surface-1` | `#161616` | Sidebar, status bar |
| `bg/surface-2` | `#1E1E1E` | Cards, panels |
| `bg/surface-3` | `#252525` | Nested cards, code blocks |
| `bg/elevated` | `#2D2D2D` | Popovers, dropdowns, tooltips |

### 2.2 Border

| Style name | Hex | Usage |
|---|---|---|
| `border/subtle` | `#2A2A2A` | Low-contrast dividers |
| `border/default` | `#363636` | Standard borders |
| `border/strong` | `#484848` | Active / focused state |

### 2.3 Text

| Style name | Hex | Usage |
|---|---|---|
| `text/primary` | `#F5F5F5` | Main body text |
| `text/secondary` | `#A3A3A3` | Labels, descriptions |
| `text/muted` | `#737373` | Disabled, placeholder |
| `text/code` | `#E5E5E5` | Monospace code text |

### 2.4 Accent — Sovereign Violet

| Style name | Hex | Usage |
|---|---|---|
| `accent/400` | `#A78BFA` | Hover states |
| `accent/500` | `#8B5CF6` | Primary buttons, active nav, links |
| `accent/600` | `#7C3AED` | Button active / pressed |

### 2.5 Semantic

| Style name | Hex | Usage |
|---|---|---|
| `semantic/green-400` | `#4ADE80` | Online, success |
| `semantic/green-500` | `#22C55E` | Running, healthy |
| `semantic/red-400` | `#F87171` | Error state |
| `semantic/red-500` | `#EF4444` | Critical / offline |
| `semantic/yellow-400` | `#FACC15` | Warning, training active |
| `semantic/yellow-500` | `#EAB308` | Caution |
| `semantic/blue-400` | `#60A5FA` | Info, streaming |
| `semantic/blue-500` | `#3B82F6` | Download progress |

### 2.6 Special

| Style name | Hex | Usage |
|---|---|---|
| `special/local-badge-bg` | `#1A2744` | "Running Locally" badge background |
| `special/local-badge-fg` | `#60A5FA` | "Running Locally" badge text |

---

## 3. Text Styles (create as Figma Text Styles)

Font family: **Inter** (closest system-UI equivalent available in Figma).  
For code: **JetBrains Mono**.

| Style name | Size | Weight | Line height | Letter spacing | Usage |
|---|---|---|---|---|---|
| `text/xs` | 11 | 400 Regular | 16 | 0 | Timestamps, badges |
| `text/sm` | 13 | 400 Regular | 18 | 0 | Labels, table cells |
| `text/sm-medium` | 13 | 500 Medium | 18 | 0 | Active sidebar labels |
| `text/base` | 14 | 400 Regular | 20 | 0 | Body text, sidebar items |
| `text/base-medium` | 14 | 500 Medium | 20 | 0 | Button labels |
| `text/md` | 15 | 400 Regular | 22 | 0 | Chat messages |
| `text/lg` | 17 | 600 SemiBold | 24 | −0.2 | Panel headings |
| `text/xl` | 20 | 600 SemiBold | 28 | −0.3 | Screen titles |
| `text/2xl` | 24 | 700 Bold | 32 | −0.4 | Onboarding headings |
| `text/3xl` | 32 | 700 Bold | 40 | −0.5 | Empty state headings |
| `code/base` | 13 | 400 Regular | 20 | 0 | Inline code |
| `code/md` | 14 | 400 Regular | 22 | 0 | Code blocks |

---

## 4. Spacing & Grid

**Base unit:** 4px grid.

| Token | Value | Figma usage |
|---|---|---|
| `space/xs` | 4 | Icon padding |
| `space/sm` | 8 | Component internal padding |
| `space/md` | 12 | Standard gap |
| `space/lg` | 16 | Section gap |
| `space/xl` | 24 | Panel padding |
| `space/2xl` | 32 | Section separation |
| `space/3xl` | 48 | Screen-level spacing |

**Layout grid (main content area):**  
- Columns: 12, Gutter: 16, Margin: 24

---

## 5. Border Radius Styles

| Token | Value | Usage |
|---|---|---|
| `radius/none` | 0 | Progress bars, status bars |
| `radius/sm` | 4 | Badges, chips |
| `radius/md` | 6 | Buttons, inputs, small cards |
| `radius/lg` | 8 | Cards, panels |
| `radius/xl` | 12 | Modals, large cards |
| `radius/full` | 9999 | Toggle pills, avatars |

---

## 6. Effect Styles

| Style name | Type | Values | Usage |
|---|---|---|---|
| `shadow/card` | Drop shadow | x:0 y:1 blur:4 spread:0 `#00000040` | Cards, panels |
| `shadow/elevated` | Drop shadow | x:0 y:4 blur:12 spread:0 `#00000066` | Popovers, modals |
| `shadow/focus` | Drop shadow | x:0 y:0 blur:0 spread:2 `#8B5CF6` | Focus ring (accent-500) |

---

## 7. Icon Map (Lucide React → Figma)

Import Lucide icons as SVG components. In Figma, place on page 1 as Icon components.

| Feature | Lucide icon name | SVG available at |
|---|---|---|
| Dashboard | `LayoutDashboard` | lucide.dev/icons/layout-dashboard |
| Models | `Cpu` | lucide.dev/icons/cpu |
| Chat / Agent | `MessageSquare` | lucide.dev/icons/message-square |
| Training | `Zap` | lucide.dev/icons/zap |
| Federation | `Network` | lucide.dev/icons/network |
| Settings | `Settings` | lucide.dev/icons/settings |
| Help | `HelpCircle` | lucide.dev/icons/help-circle |
| Download | `Download` | lucide.dev/icons/download |
| Running / Online | `CheckCircle2` | lucide.dev/icons/check-circle-2 |
| Loading (spin) | `Loader2` | lucide.dev/icons/loader-2 |
| Training active | `Zap` (yellow, pulse) | — |
| Lock (privacy) | `Lock` | lucide.dev/icons/lock |
| Server | `Server` | lucide.dev/icons/server |
| GPU / Activity | `Activity` | lucide.dev/icons/activity |
| VRAM | `MemoryStick` | lucide.dev/icons/memory-stick |
| Tokens/sec | `Gauge` | lucide.dev/icons/gauge |
| Search | `Search` | lucide.dev/icons/search |
| Collapse | `ChevronsLeft` | lucide.dev/icons/chevrons-left |
| Delete | `Trash2` | lucide.dev/icons/trash-2 |
| Fine-tune | `Zap` | lucide.dev/icons/zap |
| Active indicator | `CheckCircle2` | lucide.dev/icons/check-circle-2 |
| Attach / Import | `Paperclip` | lucide.dev/icons/paperclip |

**Icon sizes:**
- Status bar icons: 14×14
- Sidebar nav icons: 18×18
- Button icons: 16×16
- Screen title icons: 20×20
- Empty state illustration icon: 48×48

---

## 8. Component Specs

### 8.1 SidebarNavItem

```
Auto layout: Horizontal, gap 10, padding H:12 V:10
Width: Fill (220 expanded / 56 collapsed)
Height: 40

States:
  Default:
    background: transparent
    text: text/secondary (#A3A3A3)
    icon: text/secondary

  Hover:
    background: bg/surface-2 (#1E1E1E), radius/md (6px)
    text: text/primary (#F5F5F5)
    icon: text/primary

  Active:
    background: accent/500 at 12% opacity (#8B5CF6 1F) — hex #8B5CF61F
    text: accent/500 (#8B5CF6), weight 500 Medium
    icon: accent/500 (#8B5CF6)
    left bar: 2px × 24px rect, fill accent/500, positioned left edge

  Collapsed (icon only):
    Width: 56
    Icon centred. Label hidden. Tooltip on hover.

Accessibility:
  aria-current="page" on active item
  cursor: pointer
```

### 8.2 StatusBar

```
Auto layout: Horizontal, gap 0, padding H:16 V:0
Height: 28
Background: bg/surface-1 (#161616)
Border top: 1px border/subtle (#2A2A2A)
role="status"
aria-label="System status"

Segments (left → right):
  1. Running Locally badge
     [Lock icon 14×14 text/secondary] [space 4] ["Running Locally" text/xs local-badge-fg]
     badge bg: local-badge-bg (#1A2744), radius/sm (4px), padding H:8 V:3

  2. Separator: 1px h:12 border/subtle, margin H:12

  3. Model name
     text/sm text/secondary — clickable, cursor pointer

  4. Separator

  5. GPU · temp
     ["GPU " + used + "/" + total + " GB · " + temp + "°C"]
     text/xs text/muted

  6. Separator

  7. tok/s
     [Gauge icon 14×14 text/muted aria-hidden] [space 4] [value text/xs text/secondary]
     Hidden when no model loaded

  CONDITIONAL — Training (shows only when training running):
  [Separator] [Zap icon yellow aria-hidden] [" Training: Running" text/xs yellow-400]

  CONDITIONAL — Federation (shows only when federationPeers > 0):
  [Separator] [Network icon blue aria-hidden] [" N peers" text/xs blue-400]

Separator component:
  Width: 1, Height: 12
  Fill: border/subtle
  aria-hidden="true"
```

### 8.3 ActiveModelCard (Dashboard hero)

```
Auto layout: Vertical, gap 16, padding: 24
Width: Fill
Background: bg/surface-2 (#1E1E1E)
Border: 1px border/default (#363636)
Border radius: radius/lg (8px)

Contents:
  Row 1 — Header:
    Auto layout: Horizontal, space-between, align center
    Left:  model name text/xl text/primary + quant badge text/xs
    Right: [Switch Model ▾] ghost button, text/sm accent/500

  Divider: 1px border/subtle, full width

  Row 2 — VRAM bar:
    Label "VRAM" text/xs text/secondary, margin-bottom 6
    Progress bar:
      Height: 8
      Background: bg/surface-3 (#252525)
      Fill track: accent/500 → accent/600 gradient (linear, left to right)
      Fill track > 75%: yellow-500 (#EAB308)
      Fill track > 90%: red-500 (#EF4444)
      Border radius: radius/none on track, radius/sm on fill
    Label: "18.2 / 24 GB" text/xs text/muted, right-aligned

  Row 3 — Stats strip:
    Auto layout: Horizontal, gap 16
    [Gauge icon 16 text/muted aria-hidden] "45.3 tok/s" text/sm text/secondary
    separator dot ·
    "128K context" text/sm text/muted
    separator dot ·
    "First token: 380ms" text/sm text/muted

  Row 4 — CTA:
    [<MessageSquare> Open Chat] — filled accent button
    Background: accent/500 (#8B5CF6)
    Hover: accent/400 (#A78BFA)
    Active: accent/600 (#7C3AED)
    Text: text/primary (#F5F5F5), text/base-medium
    Border radius: radius/md (6px)
    Padding: H:16 V:8
    Icon: MessageSquare 16×16 white aria-hidden, gap 8
```

### 8.4 HealthDot Strip (Dashboard)

```
Auto layout: Horizontal, gap 16, padding V:12 H:0
Border top + bottom: 1px border/subtle
Background: transparent

Each HealthDot:
  Auto layout: Horizontal, gap 6, align center
    Dot: 8×8 circle
      green-500 (#22C55E)   = Ready / running
      yellow-400 (#FACC15)  = Warning / idle
      red-400 (#F87171)     = Error / offline
    Label: text/sm text/secondary

Items: "Inference: Ready" · "GPU: 72°C" · "Training: Idle"
```

### 8.5 CommandPalette Overlay

```
Outer: Radix Dialog, backdrop blur 4px + #00000080 overlay
Inner panel:
  Width: 640, max-height: 480
  Background: bg/elevated (#2D2D2D)
  Border: 1px border/default (#363636)
  Border radius: radius/xl (12px)
  Shadow: shadow/elevated

Search input:
  Height: 48
  Padding: H:16 V:0
  [Search icon 16 text/muted aria-hidden] [input fill text/primary text/md]
  Border bottom: 1px border/subtle
  background transparent
  placeholder text/muted "Type a model name or command..."

Results list:
  Section header: text/xs text/muted, uppercase, letter-spacing 0.08em, padding H:16 V:8
  Item height: 40, padding H:16
  Item hover: bg/surface-3 (#252525)
  Item selected (keyboard): bg/surface-2 (#1E1E1E) + left 2px accent/500 bar
  Item layout: Horizontal, gap 10
    Icon 16×16 text/muted aria-hidden
    Label text/base text/primary
    Badge (active model): text/xs accent/500 "Active", padding H:6 V:2, border radius/sm
```

### 8.6 Models Hub Layout

```
Overall: Horizontal split, full height content area

Left panel (aside):
  Width: 200, fixed
  Background: bg/surface-1 (#161616)
  Border right: 1px border/subtle
  Padding: 16

  Section header: text/xs text/secondary uppercase letter-spacing 0.08em

  Model list item (button):
    Height: 36, padding H:8 V:6
    Border radius: radius/md (6px)
    Auto layout: Horizontal, gap 8, align center
    Selected:
      background: accent/500 at 12% — #8B5CF61F
      [CheckCircle2 14 accent/500 aria-hidden] model name text/sm accent/500
    Default:
      transparent bg
      model name text/sm text/secondary
    aria-current="page" on selected

Right panel (main):
  Background: bg/surface-2 (#1E1E1E)
  Padding: 24

  Header: model name text/xl text/primary + size text/sm text/muted
  Divider

  Info grid — 2 columns:
    Label: text/xs text/muted, uppercase
    Value: text/sm text/primary
    Items: Digest · Size · Status · Format · Context · Parameters

  Action buttons row (bottom):
    [<CheckCircle2> Set as Active] — accent filled button
    [<Zap> Fine-tune] — secondary ghost button (border/default, text/secondary)
    [<Trash2> Delete] — destructive ghost button (border/default, text red-400)
    All: radius/md, padding H:12 V:7, cursor pointer
    All icons: 16×16 aria-hidden

Empty state (no model selected):
  Centred vertically in right panel
  <Cpu> icon 48×48 text/muted
  "Select a model to see details" text/base text/muted
```

### 8.7 Button Component (all variants)

```
Base:
  Auto layout: Horizontal, gap 8, align center
  Border radius: radius/md (6px)
  cursor: pointer
  transition: background 120ms ease

Filled / Primary:
  Background: accent/500 (#8B5CF6)
  Text: text/primary (#F5F5F5), text/base-medium
  Padding: H:16 V:8
  Hover: accent/400
  Active: accent/600
  Focus: shadow/focus (2px accent/500 ring)

Ghost / Secondary:
  Background: transparent
  Border: 1px border/default (#363636)
  Text: text/secondary (#A3A3A3), text/base
  Padding: H:12 V:7
  Hover: background bg/surface-3

Destructive:
  Same as Ghost but text: red-400 (#F87171)
  Hover: background red-500 at 10%

Small (sm):
  Padding: H:8 V:4
  Text size: text/sm

Icon button:
  Width: 32, Height: 32
  Icon centred
  Same state backgrounds as variants above
```

---

## 9. Key Frame Builds (step-by-step)

### Frame 1: Dashboard

```
Canvas size: 1280 × 800

Layers (top to bottom):
  TitleBar [1280 × 32] bg/surface-1, border-bottom border/subtle
    Left:  traffic lights placeholder (macOS) OR window controls (Win)
    Centre: "Sovereign Code — Qwen2.5-32B ▾" text/base text/secondary
    Right: [–][□][✕] controls

  Sidebar [220 × 740] bg/surface-1, border-right border/subtle
    Logo row: H:48, [crown icon 20] "Sovereign" text/xl accent/500
    Nav group: 5 × SidebarNavItem — Dashboard active
    Bottom group: Settings + Help SidebarNavItem

  MainContent [1060 × 740] bg/base
    Scrollable vertical, padding 32
    Title: "Dashboard" text/xl text/primary, margin-bottom 24
    ActiveModelCard — full width, auto height
    HealthDot strip — full width, margin V:20
    Quick Actions card [bg/surface-2, border, radius/lg, padding 16]
      2×2 grid of ghost buttons, gap 12

  StatusBar [1280 × 28] anchored bottom
```

### Frame 2: Models Hub

```
Canvas size: 1280 × 800

Layers:
  TitleBar [1280 × 32] — same as Dashboard
  Sidebar [220 × 740] — same, with Models active
  MainContent [1060 × 740] bg/base
    Horizontal split:
      Left panel [200 × 740] bg/surface-1, border-right
        Padding 16
        "INSTALLED" section header
        3 × Model list items (Qwen2.5 selected, others default)
        "AVAILABLE" section header (Phase 2 / greyed)
      Right panel [860 × 740] bg/surface-2
        Padding 24
        Model detail card for Qwen2.5-32B
        Info grid 2-col
        Action buttons row
  StatusBar [1280 × 28]
```

### Frame 3: Chat / Agent

```
Canvas size: 1280 × 800

Layers:
  TitleBar [1280 × 32]
  Sidebar [220 × 740] — Chat active
  ChatPanel [1060 × 740] bg/base
    Padding 0
    MessageList [1060 × fill] — scrollable
      System message [full width, bg/surface-2, padding 16, text/sm text/muted]
      User message [right-aligned bubble, max-w 680, bg/surface-3, radius/lg, padding 16]
        "can you write a binary search in Python?" text/md text/primary
      Assistant message [left-aligned, max-w 680, padding 16]
        Prose text/md text/primary
        Code block [bg/surface-3, radius/md, padding 16, JetBrains Mono code/md]
        streaming cursor (blinking 1px accent/500 bar when streaming)
    InputBar [1060 × auto, min-h 64, max-h 200] bg/surface-1, border-top border/subtle
      Padding 16
      Auto layout: Horizontal, gap 12, align flex-end
      Attachments [Paperclip icon 20 text/muted, aria-hidden]
      Textarea [fill, min-h 36, bg/surface-2, radius/lg, border border/default, padding 12]
        placeholder "Ask anything..." text/muted text/md
      Send button [primary filled, 36×36 icon button, SendHorizontal icon]
  StatusBar [1280 × 28]
```

### Frame 4: Command Palette (overlay state)

```
Canvas size: 1280 × 800
Background: Dashboard frame dimmed (opacity 40%)
Overlay: [640 × auto] centred — see Component 8.5
Show:
  - 3 installed models in Models section, first with Active badge
  - 3 actions in Actions section
  - Search input empty (default open state)
```

### Frame 5: Status Bar State Sampler

```
Canvas size: 1280 × 200
Show 4 horizontal status bar variants stacked:
  1. Default (no training, no federation)
  2. Training running (shows Training: Running segment)
  3. Federation active (shows N peers segment)
  4. High VRAM warning (VRAM fill yellow, temp red 85°C)
```

---

## 10. Prototype Connections (Figma Prototype tab)

| Trigger | From | To | Animation |
|---|---|---|---|
| Click "Dashboard" in sidebar | any frame | Frame 1 Dashboard | Instant |
| Click "Models" in sidebar | any frame | Frame 2 Models Hub | Instant |
| Click "Chat" in sidebar | any frame | Frame 3 Chat | Instant |
| Click "Switch Model ▾" or ⌘K | Frame 1 | Frame 4 Cmd Palette | Dissolve 150ms |
| Press Esc | Frame 4 | Previous frame | Dissolve 100ms |
| Click "Open Chat" | Frame 1 | Frame 3 Chat | Smart animate 200ms |

---

## 11. Handoff Checklist

Before sharing with developers:

- [ ] All colour tokens are Figma Colour Styles (not hardcoded)
- [ ] All text uses Figma Text Styles (not overrides)
- [ ] All components have variants and documented states
- [ ] Icons are importerd from Lucide SVG (not emoji, not screenshots)
- [ ] All interactive elements are marked Prototype connections
- [ ] Accessibility annotations added (aria-current, role=status, aria-hidden icons)
- [ ] Spacing values use 4px grid throughout
- [ ] Export `tokens.json` (W3C DTCG format) and commit to `apps/desktop/src/renderer/styles/`


