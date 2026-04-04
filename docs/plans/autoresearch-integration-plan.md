# Autoresearch Integration Plan

## Overview

Integrate the core methodology from [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) into Sovereign Code's training pipeline. The autoresearch pattern — autonomous AI agents running iterative experiments on a real training setup, measuring improvement, keeping or discarding changes, and repeating indefinitely — is adapted to work with Sovereign Code's existing QLoRA fine-tuning infrastructure.

**Core Idea**: Turn the existing training-service from a scheduled QLoRA job runner into an autonomous research platform where AI agents propose hypotheses, run time-budgeted experiments, evaluate results against a fixed metric, and automatically keep improvements or discard regressions.

---

## Methodology Mapping

| Autoresearch Concept | Sovereign Code Adaptation |
|---|---|
| `train.py` — single file agent edits | Training config + hyperparameter search space (agent modifies) |
| `prepare.py` — fixed evaluation/data | Evaluation harness with pinned val set, fixed metrics (HumanEval, MBPP, val_loss) |
| `program.md` — agent instructions | Research Program definition (goals, constraints, search space) |
| `results.tsv` — experiment log | Persistent experiment database (SQLite) replacing in-memory FinetuneJobManager |
| Git branch per experiment run | Checkpoint versioning with keep/discard/crash status |
| Fixed 5-min time budget | Configurable time budget per experiment (default: 10 min for QLoRA) |
| `val_bpb` — single metric | Primary metric (val_loss) + secondary metrics (HumanEval pass@1, MBPP) |
| Keep/discard binary decision | Automatic promotion on improvement, rollback on regression |
| `NEVER STOP` autonomous loop | Background experiment daemon with configurable run count or indefinite mode |

---

## Phase 0 — Documentation Discovery (Complete)

### Existing Training Infrastructure
- **Training Service** (`services/training-service/`): FastAPI on port 8001, QLORATrainer with 4-bit nf4 quantization, TrainingOrchestrator (quick every 10 min, full every 8 hrs), FinetuneJobManager (in-memory only)
- **Model Manager** (`services/model-manager/`): Model downloads, mirror support, Ollama integration, TRAINING_CONFIG (lora_rank: 8, lora_alpha: 16)
- **Desktop UI** (`apps/desktop/src/renderer/`): Training.tsx with 4 panels (Current Run, Data Collection, Schedule, Version History), useTrainingService hook, TrainingServiceClient
- **PRD** (`docs/en/Sovereign-Coder-PRD.md`): Pipeline spec (Data Collection → Format → QLoRA → Eval), quality gates, benchmarking targets (>85% pass@1)
- **Native GGUF Plan** (`docs/plans/native-gguf-inference-plan.md`): 6-phase plan for llama-cpp-python inference (not yet implemented)

### Autoresearch Methodology
- **Three-file architecture**: `prepare.py` (fixed evaluation + data), `train.py` (agent-modified), `program.md` (human-authored agent instructions)
- **Experiment loop**: Modify → commit → train (5 min budget) → evaluate → keep/discard → repeat
- **Design choices**: Single file to modify, fixed time budget (~12 experiments/hr), self-contained, single metric (val_bpb)
- **Agent autonomy**: Never stop, run indefinitely, log everything to results.tsv
- **Simplicity criterion**: Simpler code is better; complexity must justify improvement magnitude

### Key Gaps in Current System
1. No autonomous experimentation — training is manual or on a fixed schedule
2. No experiment tracking with persistent storage (FinetuneJobManager is in-memory)
3. No keep/discard methodology — no automatic rollback on regression
4. No hyperparameter search — configs are static presets
5. No fixed evaluation harness — no consistent benchmarking across experiments
6. No research program concept — no way to define experiment goals for autonomous exploration

---

## Phase 1 — Experiment Tracking Foundation

**Goal**: Replace in-memory FinetuneJobManager with persistent experiment tracking, modeled after autoresearch's `results.tsv` but with richer data.

### What to Implement

#### 1.1 Experiment Data Model
Create `services/training-service/experiments/models.py`:

```python
class ExperimentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    KEEP = "keep"        # val metric improved
    DISCARD = "discard"  # val metric same or worse
    CRASH = "crash"      # training failed

class Experiment(BaseModel):
    id: str                          # UUID
    run_tag: str                     # e.g. "autoresearch/jun15"
    commit_hash: Optional[str]       # checkpoint version
    config: dict                     # full training config snapshot
    description: str                 # what this experiment tried
    status: ExperimentStatus
    # Metrics
    val_loss: Optional[float]
    val_bpb: Optional[float]
    primary_metric: Optional[float]  # the metric being optimized
    secondary_metrics: dict          # additional benchmarks
    # Resources
    peak_vram_mb: Optional[float]
    training_seconds: Optional[float]
    total_seconds: Optional[float]
    # Timestamps
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    # Lineage
    parent_experiment_id: Optional[str]  # which experiment this branched from
    changes_from_parent: str             # description of what changed
```

#### 1.2 Persistent Experiment Store
Create `services/training-service/experiments/store.py`:
- SQLite-backed storage (file: `~/.sovereign-code/experiments.db`)
- CRUD operations: create, get, list, update status/metrics
- Query: list by run_tag, filter by status, get running best (lowest primary_metric with status=KEEP)
- Export: results.tsv compatible format for analysis

#### 1.3 Experiment API Routes
Create `services/training-service/experiments/router.py`:
- `POST /api/v1/experiments` — create new experiment
- `GET /api/v1/experiments` — list experiments (filter by run_tag, status)
- `GET /api/v1/experiments/{id}` — get experiment details
- `PATCH /api/v1/experiments/{id}` — update status/metrics
- `GET /api/v1/experiments/best` — get current best experiment for a run_tag
- `GET /api/v1/experiments/export` — export results as TSV

### Doc References
- Autoresearch `results.tsv` format: commit, val_bpb, memory_gb, status, description
- Existing `services/training-service/finetune/models.py`: FinetuneConfig, FinetuneJob, Checkpoint
- Existing `services/training-service/finetune/job_manager.py`: in-memory dict to replace

### Verification Checklist
- [ ] Experiments persist across service restarts
- [ ] Can create, query, and update experiments via API
- [ ] Running best calculation is correct
- [ ] TSV export matches autoresearch format
- [ ] Existing finetune routes still work (backward compatible)

### Anti-Pattern Guards
- Do NOT use an ORM — SQLite with raw queries is sufficient for this scope
- Do NOT remove the existing finetune routes — keep backward compatibility
- Do NOT store model weights in the database — only metadata and metrics

---

## Phase 2 — Evaluation Harness

**Goal**: Create a fixed, reproducible evaluation pipeline (analogous to autoresearch's `evaluate_bpb` in `prepare.py`) that measures model quality consistently across experiments.

### What to Implement

#### 2.1 Evaluation Runner
Create `services/training-service/evaluation/runner.py`:

```python
class EvaluationHarness:
    """Fixed evaluation pipeline. Do not modify between experiments."""
    
    def __init__(self, val_dataset_path: str, metrics: list[str]):
        self.val_dataset = self._load_pinned_validation_set(val_dataset_path)
        self.metrics = metrics  # ["val_loss", "val_bpb", "humaneval_pass1"]
    
    async def evaluate(self, model_path: str) -> dict:
        """Run all metrics against a trained model checkpoint."""
        results = {}
        results["val_loss"] = await self._evaluate_val_loss(model_path)
        results["val_bpb"] = self._loss_to_bpb(results["val_loss"])
        if "humaneval_pass1" in self.metrics:
            results["humaneval_pass1"] = await self._evaluate_humaneval(model_path)
        return results
```

#### 2.2 Pinned Validation Set
Create `services/training-service/evaluation/data.py`:
- Download and cache a fixed validation dataset (pinned, never changes between experiments)
- Store in `~/.sovereign-code/eval-data/`
- Support code completion tasks (from the existing data collection pipeline)
- Support general language modeling validation

#### 2.3 Metric Definitions
Create `services/training-service/evaluation/metrics.py`:
- `val_loss`: Cross-entropy loss on pinned validation set
- `val_bpb`: Bits per byte (vocab-size-independent, like autoresearch)
- `humaneval_pass1`: Pass@1 on HumanEval benchmark (optional, slower)
- Primary metric configurable per research program

### Doc References
- Autoresearch `prepare.py` `evaluate_bpb()`: fixed evaluation using EVAL_TOKENS from validation shard
- Existing PRD quality gates: >85% pass@1 on HumanEval/MBPP
- Existing `training/orchestrator.py`: validates loss < 10.0

### Verification Checklist
- [ ] Same model evaluated twice produces identical metrics
- [ ] Validation set is pinned and does not change between experiments
- [ ] val_bpb matches autoresearch formula (cross-entropy / ln(2))
- [ ] Evaluation completes within 60 seconds for typical model sizes
- [ ] Metrics stored correctly in experiment records

### Anti-Pattern Guards
- Do NOT modify the evaluation harness during an experiment run — it must be fixed
- Do NOT evaluate on training data — only on pinned validation set
- Do NOT add metrics that take longer than the training budget itself

---

## Phase 3 — Autonomous Experiment Loop

**Goal**: Implement the core autoresearch loop — autonomous, time-budgeted experiments with automatic keep/discard decisions.

### What to Implement

#### 3.1 Experiment Runner
Create `services/training-service/autoresearch/runner.py`:

```python
class ExperimentRunner:
    """
    Core autoresearch loop adapted for QLoRA fine-tuning.
    
    Loop:
    1. Generate experiment hypothesis (config changes)
    2. Snapshot current best config
    3. Apply changes, run training with time budget
    4. Evaluate against pinned validation set
    5. Compare to running best
    6. Keep (promote checkpoint) or discard (rollback)
    7. Log results
    8. Repeat
    """
    
    def __init__(self, research_program: ResearchProgram,
                 trainer: QLORATrainer,
                 evaluator: EvaluationHarness,
                 store: ExperimentStore):
        self.program = research_program
        self.trainer = trainer
        self.evaluator = evaluator
        self.store = store
        self.running_best = None  # best metric so far
    
    async def run_loop(self, max_experiments: Optional[int] = None):
        """Run experiments indefinitely or up to max_experiments."""
        count = 0
        while max_experiments is None or count < max_experiments:
            experiment = await self._run_single_experiment()
            count += 1
            if experiment.status == ExperimentStatus.KEEP:
                self.running_best = experiment
    
    async def _run_single_experiment(self) -> Experiment:
        # 1. Generate hypothesis
        hypothesis = self._generate_hypothesis()
        
        # 2. Create experiment record
        experiment = self.store.create(
            run_tag=self.program.run_tag,
            config=hypothesis.config,
            description=hypothesis.description,
            parent_experiment_id=self.running_best.id if self.running_best else None,
        )
        
        # 3. Train with time budget
        try:
            result = await self.trainer.train_with_budget(
                config=hypothesis.config,
                time_budget=self.program.time_budget_seconds,
            )
        except Exception as e:
            self.store.update(experiment.id, status="crash")
            return experiment
        
        # 4. Evaluate
        metrics = await self.evaluator.evaluate(result.checkpoint_path)
        
        # 5. Keep or discard
        status = self._decide(metrics)
        self.store.update(experiment.id, status=status, **metrics)
        
        return experiment
```

#### 3.2 Time-Budgeted Training
Extend `services/training-service/training/qlora_trainer.py`:
- Add `train_with_budget(config, time_budget_seconds)` method
- Training stops when wall-clock time exceeds budget (like autoresearch's TIME_BUDGET = 300)
- Fast-fail on NaN loss or loss > threshold (like autoresearch's `if math.isnan(train_loss_f) or train_loss_f > 100`)
- Return checkpoint path and training stats

#### 3.3 Keep/Discard Decision Logic
```python
def _decide(self, metrics: dict) -> ExperimentStatus:
    """
    Autoresearch rule: if primary metric improved (lower), keep.
    Otherwise discard.
    
    Sovereign Code extension: also consider simplicity criterion.
    """
    if self.running_best is None:
        return ExperimentStatus.KEEP  # first experiment is always baseline
    
    current_best = self.running_best.primary_metric
    new_value = metrics[self.program.primary_metric]
    
    if new_value < current_best:  # lower is better
        return ExperimentStatus.KEEP
    else:
        return ExperimentStatus.DISCARD
```

#### 3.4 Checkpoint Management
- On KEEP: promote checkpoint to `~/.sovereign-code/checkpoints/best/`
- On DISCARD: delete temporary checkpoint
- On CRASH: log error, clean up partial files

### Doc References
- Autoresearch `program.md` experiment loop (steps 1-9)
- Autoresearch design: fixed time budget makes experiments comparable
- Autoresearch `train.py`: `if math.isnan(train_loss_f) or train_loss_f > 100: exit(1)` fast-fail
- Existing `training/orchestrator.py`: TrainingOrchestrator.quick_train(), full_training_cycle()
- Existing `training/config.py`: QUICK_CONFIG (rank=16), FULL_CONFIG (rank=32)

### Verification Checklist
- [ ] Experiments stop at the configured time budget
- [ ] NaN/exploding loss triggers fast-fail (crash status)
- [ ] Keep decision is correct: only when metric strictly improves
- [ ] Discard rolls back to previous best checkpoint
- [ ] Loop runs N experiments consecutively without intervention
- [ ] Running best is tracked correctly across experiments

### Anti-Pattern Guards
- Do NOT modify evaluation between experiments — only training config changes
- Do NOT skip the keep/discard step — every experiment must be classified
- Do NOT continue training after time budget — fixed budget makes experiments comparable
- Do NOT run experiments in parallel within a single run (sequential like autoresearch)

---

## Phase 4 — Research Program System

**Goal**: Implement the equivalent of autoresearch's `program.md` — a user-defined specification that tells the autonomous loop what to explore.

### What to Implement

#### 4.1 Research Program Model
Create `services/training-service/autoresearch/program.py`:

```python
class SearchDimension(BaseModel):
    name: str           # e.g. "lora_rank"
    type: str           # "int", "float", "categorical"
    min_val: Optional[float]
    max_val: Optional[float]
    options: Optional[list]  # for categorical
    current: Any

class ResearchProgram(BaseModel):
    """
    Equivalent of autoresearch's program.md.
    Defines the experiment goals, constraints, and search space.
    """
    run_tag: str                      # e.g. "autoresearch/jun15"
    goal: str                         # "Minimize val_loss for Python code completion"
    primary_metric: str               # "val_loss" or "val_bpb"
    time_budget_seconds: int          # per-experiment training budget (default: 600)
    max_experiments: Optional[int]    # None = run indefinitely
    base_model: str                   # HuggingFace model ID
    dataset_path: str                 # training data location
    
    # Search space — what the agent can modify
    search_dimensions: list[SearchDimension]
    
    # Constraints
    max_vram_mb: Optional[float]      # soft VRAM constraint
    simplicity_preference: float      # 0.0-1.0, higher = prefer simpler configs
    
    # Strategy
    strategy: str                     # "random", "bayesian", "sequential", "agent"
```

#### 4.2 Hypothesis Generator
Create `services/training-service/autoresearch/hypothesis.py`:

```python
class HypothesisGenerator:
    """Generate experiment configs based on research program strategy."""
    
    def generate(self, program: ResearchProgram, 
                 history: list[Experiment]) -> Hypothesis:
        if program.strategy == "random":
            return self._random_search(program)
        elif program.strategy == "sequential":
            return self._sequential_search(program, history)
        elif program.strategy == "bayesian":
            return self._bayesian_search(program, history)
        elif program.strategy == "agent":
            return self._agent_search(program, history)
    
    def _random_search(self, program):
        """Random sampling within search space bounds."""
        ...
    
    def _sequential_search(self, program, history):
        """Try dimensions one at a time (grid-like)."""
        ...
    
    def _bayesian_search(self, program, history):
        """Bayesian optimization using experiment history."""
        ...
    
    def _agent_search(self, program, history):
        """
        Use an LLM agent to propose the next experiment.
        This is the closest analog to autoresearch's approach
        where the agent reads program.md and decides what to try.
        """
        ...
```

#### 4.3 Research Program API
- `POST /api/v1/research/programs` — create a new research program
- `GET /api/v1/research/programs` — list programs
- `POST /api/v1/research/programs/{id}/start` — start the experiment loop
- `POST /api/v1/research/programs/{id}/stop` — stop the running loop
- `GET /api/v1/research/programs/{id}/status` — current status and running best

#### 4.4 Default Research Programs
Ship with sensible defaults (like autoresearch's default `program.md`):

```python
DEFAULT_PROGRAMS = {
    "quick-explore": ResearchProgram(
        goal="Quick exploration of LoRA hyperparameters",
        time_budget_seconds=300,   # 5 min like autoresearch
        max_experiments=12,
        search_dimensions=[
            SearchDimension(name="lora_rank", type="categorical", options=[4, 8, 16, 32]),
            SearchDimension(name="lora_alpha", type="categorical", options=[8, 16, 32, 64]),
            SearchDimension(name="learning_rate", type="float", min_val=1e-5, max_val=5e-4),
        ],
        strategy="random",
    ),
    "overnight-run": ResearchProgram(
        goal="Overnight autonomous hyperparameter search",
        time_budget_seconds=600,   # 10 min per experiment
        max_experiments=None,      # run indefinitely
        search_dimensions=[...],   # broader search space
        strategy="bayesian",
    ),
}
```

### Doc References
- Autoresearch `program.md`: Setup, Experimentation, Output format, Logging results, Experiment loop
- Autoresearch design: "you are programming the program.md Markdown files that provide context to AI agents"
- Autoresearch simplicity criterion: "All else being equal, simpler is better"
- Existing `training/config.py`: 4 static presets (Quick, Full, Quick CPU, Full CPU)
- Existing `services/model-manager/config.py`: TRAINING_CONFIG defaults

### Verification Checklist
- [ ] Research programs can be created, saved, and loaded
- [ ] Default programs work out of the box with no configuration
- [ ] Search dimensions correctly constrain hypothesis generation
- [ ] Random strategy produces valid configs within bounds
- [ ] Start/stop API controls the experiment loop lifecycle

### Anti-Pattern Guards
- Do NOT make the research program format overly complex — it should be as simple as program.md
- Do NOT require agent/LLM for basic search strategies — random and bayesian should work standalone
- Do NOT allow the search space to include evaluation parameters — only training config

---

## Phase 5 — Desktop UI: Experiment Dashboard

**Goal**: Add an experiment dashboard to the desktop app that visualizes experiment history, running best progress, and research program management.

### What to Implement

#### 5.1 Experiment History View
Extend `apps/desktop/src/renderer/screens/Training.tsx`:
- Add "Experiments" tab alongside existing panels
- Table view: experiment ID, description, status (keep/discard/crash), primary metric, VRAM, duration
- Color coding: green (keep), red (discard), yellow (crash)
- Filter by run_tag, status

#### 5.2 Progress Chart
Inspired by autoresearch's `analysis.ipynb`:
- Line chart showing primary metric (val_loss) over experiments
- Scatter plot: all experiments (gray=discard, green=keep, red=crash)
- Running best line (step function, decreasing)
- Annotation: hover to see experiment description

#### 5.3 Research Program Editor
- Form to create/edit research programs
- Search space configuration (add/remove dimensions, set bounds)
- Strategy selector (random, sequential, bayesian, agent)
- Time budget slider
- Start/Stop controls
- Live status: current experiment, experiments completed, running best

#### 5.4 Live Experiment Monitor
- Real-time training loss curve (during active experiment)
- VRAM usage gauge
- Time remaining countdown
- Current hypothesis description
- Auto-scroll log output

### Doc References
- Autoresearch `analysis.ipynb`: scatter plot with keep/discard coloring, running minimum line
- Existing `apps/desktop/src/renderer/screens/Training.tsx`: 4-panel layout
- Existing `apps/desktop/src/renderer/hooks/useTrainingService.ts`: service communication pattern
- Existing `apps/desktop/src/renderer/services/trainingClient.ts`: API client pattern

### Verification Checklist
- [ ] Experiment table loads and displays data from API
- [ ] Progress chart renders with correct keep/discard coloring
- [ ] Research program can be created from the UI
- [ ] Start/Stop controls work and update UI state
- [ ] Live monitor shows real-time metrics during active experiment
- [ ] Accessibility: keyboard navigation, screen reader labels, sufficient contrast

### Anti-Pattern Guards
- Do NOT build a separate app — extend the existing Training screen
- Do NOT poll more frequently than every 5 seconds for experiment updates
- Do NOT load all experiments at once — paginate for large histories

---

## Phase 6 — Agent-Driven Research (Advanced)

**Goal**: Implement the full autoresearch vision — an LLM agent that autonomously generates experiment hypotheses based on prior results, like a human researcher who reads the experiment log and decides what to try next.

### What to Implement

#### 6.1 Agent Hypothesis Generator
Extend `services/training-service/autoresearch/hypothesis.py`:

```python
class AgentHypothesisGenerator:
    """
    Uses an LLM to generate the next experiment hypothesis.
    This is the Sovereign Code equivalent of pointing Claude at program.md.
    """
    
    async def generate(self, program: ResearchProgram,
                       history: list[Experiment]) -> Hypothesis:
        prompt = self._build_prompt(program, history)
        response = await self._call_llm(prompt)
        config = self._parse_config(response)
        return Hypothesis(config=config, description=response.reasoning)
    
    def _build_prompt(self, program, history):
        """
        Build prompt with:
        - Research program goals and constraints
        - Search space definition  
        - Full experiment history (like reading results.tsv)
        - Running best and recent trends
        - Instruction to propose the next experiment
        """
        ...
```

#### 6.2 Multi-Agent Research (Future)
- Multiple agents exploring different directions simultaneously
- Shared experiment database for coordination
- Deduplication: don't re-run experiments another agent already tried
- Best-of-N: compare results across agents, promote global best

#### 6.3 Research Report Generator
- After a run completes, generate a summary report
- Key findings: what worked, what didn't, recommended config
- Comparison to baseline
- Suggested next research directions

### Doc References
- Autoresearch README: "programming the program.md files that provide context to AI agents and set up your autonomous research org"
- Autoresearch program.md: "NEVER STOP" directive, experiment loop steps 1-9
- Autoresearch design: "how one would iterate on it over time to find the research org code that achieves the fastest research progress"
- Existing `services/orchestration-service/`: agent orchestration patterns

### Verification Checklist
- [ ] Agent generates valid training configs within search space
- [ ] Agent reasoning references prior experiment results
- [ ] Agent avoids repeating failed experiments
- [ ] Generated configs are parseable and runnable
- [ ] Report accurately summarizes run results

### Anti-Pattern Guards
- Do NOT let the agent modify the evaluation harness — only training config
- Do NOT call the LLM on every micro-step — only between experiments
- Do NOT require a cloud LLM — must work with local models (align with local-first principle)

---

## Implementation Order & Dependencies

```
Phase 1 (Experiment Tracking)
    ↓
Phase 2 (Evaluation Harness)
    ↓
Phase 3 (Experiment Loop)  ← Core autoresearch loop, the main deliverable
    ↓
Phase 4 (Research Programs) ← Makes the loop configurable
    ↓
Phase 5 (Desktop UI)       ← Visualization and control
    ↓
Phase 6 (Agent Research)   ← Advanced: LLM-driven hypothesis generation
```

Phases 1-3 are the **minimum viable autoresearch** — they deliver the core autonomous experiment loop. Phases 4-6 extend it toward the full autoresearch vision.

---

## File Changes Summary

### New Files
| File | Purpose |
|---|---|
| `services/training-service/experiments/models.py` | Experiment data model |
| `services/training-service/experiments/store.py` | SQLite persistent storage |
| `services/training-service/experiments/router.py` | Experiment API routes |
| `services/training-service/evaluation/runner.py` | Fixed evaluation harness |
| `services/training-service/evaluation/data.py` | Pinned validation dataset |
| `services/training-service/evaluation/metrics.py` | Metric definitions |
| `services/training-service/autoresearch/runner.py` | Autonomous experiment loop |
| `services/training-service/autoresearch/program.py` | Research program model |
| `services/training-service/autoresearch/hypothesis.py` | Hypothesis generation |
| `apps/desktop/src/renderer/components/ExperimentDashboard.tsx` | Experiment UI |
| `apps/desktop/src/renderer/components/ProgressChart.tsx` | Metric visualization |
| `apps/desktop/src/renderer/components/ResearchProgramEditor.tsx` | Program configuration UI |

### Modified Files
| File | Changes |
|---|---|
| `services/training-service/main.py` | Mount experiment and research routers |
| `services/training-service/training/qlora_trainer.py` | Add `train_with_budget()` method |
| `services/training-service/requirements.txt` | Add `optuna` (bayesian optimization) |
| `apps/desktop/src/renderer/screens/Training.tsx` | Add Experiments tab |
| `apps/desktop/src/renderer/hooks/useTrainingService.ts` | Add experiment/research API calls |
| `apps/desktop/src/renderer/services/trainingClient.ts` | Add experiment/research endpoints |
| `apps/desktop/src/renderer/shared/finetuning.ts` | Add Experiment, ResearchProgram types |

---

## Testing Strategy

Following the TDD rule from CLAUDE.md:

1. **Phase 1 tests**: Experiment CRUD, persistence across restarts, query filters, TSV export
2. **Phase 2 tests**: Evaluation reproducibility (same model → same metrics), metric calculations
3. **Phase 3 tests**: Loop runs N experiments, keep/discard decisions, time budget enforcement, crash recovery
4. **Phase 4 tests**: Research program validation, hypothesis generation within bounds, strategy switching
5. **Phase 5 tests**: Component rendering, API integration, chart data formatting
6. **Phase 6 tests**: Agent config parsing, prompt construction, config validity

---

## Success Metrics

| Metric | Target | Source |
|---|---|---|
| Experiments per hour | ≥6 (10-min budget) | Autoresearch achieves ~12/hr with 5-min budget |
| Experiment tracking persistence | 100% across restarts | Currently 0% (in-memory) |
| Keep rate | 10-30% of experiments | Autoresearch typical range |
| val_loss improvement after overnight run | >5% reduction from baseline | Autoresearch demonstrates monotonic improvement |
| UI experiment load time | <500ms for 1000 experiments | Pagination-based |
| Crash recovery | Automatic, no data loss | Currently manual |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| GPU OOM during experiment | Fast-fail on VRAM threshold, configurable DEVICE_BATCH_SIZE |
| Experiment loop corruption | SQLite WAL mode, checkpoint before each experiment |
| Bad hypothesis wastes time | Time budget caps worst case; crash detection fast-fails early |
| Single GPU bottleneck | Phase 6 multi-agent can distribute across GPUs |
| Local-first constraint limits model quality | Focus on QLoRA efficiency; GGUF inference plan enables local inference |
