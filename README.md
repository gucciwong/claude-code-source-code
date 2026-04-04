# Sovereign Code

Sovereign Code is a local-first AI engineering platform focused on independent model operations, coding workflows, and enterprise integrations.

## Active Projects

- `apps/desktop`: Electron + React desktop application
- `apps/vscode-extension`: VS Code extension for completions and coding assistance
- `services/*`: backend services for training, orchestration, analytics, memory, voice, and integrations
- `scripts/*`: Week 1 runtime/benchmark/report automation for Sovereign delivery gates

## Quick Start

### Desktop App

```bash
cd apps/desktop
npm install
npm run dev
```

### VS Code Extension

```bash
cd apps/vscode-extension
npm install
npm test
```

### Sovereign Week 1 Validation

```bash
npm run test:sovereign
npm run sovereign:week1:run -- --date 2026-04-04 --tier 8GB --out-dir artifacts
```

## Repository Direction

This repository is engineered as a Sovereign-first codebase. Legacy reverse-engineered source layers are removed from active development and build workflows.
