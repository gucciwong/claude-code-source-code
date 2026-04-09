#!/usr/bin/env python3
"""
Quick Start: Load GGUF Model and Train
One-command setup for model training
"""

import os
import sys
import subprocess
from pathlib import Path


def print_step(step: int, title: str):
    print(f"\n{'=' * 60}")
    print(f"STEP {step}: {title}")
    print(f"{'=' * 60}")


def run_command(cmd: list, description: str = "") -> bool:
    """Run a command and report result."""
    if description:
        print(f"\n⏳ {description}...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print(f"✅ Success")
            if result.stdout.strip():
                for line in result.stdout.strip().split('\n')[:5]:
                    print(f"   {line}")
            return True
        else:
            print(f"❌ Failed")
            if result.stderr:
                print(f"   Error: {result.stderr[:200]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"❌ Timeout")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("\n" + "=" * 60)
    print("SOVEREIGN CODE - QUICK START MODEL TRAINING")
    print("=" * 60)
    
    # Check Ollama
    print_step(1, "Check Ollama Service")
    
    print("\n📋 Checking if Ollama is running...")
    if not run_command(["ollama", "list"], "Querying Ollama"):
        print("\n❌ Ollama is not running!")
        print("\n   Start Ollama with:")
        print("   - Windows: From Start menu -> Ollama")
        print("   - WSL: ollama serve")
        print("   - Linux: sudo systemctl start ollama")
        return 1
    
    # Find and import GGUF
    print_step(2, "Import Your GGUF Model")
    
    print("\n🔍 Looking for GGUF files...")
    print("\n   Run this command to import your model:")
    print("   " + " " * 20)
    print("   python import_gguf_model.py")
    print("\n   This will:")
    print("   • Find your GGUF file automatically")
    print("   • Create a Modelfile for Ollama")
    print("   • Import the model into Ollama")
    
    response = input("\n   Have you already imported a model? (y/n): ").strip().lower()
    if response != 'y':
        print("\n   ⏳ Run: python import_gguf_model.py")
        print("      Then come back here")
        return 0
    
    # List available models
    print_step(3, "Select Model")
    
    print("\n📋 Available models:")
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        models = []
        for line in result.stdout.split('\n')[1:]:
            if line.strip():
                model_name = line.split()[0]
                models.append(model_name)
                print(f"   • {model_name}")
        
        if not models:
            print("   ❌ No models found!")
            return 1
        
        if len(models) == 1:
            selected_model = models[0]
            print(f"\n   Using: {selected_model}")
        else:
            idx = input(f"\n   Choose model (1-{len(models)}): ").strip()
            try:
                selected_model = models[int(idx) - 1]
            except (ValueError, IndexError):
                selected_model = models[0]
            print(f"   Using: {selected_model}")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return 1
    
    # Create sample training data
    print_step(4, "Prepare Training Data")
    
    print("\n📝 Creating sample training data...")
    
    sample_data_path = Path("training_data_sample.jsonl")
    if not sample_data_path.exists():
        training_data = [
            {"text": "Sovereign Code is a federated AI system for enterprise development."},
            {"text": "Fine-tuning models helps adapt them to specific domains and tasks."},
            {"text": "QLoRA combines parameter-efficient fine-tuning with 4-bit quantization."},
            {"text": "Autoresearch automatically finds optimal hyperparameters."},
            {"text": "The training service orchestrates distributed model training efficiently."},
        ]
        
        with open(sample_data_path, 'w') as f:
            for item in training_data:
                f.write(f"{item}\n")
        
        print(f"   ✅ Created: {sample_data_path}")
    else:
        print(f"   ℹ️  Using existing: {sample_data_path}")
    
    # Start training
    print_step(5, "Start Training")
    
    print("\n🚀 Ready to train!")
    print(f"\n   Model: {selected_model}")
    print(f"   Data: {sample_data_path}")
    
    start_training = input("\n   Start training? (y/n): ").strip().lower()
    if start_training != 'y':
        print("\n   ℹ️  Training skipped")
        print("   Go to Dashboard → Start Training when ready")
        return 0
    
    # Make training request
    print("\n⏳ Starting training...")
    
    import json
    import requests
    
    config = {
        "base_model": selected_model,
        "dataset_path": str(sample_data_path.absolute()),
        "learning_rate": 0.0003,
        "epochs": 2,
        "batch_size": 4,
        "lora_rank": 8,
        "output_dir": "./trained-model"
    }
    
    try:
        response = requests.post(
            "http://localhost:8001/finetune/start",
            json=config,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            job_id = result.get("job_id")
            print(f"\n✅ Training started!")
            print(f"   Job ID: {job_id}")
            print(f"\n   Open Dashboard at:")
            print(f"   http://127.0.0.1:5173")
            print(f"   → Training tab to monitor progress")
            
            # Poll for updates
            print(f"\n   Monitoring training...")
            import time
            for i in range(30):  # Check for 5 minutes
                time.sleep(10)
                try:
                    status_resp = requests.get(
                        f"http://localhost:8001/finetune/status/{job_id}",
                        timeout=5
                    )
                    if status_resp.status_code == 200:
                        job = status_resp.json()
                        progress = job.get("progress", 0)
                        status = job.get("status", "unknown")
                        loss = job.get("loss_history", [])[-1] if job.get("loss_history") else "N/A"
                        
                        print(f"   [{i*10:3d}s] {status:8} - Progress: {progress*100:5.1f}% - Loss: {loss}")
                        
                        if status in ["complete", "failed", "stopped"]:
                            break
                except:
                    pass
            
            print(f"\n✅ Training complete!")
            print(f"   Checkpoint saved to: ./trained-model/final/")
            return 0
        else:
            print(f"   ❌ Error: HTTP {response.status_code}")
            print(f"      {response.text}")
            return 1
    
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Cannot connect to training service")
        print(f"      Make sure training-service is running on port 8001:")
        print(f"      cd services/training-service")
        print(f"      python -m uvicorn main:app --port 8001")
        return 1
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
