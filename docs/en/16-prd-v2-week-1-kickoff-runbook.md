# Sovereign Coder Week 1 Kickoff Runbook

> Window: Foundation Month 1, Week 1
> Status: Active
> Kickoff Date: 2026-04-01
> Owner: Maya Rossi (Product DRI)

## 1. Purpose

Start Week 1 execution with clear decision flow, owner accountability, and end-of-day evidence capture so all streams move from plan to delivery on day one.

## 2. Kickoff Agenda (60 Minutes)

1. Objective alignment (10 min)
   - Confirm Week 1 success criteria from execution board.
2. Ticket and owner confirmation (15 min)
   - Confirm DRI and backup for F1.1, F1.2, F2.1, F4.2, F4.1 prep.
3. Dependency and risk review (10 min)
   - Surface blockers that could delay Day 1 or Day 2 outputs.
4. Evidence and telemetry agreement (10 min)
   - Confirm what proof is required daily and where it is stored.
5. Commitments and checkpoint schedule (15 min)
   - Lock daily stand-up cadence and Friday checkpoint format.

## 3. Day 0 Decisions to Lock

1. Runtime baseline environment and model manifest source of truth.
2. CLI output contract version for human-readable and machine-readable modes.
3. Completion event schema version for suggest, accept, reject actions.
4. Repository path for evidence bundle and benchmark artifacts.
5. Escalation protocol for P0 and P1 blockers.

## 4. Role Commitments

| Role | Person | Commitment |
|---|---|---|
| Product DRI | Maya Rossi | Owns kickoff decisions, scope control, and release alignment |
| Platform Lead | Alex Chen | Delivers runtime bootstrap and compatibility guardrails |
| IDE Lead | Dana Park | Delivers completion UX and VSCode contract readiness |
| Product Eng Lead | Jordan Kim | Delivers CLI path and output contract stability |
| Data DRI | Sofia Patel | Validates telemetry schema and daily metric capture |
| Engineering Manager | Noah Bennett | Owns blocker triage and burn-down discipline |

## 5. Daily Evidence Standard

Each stream posts by end-of-day:
1. What was planned versus delivered.
2. One proof artifact (terminal output, screenshot, or trace).
3. Known blocker list with owner and ETA.
4. Next-day top priority.

## 6. Daily Stand-up Template (15 Minutes)

1. Yesterday: what shipped with evidence?
2. Today: top two deliverables.
3. Risks: what can block completion today?
4. Ask: what support is needed before end-of-day?

## 7. Kickoff Exit Criteria

1. All Week 1 tickets have confirmed DRI, backup, and due date.
2. Day 1 tasks are assigned and accepted by stream owners.
3. Telemetry and evidence standards are agreed and documented.
4. First checkpoint schedule is shared with all owners.

## 8. Escalation Path

1. Technical blocker under 4 hours: resolve in stream.
2. Blocker over 4 hours or cross-stream impact: escalate to Engineering Manager.
3. Scope or release risk: escalate to Product DRI for scope decision.
4. Repeated blocker pattern: add to risk register with mitigation owner.

## 9. Kickoff Sign-off

| Area | Sign-off Owner | Status |
|---|---|---|
| Scope and priorities | Maya Rossi | Approved |
| Runtime and platform setup | Alex Chen | Approved |
| IDE and completion plan | Dana Park | Approved |
| CLI contract and tooling | Jordan Kim | Approved |
| Telemetry and evidence protocol | Sofia Patel | Approved |
