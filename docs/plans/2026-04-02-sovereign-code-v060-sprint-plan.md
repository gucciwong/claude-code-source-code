> Plan Status: Closed on 2026-04-04. This file is a historical planning artifact; execution tracking is consolidated in docs/plans/2026-04-04-plan-closure-report.md.

# Sovereign Code v0.6.0 — Organization Intelligence Sprint Plan

**Version:** v0.6.0  
**Theme:** Organization Intelligence  
**Target Quarter:** Q4 2026 (Dec 31 deadline)  
**Branch:** main  
**Prior version:** v0.5.0 ✅ (501 TS + 95 Python tests)

---

## Overview

v0.6.0 advances Sovereign Code from personal productivity (v0.4) and enterprise connectivity (v0.5) into **organizational intelligence** — enabling teams to share knowledge patterns, analyze collective behavior, orchestrate multi-agent workflows, and surface actionable analytics — all while remaining fully local and privacy-preserving.

---

## Task List

### T1: Multi-Agent Orchestration Engine

**Goal:** Allow users to decompose complex tasks into parallel sub-agents with dependency tracking and a coordinator that merges results.

**Backend (`services/orchestration-service/`, FastAPI port 8006):**
- `TaskDecomposer` — split a high-level goal into atomic tasks via heuristic + LLM stub
- `DependencyGraph` — DAG of tasks; topological sort; cycle detection
- `AgentPool` — spawn/track concurrent agent instances (in-process threads)
- `ResultMerger` — assemble partial results into coherent output
- `OrchestratorSession` — stateful session with SSE progress stream
- FastAPI endpoints: `POST /sessions`, `GET /sessions/{id}`, `GET /sessions/{id}/stream` (SSE), `DELETE /sessions/{id}`
- 20+ pytest tests

**Desktop (`apps/desktop/src/`):**
- `renderer/store/orchestrationStore.ts` — sessions, tasks, dependencies, status
- `renderer/hooks/useOrchestration.ts` — API client + SSE subscription
- `renderer/screens/Orchestration.tsx` — task graph visualization + live progress
- `renderer/components/orchestration/` — TaskNode, DependencyEdge, ProgressFeed, AgentCard
- `shared/orchestration.ts` — OrchestratorSession, TaskSpec, TaskResult, AgentStatus
- Navigation: add 'orchestration' to NavSection, Sidebar (`Workflow` icon, size 18), MainContent
- 20+ Vitest tests

**Commit:** `feat(v0.6.0-t1): Multi-Agent Orchestration Engine - TaskDecomposer, DependencyGraph, AgentPool, Orchestration UI, FastAPI port 8006, 40+ tests`

---

### T2: Team Knowledge Sharing + Pattern Discovery

**Goal:** Enable multiple team members to contribute anonymized code patterns, share snippets across the org, and surface cross-team bottlenecks/skill gaps — entirely local.

**Backend (`services/org-intelligence-service/`, FastAPI port 8007):**
- `AnonymizationEngine` — strip PII, author info, project-specific identifiers from patterns
- `PatternAggregator` — merge similar patterns from multiple contributors using TF-IDF cosine similarity
- `SkillGapAnalyzer` — track pattern usage frequency vs. known best-practices checklist; produce gap report
- `BottleneckDetector` — identify files/modules referenced by many low-quality patterns
- FastAPI endpoints: `POST /patterns/contribute`, `GET /patterns/shared`, `POST /patterns/search`, `GET /analytics/skill-gaps`, `GET /analytics/bottlenecks`
- 20+ pytest tests

**Desktop (`apps/desktop/src/`):**
- `renderer/store/orgIntelligenceStore.ts` — sharedPatterns, skillGaps, bottlenecks
- `renderer/hooks/useOrgIntelligence.ts` — API client
- `renderer/screens/OrgIntelligence.tsx` — 3-tab screen: Shared Patterns / Skill Gaps / Bottlenecks
- `renderer/components/org/` — PatternCard, SkillGapChart, BottleneckList, ContributePatternDialog
- `shared/orgIntelligence.ts` — SharedPattern, SkillGap, Bottleneck, ContributeRequest
- Navigation: add 'orgintelligence' to NavSection, Sidebar (`Users` icon, size 18), MainContent
- 20+ Vitest tests

**Commit:** `feat(v0.6.0-t2): Team Knowledge Sharing + Pattern Discovery - AnonymizationEngine, PatternAggregator, SkillGapAnalyzer, OrgIntelligence UI, FastAPI port 8007, 40+ tests`

---

### T3: Adversarial Persona Council

**Goal:** For any proposed code change or design decision, run a panel of 4 adversarial AI reviewers (Security Auditor, Performance Engineer, Maintainability Critic, Correctness Verifier), each generating targeted critiques — helping developers stress-test their ideas before committing.

**Backend (`services/persona-council-service/`, FastAPI port 8008):**
- `PersonaDefinition` — base class with name, expertise, review_prompt, severity scoring
- `SecurityAuditor` — OWASP Top 10 checks, injection patterns, auth issues
- `PerformanceEngineer` — algorithmic complexity, memory/IO hotspots, N+1 patterns
- `MaintainabilityCritic` — naming, cohesion, tech-debt indicators, duplication
- `CorrectnessVerifier` — edge cases, null safety, type mismatches, invariant violations
- `CouncilOrchestrator` — run all 4 personas in parallel; merge critique report; compute consensus risk score
- FastAPI endpoints: `POST /review`, `GET /personas`, `GET /review/{session_id}`
- 20+ pytest tests

**Desktop (`apps/desktop/src/`):**
- `renderer/store/personaCouncilStore.ts` — reviews, personas, activeSession
- `renderer/hooks/usePersonaCouncil.ts` — API client
- `renderer/screens/PersonaCouncil.tsx` — code input panel + 4-column critique display
- `renderer/components/council/` — PersonaCard, CritiqueList, RiskScoreBadge, ConsensusPanel
- `shared/personaCouncil.ts` — PersonaReview, CritiqueItem, CouncilReport, RiskScore
- Navigation: add 'personacouncil' to NavSection, Sidebar (`Shield` icon, size 18), MainContent
- 20+ Vitest tests

**Commit:** `feat(v0.6.0-t3): Adversarial Persona Council - 4 reviewer personas, CouncilOrchestrator, PersonaCouncil UI, FastAPI port 8008, 40+ tests`

---

### T4: Advanced Analytics Dashboard

**Goal:** Provide a rich, local analytics screen that tracks coding productivity, knowledge quality trends, model usage stats, training ROI, and org health — all computed from local telemetry stored in SQLite.

**Backend (`services/analytics-service/`, FastAPI port 8009):**
- `MetricsCollector` — ingest events from other services (connector queries, traces executed, patterns saved, training runs)
- `QualityTrendAnalyzer` — track PKL pattern quality scores over time; moving average
- `ProductivityMetrics` — tokens/session, acceptance rate, task completion velocity
- `TrainingROICalculator` — time-to-suggestion improvement before/after training epochs
- `ReportExporter` — CSV + JSON export of all metrics; date-range filtering
- FastAPI endpoints: `POST /events`, `GET /metrics/productivity`, `GET /metrics/quality-trends`, `GET /metrics/training-roi`, `GET /reports/export`
- 20+ pytest tests

**Desktop (`apps/desktop/src/`):**
- `renderer/store/analyticsStore.ts` — productivityMetrics, qualityTrends, trainingROI
- `renderer/hooks/useAnalytics.ts` — API client
- `renderer/screens/Analytics.tsx` — 4-tab screen: Productivity / Quality Trends / Training ROI / Export
- `renderer/components/analytics/` — MetricCard, TrendChart (SVG sparkline), ROITable, ExportPanel
- `shared/analytics.ts` — MetricEvent, ProductivityMetrics, QualityTrend, TrainingROI, AnalyticsReport
- Navigation: add 'analytics' to NavSection, Sidebar (`BarChart2` icon, size 18), MainContent
- 20+ Vitest tests

**Commit:** `feat(v0.6.0-t4): Advanced Analytics Dashboard - MetricsCollector, QualityTrendAnalyzer, ROI calculator, Analytics UI, FastAPI port 8009, 40+ tests`

---

## Execution Strategy

Each task follows the **subagent-driven-development** pattern:

1. Fresh subagent receives the full task spec from this document
2. Subagent writes failing tests first (TDD), then implements
3. Subagent runs `npm test` + `pytest` and confirms all pass
4. Subagent commits with the specified commit message
5. Main agent verifies `git log` and test counts before proceeding to next task

**After all 4 tasks:** Update PRD to mark v0.6.0 complete, increment test count in feature table.

---

## Test Targets

| Task | Python Tests | TypeScript Tests | Min Total |
|------|-------------|-----------------|-----------|
| T1 Multi-Agent Orchestration | 20 | 20 | 40 |
| T2 Team Knowledge + Patterns | 20 | 20 | 40 |
| T3 Adversarial Persona Council | 20 | 20 | 40 |
| T4 Advanced Analytics | 20 | 20 | 40 |
| **Cumulative target** | **~175 Python** | **~661 TypeScript** | **~836** |

---

## Service Port Map (after v0.6.0)

| Port | Service |
|------|---------|
| 8001 | training-service |
| 8002 | model-manager-service |
| 8003 | knowledge-service |
| 8004 | enterprise-data-service |
| 8005 | execution-trace-service |
| 8006 | orchestration-service (NEW) |
| 8007 | org-intelligence-service (NEW) |
| 8008 | persona-council-service (NEW) |
| 8009 | analytics-service (NEW) |

---

## Navigation Sections (after v0.6.0)

```typescript
type NavSection = 
  | 'dashboard' | 'models' | 'chat' | 'training' | 'federation' 
  | 'knowledge' | 'settings' | 'enterprise' | 'decisiongraph'
  | 'orchestration'    // T1
  | 'orgintelligence'  // T2
  | 'personacouncil'   // T3
  | 'analytics'        // T4
```


