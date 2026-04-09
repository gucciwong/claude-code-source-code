# GGUF Model Loading & Training Guide

## Problem: Can't Find Downloaded GGUF Model

Your GGUF model needs to be imported into **Ollama**, which is the model manager used by Sovereign Code.

## Step 1: Locate Your Downloaded GGUF File

Common download locations:
- **Windows**: `C:\Users\[YourUsername]\Downloads\`
- **WSL**: `/home/[username]/Downloads/`  
- **Hugging Face Cache**: `C:\Users\[YourUsername]\.cache\huggingface\hub\`

**Your model file**: `Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF`

Find it with:
```powershell
Get-ChildItem -Path $env:USERPROFILE -Recurse -Filter "*Qwen*" -Type File 2>/dev/null | Select-Object FullName
```

## Step 2: Install/Start Ollama

1. **Check if Ollama is installed:**
   ```powershell
   ollama --version
   ```

2. **If not installed:** Download from https://ollama.ai

3. **Start Ollama (if not running):**
   ```powershell
   # Ollama usually runs as a service
   # Check by visiting: http://localhost:11434/api/tags
   ```

## Step 3: Import Your GGUF Model into Ollama

1. **Create a Modelfile** (similar to Dockerfile):

   Create: `C:\Users\[YourUsername]\Documents\Modelfile` (no extension)

   ```dockerfile
   FROM ./path/to/your/model.gguf

   # Optional: Add model parameters
   PARAMETER top_k 40
   PARAMETER top_p 0.9
   PARAMETER temperature 0.8
   ```

   Replace `./path/to/your/model.gguf` with the actual FULL PATH to your downloaded file.

2. **Example with your specific model:**

   ```dockerfile
   FROM C:\path\to\Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF.gguf
   
   TEMPLATE """{{ if .System }}<|im_start|>system
   {{ .System }}<|im_end|>
   {{ end }}{{ if .Prompt }}<|im_start|>user
   {{ .Prompt }}<|im_end|>
   <|im_start|>assistant
   {{ .Response }}<|im_end|>
   {{ end }}"""
   
   PARAMETER top_k 40
   PARAMETER top_p 0.9
   PARAMETER temperature 0.7
   ```

3. **Import the model:**
   ```powershell
   ollama create my-qwen-model -f C:\Users\[YourUsername]\Documents\Modelfile
   ollama pull my-qwen-model
   ```

4. **Verify it was imported:**
   ```powershell
   ollama list
   ```

## Step 4: Load Model in Sovereign Code

Once imported into Ollama:

1. **Click "Browse Models"** in the Dashboard
2. **Select your model** from the list
3. **Verify "Model Status" shows name** (not "No model")

## Step 5: Train the Model

### Option A: Via Desktop UI

1. Go to **Training** screen
2. Click **"Start Training"**
3. Configure:
   - Base Model: `my-qwen-model`
   - Dataset: Select your training data
   - Learning Rate: `0.0003` (default)
   - Epochs: `3` (default)
4. Click **Start**

### Option B: Via API

```bash
curl -X POST http://localhost:8001/finetune/start \
  -H "Content-Type: application/json" \
  -d '{
    "base_model": "my-qwen-model",
    "dataset_path": "/path/to/dataset",
    "learning_rate": 0.0003,
    "epochs": 3,
    "batch_size": 4,
    "lora_rank": 8,
    "output_dir": "./finetune-output"
  }'
```

### Option C: Via Experiments/Autoresearch

```bash
# Create an experiment
curl -X POST http://localhost:8001/api/v1/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "model": "my-qwen-model",
    "run_tag": "qwen-v1",
    "hyperparameters": {
      "learning_rate": 0.0003,
      "batch_size": 4
    }
  }'

# Create and run research program
curl -X POST http://localhost:8001/api/v1/research/programs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Qwen Fine-tuning Search",
    "search_strategy": "bayesian",
    "dimensions": [
      {"name": "learning_rate", "type": "log_float", "low": 1e-5, "high": 1e-3},
      {"name": "lora_rank", "type": "int", "low": 4, "high": 64}
    ],
    "time_budget_minutes": 30
  }'
```

## Troubleshooting

### "Model not found in Ollama"
- Verify Ollama service is running
- Check: `ollama list`
- Reimport the model

### "Can't find GGUF file"
1. Search system: `Find-Command -Name Get-ChildItem` to search Downloads, Desktop
2. Check file size (should be 5-9GB for 9B model)
3. Verify file extension is `.gguf` or `.bin`

### "Model loads but training fails"
- Check available VRAM (9B model needs ~12GB for training)
- Reduce batch size: `"batch_size": 1`
- Reduce lora_rank: `"lora_rank": 4`
- Enable quantization in Ollama Modelfile

### "Training is too slow"
- Enable GPU: Ensure GPU drivers are installed
- Check System Health → GPU section in Dashboard
- Increase batch size if VRAM allows

## File Structure After Setup

```
~/.ollama/models/
  ├── blobs/
  │   └── sha256-[hash]  ← Your downloaded GGUF
  └── manifests/
      └── library/my-qwen-model

~/.sovereign-code/
  ├── experiments.db  ← Training experiments tracked here
  ├── finetune-output/
  │   ├── checkpoint-1/
  │   ├── checkpoint-2/
  │   └── final/
  └── evaluation-data/

./Sovereign-Code/
  └── Modelfile  ← The file you created with import instructions
```

## Next Steps

1. Find your downloaded GGUF file
2. Create the Modelfile with correct path
3. Import with `ollama create`
4. Refresh Dashboard (F5)
5. Select model from "Browse Models"
6. Start training

## Advanced: Direct GGUF Loading (Without Ollama)

If you prefer to load the GGUF file directly:

1. **Install llama-cpp-python:**
   ```bash
   pip install llama-cpp-python
   ```

2. **Create a loader script** (in `services/training-service/finetune/`):
   ```python
   from llama_cpp import Llama
   
   model = Llama(
       model_path="C:/path/to/model.gguf",
       n_gpu_layers=-1,  # Use GPU
       n_ctx=4096,       # Context window
   )
   
   # Train/inference operations...
   ```

However, this requires modifying training-service to handle GGUF models directly, which is more complex than using Ollama.

---

**Recommended:** Use Ollama (Step 3) - it's already integrated and handles everything.
