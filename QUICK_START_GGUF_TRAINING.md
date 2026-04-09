# 🚀 QUICK START: Load & Train Your GGUF Model

## TL;DR - 3 Simple Steps

```bash
# 1. Find and import your GGUF model into Ollama
python import_gguf_model.py

# 2. Start Sovereign Code training
python quick_start_training.py

# 3. Monitor in Dashboard at http://127.0.0.1:5173
```

---

## Problem Summary

You downloaded **Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF** but:
- ❌ Can't find the file
- ❌ Don't know how to load it
- ❌ Don't know how to train with it

**Solution:** Sovereign Code uses **Ollama** to manage models. The GGUF file needs to be imported into Ollama first.

---

## Solution

### Step 1: Find Your Downloaded Model

Your GGUF file (probably ~9GB) is likely in one of these places:

**Windows:**
```
C:\Users\[YourName]\Downloads\
C:\Users\[YourName]\Documents\
C:\Users\[YourName]\.cache\huggingface\hub\
```

**Search for it:**
```powershell
# PowerShell - Search for files containing "Qwen"
Get-ChildItem -Path $env:USERPROFILE -Recurse `
  -Filter "*Qwen*.gguf" -Type File 2>/dev/null | 
  Select-Object FullName
```

### Step 2: Import into Ollama (Automated)

```bash
# This script will:
# • Find your GGUF file
# • Create a Modelfile
# • Import into Ollama
# • List available models

python import_gguf_model.py
```

**Manual alternative:**

If auto-import doesn't work, create a `Modelfile`:

```dockerfile
FROM C:\Users\YourName\Downloads\Qwen3.5-9B.gguf

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

Then run:
```bash
ollama create my-qwen -f Modelfile
ollama list  # Verify it appears
```

### Step 3: Load & Train from Dashboard

1. **Open Dashboard:**
   ```
   http://127.0.0.1:5173
   ```

2. **Select your model:**
   - Click **"Browse Models"**
   - Select **"my-qwen"** (or your model name)
   - Status should change from "No model" to "my-qwen"

3. **Start Training:**
   - Go to **Training** tab
   - Click **"Start Training"**
   - Configure:
     ```
     Base Model: my-qwen
     Dataset: (optional for demo)
     Epochs: 2
     Batch Size: 4
     Learning Rate: 0.0003
     Output Dir: ./trained-qwen
     ```
   - Click **Start**

4. **Monitor Progress:**
   - Stay on **Training** tab
   - Watch loss curve decrease
   - View VRAM/GPU usage in **System Health**

### Step 4: Automated Quick Start (Optional)

```bash
python quick_start_training.py
```

This script:
- ✅ Checks Ollama is running
- ✅ Lists available models
- ✅ Creates sample training data
- ✅ Starts training automatically
- ✅ Monitors progress in real-time

---

## Folder Structure

After setup, files will be organized as:

```
~/.ollama/
  └── models/
      └── blobs/
          └── sha256-xyz...  ← Your GGUF model

~/.sovereign-code/
  ├── experiments.db          ← Training experiments
  ├── finetune-output/ or ./trained-qwen/
  │   ├── checkpoint-1/
  │   ├── checkpoint-2/
  │   └── final/              ← Best trained model
  └── eval-data/

./Sovereign-Code/
  ├── import_gguf_model.py    ← Use this ↑
  ├── quick_start_training.py ← Or this ↑
  ├── GGUF_MODEL_LOADING_GUIDE.md
  ├── MODEL_TRAINING_GUIDE.md
  └── [other files...]
```

---

## Troubleshooting

### "Ollama not found"
```bash
# Check if installed
ollama --version

# Download: https://ollama.ai
# Start: ollama serve
```

### "Can't find GGUF file"

**Search systematically:**
```powershell
# Check Downloads
ls $env:USERPROFILE\Downloads\*Qwen*.gguf

# Check cache
ls $env:USERPROFILE\.cache\huggingface\hub\*Qwen*.gguf

# Search everywhere (slow)
Get-ChildItem -Path C:\ -Recurse -Filter "*Qwen*" -Type File 2>/dev/null
```

**File size to look for:**
- 9B model: ~5-9 GB
- Check if file is actually `.gguf` or `.bin` or other format

### "Imported but not showing in Dashboard"

1. Verify import worked:
   ```bash
   ollama list
   ```

2. Refresh Dashboard (F5)

3. Click **Browse Models** again

### "Training fails with OOM"

Reduce in training config:
- `batch_size`: 4 → 2 → 1
- `lora_rank`: 8 → 4
- Add quantization to Modelfile

### "Nothing loads"

Check if services are running:

```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Training service
cd services/training-service
python -m uvicorn main:app --port 8001

# Terminal 3: Desktop app (if not running)
# Or open http://127.0.0.1:5173 in browser
```

---

## API Endpoints (Advanced)

Once model is loaded, use these endpoints:

```bash
# List available models
curl http://localhost:8001/finetune/models

# Get model info
curl http://localhost:8001/finetune/model-info/my-qwen

# Start training
curl -X POST http://localhost:8001/finetune/start \
  -H "Content-Type: application/json" \
  -d '{
    "base_model": "my-qwen",
    "dataset_path": "./training_data.jsonl",
    "learning_rate": 0.0003,
    "epochs": 2,
    "batch_size": 4,
    "lora_rank": 8,
    "output_dir": "./trained-qwen"
  }'

# Check job status
curl http://localhost:8001/finetune/status/{job_id}

# List training jobs
curl http://localhost:8001/finetune/jobs

# List checkpoints
curl http://localhost:8001/finetune/checkpoints
```

---

## What Gets Saved/Loaded

### Training Artifacts
- **Checkpoints** → `./trained-qwen/checkpoint-{N}/`
- **Final model** → `./trained-qwen/final/`
- **Loss history** → Stored in experiments.db

### Using Trained Model
```bash
# Import fine-tuned model back to Ollama
ollama create my-qwen-finetuned -f ./Modelfile-finetuned

# Or use directly with llama-cpp-python
python -c "
from llama_cpp import Llama
model = Llama(model_path='./trained-qwen/final/model.gguf')
response = model('Your prompt')
print(response)
"
```

---

## Learning Resources

📚 **Included Guides:**
- `GGUF_MODEL_LOADING_GUIDE.md` - Detailed model import guide
- `MODEL_TRAINING_GUIDE.md` - Complete training documentation
- `AUTORESEARCH_VERIFICATION_REPORT.md` - Autoresearch features

📖 **External Resources:**
- [Ollama Docs](https://ollama.ai)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)
- [Hugging Face PEFT](https://huggingface.co/docs/peft)

---

## Quick Command Reference

```bash
# Setup
python import_gguf_model.py              # Import GGUF into Ollama
python quick_start_training.py           # Auto-start training

# Ollama
ollama serve                              # Start Ollama service
ollama list                               # List imported models
ollama create name -f Modelfile          # Import new model
ollama delete model-name                 # Remove model

# Service Management
curl http://localhost:8001/health        # Check training service
curl http://localhost:5173               # Check dashboard

# Training
curl http://localhost:8001/finetune/models  # List available models

# Monitoring
# Dashboard: http://127.0.0.1:5173/training
```

---

## Next Steps

1. ✅ **Find your GGUF file**
   ```bash
   python import_gguf_model.py
   ```

2. ✅ **Verify it's loaded**
   - Open http://127.0.0.1:5173
   - Dashboard should show your model name

3. ✅ **Start training**
   - Go to Training tab
   - Click Start Training
   - Configure parameters

4. ✅ **Monitor progress**
   - Watch loss curves
   - Check GPU usage
   - Save checkpoints

5. ✅ (Optional) **Use autoresearch**
   - Go to Research tab
   - Create program with hyperparameter search
   - Let it run overnight

---

**🎉 You're ready! Start with: `python import_gguf_model.py`**
