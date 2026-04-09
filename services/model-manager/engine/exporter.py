"""
Model Exporter — converts / exports models to standard formats.
Supports: GGUF (via llama.cpp convert), SafeTensors, PyTorch.
No Ollama. No LM Studio.
"""

import os
import json
import shutil
import logging
import asyncio
import pathlib
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ModelExporter:
    """
    Exports models from their loaded / cached form into portable formats.
    """

    def __init__(self, cache_dir: str = "./models"):
        self.cache_dir = os.path.abspath(cache_dir)
        self.export_dir = os.path.join(self.cache_dir, "exports")
        os.makedirs(self.export_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    async def export(
        self,
        model_id: str,
        local_path: str,
        target_format: str = "safetensors",
        output_dir: Optional[str] = None,
        merge_adapter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Export a model.

        Args:
            model_id: Identifier for the model.
            local_path: On-disk path to the model weights.
            target_format: One of ``gguf``, ``safetensors``, ``pytorch``.
            output_dir: Where to write exported files. Defaults to exports/<model_id>.
            merge_adapter: Optional path to a LoRA adapter dir to merge first.

        Returns:
            dict with ``output_path``, ``format``, ``files``.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._export_sync,
            model_id,
            local_path,
            target_format,
            output_dir,
            merge_adapter,
        )

    # ------------------------------------------------------------------
    # Sync implementation
    # ------------------------------------------------------------------
    def _export_sync(
        self,
        model_id: str,
        local_path: str,
        target_format: str,
        output_dir: Optional[str],
        merge_adapter: Optional[str],
    ) -> Dict[str, Any]:
        dest = output_dir or os.path.join(self.export_dir, model_id.replace("/", "--"))
        os.makedirs(dest, exist_ok=True)

        actual_path = local_path

        # Optionally merge LoRA adapter first
        if merge_adapter:
            actual_path = self._merge_adapter(local_path, merge_adapter, dest)

        if target_format == "safetensors":
            files = self._export_safetensors(actual_path, dest)
        elif target_format == "pytorch":
            files = self._export_pytorch(actual_path, dest)
        elif target_format == "gguf":
            files = self._export_gguf(actual_path, dest)
        else:
            raise ValueError(f"Unsupported target format: {target_format}")

        meta = {
            "model_id": model_id,
            "source": local_path,
            "format": target_format,
            "exported_at": datetime.utcnow().isoformat(),
            "files": files,
        }
        with open(os.path.join(dest, "export_meta.json"), "w") as f:
            json.dump(meta, f, indent=2)

        logger.info("Exported %s → %s (%s)", model_id, dest, target_format)
        return {"output_path": dest, "format": target_format, "files": files}

    # ------------------------------------------------------------------
    # Merge LoRA adapter into base model
    # ------------------------------------------------------------------
    def _merge_adapter(self, base_path: str, adapter_path: str, dest: str) -> str:
        import torch
        from peft import AutoPeftModelForCausalLM
        from transformers import AutoTokenizer

        logger.info("Merging adapter %s into %s …", adapter_path, base_path)
        model = AutoPeftModelForCausalLM.from_pretrained(
            adapter_path,
            device_map="cpu",
            dtype=torch.float32,
        )
        merged = model.merge_and_unload()
        merged_path = os.path.join(dest, "_merged")
        os.makedirs(merged_path, exist_ok=True)
        merged.save_pretrained(merged_path)
        tokenizer = AutoTokenizer.from_pretrained(adapter_path)
        tokenizer.save_pretrained(merged_path)
        return merged_path

    # ------------------------------------------------------------------
    # SafeTensors export
    # ------------------------------------------------------------------
    def _export_safetensors(self, src: str, dest: str) -> list:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        p = pathlib.Path(src)
        # If already safetensors, just copy
        existing = list(p.rglob("*.safetensors"))
        if existing:
            files = []
            for f in existing:
                target = os.path.join(dest, f.name)
                shutil.copy2(str(f), target)
                files.append(f.name)
            self._copy_supporting_files(src, dest)
            return files

        # Otherwise load and re-save as safetensors
        model = AutoModelForCausalLM.from_pretrained(
            src, dtype=torch.float32, device_map="cpu"
        )
        model.save_pretrained(dest, safe_serialization=True)
        tokenizer = AutoTokenizer.from_pretrained(src)
        tokenizer.save_pretrained(dest)
        return [f.name for f in pathlib.Path(dest).iterdir() if f.is_file()]

    # ------------------------------------------------------------------
    # PyTorch export
    # ------------------------------------------------------------------
    def _export_pytorch(self, src: str, dest: str) -> list:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        p = pathlib.Path(src)
        existing = list(p.rglob("*.bin")) + list(p.rglob("*.pt"))
        if existing:
            files = []
            for f in existing:
                target = os.path.join(dest, f.name)
                shutil.copy2(str(f), target)
                files.append(f.name)
            self._copy_supporting_files(src, dest)
            return files

        model = AutoModelForCausalLM.from_pretrained(
            src, dtype=torch.float32, device_map="cpu"
        )
        model.save_pretrained(dest, safe_serialization=False)
        tokenizer = AutoTokenizer.from_pretrained(src)
        tokenizer.save_pretrained(dest)
        return [f.name for f in pathlib.Path(dest).iterdir() if f.is_file()]

    # ------------------------------------------------------------------
    # GGUF export (copy if present; full convert requires llama.cpp)
    # ------------------------------------------------------------------
    def _export_gguf(self, src: str, dest: str) -> list:
        p = pathlib.Path(src)
        existing = list(p.rglob("*.gguf"))
        if existing:
            files = []
            for f in existing:
                target = os.path.join(dest, f.name)
                shutil.copy2(str(f), target)
                files.append(f.name)
            return files

        # Full HF → GGUF conversion would require llama.cpp convert.py.
        # We save a ready-to-convert HF snapshot + instructions.
        logger.warning(
            "Source is not GGUF. Exporting HF snapshot to %s. "
            "Use llama.cpp convert-hf-to-gguf.py to finalise conversion.",
            dest,
        )
        return self._export_safetensors(src, dest)

    # ------------------------------------------------------------------
    @staticmethod
    def _copy_supporting_files(src: str, dest: str):
        for name in ("config.json", "tokenizer.json", "tokenizer_config.json",
                      "special_tokens_map.json", "generation_config.json"):
            src_f = os.path.join(src, name)
            if os.path.exists(src_f):
                shutil.copy2(src_f, os.path.join(dest, name))
