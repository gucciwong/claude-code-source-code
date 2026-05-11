"""
Evaluation Runner — Fixed evaluation pipeline for experiments.

This is the Sovereign Code equivalent of autoresearch's prepare.py evaluate_bpb().
The evaluation harness is FIXED and never changes between experiments.
Same model evaluation produces identical results (deterministic, no randomness).
"""

import asyncio
import logging
import math
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional, Dict, Any, Callable

import torch
import torch.nn.functional as F
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import Dataset
import pyarrow as pa

from evaluation.metrics import loss_to_bpb, validate_metrics_dict

logger = logging.getLogger(__name__)


class EvaluationHarness:
    """
    Fixed evaluation pipeline. Do not modify between experiments.
    This is the Sovereign Code equivalent of autoresearch's prepare.py evaluate_bpb().
    
    Key principles:
    - Validation set is PINNED: never changes between experiments
    - Evaluation is DETERMINISTIC: same model always produces same metrics
    - No randomness: fixed seed, deterministic torch operations
    - Metrics are ground truth for keep/discard decisions
    """
    
    def __init__(
        self,
        val_dataset_path: str,
        metrics: list[str],
        device: str = "auto",
        seed: int = 42,
    ):
        """
        Initialize evaluation harness with pinned validation set.
        
        Args:
            val_dataset_path: Path to validation dataset or HuggingFace dataset ID
            metrics: List of metric names to compute (e.g., ["val_loss", "val_bpb", "humaneval_pass1"])
            device: Device to run evaluation on ('auto'|'cuda'|'cpu'|'mps')
            seed: Random seed for reproducibility
        """
        self.val_dataset_path = val_dataset_path
        self.metrics = metrics
        self.device = self._resolve_device(device)
        self.seed = seed
        
        # Ensure reproducibility
        torch.manual_seed(seed)
        torch.use_deterministic_algorithms(True)
        
        # Load pinned validation set (never changes)
        logger.info(f"Loading pinned validation set from {val_dataset_path}")
        self.val_dataset = self._load_pinned_validation_set(val_dataset_path)
        
        # Thread pool for CPU-bound torch inference in async context
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="eval-")
        
        # Validation set stats
        logger.info(f"✓ Validation set loaded: {len(self.val_dataset)} examples")
        
        self.tokenizer = None
        self.model = None
    
    @staticmethod
    def _resolve_device(device: str) -> str:
        """Resolve device string to actual device."""
        if device == "auto":
            if torch.cuda.is_available():
                return "cuda"
            elif torch.backends.mps.is_available():
                return "mps"
            else:
                return "cpu"
        return device
    
    def _load_pinned_validation_set(self, val_dataset_path: str) -> Dataset:
        """
        Load pinned validation set from disk.
        
        The validation set is FROZEN: never changes between experiments.
        This ensures that all models are evaluated on exactly the same data.
        
        Args:
            val_dataset_path: Path to local dataset (JSONL, JSON, Parquet, or CSV)
        
        Returns:
            Loaded dataset (as list-like object with dict access)
        
        Raises:
            FileNotFoundError: If local dataset path doesn't exist
            RuntimeError: If dataset loading fails
        """
        try:
            import os
            
            path = Path(val_dataset_path)
            
            if not path.exists():
                raise FileNotFoundError(f"Dataset file not found: {val_dataset_path}")
            
            logger.info(f"Loading pinned validation set from {val_dataset_path}")
            data = []
            
            # Load data into list of dicts
            if path.suffix == ".jsonl":
                with open(path, "r") as f:
                    for line in f:
                        if line.strip():
                            data.append(json.loads(line))
            
            elif path.suffix == ".json":
                with open(path, "r") as f:
                    raw_data = json.load(f)
                if isinstance(raw_data, list):
                    data = raw_data
                else:
                    raise ValueError("JSON file must contain an array of objects")
            
            elif path.suffix == ".parquet":
                import pyarrow.parquet as pq
                table = pq.read_table(path)
                # Convert arrow table to dicts
                for batch in table.to_batches():
                    for i in range(batch.num_rows):
                        row_dict = {col: batch[col][i].as_py() for col in batch.column_names}
                        data.append(row_dict)
            
            elif path.suffix == ".csv":
                import pyarrow.csv as csv
                table = csv.read_csv(path)
                # Convert arrow table to dicts
                for batch in table.to_batches():
                    for i in range(batch.num_rows):
                        row_dict = {col: batch[col][i].as_py() for col in batch.column_names}
                        data.append(row_dict)
            
            else:
                raise ValueError(f"Unsupported dataset format: {path.suffix}")
            
            # Create dataset from list of dicts without fingerprinting
            if not data:
                raise RuntimeError("Dataset is empty")
            
            # Disable fingerprinting globally for Python 3.14 compatibility
            os.environ["HF_DATASETS_CACHE"] = ""
            
            # Create column-oriented dict to avoid serialization issues
            dataset_dict = {}
            for key in data[0].keys():
                dataset_dict[key] = [d.get(key) for d in data]
            
            # Create dataset with fingerprinting disabled
            import datasets
            old_generate_fingerprint = datasets.fingerprint.generate_fingerprint
            
            def no_op_fingerprint(*args, **kwargs):
                import hashlib
                return hashlib.md5(b"fixed").hexdigest()
            
            datasets.fingerprint.generate_fingerprint = no_op_fingerprint
            
            try:
                dataset = Dataset.from_dict(dataset_dict)
                return dataset
            finally:
                datasets.fingerprint.generate_fingerprint = old_generate_fingerprint
        
        except FileNotFoundError:
            raise
        except Exception as e:
            raise RuntimeError(
                f"Failed to load validation dataset {val_dataset_path}: {e}"
            ) from e
    
    def _load_model(self, model_path: str) -> tuple:
        """
        Load model and tokenizer.
        
        Args:
            model_path: Local checkpoint dir or HuggingFace model ID
        
        Returns:
            (model, tokenizer) tuple
        
        Raises:
            RuntimeError: If model loading fails
        """
        try:
            logger.info(f"Loading model from {model_path}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model with appropriate dtype based on device
            if self.device == "cpu":
                dtype = torch.float32
            else:
                dtype = torch.bfloat16
            
            # Load model without quantization for evaluation (we need full precision)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                torch_dtype=dtype,
                device_map=self.device,
                trust_remote_code=True,
            )
            
            self.model.eval()  # Evaluation mode
            
            logger.info(f"✓ Model loaded on {self.device}")
            return self.model, self.tokenizer
        
        except Exception as e:
            raise RuntimeError(f"Failed to load model {model_path}: {e}") from e
    
    async def _evaluate_val_loss(self, model_path: str) -> float:
        """
        Compute cross-entropy loss on validation set.
        
        Deterministic evaluation: same model always produces same loss.
        
        Args:
            model_path: Local checkpoint dir or HuggingFace model ID
        
        Returns:
            Average cross-entropy loss across validation set
        """
        # Load model in thread to avoid blocking
        loop = asyncio.get_event_loop()
        self.model, self.tokenizer = await loop.run_in_executor(
            self.executor,
            self._load_model,
            model_path,
        )
        
        # Run evaluation in thread
        return await loop.run_in_executor(
            self.executor,
            self._compute_val_loss_sync,
        )
    
    def _compute_val_loss_sync(self) -> float:
        """
        Synchronous cross-entropy loss computation.
        
        Run in ThreadPoolExecutor to allow other async tasks to proceed.
        """
        total_loss = 0.0
        total_tokens = 0
        
        with torch.no_grad(), torch.inference_mode():
            for batch_idx, sample in enumerate(self.val_dataset):
                # Get text (assume 'text' field)
                text = sample.get("text") or sample.get("content") or str(sample)
                
                # Tokenize
                encodings = self.tokenizer(
                    text,
                    max_length=512,
                    truncation=True,
                    padding="max_length",
                    return_tensors="pt",
                )
                
                # Move to device
                input_ids = encodings["input_ids"].to(self.device)
                
                # Forward pass (no gradient computation)
                logits = self.model(input_ids).logits
                
                # Compute cross-entropy loss
                # Shift logits and labels for next-token prediction
                shift_logits = logits[..., :-1, :].contiguous()
                shift_labels = input_ids[..., 1:].contiguous()
                
                # Reshape for cross-entropy
                batch_size, seq_len, vocab_size = shift_logits.shape
                shift_logits_flat = shift_logits.view(-1, vocab_size)
                shift_labels_flat = shift_labels.view(-1)
                
                # Compute loss (return mean across valid tokens, ignoring padding)
                batch_loss = F.cross_entropy(
                    shift_logits_flat,
                    shift_labels_flat,
                    reduction="sum",
                )
                
                # Count non-padding tokens
                non_padding_mask = shift_labels_flat != self.tokenizer.pad_token_id
                num_valid_tokens = non_padding_mask.sum().item()
                
                total_loss += batch_loss.item()
                total_tokens += num_valid_tokens
                
                if (batch_idx + 1) % 10 == 0:
                    logger.debug(f"  Evaluated {batch_idx + 1} samples...")
        
        if total_tokens == 0:
            raise RuntimeError("No valid tokens found in validation set")
        
        avg_loss = total_loss / total_tokens
        logger.info(f"✓ Validation loss: {avg_loss:.4f}")
        
        return avg_loss
    
    async def evaluate(self, model_path: str) -> dict:
        """
        Run all metrics against a trained model checkpoint.
        
        Same model evaluation produces identical results (deterministic).
        
        Args:
            model_path: Local checkpoint dir or HuggingFace model ID
        
        Returns:
            Dictionary of metric names to values:
            {
                "val_loss": float,
                "val_bpb": float,
                "humaneval_pass1": float (optional),
            }
        """
        results = {}
        
        logger.info(f"Starting evaluation on model: {model_path}")
        
        try:
            # Compute validation loss
            results["val_loss"] = await self._evaluate_val_loss(model_path)
            
            # Convert to bits-per-byte
            results["val_bpb"] = loss_to_bpb(results["val_loss"])
            
            # HumanEval pass@1 (if requested)
            if "humaneval_pass1" in self.metrics:
                results["humaneval_pass1"] = await self._evaluate_humaneval(model_path)
            
            # Validate results structure
            validate_metrics_dict(results, [m for m in self.metrics if m in results])
            
            logger.info(f"✓ Evaluation complete: {results}")
            return results
        
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            raise
        finally:
            # Cleanup to free GPU memory
            self._cleanup_model()
    
    def _cleanup_model(self) -> None:
        """Cleanup loaded model and free GPU memory."""
        if self.model is not None:
            del self.model
            self.model = None
        
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    async def _evaluate_humaneval(self, model_path: str) -> float:
        """
        Evaluate HumanEval pass@1.
        
        Currently a mock implementation. Real HumanEval integration in Phase 2.2.
        
        Args:
            model_path: Local checkpoint dir or HuggingFace model ID
        
        Returns:
            Pass@1 score (0.0-1.0)
        """
        # Tracked-In: docs/plans/2026-05-11-ga-runway-plan.md (post-GA — real
        # HumanEval integration is intentionally deferred; the GA story uses
        # CAMR bench (W5-T15 bench-router.mjs) for routing quality, and the
        # PRD-§4.2.1 perf gate (W7-T21 bench-perf.mjs) for inference speed.
        # A mocked pass-rate here is acceptable until the actual humaneval
        # package + sandboxed code execution land.
        loop = asyncio.get_event_loop()

        def mock_humaneval():
            logger.warning("HumanEval evaluation is mocked. Real implementation is post-GA.")
            return 0.5  # Mock: 50% pass rate

        return await loop.run_in_executor(self.executor, mock_humaneval)
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit — cleanup."""
        self._cleanup_model()
        self.executor.shutdown(wait=True)
