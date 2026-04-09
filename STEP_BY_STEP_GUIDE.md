# 🎯 GGUF Model Loading - Step-by-Step Walkthrough

## Your Situation
- ✅ Downloaded: `Qwen3.5-9B-Claude-4.6-Opus-Reasoning-Distilled-v2-GGUF` (~9GB)
- ❌ Can't find it
- ❌ Don't know how to load it
- ❌ Don't know how to train

---

## The Solution in 3 Commands

### Command 1: Auto-Import Your Model (5 minutes)

```bash
python import_gguf_model.py
```

**What happens:**
```
🔍 Searching for GGUF files...
  Found: C:\Users\Admin\Downloads\Qwen3.5-9B.gguf (5.2 GB)
  Found: C:\Models\another_model.gguf (3.1 GB)

3️⃣  Select GGUF file to import:
   [1] Qwen3.5-9B.gguf
       Path: C:\Users\Admin\Downloads\Qwen3.5-9B.gguf
   [2] another_model.gguf
       Path: C:\Models\another_model.gguf

Choose (1-2): 1

4️⃣  Model name (default: auto-generated):
Enter model name (or press Enter): qwen-3.5

5️⃣  Importing...
⏳ Created Modelfile: C:\Users\Admin\Modelfile
   Model name: qwen-3.5
   GGUF path: C:\Users\Admin\Downloads\Qwen3.5-9B.gguf

⏳ Importing model into Ollama...
✅ Model 'qwen-3.5' imported successfully!

📋 Available models in Ollama:
   • qwen-3.5
   • llama2 (if you had others)
```

### Command 2: Verify Model Loaded (2 minutes)

Open Browser:
```
http://127.0.0.1:5173
```

**What you should see:**

**BEFORE:**
```
Dashboard
"No model loaded"
"—/— GB VRAM"
Status: "No model" ⚠️
```

**AFTER clicking "Browse Models":**
```
Models
Selected: qwen-3.5
Details:
  Parameters: 9B
  Size: 5.2 GB  
  Status: Installed ✅
  Modified: Today
```

**Back to Dashboard:**
```
"qwen-3.5"
"5.2 GB VRAM"
Status: "qwen-3.5" ✅
```

### Command 3: Start Training (2 minutes)

In Dashboard, click **"Start Training"**:

```
Training Configuration:
┌─────────────────────────────────────┐
│ Base Model:    qwen-3.5      ✅     │
│ Dataset Path:  (optional)    ↳  Optional
│ Learning Rate: 0.0003         (default)
│ Epochs:        3              (default)
│ Batch Size:    4              (default)
│ LoRA Rank:     8              (default)
│ Output Dir:    ./qwen-3.5     (generated)
│                                     │
│             [Start Training]        │
└─────────────────────────────────────┘
```

Click **"Start Training"** → Training begins:

```
Training Jobs
┌────────────────────────────────────┐
│ qwen-3.5-train-001                 │
├────────────────────────────────────┤
│ Status:    ▰▰▰▰▰▰▰▬▬▬ 70%        │
│ Epoch:     2/3                    │
│ Loss:      2.34 → 1.87 → 1.65    │
│ Time:      45m / 60m              │
│ GPU:       ████████░░ 85%         │
│ VRAM:      8.2 / 12 GB            │
└────────────────────────────────────┘
```

---

## What's Happening Behind the Scenes

### Ollama (localhost:11434)
```
Ollama Service
├── Models Registry
│   └── qwen-3.5
│       ├── MODEL FILE (weights) → Your GGUF file
│       ├── METADATA
│       └── PARAMETERS (temp, top_k, etc.)
└── Inference Engine (Waiting for requests)
```

### Training Service (localhost:8001)
```
Training Service
├── Load model from Ollama (qwen-3.5)
├── Create LoRA adapters (small weight updates)
├── Train on your data
├── Save checkpoints
│   ├── checkpoint-1/
│   ├── checkpoint-2/
│   └── final/ (best weights)
└── Track metrics → experiments.db
```

### Desktop Dashboard (localhost:5173)
```
Real-time Updates
├── Poll training API every 2 seconds
├── Update loss curve
├── Update progress bar
├── Show GPU/VRAM usage
└── Allow stop/export operations
```

---

## Expected Results

### After Step 1 (Import)
```
✅ Model imported into ~/.ollama/models/
✅ Can run: ollama list → shows "qwen-3.5"
✅ Can query: curl http://localhost:11434/api/tags
```

### After Step 2 (Verify)
```
✅ Dashboard shows "qwen-3.5" instead of "No model"
✅ Model details visible
✅ Status = green checkmark
✅ Ready for training
```

### After Step 3 (Train)
```
✅ Training job appears in Training tab
✅ Loss decreases from ~2.5 to ~1.5 (over 3 epochs)
✅ GPU usage visible (80%+ if training)
✅ Checkpoints saved to ./qwen-3.5/
✅ Model ready for inference after training complete
```

---

## Verification Checklist

- [ ] GGUF file located (check Downloads, Documents, .cache)
- [ ] Ollama running (`ollama serve` in terminal)
- [ ] `python import_gguf_model.py` completed successfully
- [ ] `ollama list` shows your model
- [ ] Dashboard loads at http://127.0.0.1:5173
- [ ] "Browse Models" shows your model name
- [ ] Dashboard main view shows model (not "No model")
- [ ] Can click "Start Training" (button enabled)
- [ ] First epoch starts and loss value appears

---

## File Locations Reference

**Your GGUF Model:**
- Usually: `C:\Users\[YourName]\Downloads\Qwen3.5-9B.gguf`
- Or: `C:\Users\[YourName]\.cache\huggingface\hub\models--...\snapshots\...\model.gguf`

**Ollama Registry:**
- `C:\Users\[YourName]\.ollama\models\blobs\sha256-...`

**Training Artifacts:**
- Checkpoints: `./qwen-3.5-finetuned/checkpoint-{1,2,3}/`
- Final: `./qwen-3.5-finetuned/final/`
- DB: `~/.sovereign-code/experiments.db`

**Modelfile:**
- Created: `C:\Users\[YourName]\Modelfile` (use this for re-imports)

---

## Common States You Might See

### ✅ Success State
```
Dashboard: "qwen-3.5"
Models: [qwen-3.5] selected
Training: Can click "Start Training"
Status: Everything green
```

### ⚠️ "Model not found" State
```
Cause: Import didn't complete
Fix: Run import_gguf_model.py again
     Verify GGUF file location
```

### ⚠️ "No model loaded" State
```
Cause: Model imported but not selected in UI
Fix: Click "Browse Models"
     Select your model
     Refresh page (F5)
```

### ⚠️ "OOM" Error During Training
```
Cause: Not enough VRAM
Fix: Reduce batch_size (4→2→1)
     Reduce lora_rank (8→4)
     Check available VRAM first
```

---

## Troubleshooting Decision Tree

```
Start here → Are you stuck?

├─ "Can't find GGUF file"
│  └─ Run: Get-ChildItem -Path $env:USERPROFILE `
│           -Recurse -Filter "*gguf*" 2>/dev/null
│
├─ "import_gguf_model.py doesn't work"
│  └─ Check: Is Ollama installed? (ollama --version)
│  └─ Check: Is Ollama running? (ollama serve)
│  └─ Run: ollama list (manually verify)
│
├─ "Model doesn't appear in Dashboard"
│  ├─ Refresh page (F5)
│  ├─ Restart service (Ctrl+C then python main:app...)
│  └─ Check: curl http://localhost:8001/finetune/models
│
├─ "Training won't start"
│  ├─ Check: Training service running? (8001 port)
│  ├─ Check: Dataset path correct?
│  └─ Check: Available disk space (10GB+)
│
└─ Still stuck?
   └─ Check LOGFILES: ~/.sovereign-code/training.log
   └─ Check DOCS: MODEL_TRAINING_GUIDE.md
```

---

## Quick Reference: 3-Step Command Line

```bash
# Step 1: Import (5 min)
python import_gguf_model.py

# Wait for: "✅ Model 'qwen-3.5' imported successfully!"

# Step 2: Verify (10 sec)
ollama list
# Look for your model name in output

# Step 3: Train (30 min - 2 hours)
# Use Dashboard at:
# http://127.0.0.1:5173 → Training tab
```

---

## Success! What's Next?

1. ✅ Model loaded
2. ✅ First training run complete
3. 👉 **Next Options:**
   - [ ] Run 2-3 full training epochs to get better results
   - [ ] Use Autoresearch to find optimal hyperparameters
   - [ ] Export trained model for inference
   - [ ] Fine-tune on your own domain data
   - [ ] Compare with other base models

Check `MODEL_TRAINING_GUIDE.md` for advanced topics.

---

**You're ready! Start with:**
```bash
python import_gguf_model.py
```
