"""
Experiment Runner — Core Autoresearch Loop (Phase 3.1)

The autonomous hyperparameter tuning orchestrator for Sovereign Code's QLoRA pipeline.

Loop:
1. Generate experiment hypothesis (config changes)
2. Snapshot current best config
3. Apply changes, run training with time budget
4. Evaluate against pinned validation set
5. Compare to running best
6. Keep (promote checkpoint) or discard (rollback)
7. Log results
8. Repeat

Key principles:
- Every experiment is tracked and persisted
- Decisions are deterministic and logged
- No model weights are leaked across experiments
- Time budget is a hard limit (no graceful degradation)
- Experiments build on prior best (evolutionary)
"""

import asyncio
import logging
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, AsyncGenerator
from abc import ABC, abstractmethod
from enum import Enum
import random

from experiments.models import Experiment, ExperimentStatus
from experiments.store import ExperimentStore
from training.qla_trainer import QLORATrainer
from evaluation.runner import EvaluationHarness
from datasets import Dataset

logger = logging.getLogger(__name__)


class HypothesisGenerator(ABC):
    """Abstract base for experiment hypothesis generation"""
    
    @abstractmethod
    async def generate(self) -> Dict[str, Any]:
        """Generate next experiment config (changes from baseline)"""
        pass


class RandomHypothesisGenerator(HypothesisGenerator):
    """
    Mock hypothesis generator with bounded random hyperparameter sampling.
    
    For Phase 3.1, generates realistic hyperparameter ranges.
    Later phases can implement smarter strategies (Bayesian, BOHB, etc).
    """
    
    # Realistic parameter bounds
    PARAM_BOUNDS = {
        "learning_rate": (1e-5, 1e-3),          # 0.00001 to 0.001
        "per_device_batch_size": (2, 16),        # 2 to 16
        "gradient_accumulation_steps": (1, 8),   # 1 to 8
        "num_epochs": (1, 3),                    # 1 to 3 epochs
        "lora_r": (8, 32),                       # LoRA rank: 8 to 32
        "lora_alpha": (16, 64),                  # LoRA alpha: 16 to 64
        "lora_dropout": (0.01, 0.2),             # LoRA dropout: 0.01 to 0.2
    }
    
    def __init__(self, seed: Optional[int] = None):
        """Initialize generator with optional seed for reproducibility"""
        if seed is not None:
            random.seed(seed)
    
    async def generate(self) -> Dict[str, Any]:
        """Generate random config within bounds"""
        config = {}
        
        # Sample continuous and discrete parameters
        config["learning_rate"] = random.uniform(*self.PARAM_BOUNDS["learning_rate"])
        config["per_device_batch_size"] = random.randint(
            *self.PARAM_BOUNDS["per_device_batch_size"]
        )
        config["gradient_accumulation_steps"] = random.randint(
            *self.PARAM_BOUNDS["gradient_accumulation_steps"]
        )
        config["num_epochs"] = random.randint(*self.PARAM_BOUNDS["num_epochs"])
        config["lora_r"] = random.randint(*self.PARAM_BOUNDS["lora_r"])
        config["lora_alpha"] = random.randint(*self.PARAM_BOUNDS["lora_alpha"])
        config["lora_dropout"] = random.uniform(*self.PARAM_BOUNDS["lora_dropout"])
        
        return config


class ExperimentRunner:
    """
    Core autoresearch loop adapted for QLoRA fine-tuning.
    
    Orchestrates the generation, training, evaluation, and decision-making
    for autonomous hyperparameter tuning.
    """
    
    def __init__(
        self,
        trainer: QLORATrainer,
        evaluator: EvaluationHarness,
        store: ExperimentStore,
        hypothesis_generator: HypothesisGenerator,
        train_dataset: Dataset,
        eval_dataset: Optional[Dataset] = None,
        checkpoint_dir: Optional[Path] = None,
        primary_metric: str = "val_loss",
    ):
        """
        Initialize experiment runner.
        
        Args:
            trainer: QLORATrainer instance configured with model
            evaluator: EvaluationHarness with pinned validation set
            store: ExperimentStore for persistence
            hypothesis_generator: HypothesisGenerator for config generation
            train_dataset: Training dataset
            eval_dataset: Optional evaluation dataset
            checkpoint_dir: Where to cache experiment checkpoints
            primary_metric: Metric to optimize ("val_loss", "val_bpb", etc)
        """
        self.trainer = trainer
        self.evaluator = evaluator
        self.store = store
        self.hypothesis_gen = hypothesis_generator
        self.train_dataset = train_dataset
        self.eval_dataset = eval_dataset
        self.primary_metric = primary_metric
        
        # Checkpoint management
        self.checkpoint_dir = Path(checkpoint_dir) if checkpoint_dir else Path(".checkpoints")
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        
        # State tracking
        self.running_best: Optional[Experiment] = None
        self.experiment_count = 0
        
        logger.info(
            f"✓ ExperimentRunner initialized | "
            f"Metric: {primary_metric} | "
            f"Checkpoint dir: {self.checkpoint_dir}"
        )
    
    async def run_loop(
        self,
        run_tag: str,
        max_experiments: Optional[int] = None,
        time_budget_seconds: float = 3600.0,
    ) -> AsyncGenerator[Experiment, None]:
        """
        Run experiments indefinitely or up to max_experiments.
        
        Args:
            run_tag: Tag for grouping experiments (e.g., "autoresearch/jun15")
            max_experiments: Max experiments to run (None = infinite)
            time_budget_seconds: Wall-clock timeout per experiment
        
        Yields:
            Completed Experiment record after each iteration
        
        Raises:
            KeyboardInterrupt: Gracefully handled - saves state and exits
        """
        logger.info(
            f"🚀 Starting autoresearch loop | "
            f"run_tag={run_tag} | "
            f"max_experiments={max_experiments or '∞'} | "
            f"time_budget={time_budget_seconds}s"
        )
        
        try:
            experiment_num = 1
            while max_experiments is None or experiment_num <= max_experiments:
                try:
                    logger.info(f"\n{'='*80}")
                    logger.info(f"[Exp {experiment_num}] Starting experiment...")
                    
                    experiment = await self._run_single_experiment(
                        run_tag=run_tag,
                        experiment_num=experiment_num,
                        time_budget_seconds=time_budget_seconds,
                    )
                    
                    yield experiment
                    experiment_num += 1
                    
                except Exception as e:
                    logger.error(f"[Exp {experiment_num}] Unexpected error: {e}", exc_info=True)
                    experiment_num += 1
                    continue
        
        except KeyboardInterrupt:
            logger.info("\n⏸  Autoresearch paused (KeyboardInterrupt)")
            if self.running_best:
                logger.info(
                    f"Best so far: {self.running_best.config} | "
                    f"{self.primary_metric}={self.running_best.primary_metric:.4f}"
                )
            raise
    
    async def _run_single_experiment(
        self,
        run_tag: str,
        experiment_num: int,
        time_budget_seconds: float,
    ) -> Experiment:
        """
        Execute one experiment: generate → train → evaluate → decide.
        
        Args:
            run_tag: Experiment group tag
            experiment_num: Experiment sequence number
            time_budget_seconds: Wall-clock timeout for training
        
        Returns:
            Completed Experiment record
        """
        experiment_id = str(uuid.uuid4())
        
        try:
            # Step 1: Generate hypothesis
            logger.info(f"[{experiment_id}] Step 1: Generating hypothesis...")
            hypothesis = await self.hypothesis_gen.generate()
            description = self._summarize_config(hypothesis)
            logger.info(f"[{experiment_id}] Hypothesis: {description}")
            
            # Step 2: Create experiment record (PENDING)
            logger.info(f"[{experiment_id}] Step 2: Creating experiment record...")
            experiment = self.store.create(
                run_tag=run_tag,
                config=hypothesis,
                description=description,
                parent_experiment_id=self.running_best.id if self.running_best else None,
            )
            
            # Update with lineage info
            changes = self._compute_config_diff(hypothesis)
            if changes:
                self.store.update(experiment.id, changes_from_parent=changes)
                experiment = self.store.get(experiment.id)
            
            logger.info(f"[{experiment_id}] Record created")
            
            # Get the experiment ID from the created record
            experiment_id = experiment.id
            
            # Step 3: Train with time budget (RUNNING → train)
            experiment.status = ExperimentStatus.RUNNING
            experiment.started_at = datetime.utcnow()
            self.store.update(experiment_id, 
                status=ExperimentStatus.RUNNING,
                started_at=experiment.started_at,
            )
            
            logger.info(f"[{experiment_id}] Step 3: Training (budget: {time_budget_seconds}s)...")
            
            # Apply config to trainer
            save_dir = str(self.checkpoint_dir / experiment_id)
            
            try:
                # Run training with wall-clock timeout
                train_result = await asyncio.wait_for(
                    self.trainer.train(
                        train_dataset=self.train_dataset,
                        eval_dataset=self.eval_dataset,
                        num_epochs=hypothesis.get("num_epochs", 1),
                        learning_rate=hypothesis.get("learning_rate", 4e-4),
                        per_device_batch_size=hypothesis.get("per_device_batch_size", 4),
                        gradient_accumulation_steps=hypothesis.get("gradient_accumulation_steps", 2),
                        save_dir=save_dir,
                        run_name=f"exp-{experiment_id[:8]}",
                    ),
                    timeout=time_budget_seconds,
                )
                
                experiment.training_seconds = train_result.get("duration_seconds", 0.0)
                experiment.total_seconds = (datetime.utcnow() - experiment.started_at).total_seconds()
                logger.info(f"[{experiment_id}] ✓ Training complete ({experiment.training_seconds:.1f}s)")
            
            except asyncio.TimeoutError:
                logger.warning(f"[{experiment_id}] ⏱  Training timeout ({time_budget_seconds}s)")
                await self._handle_crash(experiment_id, TimeoutError("Training exceeded time budget"))
                return self.store.get(experiment_id)
            
            # Step 4: Evaluate
            logger.info(f"[{experiment_id}] Step 4: Evaluating...")
            try:
                # Load checkpoint and evaluate
                checkpoint_path = Path(save_dir) / f"exp-{experiment_id[:8]}" / "adapter"
                if not checkpoint_path.exists():
                    logger.error(f"[{experiment_id}] Checkpoint not found at {checkpoint_path}")
                    await self._handle_crash(
                        experiment_id,
                        FileNotFoundError(f"Checkpoint not found: {checkpoint_path}")
                    )
                    return self.store.get(experiment_id)
                
                # Evaluate checkpoint
                metrics = await self.evaluator.evaluate(str(checkpoint_path))
                experiment.val_loss = metrics.get("val_loss")
                experiment.val_bpb = metrics.get("val_bpb")
                experiment.primary_metric = metrics.get(self.primary_metric)
                experiment.secondary_metrics = {
                    k: v for k, v in metrics.items()
                    if k not in ["val_loss", "val_bpb", self.primary_metric]
                }
                
                logger.info(
                    f"[{experiment_id}] ✓ Evaluation complete | "
                    f"{self.primary_metric}={experiment.primary_metric:.4f}"
                )
            
            except Exception as e:
                logger.error(f"[{experiment_id}] Evaluation failed: {e}")
                await self._handle_crash(experiment_id, e)
                return self.store.get(experiment_id)
            
            # Step 5: Decide (keep or discard)
            logger.info(f"[{experiment_id}] Step 5: Decision logic...")
            decision = self._decide(
                metrics={self.primary_metric: experiment.primary_metric},
                experiment_num=experiment_num,
            )
            
            experiment.status = decision
            experiment.completed_at = datetime.utcnow()
            
            if decision == ExperimentStatus.KEEP:
                logger.info(
                    f"[{experiment_id}] ✓ KEEP | "
                    f"{self.primary_metric}={experiment.primary_metric:.4f} | "
                    f"Checkpoint: {save_dir}"
                )
                self.running_best = experiment
            else:  # DISCARD
                logger.info(
                    f"[{experiment_id}] ✗ DISCARD | "
                    f"{self.primary_metric}={experiment.primary_metric:.4f}"
                )
                # Clean up checkpoint to save space
                self._cleanup_checkpoint(experiment_id)
            
            # Step 6: Update record
            self.store.update(experiment_id, 
                status=decision,
                completed_at=experiment.completed_at,
                val_loss=experiment.val_loss,
                val_bpb=experiment.val_bpb,
                primary_metric=experiment.primary_metric,
                secondary_metrics=experiment.secondary_metrics,
                training_seconds=experiment.training_seconds,
                total_seconds=experiment.total_seconds,
            )
            
            self.experiment_count += 1
            
            # Log progress
            self._log_progress(experiment_num)
            
            return experiment
        
        except Exception as e:
            logger.error(f"[{experiment_id}] Fatal error: {e}", exc_info=True)
            await self._handle_crash(experiment_id, e)
            return self.store.get(experiment_id)
    
    def _decide(
        self,
        metrics: Dict[str, float],
        experiment_num: int,
        primary_metric: Optional[str] = None,
    ) -> ExperimentStatus:
        """
        Autoresearch decision: keep or discard based on metric improvement.
        
        Rule: If primary metric improved (lower for val_loss/val_bpb), keep.
        Otherwise discard.
        
        Args:
            metrics: Dictionary with {metric_name: value}
            experiment_num: For logging
            primary_metric: Override primary metric name
        
        Returns:
            ExperimentStatus.KEEP or ExperimentStatus.DISCARD
        """
        metric_name = primary_metric or self.primary_metric
        new_value = metrics.get(metric_name)
        
        if new_value is None:
            logger.warning(f"Primary metric '{metric_name}' not found in metrics")
            return ExperimentStatus.DISCARD
        
        # First experiment is always kept (becomes baseline)
        if self.running_best is None:
            logger.info(f"First experiment | {metric_name}={new_value:.4f} (baseline)")
            return ExperimentStatus.KEEP
        
        current_best = self.running_best.primary_metric
        
        # For metrics like val_loss and val_bpb, lower is better
        if new_value < current_best:
            improvement_pct = (current_best - new_value) / abs(current_best) * 100
            logger.info(
                f"Improved | {metric_name}: {current_best:.4f} → {new_value:.4f} "
                f"(+{improvement_pct:.2f}%)"
            )
            return ExperimentStatus.KEEP
        else:
            degradation_pct = (new_value - current_best) / abs(current_best) * 100
            logger.info(
                f"No improvement | {metric_name}: {current_best:.4f} vs {new_value:.4f} "
                f"({degradation_pct:+.2f}%)"
            )
            return ExperimentStatus.DISCARD
    
    async def _handle_crash(self, experiment_id: str, error: Exception) -> None:
        """
        Handle training crash: mark as CRASH and cleanup.
        
        Args:
            experiment_id: Experiment that crashed
            error: Exception that caused crash
        """
        logger.error(f"[{experiment_id}] Crash handling: {type(error).__name__}: {error}")
        
        # Update status to CRASH
        self.store.update(experiment_id, 
            status=ExperimentStatus.CRASH,
            completed_at=datetime.utcnow(),
        )
        
        # Clean up partial checkpoint
        self._cleanup_checkpoint(experiment_id)
        
        logger.info(f"[{experiment_id}] ✓ Cleanup complete")
    
    def _cleanup_checkpoint(self, experiment_id: str) -> None:
        """Remove checkpoint directory to save space"""
        checkpoint_path = self.checkpoint_dir / experiment_id
        if checkpoint_path.exists():
            try:
                shutil.rmtree(checkpoint_path)
                logger.info(f"✓ Removed checkpoint: {checkpoint_path}")
            except Exception as e:
                logger.warning(f"Failed to remove checkpoint: {e}")
    
    def _summarize_config(self, config: Dict[str, Any], max_length: int = 60) -> str:
        """Create human-readable config summary"""
        parts = []
        for k, v in config.items():
            if isinstance(v, float):
                parts.append(f"{k}={v:.2e}")
            else:
                parts.append(f"{k}={v}")
        
        summary = " | ".join(parts)
        if len(summary) > max_length:
            summary = summary[:max_length] + "..."
        
        return summary
    
    def _compute_config_diff(self, new_config: Dict[str, Any]) -> str:
        """Compute changes from running best config"""
        if self.running_best is None:
            return "Initial baseline"
        
        diffs = []
        old_config = self.running_best.config
        
        for key, new_val in new_config.items():
            old_val = old_config.get(key)
            if old_val is None:
                diffs.append(f"+{key}={new_val}")
            elif old_val != new_val:
                diffs.append(f"{key}: {old_val} → {new_val}")
        
        for key in old_config:
            if key not in new_config:
                diffs.append(f"-{key}")
        
        return " | ".join(diffs) if diffs else "No changes from parent"
    
    def _log_progress(self, experiment_num: int) -> None:
        """Log progress summary"""
        if self.running_best:
            logger.info(
                f"\n📊 Progress: {experiment_num} experiments | "
                f"Best {self.primary_metric}={self.running_best.primary_metric:.4f} "
                f"(exp {self.experiment_count} of {experiment_num})"
            )
