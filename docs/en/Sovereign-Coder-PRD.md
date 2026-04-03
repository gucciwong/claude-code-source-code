# Sovereign Code - Product Requirements Document

**Version:** 2.0  
**Date:** 2026-04-02  
**Status:** Active Development  
**Author:** Sovereign AI Labs  
**Previous Version:** 1.0 (2026-03-31)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Mission](#2-product-vision--mission)
3. [Target Market](#3-target-market)
4. [Core Features](#4-core-features)
5. [Architecture Overview](#5-architecture-overview)
6. [Technical Specifications](#6-technical-specifications)
7. [Self-Improvement System](#7-self-improvement-system)
8. [Federated Learning Framework](#8-federated-learning-framework)
9. [Personal Knowledge Library System](#9-personal-knowledge-library-system)
10. [Enterprise Data Integration](#10-enterprise-data-integration)
11. [Product Roadmap](#11-product-roadmap)
12. [Success Metrics](#12-success-metrics)
13. [Risk Analysis](#13-risk-analysis)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### 1.1 What is Sovereign Code?

**Sovereign Code** (formerly Sovereign Coder) is an enterprise AI coding platform that runs 100% locally. It has evolved from a personal coding tool into an organization-wide knowledge management system where every staff member — not just developers — can:

1. **Build tools quickly** — Use AI assistance to rapidly create scripts, automations, and internal tools to solve daily problems
2. **Build a personal knowledge library** — AI learns from how you work and builds a searchable memory of your domain expertise; the more you use it, the smarter it gets about *your* patterns
3. **Integrate enterprise data** — With IT approval, connect ERP, CRM, OMS, HRM, and BI systems so AI understands live business context when helping you build and automate

Unlike cloud-based alternatives (GitHub Copilot, Cursor), Sovereign Code ensures:

- **Zero data leakage** — Code and business data never leave your machine or private infrastructure
- **Full model ownership** — Train, customize, and own your AI model as a company asset
- **Privacy-first architecture** — Suitable for regulated industries (finance, healthcare, defense)
- **Self-improving capability** — The tool trains itself on your codebase and usage over time
- **Enterprise-grade knowledge** — Personal libraries feed organizational intelligence
- **Accessible globally** — China mirror support (hf-mirror.com) for users behind access restrictions

### 1.2 The Problem

| Pain Point | Current Solutions | Sovereign Code Solution |
|------------|-------------------|-------------------------|
| Data privacy concerns | Cloud AI tools with data policies | 100% local, no data transmission |
| Generic models | One-size-fits-all AI | Industry-specific fine-tuned models |
| No IP ownership | Third-party owns your data insights | Your model, your IP, your asset |
| Isolated knowledge | Each developer starts from zero | Personal libraries feed the model |
| Collaboration barriers | Share code to share knowledge | Federated learning — share insights, not code |
| Capability ceiling | Limited by provider's model | Continuously improving via self-training |
| No business context | AI doesn't know your ERP/CRM data | Enterprise data integration (IT-approved) |
| Access from China | Slow/blocked Huggingface downloads | Built-in hf-mirror.com support |

### 1.3 Key Differentiators

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   SOVEREIGN CODE vs COMPETITORS                                         │
│                                                                          │
│   ┌──────────────────┬──────────────┬──────────────┬──────────────────┐ │
│   │    Feature       │ GitHub       │   Cursor     │ Sovereign Code   │ │
│   │                  │   Copilot    │   /Windsurf  │                  │ │
│   ├──────────────────┼──────────────┼──────────────┼──────────────────┤ │
│   │ Local Running    │      ✗       │      △       │        ✓        │ │
│   │ Data Privacy     │      ✗       │      △       │        ✓        │ │
│   │ Model Ownership  │      ✗       │      ✗       │        ✓        │ │
│   │ Customizable     │      ✗       │      ✗       │        ✓        │ │
│   │ Self-trainable   │      ✗       │      ✗       │        ✓        │ │
│   │ Personal Library │      ✗       │      ✗       │        ✓        │ │
│   │ Enterprise Data  │      ✗       │      ✗       │        ✓        │ │
│   │ Federated Learn  │      ✗       │      ✗       │        ✓        │ │
│   │ Offline Capable  │      ✗       │      △       │        ✓        │ │
│   │ China Support    │      △       │      ✗       │        ✓        │ │
│   └──────────────────┴──────────────┴──────────────┴──────────────────┘ │
│                                                                          │
│   Legend: ✓ Full Support   △ Partial/Cloud-dependent   ✗ Not Supported  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Current Status (v0.7.x — April 2026)

Sovereign Code has completed core platform milestones from v0.1 through v0.7, with v1.0 now the primary forward target.

The desktop application and service ecosystem are production-oriented with broad feature coverage across local inference, training, voice, knowledge, enterprise integration, federated learning, and advanced developer tooling.

| Component | Status | Notes |
|-----------|--------|-------|
| Electron desktop app | ✅ Built | React 18 + Tailwind v4, 314 tests passing |
| Local model inference | ✅ Built | Huggingface integration, GGUF support |
| Model manager service | ✅ Built | FastAPI on port 8002 |
| Training service | ✅ Built | FastAPI on port 8001, QLoRA pipeline |
| Voice I/O (VibeVoice) | ✅ Built | Whisper ASR + Google TTS |
| China mirror support | ✅ Built | hf-mirror.com toggle in Settings |
| Windows EXE packaging | ✅ Built | electron-builder, 70MB installer |
| Personal Knowledge Library | ✅ Built | PKL system, knowledge-service, 408 tests |
| Enterprise Data Integration | ✅ Built | FastAPI port 8004, 4 connectors, PII masking, audit log, 501 tests |
| Live Execution Trace Injection | ✅ Built | Python/JS sandbox runners, TraceSerializer, FastAPI port 8005 |
| Temporal Decision Graph | ✅ Built | GitHistoryParser, GraphQueryEngine, DecisionTimeline UI |

---

## 2. Product Vision & Mission

### 2.1 Vision Statement

> **"Every person in an organization deserves an AI assistant that respects their privacy, grows with their domain expertise, and ultimately integrates with the systems they work in every day — without ever sending their data to a cloud."**

### 2.2 Mission Statement

- Empower every staff member — not just developers — to build tools and automations with AI assistance
- Create personal knowledge libraries that capture each person's domain expertise and grow over time
- Enable secure, IT-governed integration with enterprise systems (ERP, CRM, OMS, HRM, BI)
- Eliminate the tradeoff between AI capability and data privacy
- Build an ecosystem where organizational knowledge compounds without exposing proprietary data

### 2.3 Core Values

1. **Privacy by Design** — Zero data transmission, zero telemetry, zero compromise
2. **Ownership Economy** — Your code, your model, your intellectual property, your knowledge
3. **Continuous Evolution** — Every interaction makes the tool smarter and more personalized
4. **Collaborative Intelligence** — Learn from the collective without exposing secrets
5. **Universal Access** — Works in all regions including China (mirror support); no cloud dependency

---

## 3. Target Market

### 3.1 Primary Segments

#### Enterprise Segment

| Segment | Characteristics | Use Case |
|---------|-----------------|----------|
| **Financial Services** | High security, regulatory compliance (SOC2, PCI-DSS) | Trading algorithms, risk models, compliance code |
| **Healthcare** | HIPAA compliance, patient data protection | Medical software, EHR systems, diagnostic tools |
| **Defense/Government** | Classified data, air-gapped environments | Secure systems, embedded software |
| **Legal/Compliance** | Attorney-client privilege, NDA-sensitive | Contract automation, document processing |

#### Developer Segment

| Segment | Characteristics | Use Case |
|---------|-----------------|----------|
| **Independent Developers** | Privacy-conscious, cost-sensitive | Personal projects, open source |
| **Small Teams** | Limited budget, need collaboration | Startup MVPs, agency work |
| **Enterprise Developers** | Large codebases, domain expertise | Internal tools, legacy modernization |

### 3.2 Market Size

```
Addressable Market Analysis (2026)

┌────────────────────────────────────────────────────────────┐
│                                                            │
│   Total AI Coding Tools Market     │     $12.8B (TAM)     │
│                                    │                      │
│   Privacy-Focused Segment          │     $3.2B (SAM)      │
│   (Local + Enterprise Privacy)    │                      │
│                                    │                      │
│   Sovereign Coder Target           │     $800M (SOM)      │
│   (Year 3 projection)             │                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Core Features

### 4.1 Feature Priority Matrix

| Priority | Feature | Description | Complexity | Version |
|----------|---------|-------------|------------|---------|
| P0 | Local LLM Inference | Run 10B-70B models on consumer GPU | High | v0.1 ✅ |
| P0 | Code Completion | Inline suggestions and multi-line completions | Medium | v0.1 ✅ |
| P0 | Context Awareness | Project-level understanding via RAG | High | v0.2 ✅ |
| P0 | Model Management | Download, switch, quantize models via HuggingFace | Medium | v0.2 ✅ |
| P0 | China Mirror Support | hf-mirror.com toggle for China users | Low | v0.3 ✅ |
| P1 | Agent Mode | Autonomous task execution | Very High | v0.3 ✅ |
| P1 | Local Training | QLoRA fine-tuning on user data | Very High | v0.3 ✅ |
| P1 | Voice I/O (VibeVoice) | Hands-free coding via Whisper ASR + TTS | High | v0.3 ✅ |
| P1 | Personal Knowledge Library | Auto-capture domain expertise; personal memory | High | v0.4 ✅ |
| P1 | Enterprise Data Integration | Connect ERP/CRM/OMS/HRM/BI with IT approval | Very High | v0.5 ✅ |
| P2 | Organization Intelligence | Team patterns, analytics, skill gap detection | High | v0.6 ✅ |
| P2 | Semantic Code Search | TF-IDF code search, IndexManager, SearchEngine | High | v0.7 ✅ |
| P2 | Plugin Extension System | PluginRegistry, HookDispatcher, 5 lifecycle hooks | High | v0.7 ✅ |
| P2 | Automated PR Review Agent | GitDiffParser, RuleEngine, CommentGenerator | High | v0.7 ✅ |
| P2 | Local Model Fine-tuning UI | FinetuneJobManager, LossCurve, LoRA config | Medium | v0.7 ✅ |
| P2 | Federated Learning Core | FedAvgAggregator, DifferentialPrivacy (DP-SGD) | Very High | v0.7 ✅ |
| P3 | Plugin Ecosystem | Third-party extensions marketplace | Medium | v1.0 |
| P2 | Live Execution Trace Injection | Feed real runtime traces into model context | High | v0.5 ✅ |
| P2 | Temporal Decision Graph | Queryable causal history of why codebase evolved | High | v0.5 ✅ |
| P3 | Adversarial Persona Council | Parallel specialized LoRA adapters for quality tradeoffs | Very High | v0.6 ✅ |
| P2 | IM Remote Control Bridge | Monitor/control via Telegram/Slack/Discord/8 platforms | High | v0.6 ✅ |
| P2 | Advanced Analytics Dashboard | Productivity metrics, quality trends, training ROI | High | v0.6 ✅ |

### 4.2 Detailed Feature Specifications

#### 4.2.1 Local LLM Inference Engine

**Description:** 
A unified inference layer that supports multiple backend engines (Ollama, vLLM, llama.cpp) and model formats (GGUF, ExLlamaV2).

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  INFERENCE ENGINE SPECIFICATIONS                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Supported Model Formats:                                        │
│  • GGUF (llama.cpp) - Primary recommendation                    │
│  • ExLlamaV2 - For larger models with better speed               │
│  • GPTQ/AWQ - Quantized formats for efficiency                   │
│                                                                   │
│  Minimum Hardware Requirements:                                  │
│  • 6GB VRAM  → Qwen2.5-Coder-7B (Q4_K_M)                        │
│  • 8GB VRAM  → StarCoder2-15B (Q4_K_M)                          │
│  • 12GB VRAM → Phi-4-Coder-14B (Q4_K_M)                         │
│  • 16GB VRAM → Qwen2.5-Coder-32B (Q4_K_M)                      │
│  • 24GB VRAM → DeepSeek-Coder-33B (Q4_K_M)                      │
│                                                                   │
│  Performance Targets:                                            │
│  • First token latency: < 500ms for 7B models                   │
│  • Streaming output: 30+ tokens/second                           │
│  • Context window: Up to 128K tokens                            │
│                                                                   │
│  API Compliance:                                                 │
│  • OpenAI Chat Completions API compatible                       │
│  • Anthropic Messages API compatible                             │
│  • Local inference fallback on network failure                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Code Completion Engine

**Description:**
Context-aware code completion supporting single-line, multi-line, and whole-function generation.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  CODE COMPLETION SPECIFICATIONS                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Completion Types:                                                │
│  • Inline suggestions (single line)                             │
│  • Multi-line block completion                                   │
│  • Whole function/method generation                              │
│  • Test case generation                                         │
│  • Documentation comment generation                              │
│                                                                   │
│  Context Sources:                                                 │
│  • Current file syntax and semantics                             │
│  • Open files in IDE workspace                                   │
│  • Project structure and dependencies                            │
│  • Related files (imports, tests, interfaces)                   │
│  • Git history for similar patterns                              │
│                                                                   │
│  Interaction Modes:                                               │
│  • Tab-to-accept (like Copilot)                                  │
│  • Ghost text preview                                            │
│  • Completion menu with ranking scores                           │
│  • Keyboard shortcuts for different completion types             │
│                                                                   │
│  Quality Metrics:                                                 │
│  • HumanEval pass@1: > 70% for base models                       │
│  • Fine-tuned target: > 85% pass@1                              │
│  • Acceptance rate: > 40% of suggestions accepted               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 Agent Mode (Autonomous Task Execution)

**Description:**
Sovereign Coder agent-like agent capable of autonomously reading, writing, and modifying code across entire projects.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  AGENT MODE SPECIFICATIONS                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Core Capabilities:                                               │
│  • Read and understand entire codebases                          │
│  • Execute terminal commands (sandboxed)                         │
│  • Read/write files with full project awareness                  │
│  • Run tests and analyze results                                 │
│  • Git operations (diff, commit, branch)                         │
│  • Search and replace across files                              │
│                                                                   │
│  Task Types:                                                     │
│  • Bug fixes with reproduction steps                            │
│  • Feature implementation from specifications                     │
│  • Code refactoring and optimization                             │
│  • Test coverage improvement                                     │
│  • Documentation generation                                      │
│  • Migration assistance (frameworks, languages)                  │
│                                                                   │
│  Safety Features:                                                │
│  • Confirmation prompts for destructive actions                 │
│  • Diff preview before file modifications                        │
│  • Dry-run mode for validation                                   │
│  • Human-in-the-loop checkpoints for critical changes            │
│  • Action history with undo capability                           │
│                                                                   │
│  Evaluation:                                                      │
│  • SWE-bench Lite: > 50% resolution rate                         │
│  • SWE-bench Full: > 30% resolution rate                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.4 Project Context & RAG System

**Description:**
Retrieve relevant context from the entire codebase using embeddings-based retrieval.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  CONTEXT & RAG SPECIFICATIONS                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Indexing:                                                        │
│  • Automatic indexing on project open                            │
│  • Incremental updates on file changes                           │
│  • Language-aware chunking (functions, classes, modules)          │
│  • Support for 20+ programming languages                          │
│  • Max repository size: 1M lines (configurable)                 │
│                                                                   │
│  Retrieval:                                                       │
│  • Semantic search with embeddings (e5-small-v2 or similar)      │
│  • Keyword search fallback                                       │
│  • Hybrid retrieval (semantic + keyword)                         │
│  • Query expansion using LLM                                     │
│  • Max context tokens: 32K (configurable)                        │
│                                                                   │
│  Storage:                                                         │
│  • Local SQLite database for embeddings                          │
│  • Encrypted at rest                                              │
│  • Portable (can be copied with project)                         │
│  • Index sharing options (exclude sensitive files)               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.5 Local Training System (QLoRA)

**Description:**
On-device model fine-tuning using parameter-efficient techniques.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  TRAINING SYSTEM SPECIFICATIONS                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Training Method:                                                 │
│  • QLoRA (Quantized Low-Rank Adaptation)                         │
│  • 4-bit NF4 quantization for base model                         │
│  • LoRA rank: 16/32/64 (configurable)                            │
│  • Target modules: q_proj, k_proj, v_proj, o_proj                │
│                                                                   │
│  Training Pipeline:                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │  Data    │ → │  Prepare │ → │  Train   │ → │  Merge   │     │
│  │ Collection│   │  & Format│   │ (QLoRA) │   │ & Export │     │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│                                                                   │
│  Data Collection:                                                 │
│  • Code completion pairs (prompt → accepted completion)           │
│  • Agent task trajectories (task → steps → result)                │
│  • Code review decisions (code → feedback → improvement)          │
│  • Execution feedback (code → test results → corrections)         │
│                                                                   │
│  Training Schedule:                                               │
│  • "10-Minute Loop": Quick training iteration every 10 min       │
│  • Background training mode (low priority, uses idle GPU)        │
│  • Scheduled full training cycles (overnight, weekends)           │
│                                                                   │
│  Hardware Requirements:                                          │
│  • Minimum: 8GB VRAM (RTX 3060) for 7B models                    │
│  • Recommended: 16GB VRAM (RTX 4090) for 32B models              │
│  • Training speed: ~1 epoch/hour on 7B model                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.6 Self-Improvement System

**Description:**
Automated model enhancement through continuous feedback loops.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  SELF-IMPROVEMENT SYSTEM SPECIFICATIONS                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Cycle Architecture:                                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                           │    │
│  │   ┌─────────┐     ┌─────────┐     ┌─────────┐            │    │
│  │   │ Develop │ →   │ Collect │ →   │  Train  │            │    │
│  │   │  Tasks  │     │  Data   │     │  Model  │            │    │
│  │   └────┬────┘     └────┬────┘     └────┬────┘            │    │
│  │        │               │               │                   │    │
│  │        │   ┌───────────┘               │                   │    │
│  │        │   │                           │                   │    │
│  │        │   │   ┌───────────────────────┘                   │    │
│  │        │   │   │                                           │    │
│  │        ↓   ↓   ↓                                           │    │
│  │   ┌─────────────────────────────────────────────────────┐ │    │
│  │   │              8-HOUR UPGRADE CYCLE                    │ │    │
│  │   │   After 48 iterations: New model version generated   │ │    │
│  │   └─────────────────────────────────────────────────────┘ │    │
│  │                          │                                 │    │
│  │                          ↓                                 │    │
│  │   ┌─────────────────────────────────────────────────────┐ │    │
│  │   │              REBUILD WITH NEW MODEL                  │ │    │
│  │   │     Use upgraded model to refactor/improve itself    │ │    │
│  │   └─────────────────────────────────────────────────────┘ │    │
│  │                          │                                 │    │
│  └──────────────────────────┼─────────────────────────────────┘    │
│                              ↓                                       │
│                     Continuous Loop ↑                                │
│                                                                   │
│  Quality Gates:                                                   │
│  • Automated benchmarks (HumanEval, MBPP, custom tests)          │
│  • Regression testing against previous version                    │
│  • A/B testing in shadow mode                                    │
│  • Rollback capability if quality degrades                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.7 Federated Learning Framework

**Description:**
Collaborative model training where teams share knowledge without sharing code.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  FEDERATED LEARNING SPECIFICATIONS                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Architecture:                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Federated Learning Network                   │    │
│  │                                                           │    │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐               │    │
│  │   │ Node A  │    │ Node B  │    │ Node C  │               │    │
│  │   │(Company)│    │(Company)│    │(Company)│               │    │
│  │   └────┬────┘    └────┬────┘    └────┬────┘               │    │
│  │        │              │              │                     │    │
│  │        └──────────────┼──────────────┘                     │    │
│  │                         ↓                                   │    │
│  │              ┌──────────────────┐                          │    │
│  │              │  Aggregation      │                          │    │
│  │              │   Server         │                          │    │
│  │              │  (No raw data)   │                          │    │
│  │              └────────┬─────────┘                          │    │
│  │                       ↓                                    │    │
│  │              ┌──────────────────┐                          │    │
│  │              │  Global Model    │                          │    │
│  │              │  Updates        │                          │    │
│  │              └──────────────────┘                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Privacy Guarantees:                                              │
│  • Only gradient/weight updates transmitted (not raw data)         │
│  • Differential privacy (DP-SGD) with configurable epsilon        │
│  • Secure aggregation protocols                                   │
│  • No central server required (Gossip protocol option)            │
│                                                                   │
│  Use Cases:                                                       │
│  • Industry consortiums sharing domain knowledge                   │
│  • Open source communities contributing to base model              │
│  • Enterprise subsidiaries collaborating on shared infrastructure  │
│                                                                   │
│  Consensus Mechanism:                                             │
│  • Weighted contribution based on data quality score              │
│  • Reputation system for reliable nodes                           │
│  • Byzantine fault tolerance                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.8 Live Execution Trace Injection

**Description:**
Every AI coding tool today reasons about static source code. This feature runs code continuously in a lightweight sandbox (WASM/V8 isolate) as the developer edits, captures the real runtime trace — variable values per line, call frequencies, memory deltas, branch coverage — and injects that structured trace alongside the source into the model's context window. The model reasons about *what the code actually does* rather than only what it says.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  LIVE EXECUTION TRACE INJECTION SPECIFICATIONS                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Sandbox:                                                         │
│  • WASM isolate for JavaScript/TypeScript projects               │
│  • Python subprocess sandbox (restricted builtins) for Python    │
│  • V8 Isolate API for Node.js projects                           │
│  • Execution budget: 200ms max per trace capture                 │
│  • Sandboxed from filesystem and network                         │
│                                                                   │
│  Trace Capture:                                                   │
│  • Variable values at each executed line                         │
│  • Call frequency map (how often each function was called)       │
│  • Branch coverage (which if/else arms were taken)               │
│  • Memory delta per function (heap allocation change)            │
│  • Exception paths (any thrown errors and their call sites)      │
│                                                                   │
│  Context Injection:                                               │
│  • Structured trace serialized as annotated source comments      │
│  • Budget: max 4K tokens of trace per completion request         │
│  • Trace is prioritized to the current function + callers        │
│  • Stale traces (>30s old) excluded from context                 │
│                                                                   │
│  Completions Impact:                                              │
│  • Injected alongside standard RAG context                       │
│  • Model instructed to reason about actual vs. intended behavior │
│  • Bug detection: model flags lines where trace diverges from    │
│    variable names / comments suggesting different values         │
│                                                                   │
│  Supported Languages (Phase 1):                                  │
│  • JavaScript / TypeScript                                       │
│  • Python                                                         │
│  Planned: Rust (via WASM target), Go                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.9 Temporal Decision Graph

**Description:**
A local, queryable causal graph that captures *why* the codebase evolved the way it did — not just *what* changed. As the developer codes, the system continuously builds a directed graph from git history, chat logs, accepted completions, and commit messages. Nodes are decisions (architectural choices, refactors, bug fixes). Edges are causality (this refactor was caused by that bug; that API was chosen because of this constraint). Queried via natural language: *"Why is auth structured this way?"*

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  TEMPORAL DECISION GRAPH SPECIFICATIONS                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Graph Construction:                                              │
│  • Sources: git log, chat history, accepted completions,         │
│    commit messages, inline comments                              │
│  • Node types: ArchitectureDecision, Refactor, BugFix,           │
│    FeatureAdd, DependencyChange                                  │
│  • Edge types: CausedBy, MotivatedBy, SupersededBy, RelatedTo    │
│  • Graph updated incrementally on every commit                   │
│                                                                   │
│  Storage:                                                         │
│  • Local SQLite with adjacency list schema                       │
│  • Node embeddings stored alongside graph for semantic search    │
│  • Encrypted at rest, portable with project                      │
│  • Max graph size: 100K nodes before pruning old leaves          │
│                                                                   │
│  Query Interface:                                                 │
│  • Natural language queries via RAG over graph                   │
│  • "Why does X work this way?"                                   │
│  • "What caused the refactor of Y module?"                       │
│  • "Show the decision history for this file"                     │
│  • Results include causal chain with timestamps and evidence     │
│                                                                   │
│  UI:                                                              │
│  • Timeline view: decisions plotted on project age axis          │
│  • Graph view: force-directed visualization of decision nodes    │
│  • File annotation: blame-style view showing decision history    │
│    per code region                                               │
│                                                                   │
│  Privacy:                                                         │
│  • Graph never leaves local machine                              │
│  • Sensitive values (secrets, passwords) stripped from nodes     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.2.10 Adversarial Persona Council

**Description:**
Instead of a single model answer, four specialized LoRA adapters run in parallel on the same base model, each trained to optimize for a different software quality dimension: Security (OWASP-trained), Performance (algorithmic complexity + profiling data), Maintainability (clean code + SOLID), and Correctness (test-driven, formal verification patterns). Their outputs are compared via logit divergence. When all four agree, the response is shown normally. When they disagree, the UI surfaces the *tension* — the tradeoff space — so the developer makes an informed decision rather than blindly accepting one answer.

**Requirements:**

```
┌──────────────────────────────────────────────────────────────────┐
│  ADVERSARIAL PERSONA COUNCIL SPECIFICATIONS                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Personas (4 LoRA adapters):                                      │
│  • Security  — trained on OWASP Top 10, CVE datasets,            │
│    secure coding guides (CWE, CERT)                              │
│  • Performance — trained on algorithmic complexity datasets,      │
│    profiler output patterns, Big-O annotations                   │
│  • Maintainability — trained on clean code, SOLID principles,    │
│    code review feedback datasets                                 │
│  • Correctness — trained on test-driven pairs, formal            │
│    verification examples, verified-correct code                  │
│                                                                   │
│  Inference:                                                       │
│  • All 4 adapters run in parallel (interleaved CUDA streams)     │
│  • Base model loaded once; adapters hot-swapped per stream       │
│  • Disagreement measured as cosine distance on output logits     │
│  • Threshold: distance > 0.25 triggers conflict UI               │
│  • VRAM overhead: ~400MB per adapter (Q4 LoRA weights)           │
│  • Minimum GPU: 16GB VRAM for 7B base + 4 adapters               │
│                                                                   │
│  Conflict UI:                                                     │
│  • Normal (agreement): single completion shown, no indicator     │
│  • Conflict: inline pill shows which personas disagree           │
│    e.g. "⚔ Security vs Performance" with expand button          │
│  • Expanded view: side-by-side panel with each persona's         │
│    alternative suggestion and a one-line rationale               │
│  • User selects which suggestion to accept                       │
│  • Selection logged as training signal (persona preference data) │
│                                                                   │
│  Training:                                                        │
│  • Each adapter fine-tuned on domain-specific open datasets      │
│  • Continuously refined on user's conflict resolution choices    │
│  • QLoRA rank 32, same training pipeline as §4.2.5               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Architecture Overview

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SOVEREIGN CODER - SYSTEM ARCHITECTURE             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     PRESENTATION LAYER                            │    │
│  │                                                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │    │
│  │  │   VSCode    │  │   JetBrains │  │  Terminal   │  │  Web    │  │    │
│  │  │   Plugin    │  │    Plugin   │  │     CLI     │  │  Dashboard│ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      CORE ENGINE LAYER                          │    │
│  │                                                                   │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │    │
│  │  │  Code Context  │  │     Agent      │  │    Tool       │      │    │
│  │  │   Aggregator   │  │  Orchestrator  │  │   Executor     │      │    │
│  │  │   (RAG + AST)  │  │                │  │  (Bash/Git)    │      │    │
│  │  └────────────────┘  └────────────────┘  └────────────────┘      │    │
│  │                                                                   │    │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │    │
│  │  │   Workspace    │  │   Evaluation   │  │    Model       │      │    │
│  │  │   Manager      │  │    Harness     │  │    Manager     │      │    │
│  │  └────────────────┘  └────────────────┘  └────────────────┘      │    │
│  │                                                                   │    │
│  │  ┌─────────────────────────────────────────────────────────────┐ │    │
│  │  │              Message Bus (Internal IPC)                       │ │    │
│  │  └─────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      MODEL SERVICE LAYER                        │    │
│  │                                                                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │                   LLM Inference Engine                     │  │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │  │    │
│  │  │  │ Ollama  │  │  vLLM   │  │llama.cpp│  │ GPT4All │       │  │    │
│  │  │  │ Server  │  │ Server  │  │ Server  │  │ Server  │       │  │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │                    Model Registry                          │  │    │
│  │  │   • Qwen2.5-Coder-32B-GGUF    • DeepSeek-Coder-33B       │  │    │
│  │  │   • StarCoder2-15B-GGUF       • Phi-4-Coder-14B          │  │    │
│  │  │   • Fine-tuned custom models   • Merged checkpoints        │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      TRAINING LAYER                            │    │
│  │                                                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │    │
│  │  │    Data      │  │    QLoRA     │  │       RLHF          │    │    │
│  │  │  Collector   │  │   Trainer     │  │      Trainer         │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘    │    │
│  │                                                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │    │
│  │  │ Self-Improve│  │    Eval      │  │      Model          │    │    │
│  │  │    Loop      │  │   Harness    │  │      Merger         │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘    │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW DIAGRAM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   User Input                                                             │
│       │                                                                  │
│       ↓                                                                  │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                     CONTEXT GATHERING                           │     │
│   │  • IDE state (open files, cursor position)                     │     │
│   │  • Project structure (file tree, imports)                      │     │
│   │  • Git history (recent changes, branches)                      │     │
│   │  • Workspace KB (RAG-retrieved relevant code)                  │     │
│   └────────────────────────────┬───────────────────────────────────┘     │
│                                │                                        │
│                                ↓                                        │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                    PROMPT CONSTRUCTION                          │     │
│   │  • System prompt (role, capabilities, constraints)            │     │
│   │  • Context assembly (retrieved code, file contents)            │     │
│   │  • User query formatting                                       │     │
│   └────────────────────────────┬───────────────────────────────────┘     │
│                                │                                        │
│                                ↓                                        │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                   INFERENCE EXECUTION                          │     │
│   │  • Local model inference (via Ollama/vLLM)                    │     │
│   │  • Streaming response                                          │     │
│   │  • Tool call orchestration                                     │     │
│   └────────────────────────────┬───────────────────────────────────┘     │
│                                │                                        │
│                                ↓                                        │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                     RESPONSE HANDLING                          │     │
│   │  • Code insertion (with diff preview)                          │     │
│   │  • Terminal output display                                     │     │
│   │  • Error handling and recovery                                  │     │
│   └────────────────────────────┬───────────────────────────────────┘     │
│                                │                                        │
│                                ↓                                        │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                     FEEDBACK COLLECTION                        │     │
│   │  • User acceptance/rejection                                   │     │
│   │  • Execution results (tests, builds)                           │     │
│   │  • Iterative improvements (edits after generation)             │     │
│   └────────────────────────────┬───────────────────────────────────┘     │
│                                │                                        │
│                                ↓                                        │
│   ┌────────────────────────────────────────────────────────────────┐     │
│   │                     TRAINING DATA STORE                        │     │
│   │  • Completion pairs                                            │     │
│   │  • Agent trajectories                                          │     │
│   │  • Preference data                                             │     │
│   └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technical Specifications

### 6.1 Supported Models

#### Primary Coding Models (Recommended)

| Model | Parameters | Quantization | VRAM | Context | Code Quality |
|-------|------------|--------------|------|---------|--------------|
| **Qwen2.5-Coder-32B** | 32B | Q4_K_M | 24GB | 128K | Excellent |
| **DeepSeek-Coder-33B** | 33B | Q4_K_M | 26GB | 128K | Excellent |
| **StarCoder2-15B** | 15B | Q4_K_M | 12GB | 8K | Good |
| **Phi-4-Coder-14B** | 14B | Q4_K_M | 10GB | 16K | Good |
| **Qwen2.5-Coder-7B** | 7B | Q4_K_M | 6GB | 128K | Good |

#### Base Foundation Models (For Fine-tuning)

| Model | Parameters | Use Case |
|-------|------------|----------|
| Llama-3.1-70B | 70B | Large-scale enterprise |
| Mistral-22B | 22B | Balanced performance |
| Phi-4 | 14B | Resource-constrained |

### 6.2 Technology Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                              │
├──────────────────────────────────────────────────────────────────┤
││
│  CORE APPLICATION                                                  │
│  ├── Language: TypeScript + Python                                │
│  ├── Framework: Electron (desktop) / CLI (terminal)              │
│  ├── State Management: Zustand / Redux                           │
│  └── IPC: gRPC for inter-process communication                    │
│                                                                   │
│  IDE PLUGINS                                                       │
│  ├── VSCode: TypeScript SDK                                       │
│  ├── JetBrains: Kotlin/Java SDK                                  │
│  └── Vim/Neovim: Lua                                             │
│                                                                   │
│  INFERENCE ENGINES                                                 │
│  ├── Ollama (primary for simplicity)                             │
│  ├── vLLM (high throughput scenarios)                           │
│  ├── llama.cpp (GGUF format, broad compatibility)               │
│  └── ExLlamaV2 (for larger models)                               │
│                                                                   │
│  TRAINING FRAMEWORK                                                 │
│  ├── Unsloth (fast QLoRA fine-tuning)                            │
│  ├── axolotl (flexible training pipelines)                      │
│  ├── trl (RLHF, DPO training)                                    │
│  └── DeepSpeed (distributed training)                            │
│                                                                   │
│  DATA & RETRIEVAL                                                  │
│  ├── ChromaDB (vector store)                                      │
│  ├── SQLite (local database)                                     │
│  ├── LanceDB (large-scale embeddings)                           │
│  └── e5-mistral (embeddings model)                               │
│                                                                   │
│  EVALUATION                                                         │
│  ├── HumanEval / MBPP (standard benchmarks)                      │
│  ├── SWE-bench (real-world bug fixes)                           │
│  ├── EvalPlus (enhanced evaluation)                              │
│  └── Custom evaluation suites                                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 API Specifications

#### 6.3.1 Local Inference API

```typescript
// OpenAI-compatible endpoint
POST /v1/chat/completions
Authorization: Bearer <local-api-key>

{
  "model": "qwen2.5-coder-32b",
  "messages": [
    {"role": "system", "content": "You are Sovereign Coder..."},
    {"role": "user", "content": "Write a function to..."}
  ],
  "max_tokens": 2048,
  "temperature": 0.7,
  "stream": true
}
```

#### 6.3.2 Model Management API

```typescript
// List available models
GET /api/models

// Download a new model
POST /api/models/download
{
  "model_id": "qwen2.5-coder-32b",
  "quantization": "q4_k_m"
}

// Switch active model
POST /api/models/switch
{
  "model_id": "qwen2.5-coder-32b"
}

// Fine-tune a model
POST /api/models/train
{
  "base_model": "qwen2.5-coder-7b",
  "dataset": "/path/to/training/data",
  "lora_rank": 16,
  "epochs": 3
}
```

#### 6.3.3 Federated Learning API

```typescript
// Join a federation
POST /api/federation/join
{
  "federation_id": "finance-ai-consortium",
  "organization_id": "acme-corp"
}

// Submit gradient updates
POST /api/federation/contribute
{
  "round_id": 42,
  "gradient_hash": "sha256:abc123...",
  "metrics": {
    "loss": 0.23,
    "accuracy": 0.89
  }
}

// Pull latest global model
GET /api/federation/model/:round
```

---

## 7. Self-Improvement System

### 7.1 Overview

The self-improvement system enables Sovereign Coder to continuously enhance its own capabilities through usage, creating a virtuous cycle where the tool becomes better over time.

### 7.2 Data Collection Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION PIPELINE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SOURCE 1: Code Completion Feedback                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  User types "for i in range("                              │  │
│  │  Model suggests: "10)"                                     │  │
│  │  User presses Tab → ACCEPTED                               │  │
│  │  → Store: (prompt, completion, accepted=true)              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  SOURCE 2: Agent Task Trajectories                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Task: "Fix the login bug"                                │  │
│  │  Step 1: Read auth.py                                     │  │
│  │  Step 2: Identify issue in line 42                        │  │
│  │  Step 3: Apply fix                                        │  │
│  │  Result: Bug fixed ✓                                      │  │
│  │  → Store complete trajectory as training example           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  SOURCE 3: Execution Feedback                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Generated code → Compiles? No                            │  │
│  │  Error: SyntaxError                                        │  │
│  │  Model self-corrects → Success                            │  │
│  │  → Store: (failed_code, error, corrected_code)            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  SOURCE 4: User Corrections                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Model generates function                                  │  │
│  │  User edits the function                                   │  │
│  │  → Store: (model_output, user_edit, improved_output)        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Training Schedule

```
┌──────────────────────────────────────────────────────────────────┐
│                       10-MINUTE TRAINING LOOP                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                    10 MINUTE CYCLE                        │   │
│   │                                                           │   │
│   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│   │   │ Collect │→ │ Prepare │→ │ Train   │→ │ Validate│    │   │
│   │   │  Data   │  │  Batch  │  │  Step   │  │  Quick  │    │   │
│   │   │ (2min)  │  │ (2min)  │  │ (5min)  │  │ (1min)  │    │   │
│   │   └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│   │                                                           │   │
│   └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ↓                                    │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │               8-HOUR FULL UPGRADE CYCLE                  │   │
│   │                                                           │   │
│   │   48 iterations × 10 min = 480 min = 8 hours             │   │
│   │                                                           │   │
│   │   After 8 hours:                                         │   │
│   │   • New model checkpoint generated                       │   │
│   │   • Performance benchmarked                              │   │
│   │   • If improvement confirmed → Deploy new version        │   │
│   │   • Use new model to refactor tool's own code            │   │
│   │                                                           │   │
│   └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ↓                                    │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │              CONTINUOUS IMPROVEMENT CYCLE                │   │
│   │                                                           │   │
│   │   Day 1: Model v1.0 baseline                             │   │
│   │   Day 2: Model v1.1 (+5% capability)                     │   │
│   │   Day 7: Model v1.7 (+25% capability)                   │   │
│   │   Day 30: Model v2.0 (+80% capability)                  │   │
│   │   ...                                                    │   │
│   │                                                           │   │
│   │   Code quality: baseline → refactored → optimized        │   │
│   │   Model capability: general → specialized → expert       │   │
│   │                                                           │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.4 Quality Assurance

| Checkpoint | Criteria | Action if Failed |
|------------|----------|------------------|
| Training Loss | < 0.5 improvement | Investigate data quality |
| Validation Loss | < 10% degradation | Rollback to previous |
| HumanEval | > baseline score | A/B test in shadow mode |
| Runtime Tests | > 95% pass rate | Reject and retrain |
| User Feedback | > 4.0 rating | Collect more data |

---

## 8. Federated Learning Framework

### 8.1 Overview

Federated learning enables multiple organizations to collaboratively train AI models without sharing sensitive code or proprietary data. This is particularly valuable for:

- **Regulated industries** needing compliance with data protection laws
- **Competitive organizations** wanting to share knowledge but protect IP
- **Industry consortiums** building shared domain expertise

### 8.2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FEDERATED LEARNING ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    FEDERATION PARTICIPANTS                       │    │
│  │                                                                   │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │   │  Org A       │  │  Org B       │  │  Org C       │         │    │
│  │   │  (Bank)      │  │  (Hospital)  │  │  (Factory)   │         │    │
│  │   │              │  │              │  │              │         │    │
│  │   │  Local Data  │  │  Local Data  │  │  Local Data  │         │    │
│  │   │  • Trading   │  │  • Medical   │  │  • IoT       │         │    │
│  │   │  • Risk       │  │  • Genomics  │  │  • PLC       │         │    │
│  │   │  • Fraud      │  │  • Imaging   │  │  • Robotics  │         │    │
│  │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │    │
│  │          │                 │                 │                  │    │
│  │          └─────────────────┼─────────────────┘                  │    │
│  │                            ↓                                    │    │
│  │                   ┌──────────────────┐                          │    │
│  │                   │   Local Training │                          │    │
│  │                   │   (On-premise)   │                          │    │
│  │                   │                  │                          │    │
│  │                   │  • Data stays    │                          │    │
│  │                   │    in org        │                          │    │
│  │                   │  • Only grads    │                          │    │
│  │                   │    transmitted   │                          │    │
│  │                   └────────┬─────────┘                          │    │
│  │                            │                                     │    │
│  └────────────────────────────┼─────────────────────────────────────┘    │
│                               ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    COMMUNICATION LAYER                          │    │
│  │                                                                   │    │
│  │   ┌─────────────────────────────────────────────────────────┐    │    │
│  │   │               Secure Channel (TLS/mTLS)                 │    │    │
│  │   │                                                           │    │    │
│  │   │   Transmitted:                                           │    │    │
│  │   │   • Gradient updates (encrypted)                         │    │    │
│  │   │   • Model weights (encrypted)                             │    │    │
│  │   │   • Evaluation metrics                                    │    │    │
│  │   │                                                           │    │    │
│  │   │   NOT Transmitted:                                       │    │    │
│  │   │   • Raw code                                              │    │    │
│  │   │   • Training data                                         │    │    │
│  │   │   • Model architecture secrets                           │    │    │
│  │   └─────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                  AGGREGATION SERVER                            │    │
│  │                                                                   │    │
│  │   ┌─────────────────────────────────────────────────────────┐    │    │
│  │   │              Federated Averaging (FedAvg)                │    │    │
│  │   │                                                           │    │    │
│  │   │   W_new = Σ (n_k / n) × W_k                             │    │    │
│  │   │                                                           │    │    │
│  │   │   where:                                                  │    │    │
│  │   │   • W_new = new global model                             │    │    │
│  │   │   • n_k = number of samples at node k                    │    │    │
│  │   │   • W_k = updated weights from node k                    │    │    │
│  │   └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                   │    │
│  │   Optional: Homomorphic Encryption for additional privacy       │    │
│  │                                                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Privacy Guarantees

| Technique | Protection Level | Overhead |
|-----------|-----------------|----------|
| Secure Aggregation | Prevents server seeing individual updates | Low |
| Differential Privacy (DP-SGD) | Mathematical guarantee of privacy | Medium (10-20% accuracy) |
| Homomorphic Encryption | Computation on encrypted data | High (2-10x slowdown) |
| On-device Training | Data never leaves device | None |

### 8.4 Consortium Types

1. **Industry Consortium**: Competitors sharing non-competitive insights (e.g., all banks sharing fraud detection patterns)
2. **Supply Chain**: Companies in same supply chain sharing logistics optimization
3. **Open Source Community**: Developers contributing to shared base model
4. **Enterprise Subsidiary**: Large org sharing across regional subsidiaries

---

## 9. Personal Knowledge Library System

### 9.1 Overview

Every user of Sovereign Code automatically builds a **Personal Knowledge Library (PKL)** — a local, private repository of their domain expertise, past decisions, and proven code patterns. The PKL feeds into every AI request, making suggestions progressively more personalized and accurate.

> *"The more you use Sovereign Code, the smarter it gets about you."*

### 9.2 Architecture

```
Personal Knowledge Layer (~/.sovereign-code/knowledge/)
├── memory.md             ← Personal knowledge base (user-editable)
├── domains.json          ← Domain expertise mapping (auto-detected)
├── snippets/             ← Code snippet library (auto-populated)
│   ├── patterns/
│   ├── utilities/
│   └── templates/
├── decisions.md          ← Why decisions were made
├── learnings.json        ← What worked / what didn't
└── metadata.json         ← Library metadata

↓ (injected into every model request)

Sovereign Code Inference Engine
├── RAG: Retrieve relevant snippets from library
├── Context Window: Include relevant memories
├── Few-shot: Show examples from user's history
└── Personalized: Tailored suggestions based on patterns
```

### 9.3 Auto-Population Pipeline

The system learns passively from user activity with zero manual effort:

| User Activity | What is Extracted | What is Stored |
|---------------|-------------------|----------------|
| Accept AI completion | Problem type, solution pattern | "When [context], this pattern works" |
| Debug for 30+ minutes | Bug type, diagnosis, fix | "Tricky area: [symptoms] → [solution]" |
| Complete a task | Methodology, frameworks used | Domain expertise data point |
| Write a decision comment | Architectural rationale | Decision log entry |
| Reject AI suggestion | Mismatch type | Negative sample (avoid this) |

### 9.4 Storage Specifications

```
┌──────────────────────────────────────────────────────────────────┐
│  PERSONAL KNOWLEDGE LIBRARY SPECS                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Location:  ~/.sovereign-code/knowledge/                         │
│  Format:    Markdown + JSON (human-readable, git-friendly)       │
│  Privacy:   100% local, zero upload, zero sync                   │
│  Size:      Typical user: 5,000-50,000 words after 3 months      │
│                                                                   │
│  Retrieval:                                                       │
│  • Semantic search: e5-small-v2 embeddings stored in SQLite      │
│  • Full-text search: inverted index for keyword lookup           │
│  • Hybrid ranking: semantic + keyword + recency score            │
│  • Latency target: < 50ms per query                              │
│                                                                   │
│  Context Injection:                                               │
│  • Budget: max 8K tokens of PKL context per request             │
│  • Priority: most relevant snippets ranked by semantic score     │
│  • Freshness: recently used entries boosted                      │
│  • Negative filtering: exclude patterns user previously rejected │
│                                                                   │
│  Portability:                                                     │
│  • Export: zip archive of ~/.sovereign-code/knowledge/           │
│  • Import: drag-drop or import dialog                            │
│  • Merge: combine libraries from multiple machines               │
│  • Selective share: export topic-specific subset for teams       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 9.5 UI: Knowledge Screen

The dedicated Knowledge screen (accessible from the sidebar) provides:

- **Memory.md editor** — Rich markdown editor for manual knowledge entry
- **Snippet browser** — Searchable library with language/tag filters
- **Decision log** — Timeline of architectural decisions with context  
- **Domain map** — Visual representation of detected expertise areas
- **Activity feed** — Recent auto-captures with review/delete options
- **Stats** — Library size, search query history, context injection frequency

### 9.6 Impact Projections

| Timeframe | Individual Benefit | Organization Benefit |
|-----------|-------------------|--------------------|
| Week 1-4 | AI suggestions feel "familiar" | — |
| Month 1-3 | 50% faster on known problem types | New hires ramp 2x faster with team library |
| Month 3-12 | 80% acceptance rate on personal patterns | 25% productivity gain org-wide |
| Year 1+ | Full domain-expert AI assistant | Organizational knowledge compounds forever |

---

## 10. Enterprise Data Integration

### 10.1 Overview

With explicit IT approval, Sovereign Code can connect to enterprise systems and provide AI assistance that understands live business context. The model can reference actual ERP records, CRM data, or BI metrics when helping users build tools and automations.

**Key principle:** Data flows inward (from systems into context), never outward (to cloud). All connections are read-only, IT-governed, and fully audited.

### 10.2 Supported Systems (v0.5.0)

| System Category | Connectors | Access Type |
|----------------|------------|-------------|
| **ERP** | SAP S/4HANA, Oracle ERP, Microsoft Dynamics | Read-only schema + anonymized samples |
| **CRM** | Salesforce, HubSpot, Zoho | Read-only, PII-masked |
| **OMS** | SAP Commerce, Magento, custom REST | Order data summary only |
| **HRM** | SAP SuccessFactors, Workday, BambooHR | Org chart + anonymized roles |
| **BI** | PowerBI, Tableau, Metabase, Postgres | Aggregated metrics, no row-level PII |
| **Custom** | Any REST API / PostgreSQL / MySQL / MongoDB | IT-configurable rules |

### 10.3 Security Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  ENTERPRISE DATA SECURITY MODEL                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    IT Admin Console                                   │
│  │ ERP / CRM /  │    ┌──────────────────────────────────────────────┐   │
│  │ OMS / HRM /  │ →  │  Connection Approval Workflow                │   │
│  │ BI Systems   │    │  • Define allowed tables/fields              │   │
│  └──────────────┘    │  • Set PII masking rules (SSN, salary etc.)  │   │
│                      │  • Configure rate limits & quotas            │   │
│                      │  • Activate/deactivate per user role         │   │
│                      └──────────────────┬───────────────────────────┘   │
│                                         ↓                               │
│                      ┌──────────────────────────────────────────────┐   │
│                      │  Data Access Layer (On-premise)              │   │
│                      │  • Read-only connector                       │   │
│                      │  • PII detection & masking (Presidio)        │   │
│                      │  • Data sampling (max N rows per query)      │   │
│                      │  • No caching of sensitive values            │   │
│                      └──────────────────┬───────────────────────────┘   │
│                                         ↓                               │
│                      ┌──────────────────────────────────────────────┐   │
│                      │  Context Injection                           │   │
│                      │  • Anonymized schema: "orders table has      │   │
│                      │    200K rows, columns: id, status, amount"  │   │
│                      │  • Sample data only (5 rows max)             │   │
│                      │  • Business metrics: "Q1 revenue: $4.2M"    │   │
│                      │  • Data stays in RAM, never written to disk  │   │
│                      └──────────────────┬───────────────────────────┘   │
│                                         ↓                               │
│                      ┌──────────────────────────────────────────────┐   │
│                      │  Audit Log (Immutable)                       │   │
│                      │  • User, timestamp, query, system accessed   │   │
│                      │  • Exportable for compliance (SOC2, HIPAA)  │   │
│                      └──────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 10.4 Compliance Standards

| Standard | Coverage | Implementation |
|----------|----------|----------------|
| SOC 2 Type II | Data handling, access control | Audit logs, RBAC, encryption |
| HIPAA | Healthcare data | PHI masking, access control |
| GDPR | EU personal data | Right to erasure, consent tracking |
| CCPA | California personal data | Data inventory, opt-out |
| PCI-DSS | Payment card data | Cardholder data masking |

### 10.5 IT Admin Console

An IT admin console (web UI, accessible at `http://localhost:8080/admin`) provides:

- **Connection registry** — View, add, approve, or revoke data connections
- **Field masking rules** — Configure which fields are masked per connector
- **User permissions** — Which users/roles can access which systems
- **Live audit log** — Real-time query monitoring with user attribution
- **Usage analytics** — How AI is using enterprise data (query types, frequency)
- **Emergency off switch** — Disable all enterprise data access instantly

---

## 11. Product Roadmap

### 11.1 Release History & Forward Plan

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SOVEREIGN CODE RELEASE TIMELINE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ COMPLETED                                                            │
│  ─────────────────────────────────────────────────────────────────────  │
│  v0.1 — Desktop Foundation                                              │
│  • Electron app with React 18 + Tailwind v4                            │
│  • 8 screens: Dashboard, Models, Chat, Training, Federation,           │
│    Settings, System Health, Voice                                       │
│  • 8 Zustand stores, WCAG AA accessibility                             │
│  • 314 unit tests, Windows EXE packaging                               │
│                                                                          │
│  v0.2 — Model Management                                                 │
│  • HuggingFace model download/management (independent)                 │
│  • FastAPI model-manager service (port 8002)                           │
│  • QLoRA training pipeline (FastAPI training service, port 8001)       │
│  • Renamed "Sovereign Code", v0.2 branding                             │
│                                                                          │
│  v0.3 — Accessibility & Voice                                           │
│  • China mirror support (hf-mirror.com, one-click toggle)             │
│  • VibeVoice integration (Whisper ASR + Google TTS)                   │
│  • Voice panel, waveform visualization, transcription history          │
│  • MirrorSelector component in Settings                                │
│                                                                          │
│  v0.4.0 — Personal Knowledge Library  [✅ COMPLETED April 2026]        │
│  • ~/.sovereign-code/knowledge/ local storage, KnowledgeStorage.ts    │
│  • Auto-learning pipeline: PatternExtractor, QualityScorer, Dedup     │
│  • Semantic search — knowledge-service FastAPI (port 8003, e5-small)  │
│  • Context injection: ContextInjector, RelevanceFilter, TokenBudget   │
│  • Knowledge Screen UI (4 tabs), useKnowledgeLibrary hook             │
│  • Memory.md editor, snippet browser, decision log, domain expertise  │
│  • 408 unit tests passing                                              │
│                                                                          │
│  v0.5.0 — Enterprise Data Integration  [✅ COMPLETED April 2026]        │
│  • 4 enterprise connectors (SAP, Salesforce, PostgreSQL, REST API)    │
│  • PII masking (6 entity types: email, phone, SSN, CC, IP, name)      │
│  • IT admin console UI (3-tab screen: connectors/audit/PII rules)     │
│  • Immutable audit log (SHA-256 hash chaining, SQLite, CSV export)    │
│  • Live Execution Trace Injection (Python sys.settrace + JS/Node)     │
│  • Temporal Decision Graph (git-history parser + NL query engine)     │
│  • 501 TypeScript + 95 Python tests passing                            │
│                                                                          │
│  v0.6.0 — Organization Intelligence  [✅ COMPLETED April 2026]         │
│  • Multi-Agent Orchestration Engine (task decomp, DAG, port 8006)     │
│  • Team Knowledge Sharing — AnonymizationEngine, PatternAggregator    │
│  • Cross-team pattern discovery & org-wide skill gap analysis (8007)  │
│  • Adversarial Persona Council — 4 reviewers, CouncilOrchestrator     │
│  • Advanced Analytics Dashboard (usage, quality trends, ROI) (8009)   │
│  • IM Remote Control Bridge — Telegram/Slack/Discord/Feishu/DingTalk/ │
│    WeChat Work/WhatsApp/LINE, CommandProcessor, port 8010              │
│  • 618 TypeScript + 176 Python tests passing                           │
│                                                                          │
│  v0.7.0 — Advanced Developer Tools  [✅ COMPLETED April 2026]          │
│  • Semantic Code Search (TF-IDF, port 8011)                           │
│  • Plugin Extension System (HookDispatcher, port 8012)                │
│  • Automated PR Review Agent (RuleEngine, port 8013)                  │
│  • Local Model Fine-tuning UI (LoRA config, port 8001 extension)      │
│  • Federated Learning Core (FedAvg + DP-SGD, port 8014)              │
│  • Tests: 735 TypeScript, ~281 Python                                 │
│                                                                          │
│  🔜 IN PROGRESS / PLANNED                                               │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  v1.0 — Platform  [Q2 2027]                                            │
│  • Plugin ecosystem open                                               │
│  • First consortiums operational                                       │
│  • Mobile companion app                                                │
│  • Full API for third-party integrations                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Archived Execution Summary (v0.4.0-v0.7.0)

The v0.4.0 sprint plan listed in prior revisions has been completed and is retained as historical context.

Implementation outcomes now reflected as completed:
- v0.4.0: Personal Knowledge Library
- v0.5.0: Enterprise Data Integration + Live Execution Trace Injection + Temporal Decision Graph
- v0.6.0: Organization Intelligence + Adversarial Persona Council + IM bridge
- v0.7.0: Semantic Search + Plugin System + PR Review Agent + Federated Learning Core

Current planning focus should remain on v1.0 deliverables and hardening work.

### 11.3 Key Milestones

| Milestone | Status | Notes |
|-----------|--------|-------|
| v0.4.0 GA | ✅ Achieved | PKL shipped |
| v0.5.0 GA | ✅ Achieved | Enterprise integrations + trace/graph shipped |
| v0.6.0 GA | ✅ Achieved | Org intelligence suite shipped |
| v0.7.0 GA | ✅ Achieved | Advanced dev tools shipped |
| v1.0 GA | 🔜 Planned | Plugin ecosystem + consortium operations + public platform APIs |

---

## 12. Success Metrics

### 12.1 Product Metrics

| Metric | Baseline | 6-Month Target | 12-Month Target |
|--------|----------|----------------|-----------------|
| DAU (Daily Active Users) | — | 1,000 | 50,000 |
| MAU (Monthly Active Users) | — | 5,000 | 100,000 |
| Code Acceptance Rate | 30% | 45% | 65% |
| HumanEval Pass@1 | 40% | 65% | 80% |
| SWE-bench Resolution | 10% | 35% | 50% |
| Model Fine-tune Time | 48h | 8h | 2h |
| PKL Library Size (avg active user) | — | 5K words | 20K words |
| Enterprise Data Connections | — | — | 50+ |

### 12.2 Technical Metrics

| Metric | Target |
|--------|--------|
| First Token Latency | < 500ms (7B), < 1s (32B) |
| Token Throughput | > 30 tokens/sec |
| Memory Usage | < 80% VRAM |
| Offline Capability | 100% (no network required) |
| PKL Semantic Search Latency | < 50ms |
| Training Cost | < $0.50 per fine-tune cycle |
| Model Quality Drift | < 5% degradation per month |
| Audit Log Integrity | 100% (immutable, tamper-proof) |

### 12.3 Business Metrics

| Metric | Year 1 Target | Year 2 Target | Year 3 Target |
|--------|---------------|---------------|---------------|
| ARR (Annual Recurring Revenue) | $500K | $5M | $50M |
| Enterprise Customers | 10 | 100 | 500 |
| Users with Active PKL | 1,000 | 20,000 | 100,000 |
| Enterprise Data Connections | 5 | 100 | 1,000 |
| Federated Networks | 0 | 5 | 50 |
| NPS (Net Promoter Score) | 40 | 55 | 70 |
| Annual ROI per 500-person org | — | $2M | $5.7M |

---

## 13. Risk Analysis

### 13.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Local model capability gap | High | Medium | Continuous prompt engineering; model selection |
| Training instability | Medium | High | Robust evaluation pipeline; rollback mechanisms |
| Hardware limitations | Low | High | Progressive model sizing; cloud fallback option |
| PKL quality degradation | Medium | Medium | Quality scoring, deduplication, user review |
| Enterprise connector breakage | Medium | High | Versioned APIs, contract testing, fallback mode |

### 13.2 Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Slow enterprise adoption | High | Medium | ROI calculator; pilot program; strong documentation |
| Competitor replication | High | Medium | Personal library flywheel; data moat |
| Regulatory changes | Low | High | Compliance-ready architecture; regional variants |
| China access disruption | Medium | Low | Multiple mirror options; offline-first default |

### 13.3 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Unauthorized enterprise data access | Low | Critical | RBAC, audit logging, IT approval workflow |
| PII leakage via AI output | Medium | High | Presidio masking before context injection |
| Local model exfiltration | Low | High | Sandboxed inference, no network in inference mode |
| Supply chain attack (HF models) | Low | High | Model hash verification, trusted source list |

### 13.4 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Team scaling challenges | Medium | Medium | Modular architecture; clear documentation |
| Open source sustainability | Medium | Medium | Dual-licensing model; enterprise revenue |

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **QLoRA** | Quantized Low-Rank Adaptation - Efficient fine-tuning method using 4-bit quantization |
| **GGUF** | GPT-Generated Unified Format - LLaMA model format optimized for local inference |
| **RAG** | Retrieval-Augmented Generation - Using external knowledge to enhance LLM responses |
| **SWE-bench** | Software Engineering Benchmark - Real-world GitHub issues for evaluating coding agents |
| **Federated Learning** | Collaborative training where data stays local, only model updates are shared |
| **DP-SGD** | Differential Privacy Stochastic Gradient Descent - Privacy-preserving training |
| **LoRA** | Low-Rank Adaptation - Efficient fine-tuning technique |
| **DPO** | Direct Preference Optimization - RLHF alternative using preference pairs |

### 14.2 Reference Architecture

```
Related Open Source Projects:
├── Sovereign Coder (Anthropic) - Inspiration for agent capabilities
├── Aider (paul-gauthier) - Local coding agent reference
├── Continue (continuedev) - VSCode extension architecture
├── Ollama - Local LLM inference
├── Unsloth - Fast QLoRA training
├── SWE-agent - Open source SWE-bench agent
└── NVIDIA FLARE - Federated learning framework
```

### 14.3 Hardware Recommendations

| Use Case | GPU | VRAM | Price Range |
|----------|-----|------|-------------|
| Individual Developer | RTX 3060 | 12GB | $300-400 |
| Power User | RTX 4070 | 12GB | $500-600 |
| Professional | RTX 4090 | 24GB | $1,600-1,800 |
| Team/Enterprise | A100 | 40GB | $10,000+ |
| Budget | RTX 4060 | 8GB | $250-350 |

### 14.4 Contact

For questions or collaboration inquiries:
- **Project**: Sovereign Code
- **Documentation**: This PRD (v2.0)
- **Development**: See `docs/plans/` for sprint implementation plans

---

**Document Version**: 2.0  
**Last Updated**: 2026-04-02  
**Status**: Active Development  

