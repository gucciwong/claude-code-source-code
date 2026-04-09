# Model Training & Fine-tuning Guide

## Overview

Sovereign Code supports three levels of model training:

1. **Quick Demo** - Simulate training (for testing without GPU)
2. **Full Fine-tuning** - Traditional gradient-based QLoRA fine-tuning
3. **Autoresearch** - Automated hyperparameter search with Bayesian optimization

---

## Level 1: Quick Demo Training (No GPU Required)

Perfect for testing the UI and workflow.

### Via Desktop UI

1. Open Dashboard (first tab)
2. Click **"Start Training"**
3. Configure:
   - Model: Select any model from dropdown
   - Dataset: (optional, for demo can be empty)
   - Epochs: 3
4. Click **Start**
5. Watch progress bars update in **Training** screen

### Via API

```bash
# Start a simulated training job
curl -X POST http://localhost:8001/finetune/start \
  -H "Content-Type: application/json" \
  -d '{
    "base_model": "any-loaded-model",
    "dataset_path": "/tmp/dataset",
    "learning_rate": 0.0003,
    "epochs": 3,
    "batch_size": 4,
    "lora_rank": 8,
    "output_dir": "./finetune-output"
  }'

# Check job status
curl http://localhost:8001/finetune/status/{job_id}

# Advance simulation by one step
curl -X POST http://localhost:8001/finetune/simulate/{job_id}
```

---

## Level 2: Full Fine-tuning with Your GGUF Model

### Prerequisites

1. ✅ **Ollama running** - `ollama serve`
2. ✅ **Model imported** - Run: `python import_gguf_model.py`
3. ✅ **Training data** - Prepare your dataset

### Step 1: Prepare Training Data

Format your data as JSONL (one JSON object per line):

```json
{"text": "Your training example 1"}
{"text": "Your training example 2"}
{"text": "Your training example 3"}
```

Save as: `./training_data.jsonl`

**Or use a Hugging Face dataset:**

```python
from datasets import load_dataset

dataset = load_dataset("openwebtext", split="train[:1000]")
with open("training_data.jsonl", "w") as f:
    for example in dataset:
        f.write(json.dumps(example) + "\n")
```

### Step 2: Check Available Models

```bash
# List Ollama models
curl http://localhost:8001/finetune/models

# Example response:
# {
#   "status": "success",
#   "count": 2,
#   "models": [
#     {"name": "my-qwen-model", "size": 5368709120, "modified_at": "2026-04-04T..."},
#     {"name": "llama2", "size": 3826298880, "modified_at": "2026-04-03T..."}
#   ]
# }
```

### Step 3: Start Training

**Via Desktop UI:**

1. Go to **Training** tab
2. Fill in:
   - **Base Model**: Select "my-qwen-model" (your imported model)
   - **Dataset Path**: `/path/to/training_data.jsonl`
   - **Learning Rate**: `0.0003` (recommended for QLoRA)
   - **Epochs**: `3` (start small)
   - **Batch Size**: `4` or `2` (if OOM, reduce further)
   - **LoRA Rank**: `8` (balance between quality and speed)
   - **Output Dir**: `./qwen-finetuned`
3. Click **Start Training**
4. Monitor in **Training** screen for loss curves

**Via API:**

```bash
curl -X POST http://localhost:8001/finetune/start \
  -H "Content-Type: application/json" \
  -d '{
    "base_model": "my-qwen-model",
    "dataset_path": "./training_data.jsonl",
    "learning_rate": 0.0003,
    "epochs": 3,
    "batch_size": 4,
    "lora_rank": 8,
    "output_dir": "./qwen-finetuned"
  }'
```

### Step 4: Monitor Training

**In Dashboard:**
- Go to **Training** → **Training Jobs**
- Watch real-time loss curves
- Monitor GPU/VRAM usage (System Health)

**Via API:**

```bash
# Get training status
curl http://localhost:8001/finetune/status/{job_id}

# Response:
# {
#   "job_id": "abc-123",
#   "status": "running",
#   "progress": 0.35,
#   "current_epoch": 1,
#   "total_epochs": 3,
#   "loss_history": [2.45, 2.12, 1.98, 1.87, ...]
# }
```

### Step 5: Use Trained Model

Once training completes:

```bash
# Get final checkpoint
curl http://localhost:8001/finetune/checkpoints

# Load the fine-tuned model
# The model is saved in ./qwen-finetuned/final/
# You can import it back to Ollama with:
#   ollama create qwen-fine-tuned -f ./Modelfile

# Or use directly with llama.cpp:
python -c "
from llama_cpp import Llama
model = Llama(model_path='./qwen-finetuned/final/model.gguf')
response = model('Your prompt here')
print(response)
"
```

---

## Level 3: Autoresearch - Automated Hyperparameter Tuning

Automatically search for optimal hyperparameters using Bayesian optimization.

### Step 1: Create Research Program

**Via Desktop - Go to Research tab:**

1. Click **Create Program**
2. Configure:
   - **Name**: "Qwen Hyperparameter Search"
   - **Search Strategy**: "Bayesian"
   - **Time Budget**: 120 minutes (2 hours)
3. Set search dimensions:

   ```
   Learning Rate: log scale [1e-5, 1e-3]
   LoRA Rank: integer [4, 64]
   Batch Size: integer [1, 8]
   ```

4. Click **Create & Start**

**Via API:**

```bash
# Create research program
curl -X POST http://localhost:8001/api/v1/research/programs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Qwen Hyperparameter Search",
    "model": "my-qwen-model",
    "search_strategy": "bayesian",
    "dimensions": [
      {
        "name": "learning_rate",
        "type": "log_float",
        "low": 1e-5,
        "high": 1e-3
      },
      {
        "name": "lora_rank",
        "type": "int",
        "low": 4,
        "high": 64
      },
      {
        "name": "batch_size",
        "type": "int",
        "low": 1,
        "high": 8
      }
    ],
    "time_budget_minutes": 120
  }'

# Response:
# {
#   "program_id": "prog-xyz",
#   "status": "created"
# }

# Start the search
curl -X POST http://localhost:8001/api/v1/research/programs/{program_id}/start \
  -H "Content-Type: application/json"
```

### Step 2: Monitor Search Progress

**In Dashboard:**
- Go to **Research** tab
- See running experiments, loss progression
- View scatter plot of all tried hyperparameters

**Via API:**

```bash
# Get program status
curl http://localhost:8001/api/v1/research/programs/{program_id}/status

# Get best experiment so far
curl http://localhost:8001/api/v1/experiments/best?run_tag={program_id}
```

### Step 3: Export Results

```bash
# List all experiments
curl "http://localhost:8001/api/v1/experiments?run_tag={program_id}"

# Get best hyperparameters
curl http://localhost:8001/api/v1/experiments/best?run_tag={program_id}

# Results:
# {
#   "experiment_id": "exp-123",
#   "status": "complete",
#   "hyperparameters": {
#     "learning_rate": 0.000157,
#     "lora_rank": 24,
#     "batch_size": 4
#   },
#   "metrics": {
#     "val_loss": 1.23,
#     "val_bpb": 0.18,
#     "train_loss": 1.45
#   }
# }
```

---

## Troubleshooting

### "Out of Memory (OOM)"

**Solutions:**
1. Reduce batch size: `batch_size: 1`
2. Reduce LoRA rank: `lora_rank: 4`
3. Use 4-bit quantization in Modelfile:
   ```dockerfile
   FROM ./model.gguf
   PARAMETER quantize Q4_K_M
   ```
4. Check GPU: "System Health" → "VRAM Usage"

### "Training is very slow"

**Causes & Fixes:**
- **GPU not used**: Check "System Health" → "GPU Temperature"
  - Windows: Ensure CUDA drivers are installed
  - WSL: Ensure `nvidia-smi` works
- **CPU bottleneck**: Reduce `num_threads` if multiple workers fighting
- **I/O bottleneck**: Use SSD for dataset, not HDD

### "Model not found in Ollama"

```bash
# Check what's imported
ollama list

# Re-import if needed
python import_gguf_model.py

# Refresh Dashboard (F5)
```

### "Can't connect to training service"

```bash
# Check service is running
curl http://localhost:8001/health

# If not running:
cd services/training-service
python -m uvicorn main:app --port 8001 --reload
```

---

## Best Practices

### Dataset Curation
- **Size**: 100-1000 examples for QLoRA (more is better)
- **Quality**: Remove duplicates, clean text
- **Diversity**: Mix different document types/topics
- **Format**: UTF-8 JSONL, one example per line

### Hyperparameter Selection

For **Qwen 3.5-9B**:
- Learning Rate: `1e-4` to `5e-4` (start with `3e-4`)
- LoRA Rank: `8-32` (trade-off speed vs quality)
- Batch Size: `2-4` (GPU-dependent)
- Epochs: `1-3` (usually 2 is good)

### Monitoring Training

Watch these metrics:
- **Loss**: Should decrease smoothly
- **GPU Usage**: Should be >80%
- **Training Time/Epoch**: Should be consistent

### Checkpointing

Model saves checkpoint after each epoch in `output_dir/`:
```
./qwen-finetuned/
├── checkpoint-1/
│   ├── adapter_model.bin
│   └── adapter_config.json
├── checkpoint-2/
├── final/
│   ├── adapter_model.bin (best model)
│   └── adapter_config.json
```

---

## Next Steps

1. **Find your GGUF**: `python import_gguf_model.py`
2. **Prepare data**: Create `training_data.jsonl`
3. **Start training**: Quick demo first, then full training
4. **Tune hyperparameters**: Use Autoresearch for optimization
5. **Export model**: Save checkpoints and reload

---

## Advanced: Custom Training Loop

For advanced use, edit `services/training-service/training/trainer.py`:

```python
from peft import get_peft_model, LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load model
model = AutoModelForCausalLM.from_pretrained("path/to/model.gguf")
tokenizer = AutoTokenizer.from_pretrained("path/to/tokenizer")

# Apply QLoRA
config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(model, config)

# Train...
```

---

**Questions? Check `/services/training-service/QUICKSTART.md`**
