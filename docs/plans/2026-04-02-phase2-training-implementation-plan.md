> Plan Status: Closed on 2026-04-04. This file is a historical planning artifact; execution tracking is consolidated in docs/plans/2026-04-04-plan-closure-report.md.

# Sovereign Code Phase 2 - Training Infrastructure Implementation Plan

**Status:** Active Implementation  
**Estimated Timeline:** 4-6 weeks  
**Dependencies:** Phase 1B ✅  
**Objective:** Enable local model fine-tuning with QLoRA and self-improvement loop  

---

## Overview

Phase 2 transforms Sovereign Code from a static completion engine into a **self-improving system**. Users' code patterns train into the model automatically, and a continuously-updated fine-tuned version replaces the base model over time.

### Phase 1B → Phase 2 Transition

| Aspect | Phase 1B | Phase 2 |
|--------|----------|---------|
| **Model** | Base model only (Ollama) | Base + QLoRA adapter |
| **Data Collection** | None | Automatic (completions, rejections, training tasks) |
| **Training** | Manual (via Ollama) | Automated local QLoRA pipeline |
| **Training Frequency** | On-demand | Every 10 min (lightweight), every 8h (full) |
| **Model Versioning** | None | Versioned adapters + model registry |
| **Evaluation** | Manual | Automated benchmarks (HumanEval, MBPP) |
| **Performance** | Baseline | Demonstrably improved over time |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                    TRAINING INFRASTRUCTURE                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  COLLECTION LAYER                                                  │
│  ├─ Completion events → accepted/rejected/edited                 │
│  ├─ Agent task trajectories → steps taken → outcome              │
│  ├─ Code review feedback → patterns → improvements               │
│  └─ Test execution → failures → corrections                      │
│      All stored in → Training DataStore (SQLite)                 │
│                                                                    │
│  PREPARATION LAYER                                               │
│  ├─ Data validation & deduplication                              │
│  ├─ Format conversion → HuggingFace Dataset                      │
│  ├─ Train/eval split (90/10)                                     │
│  └─ Shuffle & caching                                            │
│                                                                    │
│  TRAINING LAYER                                                  │
│  ├─ "10-Minute Loop"                                             │
│  │  ├─ Collect latest data (delta from last training) → ~1K samples
│  │  ├─ QLoRA quick-tune for 100 steps                           │
│  │  ├─ Inference test (10 samples) for validation               │
│  │  └─ Skip if invalid (keep previous adapter)                 │
│  │                                                               │
│  ├─ "8-Hour Upgrade Cycle"                                      │
│  │  ├─ Every 48 × 10-min iterations                             │
│  │  ├─ Full QLoRA training (all collected data)                │
│  │  ├─ Benchmark against base model (HumanEval subset)         │
│  │  ├─ If >1% improvement → publish new version                │
│  │  └─ If improvement → use for next 10-min loop               │
│  │                                                               │
│  └─ Advanced future campaigns (RLHF, DPO)                        │
│                                                                    │
│  VERSIONING LAYER                                                │
│  ├─ Model Registry (local SQLite)                               │
│  ├─ Base model metadata                                          │
│  ├─ Adapter versions with metrics                               │
│  ├─ Rollback chain (keep last 3 versions)                       │
│  └─ Export for deployment                                        │
│                                                                    │
│  EVALUATION LAYER                                                │
│  ├─ HumanEval (120 problems, Python)                            │
│  ├─ MBPP (500 problems, Python entrypoint focus)                │
│  ├─ Custom benchmark (user's codebase)                          │
│  ├─ Regression tests (collected during Phase 1B)                │
│  └─ Metrics dashboard (in desktop app)                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Task Breakdown

### Task 1: Training Data Collection System

**Objective:** Automatically capture training data from user interactions

**Deliverables:**
- Data store schema (SQLite)
- Collection hooks in desktop app & VSCode extension
- Data validation & sanitization
- Export to HuggingFace Dataset format

**Files to Create:**
```
services/training-service/
├── __init__.py
├── main.py                 # FastAPI server (port 8001)
├── training_data/
│   ├── __init__.py
│   ├── models.py           # SQLAlchemy models
│   ├── collector.py        # Collection endpoints
│   ├── store.py            # SQLite store abstraction
│   └── export.py           # → HuggingFace Dataset
├── benchmarks/
│   ├── __init__.py
│   ├── humaneval_runner.py # HumanEval harness
│   └── mbpp_runner.py      # MBPP harness
├── requirements.txt
├── pyproject.toml
└── .env.example
```

**Endpoints to Implement:**

```
POST /api/v1/training/event
{
  "event_type": "completion_accepted" | "completion_rejected" | "code_edit",
  "prompt": "def factorial(...",
  "completion": "return n * factorial...",
  "language": "python",
  "file_path": "src/utils.py",
  "metadata": { "model": "mistral-7b", "tokens": 42, ... }
}
→ 201 Created

POST /api/v1/training/task
{
  "task_id": "uuid",
  "task_description": "implement ...",
  "steps": [ { "action": "...", "result": "..." }, ... ],
  "outcome": "success" | "failure",
  "final_code": "..."
}
→ 201 Created

GET /api/v1/training/stats
→ {
  "total_events": 1250,
  "completion_accepted": 920,
  "completion_rejected": 180,
  "task_success_rate": 0.87,
  "last_training_cycle": "2026-04-02T08:00:00Z"
}

GET /api/v1/training/export
?format=huggingface&max_samples=5000
→ Streaming HuggingFace Dataset .zip or parquet
```

**Implementation Steps:**
1. Define data schema (Event, Task, CompletionSample)
2. Create SQLite store with migrations
3. Build FastAPI endpoints for collection
4. Add validation (no PII, no secrets, language check)
5. Implement export to HuggingFace Dataset format
6. Wire collection hooks from desktop app (on completion suggestion, on code edit)
7. Wire collection hooks from VSCode extension (on inline completion)
8. Unit tests for store operations
9. Integration tests for endpoints

**Success Criteria:**
- [ ] 100+ samples collected from test session
- [ ] All samples pass validation checks
- [ ] Export generates valid HuggingFace Dataset
- [ ] 90% test coverage
- [ ] Integration with desktop app working

---

### Task 2: QLoRA Training Pipeline

**Objective:** Implement fine-tuning algorithm using Unsloth + bitsandbytes

**Deliverables:**
- QLoRA trainer module
- Training orchestration (10-min loop + 8-hour upgrade)
- Model merge & export
- Rollback mechanism

**Files to Create:**
```
services/training-service/
├── training/
│   ├── __init__.py
│   ├── qla_trainer.py      # QLoRA training loop
│   ├── orca.py             # Orchestrator (10-min, 8-hour)
│   ├── merge.py            # Adapter merge to base
│   ├── config.py           # Hyperparameter profiles
│   └── scheduler.py        # Background job scheduler
├── requirements-training.txt  # torch, transformers, unsloth, etc.
```

**Config Profiles:**

```python
# training/config.py
QUICK_TRAIN_CONFIG = {
    "learning_rate": 4e-4,
    "num_train_epochs": 1,
    "max_steps": 100,
    "per_device_train_batch_size": 4,
    "gradient_accumulation_steps": 2,
    "warmup_steps": 10,
    "weight_decay": 0.01,
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0.05,
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj"],
}

FULL_TRAIN_CONFIG = {
    "learning_rate": 2e-4,
    "num_train_epochs": 3,
    "max_steps": 0,  # Num epochs takes precedence
    "per_device_train_batch_size": 2,
    "gradient_accumulation_steps": 4,
    "warmup_steps": 100,
    "weight_decay": 0.01,
    "lora_r": 32,
    "lora_alpha": 64,
    "lora_dropout": 0.05,
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj"],
}
```

**Training Flow:**

```python
# training/qla_trainer.py

class QLORATrainer:
    def __init__(self, base_model_id: str, device: str = "auto"):
        self.base_model_id = base_model_id
        self.device = device
        self.model = None
        self.tokenizer = None
        self.latest_adapter = None
    
    async def train(
        self,
        dataset: Dataset,  # HuggingFace Dataset
        config: dict,
        output_dir: str,
        eval_dataset: Optional[Dataset] = None,
    ) -> TrainingResult:
        """
        Fine-tune base model with QLoRA adapter.
        Returns: metadata, metrics, adapter path
        """
        # Load with 4-bit quantization
        self.model = AutoModelForCausalLM.from_pretrained(
            self.base_model_id,
            quantization_config=BitsAndBytesConfig(...),
        )
        self.tokenizer = AutoTokenizer.from_pretrained(self.base_model_id)
        
        # Apply LoRA
        peft_config = LoraConfig(...)
        self.model = get_peft_model(self.model, peft_config)
        
        # Train
        trainer = SFTTrainer(
            model=self.model,
            train_dataset=dataset,
            eval_dataset=eval_dataset,
            peft_config=peft_config,
            args=TrainingArguments(**config),
            data_collator=DataCollatorForLanguageModeling(self.tokenizer),
            formatting_func=self._format_sample,
        )
        
        result = trainer.train()
        
        # Save adapter
        adapter_path = f"{output_dir}/adapter"
        self.model.save_pretrained(adapter_path)
        self.tokenizer.save_pretrained(adapter_path)
        self.latest_adapter = adapter_path
        
        return TrainingResult(
            adapter_path=adapter_path,
            loss=result.training_loss,
            eval_metrics=result.metrics,
        )
    
    def _format_sample(self, sample):
        """Format training sample for SFT."""
        return {
            "text": f"{sample['prompt']}{sample['completion']}"
        }
```

**Orchestrator (10-min + 8-hour cycles):**

```python
# training/orchestrator.py

class TrainingOrchestrator:
    def __init__(self, base_model_id: str, data_store: TrainingDataStore):
        self.base_model_id = base_model_id
        self.data_store = data_store
        self.trainer = QLORATrainer(base_model_id)
        self.model_registry = ModelRegistry()
        self.quick_train_count = 0
        self.last_full_train = None
    
    async def run_quick_train_loop(self, interval_minutes: int = 10):
        """Lightweight 10-min training loop."""
        while True:
            try:
                # Collect delta (new events since last quick train)
                dataset = self.data_store.fetch_incremental_dataset(
                    since=self.last_quick_train,
                    max_samples=1000,
                )
                
                if len(dataset) < 100:
                    logger.info("Not enough samples, skipping quick train")
                    await asyncio.sleep(interval_minutes * 60)
                    continue
                
                # Train
                result = await self.trainer.train(
                    dataset=dataset,
                    config=QUICK_TRAIN_CONFIG,
                    output_dir="./models/quick",
                )
                
                # Validate
                if result.loss > self.data_store.last_training_loss * 1.5:
                    logger.warning("Loss degraded, skipping update")
                    await asyncio.sleep(interval_minutes * 60)
                    continue
                
                # Register adapter
                self.model_registry.register_adapter(
                    adapter_path=result.adapter_path,
                    version="quick",
                    metrics=result.eval_metrics,
                )
                
                self.quick_train_count += 1
                self.data_store.update_training_loss(result.loss)
                
                logger.info(f"✓ Quick train #{self.quick_train_count} complete")
                
            except Exception as e:
                logger.error(f"Quick train failed: {e}")
            
            await asyncio.sleep(interval_minutes * 60)
    
    async def run_full_train_cycle(self):
        """8-hour full training cycle (after 48 quick trains)."""
        while True:
            # Wait for 48 quick trains
            while self.quick_train_count < 48:
                await asyncio.sleep(60)
            
            try:
                logger.info("Starting full training cycle...")
                
                # Collect all data since last full train
                dataset = self.data_store.fetch_all_dataset_since(
                    since=self.last_full_train,
                )
                
                # Train/eval split
                dataset = dataset.train_test_split(test_size=0.1)
                
                # Full training
                result = await self.trainer.train(
                    dataset=dataset["train"],
                    eval_dataset=dataset["test"],
                    config=FULL_TRAIN_CONFIG,
                    output_dir="./models/full",
                )
                
                # Benchmark
                benchmark_result = await self._benchmark_model(
                    adapter_path=result.adapter_path,
                )
                
                improvement = benchmark_result.improvement_pct
                logger.info(f"Improvement: {improvement:.1f}%")
                
                if improvement > 1.0:  # >1% improvement
                    self.model_registry.promote_to_production(
                        adapter_path=result.adapter_path,
                        metrics=benchmark_result.metrics,
                    )
                    logger.info("✓ New model version published!")
                else:
                    logger.info("No significant improvement, keeping current")
                
                self.last_full_train = datetime.now()
                self.quick_train_count = 0
                
            except Exception as e:
                logger.error(f"Full train cycle failed: {e}")
                await asyncio.sleep(3600)  # Retry in 1 hour
    
    async def _benchmark_model(self, adapter_path: str) -> BenchmarkResult:
        """Run standard benchmarks."""
        runner = HumanEvalRunner(
            base_model_id=self.base_model_id,
            adapter_path=adapter_path,
        )
        
        # Run on subset (~30 problems for speed)
        results = await runner.run(num_problems=30)
        
        baseline_pass_rate = self.model_registry.get_baseline_pass_rate()
        current_pass_rate = results.pass_rate
        improvement_pct = (
            (current_pass_rate - baseline_pass_rate) / baseline_pass_rate * 100
        )
        
        return BenchmarkResult(
            pass_rate=current_pass_rate,
            improvement_pct=improvement_pct,
            metrics=results.metrics,
        )
```

**Implementation Steps:**
1. Set up training environment (torch, transformers, unsloth)
2. Implement QLoRA trainer class
3. Build data loader for HuggingFace Dataset
4. Implement training orchestrator (10-min + 8-hour)
5. Add model merge logic (combine LoRA adapter with base)
6. Build model registry for versioning
7. Integration with data collection
8. Comprehensive unit tests
9. Local training validation test

**Success Criteria:**
- [ ] QLoRA training completes in <15min on RTX 3060 (10-min loop)
- [ ] Full training cycle completes in <8 hours
- [ ] Model registry tracks 3+ versions with metrics
- [ ] Benchmark shows >1% improvement on full cycle
- [ ] Rollback to previous version works
- [ ] 90% test coverage

---

### Task 3: Benchmark Suite (HumanEval + MBPP)

**Objective:** Implement automated evaluation harness for quality gates

**Deliverables:**
- HumanEval runner
- MBPP runner
- Custom benchmark builder
- Metrics dashboard backend

**Files to Create:**
```
services/training-service/
├── benchmarks/
│   ├── __init__.py
│   ├── base_runner.py      # Base benchmark runner
│   ├── humaneval_runner.py # HumanEval implementation
│   ├── mbpp_runner.py      # MBPP implementation
│   ├── custom_runner.py    # User codebase benchmarks
│   └── metrics.py          # Aggregation & tracking
```

**Endpoints:**

```
POST /api/v1/benchmarks/run
{
  "benchmark": "humaneval" | "mbpp" | "custom",
  "adapter_path": "path/to/adapter",
  "num_problems": 30  # subset for fast iteration
}
→ 202 Accepted (async job)
→ Polling: GET /api/v1/benchmarks/run/{job_id}

GET /api/v1/benchmarks/results/{job_id}
→ {
  "status": "completed" | "running" | "failed",
  "pass_rate": 0.65,
  "num_problems": 30,
  "num_passed": 19,
  "execution_time": 1245.3,
  "errors": [],
  "timestamp": "2026-04-02T12:00:00Z"
}
```

**Implementation Steps:**
1. Download HumanEval dataset
2. Implement code execution sandbox (timeout + memory limits)
3. Build HumanEval runner
4. Build MBPP runner
5. Custom benchmark builder (index user's codebase)
6. Metrics aggregation
7. Dashboard backend endpoints
8. Unit + integration tests

---

### Task 4: Model Registry & Versioning

**Objective:** Track model versions, adapters, and metrics over time

**Deliverables:**
- SQLite model registry
- Adapter storage
- Version promotion workflow
- Export/merge logic

**Schema:**

```sql
-- Model Registry
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  base_model_id TEXT NOT NULL,
  version TEXT NOT NULL,
  type TEXT NOT NULL,  -- "base" | "adapter"
  adapter_path TEXT,
  training_config JSONB,
  metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  promoted_at TIMESTAMP,
  rolled_back_at TIMESTAMP,
  deprecated_at TIMESTAMP
);

CREATE TABLE training_events (
  id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES models(id),
  training_type TEXT,  -- "quick" | "full"
  loss REAL,
  duration_seconds INT,
  samples_used INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE model_metrics (
  id TEXT PRIMARY KEY,
  model_id TEXT REFERENCES models(id),
  benchmark TEXT,  -- "humaneval" | "mbpp" | "custom"
  pass_rate REAL,
  num_problems INT,
  num_passed INT,
  execution_time_seconds REAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Task 5: Desktop & VSCode Integration

**Objective:** Wire training data collection into UI

**Deliverables:**
- Collection hooks in desktop app
- Collection hooks in VSCode extension
- Training status dashboard
- Model selector in status bar

**Files to Modify:**
```
apps/desktop/src/renderer/
├── hooks/
│   └── useTrainingService.ts       # NEW: HTTP client for training API
├── store/
│   └── trainingStore.ts            # NEW: Zustand store for training state
├── components/training/
│   └── TrainingStatusPanel.tsx     # NEW: Show training progress
└── components/layout/
    └── StatusBar.tsx               # MODIFY: Add training status + model selector

apps/vscode-extension/src/
├── trainingClient.ts               # NEW: Training API client
├── trainingCollector.ts            # NEW: Event collection hooks
└── extension.ts                    # MODIFY: Initialize collection on activate
```

**Collection events to send:**
- When user accepts a completion suggestion
- When user rejects/edits a completion
- When user runs tests
- When agent completes a task

---

### Task 6: Documentation & Setup Guide

**Objective:** Help users set up local training

**Deliverables:**
- Setup guide (CPU vs GPU, dependencies)
- Configuration templates
- Troubleshooting
- Performance tuning guide

**Files to Create:**
```
docs/en/
├── 10-training-system.md           # Full training documentation
├── 11-training-setup-guide.md      # Setup & configuration
└── 12-model-registry.md            # Model management
```

---

## Task Priority & Sequencing

| Priority | Task | Est. Time | Dependencies |
|----------|------|-----------|--------------|
| P0 | Task 1: Data Collection | 5 days | None |
| P0 | Task 2: QLoRA Training | 7 days | Task 1 |
| P0 | Task 3: Benchmarks | 5 days | Task 1, 2 |
| P0 | Task 4: Model Registry | 3 days | Task 1, 2 |
| P0 | Task 5: UI Integration | 4 days | Task 1, 2, 4 |
| P1 | Task 6: Documentation | 2 days | All tasks |

**Total: ~26 days (4-6 weeks with 2-3 day buffer + review cycles)**

---

## Success Criteria (Phase 2 Complete)

- [ ] ✅ Training data collection working from desktop + VSCode extension
- [ ] ✅ QLoRA fine-tuning completes successfully on sample data
- [ ] ✅ 10-minute loop + 8-hour cycle running automatically
- [ ] ✅ HumanEval benchmark integrated and showing improvement >1%
- [ ] ✅ Model registry tracking versions with rollback capability
- [ ] ✅ Training status visible in desktop app
- [ ] ✅ Documentation complete with setup guide
- [ ] ✅ All tests passing (90%+ coverage)
- [ ] ✅ Phase 2 summary committed

---

## Technical Dependencies

```
PyPI Packages:
- torch>=2.1.0 (or `torch[cuda]` for NVIDIA)
- transformers>=4.36.0
- peft>=0.7.0  (LoRA)
- unsloth>=0.0.x  (QLoRA optimizer)
- bitsandbytes>=0.41.0  (4-bit quantization)
- datasets>=2.14.0  (HuggingFace datasets)
- accelerate>=0.25.0
- optimum>=1.17.0
- numpy>=1.24.0
- torch-cuda-toolkit (runtime, optional)

Docker/System:
- Python 3.10+
- CUDA 11.8+ (for GPU, optional)
- 12GB+ RAM (for 7B model, more for larger)
- 50GB disk for models + datasets

VS Code / Desktop:
- Existing Zustand, React, TypeScript stack
- HTTP client (fetch or axios) for training API
```

---

## Next Steps

1. **Immediately Start:** Task 1 (Data Collection) - foundation for everything else
2. **Day 5:** Task 2 (QLoRA) - can run in parallel after Task 1 scaffolded  
3. **Day 12:** Task 3 (Benchmarks) - validates that training improved model
4. **Day 17:** Task 4 (Registry) - low effort, high utility
5. **Day 21:** Task 5 (UI Integration) - make training visible to user
6. **Day 25:** Task 6 (Docs) + final testing + Phase 2 summary

**Target completion:** **End of Q2 2026** (by Month 9 per PRD)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| GPU memory OOM during training | HIGH | Start with 7B model, add CPU fallback, use flash-attention |
| Training divergence / model collapse | HIGH | Implement learning rate scheduler, gradient clipping, validation loss monitoring |
| Data collection leaks PII/secrets | HIGH | Add regex filters, sanitization layer, user review before consuming |
| Integration complexity with desktop/VSCode | MED | Mock training API in development, use feature flags for gradual rollout |
| Benchmark flakiness (code execution timeouts) | MED | Implement generous timeout + retry logic, containerized execution |

---

## Acceptance Checklist

- [ ] All tasks completed with >90% test coverage
- [ ] 314+ tests passing (desktop) + 56+ tests (VSCode) + 100+ tests (training)
- [ ] Training service deployed locally with Docker Compose
- [ ] Phase 2 summary document written
- [ ] Main branch updated with all commits
- [ ] Performance benchmarks documented (speed, memory, latency)
- [ ] Troubleshooting guide for common issues
- [ ] Ready for Phase 3 (Federated Learning)



