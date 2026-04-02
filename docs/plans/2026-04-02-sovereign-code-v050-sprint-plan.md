# Sovereign Code v0.5.0 Sprint Development Plan
**Enterprise Data Integration + Live Intelligence**

| Field | Value |
|---|---|
| Version | v0.5.0 |
| Sprint Duration | 12 weeks |
| Target GA | September 30, 2026 |
| Author | Sovereign Code Team |
| Created | 2026-04-02 |
| Status | Active |
| Depends On | v0.4.0 (PKL complete) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Sprint Tasks](#3-sprint-tasks)
4. [File-Level Details](#4-file-level-details)
5. [API Specifications](#5-api-specifications)
6. [Test Plan](#6-test-plan)

---

## 1. Overview

### 1.1 Goal

Build the Enterprise Data Integration layer that lets Sovereign Code understand live business context from ERP, CRM, OMS, HRM and BI systems — all on-premise, read-only, IT-governed — plus Live Execution Trace Injection and a Temporal Decision Graph.

### 1.2 Core Capabilities

| Capability | Description |
|---|---|
| **Data Connectors** | Read-only connectors for PostgreSQL, REST API, SAP (mock), Salesforce (mock) |
| **PII Masking** | Presidio-based masking before any data enters context |
| **Audit Logging** | Immutable append-only audit log (SQLite with hash chaining) |
| **IT Admin Console** | Local web UI at `http://localhost:8080/admin` to manage connectors |
| **Live Execution Trace** | WASM/subprocess sandbox; runtime variable values injected into context |
| **Temporal Decision Graph** | Git-history causal graph queryable by natural language |

### 1.3 New Services

| Service | Port | Tech |
|---|---|---|
| `enterprise-data-service` | 8004 | FastAPI + Python |
| `it-admin-console` | 8080 | FastAPI static + React (embedded) |
| `execution-trace-service` | 8005 | FastAPI + subprocesses |

---

## 2. Architecture

```
IT Admin Console (port 8080)
    │
    ▼ approves/revokes connectors
Enterprise Data Service (port 8004)
    ├── ConnectorRegistry (PostgreSQL, REST, SAP, Salesforce)
    ├── PII Masker (Presidio)
    ├── Audit Logger (immutable SQLite)
    └── DataContextAssembler → JSON context block
    │
    ▼ injected into model prompt
Chat Store → Model Request
    + <knowledge_context> (PKL, v0.4)
    + <enterprise_context> (v0.5)
    + <trace_context> (v0.5)

Execution Trace Service (port 8005)
    ├── JS/TS runner (Node.js subprocess, sandboxed)
    ├── Python runner (restricted subprocess)
    └── TraceSerializer → annotated source comment

Temporal Decision Graph (TypeScript, main process)
    ├── GitHistoryParser
    ├── DecisionNodeExtractor
    ├── CausalEdgeInferrer
    └── GraphQueryEngine (NL → graph traversal)
```

---

## 3. Sprint Tasks

### Task 1 — Enterprise Data Connectors (Weeks 1-3)

**Goal:** Pluggable connector system with 4 built-in adapters and a shared interface.

**Files to create:**

```
services/enterprise-data-service/
  main.py                         -- FastAPI, port 8004
  enterprise_data/
    connector.py                  -- BaseConnector ABC
    connectors/
      postgres_connector.py       -- PostgreSQL via psycopg2
      rest_connector.py           -- Generic REST API
      sap_connector.py            -- SAP mock (HTTP)
      salesforce_connector.py     -- Salesforce mock (HTTP)
    registry.py                   -- ConnectorRegistry (load/save JSON)
    context_assembler.py          -- Builds enterprise_context block
  requirements.txt
  pyproject.toml
  .env.example
  tests/
    test_connectors.py            -- 20 tests
```

**Endpoints:**
- `POST /connectors` — register a connector definition
- `GET /connectors` — list all connectors
- `DELETE /connectors/{id}` — remove connector
- `POST /connectors/{id}/query` — execute a read-only query
- `GET /connectors/{id}/schema` — introspect tables/fields
- `POST /context` — assemble enterprise_context for current prompt
- `GET /health`

**TypeScript hook:**
```
apps/desktop/src/renderer/hooks/useEnterpriseData.ts   -- 10 tests
```

**Acceptance Criteria:**
- All 4 connector types register and execute queries
- Schema introspection returns table/field names
- Connector definitions persisted to `~/.sovereign-code/enterprise/connectors.json`
- 20 tests passing

---

### Task 2 — PII Masking + Immutable Audit Log (Weeks 3-5)

**Goal:** All data flowing through connectors is PII-masked. Every data access is logged immutably.

**Files to create:**

```
services/enterprise-data-service/enterprise_data/
  pii_masker.py                   -- Presidio-based PII detection + masking
  audit_logger.py                 -- Append-only SQLite, SHA-256 hash chaining

tests/
  test_pii.py                     -- 15 tests  
  test_audit.py                   -- 15 tests
```

**PII masker rules:**
- EMAIL_ADDRESS → `[EMAIL]`
- PHONE_NUMBER → `[PHONE]`
- PERSON → `[NAME]`
- CREDIT_CARD → `[CARD]`
- US_SSN → `[SSN]`
- IP_ADDRESS → `[IP]`

**Audit log schema (SQLite):**

```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  rows_returned INTEGER,
  pii_entities_masked INTEGER,
  prev_hash TEXT,
  row_hash TEXT NOT NULL  -- SHA-256(timestamp||user_id||connector_id||query_hash||prev_hash)
);
```

**TypeScript side:**
```
apps/desktop/src/renderer/store/enterpriseStore.ts     -- Zustand store
apps/desktop/src/renderer/store/enterpriseStore.test.ts -- 8 tests
```

**Acceptance Criteria:**
- All 6 PII categories masked before context injection
- Audit log tamper-detectable (hash chain breaks on edit)
- Audit log exportable as CSV
- 38 tests (15 PII + 15 audit + 8 store)

---

### Task 3 — IT Admin Console UI (Weeks 5-7)

**Goal:** Local web admin panel for managing connectors, viewing audit logs, and setting masking rules.

**Files to create (TypeScript / React, embedded into the desktop app):**

```
apps/desktop/src/renderer/screens/Enterprise.tsx        -- main screen
apps/desktop/src/renderer/components/enterprise/
  ConnectorCard.tsx              -- connector status card
  ConnectorForm.tsx              -- add/edit connector form (Radix Dialog)
  AuditLogTable.tsx              -- virtualized audit log table
  PIIMaskingRules.tsx            -- rule editor
  EnterpriseEmptyState.tsx       -- "No connectors registered" state
  index.ts                       -- barrel export

apps/desktop/src/renderer/screens/Enterprise.test.tsx   -- 12 tests
apps/desktop/src/renderer/components/enterprise/ConnectorCard.test.tsx -- 8 tests
```

**Sidebar update:** Add `Database` (Lucide) icon → 'enterprise' nav item.

**MainContent update:** Add `enterprise` case → `<Enterprise />`.

**navigationStore update:** Add `'enterprise'` to NavSection type.

**Acceptance Criteria:**
- Enterprise screen accessible from sidebar
- Can add/remove connectors via form
- Audit log table renders with pagination
- 20 tests passing

---

### Task 4 — Live Execution Trace Injection (Weeks 7-9)

**Goal:** Run code in a sandbox and inject the runtime trace into model context.

**Files to create:**

```
services/execution-trace-service/
  main.py                         -- FastAPI, port 8005
  execution_trace/
    js_runner.py                  -- Node.js subprocess runner
    python_runner.py              -- Python restricted subprocess runner
    trace_serializer.py           -- TraceEvent[] → annotated source comments
    sandbox.py                    -- ResourceLimits, timeout enforcement
  requirements.txt
  pyproject.toml
  .env.example
  tests/
    test_python_runner.py         -- 15 tests
    test_trace_serializer.py      -- 10 tests

apps/desktop/src/main/trace/
  TraceContextBuilder.ts          -- builds <trace_context> XML block
  TraceContextBuilder.test.ts     -- 10 tests

apps/desktop/src/renderer/hooks/useExecutionTrace.ts    -- hook
apps/desktop/src/renderer/hooks/useExecutionTrace.test.ts -- 8 tests
```

**Endpoints:**
- `POST /trace/python` — run Python snippet, return trace
- `POST /trace/js` — run JS snippet, return trace
- `GET /health`

**Trace format:**
```json
{
  "lines": [
    {"line": 3, "vars": {"x": 42, "y": "hello"}},
    {"line": 4, "call": "foo()", "duration_ms": 1.2}
  ],
  "error": null,
  "duration_ms": 48.3
}
```

**Acceptance Criteria:**
- Python/JS code runs in < 200ms (budget enforced)
- Trace serializes to annotated source comments
- Sandboxed: no filesystem/network access
- 43 tests (15 + 10 + 10 + 8)

---

### Task 5 — Temporal Decision Graph (Weeks 9-12)

**Goal:** Build a causal graph from git history + chat logs; query it with natural language.

**Files to create:**

```
apps/desktop/src/main/graph/
  GitHistoryParser.ts             -- parse git log to DecisionNode[]
  CausalEdgeInferrer.ts           -- infer edges from commit message + time proximity
  GraphStorage.ts                 -- SQLite adjacency list schema
  GraphQueryEngine.ts             -- NL query → subgraph traversal
  GitHistoryParser.test.ts        -- 15 tests
  GraphQueryEngine.test.ts        -- 10 tests

apps/desktop/src/renderer/screens/DecisionGraph.tsx    -- screen
apps/desktop/src/renderer/components/graph/
  DecisionTimeline.tsx            -- scrollable timeline of decision nodes
  DecisionNode.tsx                -- individual node card (type badge, rationale)
  GraphSearchBar.tsx              -- NL search input
  index.ts                        -- barrel export

apps/desktop/src/renderer/screens/DecisionGraph.test.tsx -- 12 tests
```

**Sidebar update:** Add `GitBranch` (Lucide) → 'decisiongraph' nav item.

**nodeType union:**
```typescript
type DecisionNodeType = 'ArchitectureDecision' | 'Refactor' | 'BugFix' | 'FeatureAdd' | 'DependencyChange'
```

**Acceptance Criteria:**
- Git log of current repo parsed into DecisionNode[]
- Timeline UI renders chronologically
- NL search returns matching nodes
- 37 tests (15 + 10 + 12)

---

## 4. File-Level Details

### 4.1 Shared TypeScript types

**`apps/desktop/src/shared/enterprise.ts`**
```typescript
export interface ConnectorConfig {
  id: string
  name: string
  type: 'postgres' | 'rest' | 'sap' | 'salesforce'
  connectionString?: string
  baseUrl?: string
  headers?: Record<string, string>
  allowedTables?: string[]
  enabled: boolean
  createdAt: number
}

export interface AuditEntry {
  id: number
  timestamp: string
  userId: string
  connectorId: string
  queryHash: string
  rowsReturned: number
  piiEntitiesMasked: number
  rowHash: string
}

export interface TraceEvent {
  line: number
  vars?: Record<string, unknown>
  call?: string
  duration_ms?: number
}

export interface DecisionNode {
  id: string
  type: 'ArchitectureDecision' | 'Refactor' | 'BugFix' | 'FeatureAdd' | 'DependencyChange'
  summary: string
  rationale: string
  timestamp: number
  commitHash: string
  author: string
  filesChanged: string[]
}
```

---

## 5. API Specifications

### Enterprise Data Service (port 8004)

```
POST /connectors
  body: ConnectorConfig (without id/createdAt)
  response: ConnectorConfig (with id)

GET /connectors
  response: ConnectorConfig[]

DELETE /connectors/{id}
  response: {"ok": true}

POST /connectors/{id}/query
  body: {"sql"?: string, "endpoint"?: string, "params"?: object}
  response: {"rows": [...], "masked_count": int, "duration_ms": float}

GET /connectors/{id}/schema
  response: {"tables": [{"name": str, "columns": [str]}]}

POST /context
  body: {"prompt": string, "connector_ids": string[]}
  response: {"enterprise_context": string}

GET /health
  response: {"status": "ok", "connectors_loaded": int}
```

### Execution Trace Service (port 8005)

```
POST /trace/python
  body: {"code": string, "timeout_ms"?: int}
  response: TraceResult

POST /trace/js
  body: {"code": string, "timeout_ms"?: int}
  response: TraceResult

GET /health
  response: {"status": "ok", "python_available": bool, "node_available": bool}
```

---

## 6. Test Plan

| Task | New Tests | Cumulative Total |
|---|---|---|
| Baseline (v0.4.0) | — | 408 |
| Task 1: Data Connectors | 30 (20 py + 10 ts) | 438 |
| Task 2: PII + Audit | 38 (30 py + 8 ts) | 476 |
| Task 3: Admin Console UI | 20 (ts) | 496 |
| Task 4: Execution Trace | 43 (25 py + 18 ts) | 539 |
| Task 5: Decision Graph | 37 (ts) | 576 |

**Target: 576 tests by v0.5.0 GA**

---

## Success Criteria

- [ ] All 4 connector types working with schema introspection
- [ ] PII masking covers 6 entity types, verified by tests
- [ ] Audit log tamper-proof (hash chain validated by tests)
- [ ] IT admin UI accessible on sidebar
- [ ] Python + JS trace injection working in < 200ms
- [ ] Decision graph parses git history of any repo
- [ ] 576 tests passing
