# CLAUDE.md — Sovereign Coder Repository Rules

Coding-agent rules for this repository.

## Repository Scope

This repository is a Sovereign Coder monorepo.

- Desktop product code lives in `apps/desktop/`
- VS Code extension code lives in `apps/vscode-extension/`
- Backend services live in `services/`
- Delivery automation scripts live in `scripts/`

Legacy reverse-engineered source layers are removed from active workflows.

## Implementation Rules

- Prefer making changes in `apps/desktop/` and `apps/vscode-extension/` for product behavior.
- Keep services self-contained per folder in `services/`.
- Use TDD for feature and bug-fix work.
- Preserve local-first behavior for product features.
- Keep accessibility semantics in UI updates.

## Build and Test

- Desktop tests: `cd apps/desktop && npm test`
- Extension tests: `cd apps/vscode-extension && npm test`
- Sovereign script tests: `npm run test:sovereign`

## Docs

Update docs in `docs/` and top-level runbooks when behavior changes.
