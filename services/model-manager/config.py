"""
Configuration for Sovereign Code Model Manager
"""

import os
from typing import List, Dict, Any

# === General Configuration ===
SERVICE_NAME = "Sovereign Code Model Manager"
SERVICE_VERSION = "0.2.0"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# === Huggingface Configuration ===
HF_TOKEN = os.getenv("HF_TOKEN", "")

# Support for Huggingface mirrors (for China access)
# Options: "huggingface", "mirror" (hf-mirror.com)
HF_MIRROR = os.getenv("HF_MIRROR", "huggingface").lower()

if HF_MIRROR == "mirror":
    # Chinese mirror - https://hf-mirror.com
    HF_API_ENDPOINT = "https://hf-mirror.com/api"
    HF_ENDPOINT = "https://hf-mirror.com"
    # Mirror uses same Huggingface models
else:
    # Official Huggingface
    HF_API_ENDPOINT = "https://huggingface.co/api"
    HF_ENDPOINT = "https://huggingface.co"

# Also support HUGGINGFACE_HUB_ENDPOINT env var (used by transformers library)
os.environ["HUGGINGFACE_HUB_ENDPOINT"] = os.getenv("HUGGINGFACE_HUB_ENDPOINT", HF_ENDPOINT)

# === Model Cache Configuration ===
MODEL_CACHE_PATH = os.getenv("MODEL_CACHE_PATH", "./models")
MAX_CACHE_GB = int(os.getenv("MAX_CACHE_GB", "50"))
AUTO_CLEANUP_PERCENT = 0.85  # Trigger cleanup at 85% of max

# === Inference Configuration ===
DEVICE = os.getenv("DEVICE", "cuda")  # cpu, cuda, mps, auto
DEVICE_MAP = os.getenv("DEVICE_MAP", "auto")  # auto, cpu, cuda, sequential
USE_QUANTIZATION = os.getenv("USE_QUANTIZATION", "false").lower() == "true"
QUANTIZATION_TYPE = os.getenv("QUANTIZATION_TYPE", "int8")  # int8, int4, fp32

# === Streaming Configuration ===
MAX_TOKENS = 2048
STREAMING_CHUNK_SIZE = 20  # tokens per stream chunk

# === Popular Models Registry ===
# Pre-curated models for easy selection
POPULAR_MODELS = {
    "7B Lightweight": [
        {
            "id": "mistralai/Mistral-7B-Instruct-v0.1",
            "name": "Mistral 7B Instruct",
            "size_gb": 14,
            "quantizations": ["fp32", "int8", "int4"]
        },
        {
            "id": "NousResearch/Nous-Hermes-2-7b-DPO",
            "name": "Nous Hermes 2 7B",
            "size_gb": 14,
            "quantizations": ["fp32", "int8", "int4"]
        },
    ],
    "13B Balanced": [
        {
            "id": "TheBloke/neural-chat-7B-v3-1-GGUF",
            "name": "Neural Chat 7B",
            "size_gb": 14,
            "quantizations": ["int4"]
        },
    ],
    "70B Powerful": [
        {
            "id": "meta-llama/Llama-2-70b-chat-hf",
            "name": "Llama 2 70B Chat",
            "size_gb": 140,
            "quantizations": ["int8", "int4"],
            "requires_hf_token": True
        },
    ]
}

# === Training Configuration ===
TRAINING_CONFIG = {
    "default_learning_rate": 5e-4,
    "default_batch_size": 4,
    "default_epochs": 3,
    "max_seq_length": 2048,
    "use_lora": True,
    "lora_rank": 8,
    "lora_alpha": 16,
}

# === Server Configuration ===
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8002"))
API_RELOAD = ENVIRONMENT == "development"

# === Logging ===
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

print(f"Loaded configuration for {SERVICE_NAME} v{SERVICE_VERSION}")
print(f"Environment: {ENVIRONMENT}")
print(f"Device: {DEVICE}")
print(f"Cache path: {MODEL_CACHE_PATH}")
