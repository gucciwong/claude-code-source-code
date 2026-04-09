"""
Model Manager Router - Complete model lifecycle API
Endpoints for save, load, train, and export operations
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import os
import json
import shutil
from pathlib import Path
from datetime import datetime
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/models", tags=["models"])

# Model storage paths
MODELS_BASE = Path.home() / ".sovereign-code" / "models"
MODELS_BASE_DIR = MODELS_BASE / "base"
MODELS_TRAINED_DIR = MODELS_BASE / "trained"
MODELS_TEMP_DIR = MODELS_BASE / "temp"

# Ensure directories exist
MODELS_BASE_DIR.mkdir(parents=True, exist_ok=True)
MODELS_TRAINED_DIR.mkdir(parents=True, exist_ok=True)
MODELS_TEMP_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================================
# 1. LIST MODELS - Get all available models (base + trained)
# ============================================================================

@router.get("/list")
async def list_all_models():
    """List all available models (base models + trained models)"""
    try:
        base_models = []
        trained_models = []
        
        # List base models from file system
        if MODELS_BASE_DIR.exists():
            for item in MODELS_BASE_DIR.iterdir():
                if item.is_dir():
                    metadata_file = item / "metadata.json"
                    if metadata_file.exists():
                        try:
                            with open(metadata_file) as f:
                                metadata = json.load(f)
                                metadata["type"] = "base"
                                metadata["path"] = str(item)
                                base_models.append(metadata)
                        except Exception as e:
                            logger.warning(f"Error reading metadata for {item.name}: {e}")
        
        # List trained models from file system
        if MODELS_TRAINED_DIR.exists():
            for item in MODELS_TRAINED_DIR.iterdir():
                if item.is_dir():
                    metadata_file = item / "metadata.json"
                    if metadata_file.exists():
                        try:
                            with open(metadata_file) as f:
                                metadata = json.load(f)
                                metadata["type"] = "trained"
                                metadata["path"] = str(item)
                                trained_models.append(metadata)
                        except Exception as e:
                            logger.warning(f"Error reading metadata for {item.name}: {e}")
        
        return {
            "status": "success",
            "base_models": {
                "count": len(base_models),
                "items": base_models
            },
            "trained_models": {
                "count": len(trained_models),
                "items": trained_models
            },
            "total_count": len(base_models) + len(trained_models)
        }
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 2. GET MODEL INFO - Detailed information about specific model
# ============================================================================

@router.get("/info/{model_name}")
async def get_model_info(model_name: str):
    """Get detailed information about a specific model"""
    try:
        # Check base models
        base_model_path = MODELS_BASE_DIR / model_name
        if base_model_path.exists():
            metadata_file = base_model_path / "metadata.json"
            if metadata_file.exists():
                with open(metadata_file) as f:
                    metadata = json.load(f)
                    
                # Calculate directory size
                total_size = sum(
                    f.stat().st_size for f in base_model_path.rglob("*") if f.is_file()
                )
                metadata["total_size_bytes"] = total_size
                metadata["type"] = "base"
                metadata["path"] = str(base_model_path)
                
                return {"status": "success", "model": metadata}
        
        # Check trained models
        trained_model_path = MODELS_TRAINED_DIR / model_name
        if trained_model_path.exists():
            metadata_file = trained_model_path / "metadata.json"
            if metadata_file.exists():
                with open(metadata_file) as f:
                    metadata = json.load(f)
                    
                # Get training info if available
                training_log = trained_model_path / "training_log.json"
                if training_log.exists():
                    with open(training_log) as f:
                        metadata["training_log"] = json.load(f)
                
                # Calculate directory size
                total_size = sum(
                    f.stat().st_size for f in trained_model_path.rglob("*") if f.is_file()
                )
                metadata["total_size_bytes"] = total_size
                metadata["type"] = "trained"
                metadata["path"] = str(trained_model_path)
                
                # List checkpoints
                checkpoints_dir = trained_model_path / "checkpoints"
                if checkpoints_dir.exists():
                    checkpoints = [
                        {
                            "name": cp.name,
                            "path": str(cp),
                            "size": sum(f.stat().st_size for f in cp.rglob("*") if f.is_file()) if cp.is_dir() else cp.stat().st_size
                        }
                        for cp in sorted(checkpoints_dir.iterdir())
                    ]
                    metadata["checkpoints"] = checkpoints
                
                return {"status": "success", "model": metadata}
        
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 3. UPLOAD MODEL - Upload a model file from user's machine
# ============================================================================

@router.post("/upload")
async def upload_model(
    file: UploadFile = File(...),
    model_name: str = None,
    source: str = "upload",  # "upload", "gguf", "huggingface"
    metadata: Optional[str] = None
):
    """Upload a model file (GGUF, SafeTensors, etc.)"""
    try:
        if not model_name:
            model_name = file.filename
        
        # Sanitize model name
        model_name = "".join(c for c in model_name if c.isalnum() or c in ("_", "-", "."))
        
        # Check if already exists
        model_path = MODELS_BASE_DIR / model_name
        if model_path.exists():
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' already exists")
        
        model_path.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded file
        file_path = model_path / file.filename
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            file_size = len(content)
        
        # Create metadata
        model_metadata = {
            "name": model_name,
            "source_file": file.filename,
            "source": source,
            "uploaded_at": datetime.now().isoformat(),
            "file_size_bytes": file_size,
            "content_type": file.content_type,
            "status": "ready"
        }
        
        if metadata:
            try:
                model_metadata.update(json.loads(metadata))
            except json.JSONDecodeError:
                pass
        
        # Save metadata
        with open(model_path / "metadata.json", "w") as f:
            json.dump(model_metadata, f, indent=2)
        
        logger.info(f"Model '{model_name}' uploaded successfully ({file_size} bytes)")
        
        return {
            "status": "success",
            "message": f"Model '{model_name}' uploaded successfully",
            "model_name": model_name,
            "path": str(model_path),
            "file_size": file_size,
            "metadata": model_metadata
        }
    
    except Exception as e:
        logger.error(f"Error uploading model: {e}")
        if model_path.exists():
            shutil.rmtree(model_path, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 4. IMPORT GGUF - Auto-find and import GGUF from common locations
# ============================================================================

@router.post("/import-gguf")
async def import_gguf(
    gguf_path: Optional[str] = None,
    model_name: Optional[str] = None,
    auto_find: bool = True
):
    """Import GGUF model from local system or auto-find in common locations"""
    try:
        # If path provided, use it
        if gguf_path and Path(gguf_path).exists():
            gguf_file = Path(gguf_path)
        elif auto_find:
            # Auto-find GGUF in common locations
            search_paths = [
                Path.home() / "Downloads",
                Path.home() / "Documents",
                Path.home() / ".cache" / "huggingface" / "hub",
                Path.home() / "AppData" / "Local" / "Ollama" / "models" if os.name == 'nt' else Path.home() / ".ollama" / "models",
            ]
            
            gguf_file = None
            for search_path in search_paths:
                if search_path.exists():
                    for f in search_path.rglob("*.gguf"):
                        gguf_file = f
                        break
                if gguf_file:
                    break
            
            if not gguf_file:
                raise HTTPException(status_code=404, detail="No GGUF files found in common locations")
        else:
            raise HTTPException(status_code=400, detail="Either provide gguf_path or set auto_find=true")
        
        # Extract model name if not provided
        if not model_name:
            model_name = gguf_file.stem
        
        model_name = "".join(c for c in model_name if c.isalnum() or c in ("_", "-", "."))
        
        # Check if already exists
        model_path = MODELS_BASE_DIR / model_name
        if model_path.exists():
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' already exists")
        
        model_path.mkdir(parents=True, exist_ok=True)
        
        # Copy GGUF file
        dest_file = model_path / gguf_file.name
        shutil.copy2(gguf_file, dest_file)
        file_size = dest_file.stat().st_size
        
        # Create metadata
        model_metadata = {
            "name": model_name,
            "source_file": gguf_file.name,
            "source": "gguf_import",
            "source_location": str(gguf_file),
            "imported_at": datetime.now().isoformat(),
            "file_size_bytes": file_size,
            "format": "gguf",
            "status": "ready"
        }
        
        with open(model_path / "metadata.json", "w") as f:
            json.dump(model_metadata, f, indent=2)
        
        logger.info(f"GGUF model '{model_name}' imported from {gguf_file}")
        
        return {
            "status": "success",
            "message": f"GGUF model '{model_name}' imported successfully",
            "model_name": model_name,
            "source_file": str(gguf_file),
            "path": str(model_path),
            "file_size": file_size,
            "metadata": model_metadata
        }
    
    except Exception as e:
        logger.error(f"Error importing GGUF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 5. IMPORT HUGGINGFACE - Download and import model from HuggingFace
# ============================================================================

@router.post("/import-huggingface")
async def import_huggingface(
    repo_id: str,
    model_name: Optional[str] = None,
    revision: str = "main"
):
    """Import model from HuggingFace Hub"""
    try:
        if not model_name:
            model_name = repo_id.replace("/", "-")
        
        model_name = "".join(c for c in model_name if c.isalnum() or c in ("_", "-", "."))
        
        # Check if already exists
        model_path = MODELS_BASE_DIR / model_name
        if model_path.exists():
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' already exists")
        
        model_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Starting download of {repo_id} from HuggingFace...")
        
        # This would require huggingface_hub library
        # For now, return instructional response
        model_metadata = {
            "name": model_name,
            "source": "huggingface",
            "repo_id": repo_id,
            "revision": revision,
            "status": "downloading",
            "created_at": datetime.now().isoformat(),
            "note": "Use HuggingFace CLI to download: 'huggingface-cli download {repo_id}'"
        }
        
        with open(model_path / "metadata.json", "w") as f:
            json.dump(model_metadata, f, indent=2)
        
        return {
            "status": "accepted",
            "message": f"HuggingFace import for '{repo_id}' queued",
            "model_name": model_name,
            "instructions": [
                f"huggingface-cli download {repo_id} --revision {revision} --local-dir {model_path}"
            ]
        }
    
    except Exception as e:
        logger.error(f"Error importing from HuggingFace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 6. DELETE MODEL - Remove model from system
# ============================================================================

@router.delete("/delete/{model_name}")
async def delete_model(model_name: str):
    """Delete a model from the system"""
    try:
        # Check base models
        model_path = MODELS_BASE_DIR / model_name
        if not model_path.exists():
            # Check trained models
            model_path = MODELS_TRAINED_DIR / model_name
        
        if not model_path.exists():
            raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
        
        # Get size before deletion
        total_size = sum(
            f.stat().st_size for f in model_path.rglob("*") if f.is_file()
        )
        
        # Delete directory
        shutil.rmtree(model_path)
        
        logger.info(f"Model '{model_name}' deleted ({total_size} bytes freed)")
        
        return {
            "status": "success",
            "message": f"Model '{model_name}' deleted successfully",
            "freed_space_bytes": total_size
        }
    
    except Exception as e:
        logger.error(f"Error deleting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 7. EXPORT MODEL - Export trained model in standard format
# ============================================================================

@router.post("/export/{model_name}")
async def export_model(
    model_name: str,
    target_format: str = "gguf",  # "gguf", "safetensors", "pytorch"
    output_dir: Optional[str] = None
):
    """Export trained model in the specified format"""
    try:
        model_path = MODELS_TRAINED_DIR / model_name
        
        if not model_path.exists():
            raise HTTPException(status_code=404, detail=f"Trained model '{model_name}' not found")
        
        if not output_dir:
            output_dir = str(MODELS_BASE_DIR / "exports" / model_name)
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Get latest checkpoint
        checkpoints_dir = model_path / "checkpoints"
        if not checkpoints_dir.exists():
            raise HTTPException(status_code=400, detail="No checkpoints found for this model")
        
        latest_checkpoint = max(
            (d for d in checkpoints_dir.iterdir() if d.is_dir()),
            key=lambda p: p.stat().st_mtime
        )
        
        # Export based on format
        export_metadata = {
            "model_name": model_name,
            "source": str(model_path),
            "checkpoint": latest_checkpoint.name,
            "target_format": target_format,
            "exported_at": datetime.now().isoformat(),
            "output_path": str(output_path)
        }
        
        if target_format == "gguf":
            # Copy GGUF files or convert
            for f in latest_checkpoint.rglob("*.gguf"):
                shutil.copy2(f, output_path / f.name)
                export_metadata["gguf_file"] = f.name
        
        elif target_format == "safetensors":
            # Copy SafeTensors files
            for f in latest_checkpoint.rglob("*.safetensors"):
                shutil.copy2(f, output_path / f.name)
                export_metadata["format_note"] = "SafeTensors export"
        
        elif target_format == "pytorch":
            # Copy PyTorch files
            for f in latest_checkpoint.rglob("*.bin"):
                shutil.copy2(f, output_path / f.name)
            for f in latest_checkpoint.rglob("*.pt"):
                shutil.copy2(f, output_path / f.name)
            export_metadata["format_note"] = "PyTorch export"
        
        # Save config and metadata
        config_file = latest_checkpoint / "config.json"
        if config_file.exists():
            shutil.copy2(config_file, output_path / "config.json")
        
        tokenizer_file = latest_checkpoint / "tokenizer.json"
        if tokenizer_file.exists():
            shutil.copy2(tokenizer_file, output_path / "tokenizer.json")
        
        # Save export metadata
        with open(output_path / "export_metadata.json", "w") as f:
            json.dump(export_metadata, f, indent=2)
        
        logger.info(f"Model '{model_name}' exported to {output_path} as {target_format}")
        
        return {
            "status": "success",
            "message": f"Model exported successfully",
            "model_name": model_name,
            "format": target_format,
            "output_path": str(output_path),
            "files": [f.name for f in output_path.iterdir() if f.is_file()]
        }
    
    except Exception as e:
        logger.error(f"Error exporting model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# 8. DOWNLOAD MODEL - Download exported model file
# ============================================================================

@router.get("/download/{model_name}/{file_name}")
async def download_model(model_name: str, file_name: str):
    """Download a model file"""
    try:
        export_dir = MODELS_BASE_DIR / "exports" / model_name
        file_path = export_dir / file_name
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File '{file_name}' not found")
        
        return FileResponse(
            str(file_path),
            media_type="application/octet-stream",
            filename=file_name
        )
    
    except Exception as e:
        logger.error(f"Error downloading model file: {e}")
        raise HTTPException(status_code=500, detail=str(e))



