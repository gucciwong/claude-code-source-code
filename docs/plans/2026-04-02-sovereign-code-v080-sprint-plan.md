> Plan Status: Closed on 2026-04-04. This file is a historical planning artifact; execution tracking is consolidated in docs/plans/2026-04-04-plan-closure-report.md.

# Sovereign Code v0.8.0 — Advanced AI & UX Sprint Plan

**Version:** v0.8.0  
**Theme:** Advanced AI & UX  
**Date:** 2026-04-02  
**Baseline commit:** `80ad729` (v0.7.0 complete, 735 TS tests, ~281 Python tests)

---

## Overview

v0.8.0 focuses on next-generation AI capabilities, improved UX, and advanced developer productivity features. Building on v0.7.0's developer tools platform.

---

## Sprint Goals

- 5 new feature tasks (T1–T5)
- TDD: all features written test-first
- Target: ~780+ TypeScript tests, ~320+ Python tests

---

## T1: Real-Time Code Completion Service

**Service:** `services/code-completion-service/` — FastAPI port 8015

### Backend

- `CompletionEngine` — n-gram prefix model, context window 10 lines, returns top-3 completions with confidence scores
- `ContextExtractor` — extracts prefix context from active file content
- Endpoints: `POST /complete` (returns List[Completion]), `POST /feedback` (accept/reject), `GET /health`
- 20+ Python tests

### Desktop

- `shared/codeCompletion.ts` — Completion, CompletionRequest, CompletionFeedback
- `renderer/store/codeCompletionStore.ts` — completions[], activeIndex, isLoading (8 tests)
- `renderer/hooks/useCodeCompletion.ts` — getCompletions, submitFeedback (8 tests)
- `renderer/components/completion/` — CompletionDropdown, CompletionItem
- `renderer/screens/CodeCompletion.tsx` — inline editor with live completion preview (3-tab: Editor/Completions/Settings) (7 tests)
- NavSection: `'codecompletion'`, Sidebar: Code icon "Completions"

**Commit:** `feat(v0.8.0-t1): Real-Time Code Completion - CompletionEngine, ContextExtractor, CompletionDropdown, FastAPI port 8015, 43+ tests`

---

## T2: Conversation Memory & Context Management

**Service:** `services/memory-service/` — FastAPI port 8016

### Backend

- `MemoryStore` — stores conversation snippets (id, text, tags[], relevance_score, timestamp), TTL pruning
- `RelevanceRanker` — BM25-style scoring to rank memories by query relevance (cosine of TF-IDF)
- `ContextBuilder` — builds compressed context from top-k relevant memories
- Endpoints: `POST /memories` (add), `GET /memories/search?q=&top_k=`, `DELETE /memories/{id}`, `POST /context/build`, `GET /health`
- 20+ Python tests

### Desktop

- `shared/conversationMemory.ts` — Memory, MemorySearchResult, ContextSummary
- `renderer/store/memoryStore.ts` — memories[], searchResults, contextSummary (8 tests)
- `renderer/hooks/useConversationMemory.ts` — addMemory, searchMemories, buildContext, deleteMemory (8 tests)
- `renderer/components/memory/` — MemoryCard, ContextViewer
- `renderer/screens/ConversationMemory.tsx` — search input + memory list + context builder (3-tab: Memories/Search/Context) (7 tests)
- NavSection: `'memory'`, Sidebar: Brain icon "Memory"

**Commit:** `feat(v0.8.0-t2): Conversation Memory - MemoryStore, RelevanceRanker, ContextBuilder, ConversationMemory UI, FastAPI port 8016, 43+ tests`

---

## T3: Visual Diff & Merge Conflict Resolution

**Service:** `services/diff-service/` — FastAPI port 8017

### Backend

- `DiffEngine` — unified diff parser with 3-way merge support, conflict detection
- `ConflictResolver` — auto-resolve simple conflicts (whitespace, trailing newlines), flag complex conflicts
- `MergeReport` — generates summary: files changed, conflicts detected/resolved, manual_required count
- Endpoints: `POST /diff` (two-file diff), `POST /merge` (3-way), `GET /health`
- 20+ Python tests

### Desktop

- `shared/diffMerge.ts` — DiffFile, MergeConflict, MergeReport
- `renderer/store/diffStore.ts` — files[], conflicts[], report (8 tests)
- `renderer/hooks/useDiff.ts` — computeDiff, attemptMerge (8 tests)
- `renderer/components/diff/` — DiffViewer (side-by-side hunk display), ConflictMarker
- `renderer/screens/DiffMerge.tsx` — file input + diff viewer + conflict list (3-tab: Diff/Conflicts/Merge) (7 tests)
- NavSection: `'diffmerge'`, Sidebar: GitMerge icon "Diff & Merge"

**Commit:** `feat(v0.8.0-t3): Visual Diff & Merge - DiffEngine, ConflictResolver, DiffViewer, FastAPI port 8017, 43+ tests`

---

## T4: Automated Test Generation

**Service:** `services/test-gen-service/` — FastAPI port 8018

### Backend

- `FunctionParser` — extracts function signatures (name, params, return hint) from Python/JS/TS source text (regex-based)
- `TestCaseGenerator` — generates test stubs: happy path, null/undefined params, boundary values
- `TestRenderer` — renders test stubs as pytest or vitest format
- Endpoints: `POST /parse` (extract functions), `POST /generate` (generate tests), `GET /health`
- 20+ Python tests

### Desktop

- `shared/testGeneration.ts` — FunctionSignature, TestCase, GeneratedTest
- `renderer/store/testGenStore.ts` — signatures[], generatedTests[], isGenerating (8 tests)
- `renderer/hooks/useTestGen.ts` — parseSource, generateTests (8 tests)
- `renderer/components/testgen/` — FunctionList, GeneratedTestView (syntax-highlighted code block)
- `renderer/screens/TestGeneration.tsx` — source code textarea + function list + generated tests (3-tab: Parse/Generate/Output) (7 tests)
- NavSection: `'testgen'`, Sidebar: TestTube icon "Test Gen"

**Commit:** `feat(v0.8.0-t4): Automated Test Generation - FunctionParser, TestCaseGenerator, TestRenderer, TestGeneration UI, FastAPI port 8018, 43+ tests`

---

## T5: AI-Powered Code Refactoring Suggestions

**Service:** `services/refactor-service/` — FastAPI port 8019

### Backend

- `SmellDetector` — detects 5 code smells: long_function (>30 lines), duplicate_code (3+ repeated lines), god_class (>5 methods), magic_numbers (bare numeric literals), deep_nesting (>3 levels indent)
- `RefactorAdvisor` — maps each smell to a concrete suggestion with rationale
- `RefactorReport` — summary of smells + suggestions sorted by severity
- Endpoints: `POST /analyze`, `GET /smells`, `GET /health`
- 20+ Python tests

### Desktop

- `shared/refactoring.ts` — CodeSmell, RefactorSuggestion, RefactorReport
- `renderer/store/refactorStore.ts` — smells[], suggestions[], isAnalyzing, code (8 tests)
- `renderer/hooks/useRefactor.ts` — analyzeCode, fetchSmells (8 tests)
- `renderer/components/refactor/` — SmellCard (severity badge, file/line ref), SuggestionPanel
- `renderer/screens/Refactor.tsx` — code input + smells list + suggestions (3-tab: Code/Smells/Suggestions) (7 tests)
- NavSection: `'refactor'`, Sidebar: Wand2 icon "Refactor"

**Commit:** `feat(v0.8.0-t5): Code Refactoring Suggestions - SmellDetector, RefactorAdvisor, SmellCard, Refactor UI, FastAPI port 8019, 43+ tests`

---

## Test Targets

| After Task | TypeScript Tests | Python Tests |
|-----------|-----------------|--------------|
| T1 | ~758 | ~301 |
| T2 | ~781 | ~321 |
| T3 | ~804 | ~341 |
| T4 | ~827 | ~361 |
| T5 | ~850 | ~381 |

---

## Implementation Order

T1 → T2 → T3 → T4 → T5 (sequential, each commits independently)

## Commit Pattern

`feat(v0.8.0-tN): <Feature Name> - <brief description>`

---

## Definition of Done per Task

- [ ] FastAPI service with ≥ 20 Python tests
- [ ] Shared TypeScript types
- [ ] Zustand store with ≥ 8 tests
- [ ] React hook with ≥ 8 tests (vi.stubGlobal fetch)
- [ ] Screen component with ≥ 7 tests
- [ ] NavSection + Sidebar + MainContent wired
- [ ] All icons aria-hidden
- [ ] All buttons cursor-pointer + focus-visible ring
- [ ] No hardcoded hex colors
- [ ] `npm test -- --run` shows ≥ expected count
- [ ] Clean git commit


