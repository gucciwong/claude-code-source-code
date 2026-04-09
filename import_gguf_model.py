#!/usr/bin/env python3
"""
Ollama GGUF Model Importer - Auto-find and import GGUF models
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import Optional, List


def find_gguf_files(search_pattern: str = "*.gguf") -> List[Path]:
    """Search for GGUF files on the system."""
    gguf_files = []
    
    # Common search locations
    search_paths = [
        Path.home() / "Downloads",
        Path.home() / "Documents",
        Path.home() / ".cache" / "huggingface" / "hub",
        Path("C:\\") / "models",
        Path("D:\\") / "models",
    ]
    
    print("🔍 Searching for GGUF files...")
    for search_path in search_paths:
        if search_path.exists():
            try:
                for gguf_file in search_path.rglob(search_pattern):
                    gguf_files.append(gguf_file)
                    print(f"  Found: {gguf_file} ({gguf_file.stat().st_size / 1e9:.1f} GB)")
            except PermissionError:
                pass
    
    return gguf_files


def check_ollama_running() -> bool:
    """Check if Ollama service is running."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


def create_modelfile(gguf_path: str, model_name: str) -> str:
    """Create a Modelfile for importing the GGUF."""
    # Detect model template based on name
    template = '{{ .Prompt }}\n'  # Default
    
    if 'qwen' in model_name.lower():
        template = """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
<|im_start|>assistant
{{ .Response }}<|im_end|>
{{ end }}"""
    elif 'llama' in model_name.lower():
        template = """[INST] {{ .System }}
{{ .Prompt }} [/INST]"""
    elif 'mistral' in model_name.lower():
        template = """[INST] {{ .Prompt }} [/INST]"""
    
    modelfile_content = f"""FROM {gguf_path}

TEMPLATE """{template}"""

PARAMETER top_k 40
PARAMETER top_p 0.9
PARAMETER temperature 0.7
PARAMETER repeat_penalty 1.1

# For faster inference, set num_threads
PARAMETER num_threads 8
"""
    
    return modelfile_content


def import_model(gguf_path: str, model_name: str) -> bool:
    """Import a GGUF model into Ollama."""
    try:
        # Create Modelfile
        modelfile_content = create_modelfile(gguf_path, model_name)
        modelfile_path = Path.home() / "Modelfile"
        
        with open(modelfile_path, 'w') as f:
            f.write(modelfile_content)
        
        print(f"\n📝 Created Modelfile: {modelfile_path}")
        print(f"   Model name: {model_name}")
        print(f"   GGUF path: {gguf_path}")
        
        # Import into Ollama
        print(f"\n⏳ Importing model into Ollama...")
        result = subprocess.run(
            ["ollama", "create", model_name, "-f", str(modelfile_path)],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print(f"✅ Model '{model_name}' imported successfully!")
            return True
        else:
            print(f"❌ Import failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def list_ollama_models() -> List[str]:
    """List all models in Ollama."""
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        models = []
        for line in result.stdout.split('\n')[1:]:  # Skip header
            if line.strip():
                model_name = line.split()[0]
                models.append(model_name)
        
        return models
    except Exception:
        return []


def main():
    print("=" * 60)
    print("OLLAMA GGUF MODEL IMPORTER")
    print("=" * 60)
    
    # Step 1: Check Ollama
    print("\n1️⃣  Checking Ollama service...")
    if not check_ollama_running():
        print("❌ Ollama is not running!")
        print("   Run: ollama serve")
        return 1
    
    print("✅ Ollama is running")
    
    # Step 2: Find GGUF files
    print("\n2️⃣  Searching for GGUF files...")
    gguf_files = find_gguf_files()
    
    if not gguf_files:
        print("❌ No GGUF files found!")
        print("   Please specify the path manually:")
        gguf_path = input("   Enter full path to GGUF file: ").strip()
        if not Path(gguf_path).exists():
            print("❌ File not found")
            return 1
        gguf_files = [Path(gguf_path)]
    
    # Step 3: Select GGUF file
    print("\n3️⃣  Select GGUF file to import:")
    for i, gguf_file in enumerate(gguf_files, 1):
        print(f"   [{i}] {gguf_file.name}")
        print(f"       Path: {gguf_file}")
    
    selection = input(f"   Choose (1-{len(gguf_files)}): ").strip()
    try:
        selected_file = gguf_files[int(selection) - 1]
    except (ValueError, IndexError):
        print("❌ Invalid selection")
        return 1
    
    # Step 4: Create model name
    print("\n4️⃣  Model name (default: auto-generated):")
    model_name = input("   Enter model name (or press Enter): ").strip()
    if not model_name:
        model_name = selected_file.stem.lower().replace('-', '_').replace(' ', '_')
    
    # Step 5: Import
    print("\n5️⃣  Importing...")
    if import_model(str(selected_file), model_name):
        print("\n✅ SUCCESS! Your model is ready to use.")
        print(f"\n📱 In Sovereign Code:")
        print(f"   1. Go to Dashboard")
        print(f"   2. Click 'Browse Models'")
        print(f"   3. Select '{model_name}'")
        print(f"\n🚀 Ready to train!")
        
        # List available models
        print("\n📋 Available models in Ollama:")
        for model in list_ollama_models():
            print(f"   • {model}")
        
        return 0
    else:
        print("\n❌ Import failed. Check Ollama logs.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
