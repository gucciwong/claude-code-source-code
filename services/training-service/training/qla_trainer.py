"""
QLoRA Fine-tuning Trainer
Lightweight parameter-efficient model adaptation using LoRA
"""

import os
import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from pathlib import Path

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset

logger = logging.getLogger(__name__)


class QLORATrainer:
    """QLoRA fine-tuning with memory optimization"""
    
    def __init__(
        self,
        base_model_id: str,
        device: str = "auto",
        device_map: str = "auto",
        output_dir: Optional[str] = None,
    ):
        """
        Initialize QLoRA trainer
        
        Args:
            base_model_id: HuggingFace model ID (e.g., 'mistral-7b')
            device: 'auto' | 'cuda' | 'cpu' | 'mps'
            device_map: 'auto' | 'cpu' | 'cuda:0' | 'cuda:1' etc.
            output_dir: Where to save adapters
        """
        self.base_model_id = base_model_id
        self.device = self._resolve_device(device)
        self.device_map = device_map
        self.output_dir = output_dir or "./models"
        
        self.model = None
        self.tokenizer = None
        self.latest_adapter_path = None
        
        logger.info(f"QLoRA Trainer initialized - Device: {self.device}, Model: {base_model_id}")
    
    @staticmethod
    def _resolve_device(device: str) -> str:
        """Resolve device string to actual device"""
        if device == "auto":
            if torch.cuda.is_available():
                return "cuda"
            elif torch.backends.mps.is_available():
                return "mps"
            else:
                return "cpu"
        return device
    
    def _get_bnb_config(self) -> Optional[BitsAndBytesConfig]:
        """Get 4-bit quantization config"""
        if self.device == "cpu":
            return None  # Can't do 4-bit quant on CPU
        
        return BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
    
    def load_model(self) -> Tuple:
        """Load model and tokenizer with 4-bit quantization"""
        
        logger.info(f"Loading {self.base_model_id}...")
        
        # Load quantization config
        bnb_config = self._get_bnb_config()
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.base_model_id,
            quantization_config=bnb_config,
            device_map=self.device_map,
            torch_dtype=torch.float32 if self.device == "cpu" else torch.bfloat16,
            trust_remote_code=True,
        )
        
        # Prepare for training if quantized
        if bnb_config:
            self.model = prepare_model_for_kbit_training(self.model)
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.base_model_id)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Count parameters
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        logger.info(f"✓ Model loaded - Total: {total_params:,}, Trainable: {trainable_params:,}")
        
        return self.model, self.tokenizer
    
    def apply_lora(self, lora_config: Optional[LoraConfig] = None) -> None:
        """Apply LoRA adapters to model"""
        
        if self.model is None:
            raise RuntimeError("Load model first via load_model()")
        
        if lora_config is None:
            lora_config = LoraConfig(
                r=16,
                lora_alpha=32,
                lora_dropout=0.05,
                bias="none",
                task_type="CAUSAL_LM",
                target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
            )
        
        logger.info(f"Applying LoRA - r={lora_config.r}, alpha={lora_config.lora_alpha}")
        
        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()
    
    def prepare_dataset(
        self,
        dataset: Dataset,
        max_seq_length: int = 512,
    ) -> Dataset:
        """Prepare dataset for training"""
        
        def format_sample(sample):
            """Format completion sample for training"""
            text = f"{sample['prompt']}{sample['completion']}"
            return {"text": text}
        
        # Format
        dataset = dataset.map(
            format_sample,
            remove_columns=["prompt", "completion", "language", "file_path", "model_id"],
            batched=False,
        )
        
        # Tokenize
        def tokenize(batch):
            return self.tokenizer(
                batch["text"],
                truncation=True,
                max_length=max_seq_length,
                padding="max_length",
            )
        
        dataset = dataset.map(
            tokenize,
            batched=True,
            remove_columns=["text"],
            desc="Tokenizing",
        )
        
        logger.info(f"✓ Dataset prepared - {len(dataset)} samples")
        
        return dataset
    
    async def train(
        self,
        train_dataset: Dataset,
        eval_dataset: Optional[Dataset] = None,
        num_epochs: int = 1,
        learning_rate: float = 4e-4,
        per_device_batch_size: int = 4,
        gradient_accumulation_steps: int = 2,
        warmup_steps: int = 10,
        save_dir: Optional[str] = None,
        run_name: str = "training",
    ) -> Dict[str, Any]:
        """
        Fine-tune model with QLoRA
        
        Args:
            train_dataset: HuggingFace Dataset with 'text' column
            eval_dataset: Optional evaluation dataset
            num_epochs: Number of training epochs
            learning_rate: Learning rate for training
            per_device_batch_size: Batch size per device
            gradient_accumulation_steps: Gradient accumulation steps
            warmup_steps: Warmup steps
            save_dir: Directory to save adapters
            run_name: Name for this training run
        
        Returns:
            Dictionary with training results and metrics
        """
        
        if self.model is None:
            self.load_model()
            self.apply_lora()
        
        save_dir = save_dir or os.path.join(self.output_dir, run_name)
        os.makedirs(save_dir, exist_ok=True)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=save_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=per_device_batch_size,
            per_device_eval_batch_size=per_device_batch_size,
            gradient_accumulation_steps=gradient_accumulation_steps,
            learning_rate=learning_rate,
            lr_scheduler_type="cosine",
            warmup_steps=warmup_steps,
            weight_decay=0.01,
            optim="paged_adamw_32bit",
            logging_steps=10,
            evaluation_strategy="steps" if eval_dataset else "no",
            eval_steps=50 if eval_dataset else None,
            save_strategy="steps",
            save_steps=100,
            save_total_limit=3,
            load_best_model_at_end=True if eval_dataset else False,
            report_to="none",  # No wandb/tensorboard
            remove_unused_columns=False,
            seed=42,
            max_grad_norm=0.3,
            max_steps=-1,
        )
        
        # For CPU or quick tests, reduce logging
        if self.device == "cpu":
            training_args.logging_steps = 100
            training_args.save_steps = 1000
        
        logger.info(f"Starting training - {len(train_dataset)} samples, {num_epochs} epochs")
        
        # Run training (in thread pool to not block)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._run_training,
            train_dataset,
            eval_dataset,
            training_args,
        )
        
        logger.info(f"✓ Training complete - Loss: {result['loss']:.4f}")
        
        return result
    
    def _run_training(
        self,
        train_dataset: Dataset,
        eval_dataset: Optional[Dataset],
        training_args: TrainingArguments,
    ) -> Dict[str, Any]:
        """Synchronous training function (runs in executor)"""
        
        from transformers import DataCollatorForLanguageModeling, Trainer
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
            callbacks=[],
        )
        
        # Train
        start_time = datetime.utcnow()
        train_result = trainer.train()
        duration_seconds = (datetime.utcnow() - start_time).total_seconds()
        
        # Save adapter
        adapter_path = os.path.join(training_args.output_dir, "adapter")
        self.model.save_pretrained(adapter_path)
        self.tokenizer.save_pretrained(adapter_path)
        self.latest_adapter_path = adapter_path
        
        # Eval if available
        eval_results = {}
        if eval_dataset:
            eval_results = trainer.evaluate()
        
        return {
            "loss": train_result.training_loss,
            "eval_loss": eval_results.get("eval_loss"),
            "duration_seconds": duration_seconds,
            "adapter_path": adapter_path,
            "num_train_steps": train_result.global_step,
            "metrics": {**train_result.metrics, **eval_results},
        }
    
    def save_adapter(self, adapter_path: Optional[str] = None) -> str:
        """Save current adapter weights"""
        
        if self.model is None:
            raise RuntimeError("No model loaded")
        
        adapter_path = adapter_path or self.latest_adapter_path
        if not adapter_path:
            raise RuntimeError("No adapter path specified")
        
        os.makedirs(adapter_path, exist_ok=True)
        self.model.save_pretrained(adapter_path)
        self.tokenizer.save_pretrained(adapter_path)
        
        logger.info(f"✓ Adapter saved to {adapter_path}")
        
        return adapter_path
    
    def merge_and_export(
        self,
        adapter_path: str,
        export_path: str,
    ) -> str:
        """Merge LoRA adapter with base model and export"""
        
        from peft import AutoPeftModelForCausalLM
        
        logger.info(f"Merging adapter from {adapter_path}...")
        
        # Load merged model
        model = AutoPeftModelForCausalLM.from_pretrained(
            adapter_path,
            device_map=self.device_map,
            torch_dtype=torch.float32 if self.device == "cpu" else torch.bfloat16,
        )
        
        # Merge
        merged_model = model.merge_and_unload()
        tokenizer = AutoTokenizer.from_pretrained(adapter_path)
        
        # Export
        os.makedirs(export_path, exist_ok=True)
        merged_model.save_pretrained(export_path)
        tokenizer.save_pretrained(export_path)
        
        logger.info(f"✓ Merged model exported to {export_path}")
        
        return export_path


if __name__ == "__main__":
    # Example usage
    trainer = QLORATrainer("mistral-7b")
    model, tokenizer = trainer.load_model()
    trainer.apply_lora()
    print("✓ Trainer ready for training")
