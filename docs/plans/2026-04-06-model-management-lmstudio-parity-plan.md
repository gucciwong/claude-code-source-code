# Model Management LM Studio Parity Plan

> For Claude: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Goal: Bring the desktop model-management experience to near-parity with LM Studio's model spec, load, and inference workflow while preserving Sovereign Code's mixed Ollama plus model-manager architecture.

Architecture: Keep the existing `Models` screen as the shell, but refactor the right-hand detail pane into a dedicated model workspace with a stable header, action bar, and three primary tabs: `Info`, `Load`, and `Inference`. Reuse current model-manager and Ollama stores where they already fit, add a normalized model-spec view model, and introduce capability-aware parameter panels so unsupported controls are hidden or disabled instead of shown as dead UI.

Tech Stack: Electron, React, TypeScript, Zustand, existing `modelManagerAPI`, existing Ollama fetch flows, current desktop design tokens and Tailwind utility classes.

---

## 1. Product Decision

Target fidelity level: LM Studio parity plus Sovereign-specific additions.

This means:

- Match LM Studio's information architecture and workflow order closely.
- Match functional modules and settings coverage closely.
- Do not copy branding, exact styling tokens, or proprietary visual identity verbatim.
- Preserve Sovereign-specific concepts already present in this repo:
  - Ollama-installed models
  - Model Manager cached models
  - CPU-safe GGUF restrictions
  - Hardware fit evaluation
  - Org insights and training-adjacent workflows

## 2. Current Repo Baseline

Existing relevant files:

- `apps/desktop/src/renderer/screens/Models.tsx`
- `apps/desktop/src/renderer/components/models/ModelLoadSettings.tsx`
- `apps/desktop/src/renderer/store/modelsStore.ts`
- `apps/desktop/src/renderer/store/modelManagerStore.ts`
- `apps/desktop/src/renderer/services/modelManagerAPI.ts`
- `apps/desktop/src/renderer/components/models/HuggingFacePanel.tsx`
- `apps/desktop/src/renderer/components/common/SystemHealth.tsx`

What already exists:

- Installed-model list and downloaded-model list.
- Basic per-model detail card.
- A load-settings panel for model-manager-backed models.
- Error surface via `last_error`.
- Hardware-fit evaluation scaffold.

What is missing relative to the target:

- Unified LM Studio-style model workspace.
- Stable tabbed spec shell around the selected model.
- Full parameter taxonomy across load and inference.
- Capability-derived field rendering.
- Preset management.
- Structured model metadata normalization.
- A complete state machine for `unloaded`, `loading`, `loaded`, `inferencing`, `error`, `unsupported`.

## 3. Target Information Architecture

### 3.1 Screen Structure

Keep the overall `Models` route, but restructure it as follows:

1. Left Sidebar
2. Main Workspace Header
3. Primary Action Bar
4. Tab Strip
5. Tab Content Area
6. Sticky Footer Actions when relevant

### 3.2 Left Sidebar

Sections:

1. `Installed (Ollama)`
2. `Downloaded (Model Manager)`
3. `Remote Catalog / HuggingFace`
4. `Presets`
5. `Recent`

Each model row should show:

- Display name
- Active badge
- Backend badge: `Ollama`, `GGUF`, `HF`, `Local`
- Readiness badge: `Ready`, `Incomplete`, `Needs GPU`, `Error`
- Optional mini resource hint: `3.8 GB`, `Q8_0`, `32k ctx`

### 3.3 Main Workspace Header

Top row fields:

- Model title
- Variant or file name
- Format chip
- Quantization chip
- Backend chip
- Active / Loaded state chip

Primary top actions:

- `Use in New Chat`
- `Load Model`
- `Unload Model`
- `Delete`
- `Export`
- `Copy ID`

Secondary status line:

- Full model ID
- File path or source repo
- Size on disk
- Last modified
- Runtime note such as `CPU GGUF recommended` or `GPU required`

### 3.4 Primary Tabs

Use these tabs for the selected model:

1. `Info`
2. `Load`
3. `Inference`
4. `Files`
5. `Presets`
6. `Diagnostics`

`Info`, `Load`, and `Inference` are mandatory for first delivery.
`Files`, `Presets`, and `Diagnostics` can follow in phase 2.

## 4. Module Inventory

### Module A: Model Workspace Shell

Purpose:

- Replace the current ad hoc detail pane with a stable, reusable container for all model-specific modules.

Responsibilities:

- Read selected model from either Ollama or model-manager sources.
- Normalize metadata into one UI shape.
- Render header, action bar, and tabs.
- Route actions to the correct backend.

Proposed files:

- Create `apps/desktop/src/renderer/components/models/ModelWorkspace.tsx`
- Create `apps/desktop/src/renderer/components/models/modelWorkspaceTypes.ts`
- Create `apps/desktop/src/renderer/components/models/modelWorkspaceMappers.ts`
- Modify `apps/desktop/src/renderer/screens/Models.tsx`

### Module B: Normalized Model Spec Layer

Purpose:

- Convert inconsistent Ollama and model-manager metadata into one `ModelSpec` object.

Required normalized fields:

- `id`
- `displayName`
- `source`
- `backend`
- `format`
- `fileName`
- `localPath`
- `sizeBytes`
- `sizeOnDiskBytes`
- `quantization`
- `architecture`
- `parameterCountText`
- `contextLengthMax`
- `visionCapable`
- `toolUseCapable`
- `reasoningCapable`
- `structuredOutputCapable`
- `draftModelCapable`
- `status`
- `lastModified`
- `loadRequirements`
- `inferenceDefaults`
- `unsupportedReason`

Purpose of this layer:

- Prevent UI branches from depending directly on backend-specific response shapes.
- Keep the same layout for Ollama and GGUF models.

### Module C: Info Tab

Purpose:

- Present the model spec in a way that matches the LM Studio mental model.

Layout:

1. `Model Information` card
2. `Capabilities` card
3. `Runtime Compatibility` card
4. `Storage and Files` card
5. `Provenance` card

Required `Model Information` fields:

- Model
- File
- Format
- Quantization
- Architecture
- Parameter count
- Domain / family
- Size on disk
- Context max
- Backend

Required `Capabilities` chips:

- Vision
- Tool use
- Reasoning
- Structured output
- Embeddings-only
- Draft model support

Required `Runtime Compatibility` block:

- Hardware fit score
- CPU threads verdict
- RAM verdict
- GPU / VRAM verdict
- SSD verdict
- Recommended runtime summary

Required `Storage and Files` fields:

- Local path
- File count
- Cache origin
- Download completeness
- Exportable formats

Required `Provenance` fields:

- Source repo or registry
- Source type: `HuggingFace`, `Ollama`, `Imported`, `Local`
- Digest or checksum if available
- Last modified

### Module D: Load Tab

Purpose:

- Match LM Studio's load workflow: context, offload, memory, and advanced runtime toggles.

Layout:

Accordion groups:

1. `Context and Offload`
2. `Memory`
3. `Runtime`
4. `Advanced`
5. `Backend-Specific`

Required controls in `Context and Offload`:

- Context length
- Max context supported indicator
- GPU offload layers
- Main GPU selector when multi-GPU is available later
- Tensor split placeholder or config hook
- Context overflow policy preview

Required controls in `Memory`:

- Estimated RAM usage
- Estimated VRAM usage
- mmap toggle
- mlock toggle placeholder
- keep model in memory toggle
- KV cache offload to GPU toggle
- unified KV cache toggle
- KV cache quantization type for K
- KV cache quantization type for V

Required controls in `Runtime`:

- CPU threads
- Eval batch size
- Max concurrent predictions
- Flash attention
- Seed
- RoPE frequency base
- RoPE frequency scale

Required controls in `Advanced`:

- Advanced visibility toggle
- Backend warnings
- Unsupported control notes
- Reset to defaults
- Save as preset

`Backend-Specific` rules:

- GGUF models show full llama.cpp-style controls.
- Ollama models show only supported load-time controls.
- HF snapshot models should clearly state if interactive load is GPU-required.
- CPU-only host plus non-GGUF model should show `Blocked on this machine` instead of a misleading enabled `Load Model` action.

Current repo controls already present and should be preserved or migrated:

- `contextLength`
- `gpuOffloadLayers`
- `cpuThreads`
- `evalBatchSize`
- `maxConcurrentPredictions`
- `unifiedKvCache`
- `ropeFrequencyBase`
- `ropeFrequencyScale`
- `kvOffloadToGpu`
- `keepInMemory`
- `useMmap`
- `seed`
- `flashAttention`
- `kCacheQuantType`
- `vCacheQuantType`

### Module E: Inference Tab

Purpose:

- Match LM Studio's inference-configuration model and expose all per-run decoding controls.

Layout:

Accordion groups:

1. `System Prompt`
2. `Core Settings`
3. `Reasoning Parsing`
4. `Sampling`
5. `Structured Output`
6. `Speculative Decoding`
7. `Prompt Template`

Required controls in `System Prompt`:

- Multi-line system prompt editor
- Token count indicator
- Reset button
- Template variable preview later

Required controls in `Core Settings`:

- Temperature
- Max tokens or response length limit
- Context overflow behavior
- Stop strings
- CPU threads override when supported

Required controls in `Reasoning Parsing`:

- Enable reasoning parser toggle
- Start tag
- End tag
- Preview parsed content
- Capability-gated note if the model is not suited for reasoning tags

Required controls in `Sampling`:

- Top K
- Top P
- Min P
- Repeat penalty
- Frequency penalty
- Presence penalty
- Repeat last N
- Mirostat mode placeholder
- Mirostat tau placeholder
- Mirostat eta placeholder
- Tail free sampling placeholder

Required controls in `Structured Output`:

- JSON mode toggle
- JSON schema editor
- Grammar placeholder if backend supports it later
- Validation error display

Required controls in `Speculative Decoding`:

- Enable speculative decoding toggle
- Draft model selector
- Capability guard when no compatible draft model exists

Required controls in `Prompt Template`:

- Auto template mode
- Manual template mode
- Jinja-like editor surface
- Restore defaults
- Model default template preview

### Module F: Files Tab

Purpose:

- Give a file-level view of the selected model instead of showing only summary metadata.

Contents:

- Main file name
- All files list
- File sizes
- Download completion state
- Symlink or cache details if applicable
- Open folder action
- Copy path action

### Module G: Presets Tab

Purpose:

- Allow saving and reusing named combinations of load and inference parameters.

Preset types:

- `Balanced`
- `Low VRAM`
- `High Throughput`
- `Coding`
- `Reasoning`
- `Structured Output`
- `Custom`

Required actions:

- Save preset
- Duplicate preset
- Rename preset
- Delete preset
- Apply preset to current model
- Apply preset as default for backend or model family

### Module H: Diagnostics Tab

Purpose:

- Show runtime facts and validation results that matter during model loading and inference.

Contents:

- Last load attempt
- Last error
- Backend response trace summary
- Memory estimate versus actual usage
- Model readiness checks
- Tokenizer / template readiness
- CPU-only restriction warnings

## 5. Parameter Matrix

### 5.1 Mandatory Load Parameters

- Context length
- GPU offload layers
- CPU threads
- Eval batch size
- Max concurrent predictions
- Flash attention
- mmap
- Keep in memory
- KV cache offload
- Unified KV cache
- K cache quantization
- V cache quantization
- RoPE frequency base
- RoPE frequency scale
- Seed

### 5.2 Mandatory Inference Parameters

- System prompt
- Temperature
- Max tokens
- Top K
- Top P
- Min P
- Repeat penalty
- Frequency penalty
- Presence penalty
- Stop strings
- Context overflow behavior

### 5.3 Phase 2 Parameters

- Repeat last N
- Mirostat mode
- Mirostat tau
- Mirostat eta
- Tail free sampling
- Typical P
- Grammar constraints
- JSON schema enforcement
- Draft model selection
- Tensor split
- Multi-GPU placement
- mlock
- NUMA policy placeholder

### 5.4 Capability Gating Rules

Only show controls when supported by backend or format.

Examples:

- `Speculative Decoding` visible only when backend can support draft-model flow.
- `Reasoning Parsing` enabled by default only for models or presets tagged as reasoning-capable.
- `Structured Output` full schema mode shown only when the backend can enforce it.
- Non-GGUF CPU-only load should present explanatory blocking UI, not a clickable load action.

## 6. Layout Specification

### 6.1 Desktop Layout

Left rail width:

- `240px` to `280px`

Right workspace:

- Full-height flex column
- Sticky header
- Sticky action bar
- Sticky tab strip
- Scrollable content panels

Recommended vertical order:

1. Title row
2. Action row
3. Tabs row
4. Content section accordions
5. Sticky footer with `Cancel`, `Reset`, `Save Preset`, `Load Model`, or `Apply`

### 6.2 Mobile or Narrow Width Behavior

- Collapse left rail into a drawer.
- Move action row below the title.
- Preserve tabs as horizontally scrollable pills.
- Accordions remain the primary content pattern.

### 6.3 Interaction Patterns

- Single selected model at a time.
- Tab state persists per selected model during the session.
- Parameter edits are dirty-tracked.
- Switching models prompts only if there are unsaved manual edits.
- Preset application shows diff preview in phase 2.

## 7. State Architecture

### 7.1 Keep Existing Stores

- `useModelsStore`
- `useModelManagerStore`
- `useSystemStore`

### 7.2 Add New Stores or Slices

Create:

- `useModelWorkspaceStore`
- `useModelPresetsStore`
- `useInferenceSettingsStore` if current parameter storage is too load-centric

`useModelWorkspaceStore` responsibilities:

- selected unified model ID
- active tab
- dirty state
- model runtime status
- normalized model spec cache
- layout preferences

`useModelPresetsStore` responsibilities:

- preset list
- preset scopes: global, backend, model family, model-specific
- last applied preset

## 8. Backend and API Requirements

### 8.1 Existing APIs to Reuse

- `GET /api/v1/models`
- `POST /api/v1/models/{id}/set-active`
- `DELETE /api/v1/models/{id}`
- existing Ollama `show`, `delete`, and inference routes

### 8.2 Required API Enrichment

The UI plan benefits from richer model metadata. Add, if missing:

- `context_length_max`
- `quantization`
- `architecture`
- `capabilities`
- `file_name`
- `size_on_disk_bytes`
- `completeness`
- `runtime_requirements`
- `supports_reasoning_tags`
- `supports_structured_output`

If the backend cannot provide all of these immediately, the mapper layer must derive best-effort values from filename, format, and known model patterns.

## 9. Sovereign-Specific Additions Beyond LM Studio

These should stay in the final product because they fit the repo's purpose:

1. Hardware fit card integrated into Info and System Health
2. CPU-safe load restrictions for non-GGUF models
3. Backend routing transparency: `Ollama` versus `Model Manager`
4. Org insights coexistence in the broader Models route
5. Training-readiness indicators later

## 10. Error Handling Rules

- Loading blocked by hardware: show explicit blocker card with recommended alternative.
- Incomplete download: show `Incomplete` badge and disable load.
- Unsupported parameter: disable control and explain why.
- Backend error: surface raw backend message plus human summary.
- Missing metadata: show neutral fallback, never blank UI.
- Preset mismatch: mark incompatible fields and skip safely.

## 11. Testing Strategy

### Unit Tests

- Normalization mapper tests
- Capability gating tests
- Parameter default derivation tests
- preset serialization tests
- hardware-fit evaluator tests

### Component Tests

- `ModelWorkspace`
- `ModelInfoTab`
- `ModelLoadTab`
- `ModelInferenceTab`
- `ModelFilesTab`
- `ModelPresetsTab`
- blocker states and error surfaces

### Integration Tests

- Select model -> view info -> change tab -> load -> use in chat
- GGUF model on CPU-only host
- HF snapshot model on CPU-only host shows blocked state
- Delete active model clears selection safely
- Apply preset updates visible controls and request payload

## 12. Delivery Phases

### Phase 1: Shell and Info Parity

- Build `ModelWorkspace`
- Add unified model mapper
- Replace current detail pane with LM Studio-style shell
- Deliver `Info` tab with full model spec and hardware fit

### Phase 2: Load Parity

- Migrate current `ModelLoadSettings` into tabbed workspace
- Add grouped accordions
- Add all mandatory load controls
- Add runtime blockers and support matrix

### Phase 3: Inference Parity

- Build `Inference` tab
- Add prompt, sampling, reasoning, structured-output, and speculative-decoding sections
- Persist inference presets

### Phase 4: Files, Presets, Diagnostics

- Add remaining parity tabs
- Add preset CRUD
- Add diagnostics and file listing

### Phase 5: Polish and Validation

- Keyboard shortcuts
- dirty-state protection
- accessibility pass
- visual consistency pass
- full regression suite

## 13. File-Level Implementation Plan

Create:

- `apps/desktop/src/renderer/components/models/ModelWorkspace.tsx`
- `apps/desktop/src/renderer/components/models/ModelHeader.tsx`
- `apps/desktop/src/renderer/components/models/ModelActionBar.tsx`
- `apps/desktop/src/renderer/components/models/ModelTabs.tsx`
- `apps/desktop/src/renderer/components/models/tabs/ModelInfoTab.tsx`
- `apps/desktop/src/renderer/components/models/tabs/ModelLoadTab.tsx`
- `apps/desktop/src/renderer/components/models/tabs/ModelInferenceTab.tsx`
- `apps/desktop/src/renderer/components/models/tabs/ModelFilesTab.tsx`
- `apps/desktop/src/renderer/components/models/tabs/ModelPresetsTab.tsx`
- `apps/desktop/src/renderer/components/models/tabs/ModelDiagnosticsTab.tsx`
- `apps/desktop/src/renderer/components/models/modelWorkspaceTypes.ts`
- `apps/desktop/src/renderer/components/models/modelWorkspaceMappers.ts`
- `apps/desktop/src/renderer/store/modelWorkspaceStore.ts`
- `apps/desktop/src/renderer/store/modelPresetsStore.ts`

Modify:

- `apps/desktop/src/renderer/screens/Models.tsx`
- `apps/desktop/src/renderer/components/models/ModelLoadSettings.tsx`
- `apps/desktop/src/renderer/store/modelsStore.ts`
- `apps/desktop/src/renderer/store/modelManagerStore.ts`
- `apps/desktop/src/renderer/services/modelManagerAPI.ts`

## 14. Recommendation

Implementation order should be:

1. Normalize model metadata
2. Build the workspace shell
3. Land `Info` tab parity first
4. Migrate load controls into `Load` tab
5. Add `Inference` tab and presets
6. Finish `Files`, `Presets`, and `Diagnostics`

This order minimizes risk because it stabilizes the UI frame and data model before expanding the number of controls.

## 15. Success Criteria

The feature is successful when:

- A selected model always opens in a dedicated LM Studio-style workspace.
- The user can inspect model identity, capabilities, requirements, and files without leaving the screen.
- Load and inference controls are grouped, comprehensive, and capability-aware.
- The user can tell immediately whether a model is runnable on local hardware.
- Unsupported states are explicit, not silent failures.
- The layout works for both Ollama and model-manager models without forking into two separate UIs.
