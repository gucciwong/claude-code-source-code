"""
Training Configuration Profiles
Different configurations for quick vs. full training cycles
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class LoraConfig:
    """LoRA adapter configuration"""
    r: int = 16  # Rank
    lora_alpha: int = 32  # Alpha (scaling)
    lora_dropout: float = 0.05
    bias: str = "none"  # "none" | "all" | "lora_only"
    task_type: str = "CAUSAL_LM"
    target_modules: List[str] = None
    
    def __post_init__(self):
        if self.target_modules is None:
            self.target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]


@dataclass
class QuickTrainConfig:
    """Configuration for 10-minute quick training loops"""
    
    num_epochs: int = 1
    learning_rate: float = 4e-4
    lr_scheduler_type: str = "cosine"
    warmup_steps: int = 10
    weight_decay: float = 0.01
    per_device_train_batch_size: int = 4
    per_device_eval_batch_size: int = 4
    gradient_accumulation_steps: int = 2
    max_seq_length: int = 512
    max_samples: int = 1000
    min_samples: int = 100
    
    # LoRA settings
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    target_modules: List[str] = None
    
    # Optimization
    optim: str = "paged_adamw_32bit"
    max_grad_norm: float = 0.3
    seed: int = 42
    
    # Validation
    min_loss_threshold: float = 10.0  # Skip if loss exceeds this
    
    def __post_init__(self):
        if self.target_modules is None:
            self.target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]
    
    def to_dict(self):
        return {
            k: v for k, v in self.__dict__.items()
            if not k.startswith("_")
        }


@dataclass
class FullTrainConfig:
    """Configuration for 8-hour full training cycles"""
    
    num_epochs: int = 3
    learning_rate: float = 2e-4
    lr_scheduler_type: str = "cosine"
    warmup_steps: int = 100
    weight_decay: float = 0.01
    per_device_train_batch_size: int = 2
    per_device_eval_batch_size: int = 2
    gradient_accumulation_steps: int = 4
    max_seq_length: int = 512
    
    # Train/eval split
    eval_split_ratio: float = 0.1
    min_train_samples: int = 500
    
    # LoRA settings
    lora_r: int = 32
    lora_alpha: int = 64
    lora_dropout: float = 0.05
    target_modules: List[str] = None
    
    # Optimization
    optim: str = "paged_adamw_32bit"
    max_grad_norm: float = 0.3
    seed: int = 42
    
    # Quality gate
    min_improvement_pct: float = 1.0  # Publish if >1% improvement
    
    def __post_init__(self):
        if self.target_modules is None:
            self.target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"]
    
    def to_dict(self):
        return {
            k: v for k, v in self.__dict__.items()
            if not k.startswith("_")
        }


@dataclass
class BenchmarkConfig:
    """Benchmarking configuration"""
    
    # HumanEval
    humaneval_enabled: bool = True
    humaneval_num_problems: int = 30  # Quick: 30, Full: 164
    humaneval_timeout_s: int = 10
    
    # MBPP
    mbpp_enabled: bool = True
    mbpp_num_problems: int = 50  # Quick: 50, Full: 500
    mbpp_timeout_s: int = 10
    
    # Custom (user codebase)
    custom_enabled: bool = False
    custom_test_files: Optional[List[str]] = None
    
    # Execution
    use_docker: bool = False
    docker_image: str = "python:3.10-slim"
    max_workers: int = 4
    
    def to_dict(self):
        return {
            k: v for k, v in self.__dict__.items()
            if not k.startswith("_")
        }


# Presets for common scenarios

QUICK_TRAIN_PRESET = QuickTrainConfig(
    num_epochs=1,
    learning_rate=4e-4,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=2,
    warmup_steps=10,
    lora_r=16,
    max_samples=1000,
    min_samples=100,
)

FULL_TRAIN_PRESET = FullTrainConfig(
    num_epochs=3,
    learning_rate=2e-4,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    warmup_steps=100,
    lora_r=32,
    min_improvement_pct=1.0,
    min_train_samples=500,
)

QUICK_BENCHMARK_PRESET = BenchmarkConfig(
    humaneval_num_problems=30,
    mbpp_num_problems=50,
    max_workers=2,
)

FULL_BENCHMARK_PRESET = BenchmarkConfig(
    humaneval_num_problems=164,
    mbpp_num_problems=500,
    max_workers=4,
)

# CPU-friendly presets for development

QUICK_TRAIN_CPU_PRESET = QuickTrainConfig(
    num_epochs=1,
    learning_rate=2e-4,
    per_device_train_batch_size=1,  # Smaller batch
    gradient_accumulation_steps=8,  # More accumulation
    warmup_steps=5,
    lora_r=8,  # Smaller rank
    max_samples=200,
    min_samples=50,
)

FULL_TRAIN_CPU_PRESET = FullTrainConfig(
    num_epochs=1,  # Fewer epochs
    learning_rate=1e-4,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=8,
    warmup_steps=50,
    lora_r=16,  # Smaller rank
    min_train_samples=200,
)

QUICK_BENCHMARK_CPU_PRESET = BenchmarkConfig(
    humaneval_num_problems=10,  # Just 10 problems
    mbpp_num_problems=20,
    max_workers=1,
)


def get_config(preset: str) -> dict:
    """Get configuration preset by name"""
    
    presets = {
        "quick": QUICK_TRAIN_PRESET,
        "full": FULL_TRAIN_PRESET,
        "quick-cpu":QUICK_TRAIN_CPU_PRESET,
        "full-cpu": FULL_TRAIN_CPU_PRESET,
        "benchmark-quick": QUICK_BENCHMARK_PRESET,
        "benchmark-full": FULL_BENCHMARK_PRESET,
        "benchmark-quick-cpu": QUICK_BENCHMARK_CPU_PRESET,
    }
    
    config = presets.get(preset)
    if not config:
        raise ValueError(f"Unknown preset: {preset}. Available: {list(presets.keys())}")
    
    return config.to_dict() if hasattr(config, "to_dict") else config


if __name__ == "__main__":
    # Example: print all presets
    print("Quick Train Config:")
    print(QUICK_TRAIN_PRESET.to_dict())
    print("\nFull Train Config:")
    print(FULL_TRAIN_PRESET.to_dict())
    print("\nBenchmark Config:")
    print(QUICK_BENCHMARK_PRESET.to_dict())
