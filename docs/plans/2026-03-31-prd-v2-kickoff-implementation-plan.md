# PRD v2 Kickoff Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert PRD v2 into an execution-ready delivery stream with owners, milestones, acceptance checks, and immediate Sprint 1 tasks.

**Architecture:** Start with documentation and governance artifacts first, then wire execution tracking, then implement P0 capabilities in thin vertical slices. Each slice must ship with observable metrics and rollback conditions. This plan assumes no existing test harness in this research repo, so verification uses static checks and artifact consistency checks.

**Tech Stack:** Markdown docs, Node.js scripts, TypeScript static checking via tsc, npm scripts.

---

### Task 1: Create Execution Tracker Document

**Files:**
- Create: docs/en/07-prd-v2-execution-tracker.md
- Modify: README.md
- Test: docs/en/07-prd-v2-execution-tracker.md

**Step 1: Write the failing test**

Check that execution tracker file does not exist yet.

Run: dir docs\en\07-prd-v2-execution-tracker.md
Expected: file not found.

**Step 2: Run test to verify it fails**

Run: rg "PRD v2 Execution Tracker" docs/en/07-prd-v2-execution-tracker.md
Expected: no match because file does not exist.

**Step 3: Write minimal implementation**

Create tracker with:
1. P0 streams and owners
2. Milestones by phase
3. Risk register
4. Weekly review checklist

**Step 4: Run test to verify it passes**

Run: rg "PRD v2 Execution Tracker|P0 Streams|Weekly Review" docs/en/07-prd-v2-execution-tracker.md
Expected: matches found.

**Step 5: Commit**

Run:

git add docs/en/07-prd-v2-execution-tracker.md README.md
git commit -m "docs: add PRD v2 execution tracker"

### Task 2: Create Epic and Ticket Breakdown

**Files:**
- Create: docs/en/08-prd-v2-epics-and-tickets.md
- Test: docs/en/08-prd-v2-epics-and-tickets.md

**Step 1: Write the failing test**

Confirm file does not exist.

Run: dir docs\en\08-prd-v2-epics-and-tickets.md
Expected: file not found.

**Step 2: Run test to verify it fails**

Run: rg "Epic P0|Ticket" docs/en/08-prd-v2-epics-and-tickets.md
Expected: no match because file does not exist.

**Step 3: Write minimal implementation**

Create epics and tickets for:
1. Telemetry controls
2. Remote change ledger
3. Attribution modes
4. Feature-flag lifecycle
5. Capability readiness framework

For each ticket include:
1. Problem
2. Scope
3. Acceptance criteria
4. Dependencies
5. Estimated effort

**Step 4: Run test to verify it passes**

Run: rg "Epic P0|Acceptance Criteria|Dependencies|Estimated Effort" docs/en/08-prd-v2-epics-and-tickets.md
Expected: matches found.

**Step 5: Commit**

Run:

git add docs/en/08-prd-v2-epics-and-tickets.md
git commit -m "docs: add PRD v2 epics and tickets"

### Task 3: Add KPI Instrumentation Spec

**Files:**
- Create: docs/en/09-prd-v2-kpi-instrumentation-spec.md
- Test: docs/en/09-prd-v2-kpi-instrumentation-spec.md

**Step 1: Write the failing test**

Run: dir docs\en\09-prd-v2-kpi-instrumentation-spec.md
Expected: file not found.

**Step 2: Run test to verify it fails**

Run: rg "North-star|Guardrail|Event Schema" docs/en/09-prd-v2-kpi-instrumentation-spec.md
Expected: no match because file does not exist.

**Step 3: Write minimal implementation**

Create KPI spec with:
1. Metric definitions
2. Event schema fields
3. Data quality checks
4. Reporting cadence
5. Threshold-based alerts

**Step 4: Run test to verify it passes**

Run: rg "North-star|Guardrail|Event Schema|Reporting Cadence|Alert Threshold" docs/en/09-prd-v2-kpi-instrumentation-spec.md
Expected: matches found.

**Step 5: Commit**

Run:

git add docs/en/09-prd-v2-kpi-instrumentation-spec.md
git commit -m "docs: add PRD v2 KPI instrumentation spec"

### Task 4: Define Sprint 1 Deliverables

**Files:**
- Create: docs/en/10-prd-v2-sprint-1-deliverables.md
- Test: docs/en/10-prd-v2-sprint-1-deliverables.md

**Step 1: Write the failing test**

Run: dir docs\en\10-prd-v2-sprint-1-deliverables.md
Expected: file not found.

**Step 2: Run test to verify it fails**

Run: rg "Sprint 1|Definition of Done|Demo Checklist" docs/en/10-prd-v2-sprint-1-deliverables.md
Expected: no match because file does not exist.

**Step 3: Write minimal implementation**

Define Sprint 1 with:
1. Deliverables
2. Owners
3. Week-by-week goals
4. Demo checklist
5. Exit criteria

**Step 4: Run test to verify it passes**

Run: rg "Sprint 1|Definition of Done|Demo Checklist|Exit Criteria" docs/en/10-prd-v2-sprint-1-deliverables.md
Expected: matches found.

**Step 5: Commit**

Run:

git add docs/en/10-prd-v2-sprint-1-deliverables.md
git commit -m "docs: add PRD v2 sprint 1 deliverables"

### Task 5: Verify Documentation Cohesion

**Files:**
- Modify: README.md
- Test: README.md

**Step 1: Write the failing test**

Run: rg "06-prd-v2-improvements-and-innovation|07-prd-v2-execution-tracker|08-prd-v2-epics-and-tickets|09-prd-v2-kpi-instrumentation-spec|10-prd-v2-sprint-1-deliverables" README.md
Expected: at least one missing entry.

**Step 2: Run test to verify it fails**

Run: rg "07-prd-v2-execution-tracker|08-prd-v2-epics-and-tickets|09-prd-v2-kpi-instrumentation-spec|10-prd-v2-sprint-1-deliverables" README.md
Expected: no match or partial match.

**Step 3: Write minimal implementation**

Add docs links to README docs tree index.

**Step 4: Run test to verify it passes**

Run: rg "07-prd-v2-execution-tracker|08-prd-v2-epics-and-tickets|09-prd-v2-kpi-instrumentation-spec|10-prd-v2-sprint-1-deliverables" README.md
Expected: all entries present.

**Step 5: Commit**

Run:

git add README.md
git commit -m "docs: index PRD v2 execution documents"

### Task 6: Repository-Level Verification

**Files:**
- Test: package.json
- Test: tsconfig.json
- Test: docs/en/*.md

**Step 1: Write the failing test**

Run TypeScript check before docs commits are finalized to ensure no incidental breakages in the repo state.

Run: npm run check
Expected: pass, or known existing errors documented.

**Step 2: Run test to verify it fails**

If there are errors, capture and classify whether pre-existing or introduced.

Run: npm run check
Expected: repeatable output.

**Step 3: Write minimal implementation**

If new errors were introduced by this plan execution, fix them in-place. If none, no code changes required.

**Step 4: Run test to verify it passes**

Run: npm run check
Expected: no new errors attributable to this plan.

**Step 5: Commit**

Run:

git add -A
git commit -m "chore: verify PRD v2 kickoff artifacts"

## Execution Notes

1. Keep commits small and one logical change per commit.
2. Prefer consistency with existing docs style and numbering.
3. Do not create implementation code for runtime behavior in this kickoff stream.
4. Focus this kickoff on execution readiness and alignment artifacts.

## Immediate Next Actions (Today)

1. Execute Task 1 and Task 2 in the same session.
2. Share tracker and epics docs for stakeholder review.
3. Lock Sprint 1 owners and timeline.
4. Start Task 3 after metrics owner confirmation.
