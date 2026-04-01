"""
Training Orchestrator
Manages 10-minute quick loops and 8-hour upgrade cycles
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uuid
from pathlib import Path

from datasets import Dataset

from training.qla_trainer import QLORATrainer
from training_data.store import TrainingDataStore
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class TrainingOrchestrator:
    """
    Orchestrate training loops:
    - "Quick train": Every 10 minutes, lightweight tuning on incremental data
    - "Full cycle": Every 48 quick trains (8 hours), full training on all data
    """
    
    def __init__(
        self,
        base_model_id: str,
        data_store: TrainingDataStore,
        output_dir: str = "./models",
        device: str = "auto",
    ):
        """
        Initialize orchestrator
        
        Args:
            base_model_id: HuggingFace model ID
            data_store: TrainingDataStore instance
            output_dir: Where to save adapters
            device: 'auto' | 'cuda' | 'cpu' | 'mps'
        """
        self.base_model_id = base_model_id
        self.data_store = data_store
        self.output_dir = output_dir
        self.device = device
        
        self.trainer = QLORATrainer(base_model_id, device=device)
        self.quick_train_count = 0
        self.last_quick_train = None
        self.last_full_train = None
        self.current_best_adapter = None
        
        logger.info(f"Orchestrator initialized - Model: {base_model_id}, Device: {device}")
    
    async def run_quick_train_loop(
        self,
        interval_minutes: int = 10,
        max_samples: int = 1000,
        min_samples: int = 100,
    ):
        """
        Run lightweight training loop every N minutes
        
        Args:
            interval_minutes: Time between training cycles
            max_samples: Maximum samples to use per cycle
            min_samples: Minimum samples needed to train
        """
        
        logger.info(f"Starting quick train loop ({interval_minutes} min interval)")
        
        while True:
            try:
                # Collect incremental data
                logger.info("Fetching incremental dataset...")
                dataset_list = self.data_store.get_incremental_dataset(
                    since=self.last_quick_train,
                    max_samples=max_samples,
                )
                
                if len(dataset_list) < min_samples:
                    logger.info(f"Only {len(dataset_list)} samples (need {min_samples}), skipping")
                    await asyncio.sleep(interval_minutes * 60)
                    continue
                
                # Convert to HF dataset
                dataset = Dataset.from_dict({
                    "prompt": [d["prompt"] for d in dataset_list],
                    "completion": [d["completion"] for d in dataset_list],
                    "language": [d["language"] for d in dataset_list],
                    "file_path": [d.get("file_path") for d in dataset_list],
                    "model_id": [d.get("model_id") for d in dataset_list],
                })
                
                # Prepare dataset
                dataset = self.trainer.prepare_dataset(dataset, max_seq_length=512)
                
                # Train
                logger.info(f"Quick train #{self.quick_train_count + 1} on {len(dataset)} samples...")
                result = await self.trainer.train(
                    train_dataset=dataset,
                    num_epochs=1,
                    learning_rate=4e-4,
                    per_device_batch_size=4,
                    gradient_accumulation_steps=2,
                    warmup_steps=10,
                    save_dir=f"{self.output_dir}/quick_{self.quick_train_count}",
                    run_name=f"quick_{self.quick_train_count}",
                )
                
                # Validate results
                if result.get("loss", float("inf")) > 10.0:
                    logger.warning(f"Training loss too high ({result['loss']:.2f}), skipping")
                    await asyncio.sleep(interval_minutes * 60)
                    continue
                
                # Record training run
                run_id = self.data_store.add_training_run(
                    run_type="quick",
                    base_model_id=self.base_model_id,
                    samples_used=len(dataset),
                    train_size=len(dataset),
                    eval_size=0,
                )
                
                self.data_store.update_training_run(
                    run_id=run_id,
                    status="completed",
                    loss=result["loss"],
                    duration_seconds=result["duration_seconds"],
                    adapter_path=result["adapter_path"],
                )
                
                # Update state
                self.current_best_adapter = result["adapter_path"]
                self.last_quick_train = datetime.utcnow()
                self.quick_train_count += 1
                
                logger.info(
                    f"✓ Quick train #{self.quick_train_count} done - "
                    f"Loss: {result['loss']:.4f}, Time: {result['duration_seconds']:.1f}s"
                )
                
            except Exception as e:
                logger.error(f"Quick train failed: {e}", exc_info=True)
            
            # Sleep before next iteration
            await asyncio.sleep(interval_minutes * 60)
    
    async def run_full_train_cycle(
        self,
        min_quick_trains: int = 48,
        min_improvement_pct: float = 1.0,
    ):
        """
        Run full training cycle after N quick trains
        
        Args:
            min_quick_trains: Number of quick trains before full cycle
            min_improvement_pct: Minimum improvement % to publish
        """
        
        logger.info(f"Starting full train cycle monitor (threshold: {min_quick_trains} quick trains)")
        
        while True:
            try:
                # Wait for threshold
                while self.quick_train_count < min_quick_trains:
                    await asyncio.sleep(60)  # Check every 1 min
                
                logger.info("Starting full training cycle...")
                
                # Collect all training data
                dataset_list = self.data_store.get_all_dataset_since(
                    since=self.last_full_train,
                )
                
                if len(dataset_list) < 500:
                    logger.warning(f"Only {len(dataset_list)} samples, need more data")
                    await asyncio.sleep(3600)  # Wait 1 hour
                    continue
                
                # Split into train/eval
                dataset = Dataset.from_dict({
                    "prompt": [d["prompt"] for d in dataset_list],
                    "completion": [d["completion"] for d in dataset_list],
                    "language": [d["language"] for d in dataset_list],
                    "file_path": [d.get("file_path") for d in dataset_list],
                    "model_id": [d.get("model_id") for d in dataset_list],
                })
                
                split = dataset.train_test_split(test_size=0.1, seed=42)
                
                # Prepare datasets
                train_dataset = self.trainer.prepare_dataset(split["train"])
                eval_dataset = self.trainer.prepare_dataset(split["test"])
                
                # Full training
                logger.info(f"Full training on {len(train_dataset)} train + {len(eval_dataset)} eval samples...")
                result = await self.trainer.train(
                    train_dataset=train_dataset,
                    eval_dataset=eval_dataset,
                    num_epochs=3,
                    learning_rate=2e-4,
                    per_device_batch_size=2,
                    gradient_accumulation_steps=4,
                    warmup_steps=100,
                    save_dir=f"{self.output_dir}/full_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                    run_name="full_cycle",
                )
                
                # Benchmark against baseline (simplified - just check loss improvement)
                baseline_loss = 5.0  # TODO: fetch actual baseline
                improvement_pct = ((baseline_loss - result["loss"]) / baseline_loss) * 100
                
                logger.info(f"Full training complete - Loss: {result['loss']:.4f}, Improvement: {improvement_pct:.1f}%")
                
                # Promote to production if improved
                if improvement_pct > min_improvement_pct:
                    self.current_best_adapter = result["adapter_path"]
                    logger.info(f"✓ New model version published! (+{improvement_pct:.1f}% improvement)")
                else:
                    logger.info(f"No significant improvement, keeping current model")
                
                # Record training run
                run_id = self.data_store.add_training_run(
                    run_type="full",
                    base_model_id=self.base_model_id,
                    samples_used=len(dataset),
                    train_size=len(train_dataset),
                    eval_size=len(eval_dataset),
                )
                
                self.data_store.update_training_run(
                    run_id=run_id,
                    status="completed",
                    loss=result["loss"],
                    eval_loss=result.get("eval_loss"),
                    duration_seconds=result["duration_seconds"],
                    adapter_path=result["adapter_path"],
                )
                
                # Reset counters
                self.last_full_train = datetime.utcnow()
                self.quick_train_count = 0
                
            except Exception as e:
                logger.error(f"Full train cycle failed: {e}", exc_info=True)
                await asyncio.sleep(3600)  # Wait before retry
    
    async def run_all(self, quick_train_interval: int = 10):
        """
        Run both training loops concurrently
        
        Args:
            quick_train_interval: Minutes between quick trains
        """
        
        logger.info("Starting orchestrator - running quick + full training loops")
        
        # Run both loops concurrently
        quick_task = asyncio.create_task(
            self.run_quick_train_loop(interval_minutes=quick_train_interval)
        )
        full_task = asyncio.create_task(
            self.run_full_train_cycle()
        )
        
        # Run until cancelled
        try:
            await asyncio.gather(quick_task, full_task)
        except asyncio.CancelledError:
            logger.info("Orchestrator cancelled")
            quick_task.cancel()
            full_task.cancel()
            raise
    
    def get_status(self) -> Dict[str, Any]:
        """Get current orchestrator status"""
        
        return {
            "base_model": self.base_model_id,
            "device": self.device,
            "quick_train_count": self.quick_train_count,
            "last_quick_train": self.last_quick_train.isoformat() if self.last_quick_train else None,
            "last_full_train": self.last_full_train.isoformat() if self.last_full_train else None,
            "current_best_adapter": self.current_best_adapter,
            "next_full_train_in": abs(48 - self.quick_train_count) if self.quick_train_count < 48 else 0,
        }


if __name__ == "__main__":
    # Example usage (requires data store)
    logging.basicConfig(level=logging.INFO)
    
    # Would need: data_store = TrainingDataStore(db_session)
    # orchestrator = TrainingOrchestrator("mistral-7b", data_store)
    # asyncio.run(orchestrator.run_all())
